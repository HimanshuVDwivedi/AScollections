/* =========================================================
   AS COLLECTIONS — SITE SETTINGS
   This is the ONLY file you need to edit to set up the shop.
   ========================================================= */
window.AS_CONFIG = {
  brand: "AS Collections",
  domain: "asjewels.com",
  tagline: "Jewellery that feels like you",
  currency: "₹",

  /* ---------- Contact ---------- */
  whatsappNumber: "919490609565",          // country code + number, no "+" or spaces
  supportEmail: "care@asjewels.com",
  supportPhone: "+91 94906 09565",
  businessAddress: "Your registered business address, City, State – PIN",
  instagram: "https://www.instagram.com/as_premium_collections_/",
  instagramHandle: "as_premium_collections_",
  facebook: "https://facebook.com/",

  /* ---------- Offers ---------- */
  announcements: [
    "✨ Free shipping on orders above ₹1,499",
    "💝 Use code WELCOME10 for 10% off your first order",
    "🎁 Gift-ready packaging · 100% prepaid, secure checkout"
  ],
  freeShippingAbove: 1499,     // cart subtotal for free delivery
  shippingFee: 79,            // fee below that amount
  codAvailable: false,        // prepaid only (Cash on Delivery is switched off)
  coupons: {                  // must match the list in apps-script/Code.gs
    "WELCOME10": { type: "percent", value: 10, label: "10% off" },
    "FLAT200":   { type: "flat",    value: 200, label: "₹200 off", minOrder: 1999 }
  },
  saleEndsAt: "2026-12-31T23:59:59+05:30",  // countdown in the hero; "" to hide

  /* ---------- Products ----------
     Option A (simplest): edit js/products.js
     Option B (free + easy updates): Google Sheet → File → Share → Publish to web
        → choose the "Products" sheet → "Comma-separated values (.csv)" → paste the link here. */
  productsSheetCsvUrl: "",

  /* ---------- Google Sign-In ----------
     Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web)
     Add your site under "Authorized JavaScript origins". */
  googleClientId: "453829452781-s09bh7dl105thflq2acoa0u70ko5f7l5.apps.googleusercontent.com",

  /* ---------- UPI QR payment at checkout ----------
     Best set in your Google Sheet → "Settings" tab (UPI ID, UPI name, WhatsApp number).
     The values below are only used before the Sheet backend is connected (demo/testing). */
  upi: { id: "", name: "AS Collections" },

  /* ---------- Payments (Razorpay) ----------
     razorpayKeyId: your PUBLIC key (rzp_test_... while testing, rzp_live_... later).
     orderApiUrl: the Web App URL of apps-script/Code.gs (keeps your SECRET key safe).
     Leave orderApiUrl empty to run the shop in DEMO mode (no real payment). */
  razorpayKeyId: "",
  orderApiUrl: "https://script.google.com/macros/s/AKfycbw3LftzhZF9GD8eijT2eIXuI1vadtdn-a60yIlQpJDxfsNHa_SlN-G2eVB76v_izm8/exec",

  /* ---------- Customer reviews (only add real ones) ---------- */
  reviews: [
    // { name: "Customer name", city: "City", text: "What they said", rating: 5 }
  ]
};
