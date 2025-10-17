import { getCart, setCart, updateCartBadge, resolveAsset } from './common.js';

// Resolve checkout path based on current location
function resolveCheckoutPath() {
    const isPages = location.pathname.includes('/pages/');
    return isPages ? 'checkout.html' : 'pages/checkout.html';
}

// Resolve products path based on current location  
function resolveProductsPath() {
    const isPages = location.pathname.includes('/pages/');
    return isPages ? 'products.html' : 'pages/products.html';
}

class CartDrawer {
    constructor() {
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createCartDrawer();
        this.setupEventListeners();
        this.updateCartDisplay();
    }

    createCartDrawer() {
        // Create cart drawer HTML
        const cartDrawerHTML = `
            <div id="cartDrawer" class="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl transform translate-x-full transition-transform duration-300 ease-in-out z-50">
                <div class="flex flex-col h-full">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 class="font-cormorant text-2xl text-[#556b2f]">Shopping Cart</h2>
                        <button id="closeCartDrawer" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    <!-- Cart Items -->
                    <div id="cartItems" class="flex-1 overflow-y-auto p-6">
                        <!-- Items will be rendered here -->
                    </div>

                    <!-- Footer -->
                    <div class="border-t border-gray-200 p-6 bg-gray-50">
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-lg font-semibold">Total:</span>
                            <span id="cartTotal" class="text-xl font-bold text-[#c96a3d]">$0.00</span>
                        </div>
                        <div class="space-y-3">
                            <button id="viewCartBtn" class="w-full bg-[#556b2f] text-white py-3 rounded-lg font-medium hover:bg-[#4a5a2a] transition-colors">
                                <i class="fas fa-shopping-cart mr-2"></i>View Cart
                            </button>
                            <button id="checkoutBtn" class="w-full bg-[#c96a3d] text-white py-3 rounded-lg font-medium hover:bg-[#b55a2d] transition-colors">
                                <i class="fas fa-credit-card mr-2"></i>Checkout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cart Overlay -->
            <div id="cartOverlay" class="fixed inset-0 bg-black bg-opacity-50 hidden z-40"></div>
        `;

        document.body.insertAdjacentHTML('beforeend', cartDrawerHTML);
    }

    setupEventListeners() {
        // Cart icon click
        document.addEventListener('click', (e) => {
            if (e.target.closest('#cartIcon') || e.target.closest('.cart-icon')) {
                this.toggleCart();
            }
        });

        // Close cart drawer
        document.getElementById('closeCartDrawer').addEventListener('click', () => {
            this.closeCart();
        });

        // Close on overlay click
        document.getElementById('cartOverlay').addEventListener('click', () => {
            this.closeCart();
        });

        // View cart button
        document.getElementById('viewCartBtn').addEventListener('click', () => {
            window.location.href = resolveCheckoutPath();
        });

        // Checkout button
        document.getElementById('checkoutBtn').addEventListener('click', () => {
            window.location.href = resolveCheckoutPath();
        });

        // Cart item controls (delegate and allow icon clicks)
        document.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-item');
            const incBtn = e.target.closest('.increase-qty');
            const decBtn = e.target.closest('.decrease-qty');

            if (removeBtn) {
                const productId = parseInt(removeBtn.dataset.id);
                this.removeItem(productId);
                return;
            }
            if (incBtn) {
                const productId = parseInt(incBtn.dataset.id);
                this.updateQuantity(productId, 1);
                return;
            }
            if (decBtn) {
                const productId = parseInt(decBtn.dataset.id);
                this.updateQuantity(productId, -1);
                return;
            }
        });
    }

    toggleCart() {
        if (this.isOpen) {
            this.closeCart();
        } else {
            this.openCart();
        }
    }

    openCart() {
        this.isOpen = true;
        document.getElementById('cartDrawer').classList.remove('translate-x-full');
        document.getElementById('cartOverlay').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        this.updateCartDisplay();
    }

    closeCart() {
        this.isOpen = false;
        document.getElementById('cartDrawer').classList.add('translate-x-full');
        document.getElementById('cartOverlay').classList.add('hidden');
        document.body.style.overflow = '';
    }

    updateCartDisplay() {
        const cart = getCart();
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');

        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-shopping-cart text-4xl text-gray-300 mb-4"></i>
                    <h3 class="text-lg text-gray-600 mb-2">Your cart is empty</h3>
                    <p class="text-gray-500 mb-6">Add some products to get started!</p>
                    <button onclick="window.location.href='" + resolveProductsPath() + "'" class="bg-[#556b2f] text-white px-6 py-3 rounded-lg hover:bg-[#4a5a2a] transition-colors">
                        <i class="fas fa-shopping-bag mr-2"></i>Browse Products
                    </button>
                </div>
            `;
            cartTotal.textContent = '$0.00';
            return;
        }

        let total = 0;
        cartItems.innerHTML = cart.map(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            return `
                <div class="flex items-center space-x-4 py-4 border-b border-gray-100 last:border-b-0">
                    <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <img src="${resolveAsset(item.image)}" alt="${item.name}" class="max-w-full max-h-full object-contain">
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-medium text-gray-900 truncate">${item.name}</h4>
                        <p class="text-sm text-gray-500">$${item.price.toFixed(2)} each</p>
                        <div class="flex items-center space-x-2 mt-2">
                            <button class="decrease-qty w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors" data-id="${item.id}">
                                <i class="fas fa-minus text-xs"></i>
                            </button>
                            <span class="w-8 text-center font-medium">${item.quantity}</span>
                            <button class="increase-qty w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors" data-id="${item.id}">
                                <i class="fas fa-plus text-xs"></i>
                            </button>
                        </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                        <p class="font-semibold text-[#c96a3d]">$${itemTotal.toFixed(2)}</p>
                        <button class="remove-item text-red-500 hover:text-red-700 text-sm mt-1" data-id="${item.id}">
                            <i class="fas fa-trash mr-1"></i>Remove
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        cartTotal.textContent = `$${total.toFixed(2)}`;
    }

    updateQuantity(productId, change) {
        const cart = getCart();
        const item = cart.find(item => item.id === productId);
        
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeItem(productId);
                return;
            }
            setCart(cart);
            updateCartBadge();
            this.updateCartDisplay();
        }
    }

    removeItem(productId) {
        const cart = getCart();
        const updatedCart = cart.filter(item => item.id !== productId);
        setCart(updatedCart);
        updateCartBadge();
        this.updateCartDisplay();
        
        // Show notification
        this.showNotification('Item removed from cart', 'info');
    }

    showNotification(message, type = 'info') {
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
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize cart drawer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CartDrawer();
});

// Export for use in other modules
export { CartDrawer };
