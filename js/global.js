const API_BASE = "https://dummyjson.com/products";
const REQUEST_TIMEOUT_MS = 10000;

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function normaliseProduct(product) {
    const price = Number(product.price) || 0;
    const discount = Number(product.discountPercentage) || 0;
    const discountedPrice = Number((price * (1 - discount / 100)).toFixed(2));

    return {
        id: product.id,
        name: product.title || "Untitled product",
        price,
        discount_price: discountedPrice,
        image_path: product.thumbnail || product.images?.[0] || "",
        category: product.category || "uncategorized",
    };
}

async function requestProducts() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(`${API_BASE}?limit=100`, {
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new Error(`The product service returned ${response.status}.`);
        }

        const payload = await response.json();
        if (!Array.isArray(payload.products)) {
            throw new Error("The product service returned an unexpected response.");
        }

        return payload.products.map(normaliseProduct);
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function fetchProducts(limit = 10) {
    const products = await requestProducts();
    return products.slice(0, limit);
}

export async function filterByCategory(category, limit = 100) {
    const products = await requestProducts();
    const normalizedCategory = category.trim().toLowerCase();
    return products
        .filter((product) => product.category.toLowerCase() === normalizedCategory)
        .slice(0, limit);
}

export async function searchForProduct(query, limit = 100) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return fetchProducts(limit);

    const products = await requestProducts();
    return products
        .filter((product) =>
            `${product.name} ${product.category}`
                .toLowerCase()
                .includes(normalizedQuery)
        )
        .slice(0, limit);
}

export function renderProductState(type, message, retry) {
    const container = document.querySelector(".product-card-container");
    if (!container) return;

    const isLoading = type === "loading";
    container.innerHTML = `
        <div class="product-state product-state--${escapeHtml(type)}" role="${
        type === "error" ? "alert" : "status"
    }" aria-live="polite">
            <p>${escapeHtml(message)}</p>
            ${
                retry
                    ? '<button class="product-state-retry" type="button">Try again</button>'
                    : ""
            }
        </div>`;

    if (!isLoading && retry) {
        container.querySelector(".product-state-retry").addEventListener("click", retry);
    }
}

export function renderProducts(products, emptyMessage = "No products found yet.") {
    const container = document.querySelector(".product-card-container");
    if (!container) return;

    if (!Array.isArray(products) || products.length === 0) {
        renderProductState("empty", emptyMessage);
        return;
    }

    container.innerHTML = products
        .map(
            (product) => `
                <div class="product-card"
                    data-id="${escapeHtml(product.id)}"
                    data-name="${escapeHtml(product.name)}"
                    data-price="${product.price}"
                    data-discount="${product.discount_price}"
                    data-image="${escapeHtml(product.image_path)}">
                        <div class="product-img-container">
                            <img src="${escapeHtml(product.image_path)}" alt="${escapeHtml(
                product.name
            )}" class="product-img" />
                        </div>
                        <h4 class="product-name">${escapeHtml(product.name)}</h4>
                        <div class="price-and-actions-container">
                            <div class="product-price">
                                <span class="product-pre-offer-price">${product.price.toFixed(2)}$</span>
                                <span class="product-after-offer-price">${product.discount_price.toFixed(2)}$</span>
                            </div>
                            <div class="product-actions">
                                <svg class="fav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                                    <path d="M305 151.1L320 171.8L335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1L576 231.7C576 343.9 436.1 474.2 363.1 529.9C350.7 539.3 335.5 544 320 544C304.5 544 289.2 539.4 276.9 529.9C203.9 474.2 64 343.9 64 231.7L64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1z" />
                                </svg>
                                <svg class="cart-plus-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                                    <path d="M0 72C0 58.7 10.7 48 24 48L69.3 48C96.4 48 119.6 67.4 124.4 94L124.8 96L537.5 96C557.5 96 572.6 114.2 568.9 133.9L537.8 299.8C532.1 330.1 505.7 352 474.9 352L171.3 352L176.4 380.3C178.5 391.7 188.4 400 200 400L456 400C469.3 400 480 410.7 480 424C480 437.3 469.3 448 456 448L200.1 448C165.3 448 135.5 423.1 129.3 388.9L77.2 102.6C76.5 98.8 73.2 96 69.3 96L24 96C10.7 96 0 85.3 0 72zM160 528C160 501.5 181.5 480 208 480C234.5 480 256 501.5 256 528C256 554.5 234.5 576 208 576C181.5 576 160 554.5 160 528zM384 528C384 501.5 405.5 480 432 480C458.5 480 480 501.5 480 528C480 554.5 458.5 576 432 576C405.5 576 384 554.5 384 528zM336 142.4C322.7 142.4 312 153.1 312 166.4L312 200L278.4 200C265.1 200 254.4 210.7 254.4 224C254.4 237.3 265.1 248 278.4 248L312 248L312 281.6C312 294.9 322.7 305.6 336 305.6C349.3 305.6 360 294.9 360 281.6L360 248L393.6 248C406.9 248 417.6 237.3 417.6 224C417.6 210.7 406.9 200 393.6 200L360 200L360 166.4C360 153.1 349.3 142.4 336 142.4z" />
                                </svg>
                            </div>
                        </div>
                    </div>`
        )
        .join("");

    container.querySelectorAll(".product-img").forEach((image) => {
        image.addEventListener("error", () => {
            image.style.display = "none";
        });
    });

    container.querySelectorAll(".fav-icon").forEach((button) => {
        button.addEventListener("click", (event) => {
            const card = event.currentTarget.closest(".product-card");
            const product = productFromCard(card);
            const wishlist = readStoredArray("wishlist");

            if (wishlist.some((item) => String(item.id) === String(product.id))) {
                showToast("⚠️ Already in wishlist!");
                return;
            }

            wishlist.push(product);
            localStorage.setItem("wishlist", JSON.stringify(wishlist));
            showToast("✅ Added to wishlist!");
        });
    });

    container.querySelectorAll(".cart-plus-icon").forEach((button) => {
        button.addEventListener("click", (event) => {
            const card = event.currentTarget.closest(".product-card");
            const product = { ...productFromCard(card), quantity: 1 };
            const cart = readStoredArray("cart");

            if (cart.some((item) => String(item.id) === String(product.id))) {
                showToast("⚠️ Already in cart!");
                return;
            }

            cart.push(product);
            localStorage.setItem("cart", JSON.stringify(cart));
            showToast("🛒 Added to cart!");
        });
    });
}

function productFromCard(card) {
    return {
        id: card.dataset.id,
        name: card.dataset.name,
        price: Number(card.dataset.price) || 0,
        discount_price: Number(card.dataset.discount) || 0,
        image_path: card.dataset.image,
    };
}

function readStoredArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value.filter((item) => item && item.id) : [];
    } catch {
        return [];
    }
}

export function initSearchBar(onSearch) {
    const form = document.querySelector(".search-bar-form");
    const searchInput = document.querySelector(".search-bar-input");
    if (!form || !searchInput || !onSearch) return;

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        onSearch(searchInput.value.trim());
    });
}

export function renderFavoriteProducts() {
    const table = document.querySelector(".favorite-table");
    if (!table) return;

    // Load wishlist from localStorage
    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    // Reset table but keep header
    table.innerHTML = `
        <tr class="table-header">
            <th class="table-header-names">Product</th>
            <th class="table-header-names">Price</th>
            <th class="table-header-names">Status</th>
            <th class="table-header-names">Action</th>
        </tr>
    `;

    if (wishlist.length === 0) {
        table.innerHTML += `
            <tr>
                <td colspan="4" style="text-align:center; padding:1rem;">
                    ⭐ Your favorites list is empty.
                </td>
            </tr>
        `;
        return;
    }

    // Render rows from wishlist
    table.innerHTML += wishlist
        .map(
            (p) => `
            <tr data-id="${p.id}">
                <td class="product-cell">
                    <div class="product-info">
                        <img
                            class="product-image"
                            src="${p.image_path}"
                            alt="${p.name}"
                        />
                        <span class="product-name">${p.name}</span>
                    </div>
                </td>
                <td class="price">$${p.discount_price || p.price}</td>
                <td class="status">In Stock</td>
                <td class="action">
                    <button class="remove-button action-button">Remove</button>
                    <button class="add-to-cart-button action-button">Add To Cart</button>
                </td>
            </tr>`
        )
        .join("");

    function showToast(message) {
        const toast = document.createElement("div");
        toast.className = "toast-notification";
        toast.innerText = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add("show"), 10);
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 500);
        }, 2000);
    }

    table.querySelectorAll(".remove-button").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const row = e.target.closest("tr");
            const id = row.dataset.id;

            wishlist = wishlist.filter(
                (item) => String(item.id) !== String(id)
            );
            localStorage.setItem("wishlist", JSON.stringify(wishlist));

            row.remove();
            showToast("❌ Removed from favorites");
        });
    });

    table.querySelectorAll(".add-to-cart-button").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const row = e.target.closest("tr");
            const id = row.dataset.id;

            const product = wishlist.find((p) => String(p.id) === String(id));
            if (!product) return;

            let cart = JSON.parse(localStorage.getItem("cart")) || [];
            const exists = cart.some(
                (item) => String(item.id) === String(product.id)
            );

            if (!exists) {
                cart.push({ ...product, quantity: 1 });
                localStorage.setItem("cart", JSON.stringify(cart));
                showToast("🛒 Added to cart!");
            } else {
                showToast("⚠️ Already in cart!");
            }
        });
    });
}

export function renderCart() {
    const table = document.querySelector(".cart-table");
    const summaryTotalEl = document.querySelector(".cart-summary .total-price");
    if (!table) return;

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Reset table header
    table.innerHTML = `
        <tr>
            <th></th>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Total</th>
        </tr>
    `;

    if (cart.length === 0) {
        table.innerHTML += `
            <tr>
                <td colspan="5" style="text-align:center; padding:1rem;">
                    🛒 Your cart is empty.
                </td>
            </tr>
        `;
        if (summaryTotalEl) summaryTotalEl.textContent = "$0.00";
        return;
    }

    // Render product rows
    table.innerHTML += cart
        .map(
            (p) => `
            <tr class="product-row" data-id="${p.id}">
                <td class="remove-btn-cell">
                    <button class="remove-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                            <path d="M504.6 148.5C515.9 134.9 514.1 114.7 500.5 103.4C486.9 92.1 466.7 93.9 455.4 107.5L320 270L184.6 107.5C173.3 93.9 153.1 92.1 139.5 103.4C125.9 114.7 124.1 134.9 135.4 148.5L278.3 320L135.4 491.5C124.1 505.1 125.9 525.3 139.5 536.6C153.1 547.9 173.3 546.1 184.6 532.5L320 370L455.4 532.5C466.7 546.1 486.9 547.9 500.5 536.6C514.1 525.3 515.9 505.1 504.6 491.5L361.7 320L504.6 148.5z"/>
                        </svg>
                    </button>
                </td>
                <td class="product-cell">
                    <img src="${p.image_path}" alt="${
                p.name
            }" class="product-image" />
                    <span class="product-name">${p.name}</span>
                </td>
                <td class="price-cell">
                    <p class="price">$${p.discount_price || p.price}</p>
                </td>
                <td class="quantity-cell">
                    <div class="quantity-manipulator-container">
                        <button class="decrease-btn">-</button>
                        <input type="number" class="quantity-input" value="${
                            p.quantity || 1
                        }" min="1" />
                        <button class="increase-btn">+</button>
                    </div>
                </td>
                <td class="total-cell">
                    <p class="total-price">$${(
                        (p.discount_price || p.price) * (p.quantity || 1)
                    ).toFixed(2)}</p>
                </td>
            </tr>`
        )
        .join("");

    // --- Helpers ---
    function saveCart() {
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    function updateSummaryTotal() {
        const total = cart.reduce(
            (sum, item) =>
                sum +
                (item.quantity || 1) * (item.discount_price || item.price),
            0
        );
        if (summaryTotalEl) summaryTotalEl.textContent = `$${total.toFixed(2)}`;
    }

    function updateRowTotal(row, product) {
        const totalCell = row.querySelector(".total-price");
        totalCell.textContent = `$${(
            (product.discount_price || product.price) * product.quantity
        ).toFixed(2)}`;
    }

    // --- Event Handlers ---

    // Remove button
    table.querySelectorAll(".remove-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const row = e.target.closest(".product-row");
            const id = row.dataset.id;

            cart = cart.filter((item) => String(item.id) !== String(id));
            saveCart();
            renderCart(); // re-render after removal
        });
    });

    // Increase & decrease quantity
    table.querySelectorAll(".product-row").forEach((row) => {
        const id = row.dataset.id;
        const product = cart.find((item) => String(item.id) === String(id));
        if (!product) return;

        const input = row.querySelector(".quantity-input");
        const decreaseBtn = row.querySelector(".decrease-btn");
        const increaseBtn = row.querySelector(".increase-btn");

        decreaseBtn.addEventListener("click", () => {
            if (product.quantity > 1) {
                product.quantity--;
                input.value = product.quantity;
                updateRowTotal(row, product);
                saveCart();
                updateSummaryTotal();
            }
        });

        increaseBtn.addEventListener("click", () => {
            product.quantity++;
            input.value = product.quantity;
            updateRowTotal(row, product);
            saveCart();
            updateSummaryTotal();
        });

        input.addEventListener("change", () => {
            let val = parseInt(input.value);
            if (isNaN(val) || val < 1) val = 1;
            product.quantity = val;
            input.value = val;
            updateRowTotal(row, product);
            saveCart();
            updateSummaryTotal();
        });
    });

    // Update total summary
    updateSummaryTotal();
}

export function renderCheckoutPage() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    // DOM elements
    const productsNameContainer = document.querySelector(
        ".product-name-container"
    );
    const productQuantityContainer = document.querySelector(
        ".product-quantity-container"
    );
    const productSubtotalContainer = document.querySelector(
        ".product-subtotal-container"
    );
    const subtotalAmountEl = document.querySelector(".subtotal-amount");
    const totalAmountEl = document.querySelector(".total-amount");

    // Reset containers
    productsNameContainer.innerHTML = "";
    productQuantityContainer.innerHTML = "";
    productSubtotalContainer.innerHTML = "";

    let subtotal = 0;

    // Render cart items
    cart.forEach((item) => {
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;

        const nameEl = document.createElement("p");
        nameEl.classList.add("product-name");
        nameEl.textContent = item.name;

        const qtyEl = document.createElement("p");
        qtyEl.classList.add("product-quantity");
        qtyEl.textContent = item.quantity;

        const subEl = document.createElement("p");
        subEl.classList.add("product-subtotal");
        subEl.textContent = `$${itemSubtotal.toFixed(2)}`;

        productsNameContainer.appendChild(nameEl);
        productQuantityContainer.appendChild(qtyEl);
        productSubtotalContainer.appendChild(subEl);
    });

    subtotalAmountEl.textContent = `$${subtotal.toFixed(2)}`;

    // Example shipping cost
    const shipping = 100;
    const total = subtotal + shipping;
    totalAmountEl.textContent = `$${total.toFixed(2)}`;

    // Handle form submit (Proceed button)
    const form = document.querySelector(".personal-info-form");
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        // Clear cart
        localStorage.removeItem("cart");

        // Show toast
        showToast("✅ Checkout completed successfully!");

        // Redirect after small delay
        setTimeout(() => {
            window.location.href = "./index.html";
        }, 1500);
    });
}

// Simple toast
function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.background = "#333";
    toast.style.color = "#fff";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "6px";
    toast.style.zIndex = "9999";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.5s ease";

    document.body.appendChild(toast);

    // Fade in
    setTimeout(() => (toast.style.opacity = "1"), 100);

    // Fade out and remove
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 500);
    }, 2000);
}
