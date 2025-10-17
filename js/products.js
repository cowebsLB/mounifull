import { fetchProducts, getCart, setCart, updateCartBadge, resolveAsset } from './common.js';
import { setupMobileMenu } from './mobile-menu.js';

let allProducts = [];
let filteredProducts = [];
let currentFilters = {
    search: '',
    sort: 'name-asc',
    priceMin: '',
    priceMax: '',
    categories: [],
    availability: 'all',
    dateFrom: '',
    dateTo: '',
    minRating: 0
};

// DOM elements
const searchInput = document.getElementById('search');
const searchMobile = document.getElementById('searchMobile');
const sortSelect = document.getElementById('sort');
const grid = document.getElementById('grid');
const count = document.getElementById('count');
const filterModal = document.getElementById('filterModal');
const openFilterBtn = document.getElementById('openFilter');
const openFilterMobile = document.getElementById('openFilterMobile');
// Inline compact controls (top-row minimized)
const searchCompactInline = document.getElementById('searchCompactInline');
const openFilterCompactInline = document.getElementById('openFilterCompactInline');
const closeFilterBtn = document.getElementById('closeFilter');
const applyFiltersBtn = document.getElementById('applyFilters');
const resetFiltersBtn = document.getElementById('resetFilters');

// Global function for updating product translations
window.updateProductTranslations = (language) => {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        const productId = parseInt(card.dataset.productId);
        const product = allProducts.find(p => p.id === productId);
        
        if (product) {
            const nameElement = card.querySelector('.product-name');
            const descriptionElement = card.querySelector('.product-description');
            
            if (nameElement) {
                nameElement.textContent = language === 'ar' ? product.nameAr : product.nameEn;
            }
            
            if (descriptionElement) {
                descriptionElement.textContent = language === 'ar' ? product.descriptionAr : product.description;
            }
        }
    });
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Lenis smooth scrolling
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Initialize header minimization
    setupHeaderMinimization();

    try {
        allProducts = await fetchProducts();
        filteredProducts = [...allProducts];
        renderProducts();
        updateCartBadge();
        setupEventListeners();
        setupMobileMenu();
    } catch (error) {
        console.error('Error loading products:', error);
        grid.innerHTML = '<p class="text-center text-red-500">Error loading products. Please refresh the page.</p>';
    }
});

function setupEventListeners() {
    // Search (desktop, compact, and mobile)
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilters.search = e.target.value.toLowerCase();
            applyFilters();
        });
    }
    
    const searchCompact = document.getElementById('searchCompact');
    if (searchCompact) {
        searchCompact.addEventListener('input', (e) => {
            currentFilters.search = e.target.value.toLowerCase();
            applyFilters();
        });
    }
    if (searchCompactInline) {
        searchCompactInline.addEventListener('input', (e) => {
            currentFilters.search = e.target.value.toLowerCase();
            applyFilters();
        });
    }
    
    if (searchMobile) {
        searchMobile.addEventListener('input', (e) => {
            currentFilters.search = e.target.value.toLowerCase();
            applyFilters();
        });
    }

    // Sort
    sortSelect.addEventListener('change', (e) => {
        currentFilters.sort = e.target.value;
        applyFilters();
    });

    // Filter modal (desktop, compact, and mobile)
    if (openFilterBtn) {
        openFilterBtn.addEventListener('click', () => {
            filterModal.classList.remove('hidden');
            filterModal.classList.add('flex');
        });
    }
    
    const openFilterCompact = document.getElementById('openFilterCompact');
    if (openFilterCompact) {
        openFilterCompact.addEventListener('click', () => {
            filterModal.classList.remove('hidden');
            filterModal.classList.add('flex');
        });
    }
    if (openFilterCompactInline) {
        openFilterCompactInline.addEventListener('click', () => {
            filterModal.classList.remove('hidden');
            filterModal.classList.add('flex');
        });
    }
    
    if (openFilterMobile) {
        openFilterMobile.addEventListener('click', () => {
            filterModal.classList.remove('hidden');
            filterModal.classList.add('flex');
        });
    }

    if (closeFilterBtn) closeFilterBtn.addEventListener('click', closeFilterModal);
    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', applyFilterModal);
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilterModal);
    
    // Rating buttons
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('bg-[#556b2f]', 'text-white'));
            btn.classList.add('bg-[#556b2f]', 'text-white');
            currentFilters.minRating = parseInt(btn.dataset.rating);
        });
    });

    // Close modal on backdrop click
    filterModal.addEventListener('click', (e) => {
        if (e.target === filterModal) {
            closeFilterModal();
        }
    });

    // Add to cart buttons
    grid.addEventListener('click', (e) => {
        if (e.target.classList.contains('add') || e.target.closest('.add')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target.classList.contains('add') ? e.target : e.target.closest('.add');
            const productId = parseInt(btn.dataset.id);
            addToCart(productId);
        }
    });

    // Rating buttons
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('bg-[#556b2f]', 'text-white'));
            e.target.classList.add('bg-[#556b2f]', 'text-white');
            currentFilters.minRating = parseInt(e.target.dataset.rating);
        });
    });
}

function applyFilters() {
    const lang = (window.i18n && window.i18n.currentLanguage) || 'en';
    filteredProducts = allProducts.filter(product => {
        // Language-aware fields
        const nameField = lang === 'ar' ? (product.nameAr || product.name) : (product.nameEn || product.name);
        const descField = lang === 'ar' ? (product.descriptionAr || product.description) : (product.description || product.descriptionAr || '');

        // Search filter (language aware)
        if (currentFilters.search) {
            const query = currentFilters.search;
            if (!nameField.toLowerCase().includes(query) && !descField.toLowerCase().includes(query)) {
                return false;
            }
        }

        // Price range filter
        if (currentFilters.priceMin && product.price < parseFloat(currentFilters.priceMin)) {
            return false;
        }
        if (currentFilters.priceMax && product.price > parseFloat(currentFilters.priceMax)) {
            return false;
        }

        // Category filter
        if (currentFilters.categories.length > 0 && !currentFilters.categories.includes(product.category)) {
            return false;
        }

        // Availability filter
        if (currentFilters.availability === 'in-stock' && !product.inStock) {
            return false;
        }
        if (currentFilters.availability === 'new') {
            const productDate = new Date(product.date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            if (productDate < thirtyDaysAgo) {
                return false;
            }
        }

        // Date range filter
        if (currentFilters.dateFrom) {
            const productDate = new Date(product.date);
            const fromDate = new Date(currentFilters.dateFrom);
            if (productDate < fromDate) {
                return false;
            }
        }
        if (currentFilters.dateTo) {
            const productDate = new Date(product.date);
            const toDate = new Date(currentFilters.dateTo);
            if (productDate > toDate) {
                return false;
            }
        }

        // Rating filter
        if (currentFilters.minRating > 0 && product.rating < currentFilters.minRating) {
            return false;
        }

        return true;
    });

    // Sort products
    sortProducts();
    renderProducts();
}

function sortProducts() {
    const lang = (window.i18n && window.i18n.currentLanguage) || 'en';
    filteredProducts.sort((a, b) => {
        switch (currentFilters.sort) {
            case 'name-asc':
                return (lang === 'ar' ? (a.nameAr || a.name) : (a.nameEn || a.name))
                    .localeCompare(lang === 'ar' ? (b.nameAr || b.name) : (b.nameEn || b.name));
            case 'name-desc':
                return (lang === 'ar' ? (b.nameAr || b.name) : (b.nameEn || b.name))
                    .localeCompare(lang === 'ar' ? (a.nameAr || a.name) : (a.nameEn || a.name));
            case 'price-asc':
                return a.price - b.price;
            case 'price-desc':
                return b.price - a.price;
            case 'date-desc':
                return new Date(b.date) - new Date(a.date);
            case 'date-asc':
                return new Date(a.date) - new Date(b.date);
            default:
                return 0;
        }
    });
}

function renderProducts() {
    if (filteredProducts.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-search text-4xl text-gray-400 mb-4"></i>
                <h3 class="text-xl text-gray-600 mb-2">No products found</h3>
                <p class="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
        `;
        count.textContent = '0 items';
        return;
    }

    const currentLanguage = window.i18n ? window.i18n.currentLanguage : 'en';
    
    grid.innerHTML = filteredProducts.map(product => `
        <div class="product-card bg-white rounded-2xl shadow hover:shadow-lg transition-all overflow-hidden group" data-product-id="${product.id}">
            <a href="product.html?id=${product.id}" class="block">
                <div class="h-48 sm:h-56 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                    <img loading="lazy" src="${resolveAsset(product.image)}" alt="${currentLanguage === 'ar' ? product.nameAr : product.nameEn}" class="max-h-48 sm:max-h-56 object-contain group-hover:scale-105 transition-transform duration-300">
                    ${!product.inStock ? '<div class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">Out of Stock</div>' : ''}
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="product-name font-cormorant text-2xl text-terracotta">${currentLanguage === 'ar' ? product.nameAr : product.nameEn}</h3>
                        <div class="flex items-center">
                            <span class="text-yellow-400 mr-1">${'★'.repeat(Math.floor(product.rating))}</span>
                            <span class="text-gray-500 text-sm">${product.rating}</span>
                        </div>
                    </div>
                    <p class="product-description text-gray-600 text-sm mb-4 line-clamp-2">${currentLanguage === 'ar' ? product.descriptionAr : product.description}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-2xl text-terracotta font-semibold">$${product.price.toFixed(2)}</span>
                        <button data-id="${product.id}" class="add btn bg-terracotta text-white px-4 py-2 rounded-full hover:bg-[#b55a2d] transition-colors ${!product.inStock ? 'opacity-50 cursor-not-allowed' : ''}" ${!product.inStock ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus mr-2"></i>Add to Cart
                        </button>
                    </div>
                </div>
            </a>
        </div>
    `).join('');

    count.textContent = `${filteredProducts.length} item${filteredProducts.length !== 1 ? 's' : ''}`;
}

function applyFilterModal() {
    // Get filter values
    currentFilters.priceMin = document.getElementById('priceMin').value;
    currentFilters.priceMax = document.getElementById('priceMax').value;
    currentFilters.dateFrom = document.getElementById('dateFrom').value;
    currentFilters.dateTo = document.getElementById('dateTo').value;

    // Get selected categories
    currentFilters.categories = Array.from(document.querySelectorAll('.category-filter:checked')).map(cb => cb.value);

    // Get selected availability
    const selectedAvailability = document.querySelector('input[name="availability"]:checked');
    currentFilters.availability = selectedAvailability ? selectedAvailability.value : 'all';

    applyFilters();
    closeFilterModal();
}

function resetFilterModal() {
    // Reset all filter inputs
    document.getElementById('priceMin').value = '';
    document.getElementById('priceMax').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    
    document.querySelectorAll('.category-filter').forEach(cb => cb.checked = false);
    document.querySelector('input[name="availability"][value="all"]').checked = true;
    
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.classList.remove('bg-[#556b2f]', 'text-white');
        if (btn.dataset.rating === '0') {
            btn.classList.add('bg-[#556b2f]', 'text-white');
        }
    });

    // Reset filter state
    currentFilters = {
        search: searchInput.value.toLowerCase(),
        sort: sortSelect.value,
        priceMin: '',
        priceMax: '',
        categories: [],
        availability: 'all',
        dateFrom: '',
        dateTo: '',
        minRating: 0
    };

    applyFilters();
    closeFilterModal();
}

function closeFilterModal() {
    filterModal.classList.add('hidden');
    filterModal.classList.remove('flex');
    // Restore background scrolling
    document.body.style.overflow = '';
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || !product.inStock) return;

    const cart = getCart();
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    setCart(cart);
    updateCartBadge();
    
    // Show success message
    showNotification(`${product.name} added to cart!`, 'success');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Header minimization functionality
function setupHeaderMinimization() {
    const header = document.getElementById('mainHeader');
    const nav = header.querySelector('nav');
    const compactControls = nav.querySelector('.compact-controls');
    const desktopControls = nav.querySelector('.desktop-controls');
    let lastScrollY = window.scrollY;
    let isMinimized = false;
    
    // Sync search inputs
    const searchInput = document.getElementById('search');
    const searchCompact = document.getElementById('searchCompact');
    const searchMobile = document.getElementById('searchMobile');
    const searchInline = document.getElementById('searchCompactInline');
    
    // Sync filter buttons
    const openFilterBtn = document.getElementById('openFilter');
    const openFilterCompact = document.getElementById('openFilterCompact');
    const openFilterMobile = document.getElementById('openFilterMobile');
    
    // Sync search functionality (for header minimization - only sync values, not trigger events)
    function syncSearchInputs() {
        searchInput.addEventListener('input', () => {
            if (searchCompact.value !== searchInput.value) {
                searchCompact.value = searchInput.value;
            }
            if (searchMobile.value !== searchInput.value) {
                searchMobile.value = searchInput.value;
            }
            if (searchInline && searchInline.value !== searchInput.value) {
                searchInline.value = searchInput.value;
            }
        });
        searchCompact.addEventListener('input', () => {
            if (searchInput.value !== searchCompact.value) {
                searchInput.value = searchCompact.value;
            }
            if (searchMobile.value !== searchCompact.value) {
                searchMobile.value = searchCompact.value;
            }
            if (searchInline && searchInline.value !== searchCompact.value) {
                searchInline.value = searchCompact.value;
            }
        });
        searchMobile.addEventListener('input', () => {
            if (searchInput.value !== searchMobile.value) {
                searchInput.value = searchMobile.value;
            }
            if (searchCompact.value !== searchMobile.value) {
                searchCompact.value = searchMobile.value;
            }
            if (searchInline && searchInline.value !== searchMobile.value) {
                searchInline.value = searchMobile.value;
            }
        });
        if (searchInline) {
            searchInline.addEventListener('input', () => {
                if (searchInput.value !== searchInline.value) {
                    searchInput.value = searchInline.value;
                }
                if (searchCompact.value !== searchInline.value) {
                    searchCompact.value = searchInline.value;
                }
                if (searchMobile.value !== searchInline.value) {
                    searchMobile.value = searchInline.value;
                }
            });
        }
    }
    
    // Sync filter functionality (for header minimization)
    function syncFilterButtons() {
        openFilterBtn.addEventListener('click', () => {
            openFilterModal();
        });
        openFilterCompact.addEventListener('click', () => {
            openFilterModal();
        });
        openFilterMobile.addEventListener('click', () => {
            openFilterModal();
        });
    }
    
    // Helper function to open filter modal
    function openFilterModal() {
        const filterModal = document.getElementById('filterModal');
        if (filterModal) {
            filterModal.classList.remove('hidden');
            filterModal.classList.add('flex');
            // Prevent background scrolling
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Throttle scroll events for better performance
    let ticking = false;
    
    function updateHeader() {
        // Only apply minimization on mobile/tablet screens
        if (window.innerWidth >= 1024) {
            return; // Skip minimization on desktop
        }
        
        const currentScrollY = window.scrollY;
        const scrollThreshold = 100; // Start minimizing after 100px scroll
        
        if (currentScrollY > scrollThreshold && !isMinimized) {
            // Minimize header
            nav.classList.add('header-compact');
            isMinimized = true;
        } else if (currentScrollY <= scrollThreshold && isMinimized) {
            // Restore header
            nav.classList.remove('header-compact');
            isMinimized = false;
        }
        
        lastScrollY = currentScrollY;
        ticking = false;
    }
    
    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }
    
    // Initialize sync functions
    syncSearchInputs();
    syncFilterButtons();
    
    // Listen for scroll events
    window.addEventListener('scroll', onScroll, { passive: true });
    
    // Also listen to Lenis scroll events for smooth scrolling compatibility
    if (window.lenis) {
        window.lenis.on('scroll', onScroll);
    }
    
    // Initialize back to top functionality
    setupBackToTop();
}

function setupBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    if (!backToTopBtn) return;
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    // Smooth scroll to top when clicked
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}