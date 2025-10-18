// Home page interactions
import { updateCartBadge, getCart, setCart, fetchProducts } from './common.js';
import { setupMobileMenu } from './mobile-menu.js';

(function(){
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

  // Enhanced scroll animations
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -100px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  // Observe all animation elements
  document.querySelectorAll('.fade-in-up, .slide-in-left, .slide-in-right').forEach(el => {
    observer.observe(el);
  });

  // Smooth scroll for internal anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Hover effects for cards
  document.querySelectorAll('.card-modern').forEach(card => {
    card.addEventListener('mouseenter', function(){ this.style.transform = 'translateY(-8px) scale(1.02)'; });
    card.addEventListener('mouseleave', function(){ this.style.transform = 'translateY(0) scale(1)'; });
  });

  // CTA buttons
  const viewAll = document.querySelector('.view-all-products');
  if (viewAll) viewAll.addEventListener('click', ()=> { window.location.href = 'pages/products.html'; });

  const goToProducts = document.querySelector('.go-to-products');
  if (goToProducts) goToProducts.addEventListener('click', ()=> { window.location.href = 'pages/products.html'; });

  // Add to cart functionality for featured products
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-product-id]')) {
      e.preventDefault();
      e.stopPropagation();
      const productId = parseInt(e.target.dataset.productId);
      addToCart(productId);
    }
  });

  // Initialize cart badge
  updateCartBadge();
  
  // Back to top functionality
  setupBackToTop();
  
  // Mobile menu functionality
  setupMobileMenu();
})();

// Add to cart function for featured products
async function addToCart(productId) {
  try {
    const products = await fetchProducts();
    const product = products.find(p => p.id === productId);
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
  } catch (error) {
    console.error('Error adding to cart:', error);
    showNotification('Error adding product to cart', 'error');
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium transform transition-all duration-300 ${
    type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
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
