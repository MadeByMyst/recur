/* RECUR store.js
   The shop: product cards, the product popup, the bag and the checkout.
   The catalogue comes from products.js, and reduceMotion and
   updateShipNotes from script.js. The bag is saved in this browser only,
   and nothing is ever charged: RECUR is a demo store. */

/* ---------- Small helpers ---------- */

const priceFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const money = (amount) => priceFormat.format(amount);

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

// The date a number of days from today, like "Thu 23 Oct"
function backOn(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dayFormat.format(date);
}

const inDays = (days) => (days === 1 ? "tomorrow" : `in ${days} days`);

const productsById = Object.fromEntries(PRODUCTS.map((product) => [product.id, product]));

const imageFor = (product, colourKey) => `assets/products/${product.id}-${colourKey}.webp`;

const colourFor = (product, key) =>
  product.colours.find((colour) => colour.key === key) || product.colours[0];

const isOneSize = (product) => product.sizes.length === 1;

// "in", "low", or "out" with the number of days until it's back
function stockFor(product, colourKey, size) {
  if (product.backIn) return { state: "out", days: product.backIn };
  const key = `${colourKey}:${size}`;
  if (key in product.out) return { state: "out", days: product.out[key] };
  if (product.low.includes(key)) return { state: "low" };
  return { state: "in" };
}

const closeIcon =
  '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>';
const arrowIcon =
  '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>';
const lemniIcon =
  '<svg class="lemni" viewBox="0 0 100 100" aria-hidden="true"><use href="#lemni" /></svg>';

/* ---------- Popups: open, and close with a short animation ---------- */

function openDialog(dialog) {
  dialog.classList.remove("is-closing");
  if (!dialog.open) dialog.showModal();
}

function closeDialog(dialog) {
  return new Promise((resolve) => {
    if (!dialog.open) return resolve();
    if (reduceMotion) {
      dialog.close();
      return resolve();
    }

    const finish = (event) => {
      if (event && (event.target !== dialog || event.pseudoElement)) return;
      dialog.removeEventListener("animationend", finish);
      clearTimeout(fallback);
      // Someone may have opened it again while it was closing
      if (dialog.classList.contains("is-closing")) {
        dialog.classList.remove("is-closing");
        dialog.close();
      }
      resolve();
    };
    const fallback = setTimeout(finish, 450); // in case the animation never runs

    dialog.classList.add("is-closing");
    dialog.addEventListener("animationend", finish);
  });
}

// Esc, a click on the dark backdrop, or a [data-close] button closes it
function wireDialog(dialog, onClose) {
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    onClose();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target.closest("[data-close]")) onClose();
  });
}

/* ---------- The bag (saved in this browser) ---------- */

const BAG_KEY = "recur-bag";
let bag = loadBag();
let justAdded = null;

function loadBag() {
  try {
    const saved = JSON.parse(localStorage.getItem(BAG_KEY));
    if (Array.isArray(saved)) {
      return saved.filter((line) => productsById[line.id] && line.qty > 0);
    }
  } catch {
    // Nothing saved, or storage is blocked
  }
  return [];
}

function saveBag() {
  try {
    localStorage.setItem(BAG_KEY, JSON.stringify(bag));
  } catch {
    // The bag still works, it just won't be remembered
  }
}

const sameLine = (a, b) => a.id === b.id && a.colour === b.colour && a.size === b.size;
const bagCount = () => bag.reduce((total, line) => total + line.qty, 0);
const bagSubtotal = () =>
  bag.reduce((total, line) => total + productsById[line.id].price * line.qty, 0);

function addToBag(item) {
  const line = bag.find((existing) => sameLine(existing, item));
  if (line) {
    line.qty = Math.min(line.qty + 1, 9);
  } else {
    bag.push({ ...item, qty: 1 });
  }
  justAdded = item;
  saveBag();
  updateBag({ bump: true });
}

function changeQty(index, change) {
  const line = bag[index];
  if (!line) return;
  line.qty = Math.min(line.qty + change, 9);
  if (line.qty < 1) bag.splice(index, 1);
  saveBag();
  updateBag();
}

function removeLine(index) {
  bag.splice(index, 1);
  saveBag();
  updateBag();
}

function clearBag() {
  bag = [];
  saveBag();
  updateBag();
}

function updateBag({ bump = false } = {}) {
  const count = bagCount();
  document.querySelectorAll("[data-bag-count]").forEach((badge) => {
    badge.textContent = count;
    if (bump && !reduceMotion) {
      badge.classList.remove("is-bumped");
      void badge.offsetWidth; // restart the animation
      badge.classList.add("is-bumped");
    }
  });
  document.querySelectorAll(".bag-toggle").forEach((button) => {
    button.setAttribute("aria-label", `Bag, ${count} ${count === 1 ? "item" : "items"}`);
  });
  renderBag();
  renderCheckout();
}

// Keep two open tabs in step
window.addEventListener("storage", (event) => {
  if (event.key !== BAG_KEY) return;
  bag = loadBag();
  updateBag();
});

/* ---------- Bag drawer ---------- */

document.body.insertAdjacentHTML(
  "beforeend",
  `<dialog class="bag-dialog" aria-labelledby="bag-title">
    <div class="bag-panel">
      <div class="bag-head">
        <h2 id="bag-title">Your bag</h2>
        <button class="icon-btn dialog-close" type="button" data-close>
          <span class="visually-hidden">Close the bag</span>${closeIcon}
        </button>
      </div>
      <div class="bag-progress">
        <p data-bag-progress></p>
        <div class="bar-track" aria-hidden="true"><div class="bar-fill"></div></div>
      </div>
      <ul class="bag-items"></ul>
      <div class="bag-empty">
        ${lemniIcon}
        <h3>Your bag is empty</h3>
        <p>Not sure where to start? Most people pick the Loop Hoodie first.</p>
        <a class="btn btn-primary" href="shop.html">Shop all ten ${arrowIcon}</a>
      </div>
      <div class="bag-foot">
        <div class="bag-total"><span>Subtotal</span><span data-bag-subtotal></span></div>
        <p>Delivery is added at checkout.</p>
        <a class="btn btn-primary btn-block" href="checkout.html">Go to checkout ${arrowIcon}</a>
      </div>
    </div>
  </dialog>`
);

const bagDialog = document.querySelector(".bag-dialog");
const bagList = bagDialog.querySelector(".bag-items");

function lineDetails(product, line) {
  const colour = colourFor(product, line.colour);
  return isOneSize(product) ? colour.name : `${colour.name} · ${line.size}`;
}

function renderBag() {
  const empty = bag.length === 0;
  const subtotal = bagSubtotal();
  const left = FREE_SHIPPING_FROM - subtotal;

  bagDialog.querySelector(".bag-progress").hidden = empty;
  bagDialog.querySelector(".bag-empty").hidden = !empty;
  bagDialog.querySelector(".bag-foot").hidden = empty;
  bagList.hidden = empty;

  bagDialog.querySelector("[data-bag-progress]").textContent =
    left > 0 ? `Spend ${money(left)} more and delivery is free.` : "Your order ships free.";
  bagDialog
    .querySelector(".bar-fill")
    .style.setProperty("--p", Math.min(subtotal / FREE_SHIPPING_FROM, 1).toFixed(3));
  bagDialog.querySelector("[data-bag-subtotal]").textContent = money(subtotal);

  bagList.innerHTML = bag
    .map((line, index) => {
      const product = productsById[line.id];
      const isNew = justAdded && sameLine(line, justAdded);
      return `<li class="bag-item${isNew ? " is-new" : ""}">
        <img src="${imageFor(product, line.colour)}" alt="" width="76" height="95" />
        <div>
          <p class="bag-item-name">${product.name}</p>
          <p class="bag-item-meta">${lineDetails(product, line)}</p>
          <div class="qty">
            <button type="button" data-action="less" data-index="${index}" aria-label="One less ${product.name}">−</button>
            <output aria-label="Quantity">${line.qty}</output>
            <button type="button" data-action="more" data-index="${index}" aria-label="One more ${product.name}">+</button>
          </div>
        </div>
        <div class="bag-item-side">
          <p class="bag-item-price">${money(product.price * line.qty)}</p>
          <button class="remove" type="button" data-action="remove" data-index="${index}">
            Remove<span class="visually-hidden"> ${product.name}</span>
          </button>
        </div>
      </li>`;
    })
    .join("");
  justAdded = null;
}

bagList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action } = button.dataset;
  const index = Number(button.dataset.index);

  if (action === "less") changeQty(index, -1);
  if (action === "more") changeQty(index, 1);
  if (action === "remove") removeLine(index);

  // The list is redrawn, so put focus back where it was
  const same = bagList.querySelector(`[data-action="${action}"][data-index="${index}"]`);
  (same || bagDialog.querySelector(".bag-head h2")).focus({ preventScroll: true });
});

bagDialog.querySelector(".bag-head h2").tabIndex = -1;

function openBag() {
  openDialog(bagDialog);
}

wireDialog(bagDialog, () => closeDialog(bagDialog));

document.querySelectorAll(".bag-toggle, [data-open-bag]").forEach((button) => {
  button.addEventListener("click", () => {
    renderBag();
    openBag();
  });
});

/* ---------- Product cards ---------- */

function cardHTML(product, index = 0, isNew = false) {
  const [first, second] = product.colours;
  const tag = product.backIn
    ? `<span class="product-tag is-back">Back on ${backOn(product.backIn)}</span>`
    : "";
  const swatches = product.colours
    .map((colour) => `<span class="swatch" style="--c: ${colour.hex}"></span>`)
    .join("");
  const colourText =
    product.colours.length === 1 ? first.name : `${product.colours.length} colours`;

  return `<li class="product-card${isNew ? " is-new" : ""}" style="--i: ${index}">
    <a href="shop.html#${product.id}" data-product="${product.id}">
      <div class="product-media">
        ${tag}
        <img src="${imageFor(product, first.key)}" alt="${product.name} in ${first.name}" width="960" height="1200" loading="lazy" />
        ${second ? `<img class="alt" src="${imageFor(product, second.key)}" alt="" width="960" height="1200" loading="lazy" />` : ""}
        <span class="product-quick" aria-hidden="true">Quick look</span>
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">${money(product.price)}</p>
        <p class="product-colours">${swatches}<span>${colourText}</span></p>
      </div>
    </a>
  </li>`;
}

// Hand-picked rows, e.g. <ul data-products="loop-hoodie everyday-tee">
document.querySelectorAll("[data-products]").forEach((list) => {
  list.innerHTML = list.dataset.products
    .split(" ")
    .map((id) => productsById[id])
    .filter(Boolean)
    .map((product, index) => cardHTML(product, index))
    .join("");
});

/* ---------- Shop page: filter and sort ---------- */

const shopGrid = document.querySelector("[data-shop-grid]");

if (shopGrid) {
  const filterButtons = document.querySelectorAll("[data-filter]");
  const sortSelect = document.querySelector("[data-sort]");
  const shopStatus = document.querySelector("[data-shop-status]");
  const askedFor = new URLSearchParams(location.search).get("type");
  let filter = TYPES[askedFor] ? askedFor : "all";
  let firstRender = true;

  const gridNote = `<li class="grid-note">
    <h3>Missing your size?</h3>
    <p>Nothing here is limited. When a size sells out we make more, usually within three weeks, and the date it's back is right on the product.</p>
    <a class="link" href="#coming-back">See what's coming back ${arrowIcon}</a>
  </li>`;

  function renderShop() {
    let products = PRODUCTS.filter((product) => filter === "all" || product.type === filter);
    if (sortSelect.value === "low") products = [...products].sort((a, b) => a.price - b.price);
    if (sortSelect.value === "high") products = [...products].sort((a, b) => b.price - a.price);

    shopGrid.innerHTML =
      products.map((product, index) => cardHTML(product, index, !firstRender)).join("") +
      (filter === "all" ? gridNote : "");

    filterButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
    });

    if (!firstRender) {
      shopStatus.textContent = `Showing ${products.length} ${products.length === 1 ? "piece" : "pieces"}`;
    }

    // Keep the filter in the address, so the page can be shared or reloaded
    const query = filter === "all" ? "" : `?type=${filter}`;
    history.replaceState(null, "", `${location.pathname}${query}${location.hash}`);
    firstRender = false;
  }

  filterButtons.forEach((button) => {
    const { filter: type } = button.dataset;
    const count =
      type === "all" ? PRODUCTS.length : PRODUCTS.filter((product) => product.type === type).length;
    button.querySelector(".filter-count").textContent = count;
    button.addEventListener("click", () => {
      filter = type;
      renderShop();
    });
  });

  sortSelect.addEventListener("change", renderShop);
  renderShop();
}

/* ---------- Coming back: every sold-out size and its date ---------- */

const restockList = document.querySelector("[data-restock-list]");

if (restockList) {
  const restocks = [];

  PRODUCTS.forEach((product) => {
    if (product.backIn) {
      restocks.push({
        product,
        days: product.backIn,
        colour: product.colours[0].key,
        what: `${product.colours.map((colour) => colour.name).join(", ")}, every size`,
      });
    }
    Object.entries(product.out).forEach(([key, days]) => {
      const [colour, size] = key.split(":");
      restocks.push({
        product,
        days,
        colour,
        size,
        what: `${colourFor(product, colour).name}, size ${size}`,
      });
    });
  });

  restocks.sort((a, b) => a.days - b.days);

  restockList.innerHTML = restocks
    .map(
      (item) => `<li>
        <button type="button" data-product="${item.product.id}" data-colour="${item.colour}"${item.size ? ` data-size="${item.size}"` : ""}>
          <span class="restock-what">${item.product.name}<small>${item.what}</small></span>
          <span class="restock-when">${backOn(item.days)}<small>${inDays(item.days)}</small></span>
        </button>
      </li>`
    )
    .join("");
}

// Restock dates written into the page, e.g. "back on Thu 23 Oct"
document.querySelectorAll("[data-restock]").forEach((element) => {
  const product = productsById[element.dataset.restock];
  if (product && product.backIn) element.textContent = `on ${backOn(product.backIn)}`;
});

document.querySelectorAll("[data-restock-in]").forEach((element) => {
  const product = productsById[element.dataset.restockIn];
  if (product && product.backIn) element.textContent = `That's ${inDays(product.backIn)}.`;
});

/* ---------- Product popup ---------- */

document.body.insertAdjacentHTML(
  "beforeend",
  `<dialog class="product-dialog" aria-labelledby="pd-name">
    <div class="pd-inner">
      <button class="icon-btn dialog-close" type="button" data-close>
        <span class="visually-hidden">Close</span>${closeIcon}
      </button>

      <div class="pd-gallery">
        <div class="pd-photo"><img alt="" width="960" height="1200" /></div>
        <div class="pd-thumbs" role="group" aria-label="Colours"></div>
      </div>

      <div class="pd-info">
        <h2 id="pd-name"></h2>
        <p class="pd-price"></p>
        <p class="pd-blurb"></p>
        <p class="pd-sold-out" hidden></p>

        <form class="pd-form" novalidate>
          <fieldset class="pd-options pd-colours">
            <legend>Colour <span data-colour-name></span></legend>
            <div class="option-list"></div>
          </fieldset>
          <fieldset class="pd-options pd-sizes">
            <legend>Size <button type="button" data-open-guide>Size guide</button></legend>
            <div class="option-list"></div>
          </fieldset>
          <p class="pd-stock" aria-live="polite"></p>
          <div class="pd-actions">
            <button class="btn btn-primary btn-block pd-add" type="submit"></button>
          </div>
        </form>

        <form class="alert-form pd-alert" data-alert-form hidden>
          <label for="pd-email">Email me when it's back</label>
          <div class="alert-row">
            <input id="pd-email" type="email" name="email" autocomplete="email" placeholder="you@example.com" required />
            <button class="btn btn-primary" type="submit">Tell me</button>
          </div>
          <p class="form-status" role="status" aria-live="polite"></p>
        </form>

        <p class="pd-ship" data-ship-note></p>

        <div class="pd-details">
          <details class="accordion">
            <summary>Fabric and fit <span class="plus" aria-hidden="true"></span></summary>
            <div class="accordion-body"><div><p data-fabric></p><p data-fit></p></div></div>
          </details>
          <details class="accordion" data-guide>
            <summary>Size guide <span class="plus" aria-hidden="true"></span></summary>
            <div class="accordion-body"><div data-guide-table></div></div>
          </details>
          <details class="accordion">
            <summary>Care <span class="plus" aria-hidden="true"></span></summary>
            <div class="accordion-body"><p data-care></p></div>
          </details>
          <details class="accordion">
            <summary>Delivery and returns <span class="plus" aria-hidden="true"></span></summary>
            <div class="accordion-body">
              <p>Free delivery over ${money(FREE_SHIPPING_FROM)}, otherwise $6. Free returns within 30 days, and free repairs for as long as you own it.</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  </dialog>`
);

updateShipNotes(); // fill the popup's delivery line straight away

const productDialog = document.querySelector(".product-dialog");
const pd = {
  scroller: productDialog.querySelector(".pd-info"),
  inner: productDialog.querySelector(".pd-inner"),
  photo: productDialog.querySelector(".pd-photo img"),
  thumbs: productDialog.querySelector(".pd-thumbs"),
  name: productDialog.querySelector("#pd-name"),
  price: productDialog.querySelector(".pd-price"),
  blurb: productDialog.querySelector(".pd-blurb"),
  soldOut: productDialog.querySelector(".pd-sold-out"),
  form: productDialog.querySelector(".pd-form"),
  colourName: productDialog.querySelector("[data-colour-name]"),
  colours: productDialog.querySelector(".pd-colours .option-list"),
  sizeSet: productDialog.querySelector(".pd-sizes"),
  sizes: productDialog.querySelector(".pd-sizes .option-list"),
  stock: productDialog.querySelector(".pd-stock"),
  add: productDialog.querySelector(".pd-add"),
  actions: productDialog.querySelector(".pd-actions"),
  alert: productDialog.querySelector(".pd-alert"),
  guide: productDialog.querySelector("[data-guide]"),
};

let current = null; // { product, colour, size }

function guideTable(key) {
  const guide = SIZE_GUIDES[key];
  if (!guide) return "";
  const head = guide.columns.map((column) => `<th scope="col">${column}</th>`).join("");
  const rows = guide.rows
    .map(([size, ...values]) => `<tr><th scope="row">${size}</th>${values.map((value) => `<td>${value}</td>`).join("")}</tr>`)
    .join("");
  return `<div class="table-wrap"><table class="size-table">
    <caption>Laid flat, in centimetres</caption>
    <thead><tr>${head}</tr></thead><tbody>${rows}</tbody>
  </table></div>`;
}

function fillProduct() {
  const { product } = current;

  pd.name.textContent = product.name;
  pd.price.textContent = money(product.price);
  pd.blurb.textContent = product.blurb;
  pd.soldOut.hidden = !product.backIn;
  pd.soldOut.textContent = product.backIn
    ? `${product.soldOutNote} Every size is back on ${backOn(product.backIn)}.`
    : "";

  productDialog.querySelector("[data-fabric]").textContent = product.fabric;
  productDialog.querySelector("[data-fit]").textContent = product.fit;
  productDialog.querySelector("[data-care]").textContent = product.care;
  productDialog.querySelector("[data-guide-table]").innerHTML = guideTable(product.sizeGuide);
  pd.guide.hidden = !product.sizeGuide;
  productDialog.querySelectorAll(".pd-details details").forEach((item) => (item.open = false));
  productDialog.querySelector("[data-open-guide]").hidden = !product.sizeGuide;

  pd.thumbs.innerHTML =
    product.colours.length > 1
      ? product.colours
          .map(
            (colour) => `<button class="pd-thumb" type="button" data-colour="${colour.key}" aria-label="${colour.name}">
              <img src="${imageFor(product, colour.key)}" alt="" width="960" height="1200" />
            </button>`
          )
          .join("")
      : "";

  pd.colours.innerHTML = product.colours
    .map(
      (colour) => `<label class="option option-swatch">
        <input type="radio" name="colour" value="${colour.key}" />
        <span style="--c: ${colour.hex}"></span>
        <span class="visually-hidden">${colour.name}</span>
      </label>`
    )
    .join("");

  pd.sizeSet.hidden = isOneSize(product);
  pd.sizes.innerHTML = product.sizes
    .map(
      (size) => `<label class="option option-size">
        <input type="radio" name="size" value="${size}" />
        <span>${size}</span>
      </label>`
    )
    .join("");

  pd.alert.querySelector(".form-status").textContent = "";
  pd.alert.querySelector('button[type="submit"]').disabled = false;

  showSelection({ swapPhoto: false });
}

function showSelection({ swapPhoto = true } = {}) {
  const { product, colour: colourKey, size } = current;
  const colour = colourFor(product, colourKey);

  // Photo and colour
  pd.photo.src = imageFor(product, colour.key);
  pd.photo.alt = `${product.name} in ${colour.name}`;
  if (swapPhoto && !reduceMotion) {
    pd.photo.classList.remove("is-entering");
    void pd.photo.offsetWidth;
    pd.photo.classList.add("is-entering");
  }
  pd.colourName.textContent = colour.name;
  pd.thumbs.querySelectorAll(".pd-thumb").forEach((thumb) => {
    thumb.setAttribute("aria-pressed", String(thumb.dataset.colour === colour.key));
  });
  pd.colours.querySelectorAll("input").forEach((input) => {
    input.checked = input.value === colour.key;
  });

  // Sizes: crossed out when sold out, a dot when there are only a few left
  pd.sizes.querySelectorAll(".option-size").forEach((option) => {
    const input = option.querySelector("input");
    const { state } = stockFor(product, colour.key, input.value);
    option.classList.toggle("is-out", state === "out");
    option.classList.toggle("is-low", state === "low");
    input.checked = input.value === size;
    input.setAttribute(
      "aria-label",
      state === "out" ? `${input.value}, sold out` : state === "low" ? `${input.value}, only a few left` : input.value
    );
  });

  // Stock line and the button underneath
  const stock = size ? stockFor(product, colour.key, size) : null;
  const sizeName = isOneSize(product) ? "This colour" : `${size} in ${colour.name}`;
  let message = "";

  if (!size) {
    message = product.backIn ? "Pick your size to get an email the day it's back." : "";
  } else if (stock.state === "out") {
    message = `${sizeName} is back on ${backOn(stock.days)}, ${inDays(stock.days)}.`;
  } else if (stock.state === "low") {
    message = isOneSize(product) ? "Only a few left in this colour." : `Only a few left in ${size}.`;
  } else {
    message = "In stock.";
  }

  pd.stock.textContent = message;
  pd.stock.classList.toggle("is-warning", Boolean(stock && stock.state !== "in"));

  const waiting = Boolean(product.backIn || (stock && stock.state === "out"));
  pd.actions.hidden = waiting;
  pd.alert.hidden = !waiting;
  pd.add.textContent = `Add to bag · ${money(product.price)}`;
}

function openProduct(id, { colour, size } = {}) {
  const product = productsById[id];
  if (!product) return;

  current = {
    product,
    colour: colourFor(product, colour).key,
    size: isOneSize(product) ? product.sizes[0] : product.sizes.includes(size) ? size : null,
  };
  fillProduct();
  openDialog(productDialog);
  pd.inner.scrollTop = 0;
  pd.scroller.scrollTop = 0;
  history.replaceState(null, "", `${location.pathname}${location.search}#${id}`);
}

function closeProduct() {
  history.replaceState(null, "", `${location.pathname}${location.search}`);
  return closeDialog(productDialog);
}

wireDialog(productDialog, closeProduct);

pd.thumbs.addEventListener("click", (event) => {
  const thumb = event.target.closest(".pd-thumb");
  if (!thumb || thumb.dataset.colour === current.colour) return;
  current.colour = thumb.dataset.colour;
  showSelection();
});

pd.form.addEventListener("change", (event) => {
  if (event.target.name === "colour") {
    current.colour = event.target.value;
    showSelection();
  }
  if (event.target.name === "size") {
    current.size = event.target.value;
    showSelection({ swapPhoto: false });
  }
});

productDialog.querySelector("[data-open-guide]").addEventListener("click", () => {
  pd.guide.open = true;
  pd.guide.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
});

pd.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const { product, colour, size } = current;

  if (!size) {
    pd.stock.textContent = "Pick a size first.";
    pd.stock.classList.add("is-warning");
    pd.sizes.querySelector("input").focus();
    return;
  }

  addToBag({ id: product.id, colour, size });
  closeProduct().then(openBag);
});

// Anything marked data-product opens its popup: cards, photos, the restock list.
// Ctrl- or Cmd-click still opens the link in a new tab.
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-product]");
  if (!trigger || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
  event.preventDefault();
  openProduct(trigger.dataset.product, {
    colour: trigger.dataset.colour,
    size: trigger.dataset.size,
  });
});

// Links like shop.html#loop-hoodie open straight into the popup
function openFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (productsById[id]) openProduct(id);
}

window.addEventListener("hashchange", openFromHash);
openFromHash();

/* ---------- Checkout ---------- */

const checkout = document.querySelector("[data-checkout]");
const checkoutForm = checkout && checkout.querySelector(".checkout-form");
let orderPlaced = false;

const STANDARD_DELIVERY = 6;
const EXPRESS_DELIVERY = 14;

function deliveryCost() {
  if (checkoutForm.elements.delivery.value === "express") return EXPRESS_DELIVERY;
  return bagSubtotal() >= FREE_SHIPPING_FROM ? 0 : STANDARD_DELIVERY;
}

function renderCheckout() {
  if (!checkout || orderPlaced) return;
  const empty = bag.length === 0;

  checkout.querySelector(".checkout-empty").hidden = !empty;
  checkout.querySelector(".checkout-grid").hidden = empty;
  if (empty) return;

  checkout.querySelector(".summary-items").innerHTML = bag
    .map((line) => {
      const product = productsById[line.id];
      return `<li class="summary-item">
        <img src="${imageFor(product, line.colour)}" alt="" width="56" height="70" />
        <div>
          <p class="bag-item-name">${product.name}</p>
          <p>${lineDetails(product, line)}${line.qty > 1 ? ` · ${line.qty} of them` : ""}</p>
        </div>
        <span class="bag-item-price">${money(product.price * line.qty)}</span>
      </li>`;
    })
    .join("");

  const subtotal = bagSubtotal();
  const delivery = deliveryCost();
  const standardFree = subtotal >= FREE_SHIPPING_FROM;

  checkout.querySelector("[data-standard-price]").textContent = standardFree
    ? "Free"
    : money(STANDARD_DELIVERY);
  checkout.querySelector("[data-subtotal]").textContent = money(subtotal);
  checkout.querySelector("[data-delivery]").textContent = delivery ? money(delivery) : "Free";
  checkout.querySelector("[data-total]").textContent = money(subtotal + delivery);
  checkout.querySelector("[data-place-label]").textContent = `Place order · ${money(subtotal + delivery)}`;
}

if (checkout) {
  checkoutForm.addEventListener("change", renderCheckout);

  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!checkoutForm.reportValidity()) return;

    const data = new FormData(checkoutForm);
    const firstName = String(data.get("name")).trim().split(/\s+/)[0];
    const done = checkout.querySelector(".checkout-done");

    done.querySelector("[data-done-name]").textContent = firstName;
    done.querySelector("[data-done-email]").textContent = data.get("email");
    done.querySelector("[data-done-number]").textContent = `R-${Math.floor(10000 + Math.random() * 90000)}`;

    orderPlaced = true;
    checkout.querySelector(".checkout-intro").hidden = true;
    checkout.querySelector(".checkout-grid").hidden = true;
    done.hidden = false;
    clearBag();

    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    done.querySelector("h2").focus({ preventScroll: true });
  });
}

updateBag();
