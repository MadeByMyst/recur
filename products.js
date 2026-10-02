/* RECUR products.js
   The whole shop in one list. Prices are in US dollars.
   Images live in assets/products/ as <id>-<colour>.webp (960 × 1200).
   "backIn" counts days from today, so restock dates never go stale. */

const PRODUCTS = [
  {
    id: "loop-hoodie",
    name: "Loop Hoodie",
    price: 88,
    type: "tops",
    blurb:
      "The one most people start with. Heavy cotton fleece, a boxy fit and a double-layer hood that keeps its shape, wash after wash.",
    fabric:
      "450 g organic cotton fleece, brushed soft on the inside. Sewn in Porto, Portugal.",
    fit: "Boxy, with dropped shoulders and a slightly short body. Take your usual size, or one down for a closer fit.",
    care: "Wash at 30°C, inside out, and dry flat. It's pre-shrunk, so it stays the size you bought.",
    colours: [
      { key: "rust", name: "Rust", hex: "#ab4722" },
      { key: "black", name: "Black", hex: "#1a1919" },
      { key: "white", name: "White", hex: "#efefed" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    sizeGuide: "heavy",
    low: ["rust:M", "white:S"],
    out: { "black:XXL": 9 },
  },
  {
    id: "everyday-tee",
    name: "Everyday Tee",
    price: 34,
    type: "tops",
    blurb:
      "A heavy tee with a neck that stays flat. Thick enough that the white one isn't see-through.",
    fabric: "240 g organic cotton jersey. Knitted and sewn in Porto, Portugal.",
    fit: "Relaxed, and a little longer in the body. True to size.",
    care: "Wash at 30°C with similar colours and hang to dry.",
    colours: [
      { key: "white", name: "White", hex: "#efefed" },
      { key: "black", name: "Black", hex: "#1a1919" },
      { key: "olive", name: "Olive", hex: "#4a4627" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    sizeGuide: "tee",
    low: ["white:L"],
    out: { "olive:L": 11 },
  },
  {
    id: "heavy-crew",
    name: "Heavy Crew",
    price: 72,
    type: "tops",
    blurb:
      "The hoodie without the hood. Same heavy fleece, a wide ribbed collar and a small mark on the chest.",
    fabric:
      "450 g organic cotton fleece, brushed inside. The grey is 10% recycled polyester, which gives it the speckled look.",
    fit: "Boxy, like the hoodie. True to size.",
    care: "Wash at 30°C, inside out, and dry flat.",
    colours: [
      { key: "grey", name: "Grey", hex: "#adaba6" },
      { key: "black", name: "Black", hex: "#1a1919" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    sizeGuide: "heavy",
    low: [],
    out: {},
  },
  {
    id: "overshirt",
    name: "Overshirt",
    price: 118,
    type: "tops",
    blurb:
      "A heavy cotton shirt you can wear as a light jacket. Pale contrast stitching, a straight collar and the mark on the chest.",
    fabric: "300 g cotton twill that softens with wear. Sewn in Porto, Portugal.",
    fit: "Boxy and a little long, so it goes over a tee or a hoodie. True to size.",
    care: "Wash at 30°C, inside out, and hang to dry.",
    colours: [{ key: "black", name: "Black", hex: "#1a1919" }],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    sizeGuide: "heavy",
    low: [],
    out: {},
    backIn: 21,
    soldOutNote:
      "Sold out in September. 400 more are being made, exactly like the first run.",
  },
  {
    id: "work-pant",
    name: "Work Pant",
    price: 96,
    type: "bottoms",
    blurb:
      "Straight-leg trousers in tough cotton canvas, with a cargo pocket you'll actually use.",
    fabric: "12 oz cotton canvas that softens and fades a little with wear.",
    fit: "Straight leg, sitting at the waist. The inside leg is 81 cm on every size. Too long? We'll shorten them for free.",
    care: "Wash cold, inside out. Hang to dry.",
    colours: [
      { key: "black", name: "Black", hex: "#1a1919" },
      { key: "stone", name: "Stone", hex: "#b09e83" },
    ],
    sizes: ["28", "30", "32", "34", "36"],
    sizeGuide: "pant",
    low: ["black:30"],
    out: { "stone:34": 15 },
  },
  {
    id: "fleece-short",
    name: "Fleece Short",
    price: 54,
    type: "bottoms",
    blurb:
      "Made from the same fleece as the hoodie, for warm days and lazy ones.",
    fabric: "380 g organic cotton fleece, brushed inside.",
    fit: "Relaxed, ending just above the knee. Elastic waist with a drawcord.",
    care: "Wash at 30°C, inside out, and dry flat.",
    colours: [
      { key: "grey", name: "Grey", hex: "#adaba6" },
      { key: "black", name: "Black", hex: "#1a1919" },
    ],
    sizes: ["S", "M", "L", "XL"],
    sizeGuide: "short",
    low: [],
    out: {},
  },
  {
    id: "six-panel-cap",
    name: "Six-Panel Cap",
    price: 32,
    type: "extras",
    blurb:
      "Washed cotton twill with the mark stitched on the front, and a strap at the back.",
    fabric: "Cotton twill, washed after sewing so it's soft from the first day.",
    fit: "One size, adjustable. Fits heads from 54 to 60 cm.",
    care: "Hand wash cold, reshape and leave to dry.",
    colours: [
      { key: "black", name: "Black", hex: "#1a1919" },
      { key: "rust", name: "Rust", hex: "#9a3b1d" },
    ],
    sizes: ["One size"],
    low: [],
    out: {},
  },
  {
    id: "rib-beanie",
    name: "Rib Beanie",
    price: 26,
    type: "extras",
    blurb: "A deep-cuff beanie in soft merino. Warm, and not itchy.",
    fabric: "Merino wool, knitted in Portugal.",
    fit: "One size. Wear it with the cuff up, or fold it twice.",
    care: "Hand wash cold and dry flat.",
    colours: [
      { key: "rust", name: "Rust", hex: "#a3432a" },
      { key: "black", name: "Black", hex: "#1a1919" },
    ],
    sizes: ["One size"],
    low: ["rust:One size"],
    out: {},
  },
  {
    id: "canvas-tote",
    name: "Canvas Tote",
    price: 28,
    type: "extras",
    blurb:
      "A heavy canvas tote with long handles and a pocket inside for your keys.",
    fabric: "14 oz cotton canvas, screen-printed in Porto.",
    fit: "40 × 38 cm, with handles long enough for your shoulder. Fits a 15-inch laptop.",
    care: "Spot clean, or wash cold. It gets softer the more you use it.",
    colours: [
      { key: "natural", name: "Natural", hex: "#dbd0b9" },
      { key: "black", name: "Black", hex: "#1a1919" },
    ],
    sizes: ["One size"],
    low: [],
    out: {},
  },
  {
    id: "crew-socks",
    name: "Crew Socks, 3 pack",
    price: 18,
    type: "extras",
    blurb: "Thick, cushioned cotton socks that stay up. Three pairs in a pack.",
    fabric: "80% organic cotton, 18% recycled polyamide, 2% elastane.",
    fit: "S/M fits EU 36–41 (UK 3.5–7.5). L/XL fits EU 42–46 (UK 8–11).",
    care: "Wash at 40°C. Tumble dry low if you have to.",
    colours: [
      { key: "white", name: "White", hex: "#efefed" },
      { key: "black", name: "Black", hex: "#1a1919" },
    ],
    sizes: ["S/M", "L/XL"],
    low: [],
    out: { "black:L/XL": 6 },
  },
];

/* Garment measurements in centimetres, laid flat.
   help.html shows the same tables, so change both together. */
const SIZE_GUIDES = {
  heavy: {
    title: "Loop Hoodie, Heavy Crew and Overshirt",
    columns: ["Size", "Chest, pit to pit", "Length"],
    rows: [
      ["XS", "56", "64"],
      ["S", "59", "66"],
      ["M", "62", "68"],
      ["L", "65", "70"],
      ["XL", "68", "72"],
      ["XXL", "71", "74"],
    ],
  },
  tee: {
    title: "Everyday Tee",
    columns: ["Size", "Chest, pit to pit", "Length"],
    rows: [
      ["XS", "51", "68"],
      ["S", "54", "70"],
      ["M", "57", "72"],
      ["L", "60", "74"],
      ["XL", "63", "76"],
      ["XXL", "66", "78"],
    ],
  },
  pant: {
    title: "Work Pant",
    columns: ["Size", "Waist", "Inside leg"],
    rows: [
      ["28", "72", "81"],
      ["30", "77", "81"],
      ["32", "82", "81"],
      ["34", "87", "81"],
      ["36", "92", "81"],
    ],
  },
  short: {
    title: "Fleece Short",
    columns: ["Size", "Waist, relaxed", "Length"],
    rows: [
      ["S", "70", "48"],
      ["M", "75", "50"],
      ["L", "80", "52"],
      ["XL", "85", "54"],
    ],
  },
};

const TYPES = {
  tops: "Tops",
  bottoms: "Bottoms",
  extras: "Extras",
};

const FREE_SHIPPING_FROM = 100;
