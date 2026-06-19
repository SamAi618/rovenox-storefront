let products = [
  {
    id: "rn-bag-01",
    name: "Northline Structured Carry Bag",
    category: "bags",
    price: 168,
    tone: "tone-sand",
    badge: "Carry",
    description: "A structured day bag with a compact profile, reinforced base, and easy-access interior pockets for everyday travel.",
    colors: ["Graphite", "Ivory", "Forest"],
    sizes: ["Small", "Medium"]
  },
  {
    id: "rn-watch-01",
    name: "Aster Field Chrono Watch",
    category: "watches",
    price: 245,
    tone: "tone-silver",
    badge: "Time",
    image: "images/annekali/watches/rolex-1051164-rolex-datejust-m126334-0022.webp",
    description: "A clean chronograph-inspired watch with a brushed case, legible dial, and low-profile strap for daily wear.",
    colors: ["Steel", "Black", "Sand"],
    sizes: ["40mm", "42mm"]
  },
  {
    id: "rn-shoe-01",
    name: "Vale Low Profile Sneaker",
    category: "shoes",
    price: 132,
    tone: "tone-graphite",
    badge: "Step",
    image: "images/annekali/products/1049550-low-top-sneakers.webp",
    description: "A minimal sneaker with a cushioned footbed, stable rubber outsole, and neutral upper for easy styling.",
    colors: ["Black", "Stone", "White"],
    sizes: ["7", "8", "9", "10", "11"]
  },
  {
    id: "rn-bag-02",
    name: "Harbor Zip Weekend Tote",
    category: "bags",
    price: 196,
    tone: "tone-plum",
    badge: "Travel",
    description: "A weekend-ready tote with a wide zip opening, structured handles, and a padded sleeve for short trips.",
    colors: ["Plum", "Charcoal", "Taupe"],
    sizes: ["Medium", "Large"]
  },
  {
    id: "rn-watch-02",
    name: "Civic Date Minimal Watch",
    category: "watches",
    price: 218,
    tone: "tone-graphite",
    badge: "Time",
    image: "images/annekali/watches/cartier-1051022-ballon-bleu-de-cartier-watch-40-mm-automatic.webp",
    description: "A pared-back date watch with a slim case, subtle markers, and a refined leather-style strap.",
    colors: ["Black", "Cognac", "Navy"],
    sizes: ["38mm", "40mm"]
  },
  {
    id: "rn-shoe-02",
    name: "Metro Knit Runner",
    category: "shoes",
    price: 148,
    tone: "tone-silver",
    badge: "Step",
    image: "images/annekali/products/1049175-b22.webp",
    description: "A breathable runner silhouette with a flexible knit upper and a lightweight sole for long city days.",
    colors: ["Slate", "Cloud", "Olive"],
    sizes: ["7", "8", "9", "10", "11"]
  },
  {
    id: "rn-bag-03",
    name: "Arc Mini Crossbody",
    category: "bags",
    price: 124,
    tone: "tone-graphite",
    badge: "Carry",
    description: "A compact crossbody built for essentials, with an adjustable strap and softly structured body.",
    colors: ["Black", "Cream", "Wine"],
    sizes: ["Mini"]
  },
  {
    id: "rn-watch-03",
    name: "Monarch Dress Watch",
    category: "watches",
    price: 286,
    tone: "tone-sand",
    badge: "Time",
    image: "images/annekali/watches/patek-1051397-5711-1r-001-patek-philippe-nautilus.webp",
    description: "A dress-focused watch with warm metal accents, clean markers, and a polished finish.",
    colors: ["Gold", "Steel", "Espresso"],
    sizes: ["39mm", "41mm"]
  },
  {
    id: "rn-shoe-03",
    name: "Axis Leather Court Shoe",
    category: "shoes",
    price: 156,
    tone: "tone-plum",
    badge: "Step",
    image: "images/annekali/products/1049407-out-of-office.webp",
    description: "A smooth court-inspired shoe with stitched panels, padded collar, and a balanced everyday shape.",
    colors: ["White", "Black", "Oxblood"],
    sizes: ["7", "8", "9", "10", "11"]
  },
  {
    id: "rn-bag-04",
    name: "Summit Foldover Pack",
    category: "bags",
    price: 174,
    tone: "tone-silver",
    badge: "Travel",
    description: "A foldover pack with a clean front profile, interior organization, and comfortable shoulder straps.",
    colors: ["Ash", "Black", "Moss"],
    sizes: ["One Size"]
  }
];

const cart = new Map();
let activeFilter = "all";
let toastTimer;

const relatedGrid = document.querySelector("#relatedGrid");
const featuredGrid = document.querySelector("#featuredGrid");
const cartDrawer = document.querySelector("#cartDrawer");
const productModal = document.querySelector("#productModal");
const modalBody = document.querySelector("#modalBody");
const overlay = document.querySelector("#overlay");
const navDrawer = document.querySelector("#navDrawer");
const cartItems = document.querySelector("#cartItems");
const cartCount = document.querySelector("#cartCount");
const cartTotal = document.querySelector("#cartTotal");
const searchInput = document.querySelector("#searchInput");
const menuButton = document.querySelector(".menu-button");
const closeNavButton = document.querySelector("#closeNav");
const languageSelect = document.querySelector(".language-select");
let activeLanguage = localStorage.getItem("rovenox-language") || languageSelect.value || "en";

function money(value) {
  return `$${value.toLocaleString("en-US")}`;
}

function getI18n() {
  return window.RoveNoxI18N || { languages: { en: { htmlLang: "en", dir: "ltr" } }, ui: { en: {} } };
}

function translate(key, replacements = {}) {
  const i18n = getI18n();
  const dictionary = i18n.ui[activeLanguage] || i18n.ui.en;
  const fallback = i18n.ui.en || {};
  const template = dictionary[key] || fallback[key] || key;
  return Object.entries(replacements).reduce(
    (text, [name, value]) => text.replace(`{${name}}`, value),
    template
  );
}

function translateStaticPage() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = translate(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", translate(element.dataset.i18nPlaceholder));
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", translate(element.dataset.i18nAriaLabel));
  });
}

function productBadge(product) {
  return translate(`badge.${product.badge.toLowerCase()}`);
}

function productCategory(product) {
  return translate(`product.${product.category}`);
}

function productDescription(product) {
  const i18n = getI18n();
  const descriptions = i18n.productDescriptions || {};
  return descriptions[activeLanguage]?.[product.category] ||
    descriptions.en?.[product.category] ||
    product.description;
}

function visibleProducts() {
  const term = searchInput.value.trim().toLowerCase();
  return products.filter((product) => {
    const matchesFilter = activeFilter === "all" || product.category === activeFilter;
    const matchesSearch = !term ||
      product.name.toLowerCase().includes(term) ||
      productCategory(product).toLowerCase().includes(term) ||
      product.category.includes(term);
    return matchesFilter && matchesSearch;
  });
}

function productArt(product, extraClass = "") {
  const image = product.image
    ? `<img src="${product.image}" alt="" loading="lazy" decoding="async">`
    : "";
  const imageClass = product.image ? "has-image" : "";
  return `<div class="product-art ${product.category} ${product.tone} ${imageClass} ${extraClass}" aria-hidden="true">${image}</div>`;
}

function productCard(product) {
  return `
    <article class="product-card">
      <button class="product-button" type="button" data-view="${product.id}">
        ${productArt(product)}
        <div class="product-info">
          <div class="product-meta">
            <span class="product-category">${productBadge(product)}</span>
            <span class="product-price">${money(product.price)}</span>
          </div>
          <h3>${product.name}</h3>
        </div>
      </button>
      <div class="product-info quick-add">
        <span>${product.colors[0]} / ${product.sizes[0]}</span>
        <button type="button" data-add="${product.id}">${translate("modal.add")}</button>
      </div>
    </article>
  `;
}

function renderProducts() {
  const filtered = visibleProducts();
  relatedGrid.innerHTML = filtered.slice(0, 8).map(productCard).join("");
  featuredGrid.innerHTML = products.slice(2, 10).map(productCard).join("");
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
  renderProducts();
}

function getProduct(id) {
  return products.find((product) => product.id === id);
}

function addToCart(id, quantity = 1) {
  const product = getProduct(id);
  if (!product) throw new Error(`Unknown product id: ${id}`);
  const current = cart.get(id) || { product, quantity: 0 };
  current.quantity += quantity;
  cart.set(id, current);
  renderCart();
  showToast(translate("toast.added", { name: product.name }));
}

function updateQuantity(id, delta) {
  const current = cart.get(id);
  if (!current) throw new Error(`Cannot update missing cart item: ${id}`);
  current.quantity += delta;
  if (current.quantity <= 0) {
    cart.delete(id);
  } else {
    cart.set(id, current);
  }
  renderCart();
}

function removeItem(id) {
  if (!cart.has(id)) throw new Error(`Cannot remove missing cart item: ${id}`);
  cart.delete(id);
  renderCart();
}

function cartSummary() {
  const entries = [...cart.values()];
  return entries.reduce(
    (summary, item) => {
      summary.count += item.quantity;
      summary.total += item.product.price * item.quantity;
      return summary;
    },
    { count: 0, total: 0 }
  );
}

function renderCart() {
  const entries = [...cart.values()];
  if (!entries.length) {
    cartItems.innerHTML = `<div class="empty-cart"><p>${translate("cart.empty")}</p></div>`;
  } else {
    cartItems.innerHTML = entries
      .map(({ product, quantity }) => `
        <article class="cart-line">
          ${productArt(product, "cart-thumb")}
          <div>
            <h3>${product.name}</h3>
            <p>${money(product.price)} ${translate("cart.each")}</p>
            <div class="cart-controls">
              <div class="qty-control" aria-label="Quantity controls">
                <button type="button" data-dec="${product.id}" aria-label="${translate("cart.decrease")}">−</button>
                <span>${quantity}</span>
                <button type="button" data-inc="${product.id}" aria-label="${translate("cart.increase")}">+</button>
              </div>
              <button class="remove-button" type="button" data-remove="${product.id}">${translate("cart.remove")}</button>
            </div>
          </div>
        </article>
      `)
      .join("");
  }
  const summary = cartSummary();
  cartCount.textContent = summary.count;
  cartTotal.textContent = money(summary.total);
}

function openCart() {
  closeNav();
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  if (!productModal.classList.contains("open")) overlay.hidden = true;
}

function openNav() {
  closeCart();
  closeModal();
  navDrawer.classList.add("open");
  navDrawer.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
}

function closeNav() {
  navDrawer.classList.remove("open");
  navDrawer.setAttribute("aria-hidden", "true");
  if (!cartDrawer.classList.contains("open") && !productModal.classList.contains("open")) {
    overlay.hidden = true;
  }
}

function openModal(id) {
  closeNav();
  const product = getProduct(id);
  if (!product) throw new Error(`Unknown product id: ${id}`);
  modalBody.innerHTML = `
    ${productArt(product, "detail-art")}
    <div class="detail-panel">
      <p class="eyebrow">${productCategory(product)}</p>
      <h2>${product.name}</h2>
      <p class="detail-price">${money(product.price)}</p>
      <p class="detail-copy">${productDescription(product)}</p>
      <div class="option-group">
        <label>${translate("modal.color")}</label>
        <div class="option-row">
          ${product.colors.map((color, index) => `<button class="choice-pill ${index === 0 ? "active" : ""}" type="button">${color}</button>`).join("")}
        </div>
      </div>
      <div class="option-group">
        <label>${translate("modal.size")}</label>
        <div class="option-row">
          ${product.sizes.map((size, index) => `<button class="choice-pill ${index === 0 ? "active" : ""}" type="button">${size}</button>`).join("")}
        </div>
      </div>
      <div class="detail-actions">
        <button class="add-cart" type="button" data-add="${product.id}">${translate("modal.add")}</button>
        <button class="buy-now" type="button" data-buy="${product.id}">${translate("modal.buy")}</button>
      </div>
    </div>
  `;
  productModal.classList.add("open");
  productModal.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
}

function closeModal() {
  productModal.classList.remove("open");
  productModal.setAttribute("aria-hidden", "true");
  if (!cartDrawer.classList.contains("open")) overlay.hidden = true;
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.remove(), 2200);
}

function setLanguage(language) {
  const i18n = getI18n();
  if (!i18n.ui[language]) throw new Error(`Unsupported language: ${language}`);
  activeLanguage = language;
  languageSelect.value = language;
  localStorage.setItem("rovenox-language", language);
  const languageMeta = i18n.languages[language] || i18n.languages.en;
  document.documentElement.lang = languageMeta.htmlLang;
  document.documentElement.dir = languageMeta.dir;
  translateStaticPage();
  renderProducts();
  renderCart();
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, a");
  if (!target) return;

  if (target.matches("[data-filter]")) {
    setFilter(target.dataset.filter);
  }

  if (target.matches("[data-view]")) {
    openModal(target.dataset.view);
  }

  if (target.matches("[data-add]")) {
    addToCart(target.dataset.add);
  }

  if (target.matches("[data-buy]")) {
    addToCart(target.dataset.buy);
    closeModal();
    openCart();
  }

  if (target.matches("[data-inc]")) updateQuantity(target.dataset.inc, 1);
  if (target.matches("[data-dec]")) updateQuantity(target.dataset.dec, -1);
  if (target.matches("[data-remove]")) removeItem(target.dataset.remove);

  if (target.closest(".nav-drawer a")) {
    closeNav();
  }
});

document.querySelector("#openCart").addEventListener("click", openCart);
document.querySelector("#closeCart").addEventListener("click", closeCart);
document.querySelector("#closeModal").addEventListener("click", closeModal);
menuButton.addEventListener("click", openNav);
closeNavButton.addEventListener("click", closeNav);
overlay.addEventListener("click", () => {
  closeModal();
  closeCart();
  closeNav();
});

document.querySelector(".search").addEventListener("submit", (event) => {
  event.preventDefault();
  renderProducts();
  document.querySelector("#related").scrollIntoView({ behavior: "smooth" });
});

searchInput.addEventListener("input", renderProducts);

languageSelect.addEventListener("change", (event) => {
  setLanguage(event.target.value);
});

modalBody.addEventListener("click", (event) => {
  const pill = event.target.closest(".choice-pill");
  if (!pill) return;
  const row = pill.parentElement;
  row.querySelectorAll(".choice-pill").forEach((button) => button.classList.remove("active"));
  pill.classList.add("active");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
    closeCart();
    closeNav();
  }
});

async function loadProducts() {
  const response = await fetch("/api/public/products");
  if (!response.ok) throw new Error(`Cannot load products: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.products)) throw new Error("Invalid products response");
  products = data.products;
}

loadProducts()
  .catch((error) => {
    console.error(error);
  })
  .finally(() => {
    setLanguage(activeLanguage);
    window.requestAnimationFrame(() => document.body.classList.add("is-ready"));
  });
