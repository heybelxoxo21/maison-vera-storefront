// =========================================
// 1. APPLICATION STATE & LOCALSTORAGE SYNC
// =========================================
let products = []; // Populated asynchronously from data/products.json
let cart = JSON.parse(localStorage.getItem("maison_vera_cart")) || [];
let activeCategory = "all";
let currentCurrency = "EUR";
const EUR_TO_USD_RATE = 1.08;

// =========================================
// 2. DOM REFERENCES
// =========================================
const productGrid = document.getElementById("product-grid");
const bagLinkElement = document.querySelector(".bag-link");
const filterButtons = document.querySelectorAll(".filter-btn");
const currencyToggleBtn = document.getElementById("currency-toggle");

// Drawer DOM Elements
const bagDrawer = document.getElementById("bag-drawer");
const drawerBackdrop = document.getElementById("drawer-backdrop");
const closeDrawerBtn = document.getElementById("close-drawer");
const drawerItemsContainer = document.getElementById("drawer-items");
const drawerSubtotalElement = document.getElementById("drawer-subtotal");
const checkoutBtn = document.getElementById("checkout-btn");

// =========================================
// 3. HELPER FUNCTIONS (CURRENCY & STORAGE)
// =========================================
function formatPrice(priceEur) {
  if (currentCurrency === "EUR") {
    return `€${priceEur.toLocaleString()}`;
  }
  const priceUsd = Math.round(priceEur * EUR_TO_USD_RATE);
  return `$${priceUsd.toLocaleString()}`;
}

function saveCartToStorage() {
  localStorage.setItem("maison_vera_cart", JSON.stringify(cart));
}

// =========================================
// 4. ASYNC DATA FETCHING (JSON CATALOG)
// =========================================
async function loadCatalog() {
  try {
    const response = await fetch("data/products.json");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    products = await response.json();
    renderProducts();
    renderCart();
  } catch (error) {
    console.error("Failed to load product catalog:", error);
    productGrid.innerHTML = `<p class="empty-bag-msg">Unable to load collection. Please verify local server is running.</p>`;
  }
}

// =========================================
// 5. RENDER PRODUCTS & SHOPPING BAG DRAWER
// =========================================
function renderProducts() {
  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((item) => item.category === activeCategory);

  productGrid.innerHTML = filteredProducts
    .map(
      (product) => `
      <article class="product-card" data-id="${product.id}">
        <div class="product-image-placeholder">
          <span>${product.code}</span>
        </div>
        <div class="product-info">
          ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
          <h3 class="product-title">${product.title}</h3>
          <p class="product-material">${product.material}</p>
          <p class="product-price">${formatPrice(product.priceEur)}</p>
        </div>
      </article>
    `
    )
    .join("");
}

function renderCart() {
  // Update top-right navbar counter
  bagLinkElement.textContent = `Bag (${cart.length})`;

  // Render empty state if no items
  if (cart.length === 0) {
    drawerItemsContainer.innerHTML = `<p class="empty-bag-msg">Your shopping bag is currently empty.</p>`;
    drawerSubtotalElement.textContent = formatPrice(0);
    return;
  }

  // Render each item inside the slide-out drawer
  drawerItemsContainer.innerHTML = cart
    .map(
      (item, index) => `
      <div class="cart-item">
        <div>
          <h4 class="cart-item-title">${item.title}</h4>
          <p class="cart-item-meta">${item.material}</p>
          <button class="remove-item-btn" data-index="${index}">Remove</button>
        </div>
        <div class="product-price">${formatPrice(item.priceEur)}</div>
      </div>
    `
    )
    .join("");

  // Calculate total EUR using .reduce()
  const totalEur = cart.reduce((sum, item) => sum + item.priceEur, 0);
  drawerSubtotalElement.textContent = formatPrice(totalEur);
}

// =========================================
// 6. DRAWER OPEN / CLOSE CONTROLS
// =========================================
function openDrawer() {
  bagDrawer.classList.add("open");
  drawerBackdrop.classList.add("open");
}

function closeDrawer() {
  bagDrawer.classList.remove("open");
  drawerBackdrop.classList.remove("open");
}

bagLinkElement.addEventListener("click", (e) => {
  e.preventDefault();
  openDrawer();
});

closeDrawerBtn.addEventListener("click", closeDrawer);
drawerBackdrop.addEventListener("click", closeDrawer);

// =========================================
// 7. CATALOG, CURRENCY & CART INTERACTIONS
// =========================================
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeCategory = btn.dataset.category;
    renderProducts();
  });
});

currencyToggleBtn.addEventListener("click", () => {
  currentCurrency = currentCurrency === "EUR" ? "USD" : "EUR";
  currencyToggleBtn.textContent =
    currentCurrency === "EUR" ? "Currency: EUR (€)" : "Currency: USD ($)";
  renderProducts();
  renderCart(); // Also updates prices inside the bag drawer!
});

// Add product to cart when card is clicked
productGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".product-card");
  if (!card) return;

  const productId = card.dataset.id;
  const selectedProduct = products.find((p) => p.id === productId);
  if (!selectedProduct) return;

  cart.push(selectedProduct);
  saveCartToStorage();
  renderCart();
  openDrawer(); // Slide open the bag drawer immediately on add!
});

// Remove item from cart inside drawer
drawerItemsContainer.addEventListener("click", (event) => {
  if (!event.target.classList.contains("remove-item-btn")) return;

  const itemIndex = Number(event.target.dataset.index);
  cart.splice(itemIndex, 1);
  saveCartToStorage();
  renderCart();
});

// Checkout confirmation simulation
checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) return;
  alert(`Thank you. Your private order of ${cart.length} piece(s) has been reserved.`);
  cart = [];
  saveCartToStorage();
  renderCart();
  closeDrawer();
});

// Initialize storefront
loadCatalog();