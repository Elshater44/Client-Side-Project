import {
    fetchProducts,
    filterByCategory,
    initSearchBar,
    renderProducts,
    renderProductState,
    searchForProduct,
} from "./global.js";

const PRODUCT_LIMIT = 15;

async function loadProducts(load) {
    renderProductState("loading", "Loading products…");
    try {
        const products = await load();
        renderProducts(products);
    } catch (error) {
        console.error("Unable to load products:", error);
        renderProductState(
            "error",
            "We could not load products right now. Check your connection and try again.",
            () => loadProducts(load)
        );
    }
}

function setupCategoryFilters() {
    document.querySelectorAll(".category-filter").forEach((category) => {
        category.addEventListener("click", () => {
            const categoryName = category.dataset.category;
            const load = categoryName
                ? () => filterByCategory(categoryName, PRODUCT_LIMIT)
                : () => fetchProducts(PRODUCT_LIMIT);
            loadProducts(load);
        });
    });
}

window.addEventListener("DOMContentLoaded", () => {
    setupCategoryFilters();
    initSearchBar((query) => loadProducts(() => searchForProduct(query, PRODUCT_LIMIT)));

    const query = new URLSearchParams(window.location.search).get("search")?.trim();
    if (query) {
        const input = document.querySelector(".search-bar-input");
        if (input) input.value = query;
        loadProducts(() => searchForProduct(query, PRODUCT_LIMIT));
    } else {
        loadProducts(() => fetchProducts(PRODUCT_LIMIT));
    }
});
