/* =========================================================
   AS JEWELS — STORE ENGINE
   You normally don't need to edit this file.
   Settings live in js/config.js, products in js/products.js.
   ========================================================= */
(() => {
  "use strict";
  const CFG = window.AS_CONFIG || {};
  const CATS = window.AS_CATEGORIES || [];
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const app = $("#app");

  /* ---------- Storage (safe) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem("asj_" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem("asj_" + k, JSON.stringify(v)); } catch {} }
  };

  const state = {
    products: [],
    cart: store.get("cart", []),          // [{id, qty}]
    wish: store.get("wish", []),          // [id]
    recent: store.get("recent", []),      // [id]
    user: store.get("user", null),        // {name, email, picture}
    coupon: store.get("coupon", ""),
    lastOrder: store.get("lastOrder", null)
  };

  /* ---------- Helpers ---------- */
  const money = n => (CFG.currency || "₹") + Math.round(n).toLocaleString("en-IN");
  const pctOff = p => p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const byId = id => state.products.find(p => p.id === id);
  const catName = id => (CATS.find(c => c.id === id) || { name: id }).name;
  const waLink = text => `https://wa.me/${CFG.whatsappNumber}?text=${encodeURIComponent(text)}`;
  const icon = {
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9Z"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6Z"/><path d="m9 12 2 2 4-4"/></svg>',
    truck: '<svg viewBox="0 0 24 24"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
    return: '<svg viewBox="0 0 24 24"><path d="M4 9h11a5 5 0 0 1 0 10H8"/><path d="m8 5-4 4 4 4"/></svg>',
    gift: '<svg viewBox="0 0 24 24"><path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13"/><path d="M12 7S10 3 7.5 4 9 7 12 7Zm0 0s2-4 4.5-3S15 7 12 7Z"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>'
  };

  const STATES = ["", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman & Nicobar", "Chandigarh", "Dadra & Nagar Haveli and Daman & Diu", "Lakshadweep"];

  /* ---------- Placeholder art (until real photos are uploaded) ---------- */
  const glyphs = {
    rings: '<circle cx="200" cy="230" r="78" fill="none" stroke="url(#m)" stroke-width="18"/><path d="M200 108l34 34-34 40-34-40z" fill="url(#g)"/>',
    earrings: '<circle cx="140" cy="140" r="14" fill="url(#m)"/><circle cx="260" cy="140" r="14" fill="url(#m)"/><path d="M140 154v30M260 154v30" stroke="url(#m)" stroke-width="6"/><path d="M140 184l26 50-26 44-26-44z" fill="url(#g)"/><path d="M260 184l26 50-26 44-26-44z" fill="url(#g)"/>',
    necklaces: '<path d="M90 90c10 130 60 180 110 180s100-50 110-180" fill="none" stroke="url(#m)" stroke-width="8" stroke-dasharray="2 12" stroke-linecap="round"/><path d="M200 262l30 34-30 46-30-46z" fill="url(#g)"/>',
    pendants: '<path d="M120 80c20 110 50 150 80 150s60-40 80-150" fill="none" stroke="url(#m)" stroke-width="5"/><path d="M200 220c-40-40-70-10-55 20 10 22 55 50 55 50s45-28 55-50c15-30-15-60-55-20z" fill="url(#g)"/>',
    bracelets: '<ellipse cx="200" cy="200" rx="120" ry="70" fill="none" stroke="url(#m)" stroke-width="16" stroke-dasharray="20 8"/><circle cx="200" cy="130" r="18" fill="url(#g)"/>',
    bangles: '<ellipse cx="180" cy="200" rx="110" ry="60" fill="none" stroke="url(#m)" stroke-width="20"/><ellipse cx="220" cy="215" rx="110" ry="60" fill="none" stroke="url(#g)" stroke-width="10"/>',
    anklets: '<path d="M80 170c40 70 200 70 240 0" fill="none" stroke="url(#m)" stroke-width="5" stroke-dasharray="3 9" stroke-linecap="round"/><circle cx="140" cy="225" r="11" fill="url(#g)"/><circle cx="200" cy="238" r="11" fill="url(#g)"/><circle cx="260" cy="225" r="11" fill="url(#g)"/>',
    sets: '<path d="M100 90c10 110 50 150 100 150s90-40 100-150" fill="none" stroke="url(#m)" stroke-width="10"/><path d="M200 230l28 30-28 44-28-44z" fill="url(#g)"/><circle cx="70" cy="280" r="16" fill="url(#g)"/><circle cx="330" cy="280" r="16" fill="url(#g)"/>'
  };
  function placeholder(category, variant = 0) {
    const hue = ((CATS.find(c => c.id === category) || {}).hue ?? 330) + variant * 25;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
      <defs><radialGradient id="bg" cx="${variant ? 70 : 30}%" cy="25%" r="90%"><stop offset="0" stop-color="hsl(${hue},90%,97%)"/><stop offset="1" stop-color="hsl(${hue},55%,${variant ? 84 : 88}%)"/></radialGradient>
      <linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8862f"/><stop offset=".5" stop-color="#f6e2a6"/><stop offset="1" stop-color="#a87a22"/></linearGradient>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},85%,72%)"/><stop offset="1" stop-color="hsl(${hue},70%,38%)"/></linearGradient></defs>
      <rect width="400" height="400" fill="url(#bg)"/><ellipse cx="200" cy="350" rx="120" ry="14" fill="hsl(${hue},40%,70%)" opacity=".35"/>
      <g transform="${variant ? "rotate(-8 200 200) translate(0 10)" : ""}">${glyphs[category] || glyphs.rings}</g></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  const img = (p, i = 0) => (p.images && p.images[i]) || placeholder(p.category, i);

  /* ---------- Products: from Google Sheet (CSV) or products.js ---------- */
  function parseCSV(text) {
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    const head = rows.shift().map(h => h.trim().toLowerCase());
    return rows.filter(r => r.some(Boolean)).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
  }
  // Turns a Google Drive "share" link into a direct image link
  const driveImg = u => { const m = u.match(/\/d\/([\w-]{20,})|id=([\w-]{20,})/); return m && u.includes("drive.google") ? `https://lh3.googleusercontent.com/d/${m[1] || m[2]}` : u; };
  async function loadProducts() {
    if (CFG.orderApiUrl) {
      try {
        const res = await fetch(CFG.orderApiUrl + "?action=products", { cache: "no-store" });
        const data = await res.json();
        if (data.settings) state.remote = data.settings;
        if (data.ok && data.products?.length) return data.products.map(p => ({ ...p, images: (p.images || []).map(driveImg) }));
      } catch (e) { console.warn("Could not load products from the store backend.", e); }
    }
    if (CFG.productsSheetCsvUrl) {
      try {
        const res = await fetch(CFG.productsSheetCsvUrl, { cache: "no-store" });
        const rows = parseCSV(await res.text());
        const list = rows.filter(r => r.id && r.name && (r.active || "yes").toLowerCase() !== "no").map(r => ({
          id: r.id, name: r.name, category: (r.category || "rings").toLowerCase(),
          price: Number(r.price) || 0, mrp: Number(r.mrp) || Number(r.price) || 0,
          images: (r.images || "").split("|").map(s => s.trim()).filter(Boolean).map(driveImg),
          metal: r.metal, occasion: (r.occasion || "").toLowerCase(),
          tags: (r.tags || "").toLowerCase().split(/[|,]/).map(s => s.trim()).filter(Boolean),
          stock: r.stock === "" || r.stock == null ? 99 : Number(r.stock), description: r.description || ""
        }));
        if (list.length) return list;
      } catch (e) { console.warn("Could not load the Google Sheet, using products.js instead.", e); }
    }
    return window.AS_PRODUCTS || [];
  }

  /* ---------- UPI details: from the Sheet's Settings tab, else from config.js ---------- */
  const upiInfo = () => ({
    id: (state.remote?.upiId || CFG.upi?.id || "").trim(),
    name: state.remote?.upiName || CFG.upi?.name || CFG.brand,
    wa: state.remote?.whatsapp || CFG.whatsappNumber
  });
  const upiLink = (u, amount, orderNo) => `upi://pay?pa=${encodeURIComponent(u.id).replace(/%40/g, "@")}&pn=${encodeURIComponent(u.name)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent("Order " + orderNo)}`;
  function loadScript(src) { return new Promise((ok, fail) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => fail(new Error("Could not load " + src)); document.head.appendChild(s); }); }

  /* ---------- Activity log (goes to the "Activity" tab of your Sheet) ---------- */
  function track(event, details = "", amount = "") {
    if (!CFG.orderApiUrl) return;
    const body = JSON.stringify({ action: "track", event, details, amount, customer: state.user?.email || "Guest" });
    try { if (!(navigator.sendBeacon && navigator.sendBeacon(CFG.orderApiUrl, body))) fetch(CFG.orderApiUrl, { method: "POST", body, keepalive: true, mode: "no-cors" }); } catch {}
  }

  /* ---------- Cart maths ---------- */
  function totals() {
    const lines = state.cart.map(l => ({ ...l, p: byId(l.id) })).filter(l => l.p);
    const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
    const mrpTotal = lines.reduce((s, l) => s + Math.max(l.p.mrp, l.p.price) * l.qty, 0);
    const c = CFG.coupons?.[state.coupon];
    let discount = 0, couponError = "";
    if (c) {
      if (c.minOrder && subtotal < c.minOrder) couponError = `Add ${money(c.minOrder - subtotal)} more to use ${state.coupon}`;
      else discount = c.type === "percent" ? Math.round(subtotal * c.value / 100) : Math.min(c.value, subtotal);
    }
    const after = subtotal - discount;
    const shipping = !lines.length || after >= CFG.freeShippingAbove ? 0 : CFG.shippingFee;
    const count = lines.reduce((s, l) => s + l.qty, 0);
    return { lines, subtotal, mrpTotal, discount, couponError, shipping, total: after + shipping, count, savings: mrpTotal - subtotal + discount };
  }
  function saveCart() { store.set("cart", state.cart); updateBadges(true); renderCart(); }
  function addToCart(id, qty = 1, open = true) {
    const p = byId(id); if (!p) return;
    if (p.stock <= 0) return toast("Sorry, this piece is sold out");
    const line = state.cart.find(l => l.id === id);
    const want = (line ? line.qty : 0) + qty;
    if (want > p.stock) return toast(`Only ${p.stock} left in stock`);
    line ? (line.qty = want) : state.cart.push({ id, qty });
    saveCart();
    track("Added to bag", `${p.name} (${p.id}) × ${qty}`, p.price * qty);
    if (open) openDrawer("cartDrawer"); else toast(`Added to bag ✨ <a href="#/checkout">Checkout</a>`);
  }
  function setQty(id, qty) {
    const p = byId(id); const line = state.cart.find(l => l.id === id); if (!line) return;
    if (qty <= 0) state.cart = state.cart.filter(l => l.id !== id);
    else line.qty = Math.min(qty, p?.stock ?? qty);
    saveCart(); if (location.hash.startsWith("#/checkout")) route();
  }
  function toggleWish(id, btn) {
    const on = state.wish.includes(id);
    state.wish = on ? state.wish.filter(x => x !== id) : [...state.wish, id];
    store.set("wish", state.wish); updateBadges(true);
    $$(`.wish[data-id="${id}"]`).forEach(b => { b.classList.toggle("on", !on); b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); });
    toast(on ? "Removed from wishlist" : "Saved to your wishlist 💖");
    if (!on) { const p = byId(id); if (p) track("Added to wishlist", `${p.name} (${p.id})`, p.price); }
    renderWish();
  }

  /* ---------- UI chrome ---------- */
  function updateBadges(bump) {
    const c = totals().count, w = state.wish.length;
    [["cartCount", c], ["wishCount", w]].forEach(([id, n]) => {
      const b = $("#" + id); b.textContent = n; b.classList.toggle("show", n > 0);
      if (bump) { b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }
    });
  }
  let toastTimer;
  function toast(html) { const t = $("#toast"); t.innerHTML = html; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2600); }
  function openDrawer(id) { closeAll(); const d = $("#" + id); d.classList.add("open"); d.setAttribute("aria-hidden", "false"); $("#overlay").classList.add("show"); document.body.style.overflow = "hidden"; }
  function closeAll() {
    $$(".drawer.open, .modal.open, .filters.open").forEach(d => { d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); });
    $("#overlay").classList.remove("show"); document.body.style.overflow = "";
  }

  function renderChrome() {
    const ann = CFG.announcements || [];
    $("#ticker").innerHTML = [...ann, ...ann].map(a => `<span>${esc(a)}</span>`).join("");
    const nav = `<a href="#/shop">All Jewellery</a>` + CATS.map(c => `<a href="#/shop?cat=${c.id}" data-cat="${c.id}">${c.name}</a>`).join("") + `<a href="#/shop?sort=discount" class="sale">Sale</a>`;
    $("#catNav").innerHTML = nav;
    $("#menuBody").innerHTML = `<div class="menu-list">${nav.replace(/<\/a>/g, "<span>›</span></a>")}<a href="#/account">My Profile<span>›</span></a><a href="#/page/contact">Contact Us<span>›</span></a></div>`;
    $("#footCats").innerHTML = CATS.map(c => `<li><a href="#/shop?cat=${c.id}">${c.name}</a></li>`).join("");
    $("#footTagline").textContent = `${CFG.tagline}. Thoughtfully designed, carefully packed, delivered across India.`;
    $("#footContact").innerHTML = `
      <li><a href="${waLink("Hi AS Jewels! I have a question.")}" target="_blank" rel="noopener">WhatsApp: ${esc(CFG.supportPhone)}</a></li>
      <li><a href="mailto:${esc(CFG.supportEmail)}">${esc(CFG.supportEmail)}</a></li>
      <li class="muted-light">${esc(CFG.businessAddress)}</li>
      <li><a href="${esc(CFG.instagram)}" target="_blank" rel="noopener">Instagram</a> · <a href="${esc(CFG.facebook)}" target="_blank" rel="noopener">Facebook</a></li>`;
    $("#footTrust").innerHTML = trustItems();
    $("#copyright").textContent = `© ${new Date().getFullYear()} ${CFG.brand} · ${CFG.domain}`;
    $("#waFloat").href = waLink("Hi AS Jewels! I'd like some help choosing a piece.");
    renderAccountIcon();
  }
  const trustItems = () => [
    [icon.shield, "Certified Quality", "Authenticity card with every piece"],
    [icon.return, "7-Day Easy Returns", "No-fuss exchange or refund"],
    [icon.truck, "Free Shipping", `On orders above ${money(CFG.freeShippingAbove)}`],
    [icon.lock, "Secure Payments", "UPI, cards & COD via Razorpay"]
  ].map(([i, t, s]) => `<div class="trust-item"><div class="ic">${i}</div><div><strong>${t}</strong><span>${s}</span></div></div>`).join("");

  /* ---------- Product card ---------- */
  function card(p) {
    const off = pctOff(p), wished = state.wish.includes(p.id), sold = p.stock <= 0;
    const tag = sold ? '<span class="tag sold">Sold out</span>'
      : p.tags?.includes("bestseller") ? '<span class="tag">Bestseller</span>'
      : p.tags?.includes("new") ? '<span class="tag new">New</span>'
      : p.tags?.includes("trending") ? '<span class="tag trending">Trending</span>' : "";
    return `<article class="card">
      <div class="card-media">
        <a href="#/product/${encodeURIComponent(p.id)}" class="media-link" aria-label="${esc(p.name)}">
          <img class="img-1" src="${img(p, 0)}" alt="${esc(p.name)}" loading="lazy">
          <img class="img-2" src="${img(p, 1)}" alt="" loading="lazy" aria-hidden="true">
        </a>
        ${tag}
        <button class="wish ${wished ? "on" : ""}" data-act="wish" data-id="${esc(p.id)}" aria-label="Save to wishlist">${icon.heart}</button>
        ${sold ? "" : `<button class="quick-add" data-act="add" data-id="${esc(p.id)}">${icon.bag} Add to Bag</button>`}
      </div>
      <div class="card-body">
        <span class="card-meta">${esc(catName(p.category))}</span>
        <a href="#/product/${encodeURIComponent(p.id)}" class="card-title">${esc(p.name)}</a>
        <div class="price-row"><span class="price">${money(p.price)}</span>${off ? `<span class="mrp">${money(p.mrp)}</span><span class="off">${off}% off</span>` : ""}</div>
      </div>
      <button class="btn btn-primary card-cta" data-act="add" data-id="${esc(p.id)}" ${sold ? "disabled" : ""}>${sold ? "Sold out" : "Add to Bag"}</button>
    </article>`;
  }

  /* ---------- Views ---------- */
  const heroSlides = [
    { eyebrow: "The Festive Edit", title: "Shine like you <em>mean it</em>", text: "Hand-picked pieces for every celebration — from haldi mornings to sangeet nights.", cta: ["Shop the Edit", "#/shop?occ=wedding"], bg: "linear-gradient(120deg,#861a38 0%,#d23358 45%,#f2577a 75%,#ff9db0 100%)", hue: 330 },
    { eyebrow: "Everyday Luxe", title: "Little sparkles, <em>every day</em>", text: "Lightweight silver you'll never want to take off. Under ₹1,500.", cta: ["Shop Everyday", "#/shop?max=1500"], bg: "linear-gradient(120deg,#164f30 0%,#1e6b40 40%,#3d9a5b 70%,#ffb3c2 100%)", hue: 160 },
    { eyebrow: "Made for Gifting", title: "Say it with <em>something that lasts</em>", text: "Gift-ready boxes, a handwritten note and free delivery on orders above ₹999.", cta: ["Find a Gift", "#/shop?occ=gifting"], bg: "linear-gradient(120deg,#b3264a 0%,#e8456a 45%,#ff7f98 75%,#9fd8ab 100%)", hue: 280 }
  ];
  let heroTimer;
  function viewHome() {
    const ps = state.products;
    const best = ps.filter(p => p.tags?.includes("bestseller"));
    const fresh = ps.filter(p => p.tags?.includes("new"));
    const recent = state.recent.map(byId).filter(Boolean);
    const gem = `<svg class="gem" viewBox="0 0 200 200"><defs><linearGradient id="hg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#ffd6de"/></linearGradient><linearGradient id="hg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9f2d2"/><stop offset="1" stop-color="#3d9a5b"/></linearGradient></defs>
      <path d="M40 70 70 35h60l30 35-60 95Z" fill="url(#hg1)" opacity=".95"/><path d="M40 70h120l-60 95Z" fill="#ffb3c2" opacity=".7"/><path d="M70 35l30 35 30-35M40 70l60 95 60-95M100 70v95" stroke="#fff" stroke-width="1.5" fill="none" opacity=".8"/><circle cx="100" cy="100" r="92" fill="none" stroke="url(#hg2)" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/></svg>`;
    app.innerHTML = `
      <section class="container">
        <div class="hero" id="hero">
          <div class="hero-text fade-in" id="heroText"></div>
          <div class="hero-art"><div class="orb a"></div><div class="orb b"></div>${gem}
            ${[...Array(7)].map((_, i) => `<i class="sparkle" style="left:${12 + i * 12}%;top:${15 + (i * 37) % 70}%;animation-delay:${i * .4}s"></i>`).join("")}
          </div>
          <div class="hero-dots">${heroSlides.map((_, i) => `<button data-slide="${i}" aria-label="Slide ${i + 1}"></button>`).join("")}</div>
        </div>
      </section>

      <section class="section container reveal">
        <div class="section-head"><div><h2>Shop by Category</h2><p>Find your next favourite in a tap</p></div></div>
        <div class="cat-row">${CATS.map(c => {
          const first = ps.find(p => p.category === c.id && p.images?.length);
          return `<a class="cat-tile" href="#/shop?cat=${c.id}"><div class="ring"><div><img src="${first ? first.images[0] : placeholder(c.id)}" alt="" loading="lazy"></div></div>${c.name}</a>`;
        }).join("")}</div>
      </section>

      <section class="section container reveal"><div class="trust-strip">${trustItems()}</div></section>

      <section class="section container reveal">
        <div class="section-head"><div><h2>Bestsellers</h2><p>The pieces everyone's adding to their bag</p></div><div class="chips" id="bestChips">
          <button class="chip on" data-filter="all">All</button>${[...new Set(best.map(p => p.category))].map(c => `<button class="chip" data-filter="${c}">${catName(c)}</button>`).join("")}
        </div></div>
        <div class="grid" id="bestGrid">${(best.length ? best : ps).slice(0, 8).map(card).join("")}</div>
      </section>

      <section class="section container reveal">
        <div class="promo-grid">
          <a class="promo p1" href="#/shop?occ=everyday"><span class="deco"></span><span class="eyebrow">Everyday Edit</span><h3>Wear it. Love it. Repeat.</h3><p>Lightweight pieces made for 9-to-9 days.</p><span class="btn btn-light">Explore</span></a>
          <a class="promo p2" href="#/shop?sort=discount"><span class="deco"></span><span class="eyebrow">Up to 50% off</span><h3>The Sale Vault</h3><p>Limited pieces. Limited time.</p><span class="btn btn-gold">Shop Sale</span></a>
        </div>
      </section>

      <section class="section container reveal">
        <div class="section-head"><div><h2>Gifts by Budget</h2><p>Something special at every price</p></div></div>
        <div class="price-tiles">${[[999, "Under"], [1499, "Under"], [2499, "Under"], [2500, "Above"]].map(([v, l]) =>
          `<a class="price-tile" href="#/shop?${l === "Under" ? "max" : "min"}=${v}"><small>${l}</small><b>${money(v)}</b></a>`).join("")}</div>
      </section>

      ${fresh.length ? `<section class="section container reveal">
        <div class="section-head"><div><h2>Fresh Drops</h2><p>Just landed — be the first to wear them</p></div><a class="link-more" href="#/shop?tag=new">View all →</a></div>
        <div class="grid">${fresh.slice(0, 4).map(card).join("")}</div></section>` : ""}

      <section class="section container reveal">
        <div class="section-head"><div><h2>Shop by Occasion</h2><p>Dressed for the moment</p></div></div>
        <div class="occ-grid">${[["everyday", "Everyday", "#1e6b40,#7fcb8f"], ["office", "Office", "#861a38,#d23358"], ["party", "Party", "#e8456a,#ffb0bf"], ["wedding", "Wedding", "#b3264a,#ff7f98"], ["gifting", "Gifting", "#3d9a5b,#ff9db0"]]
          .map(([id, n, g]) => `<a class="occ" href="#/shop?occ=${id}" style="--bg:linear-gradient(160deg,${g})"><span>${n}</span></a>`).join("")}</div>
      </section>

      ${(CFG.reviews || []).length ? `<section class="section container reveal">
        <div class="section-head"><div><h2>Loved by our customers</h2></div></div>
        <div class="reviews">${CFG.reviews.map(r => `<div class="review"><div class="stars">${"★".repeat(r.rating || 5)}</div><p>"${esc(r.text)}"</p><strong>${esc(r.name)}</strong> <span class="muted">· ${esc(r.city || "")}</span></div>`).join("")}</div></section>` : ""}

      ${recent.length ? `<section class="section container reveal">
        <div class="section-head"><div><h2>Recently Viewed</h2><p>Still thinking about these?</p></div></div>
        <div class="scroller">${recent.slice(0, 8).map(card).join("")}</div></section>` : ""}
    `;
    let slide = 0;
    const show = i => {
      slide = (i + heroSlides.length) % heroSlides.length; const s = heroSlides[slide];
      $("#hero").style.background = s.bg;
      const t = $("#heroText"); t.classList.remove("fade-in"); void t.offsetWidth; t.classList.add("fade-in");
      t.innerHTML = `<span class="eyebrow">${s.eyebrow}</span><h1>${s.title}</h1><p>${s.text}</p>
        <div class="hero-ctas"><a class="btn btn-light" href="${s.cta[1]}">${s.cta[0]}</a><a class="btn btn-outline" style="color:#fff;border-color:rgba(255,255,255,.6)" href="#/shop">Browse All</a></div>
        ${CFG.saleEndsAt ? `<div class="countdown" id="countdown"></div>` : ""}`;
      $$(".hero-dots button").forEach((b, j) => b.classList.toggle("on", j === slide));
      tick();
    };
    $$(".hero-dots button").forEach(b => b.onclick = () => { show(+b.dataset.slide); restart(); });
    const restart = () => { clearInterval(heroTimer); heroTimer = setInterval(() => show(slide + 1), 6000); };
    show(0); restart();
    $("#bestChips")?.addEventListener("click", e => {
      const b = e.target.closest(".chip"); if (!b) return;
      $$("#bestChips .chip").forEach(c => c.classList.toggle("on", c === b));
      const f = b.dataset.filter, list = (best.length ? best : ps).filter(p => f === "all" || p.category === f);
      $("#bestGrid").innerHTML = list.slice(0, 8).map(card).join("");
    });
  }
  function tick() {
    const el = $("#countdown"); if (!el) return;
    const ms = new Date(CFG.saleEndsAt) - Date.now();
    if (ms <= 0) { el.remove(); return; }
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
    el.innerHTML = `<span>Sale ends in</span>` + [[d, "days"], [h, "hrs"], [m, "min"], [s, "sec"]].map(([v, l]) => `<span class="unit"><b>${String(v).padStart(2, "0")}</b>${l}</span>`).join("");
  }
  setInterval(tick, 1000);

  function viewShop(params) {
    const q = (params.get("q") || "").toLowerCase();
    const f = {
      cat: params.getAll("cat"), occ: params.get("occ") || "", tag: params.get("tag") || "",
      min: Number(params.get("min")) || 0, max: Number(params.get("max")) || Infinity,
      sort: params.get("sort") || "featured"
    };
    let list = state.products.filter(p =>
      (!f.cat.length || f.cat.includes(p.category)) && (!f.occ || p.occasion === f.occ) && (!f.tag || p.tags?.includes(f.tag)) &&
      p.price >= f.min && p.price <= f.max &&
      (!q || [p.name, p.category, p.metal, p.description, p.occasion].join(" ").toLowerCase().includes(q)));
    const sorters = {
      featured: (a, b) => (b.stock > 0) - (a.stock > 0) || (b.tags?.length || 0) - (a.tags?.length || 0),
      low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price,
      discount: (a, b) => pctOff(b) - pctOff(a), new: (a, b) => (b.tags?.includes("new") ? 1 : 0) - (a.tags?.includes("new") ? 1 : 0)
    };
    list.sort(sorters[f.sort] || sorters.featured);
    const title = q ? `Results for “${esc(params.get("q"))}”` : f.cat.length === 1 ? catName(f.cat[0]) : f.occ ? `${f.occ[0].toUpperCase() + f.occ.slice(1)} Jewellery` : f.tag === "new" ? "Fresh Drops" : f.sort === "discount" ? "The Sale Vault" : "All Jewellery";
    const priceOpts = [["", "Any price"], ["0-999", "Under ₹999"], ["1000-1999", "₹1,000 – ₹1,999"], ["2000-2999", "₹2,000 – ₹2,999"], ["3000-", "₹3,000 & above"]];
    const curPrice = `${f.min || (f.max !== Infinity ? 0 : "")}-${f.max !== Infinity ? f.max : ""}`;
    app.innerHTML = `
      <section class="container page-head">
        <div class="crumbs"><a href="#/">Home</a> / ${title}</div>
        <h1>${title}</h1><p class="muted">${list.length} piece${list.length === 1 ? "" : "s"}</p>
      </section>
      <section class="container shop-layout">
        <aside class="filters" id="filters">
          <div class="filter-group"><h4>Category</h4>${CATS.map(c => `<label><input type="checkbox" name="cat" value="${c.id}" ${f.cat.includes(c.id) ? "checked" : ""}> ${c.name}</label>`).join("")}</div>
          <div class="filter-group"><h4>Price</h4>${priceOpts.map(([v, l]) => `<label><input type="radio" name="price" value="${v}" ${(v === "" && curPrice === "-") || v === curPrice ? "checked" : ""}> ${l}</label>`).join("")}</div>
          <div class="filter-group"><h4>Occasion</h4>${["", "everyday", "office", "party", "wedding", "gifting"].map(o => `<label><input type="radio" name="occ" value="${o}" ${f.occ === o ? "checked" : ""}> ${o ? o[0].toUpperCase() + o.slice(1) : "Any"}</label>`).join("")}</div>
          <button class="btn btn-outline btn-block" id="clearFilters">Clear all</button>
        </aside>
        <div>
          <div class="shop-toolbar">
            <button class="btn btn-outline filter-toggle" id="filterToggle">Filters</button>
            <div class="chips">${CATS.slice(0, 5).map(c => `<a class="chip ${f.cat.includes(c.id) ? "on" : ""}" href="#/shop?cat=${c.id}">${c.name}</a>`).join("")}</div>
            <select class="select" id="sortSel" aria-label="Sort">
              ${[["featured", "Featured"], ["low", "Price: Low to High"], ["high", "Price: High to Low"], ["discount", "Biggest Discount"], ["new", "Newest"]].map(([v, l]) => `<option value="${v}" ${f.sort === v ? "selected" : ""}>${l}</option>`).join("")}
            </select>
          </div>
          ${list.length ? `<div class="grid">${list.map(card).join("")}</div>` :
            `<div class="empty"><div class="big">💎</div><h3>Nothing here yet</h3><p>Try a different filter or search term.</p><a class="btn btn-primary" href="#/shop">See all jewellery</a></div>`}
        </div>
      </section>`;
    const apply = () => {
      const n = new URLSearchParams();
      if (q) n.set("q", params.get("q"));
      $$('#filters input[name="cat"]:checked').forEach(i => n.append("cat", i.value));
      const pr = $('#filters input[name="price"]:checked')?.value || "";
      if (pr) { const [a, b] = pr.split("-"); if (a) n.set("min", a); if (b) n.set("max", b); }
      const o = $('#filters input[name="occ"]:checked')?.value; if (o) n.set("occ", o);
      if (f.tag) n.set("tag", f.tag);
      const s = $("#sortSel").value; if (s !== "featured") n.set("sort", s);
      location.hash = "#/shop" + (n.toString() ? "?" + n : "");
    };
    $("#filters").addEventListener("change", apply);
    $("#sortSel").addEventListener("change", apply);
    $("#clearFilters").onclick = () => location.hash = "#/shop";
    $("#filterToggle").onclick = () => { $("#filters").classList.add("open"); $("#overlay").classList.add("show"); };
  }

  function viewProduct(id) {
    const p = byId(id);
    if (!p) return viewNotFound();
    state.recent = [p.id, ...state.recent.filter(x => x !== p.id)].slice(0, 12); store.set("recent", state.recent);
    const off = pctOff(p), sold = p.stock <= 0;
    const imgs = (p.images?.length ? p.images : [placeholder(p.category, 0), placeholder(p.category, 1)]);
    const related = state.products.filter(x => x.id !== p.id && (x.category === p.category || x.occasion === p.occasion)).slice(0, 4);
    const bestCoupon = Object.entries(CFG.coupons || {})[0];
    let qty = 1;
    document.title = `${p.name} — ${CFG.brand}`;
    app.innerHTML = `
      <section class="container" style="padding-top:20px"><div class="crumbs"><a href="#/">Home</a> / <a href="#/shop?cat=${p.category}">${esc(catName(p.category))}</a> / ${esc(p.name)}</div></section>
      <section class="container pdp">
        <div class="gallery">
          <div class="thumbs">${imgs.map((src, i) => `<button class="${i ? "" : "on"}" data-i="${i}"><img src="${src}" alt=""></button>`).join("")}</div>
          <div class="main-img" id="mainImg"><img src="${imgs[0]}" alt="${esc(p.name)}"></div>
        </div>
        <div class="pdp-info">
          <span class="card-meta">${esc(catName(p.category))}${p.metal ? " · " + esc(p.metal) : ""}</span>
          <h1>${esc(p.name)}</h1>
          <div class="pdp-price"><span class="price">${money(p.price)}</span>${off ? `<span class="mrp">MRP ${money(p.mrp)}</span><span class="off">You save ${money(p.mrp - p.price)} (${off}%)</span>` : ""}</div>
          <div class="tax-note">Inclusive of all taxes</div>
          ${bestCoupon ? `<div class="offer-box">🎁 Extra <b>${esc(bestCoupon[1].label)}</b> with code <b>${esc(bestCoupon[0])}</b> at checkout</div>` : ""}
          <div class="stock-note ${sold ? "low" : p.stock <= 5 ? "low" : "ok"}">${sold ? "Currently sold out" : p.stock <= 5 ? `Only ${p.stock} left — order soon` : "✓ In stock, ready to ship"}</div>
          <div class="pdp-actions">
            <div class="qty"><button data-q="-1" aria-label="Decrease">−</button><span id="qtyVal">1</span><button data-q="1" aria-label="Increase">+</button></div>
            <button class="btn btn-outline" id="pdpAdd" ${sold ? "disabled" : ""}>Add to Bag</button>
            <button class="btn btn-primary" id="pdpBuy" ${sold ? "disabled" : ""}>Buy Now</button>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-outline wish-inline ${state.wish.includes(p.id) ? "on" : ""}" data-act="wish" data-id="${esc(p.id)}">${state.wish.includes(p.id) ? "♥ Saved" : "♡ Save to Wishlist"}</button>
            <a class="btn btn-wa" target="_blank" rel="noopener" href="${waLink(`Hi! I'm interested in "${p.name}" (${p.id}) — ${location.href}`)}">Ask on WhatsApp</a>
          </div>
          <div class="pdp-perks">
            <div class="perk">${icon.shield} Authenticity certificate</div>
            <div class="perk">${icon.return} 7-day easy returns</div>
            <div class="perk">${icon.truck} Free shipping over ${money(CFG.freeShippingAbove)}</div>
            <div class="perk">${icon.gift} Gift-ready packaging</div>
          </div>
          <details class="acc" open><summary>Description</summary><p>${esc(p.description)}</p></details>
          <details class="acc"><summary>Product details</summary><ul>
            <li>Product code: ${esc(p.id)}</li>${p.metal ? `<li>Material: ${esc(p.metal)}</li>` : ""}${p.occasion ? `<li>Best for: ${esc(p.occasion)}</li>` : ""}</ul></details>
          <details class="acc"><summary>Care tips</summary><p>Store in the pouch provided, away from moisture. Put it on after perfume and lotions. Wipe gently with a soft cloth after wearing.</p></details>
          <details class="acc"><summary>Shipping &amp; returns</summary><p>Dispatched in 1–2 working days, delivered in 3–7 days across India. Returns accepted within 7 days of delivery in original condition. <a href="#/page/returns" style="color:var(--rose)">Read the policy</a>.</p></details>
        </div>
      </section>
      ${related.length ? `<section class="section container"><div class="section-head"><div><h2>You may also love</h2></div></div><div class="grid">${related.map(card).join("")}</div></section>` : ""}`;
    $$(".thumbs button").forEach(b => b.onclick = () => {
      $$(".thumbs button").forEach(x => x.classList.toggle("on", x === b));
      $("#mainImg img").src = imgs[+b.dataset.i];
    });
    const main = $("#mainImg");
    main.addEventListener("mousemove", e => { const r = main.getBoundingClientRect(); const im = main.firstElementChild; im.style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`; im.style.transform = "scale(1.8)"; });
    main.addEventListener("mouseleave", () => main.firstElementChild.style.transform = "");
    $$(".qty [data-q]").forEach(b => b.onclick = () => { qty = Math.max(1, Math.min(p.stock || 1, qty + +b.dataset.q)); $("#qtyVal").textContent = qty; });
    $("#pdpAdd").onclick = () => addToCart(p.id, qty);
    $("#pdpBuy").onclick = () => {
      const line = state.cart.find(l => l.id === p.id);
      if (!line) { addToCart(p.id, qty, false); }
      location.hash = "#/checkout";
    };
  }

  function viewCheckout() {
    const t = totals();
    if (!t.lines.length) {
      app.innerHTML = `<section class="container empty" style="padding:90px 0"><div class="big">🛍️</div><h2>Your bag is empty</h2><p>Let's find something you'll love.</p><a class="btn btn-primary" href="#/shop">Start shopping</a></section>`;
      return;
    }
    const u = state.user || {}, saved = store.get("address", {});
    const demo = !CFG.orderApiUrl;
    const onlineOn = demo || !!CFG.razorpayKeyId;
    const upiOn = !!upiInfo().id;
    const firstPay = upiOn ? "upi" : onlineOn ? "online" : "cod";
    if (!sessionStorage.getItem("asj_ckv")) { try { sessionStorage.setItem("asj_ckv", "1"); } catch {} track("Viewed checkout", t.lines.map(l => `${l.p.name} × ${l.qty}`).join(", "), t.total); }
    app.innerHTML = `
      <section class="container page-head"><div class="crumbs"><a href="#/">Home</a> / Checkout</div><h1>Checkout</h1></section>
      <section class="container checkout">
        <form id="checkoutForm" novalidate>
          ${demo ? `<div class="demo-banner"><b>Demo mode:</b> no real payment is taken. Add your Razorpay key and order API in <code>js/config.js</code> to accept payments.</div>` : ""}
          <div class="panel">
            <h3><span class="step-no">1</span> Contact</h3>
            ${state.user ? `<p class="muted" style="margin-top:0">Signed in as <b>${esc(u.email)}</b></p>` : `<p class="muted" style="margin-top:0">Have an account? <a href="#" data-act="account" style="color:var(--rose);font-weight:600">Login</a> for faster checkout — or continue as guest.</p>`}
            <div class="form-grid">
              <label class="field">Full name<input name="name" required autocomplete="name" placeholder=" " value="${esc(saved.name || u.name || "")}"></label>
              <label class="field">Mobile number<input name="phone" required inputmode="numeric" pattern="[6-9][0-9]{9}" maxlength="10" autocomplete="tel-national" placeholder=" " value="${esc(saved.phone || "")}"></label>
              <label class="field full">Email<input name="email" type="email" required autocomplete="email" placeholder=" " value="${esc(saved.email || u.email || "")}"></label>
            </div>
          </div>
          <div class="panel">
            <h3><span class="step-no">2</span> Delivery address</h3>
            <div class="form-grid">
              <label class="field full">House / flat, street<input name="line1" required autocomplete="address-line1" placeholder=" " value="${esc(saved.line1 || "")}"></label>
              <label class="field full">Area, landmark<input name="line2" autocomplete="address-line2" placeholder=" " value="${esc(saved.line2 || "")}"></label>
              <label class="field">City<input name="city" required autocomplete="address-level2" placeholder=" " value="${esc(saved.city || "")}"></label>
              <label class="field">PIN code<input name="pincode" required inputmode="numeric" pattern="[1-9][0-9]{5}" maxlength="6" autocomplete="postal-code" placeholder=" " value="${esc(saved.pincode || "")}"></label>
              <label class="field full">State<select name="state" required>${STATES.map(s => `<option ${saved.state === s ? "selected" : ""} value="${s}">${s || "Select state"}</option>`).join("")}</select></label>
              <label class="field full">Gift message (optional)<textarea name="note" rows="2" placeholder="We'll handwrite it on a card">${esc(saved.note || "")}</textarea></label>
            </div>
          </div>
          <div class="panel">
            <h3><span class="step-no">3</span> Payment</h3>
            ${upiOn ? `<label class="pay-opt pay-upi"><input type="radio" name="pay" value="upi" ${firstPay === "upi" ? "checked" : ""}><div><b>Pay by UPI <span class="pay-tag">Recommended</span></b><small>Scan the QR or open GPay, PhonePe, Paytm · then share the payment screenshot on WhatsApp</small></div><span class="upi-apps" aria-hidden="true">UPI</span></label>` : ""}
            ${onlineOn ? `<label class="pay-opt"><input type="radio" name="pay" value="online" ${firstPay === "online" ? "checked" : ""}><div><b>Pay online</b><small>Cards, net banking, wallets — secured by Razorpay</small></div></label>` : ""}
            ${CFG.codAvailable || firstPay === "cod" ? `<label class="pay-opt"><input type="radio" name="pay" value="cod" ${firstPay === "cod" ? "checked" : ""}><div><b>Cash on Delivery</b><small>Pay when your order arrives</small></div></label>` : ""}
          </div>
        </form>
        <aside class="summary">
          <div class="panel">
            <h3>Order summary</h3>
            ${t.lines.map(l => `<div class="mini-item"><img src="${img(l.p)}" alt=""><div><div style="font-weight:600">${esc(l.p.name)}</div>
              <div class="qty sm"><button data-act="dec" data-id="${esc(l.id)}">−</button><span>${l.qty}</span><button data-act="inc" data-id="${esc(l.id)}">+</button></div></div><b>${money(l.p.price * l.qty)}</b></div>`).join("")}
            <div class="coupon"><input id="couponIn" placeholder="Coupon code" value="${esc(state.coupon)}" aria-label="Coupon code"><button class="btn btn-outline" id="couponBtn">${state.coupon && !t.couponError ? "Remove" : "Apply"}</button></div>
            ${t.couponError ? `<div class="stock-note low" style="margin:0 0 8px">${esc(t.couponError)}</div>` : ""}
            <div class="sum-row"><span>Subtotal (MRP ${money(t.mrpTotal)})</span><span>${money(t.subtotal)}</span></div>
            ${t.discount ? `<div class="sum-row" style="color:var(--emerald)"><span>Coupon ${esc(state.coupon)}</span><span>−${money(t.discount)}</span></div>` : ""}
            <div class="sum-row"><span>Shipping</span><span>${t.shipping ? money(t.shipping) : "FREE"}</span></div>
            <div class="sum-row total"><span>Total</span><span>${money(t.total)}</span></div>
            ${t.savings > 0 ? `<div class="save-note">🎉 You're saving ${money(t.savings)} on this order</div>` : ""}
            <button class="btn btn-primary btn-block" id="placeOrder">${icon.lock} Place order · ${money(t.total)}</button>
            <p class="muted" style="font-size:.78rem;text-align:center;margin:10px 0 0">By placing the order you agree to our <a href="#/page/terms">Terms</a> and <a href="#/page/returns">Return policy</a>.</p>
          </div>
        </aside>
      </section>`;
    $("#couponBtn").onclick = e => {
      e.preventDefault();
      if (state.coupon && !t.couponError) { state.coupon = ""; store.set("coupon", ""); return viewCheckout(); }
      const code = $("#couponIn").value.trim().toUpperCase();
      if (!CFG.coupons?.[code]) return toast("That coupon code isn't valid");
      state.coupon = code; store.set("coupon", code); toast(`Coupon ${code} applied 🎉`); viewCheckout();
    };
    $("#placeOrder").onclick = placeOrder;
  }

  /* ---------- Placing an order ---------- */
  function readForm() {
    const form = $("#checkoutForm");
    const bad = $$("input[required], select[required]", form).find(i => !i.checkValidity());
    if (bad) { bad.focus(); bad.scrollIntoView({ block: "center", behavior: "smooth" }); toast("Please check: " + bad.closest("label").childNodes[0].textContent.trim()); return null; }
    const d = Object.fromEntries(new FormData(form));
    store.set("address", d);
    return d;
  }
  async function api(body) {
    // text/plain avoids a CORS pre-flight, which Google Apps Script cannot answer
    const res = await fetch(CFG.orderApiUrl, { method: "POST", body: JSON.stringify(body) });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Something went wrong");
    return data;
  }
  function loadRazorpay() {
    return new Promise((ok, fail) => {
      if (window.Razorpay) return ok();
      const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = ok; s.onerror = () => fail(new Error("Could not load Razorpay. Check your internet connection."));
      document.head.appendChild(s);
    });
  }
  async function placeOrder(e) {
    e.preventDefault();
    const c = readForm(); if (!c) return;
    const t = totals(), btn = $("#placeOrder");
    const items = t.lines.map(l => ({ id: l.id, qty: l.qty }));
    const customer = { name: c.name, phone: c.phone, email: c.email, address: [c.line1, c.line2, c.city, c.state, c.pincode].filter(Boolean).join(", "), note: c.note };
    btn.disabled = true; btn.innerHTML = "Processing…";
    const reset = () => { btn.disabled = false; btn.innerHTML = `${icon.lock} Place order · ${money(t.total)}`; };
    try {
      if (c.pay === "upi") {
        let order;
        if (CFG.orderApiUrl) {
          const r = await api({ action: "upiOrder", items, coupon: state.coupon, customer });
          order = { orderNumber: r.orderNumber, total: r.amount / 100, upi: { id: r.upiId, name: r.upiName, wa: r.whatsapp || CFG.whatsappNumber } };
        } else {
          await new Promise(r => setTimeout(r, 600));
          order = { orderNumber: "DEMO-" + Date.now().toString(36).toUpperCase(), total: t.total, upi: upiInfo(), demo: true };
        }
        return finishOrder({ ...order, method: "upi", customerName: c.name }, "#/pay");
      }
      if (!CFG.orderApiUrl) {               // DEMO MODE
        await new Promise(r => setTimeout(r, 900));
        return finishOrder({ orderNumber: "DEMO-" + Date.now().toString(36).toUpperCase(), total: t.total, method: c.pay, demo: true });
      }
      if (c.pay === "cod") {
        const r = await api({ action: "cod", items, coupon: state.coupon, customer });
        return finishOrder({ orderNumber: r.orderNumber, total: r.amount / 100, method: "cod" });
      }
      await loadRazorpay();
      const r = await api({ action: "createOrder", items, coupon: state.coupon, customer });
      const rzp = new window.Razorpay({
        key: CFG.razorpayKeyId || r.keyId, amount: r.amount, currency: "INR", order_id: r.razorpayOrderId,
        name: CFG.brand, description: `Order ${r.orderNumber}`,
        prefill: { name: c.name, email: c.email, contact: c.phone },
        notes: { order_number: r.orderNumber }, theme: { color: "#e8456a" },
        handler: async resp => {
          btn.innerHTML = "Confirming payment…";
          try {
            await api({ action: "verify", ...resp });
            finishOrder({ orderNumber: r.orderNumber, total: r.amount / 100, method: "online", paymentId: resp.razorpay_payment_id });
          } catch (err) { toast("Payment received but not verified yet. We'll confirm on WhatsApp shortly."); reset(); }
        },
        modal: { ondismiss: () => { toast("Payment cancelled — your bag is saved"); api({ action: "paymentFailed", razorpay_order_id: r.razorpayOrderId, cancelled: true }).catch(() => {}); reset(); } }
      });
      rzp.on("payment.failed", resp => {
        toast("Payment failed: " + (resp.error?.description || "please try again"));
        api({ action: "paymentFailed", razorpay_order_id: r.razorpayOrderId, reason: resp.error?.description || "" }).catch(() => {});
        reset();
      });
      rzp.open();
    } catch (err) { console.error(err); toast(esc(err.message)); reset(); }
  }
  function finishOrder(order, next = "#/success") {
    const items = totals().lines.map(l => ({ id: l.id, name: l.p.name, qty: l.qty, price: l.p.price }));
    state.lastOrder = { ...order, items, date: new Date().toISOString(), email: state.user?.email || "", user: userKey(state.user) }; store.set("lastOrder", state.lastOrder);
    store.set("orders", [state.lastOrder, ...store.get("orders", [])].slice(0, 30));
    state.cart = []; state.coupon = ""; store.set("coupon", ""); saveCart();
    location.hash = next;
  }

  /* ---------- UPI payment screen (after a UPI order is placed) ---------- */
  async function viewPay() {
    const o = state.lastOrder;
    if (!o || o.method !== "upi") return viewNotFound();
    const u = o.upi || upiInfo();
    const link = upiLink(u, o.total, o.orderNumber);
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.matchMedia("(pointer: coarse)").matches;
    const proofMsg = `Hi ${CFG.brand}! I've paid for my order by UPI.\n\nOrder: ${o.orderNumber}\nAmount: ₹${Math.round(o.total).toLocaleString("en-IN")}\nName: ${o.customerName || ""}\nUPI transaction ID (UTR): \n\n(Payment screenshot attached)`;
    const proofLink = `https://wa.me/${u.wa || CFG.whatsappNumber}?text=${encodeURIComponent(proofMsg)}`;
    document.title = `Complete payment — ${CFG.brand}`;
    app.innerHTML = `
      <section class="container pay-wrap">
        <div class="pay-card">
          ${o.demo ? `<div class="demo-banner">Demo mode — this order was not saved. Add your UPI ID to test real payments.</div>` : ""}
          <span class="pill cod">Order ${esc(o.orderNumber)} · reserved for you</span>
          <h1>Complete your payment</h1>
          <div class="pay-amount">${money(o.total)}</div>
          <p class="muted">Pay to <b>${esc(u.name)}</b> using any UPI app</p>

          <div class="pay-steps">
            <div class="pay-step">
              <h3><span class="step-no">1</span> ${mobile ? "Pay with your UPI app" : "Scan & pay"}</h3>
              ${mobile ? `<a class="btn btn-primary btn-block" href="${esc(link)}" id="upiAppBtn">Pay ${money(o.total)} with UPI app</a>
                <p class="muted pay-small">Opens GPay, PhonePe, Paytm or your bank app with the amount filled in.</p>
                <details class="qr-more"><summary>Paying from another phone? Show QR code</summary><div class="qr-box" id="qrBox"></div></details>`
              : `<div class="qr-box" id="qrBox"><span class="muted">Loading QR…</span></div>
                <p class="muted pay-small">Open GPay, PhonePe, Paytm or any UPI app → Scan QR → pay ${money(o.total)}.</p>`}
              <div class="upi-id-row"><span>UPI ID: <b id="upiIdText">${esc(u.id || "—")}</b></span><button type="button" class="link-btn" id="copyUpi">Copy</button></div>
            </div>
            <div class="pay-step">
              <h3><span class="step-no">2</span> Send payment proof</h3>
              <p class="muted pay-small">After paying, share the screenshot or UPI transaction ID with us on WhatsApp. We'll confirm your order right away.</p>
              <a class="btn btn-wa btn-block" id="sendProof" href="${esc(proofLink)}" target="_blank" rel="noopener">I've paid — send proof on WhatsApp</a>
            </div>
          </div>
          <p class="muted pay-small">Your order is saved. If you need help, message us on WhatsApp with your order number.</p>
          <a class="guest-link" href="#/success" id="payDone">I've sent the proof — continue →</a>
        </div>
      </section>`;
    $("#copyUpi").onclick = async () => {
      try { await navigator.clipboard.writeText(u.id); toast("UPI ID copied"); }
      catch { const r = document.createRange(); r.selectNodeContents($("#upiIdText")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("UPI ID selected — copy it"); }
    };
    $("#sendProof").onclick = () => {
      track("Sent UPI proof on WhatsApp", o.orderNumber, o.total);
      o.proofSent = true; store.set("lastOrder", o);
      const list = store.get("orders", []); if (list[0]?.orderNumber === o.orderNumber) { list[0].proofSent = true; store.set("orders", list); }
      setTimeout(() => { $("#payDone")?.classList.add("pulse"); }, 600);
    };
    try {
      await loadScript("js/qrcode.js?v=9");
      const box = $("#qrBox"); if (box) box.innerHTML = window.ASQR.svg(link, { label: `UPI QR code to pay ${money(o.total)}` });
    } catch { const box = $("#qrBox"); if (box) box.innerHTML = `<p class="muted">QR couldn't load. Pay to the UPI ID below.</p>`; }
  }
  function viewSuccess() {
    const o = state.lastOrder;
    if (!o) return viewNotFound();
    app.innerHTML = `<section class="container success">
      <div class="tick">${icon.check}</div>
      <h1>Thank you${state.user ? ", " + esc(firstName(state.user)) : ""}! 💖</h1>
      <p>${o.method === "upi"
        ? `Your order <b>${esc(o.orderNumber)}</b> for <b>${money(o.total)}</b> is placed. We'll confirm it as soon as we check your UPI payment.`
        : `Your order <b>${esc(o.orderNumber)}</b> for <b>${money(o.total)}</b> is confirmed${o.method === "cod" ? " (Cash on Delivery)" : ""}.`}</p>
      ${o.method === "upi" && !o.proofSent ? `<p><a class="btn btn-outline" href="#/pay">Haven't paid yet? Go back to payment</a></p>` : ""}
      ${o.demo ? `<p class="demo-banner">This was a demo order — no payment was taken and nothing was saved.</p>` : `<p class="muted">We'll send updates on WhatsApp and email. Dispatch in 1–2 working days.</p>`}
      <div class="hero-ctas" style="justify-content:center">
        <a class="btn btn-primary" href="#/shop">Continue shopping</a>
        <a class="btn btn-wa" target="_blank" rel="noopener" href="${waLink(`Hi! I just placed order ${o.orderNumber}.`)}">Track on WhatsApp</a>
      </div></section>`;
    confetti();
  }
  function confetti() {
    const colors = ["#e8456a", "#3d9a5b", "#861a38", "#bde8c6", "#ff9db0", "#2b1a1e"];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement("i"); c.className = "confetti";
      c.style.cssText = `left:${Math.random() * 100}vw;background:${colors[i % colors.length]};animation-duration:${2 + Math.random() * 2.5}s;animation-delay:${Math.random() * .6}s;border-radius:${Math.random() > .5 ? "50%" : "2px"}`;
      document.body.appendChild(c); setTimeout(() => c.remove(), 5500);
    }
  }

  /* ---------- Policy pages (edit text before going live) ---------- */
  const pages = {
    shipping: ["Shipping Policy", `<p>We ship across India. Orders are dispatched within 1–2 working days and usually arrive within 3–7 working days, depending on your PIN code.</p><p>Shipping is free on orders above ${money(CFG.freeShippingAbove)}. A fee of ${money(CFG.shippingFee)} applies to smaller orders. You'll receive tracking details by WhatsApp/email once your order ships.</p>`],
    returns: ["Returns & Refunds", `<p>If you're not happy with your purchase, you can request a return within 7 days of delivery. Items must be unused, in original packaging, with the authenticity card.</p><p>Earrings and nose pins cannot be returned for hygiene reasons unless they arrive damaged. Refunds are issued to the original payment method within 5–7 working days after we receive and check the item. For COD orders we refund to your bank account or UPI.</p><p>To start a return, message us on WhatsApp with your order number.</p>`],
    terms: ["Terms & Conditions", `<p>This website is operated by ${esc(CFG.brand)}. By placing an order you agree to these terms.</p><h2>Pricing</h2><p>All prices are in Indian Rupees and include applicable taxes. We may correct pricing errors and cancel affected orders with a full refund.</p><h2>Orders</h2><p>An order is confirmed when payment succeeds (or, for COD, when we confirm by phone/WhatsApp). We may cancel orders that look fraudulent.</p><h2>Product images</h2><p>We photograph every piece carefully, but colours may vary slightly between screens.</p><h2>Governing law</h2><p>These terms are governed by the laws of India.</p>`],
    privacy: ["Privacy Policy", `<p>We collect only what we need to fulfil your order: your name, phone, email and address. If you sign in with Google we receive your name, email and profile photo.</p><p>Payments are processed by Razorpay; we never see or store your card or UPI details. We do not sell your data. We use your contact details to send order updates and, if you opt in, occasional offers.</p><p>To have your data deleted, email ${esc(CFG.supportEmail)}.</p>`],
    contact: ["Contact Us", `<p>We'd love to help you choose the perfect piece.</p><ul><li>WhatsApp / Phone: ${esc(CFG.supportPhone)}</li><li>Email: ${esc(CFG.supportEmail)}</li><li>Address: ${esc(CFG.businessAddress)}</li></ul><p><a class="btn btn-wa" target="_blank" rel="noopener" href="${waLink("Hi AS Jewels!")}">Chat on WhatsApp</a></p>`]
  };
  function viewPage(slug) {
    const pg = pages[slug]; if (!pg) return viewNotFound();
    app.innerHTML = `<section class="container policy"><div class="crumbs"><a href="#/">Home</a> / ${pg[0]}</div><h1>${pg[0]}</h1>${pg[1]}</section>`;
  }
  function viewNotFound() {
    app.innerHTML = `<section class="container empty" style="padding:90px 0"><div class="big">🔍</div><h2>We couldn't find that page</h2><a class="btn btn-primary" href="#/">Back to home</a></section>`;
  }

  /* ---------- Drawers ---------- */
  function renderCart() {
    const t = totals();
    const left = CFG.freeShippingAbove - (t.subtotal - t.discount);
    $("#shipMeter").innerHTML = t.lines.length ? (left > 0 ? `Add <b>${money(left)}</b> more for <b>FREE shipping</b> 🚚` : `🎉 Yay! You've unlocked <b>FREE shipping</b>`) +
      `<div class="meter"><i style="width:${Math.min(100, (t.subtotal - t.discount) / CFG.freeShippingAbove * 100)}%"></i></div>` : "";
    $("#shipMeter").style.display = t.lines.length ? "" : "none";
    $("#cartBody").innerHTML = t.lines.length ? t.lines.map(l => `
      <div class="line-item"><a href="#/product/${encodeURIComponent(l.id)}"><img src="${img(l.p)}" alt=""></a>
        <div><div class="title">${esc(l.p.name)}</div><div><span class="price">${money(l.p.price)}</span> ${pctOff(l.p) ? `<span class="mrp">${money(l.p.mrp)}</span>` : ""}</div>
          <div class="row"><div class="qty sm"><button data-act="dec" data-id="${esc(l.id)}" aria-label="Decrease">−</button><span>${l.qty}</span><button data-act="inc" data-id="${esc(l.id)}" aria-label="Increase">+</button></div>
          <button class="remove" data-act="remove" data-id="${esc(l.id)}">Remove</button></div></div></div>`).join("")
      : `<div class="empty"><div class="big">🛍️</div><h3>Your bag is empty</h3><p>Pieces you add will sparkle here.</p><a class="btn btn-primary" href="#/shop">Start shopping</a></div>`;
    $("#cartFoot").innerHTML = t.lines.length ? `
      <div class="sum-row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
      <div class="sum-row"><span>Shipping</span><span>${t.shipping ? money(t.shipping) : "FREE"}</span></div>
      ${t.savings > 0 ? `<div class="save-note">You're saving ${money(t.savings)} ✨</div>` : ""}
      <a class="btn btn-primary btn-block" href="#/checkout">Checkout · ${money(t.total)}</a>` : "";
    $("#cartFoot").style.display = t.lines.length ? "" : "none";
  }
  function renderWish() {
    const items = state.wish.map(byId).filter(Boolean);
    $("#wishBody").innerHTML = items.length ? items.map(p => `
      <div class="line-item"><a href="#/product/${encodeURIComponent(p.id)}"><img src="${img(p)}" alt=""></a>
        <div><div class="title">${esc(p.name)}</div><span class="price">${money(p.price)}</span>
          <div class="row"><button class="btn btn-primary" style="padding:8px 16px;font-size:.8rem" data-act="move" data-id="${esc(p.id)}" ${p.stock <= 0 ? "disabled" : ""}>Move to bag</button>
          <button class="remove" data-act="wish" data-id="${esc(p.id)}">Remove</button></div></div></div>`).join("")
      : `<div class="empty"><div class="big">💖</div><h3>Nothing saved yet</h3><p>Tap the heart on any piece to save it here.</p></div>`;
  }

  /* ---------- Google Sign-In ---------- */
  function decodeJwt(t) { try { return JSON.parse(decodeURIComponent(escape(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))))); } catch { return null; } }
  function renderAccountIcon() {
    $("#accountIcon").innerHTML = state.user?.picture ? `<img src="${esc(state.user.picture)}" alt="" referrerpolicy="no-referrer">` :
      `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>`;
  }
  function openAccount() {
    closeAll();
    if (!state.user && location.hash.startsWith("#/checkout")) { try { sessionStorage.setItem("asj_return", "#/checkout"); } catch {} }
    if (location.hash.startsWith("#/account")) viewAccount(); else location.hash = "#/account";
  }
  const firstName = u => ((u && u.name) || "").trim().split(" ")[0];
  const userKey = u => (u && (u.email || u.phone)) || "";
  // Runs after a successful Google sign-in
  function afterLogin() {
    renderAccountIcon(); closeAll();
    toast(`Welcome${firstName(state.user) ? ", " + esc(firstName(state.user)) : ""}! ✨`);
    let back = ""; try { back = sessionStorage.getItem("asj_return") || ""; sessionStorage.removeItem("asj_return"); } catch {}
    if (back && back !== location.hash) location.hash = back;
    else if (location.hash.startsWith("#/checkout")) viewCheckout();
    else viewAccount();
  }

  /* ---------- Login page (shown only on My Account when signed out) ---------- */
  function viewLogin() {
    document.title = `Login — ${CFG.brand}`;
    app.innerHTML = `
      <section class="container login-wrap">
        <div class="login-card">
          <div class="login-gem">${icon.sparkle}</div>
          <h1>Login or Sign up</h1>
          <p class="muted">Save your address, see your orders and check out in seconds.</p>
          <div class="gsi-wrap" id="gsiBtn"></div>
          ${CFG.googleClientId ? "" : `<div class="note"><b>Setup needed:</b> add your Google Client ID to <code>googleClientId</code> in <code>js/config.js</code>.</div>`}
          <ul class="login-perks">
            <li>${icon.truck} Address saved for faster checkout</li>
            <li>${icon.gift} Track all your orders in one place</li>
            <li>${icon.heart} Keep your wishlist on any visit</li>
          </ul>
          <p class="terms">By continuing, you accept our <a href="#/page/privacy">Privacy Policy</a> and <a href="#/page/terms">T&amp;Cs</a>.</p>
          <a class="guest-link" href="#/shop">Continue shopping as guest →</a>
        </div>
      </section>`;
    if (CFG.googleClientId) initGoogle().then(() => {
      const box = $("#gsiBtn"); if (!box) return;
      window.google.accounts.id.renderButton(box, { theme: "outline", size: "large", shape: "pill", text: "continue_with", logo_alignment: "center", width: Math.min(320, box.clientWidth || 320) });
    }).catch(() => toast("Google Sign-In couldn't load. Check your internet."));
  }

  function signOut() {
    state.user = null; store.set("user", null); store.set("cred", null);
    try { window.google?.accounts.id.disableAutoSelect(); } catch {}
    renderAccountIcon(); closeAll(); toast("Signed out");
    if (location.hash.startsWith("#/account")) location.hash = "#/";
  }

  /* ---------- My Account (tabs: profile · address · orders · wishlist) ---------- */
  function viewAccount(tab = "profile") {
    const u = state.user;
    if (!u) return viewLogin();
    const a = store.get("address", {});
    const orders = store.get("orders", []).filter(o => !(o.user || o.email) || o.user === userKey(u) || o.email === u.email);
    const wish = state.wish.map(byId).filter(Boolean);
    const tabs = [
      ["profile", "My Profile", icon.user, ""],
      ["address", "Address", icon.pin, ""],
      ["orders", "My Orders", icon.bag, orders.length],
      ["wishlist", "Wishlist", icon.heart, wish.length]
    ];
    if (!tabs.some(t => t[0] === tab)) tab = "profile";
    const pct = Math.round([a.name || u.name, a.phone, a.line1, a.city, a.pincode, a.state].filter(Boolean).length / 6 * 100);
    const hasAddress = a.line1 && a.city && a.pincode;
    const status = o => o.demo ? ["Demo", "demo"] : o.method === "cod" ? ["Cash on Delivery", "cod"] : o.method === "upi" ? ["UPI – verifying", "cod"] : ["Paid", "paid"];
    document.title = `My Account — ${CFG.brand}`;

    const panels = {
      profile: `
        <form class="acc-form" novalidate>
          <div class="acc-head"><h2>Personal details</h2><p class="muted">Used for your orders and delivery updates.</p></div>
          <div class="form-grid">
            <label class="field">Full name<input name="name" required autocomplete="name" placeholder="Your full name" value="${esc(a.name || u.name || "")}"></label>
            <label class="field">Mobile number<span class="with-cc"><span>+91</span><input name="phone" inputmode="numeric" pattern="[6-9][0-9]{9}" maxlength="10" autocomplete="tel-national" placeholder="10-digit mobile" value="${esc(a.phone || "")}"></span></label>
            <label class="field">Email<input type="email" value="${esc(u.email)}" readonly><small class="hint">From your Google account</small></label>
            <label class="field">Birthday <small class="hint">(optional — for a birthday surprise)</small><input name="birthday" type="date" value="${esc(a.birthday || "")}"></label>
          </div>
          <div class="acc-actions"><button class="btn btn-primary" type="submit">Save details</button><span class="save-note muted"></span></div>
        </form>`,
      address: `
        <form class="acc-form" novalidate>
          <div class="acc-head"><h2>Delivery address</h2><p class="muted">We'll fill this in for you at checkout.</p></div>
          ${hasAddress ? `<div class="addr-card"><span class="pill paid">Default</span><b>${esc(a.name || u.name)}</b><span>${esc([a.line1, a.line2].filter(Boolean).join(", "))}</span><span>${esc(a.city)}, ${esc(a.state || "")} – ${esc(a.pincode)}</span>${a.phone ? `<span>Mobile: +91 ${esc(a.phone)}</span>` : ""}</div>` : ""}
          <div class="form-grid">
            <label class="field full">House / flat no., building, street<input name="line1" required autocomplete="address-line1" placeholder="e.g. 12, Rose Apartments, MG Road" value="${esc(a.line1 || "")}"></label>
            <label class="field full">Area, landmark <small class="hint">(optional)</small><input name="line2" autocomplete="address-line2" placeholder="e.g. Near City Mall" value="${esc(a.line2 || "")}"></label>
            <label class="field">City<input name="city" required autocomplete="address-level2" placeholder="City" value="${esc(a.city || "")}"></label>
            <label class="field">PIN code<input name="pincode" required inputmode="numeric" pattern="[1-9][0-9]{5}" maxlength="6" autocomplete="postal-code" placeholder="6 digits" value="${esc(a.pincode || "")}"></label>
            <label class="field full">State<select name="state" required>${STATES.map(s => `<option ${a.state === s ? "selected" : ""} value="${s}">${s || "Select state"}</option>`).join("")}</select></label>
          </div>
          <div class="acc-actions"><button class="btn btn-primary" type="submit">${hasAddress ? "Update address" : "Save address"}</button><span class="save-note muted"></span></div>
        </form>`,
      orders: `
        <div class="acc-head"><h2>My orders</h2><p class="muted">Orders placed on this device.</p></div>
        ${orders.length ? `<div class="order-list">${orders.map(o => { const [label, cls] = status(o); return `
          <div class="order-row">
            <div class="order-thumbs">${(o.items || []).slice(0, 3).map(i => { const p = byId(i.id); return `<img src="${p ? img(p) : placeholder("rings")}" alt="">`; }).join("")}</div>
            <div class="order-info"><b>${esc(o.orderNumber)}</b><span class="muted">${new Date(o.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ${(o.items || []).reduce((s, i) => s + i.qty, 0)} item(s)</span>
              <span class="order-items">${(o.items || []).map(i => `${esc(i.name)} × ${i.qty}`).join(", ")}</span></div>
            <div class="order-end"><b>${money(o.total)}</b><span class="pill ${cls}">${label}</span></div>
          </div>`; }).join("")}</div>
          <a class="btn btn-wa acc-help" target="_blank" rel="noopener" href="${waLink(`Hi! Please share the status of my order ${orders[0].orderNumber}.`)}">Track an order on WhatsApp</a>`
        : `<div class="acc-empty"><div class="big">🛍️</div><p>You haven't placed an order yet.</p><a class="btn btn-primary" href="#/shop">Start shopping</a></div>`}`,
      wishlist: `
        <div class="acc-head"><h2>Wishlist</h2><p class="muted">Pieces you've saved with ♡.</p></div>
        ${wish.length ? `<div class="grid grid-sm">${wish.map(card).join("")}</div>`
        : `<div class="acc-empty"><div class="big">💖</div><p>Nothing saved yet. Tap the heart on any piece.</p><a class="btn btn-primary" href="#/shop">Browse jewellery</a></div>`}`
    };

    app.innerHTML = `
      <section class="container acc-wrap">
        <div class="acc-hero">
          <div class="acc-id">
            ${u.picture ? `<img class="acc-avatar" src="${esc(u.picture)}" alt="" referrerpolicy="no-referrer">` : `<div class="acc-avatar acc-initial">${esc((u.name || "A")[0].toUpperCase())}</div>`}
            <div class="acc-id-text"><span class="acc-kicker">My Account</span><h1>Hi, ${esc(firstName(u) || "there")}!</h1><p>${esc(u.email)}</p></div>
          </div>
          <div class="acc-hero-side">
            <div class="acc-complete"><span>Profile ${pct}% complete</span><div class="acc-meter"><i style="width:${pct}%"></i></div></div>
            <button class="acc-signout" id="signOutBtn" type="button">Sign out</button>
          </div>
        </div>
        <nav class="acc-tabs" aria-label="Account sections">
          ${tabs.map(([id, label, ic, n]) => `<a href="#/account/${id}" class="${id === tab ? "on" : ""}" ${id === tab ? 'aria-current="page"' : ""}>${ic}<span>${label}</span>${n !== "" ? `<b>${n}</b>` : ""}</a>`).join("")}
        </nav>
        <div class="acc-panel">${panels[tab]}</div>
      </section>`;

    $("#signOutBtn").onclick = signOut;
    const form = $(".acc-form");
    if (form) form.onsubmit = async e => {
      e.preventDefault();
      const bad = $$("input[name], select[name]", form).find(i => !i.checkValidity());
      if (bad) { bad.focus(); toast("Please check: " + bad.closest("label").childNodes[0].textContent.trim()); return; }
      const saved = { ...store.get("address", {}), ...Object.fromEntries(new FormData(form)), email: u.email, savedAt: new Date().toISOString() };
      store.set("address", saved);
      if (saved.name) { state.user.name = saved.name; store.set("user", state.user); }
      toast("Saved ✨");
      const note = $(".save-note", form); note.textContent = "Saved ✓";
      const cred = store.get("cred", null);
      if (CFG.orderApiUrl && cred) {
        try {
          await api({ action: "profile", credential: cred, profile: { name: saved.name, phone: saved.phone, birthday: saved.birthday || "",
            address: [saved.line1, saved.line2, saved.city, saved.state, saved.pincode].filter(Boolean).join(", ") } });
          note.textContent = "Saved ✓ and synced to the store";
        } catch { note.textContent = "Saved ✓ (sign in again to sync with the store)"; }
      }
      setTimeout(() => viewAccount(tab), 900);
    };
  }

  let gsiReady;
  function initGoogle() {
    if (gsiReady) return gsiReady;
    gsiReady = new Promise((ok, fail) => {
      const s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true;
      s.onload = () => {
        window.google.accounts.id.initialize({
          client_id: CFG.googleClientId,
          callback: resp => {
            const p = decodeJwt(resp.credential); if (!p) return toast("Sign-in failed");
            state.user = { name: p.name || p.email, email: p.email, picture: p.picture };
            store.set("user", state.user); store.set("cred", resp.credential);
            // Record the sign-in in the "Customers" tab of your Google Sheet (needs orderApiUrl)
            if (CFG.orderApiUrl) api({ action: "login", credential: resp.credential }).catch(err => console.warn("Customer log failed:", err.message));
            afterLogin();
          }
        });
        ok();
      };
      s.onerror = fail; document.head.appendChild(s);
    });
    return gsiReady;
  }

  /* ---------- Router ---------- */
  function route() {
    clearInterval(heroTimer);
    $$(".confetti").forEach(c => c.remove());
    const [path, qs] = (location.hash.slice(1) || "/").split("?");
    const parts = path.split("/").filter(Boolean), params = new URLSearchParams(qs || "");
    document.title = `${CFG.brand} — ${CFG.tagline}`;
    closeAll();
    if (!parts.length) viewHome();
    else if (parts[0] === "shop") viewShop(params);
    else if (parts[0] === "product") viewProduct(decodeURIComponent(parts[1] || ""));
    else if (parts[0] === "checkout") viewCheckout();
    else if (parts[0] === "success") viewSuccess();
    else if (parts[0] === "pay") viewPay();
    else if (parts[0] === "page") viewPage(parts[1]);
    else if (parts[0] === "account") viewAccount(parts[1]);
    else viewNotFound();
    const cat = params.get("cat");
    $$("#catNav a").forEach(a => a.classList.toggle("active", parts[0] === "shop" && a.dataset.cat === cat));
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    observeReveal();
  }
  let io;
  function observeReveal() {
    if (!("IntersectionObserver" in window)) return $$(".reveal").forEach(el => el.classList.add("in"));
    io?.disconnect();
    io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .08 });
    $$(".reveal").forEach(el => io.observe(el));
  }

  /* ---------- Global events ---------- */
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-act]");
    if (a) {
      const id = a.dataset.id;
      switch (a.dataset.act) {
        case "add": e.preventDefault(); addToCart(id); break;
        case "wish": e.preventDefault(); toggleWish(id);
          if (a.classList.contains("wish-inline")) { const on = state.wish.includes(id); a.classList.toggle("on", on); a.textContent = on ? "♥ Saved" : "♡ Save to Wishlist"; } break;
        case "inc": setQty(id, (state.cart.find(l => l.id === id)?.qty || 0) + 1); break;
        case "dec": setQty(id, (state.cart.find(l => l.id === id)?.qty || 0) - 1); break;
        case "remove": setQty(id, 0); break;
        case "move": state.wish = state.wish.filter(x => x !== id); store.set("wish", state.wish); renderWish(); updateBadges(); addToCart(id); break;
        case "account": e.preventDefault(); openAccount(); break;
        case "wishlist": openDrawer("wishDrawer"); break;
      }
      return;
    }
    if (e.target.closest("[data-close]") || e.target === $("#overlay")) closeAll();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeAll(); });
  $("#cartBtn").onclick = () => openDrawer("cartDrawer");
  $("#wishBtn").onclick = () => openDrawer("wishDrawer");
  $("#menuBtn").onclick = () => openDrawer("menuDrawer");
  $("#accountBtn").onclick = openAccount;
  $("#menuDrawer").addEventListener("click", e => { if (e.target.closest("a")) closeAll(); });
  $("#searchForm").onsubmit = e => { e.preventDefault(); const q = $("#searchInput").value.trim(); location.hash = "#/shop" + (q ? "?q=" + encodeURIComponent(q) : ""); $("#searchInput").blur(); };
  $("#newsletter").onsubmit = e => { e.preventDefault(); e.target.reset(); toast("You're on the list! 💌 Watch your inbox for early offers."); };
  window.addEventListener("scroll", () => $("#siteHeader").classList.toggle("scrolled", scrollY > 10), { passive: true });
  window.addEventListener("hashchange", route);

  /* ---------- Start ---------- */
  (async () => {
    app.innerHTML = `<div class="empty" style="padding:120px 0"><div class="big">💎</div><p>Polishing the display…</p></div>`;
    state.products = await loadProducts();
    state.cart = state.cart.filter(l => byId(l.id));
    renderChrome(); renderCart(); renderWish(); updateBadges(); route();
  })();
})();
