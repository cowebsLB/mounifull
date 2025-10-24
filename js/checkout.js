import { getCart, setCart, getAddress, setAddress, formatPrice, validateEmail, validatePhone, validateRequired, showNotification, resolveAsset, calculateShippingFee, calculateTotalWithShipping, updateCartBadge } from './common.js';
import { setupMobileMenu } from './mobile-menu.js';
import { createOrder } from './supabase-client.js';

class CheckoutManager {
    constructor() {
        this.cart = getCart();
        this.savedAddress = getAddress();
        this.init();
    }

    init() {
        // Refresh cart data to ensure it's up to date
        this.cart = getCart();
        // Validate cart data
        if (!Array.isArray(this.cart)) {
            this.cart = [];
            setCart([]);
        }
        
        this.renderCartSummary();
        this.setupFormValidation();
        this.loadSavedAddress();
        this.setupEventListeners();
    }

    renderCartSummary() {
        const cartSummary = document.getElementById('checkoutCartSummary');
        const checkoutTotal = document.getElementById('checkoutTotal');
        
        if (!cartSummary) {
            return;
        }

        // Check if cart is empty or invalid
        if (!this.cart || !Array.isArray(this.cart) || this.cart.length === 0) {
            cartSummary.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-shopping-cart text-4xl text-gray-300 mb-4"></i>
                    <h3 class="text-lg text-gray-600 mb-2" data-i18n="cart.emptyTitle">Your cart is empty</h3>
                    <p class="text-gray-500 mb-6" data-i18n="cart.emptyMessage">Add some products to get started!</p>
                    <a href="products.html" class="bg-[#556b2f] text-white px-6 py-3 rounded-lg hover:bg-[#4a5a2a] transition-colors" data-i18n="cart.browseProducts">
                        <i class="fas fa-shopping-bag mr-2"></i>Browse Products
                    </a>
                </div>
            `;
            if (checkoutTotal) checkoutTotal.textContent = '$0.00';
            return;
        }

        let total = 0;
        const cartItems = this.cart.map(item => {
            // Ensure all required properties exist
            const itemName = item.name || 'Unknown Product';
            const itemPrice = item.price || 0;
            const itemQuantity = item.quantity || 1;
            const itemImage = item.image || 'assets/logos/logo-removebg-preview.png';
            
            const itemTotal = itemPrice * itemQuantity;
            total += itemTotal;
            
            return `
                <div class="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                    <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <img src="${resolveAsset(itemImage)}" alt="${itemName}" class="max-w-full max-h-full object-contain">
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-medium text-gray-900 truncate text-sm">${itemName}</h4>
                        <p class="text-xs text-gray-500">${formatPrice(itemPrice)} × ${itemQuantity}</p>
                    </div>
                    <div class="text-right flex-shrink-0">
                        <p class="font-semibold text-terracotta text-sm">${formatPrice(itemTotal)}</p>
                    </div>
                </div>
            `;
        }).join('');

        const shipping = calculateShippingFee(total);
        const finalTotal = calculateTotalWithShipping(total);

        cartSummary.innerHTML = `
            <div class="space-y-2">
                ${cartItems}
            </div>
            <div class="border-t pt-3 mt-3 space-y-2">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600" data-i18n="cart.subtotal">Subtotal:</span>
                    <span class="font-medium">${formatPrice(total)}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600" data-i18n="cart.delivery">Delivery:</span>
                    <span class="font-medium">${shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
            </div>
        `;
        
        if (checkoutTotal) {
            checkoutTotal.textContent = formatPrice(finalTotal);
        }
    }

    setupFormValidation() {
        const form = document.getElementById('checkoutForm');
        if (!form) return;

        const inputs = form.querySelectorAll('input[required], textarea[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Email validation
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                if (emailInput.value && !validateEmail(emailInput.value)) {
                    this.showFieldError(emailInput, 'Please enter a valid email address');
                }
            });
        }

        // Phone validation
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('blur', () => {
                if (phoneInput.value && !validatePhone(phoneInput.value)) {
                    this.showFieldError(phoneInput, 'Please enter a valid phone number');
                }
            });
        }
    }

    validateField(field) {
        const value = field.value.trim();
        const isRequired = field.hasAttribute('required');
        
        if (isRequired && !validateRequired(value)) {
            this.showFieldError(field, `${this.getFieldLabel(field)} is required`);
            return false;
        }
        
        this.clearFieldError(field);
        return true;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        field.classList.add('border-red-500');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 text-sm mt-1 field-error';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('border-red-500');
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    getFieldLabel(field) {
        const label = field.previousElementSibling;
        return label ? label.textContent.replace('*', '').trim() : field.placeholder || 'This field';
    }

    loadSavedAddress() {
        if (Object.keys(this.savedAddress).length === 0) return;

        Object.keys(this.savedAddress).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                field.value = this.savedAddress[key];
            }
        });
    }

    setupEventListeners() {
        // Save address checkbox
        const saveAddressCheckbox = document.getElementById('saveAddress');
        if (saveAddressCheckbox) {
            saveAddressCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.saveAddressToStorage();
                }
            });
        }

        // Form submission
        const form = document.getElementById('checkoutForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission();
            });
        }

        // Send WhatsApp order button (from cart summary)
        const sendWhatsAppBtn = document.getElementById('sendWhatsAppOrder');
        if (sendWhatsAppBtn) {
            sendWhatsAppBtn.addEventListener('click', () => {
                this.sendWhatsAppOrder();
            });
        }

        // Listen for cart changes from other pages
        document.addEventListener('cartUpdated', () => {
            this.cart = getCart();
            this.renderCartSummary();
        });

        // Save for later button
        const saveBtn = document.getElementById('saveForLater');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveOrderForLater();
            });
        }
    }

    handleFormSubmission() {
        const form = document.getElementById('checkoutForm');
        if (!form) return;

        const formData = new FormData(form);
        const addressData = {};
        
        // Validate all required fields
        let isValid = true;
        const requiredFields = ['fullName', 'address', 'phone'];
        
        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field && !this.validateField(field)) {
                isValid = false;
            }
            if (field) {
                addressData[fieldName] = field.value.trim();
            }
        });

        if (!isValid) {
            showNotification('Please fill in all required fields correctly', 'error');
            return;
        }

        // Save address if checkbox is checked
        const saveAddressCheckbox = document.getElementById('saveAddress');
        if (saveAddressCheckbox && saveAddressCheckbox.checked) {
            setAddress(addressData);
        }

        // Send order via WhatsApp
        this.sendWhatsAppOrder();
    }

    saveAddressToStorage() {
        const form = document.getElementById('checkoutForm');
        if (!form) return;

        const addressData = {};
        const fields = ['fullName', 'address', 'phone', 'whatsapp', 'email'];
        
        fields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field) {
                addressData[fieldName] = field.value.trim();
            }
        });

        setAddress(addressData);
        showNotification('Address saved for future orders!', 'success');
    }

    saveOrderForLater() {
        const orderData = {
            cart: this.cart,
            timestamp: new Date().toISOString(),
            total: this.calculateTotal()
        };

        localStorage.setItem('mounifull.savedOrder', JSON.stringify(orderData));
        showNotification('Order saved for later! You can continue shopping.', 'success');
    }

    calculateTotal() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return calculateTotalWithShipping(subtotal);
    }

    async sendWhatsAppOrder() {
        if (this.cart.length === 0) {
            showNotification('Your cart is empty!', 'warning');
            return;
        }

        const form = document.getElementById('checkoutForm');
        if (!form) {
            console.error('Checkout form not found!');
            showNotification('Checkout form not found!', 'error');
            return;
        }

        const formData = new FormData(form);
        
        // Create a formatted message for WhatsApp
        let message = '🛒 *NEW ORDER FROM MOUNIFULL WEBSITE*\n\n';
        
        // Customer info section
        message += '👤 *CUSTOMER DETAILS:*\n';
        message += `📝 Name: ${formData.get('fullName') || 'Not provided'}\n`;
        message += `📞 Phone: ${formData.get('phone') || 'Not provided'}\n`;
        message += `📍 Address: ${formData.get('address') || 'Not provided'}\n\n`;
        
        // Order items section
        message += '🛍️ *ORDER ITEMS:*\n';
        let subtotal = 0;
        this.cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            message += `${index + 1}. ${item.name} x${item.quantity} = $${itemTotal.toFixed(2)}\n`;
        });
        
        const shipping = calculateShippingFee(subtotal);
        const total = calculateTotalWithShipping(subtotal);
        
        // Order summary section
        message += '\n💰 *ORDER SUMMARY:*\n';
        message += `Subtotal: $${subtotal.toFixed(2)}\n`;
        message += `Delivery: ${shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}\n`;
        message += `*TOTAL: $${total.toFixed(2)}*\n\n`;
        message += '✅ Please confirm this order. Thank you!';

        const whatsappNumber = '9613771326';
        
        // Ensure proper URL encoding for WhatsApp
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        
        // Check if URL is too long for WhatsApp (limit is around 2000 characters)
        if (whatsappUrl.length > 2000) {
            // Truncate message if too long
            const maxMessageLength = 1500; // Leave room for URL structure
            const truncatedMessage = message.substring(0, maxMessageLength) + '\n\n... (message truncated)';
            const truncatedEncoded = encodeURIComponent(truncatedMessage);
            const truncatedUrl = `https://wa.me/${whatsappNumber}?text=${truncatedEncoded}`;
            
            try {
                window.open(truncatedUrl, '_blank');
            } catch (error) {
                console.error('Error opening WhatsApp:', error);
                showNotification('Error opening WhatsApp. Please try again.', 'error');
                return;
            }
        } else {
            try {
                // Open WhatsApp with the formatted message
                window.open(whatsappUrl, '_blank');
            } catch (error) {
                console.error('Error opening WhatsApp:', error);
                showNotification('Error opening WhatsApp. Please try again.', 'error');
                return;
            }
        }
        
        // Save order to Supabase
        await this.saveOrderToSupabase(formData, subtotal, shipping, total);
        
        // Clear the cart after successful order
        this.cart = [];
        setCart([]);
        updateCartBadge();
        
        // Dispatch cart updated event for other components
        document.dispatchEvent(new CustomEvent('cartUpdated'));
        
        // Refresh the cart summary to show empty state
        this.renderCartSummary();
        
        // Show success notification
        showNotification('Order sent to WhatsApp! We will contact you soon.', 'success');
    }

    async saveOrderToSupabase(formData, subtotal, shipping, total) {
        try {
            // Prepare order items
            const orderItems = this.cart.map(item => ({
                product_id: item.id,
                product_name: item.name,
                quantity: item.quantity,
                price: item.price
            }));

            // Prepare order data
            const orderData = {
                customer_name: formData.get('fullName') || 'Not provided',
                customer_phone: formData.get('phone') || 'Not provided',
                customer_address: formData.get('address') || 'Not provided',
                order_items: orderItems,
                subtotal: subtotal,
                shipping_fee: shipping,
                total: total,
                status: 'pending',
                order_date: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            // Save to Supabase using the new client
            await createOrder(orderData);
            console.log('✅ Order saved to Supabase successfully');
            
        } catch (error) {
            console.error('❌ Error saving order to Supabase:', error);
            // Don't throw error - order should still proceed even if database save fails
        }
    }
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

// Initialize checkout manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
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

    // Small delay to ensure all modules are loaded
    setTimeout(() => {
        new CheckoutManager();
    }, 100);
    setupMobileMenu();
    setupBackToTop();
});
