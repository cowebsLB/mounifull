// Common utilities
const PRODUCTS_URL = location.pathname.includes('/pages/') ? '../data/products.json' : 'data/products.json';
const CART_KEY = 'mounifull.cart';
const ADDRESS_KEY = 'mounifull.address';

export async function fetchProducts() {
  const res = await fetch(PRODUCTS_URL);
  if (!res.ok) throw new Error('Failed to load products');
  return await res.json();
}

export function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}

export function setCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartBadge(items);
}

export function updateCartBadge(items = getCart()) {
  const totalItems = items.reduce((n, it) => n + (it.quantity || 1), 0);
  
  // Update all cart badges
  const badges = [
    'cartBadge',
    'cartBadgeMobile',
    'cartBadgeMobileMenu'
  ];
  
  badges.forEach(badgeId => {
    const badge = document.getElementById(badgeId);
    if (badge) badge.textContent = totalItems;
  });
}

// Resolve asset path correctly from root or /pages/ context
export function resolveAsset(path) {
  const base = location.pathname.includes('/pages/') ? '../' : '';
  return `${base}${path}`;
}

// Address management
export function getAddress() {
  try { return JSON.parse(localStorage.getItem(ADDRESS_KEY) || '{}'); } catch { return {}; }
}

export function setAddress(address) {
  localStorage.setItem(ADDRESS_KEY, JSON.stringify(address));
}

// Utility functions
export function formatPrice(price) {
  return `$${price.toFixed(2)}`;
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium transform transition-all duration-300 ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 
    type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
  }`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Remove after duration
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, duration);
}

// Form validation
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePhone(phone) {
  const re = /^[\+]?[1-9][\d]{0,15}$/;
  return re.test(phone.replace(/\s/g, ''));
}

export function validateRequired(value) {
  return value && value.trim().length > 0;
}

// Initialize cart badge on page load
document.addEventListener('DOMContentLoaded', () => updateCartBadge());

// Register Service Worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const base = location.pathname.includes('/pages/') ? '../' : '';
    navigator.serviceWorker.register(`${base}sw.js`).catch(() => {});
  });
}