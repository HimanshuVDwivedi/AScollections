/**
 * AS JEWELS — STORE BACKEND (Google Apps Script, free)
 * ----------------------------------------------------
 * Lives inside your "AS Jewels Store" Google Sheet and fills its tabs:
 *   Products   – your catalogue (you edit it). The website reads it from here; nothing is published.
 *   Orders     – every order, with Order Status and Payment Status.
 *   Customers  – everyone who signs in with Google, plus the phone/address they save.
 *   Activity   – a running log: sign-ins, profile updates, add-to-bag, checkouts, payments.
 *   Settings   – your UPI ID, UPI name and WhatsApp number for payment proof (created automatically).
 *   Dashboard  – live totals (formulas only, nothing written by this script).
 *
 * What it guarantees:
 *   - Prices are re-calculated from the Products tab, so nobody can change a price in their browser.
 *   - Razorpay payments are verified with your SECRET key (kept in Script Properties, never on GitHub).
 *   - Google sign-ins are checked with Google before anything is saved.
 *
 * Setup (once):
 *   1. In the Sheet: Extensions → Apps Script → paste this whole file → Save.
 *   2. Project Settings (gear) → Script Properties → add:
 *        GOOGLE_CLIENT_ID     your Google OAuth Client ID (same as googleClientId in config.js)
 *        RAZORPAY_KEY_ID      rzp_test_xxxxx  (later rzp_live_xxxxx)   — add when you set up Razorpay
 *        RAZORPAY_KEY_SECRET  your Razorpay secret                     — add when you set up Razorpay
 *   3. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone → Deploy.
 *   4. Copy the Web app URL into orderApiUrl in js/config.js.
 *   After ANY change here: Deploy → Manage deployments → Edit → Version: New version → Deploy.
 */

// Keep these the same as "coupons", "freeShippingAbove" and "shippingFee" in js/config.js
const COUPONS = {
  WELCOME10: { type: 'percent', value: 10 },
  FLAT200:   { type: 'flat', value: 200, minOrder: 1999 }
};
const FREE_SHIPPING_ABOVE = 999;
const SHIPPING_FEE = 79;

const ORDER_HEADERS = ['Date', 'Order No', 'Order Status', 'Payment Status', 'Payment Method', 'Amount (₹)', 'Items',
  'Coupon', 'Customer Name', 'Phone', 'Email', 'Delivery Address', 'Gift Note', 'Razorpay Order ID', 'Razorpay Payment ID', 'Paid At'];
const CUSTOMER_HEADERS = ['First Sign-in', 'Last Sign-in', 'Name', 'Email', 'Photo', 'Sign-ins', 'Google ID',
  'Phone', 'Address', 'Profile Updated', 'Birthday'];
const ACTIVITY_HEADERS = ['Time', 'Event', 'Customer', 'Order No', 'Amount (₹)', 'Details'];
const TRACKED_EVENTS = ['Added to bag', 'Added to wishlist', 'Viewed checkout', 'Sent UPI proof on WhatsApp'];
const ORDER_STATUSES = ['Awaiting payment', 'New – verify UPI payment', 'New – confirm by call', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
const PAYMENT_STATUSES = ['Pending', 'Awaiting UPI proof', 'Pending (COD)', 'Paid', 'Failed', 'Cancelled by customer', 'Refunded'];
const SETUP_VERSION = '2';

/* ---------- Entry points ---------- */
function doPost(e) {
  try {
    ensureSetup();
    const body = JSON.parse(e.postData.contents);
    switch (body.action) {
      case 'createOrder':   return json(createOrder(body));
      case 'verify':        return json(verifyPayment(body));
      case 'paymentFailed': return json(markPaymentFailed(body));
      case 'cod':           return json({ ok: false, error: 'Cash on Delivery is not available. Please pay online or by UPI.' }); // prepaid only
      case 'upiOrder':      return json(createUpiOrder(body));
      case 'login':         return json(saveCustomer(body));
      case 'profile':       return json(saveProfile(body));
      case 'track':         return json(trackEvent(body));
    }
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: err.message });
  }
}

// GET ?action=products → the live product list for the website (cached for 5 minutes)
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action === 'products') {
    ensureSetup();
    const cache = CacheService.getScriptCache();
    let out = cache.get('products');
    if (!out) { out = JSON.stringify({ ok: true, products: listProducts(), settings: publicSettings() }); try { cache.put('products', out, 300); } catch (err) {} }
    return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
  }
  return json({ ok: true, message: 'AS Jewels order API is running' });
}

// Run this from the editor after editing products if you want the website to update immediately.
function clearProductCache() { CacheService.getScriptCache().remove('products'); }

/* ---------- Products ---------- */
function productRows() {
  const sh = SpreadsheetApp.getActive().getSheetByName('Products');
  if (!sh) throw new Error('Add a sheet named "Products"');
  const rows = sh.getDataRange().getValues();
  const head = rows.shift().map(h => String(h).trim().toLowerCase());
  return { sh: sh, head: head, rows: rows, col: n => head.indexOf(n) };
}

function listProducts() {
  const t = productRows(), c = t.col, list = [];
  t.rows.forEach(r => {
    const id = String(r[c('id')] || '').trim();
    if (!id || !r[c('name')]) return;
    if (c('active') > -1 && String(r[c('active')]).trim().toLowerCase() === 'no') return;
    const val = n => (c(n) > -1 ? r[c(n)] : '');
    list.push({
      id: id, name: String(val('name')), category: String(val('category')).trim().toLowerCase(),
      price: Number(val('price')) || 0, mrp: Number(val('mrp')) || Number(val('price')) || 0,
      images: String(val('images')).split('|').map(s => s.trim()).filter(String),
      metal: String(val('metal')), occasion: String(val('occasion')).trim().toLowerCase(),
      tags: String(val('tags')).toLowerCase().split(/[|,]/).map(s => s.trim()).filter(String),
      stock: val('stock') === '' ? 99 : Number(val('stock')), description: String(val('description'))
    });
  });
  return list;
}

function readProducts() {
  const out = {};
  listProducts().forEach(p => { out[p.id] = { id: p.id, name: p.name, price: p.price, stock: p.stock }; });
  return out;
}

/* ---------- Order maths (trusted, from the sheet) ---------- */
function priceCart(items, couponCode) {
  const products = readProducts();
  if (!Array.isArray(items) || !items.length) throw new Error('Your bag is empty');
  let subtotal = 0;
  const lines = items.map(it => {
    const p = products[String(it.id)];
    const qty = Math.max(1, Math.min(10, parseInt(it.qty, 10) || 1));
    if (!p) throw new Error('A product in your bag is no longer available');
    if (p.stock < qty) throw new Error('Only ' + p.stock + ' left of ' + p.name);
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

/* ---------- Razorpay ---------- */
function createOrder(body) {
  const keys = razorpayKeys();
  const keyId = keys.id, secret = keys.secret;
  if (!keyId || !secret) throw new Error('Online payment is not set up yet. Please choose Cash on Delivery.');

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
  if (res.getResponseCode() !== 200) {
    console.error('Razorpay order failed', res.getResponseCode(), res.getContentText());
    if (res.getResponseCode() === 401) throw new Error('Online payment is unavailable right now. Please use UPI or Cash on Delivery.');
    throw new Error(rzp.error ? rzp.error.description : 'Razorpay error');
  }

  logOrder(orderNumber, 'Awaiting payment', 'Pending', 'Online (Razorpay)', priced, body, rzp.id);
  logActivity('Checkout started', (body.customer || {}).email || (body.customer || {}).phone, orderNumber, priced.total, 'Online payment');
  return { ok: true, orderNumber: orderNumber, razorpayOrderId: rzp.id, amount: rzp.amount, keyId: keyId };
}

// Reads the Razorpay keys from Script Properties, ignoring stray spaces or line breaks.
function razorpayKeys() {
  const props = PropertiesService.getScriptProperties();
  const clean = v => String(v || '').replace(/\s+/g, '');
  return { id: clean(props.getProperty('RAZORPAY_KEY_ID')), secret: clean(props.getProperty('RAZORPAY_KEY_SECRET')) };
}

// Run this from the editor (choose testRazorpay → Run) to check your keys. Look at the Execution log.
function testRazorpay() {
  const k = razorpayKeys();
  if (!k.id || !k.secret) { console.log('❌ Missing: add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Project Settings → Script Properties.'); return; }
  console.log('Key ID in use: ' + k.id + '  (' + (k.id.indexOf('rzp_test_') === 0 ? 'TEST mode' : k.id.indexOf('rzp_live_') === 0 ? 'LIVE mode' : 'does not start with rzp_test_ or rzp_live_ — check it') + ')');
  console.log('Secret length: ' + k.secret.length + ' characters');
  const res = UrlFetchApp.fetch('https://api.razorpay.com/v1/orders?count=1', {
    headers: { Authorization: 'Basic ' + Utilities.base64Encode(k.id + ':' + k.secret) }, muteHttpExceptions: true });
  if (res.getResponseCode() === 200) console.log('✅ Keys work. Razorpay accepted them.');
  else console.log('❌ Razorpay said ' + res.getResponseCode() + ': ' + res.getContentText() + '\n→ The Key ID and Key Secret are not a matching pair. Regenerate the key in Razorpay (same mode) and paste both again.');
}

function verifyPayment(body) {
  const secret = razorpayKeys().secret;
  const expected = toHex(Utilities.computeHmacSha256Signature(body.razorpay_order_id + '|' + body.razorpay_payment_id, secret));
  if (expected !== String(body.razorpay_signature)) {
    logActivity('Payment failed', '', '', '', 'Signature check failed for ' + body.razorpay_order_id);
    return { ok: false, error: 'Payment could not be verified' };
  }
  const o = findOrderByRazorpayId(body.razorpay_order_id);
  if (!o) return { ok: false, error: 'Order not found' };
  if (o.get('Payment Status') === 'Paid') return { ok: true, orderNumber: o.get('Order No') }; // already done
  o.set('Order Status', 'Confirmed');
  o.set('Payment Status', 'Paid');
  o.set('Razorpay Payment ID', body.razorpay_payment_id);
  o.set('Paid At', new Date());
  reduceStock(o.get('Items'));
  logActivity('Payment received', o.get('Email') || o.get('Phone'), o.get('Order No'), o.get('Amount (₹)'), 'Razorpay ' + body.razorpay_payment_id);
  return { ok: true, orderNumber: o.get('Order No') };
}

function markPaymentFailed(body) {
  const o = findOrderByRazorpayId(String(body.razorpay_order_id || ''));
  if (!o || o.get('Payment Status') === 'Paid') return { ok: true };
  o.set('Payment Status', body.cancelled ? 'Cancelled by customer' : 'Failed');
  logActivity(body.cancelled ? 'Payment cancelled' : 'Payment failed', o.get('Email') || o.get('Phone'), o.get('Order No'), o.get('Amount (₹)'),
    String(body.reason || '').slice(0, 200));
  return { ok: true };
}

function createCodOrder(body) {
  const priced = priceCart(body.items, body.coupon);
  const orderNumber = newOrderNumber();
  logOrder(orderNumber, 'New – confirm by call', 'Pending (COD)', 'Cash on Delivery', priced, body, '');
  reduceStock(priced.summary);
  logActivity('COD order placed', (body.customer || {}).email || (body.customer || {}).phone, orderNumber, priced.total, '');
  return { ok: true, orderNumber: orderNumber, amount: priced.total * 100 };
}

/* ---------- UPI QR payments (customer pays, then sends proof on WhatsApp) ---------- */
function createUpiOrder(body) {
  const s = publicSettings();
  if (!s.upiId) throw new Error('UPI payment is not set up yet. Please choose Cash on Delivery.');
  const priced = priceCart(body.items, body.coupon);
  const orderNumber = newOrderNumber();
  logOrder(orderNumber, 'New – verify UPI payment', 'Awaiting UPI proof', 'UPI (QR)', priced, body, '');
  reduceStock(priced.summary);
  logActivity('UPI order placed', (body.customer || {}).email || (body.customer || {}).phone, orderNumber, priced.total, 'Waiting for payment proof on WhatsApp');
  return { ok: true, orderNumber: orderNumber, amount: priced.total * 100, upiId: s.upiId, upiName: s.upiName, whatsapp: s.whatsapp };
}

/* ---------- Settings tab (you edit the values in column B) ---------- */
const SETTINGS_ROWS = [
  ['Setting', 'Value', 'What it is for'],
  ['UPI ID', '', 'Your UPI ID for the checkout QR, e.g. asjewels@okaxis. A business/merchant UPI ID works best.'],
  ['UPI name', 'AS Jewels', 'Name customers see in their UPI app.'],
  ['WhatsApp number for payment proof', '', '91 + 10-digit number, no spaces. Leave empty to use the number in config.js.']
];
function publicSettings() {
  const sh = SpreadsheetApp.getActive().getSheetByName('Settings');
  const out = { upiId: '', upiName: 'AS Jewels', whatsapp: '' };
  if (!sh) return out;
  sh.getDataRange().getValues().forEach(r => {
    const k = String(r[0]).trim(), v = String(r[1]).trim();
    if (k === 'UPI ID') out.upiId = v.replace(/\s/g, '');
    if (k === 'UPI name' && v) out.upiName = v;
    if (k === 'WhatsApp number for payment proof') out.whatsapp = v.replace(/\D/g, '');
  });
  return out;
}

/* ---------- One-time sheet upgrade (runs by itself; or run setupSheet from the editor) ---------- */
function ensureSetup() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('SETUP_VERSION') === SETUP_VERSION) return;
  try { setupSheet(); props.setProperty('SETUP_VERSION', SETUP_VERSION); } catch (err) { console.error('Setup failed', err); }
}
function setupSheet() {
  const ss = SpreadsheetApp.getActive();
  // Settings tab
  let st = ss.getSheetByName('Settings');
  if (!st) {
    st = ss.insertSheet('Settings');
    st.getRange(1, 1, SETTINGS_ROWS.length, 3).setValues(SETTINGS_ROWS);
    st.getRange(1, 1, 1, 3).setFontWeight('bold').setFontColor('#ffffff').setBackground('#861a38');
    st.getRange(2, 2, SETTINGS_ROWS.length - 1, 1).setBackground('#fff4d6');
    st.setColumnWidth(1, 260); st.setColumnWidth(2, 260); st.setColumnWidth(3, 520); st.setFrozenRows(1);
    st.setTabColor('#3d9a5b');
  }
  // Orders: dropdowns with the UPI statuses + colours
  const o = tab('Orders', ORDER_HEADERS);
  const head = o.getRange(1, 1, 1, o.getLastColumn()).getValues()[0].map(String);
  const oc = head.indexOf('Order Status') + 1, pc = head.indexOf('Payment Status') + 1;
  if (oc > 0) o.getRange(2, oc, 4999, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(ORDER_STATUSES, true).setAllowInvalid(true).build());
  if (pc > 0) o.getRange(2, pc, 4999, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(PAYMENT_STATUSES, true).setAllowInvalid(true).build());
  const rules = o.getConditionalFormatRules();
  if (pc > 0) rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Awaiting UPI proof').setBackground('#fff4d6').setFontColor('#7a5a14').setBold(true).setRanges([o.getRange(2, pc, 4999, 1)]).build());
  if (oc > 0) rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('New – verify UPI payment').setBackground('#ffe0e6').setFontColor('#861a38').setBold(true).setRanges([o.getRange(2, oc, 4999, 1)]).build());
  o.setConditionalFormatRules(rules);
  // Dashboard: UPI figures
  const d = ss.getSheetByName('Dashboard');
  if (d && d.getRange('A22').getValue() === '') {
    d.getRange('A22').setValue('UPI PAYMENTS').setFontWeight('bold').setFontColor('#3d9a5b').setFontSize(9);
    d.getRange('A23:B24').setValues([
      ['UPI payments to verify', '=COUNTIFS(Orders!D:D,"Awaiting UPI proof")'],
      ['UPI value awaiting verification (₹)', '=SUMIFS(Orders!F:F,Orders!D:D,"Awaiting UPI proof")']]);
    d.getRange('B23:B24').setFontWeight('bold').setFontColor('#861a38').setFontSize(12);
    d.getRange('B24').setNumberFormat('₹#,##0');
  }
}

/* ---------- Customers (Google Sign-In + My Account) ---------- */
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

function findCustomerRow(sh, email) {
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][3]).toLowerCase() === String(email).toLowerCase()) return { row: i + 1, values: data[i] };
  }
  return null;
}

function saveCustomer(body) {
  const t = verifyGoogle(body.credential);
  const sh = tab('Customers', CUSTOMER_HEADERS), now = new Date(), found = findCustomerRow(sh, t.email);
  if (found) {
    sh.getRange(found.row, 2, 1, 6).setValues([[now, t.name || found.values[2], t.email, t.picture || '', (Number(found.values[5]) || 0) + 1, t.sub]]);
    logActivity('Signed in', t.email, '', '', 'Returning customer');
    return { ok: true, returning: true };
  }
  sh.appendRow([now, now, t.name || '', t.email, t.picture || '', 1, t.sub, '', '', '', '']);
  logActivity('New customer', t.email, '', '', t.name || '');
  return { ok: true, returning: false };
}

function saveProfile(body) {
  const t = verifyGoogle(body.credential);
  const p = body.profile || {};
  const sh = tab('Customers', CUSTOMER_HEADERS), now = new Date();
  let found = findCustomerRow(sh, t.email);
  if (!found) { saveCustomer(body); found = findCustomerRow(sh, t.email); }
  const phone = String(p.phone || '').replace(/\D/g, '').slice(0, 10);
  const birthday = /^\d{4}-\d{2}-\d{2}$/.test(String(p.birthday || '')) ? p.birthday : '';
  sh.getRange(found.row, 3).setValue(String(p.name || t.name || '').slice(0, 100));
  sh.getRange(found.row, 8, 1, 4).setValues([[phone ? "'" + phone : '', String(p.address || '').slice(0, 300), now, birthday]]);
  logActivity('Profile updated', t.email, '', '', '');
  return { ok: true };
}

/* ---------- Activity log ---------- */
// Small events sent by the website (add to bag, wishlist, checkout page). Only known event names are accepted.
function trackEvent(body) {
  const event = String(body.event || '');
  if (TRACKED_EVENTS.indexOf(event) < 0) return { ok: false, error: 'Unknown event' };
  logActivity(event, String(body.customer || 'Guest').slice(0, 120), '', body.amount ? Number(body.amount) || '' : '', String(body.details || '').slice(0, 200));
  return { ok: true };
}

function logActivity(event, customer, orderNo, amount, details) {
  try { tab('Activity', ACTIVITY_HEADERS).appendRow([new Date(), event, customer || 'Guest', orderNo || '', amount === undefined ? '' : amount, details || '']); }
  catch (err) { console.error('Activity log failed', err); }
}

/* ---------- Sheet helpers ---------- */
// Returns a tab, creating it with headers if it doesn't exist yet.
function tab(name, headers) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}

function logOrder(orderNumber, orderStatus, paymentStatus, method, priced, body, rzpOrderId) {
  const c = body.customer || {};
  const sh = tab('Orders', ORDER_HEADERS);
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  const values = {
    'Date': new Date(), 'Order No': orderNumber, 'Order Status': orderStatus, 'Payment Status': paymentStatus,
    'Payment Method': method, 'Amount (₹)': priced.total, 'Items': priced.summary, 'Coupon': body.coupon || '',
    'Customer Name': c.name || '', 'Phone': c.phone ? "'" + c.phone : '', 'Email': c.email || '',
    'Delivery Address': c.address || '', 'Gift Note': c.note || '', 'Razorpay Order ID': rzpOrderId || '',
    'Razorpay Payment ID': '', 'Paid At': ''
  };
  sh.appendRow(head.map(h => (h in values ? values[h] : '')));
}

// Finds an order row by its Razorpay order ID and lets you read/write cells by header name.
function findOrderByRazorpayId(rzpId) {
  if (!rzpId) return null;
  const sh = tab('Orders', ORDER_HEADERS);
  const data = sh.getDataRange().getValues();
  const head = data[0].map(String), col = n => head.indexOf(n);
  const idCol = col('Razorpay Order ID');
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idCol]) === rzpId) {
      const row = i + 1;
      return {
        get: n => (col(n) > -1 ? data[i][col(n)] : ''),
        set: (n, v) => { if (col(n) > -1) sh.getRange(row, col(n) + 1).setValue(v); }
      };
    }
  }
  return null;
}

function reduceStock(summary) {
  const t = productRows(), idCol = t.col('id'), stockCol = t.col('stock');
  if (stockCol < 0) return;
  String(summary).split('\n').forEach(line => {
    const m = line.match(/\(([^)]+)\) × (\d+)$/);
    if (!m) return;
    for (let i = 0; i < t.rows.length; i++) {
      if (String(t.rows[i][idCol]) === m[1] && t.rows[i][stockCol] !== '') {
        t.sh.getRange(i + 2, stockCol + 1).setValue(Math.max(0, Number(t.rows[i][stockCol]) - Number(m[2])));
      }
    }
  });
  clearProductCache();
}

function newOrderNumber() {
  return 'ASJ-' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);
}
function toHex(bytes) { return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join(''); }
function json(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
