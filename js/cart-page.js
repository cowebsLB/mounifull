import { fetchProducts, getCart, setCart, updateCartBadge, formatPrice, resolveAsset, calculateShippingFee, calculateTotalWithShipping } from './common.js';

// Global i18n instance
let i18n = null;

// Cart state
let cartItems = [];
let allProducts = [];

// DOM elements
const cartContent = document.getElementById('cartContent');
const emptyCart = document.getElementById('emptyCart');

// Initialize cart page
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for i18n to be available
    if (window.i18n) {
        i18n = window.i18n;
    } else {
        await new Promise(resolve => {
            const checkI18n = () => {
                if (window.i18n) {
                    i18n = window.i18n;
                    resolve();
                } else {
                    setTimeout(checkI18n, 100);
                }
            };
            checkI18n();
        });
    }
    
    // Load products and cart
    await loadData();
    renderCart();
    
    // Listen for language changes
    document.addEventListener('languageChanged', () => {
        renderCart();
    });
});

async function loadData() {
    try {
        allProducts = await fetchProducts();
        cartItems = getCart();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function renderCart() {
    if (cartItems.length === 0) {
        showEmptyCart();
        return;
    }
    
    hideEmptyCart();
    
    const cartHTML = `
        <div class="grid lg:grid-cols-3 gap-8">
            <!-- Cart Items -->
            <div class="lg:col-span-2">
                <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div class="p-6">
                        <h2 class="font-cormorant text-2xl text-terracotta mb-6" data-i18n="cart.itemsTitle">Cart Items</h2>
                        <div class="space-y-4" id="cartItemsList">
                            ${renderCartItems()}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Order Summary -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                    <h3 class="font-cormorant text-2xl text-terracotta mb-6" data-i18n="cart.orderSummary">Order Summary</h3>
                    
                    <div class="space-y-4 mb-6">
                        <div class="flex justify-between">
                            <span class="text-gray-600" data-i18n="cart.subtotal">Subtotal:</span>
                            <span class="font-semibold" id="subtotal">${formatPrice(calculateSubtotal())}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600" data-i18n="cart.delivery">Delivery:</span>
                            <span class="font-semibold" id="deliveryFee">${formatPrice(calculateDeliveryFee())}</span>
                        </div>
                        <div class="border-t pt-4">
                            <div class="flex justify-between text-lg font-semibold">
                                <span data-i18n="cart.total">Total:</span>
                                <span class="text-terracotta" id="total">${formatPrice(calculateTotal())}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <a href="products.html" class="w-full btn-secondary text-center block" data-i18n="cart.continueShopping">Continue Shopping</a>
                        <a href="checkout.html" class="w-full btn-primary text-center block" data-i18n="cart.proceedToCheckout">Proceed to Checkout</a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    cartContent.innerHTML = cartHTML;
    
    // Bind event listeners for quantity controls
    bindQuantityControls();
}

function renderCartItems() {
    return cartItems.map(item => {
        const product = allProducts.find(p => p.id === item.id);
        if (!product) return '';
        
        const currentLang = i18n ? i18n.currentLanguage : 'en';
        let productName, productDesc;
        
        // Get product name and description based on current language
        if (i18n && i18n.translations && i18n.translations[currentLang] && i18n.translations[currentLang].products) {
            const productKey = getProductKey(product);
            const productData = i18n.translations[currentLang].products[productKey];
            if (productData) {
                productName = productData.name;
                productDesc = productData.description;
            }
        }
        
        // Fallback to original data
        if (!productName) {
            productName = currentLang === 'ar' ? (product.nameAr || product.name) : (product.nameEn || product.name);
        }
        if (!productDesc) {
            productDesc = currentLang === 'ar' ? (product.descriptionAr || product.description) : (product.description || product.descriptionAr);
        }
        
        const subtotal = item.price * item.quantity;
        
        return `
            <div class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg" data-cart-item-id="${item.id}">
                <div class="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <img src="${resolveAsset(product.image)}" alt="${productName}" class="max-w-full max-h-full object-contain">
                </div>
                
                <div class="flex-1 min-w-0">
                    <h4 class="font-cormorant text-lg text-terracotta mb-1">${productName}</h4>
                    <p class="text-sm text-gray-600 mb-2">${productDesc}</p>
                    <div class="text-sm text-gray-500">
                        <span data-i18n="common.price">Price:</span> ${formatPrice(item.price)}
                    </div>
                </div>
                
                <div class="flex items-center gap-2">
                    <button class="quantity-btn w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors" data-action="decrease" data-id="${item.id}">
                        <i class="fas fa-minus text-xs"></i>
                    </button>
                    <span class="quantity-display w-12 text-center font-semibold" data-id="${item.id}">${item.quantity}</span>
                    <button class="quantity-btn w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors" data-action="increase" data-id="${item.id}">
                        <i class="fas fa-plus text-xs"></i>
                    </button>
                </div>
                
                <div class="text-right min-w-0">
                    <div class="font-semibold text-lg">${formatPrice(subtotal)}</div>
                    <button class="remove-btn text-red-500 hover:text-red-700 text-sm mt-1" data-action="remove" data-id="${item.id}">
                        <i class="fas fa-trash mr-1"></i><span data-i18n="cart.remove">Remove</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function bindQuantityControls() {
    // Quantity increase/decrease buttons
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            const id = parseInt(e.currentTarget.dataset.id);
            
            if (action === 'increase') {
                updateQuantity(id, 1);
            } else if (action === 'decrease') {
                updateQuantity(id, -1);
            }
        });
    });
    
    // Remove buttons
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            removeItem(id);
        });
    });
}

function updateQuantity(id, change) {
    const itemIndex = cartItems.findIndex(item => item.id === id);
    if (itemIndex === -1) return;
    
    const newQuantity = cartItems[itemIndex].quantity + change;
    
    if (newQuantity <= 0) {
        removeItem(id);
        return;
    }
    
    cartItems[itemIndex].quantity = newQuantity;
    setCart(cartItems);
    updateCartBadge();
    
    // Update display
    const quantityDisplay = document.querySelector(`[data-id="${id}"].quantity-display`);
    if (quantityDisplay) {
        quantityDisplay.textContent = newQuantity;
    }
    
    // Update subtotal for this item
    const itemElement = document.querySelector(`[data-cart-item-id="${id}"]`);
    if (itemElement) {
        const product = allProducts.find(p => p.id === id);
        const subtotal = product.price * newQuantity;
        const subtotalElement = itemElement.querySelector('.text-right .font-semibold');
        if (subtotalElement) {
            subtotalElement.textContent = formatPrice(subtotal);
        }
    }
    
    // Update totals
    updateTotals();
}

function removeItem(id) {
    cartItems = cartItems.filter(item => item.id !== id);
    setCart(cartItems);
    updateCartBadge();
    
    // Remove item from DOM
    const itemElement = document.querySelector(`[data-cart-item-id="${id}"]`);
    if (itemElement) {
        itemElement.remove();
    }
    
    // Check if cart is empty
    if (cartItems.length === 0) {
        showEmptyCart();
    } else {
        updateTotals();
    }
}

function updateTotals() {
    const subtotal = calculateSubtotal();
    const deliveryFee = calculateDeliveryFee();
    const total = subtotal + deliveryFee;
    
    const subtotalElement = document.getElementById('subtotal');
    const deliveryElement = document.getElementById('deliveryFee');
    const totalElement = document.getElementById('total');
    
    if (subtotalElement) subtotalElement.textContent = formatPrice(subtotal);
    if (deliveryElement) deliveryElement.textContent = formatPrice(deliveryFee);
    if (totalElement) totalElement.textContent = formatPrice(total);
}

function calculateSubtotal() {
    return cartItems.reduce((total, item) => {
        const product = allProducts.find(p => p.id === item.id);
        return total + (product ? product.price * item.quantity : 0);
    }, 0);
}

function calculateDeliveryFee() {
    const subtotal = calculateSubtotal();
    return calculateShippingFee(subtotal);
}

function calculateTotal() {
    const subtotal = calculateSubtotal();
    return calculateTotalWithShipping(subtotal);
}

function showEmptyCart() {
    cartContent.classList.add('hidden');
    emptyCart.classList.remove('hidden');
}

function hideEmptyCart() {
    cartContent.classList.remove('hidden');
    emptyCart.classList.add('hidden');
}

function getProductKey(product) {
    // Map product names to translation keys
    const name = product.nameEn || product.name || '';
    
    // Remove weight/quantity info to get base product name
    const baseName = name.replace(/\s+(200g|250g|250ml|330g|500g|500ml|1000g)\s*$/i, '').trim();
    
    // Map to translation keys
    const keyMap = {
        'Macdous': 'macdous',
        'Kishik': 'kishik',
        'Tomato Sauce': 'tomatoSauce',
        'Grape Leaves': 'grapeLeaves',
        'Pure Thymes': 'pureThymes',
        'Sumac': 'sumac',
        'Labneh with Olive Oil': 'labnehOliveOil',
        'Wax with Honeycomb': 'waxHoneycomb',
        'Almonds': 'almonds',
        'Walnuts': 'walnuts',
        'Molokhia': 'molokhia',
        'Dried Tomatoes': 'driedTomatoes',
        'Raisins': 'raisins',
        'Dried Figs': 'driedFigs',
        'Family Breakfast Bundle': 'familyBreakfastBundle',
        'Tradition & Taste Bundle': 'traditionTasteBundle',
        'Dried Mouni Bundle': 'driedMouniBundle',
        'Pure Honey': 'pureHoney',
        'Strawberry Jam': 'strawberryJam',
        'Pumpkin Jam': 'pumpkinJam',
        'Dark Syrup': 'darkSyrup',
        'Apricot Jam': 'apricotJam',
        'Dried Herbs': 'driedHerbs',
        'Dakka Kibbeh': 'dakkaKibbeh',
        'Rose Jam': 'roseJam',
        'Fig Jam': 'figJam',
        'Apple Vinegar': 'appleVinegar',
        'Dried Molokhia Leaves': 'driedMolokhiaLeaves',
        'Dried Mint': 'driedMint',
        'Grape Molasses': 'grapeMolasses',
        'Lebanese Dakka Kibbeh': 'lebaneseDakkaKibbeh'
    };
    
    return keyMap[baseName] || 'macdous'; // fallback to macdous if not found
}
