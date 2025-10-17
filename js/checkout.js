import { getCart, setCart, getAddress, setAddress, formatPrice, validateEmail, validatePhone, validateRequired, showNotification, resolveAsset } from './common.js';
import { setupMobileMenu } from './mobile-menu.js';

class CheckoutManager {
    constructor() {
        this.cart = getCart();
        this.savedAddress = getAddress();
        this.init();
    }

    init() {
        this.renderCartSummary();
        this.setupFormValidation();
        this.loadSavedAddress();
        this.setupEventListeners();
    }

    renderCartSummary() {
        const cartSummary = document.getElementById('cartSummary');
        if (!cartSummary) return;

        if (this.cart.length === 0) {
            cartSummary.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-shopping-cart text-4xl text-gray-300 mb-4"></i>
                    <h3 class="text-lg text-gray-600 mb-2">Your cart is empty</h3>
                    <p class="text-gray-500 mb-6">Add some products to get started!</p>
                    <a href="products.html" class="bg-[#556b2f] text-white px-6 py-3 rounded-lg hover:bg-[#4a5a2a] transition-colors">
                        <i class="fas fa-shopping-bag mr-2"></i>Browse Products
                    </a>
                </div>
            `;
            return;
        }

        let total = 0;
        const cartItems = this.cart.map(item => {
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
                        <p class="text-sm text-gray-600">Quantity: ${item.quantity}</p>
                    </div>
                    <div class="text-right flex-shrink-0">
                        <p class="font-semibold text-[#c96a3d]">$${itemTotal.toFixed(2)}</p>
                    </div>
                </div>
            `;
        }).join('');

        const shipping = total > 50 ? 0 : 9.99;
        const finalTotal = total + shipping;

        cartSummary.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="font-cormorant text-2xl text-[#556b2f] mb-6">Order Summary</h3>
                
                <div class="space-y-4">
                    ${cartItems}
                </div>
                
                <div class="border-t border-gray-200 pt-4 mt-6 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Subtotal:</span>
                        <span class="font-medium">${formatPrice(total)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Shipping:</span>
                        <span class="font-medium">${shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                    </div>
                    ${shipping > 0 ? `
                        <div class="text-sm text-green-600 bg-green-50 p-2 rounded">
                            <i class="fas fa-truck mr-1"></i>Add $${(50 - total).toFixed(2)} more for free shipping!
                        </div>
                    ` : `
                        <div class="text-sm text-green-600 bg-green-50 p-2 rounded">
                            <i class="fas fa-check mr-1"></i>You qualify for free shipping!
                        </div>
                    `}
                    <div class="flex justify-between text-lg font-bold border-t border-gray-200 pt-3">
                        <span>Total:</span>
                        <span class="text-[#c96a3d]">${formatPrice(finalTotal)}</span>
                    </div>
                </div>
                
                <div class="mt-6 space-y-3">
                    <button id="sendWhatsAppOrder" class="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors">
                        <i class="fab fa-whatsapp mr-2"></i>Send Order via WhatsApp
                    </button>
                    <button id="saveForLater" class="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                        <i class="fas fa-save mr-2"></i>Save Order for Later
                    </button>
                </div>
            </div>
        `;
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

        // Show success message
        showNotification('Order information saved successfully!', 'success');
        
        // In a real application, you would proceed to payment processing here
        console.log('Order data:', {
            address: addressData,
            cart: this.cart,
            total: this.calculateTotal()
        });
    }

    saveAddressToStorage() {
        const form = document.getElementById('checkoutForm');
        if (!form) return;

        const addressData = {};
        const fields = ['fullName', 'address', 'phone', 'whatsapp', 'email', 'locationTag'];
        
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
        const shipping = subtotal > 50 ? 0 : 9.99;
        return subtotal + shipping;
    }

    sendWhatsAppOrder() {
        if (this.cart.length === 0) {
            showNotification('Your cart is empty!', 'warning');
            return;
        }

        const form = document.getElementById('checkoutForm');
        const formData = new FormData(form);
        
        let message = '🛒 *New Order from Mounifull Website*\n\n';
        message += '*Customer Information:*\n';
        message += `Name: ${formData.get('fullName') || 'Not provided'}\n`;
        message += `Phone: ${formData.get('phone') || 'Not provided'}\n`;
        message += `Address: ${formData.get('address') || 'Not provided'}\n\n`;
        
        message += '*Order Items:*\n';
        this.cart.forEach((item, index) => {
            message += `${index + 1}. ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}\n`;
        });
        
        message += `\n*Total: $${this.calculateTotal().toFixed(2)}*\n\n`;
        message += 'Please confirm this order. Thank you! 🙏';

        const whatsappNumber = '81796383';
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
    }
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

    new CheckoutManager();
    setupMobileMenu();
    setupBackToTop();
});

// Mobile menu functionality
function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const closeMobileMenu = document.getElementById('closeMobileMenu');
  const mobileMenuPanel = document.getElementById('mobileMenuPanel');
  
  if (!mobileMenuBtn || !mobileMenu || !closeMobileMenu || !mobileMenuPanel) return;
  
  // Open mobile menu
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.remove('hidden');
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    setTimeout(() => {
      mobileMenuPanel.classList.remove('-translate-x-full');
    }, 50); // Increased delay for slower animation
  });
  
  // Close mobile menu
  const closeMenu = () => {
    mobileMenuPanel.classList.add('-translate-x-full');
    setTimeout(() => {
      mobileMenu.classList.add('hidden');
      // Restore background scrolling
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }, 500); // Increased delay for slower animation
  };
  
  closeMobileMenu.addEventListener('click', closeMenu);
  
  // Close on backdrop click
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) {
      closeMenu();
    }
  });
  
  // Close on navigation link click
  mobileMenu.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
  
  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
      closeMenu();
    }
  });
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