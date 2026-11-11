# AS Jewels — Website Files (asjewels.com)

A complete jewellery store in plain **HTML, CSS and JavaScript**. No coding framework, no monthly platform fee.
It works on **GitHub Pages (free)** today and on **your own hosting + asjewels.com** later — same files.

---

## 1. What's inside

```
asjewels/
├── index.html                    ← the page shell (header, footer, cart, wishlist)
├── css/styles.css                ← all the design (colours at the top in :root)
├── js/config.js                  ← ★ YOUR SETTINGS — the only file you must edit
├── js/products.js                ← ★ YOUR PRODUCTS (if you don't use Google Sheets)
├── js/app.js                     ← the shop engine (no need to edit)
├── images/                       ← put your product photos here
├── apps-script/Code.gs           ← free payment + order backend (Google Apps Script)
└── products-sheet-template.csv   ← import this into Google Sheets to start your product list
```

**Features:** home page with rotating hero + sale countdown, category circles, bestsellers with filter chips,
shop page with filters/sort/search, product page with gallery + zoom, wishlist (♥), cart drawer with
free-shipping progress bar, coupons, checkout (address, Online / COD), Razorpay payment, Google sign-in,
WhatsApp chat button, order confirmation with confetti, policy pages (needed for Razorpay approval),
mobile-friendly throughout.

---

## 2. Try it on your computer (2 minutes)

1. Unzip the folder.
2. Double-click `index.html` — it opens in your browser.
3. Click around: add to bag, apply code **WELCOME10**, place an order. It runs in **Demo mode** (no real payment) until step 6.

> Google Sign-In and loading from Google Sheets need the site to be on a real web address (step 5). Everything else works locally.

---

## 3. Edit your settings — `js/config.js`

Open it in any text editor (Notepad, VS Code). Change:
- `whatsappNumber` → e.g. `"919876543210"` (91 + your 10-digit number)
- `supportEmail`, `supportPhone`, `businessAddress`, `instagram`, `facebook`
- `announcements` (the scrolling offer bar), `freeShippingAbove`, `shippingFee`
- `coupons` (also change the same list in `apps-script/Code.gs`)
- `saleEndsAt` (countdown end date) — or `""` to hide it

To change colours: open `css/styles.css` and edit the values at the very top (`--plum`, `--rose`, `--gold`…).

---

## 4. Add your products — choose ONE way

### Way A — Google Sheet (recommended: update prices from your phone, no re-upload)
1. Go to sheets.google.com → **Blank sheet**. Rename the tab at the bottom to **Products**.
2. **File → Import → Upload** `products-sheet-template.csv` → *Replace current sheet*. Rename the tab back to **Products** if needed.
3. Columns:
   | Column | What to type |
   |---|---|
   | id | unique code, e.g. R001 |
   | name | product name |
   | category | rings, earrings, necklaces, pendants, bracelets, bangles, anklets, sets |
   | price | **sale price** (number only) |
   | mrp | original price (shown crossed out) |
   | images | image links separated by `\|` — first one is the main photo |
   | metal | e.g. 925 Silver |
   | occasion | everyday, office, party, wedding, gifting |
   | tags | bestseller, new, trending (separate with `\|`) |
   | stock | quantity (0 = Sold out) |
   | active | yes / no (no = hidden) |
   | description | a short paragraph |
4. **Photos:** upload to Google Drive → right-click → Share → *Anyone with the link* → Copy link → paste in the `images` column. The site converts Drive links automatically. (Or upload photos into the `images/` folder on GitHub and write `images/r001-1.jpg`.)
5. **File → Share → Publish to web** → choose **Products** + **Comma-separated values (.csv)** → Publish → copy the link.
6. Paste that link into `productsSheetCsvUrl` in `js/config.js`.

Changes in the Sheet show on the site within ~5 minutes.

### Way B — edit `js/products.js`
Copy one `{ ... }` block per product and change the values. Put photos in `images/`.

**Photo tips:** square (1:1), at least 1000×1000 px, plain light background, under 300 KB each (use squoosh.app to compress). Give each product 2 photos — the second appears when shoppers hover.

---

## 5. Put it online FREE with GitHub Pages

1. Create an account at github.com.
2. Click **+ → New repository** → name it `asjewels` → Public → **Create**.
3. Click **uploading an existing file** → drag in **everything inside** the `asjewels` folder (index.html, css, js, images…) → **Commit changes**.
4. Go to **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → **Save**.
5. Wait 1–2 minutes. Your site is live at `https://YOUR-USERNAME.github.io/asjewels/`.

**To update later:** open the file on GitHub → pencil ✏️ icon → edit → Commit. Or drag new files in again.

**Connect asjewels.com (when you buy it):** GitHub → Settings → Pages → Custom domain → `asjewels.com` → Save.
At your domain seller (GoDaddy / Hostinger / Namecheap) add DNS records:
- 4 × **A** records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- **CNAME** for `www` → `YOUR-USERNAME.github.io`
Then tick **Enforce HTTPS** after it appears (can take up to 24 h).

**Using paid hosting instead (Hostinger/cPanel):** open File Manager → `public_html` → upload all files (same folder structure). Done — nothing else changes.

---

## 6. Google Sign-In

1. console.cloud.google.com → create project **AS Jewels**.
2. **APIs & Services → OAuth consent screen** → External → app name, support email, logo → Save.
3. **Credentials → Create credentials → OAuth client ID** → *Web application*.
4. **Authorized JavaScript origins** → add your site address(es):
   `https://YOUR-USERNAME.github.io`, `https://asjewels.com`, `https://www.asjewels.com`
5. Copy the **Client ID** (ends in `.apps.googleusercontent.com`) → paste into `googleClientId` in `config.js`.
6. On the consent screen click **Publish app** so any customer can sign in (in *Testing* only listed test users can).

Sign-in is optional for shoppers — guests can always check out.

---

## 7. Razorpay payments + order sheet (free backend)

Your Razorpay **secret** key must never be inside the website files (anyone can read them). The included
Google Apps Script keeps it safe, recalculates prices from your Sheet (so nobody can change prices in the browser),
and writes every order into an **Orders** tab.

1. Sign up at razorpay.com → Dashboard → switch to **Test Mode** → **Account & Settings → API Keys → Generate Test Key**. Copy the Key ID and Secret.
2. In your Products Google Sheet: **Extensions → Apps Script** → delete the sample code → paste all of `apps-script/Code.gs` → 💾 Save.
3. ⚙️ **Project Settings → Script Properties → Add**:
   - `RAZORPAY_KEY_ID` = `rzp_test_...`
   - `RAZORPAY_KEY_SECRET` = your secret
4. **Deploy → New deployment** → ⚙️ type **Web app** → Execute as **Me** → Who has access **Anyone** → **Deploy** → allow permissions → copy the **Web app URL**.
5. In `js/config.js` set:
   - `razorpayKeyId: "rzp_test_..."`
   - `orderApiUrl: "https://script.google.com/macros/s/....../exec"`
6. Upload the new `config.js` to GitHub. Place a test order — use Razorpay's test UPI `success@razorpay` or test card `4111 1111 1111 1111` (any future date, any CVV). Check the **Orders** tab fills in and stock goes down.

> Note: Way A (Google Sheet) is required for payments, because the backend reads prices from the **Products** tab.
> If you change `Code.gs` later: Deploy → Manage deployments → ✏️ → Version: **New version** → Deploy.

**Going live (real money):** complete Razorpay KYC (PAN, bank account, business details, your website URL).
Razorpay checks that your site has the policy pages — they're already at `#/page/terms`, `privacy`, `returns`,
`shipping`, `contact`. **Edit their text in `js/app.js` (search for `const pages`) to match your business** before applying.
After approval: generate **Live** keys, put them in Script Properties and `config.js` (`rzp_live_...`), redeploy.

---

## 8. Daily running

- **New order?** It appears in the **Orders** tab (tip: in the Sheet, Tools → Notification settings → email me on changes).
- **COD orders** show *COD - to confirm* — call/WhatsApp the customer to confirm before shipping.
- **Ship:** book with Shiprocket / Delhivery / India Post, then WhatsApp the tracking link.
- **Out of stock:** set `stock` to 0 — the site shows *Sold out*.

---

## 9. Launch checklist

- [ ] Real products, photos and prices added; sample products deleted
- [ ] `config.js` contact details, WhatsApp number, coupons updated
- [ ] Policy page text reviewed (in `js/app.js`)
- [ ] Only real customer reviews added to `reviews` in `config.js` (section stays hidden while empty)
- [ ] Test order placed in Razorpay Test Mode ✔
- [ ] Domain connected + HTTPS on
- [ ] Razorpay KYC approved → live keys switched in
- [ ] Google consent screen published
