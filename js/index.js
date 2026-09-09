import { fetchProducts, renderProducts, renderProductState } from "./global.js";

async function loadFeaturedProducts() {
    renderProductState("loading", "Loading featured products…");
    try {
        renderProducts(await fetchProducts(5));
    } catch (error) {
        console.error("Unable to load featured products:", error);
        renderProductState(
            "error",
            "We could not load featured products right now. Please try again.",
            loadFeaturedProducts
        );
    }
}

function initHeroSearchRedirect() {
    const form = document.querySelector(".search-bar-form");
    const input = document.querySelector(".search-bar-input");
    if (!form) return;

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const query = input?.value.trim();
        window.location.href = `./products.html${
            query ? `?search=${encodeURIComponent(query)}` : ""
        }`;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initHeroSearchRedirect();
    loadFeaturedProducts();
});
