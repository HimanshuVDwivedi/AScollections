/**
 * AS JEWELS — FREE ORDER BACKEND (Google Apps Script)
 * ----------------------------------------------------
 * What it does:
 *   1. Re-calculates the order total from YOUR "Products" sheet (customers can't change prices).
 *   2. Creates a Razorpay order using your SECRET key (kept here, never on the website).
 *   3. Verifies the payment signature after the customer pays.
 *   4. Writes every order into the "Orders" sheet. Cash-on-Delivery orders too.
 *
 * Setup (once):
 *   - Open your Google Sheet → Extensions → Apps Script → paste this file.
 *   - Project Settings (gear) → Script Properties → add:
 *       RAZORPAY_KEY_ID      rzp_test_xxxxx   (later rzp_live_xxxxx)
 *       RAZORPAY_KEY_SECRET  your secret key
 *       GOOGLE_CLIENT_ID     your Google OAuth Client ID (same as googleClientId in config.js)
 *   5. Customers who sign in with Google are listed in the "Customers" tab automatically,
 *      with the phone and address they save on their My Profile page.
 *   - Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone → Deploy.
 *   - Copy the Web app URL into orderApiUrl in js/config.js.
 *   - After ANY change here: Deploy → Manage deployments → Edit → Version: New version → Deploy.
 */

// Keep these the same as "coupons" in js/config.js
const COUPONS = {
  WELCOME10: { type: 'percent', value: 10 },
  FLAT200:   { type: 'flat', value: 200, minOrder: 1999 }
};
const FREE_SHIPPING_ABOVE = 999;
const SHIPPING_FEE = 79;

const ORDER_HEADERS = ['Date', 'Order No', 'Status', 'Payment', 'Amount (₹)', 'Items', 'Coupon',
  'Name', 'Phone', 'Email', 'Address', 'Gift note', 'Razorpay Order ID', 'Razorpay Payment ID'];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'createOrder') return json(createOrder(body));
    if (body.action === 'verify') return json(verifyPayment(body));
    if (body.action === 'cod') return json(createCodOrder(body));
    if (body.action === 'login') return json(saveCustomer(body));
    if (body.action === 'profile') return json(saveProfile(body));
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'Server error: ' + err.message });
  }
}

function doGet() { return json({ ok: true, message: 'AS Jewels order API is running' }); }

/* ---------- Order maths (trusted, from the sheet) ---------- */
function priceCart(items, couponCode) {
  const products = readProducts();
  if (!Array.isArray(items) || !items.length) throw new Error('Your bag is empty');
  let subtotal = 0;
  const lines = items.map(it => {
    const p = products[String(it.id)];
    const qty = Math.max(1, Math.min(10, parseInt(it.qty, 10) || 1));
    if (!p) throw new Error('A product in your bag is no longer available');
    if (p.stock !== null && p.stock < qty) throw new Error('Only ' + p.stock + ' left of ' + p.name);
    subtotal += p.price * qty;
    return p.name + ' (' + p.id + ') × ' + qty;
  });
  let discount = 0;
  const c = COUPONS[String(couponCode || '').toUpperCase()];
  if (c && !(c.minOrder && subtotal < c.minOrder)) {
    discount = c.type === 'percent' ? Math.round(subtotal * c.value / 100) : Math.min(c.value, subtotal);
  }
  const after = subtotal - discount;
  const shipping = after >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
  return { total: after + shipping, summary: lines.join('\n') };
}

function readProducts() {
  const sh = SpreadsheetApp.getActive().getSheetByName('Products');
  if (!sh) throw new Error('Add a sheet named "Products"');
  const rows = sh.getDataRange().getValues();
  const head = rows.shift().map(h => String(h).trim().toLowerCase());
  const col = n => head.indexOf(n);
  const out = {};
  rows.forEach(r => {
    const id = String(r[col('id')] || '').trim();
    if (!id) return;
    if (col('active') > -1 && String(r[col('active')]).toLowerCase() === 'no') return;
    const stock = col('stock') > -1 && r[col('stock')] !== '' ? Number(r[col('stock')]) : null;
    out[id] = { id: id, name: String(r[col('name')]), price: Number(r[col('price')]), stock: stock };
  });
  return out;
}

/* ---------- Razorpay ---------- */
function createOrder(body) {
  const props = PropertiesService.getScriptProperties();
  const keyId = props.getProperty('RAZORPAY_KEY_ID');
  const secret = props.getProperty('RAZORPAY_KEY_SECRET');
  if (!keyId || !secret) throw new Error('Razorpay keys are not set in Script Properties');

  const priced = priceCart(body.items, body.coupon);
  const orderNumber = newOrderNumber();
  const res = UrlFetchApp.fetch('https://api.razorpay.com/v1/orders', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Basic ' + Utilities.base64Encode(keyId + ':' + secret) },
    payload: JSON.stringify({ amount: priced.total * 100, currency: 'INR', receipt: orderNumber, notes: { order_number: orderNumber } }),
    muteHttpExceptions: true
  });
  const rzp = JSON.parse(res.getContentText());
  if (res.getResponseCode() !== 200) throw new Error(rzp.error ? rzp.error.description : 'Razorpay error');

  logOrder(orderNumber, 'Awaiting payment', 'Online', priced, body, rzp.id, '');
  return { ok: true, orderNumber: orderNumber, razorpayOrderId: rzp.id, amount: rzp.amount, keyId: keyId };
}

function verifyPayment(body) {
  const secret = PropertiesService.getScriptProperties().getProperty('RAZORPAY_KEY_SECRET');
  const expected = toHex(Utilities.computeHmacSha256Signature(
    body.razorpay_order_id + '|' + body.razorpay_payment_id, secret));
  if (expected !== String(body.razorpay_signature)) return { ok: false, error: 'Payment could not be verified' };

  const sh = ordersSheet();
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][12] === body.razorpay_order_id) {
      sh.getRange(i + 1, 3).setValue('PAID');
      sh.getRange(i + 1, 14).setValue(body.razorpay_payment_id);
      reduceStock(String(data[i][5]));
      return { ok: true, orderNumber: data[i][1] };
    }
  }
  return { ok: false, error: 'Order not found' };
}

function createCodOrder(body) {
  const priced = priceCart(body.items, body.coupon);
  const orderNumber = newOrderNumber();
  logOrder(orderNumber, 'COD - to confirm', 'Cash on Delivery', priced, body, '', '');
  reduceStock(priced.summary);
  return { ok: true, orderNumber: orderNumber, amount: priced.total * 100 };
}

/* ---------- Customers (Google Sign-In + My Profile) ---------- */
// Each customer is one row in the "Customers" tab, matched by email.
const CUSTOMER_HEADERS = ['First sign-in', 'Last sign-in', 'Name', 'Email', 'Photo', 'Sign-ins', 'Google ID', 'Phone', 'Address', 'Profile updated'];

// Asks Google to confirm the sign-in token is real and was issued for this website.
function verifyGoogle(credential) {
  if (!credential) throw new Error('Missing sign-in token');
  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('Sign-in expired. Please sign in again.');
  const t = JSON.parse(res.getContentText());
  const clientId = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
  if (clientId && t.aud !== clientId) throw new Error('Sign-in was not for this website');
  if (String(t.email_verified) !== 'true') throw new Error('Email not verified');
  return t;
}

function customersSheet() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('Customers');
  if (!sh) { sh = ss.insertSheet('Customers'); sh.setFrozenRows(1); }
  sh.getRange(1, 1, 1, CUSTOMER_HEADERS.length).setValues([CUSTOMER_HEADERS]); // keeps headers up to date
  return sh;
}

function findCustomerRow(sh, email) {
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][3]).toLowerCase() === String(email).toLowerCase()) return { row: i + 1, values: data[i] };
  }
  return null;
}

function saveCustomer(body) {
  const t = verifyGoogle(body.credential);
  const sh = customersSheet(), now = new Date(), found = findCustomerRow(sh, t.email);
  if (found) {
    sh.getRange(found.row, 2, 1, 6).setValues([[now, t.name || found.values[2], t.email, t.picture || '', (Number(found.values[5]) || 0) + 1, t.sub]]);
    return { ok: true, returning: true };
  }
  sh.appendRow([now, now, t.name || '', t.email, t.picture || '', 1, t.sub, '', '', '']);
  return { ok: true, returning: false };
}

function saveProfile(body) {
  const t = verifyGoogle(body.credential);
  const p = body.profile || {};
  const phone = String(p.phone || '').replace(/\D/g, '').slice(0, 10);
  const sh = customersSheet(), now = new Date();
  let found = findCustomerRow(sh, t.email);
  if (!found) { saveCustomer(body); found = findCustomerRow(sh, t.email); }
  sh.getRange(found.row, 3).setValue(String(p.name || t.name || '').slice(0, 100));
  sh.getRange(found.row, 8, 1, 3).setValues([["'" + phone, String(p.address || '').slice(0, 300), now]]);
  return { ok: true };
}

/* ---------- Sheet helpers ---------- */
function ordersSheet() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('Orders');
  if (!sh) { sh = ss.insertSheet('Orders'); sh.appendRow(ORDER_HEADERS); sh.setFrozenRows(1); }
  return sh;
}
function logOrder(orderNumber, status, method, priced, body, rzpOrderId, paymentId) {
  const c = body.customer || {};
  ordersSheet().appendRow([new Date(), orderNumber, status, method, priced.total, priced.summary,
    body.coupon || '', c.name, "'" + (c.phone || ''), c.email, c.address, c.note || '', rzpOrderId, paymentId]);
}
function reduceStock(summary) {
  const sh = SpreadsheetApp.getActive().getSheetByName('Products');
  const rows = sh.getDataRange().getValues();
  const head = rows[0].map(h => String(h).trim().toLowerCase());
  const idCol = head.indexOf('id'), stockCol = head.indexOf('stock');
  if (stockCol < 0) return;
  String(summary).split('\n').forEach(line => {
    const m = line.match(/\(([^)]+)\) × (\d+)$/);
    if (!m) return;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][idCol]) === m[1] && rows[i][stockCol] !== '') {
        sh.getRange(i + 1, stockCol + 1).setValue(Math.max(0, Number(rows[i][stockCol]) - Number(m[2])));
      }
    }
  });
}
function newOrderNumber() {
  return 'ASJ-' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);
}
function toHex(bytes) { return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join(''); }
function json(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
