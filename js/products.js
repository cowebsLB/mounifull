import { fetchProducts, getCart, setCart, updateCartBadge, resolveAsset } from './common.js';
import { setupMobileMenu } from './mobile-menu.js';

let allProducts = [];
let filteredProducts = [];
let groupedProducts = [];
let currentFilters = {
    search: '',
    sort: 'name-asc',
    category: 'all',
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
const categoryFilter = document.getElementById('categoryFilter');
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
        // Build grouped view by base name to reduce duplicates across weights/packaging
        groupedProducts = buildGroupedProducts(allProducts);
        filteredProducts = [...groupedProducts];
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

    // Category filter
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentFilters.category = e.target.value;
            applyFilters();
        });
    }

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

    // Ordering help modal
    const orderingHelpBtn = document.getElementById('orderingHelpBtn');
    const orderingHelpModal = document.getElementById('orderingHelpModal');
    const closeOrderingHelp = document.getElementById('closeOrderingHelp');

    if (orderingHelpBtn && orderingHelpModal) {
        orderingHelpBtn.addEventListener('click', () => {
            orderingHelpModal.classList.remove('hidden');
            orderingHelpModal.classList.add('flex');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeOrderingHelp && orderingHelpModal) {
        closeOrderingHelp.addEventListener('click', () => {
            orderingHelpModal.classList.add('hidden');
            orderingHelpModal.classList.remove('flex');
            document.body.style.overflow = '';
        });
    }

    // Close modal on backdrop click
    if (orderingHelpModal) {
        orderingHelpModal.addEventListener('click', (e) => {
            if (e.target === orderingHelpModal) {
                orderingHelpModal.classList.add('hidden');
                orderingHelpModal.classList.remove('flex');
                document.body.style.overflow = '';
            }
        });
    }
}

function applyFilters() {
    const lang = (window.i18n && window.i18n.currentLanguage) || 'en';
    filteredProducts = groupedProducts.filter(product => {
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

        // Category filter (dropdown)
        if (currentFilters.category !== 'all' && product.category !== currentFilters.category) {
            return false;
        }

        // Category filter (modal checkboxes)
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
                return (lang === 'ar' ? (a.baseNameAr || a.baseName) : (a.baseName || a.baseNameAr))
                    .localeCompare(lang === 'ar' ? (b.baseNameAr || b.baseName) : (b.baseName || b.baseNameAr));
            case 'name-desc':
                return (lang === 'ar' ? (b.baseNameAr || b.baseName) : (b.baseName || b.baseNameAr))
                    .localeCompare(lang === 'ar' ? (a.baseNameAr || a.baseName) : (a.baseName || a.baseNameAr));
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

    grid.innerHTML = filteredProducts.map(group => {
        const displayName = currentLanguage === 'ar' ? (group.baseNameAr || group.baseName) : group.baseName;
        const displayDesc = currentLanguage === 'ar' ? (group.descriptionAr || group.description || '') : (group.description || group.descriptionAr || '');
        const primary = group.primaryItem || group.items[0];
        const minPrice = Math.min(...group.items.map(p => p.price));
        const maxPrice = Math.max(...group.items.map(p => p.price));
        const priceText = minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)} – $${maxPrice.toFixed(2)}`;
        const anyOut = group.items.some(p => !p.inStock);

        return `
        <div class="product-card bg-white rounded-2xl shadow hover:shadow-lg transition-all overflow-hidden group" data-product-id="${primary.id}" data-group-key="${group.key}">
            <a href="product.html?id=${primary.id}&group=${encodeURIComponent(group.key)}" class="block">
                <div class="h-48 sm:h-56 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                    <img loading="lazy" src="${resolveAsset(primary.image)}" alt="${displayName}" class="max-h-48 sm:max-h-56 object-contain group-hover:scale-105 transition-transform duration-300">
                    ${anyOut ? '<div class="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">Some variants out</div>' : ''}
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="product-name font-cormorant text-2xl text-terracotta">${displayName}</h3>
                        <div class="flex items-center">
                            <span class="text-yellow-400 mr-1">${'★'.repeat(Math.floor(primary.rating))}</span>
                            <span class="text-gray-500 text-sm">${primary.rating}</span>
                        </div>
                    </div>
                    <p class="product-description text-gray-600 text-sm mb-4 line-clamp-2">${displayDesc}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-2xl text-terracotta font-semibold">${priceText}</span>
                        <a href="product.html?id=${primary.id}&group=${encodeURIComponent(group.key)}" class="btn bg-terracotta text-white px-4 py-2 rounded-full hover:bg-[#b55a2d] transition-colors">
                            View options
                        </a>
                    </div>
                </div>
            </a>
        </div>`;
    }).join('');

    count.textContent = `${filteredProducts.length} item${filteredProducts.length !== 1 ? 's' : ''}`;
}

// Build grouped product entries by base name (e.g., "Kishik" with 250/500/1000 and jar/pouch)
function buildGroupedProducts(products) {
    // Heuristic: base name is everything before the weight token at the end (e.g., " 250g", " 500g", " 1000g").
    const weightRegex = /(\s|^)(250g|500g|1000g)\s*$/i;
    const normalize = (name) => (name || '').trim();
    const groups = new Map();

    products.forEach(p => {
        const match = normalize(p.nameEn || p.name).match(weightRegex);
        const baseEn = match ? normalize((p.nameEn || p.name).replace(weightRegex, '')) : normalize(p.nameEn || p.name);
        const matchAr = normalize(p.nameAr || '').match(weightRegex);
        const baseAr = matchAr ? normalize((p.nameAr || '').replace(weightRegex, '')) : normalize(p.nameAr || '');
        const key = (baseEn || baseAr || (p.nameEn || p.name)).toLowerCase();

        if (!groups.has(key)) {
            groups.set(key, {
                key,
                baseName: baseEn || (p.nameEn || p.name),
                baseNameAr: baseAr || (p.nameAr || ''),
                description: p.description,
                descriptionAr: p.descriptionAr,
                items: [],
                primaryItem: null,
                price: p.price
            });
        }
        const g = groups.get(key);
        g.items.push(p);
        if (!g.primaryItem || (p.weight === '500g')) {
            g.primaryItem = p; // prefer mid weight if present
        }
        // Keep lowest price for sorting by price
        if (p.price < g.price) g.price = p.price;
    });

    return Array.from(groups.values());
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
    
    // Translate dropdown options after i18n system has run
    setTimeout(() => {
        translateDropdownOptions();
    }, 500);
    
    // Also run after a longer delay to catch any late language changes
    setTimeout(() => {
        translateDropdownOptions();
    }, 1000);
    
    // Listen for language changes
    document.addEventListener('languageChanged', () => {
        // Run immediately and also after a delay to ensure it works
        translateDropdownOptions();
        setTimeout(() => {
            translateDropdownOptions();
        }, 200);
    });
    
    // Also run when i18n system finishes loading
    document.addEventListener('i18nLoaded', () => {
        translateDropdownOptions();
    });
    
    // Run immediately when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            translateDropdownOptions();
        });
    } else {
        translateDropdownOptions();
    }
    
    // Make function available globally for debugging
    window.translateDropdowns = translateDropdownOptions;
}

// Function to translate dropdown options
function translateDropdownOptions() {
    // Get current language
    const currentLang = (window.i18n && window.i18n.currentLanguage) || 'en';
    console.log('🔧 Translating dropdowns for language:', currentLang);
    
    // Define translations directly
    const translations = {
        en: {
            'products.categories.all': 'All Categories',
            'products.categories.mainMouni': 'Main mouni',
            'products.categories.sweetMouni': 'Sweet mouni',
            'products.categories.mounifullBox': 'Mounifull box',
            'products.sort.nameAsc': 'Name A–Z',
            'products.sort.nameDesc': 'Name Z–A',
            'products.sort.priceAsc': 'Price Low → High',
            'products.sort.priceDesc': 'Price High → Low',
            'products.sort.newest': 'Newest',
            'products.sort.oldest': 'Oldest',
            'orderingHelp.title': 'How to Order',
            'orderingHelp.step1.title': 'Add to Cart',
            'orderingHelp.step1.description': 'Browse our products and click "Add to Cart" on items you want to purchase. You can adjust quantities as needed.',
            'orderingHelp.step1.tip': 'The cart icon shows your total items',
            'orderingHelp.step2.title': 'View Cart',
            'orderingHelp.step2.description': 'Click the cart icon in the top navigation to review your selected items, quantities, and total price.',
            'orderingHelp.step2.tip': 'You can modify or remove items here',
            'orderingHelp.step3.title': 'Check Out',
            'orderingHelp.step3.description': 'Click "Checkout" to proceed with your order. You\'ll be taken to a secure checkout page.',
            'orderingHelp.step3.tip': 'Review your order details before proceeding',
            'orderingHelp.step4.title': 'WhatsApp Message',
            'orderingHelp.step4.description': 'After checkout, you\'ll be redirected to WhatsApp to send your order details directly to us for confirmation and delivery arrangements.',
            'orderingHelp.step4.tip': 'We\'ll confirm your order and arrange delivery',
            'orderingHelp.needHelp.title': 'Need More Help?',
            'orderingHelp.needHelp.description': 'If you have any questions about our products or ordering process, feel free to contact us:',
            'orderingHelp.needHelp.whatsapp': 'WhatsApp Us',
            'orderingHelp.needHelp.email': 'Email Us'
        },
        ar: {
            'products.categories.all': 'جميع الفئات',
            'products.categories.mainMouni': 'المونة الرئيسية',
            'products.categories.sweetMouni': 'المونة الحلوة',
            'products.categories.mounifullBox': 'صندوق مونيفول',
            'products.sort.nameAsc': 'الاسم أ-ي',
            'products.sort.nameDesc': 'الاسم ي-أ',
            'products.sort.priceAsc': 'السعر من الأقل للأعلى',
            'products.sort.priceDesc': 'السعر من الأعلى للأقل',
            'products.sort.newest': 'الأحدث',
            'products.sort.oldest': 'الأقدم',
            'orderingHelp.title': 'كيفية الطلب',
            'orderingHelp.step1.title': 'أضف للسلة',
            'orderingHelp.step1.description': 'تصفح منتجاتنا واضغط على "أضف للسلة" للعناصر التي تريد شراءها. يمكنك تعديل الكميات حسب الحاجة.',
            'orderingHelp.step1.tip': 'أيقونة السلة تُظهر إجمالي العناصر',
            'orderingHelp.step2.title': 'عرض السلة',
            'orderingHelp.step2.description': 'اضغط على أيقونة السلة في التنقل العلوي لمراجعة العناصر المحددة والكميات والسعر الإجمالي.',
            'orderingHelp.step2.tip': 'يمكنك تعديل أو إزالة العناصر هنا',
            'orderingHelp.step3.title': 'الدفع',
            'orderingHelp.step3.description': 'اضغط على "الدفع" للمتابعة مع طلبك. ستُؤخذ إلى صفحة دفع آمنة.',
            'orderingHelp.step3.tip': 'راجع تفاصيل طلبك قبل المتابعة',
            'orderingHelp.step4.title': 'رسالة واتساب',
            'orderingHelp.step4.description': 'بعد الدفع، ستُؤخذ إلى واتساب لإرسال تفاصيل طلبك مباشرة إلينا للتأكيد وترتيب التوصيل.',
            'orderingHelp.step4.tip': 'سنؤكد طلبك ونرتب التوصيل',
            'orderingHelp.needHelp.title': 'تحتاج مساعدة أكثر؟',
            'orderingHelp.needHelp.description': 'إذا كان لديك أي أسئلة حول منتجاتنا أو عملية الطلب، لا تتردد في الاتصال بنا:',
            'orderingHelp.needHelp.whatsapp': 'راسلنا على واتساب',
            'orderingHelp.needHelp.email': 'راسلنا بالبريد'
        }
    };
    
    const langTranslations = translations[currentLang] || translations.en;
    
    // Translate category filter options
    const categoryOptions = categoryFilter.querySelectorAll('option');
    console.log('🔧 Found category options:', categoryOptions.length);
    categoryOptions.forEach(option => {
        const key = option.getAttribute('data-i18n');
        if (key && langTranslations[key]) {
            console.log('🔧 Translating:', key, '→', langTranslations[key]);
            option.textContent = langTranslations[key];
        } else if (key) {
            console.log('❌ Missing translation for:', key);
        }
    });
    
    // Translate sort options
    const sortOptions = sortSelect.querySelectorAll('option');
    sortOptions.forEach(option => {
        const key = option.getAttribute('data-i18n');
        if (key && langTranslations[key]) {
            option.textContent = langTranslations[key];
        }
    });
    
    // Translate ordering help modal elements
    const modalElements = document.querySelectorAll('#orderingHelpModal [data-i18n]');
    modalElements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (key && langTranslations[key]) {
            element.textContent = langTranslations[key];
        }
    });
}