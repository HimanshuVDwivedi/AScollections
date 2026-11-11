/* =========================================================
   AS JEWELS — SITE SETTINGS
   This is the ONLY file you need to edit to set up the shop.
   ========================================================= */
window.AS_CONFIG = {
  brand: "AS Jewels",
  domain: "asjewels.com",
  tagline: "Jewellery that feels like you",
  currency: "₹",

  /* ---------- Contact ---------- */
  whatsappNumber: "919999999999",          // country code + number, no "+" or spaces
  supportEmail: "care@asjewels.com",
  supportPhone: "+91 99999 99999",
  businessAddress: "Your registered business address, City, State – PIN",
  instagram: "https://www.instagram.com/as_premium_collections_/",
  facebook: "https://facebook.com/",

  /* ---------- Offers ---------- */
  announcements: [
    "✨ Free shipping on orders above ₹999",
    "💝 Use code WELCOME10 for 10% off your first order",
    "🔁 Easy 7-day returns · Certificate of authenticity with every piece"
  ],
  freeShippingAbove: 999,     // cart subtotal for free delivery
  shippingFee: 79,            // fee below that amount
  codAvailable: true,         // Cash on Delivery option at checkout
  coupons: {                  // must match the list in apps-script/Code.gs
    "WELCOME10": { type: "percent", value: 10, label: "10% off" },
    "FLAT200":   { type: "flat",    value: 200, label: "₹200 off", minOrder: 1999 }
  },
  saleEndsAt: "2026-12-31T23:59:59+05:30",  // countdown in the hero; "" to hide

  /* ---------- Products ----------
     Products come from your "AS Jewels Store" Google Sheet through orderApiUrl below.
     productsSheetCsvUrl is not needed. */
  productsSheetCsvUrl: "",

  /* ---------- Google Sign-In ---------- */
  googleClientId: "453829452781-s09bh7dl105thflq2acoa0u70ko5f7l5.apps.googleusercontent.com",

  /* ---------- UPI QR payment at checkout ----------
     Set your UPI ID in the Google Sheet → "Settings" tab (this is only a fallback). */
  upi: { id: "", name: "AS Jewels" },

  /* ---------- Payments + store backend ----------
     razorpayKeyId: your PUBLIC key (rzp_test_... while testing, rzp_live_... later).
     orderApiUrl: the Web App URL of your Apps Script (connects the site to your Sheet). */
  razorpayKeyId: "rzp_test_Tyv15THAxZSOnQ",
  orderApiUrl: "https://script.google.com/macros/s/AKfycbw3LftzhZF9GD8eijT2eIXuI1vadtdn-a60yIlQpJDxfsNHa_SlN-G2eVB76v_izm8/exec",

  /* ---------- Customer reviews (only add real ones) ---------- */
  reviews: [
    // { name: "Customer name", city: "City", text: "What they said", rating: 5 }
  ]
};
