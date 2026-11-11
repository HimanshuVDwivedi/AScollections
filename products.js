/* =========================================================
   AS JEWELS — PRODUCT LIST
   ---------------------------------------------------------
   Add one block per product. Fields:
     id        unique short code, no spaces        "R001"
     name      product name                         "Rose Halo Ring"
     category  rings | earrings | necklaces | pendants | bracelets | bangles | anklets | sets
     price     SALE price you charge (number)       1499
     mrp       original / regular price (number)    2999
     images    list of image paths, first = main    ["images/r001-1.jpg", "images/r001-2.jpg"]
               (leave [] to show a placeholder until you upload photos)
     metal     "925 Silver" / "Gold Plated" / "Rose Gold Plated" / "18K Gold" ...
     occasion  everyday | party | wedding | gifting | office
     tags      any of: "bestseller", "new", "trending"
     stock     how many you have (0 = sold out)
     description  a short paragraph
   NOTE: these are SAMPLE products — replace them with yours.
   ========================================================= */
window.AS_PRODUCTS = [
  { id: "R001", name: "Rose Halo Solitaire Ring", category: "rings", price: 1499, mrp: 2999, images: [], metal: "Rose Gold Plated 925 Silver", occasion: "gifting", tags: ["bestseller"], stock: 12,
    description: "A single brilliant stone wrapped in a delicate halo, finished in warm rose gold. Adjustable band for an easy fit." },
  { id: "R002", name: "Twin Leaf Stackable Ring", category: "rings", price: 999, mrp: 1899, images: [], metal: "925 Silver", occasion: "everyday", tags: ["new"], stock: 20,
    description: "Two tiny leaves meeting on a slim band. Stack it, gift it, wear it every day." },
  { id: "E001", name: "Dewdrop Pearl Studs", category: "earrings", price: 899, mrp: 1799, images: [], metal: "925 Silver", occasion: "office", tags: ["bestseller"], stock: 30,
    description: "Lustrous freshwater-style pearls on sterling silver posts. The pair that goes with everything." },
  { id: "E002", name: "Mor Pankh Jhumkas", category: "earrings", price: 1899, mrp: 3499, images: [], metal: "Gold Plated", occasion: "wedding", tags: ["trending"], stock: 8,
    description: "Peacock-feather inspired jhumkas with enamel detailing and tiny bead drops that dance as you move." },
  { id: "E003", name: "Sunlit Hoop Earrings", category: "earrings", price: 1199, mrp: 2199, images: [], metal: "18K Gold Plated", occasion: "party", tags: [], stock: 15,
    description: "Lightweight chunky hoops with a high-polish finish that catches every bit of light." },
  { id: "N001", name: "Emerald Drop Necklace", category: "necklaces", price: 2499, mrp: 4999, images: [], metal: "Gold Plated", occasion: "party", tags: ["bestseller", "trending"], stock: 6,
    description: "A teardrop of deep emerald green on a fine link chain — a quiet statement for evenings out." },
  { id: "N002", name: "Rani Kundan Choker Set", category: "sets", price: 3999, mrp: 7999, images: [], metal: "Gold Plated", occasion: "wedding", tags: ["new"], stock: 4,
    description: "A kundan choker with matching earrings, made for haldi, mehendi and every celebration after." },
  { id: "P001", name: "Infinity Heart Pendant", category: "pendants", price: 1299, mrp: 2599, images: [], metal: "925 Silver", occasion: "gifting", tags: ["bestseller"], stock: 25,
    description: "An infinity loop that becomes a heart. Comes with an 18-inch link chain and a gift box." },
  { id: "P002", name: "Evil Eye Charm Pendant", category: "pendants", price: 999, mrp: 1999, images: [], metal: "925 Silver", occasion: "everyday", tags: ["trending"], stock: 18,
    description: "A protective blue evil eye framed in sparkling stones. Layer it or wear it alone." },
  { id: "B001", name: "Tennis Sparkle Bracelet", category: "bracelets", price: 2199, mrp: 4299, images: [], metal: "Rhodium Plated 925 Silver", occasion: "party", tags: ["bestseller"], stock: 9,
    description: "A continuous line of brilliant-cut stones with a secure box clasp." },
  { id: "BG01", name: "Filigree Kada Bangle", category: "bangles", price: 1799, mrp: 3299, images: [], metal: "Gold Plated", occasion: "wedding", tags: [], stock: 0,
    description: "Hand-finished filigree kada with an openable screw clasp. Size 2.4 and 2.6 available." },
  { id: "A001", name: "Ghungroo Charm Anklet", category: "anklets", price: 1099, mrp: 2099, images: [], metal: "925 Silver", occasion: "everyday", tags: ["new"], stock: 14,
    description: "Tiny ghungroo charms on a fine silver chain that chime softly with every step. Sold as a single piece." }
];

window.AS_CATEGORIES = [
  { id: "rings",     name: "Rings",     hue: 330 },
  { id: "earrings",  name: "Earrings",  hue: 20 },
  { id: "necklaces", name: "Necklaces", hue: 160 },
  { id: "pendants",  name: "Pendants",  hue: 280 },
  { id: "bracelets", name: "Bracelets", hue: 200 },
  { id: "bangles",   name: "Bangles",   hue: 40 },
  { id: "anklets",   name: "Anklets",   hue: 350 },
  { id: "sets",      name: "Sets",      hue: 300 }
];
