// Home page interactions
import { updateCartBadge } from './common.js';
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

  // Initialize cart badge
  updateCartBadge();
  
  // Back to top functionality
  setupBackToTop();
  
  // Mobile menu functionality
  setupMobileMenu();
})();

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
