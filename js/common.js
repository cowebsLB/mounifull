// Common utilities
// Centralized path resolution
export function getBasePath() {
  return location.pathname.includes('/pages/') ? '../' : '';
}

export function getProductsUrl() {
  return `${getBasePath()}data/products.json`;
}

export function getAssetPath(path) {
  return `${getBasePath()}${path}`;
}

// Import the new Supabase client
import { fetchProducts as fetchProductsFromSupabase } from './supabase-client.js';

const PRODUCTS_URL = getProductsUrl();
const CART_KEY = 'mounifull.cart';
const ADDRESS_KEY = 'mounifull.address';

export async function fetchProducts() {
  try {
    // Use the new Supabase client with proper error handling
    return await fetchProductsFromSupabase();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
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
  // If it's already a complete URL (http/https), return as-is
  if (path && (path.startsWith('http://') || path.startsWith('https://'))) {
    return path;
  }
  // Otherwise, treat as local asset and add base path
  return getAssetPath(path);
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

export function calculateShippingFee(subtotal) {
  // Standardized shipping calculation
  // Free delivery for orders over $50, otherwise $5 delivery fee
  return subtotal >= 50 ? 0 : 5;
}

export function calculateTotalWithShipping(subtotal) {
  return subtotal + calculateShippingFee(subtotal);
}

export function createSkeletonLoader(type = 'product') {
  const skeletons = {
    product: `
      <div class="animate-pulse">
        <div class="bg-gray-200 rounded-lg h-48 mb-4"></div>
        <div class="space-y-2">
          <div class="bg-gray-200 h-4 rounded w-3/4"></div>
          <div class="bg-gray-200 h-4 rounded w-1/2"></div>
          <div class="bg-gray-200 h-6 rounded w-1/4"></div>
        </div>
      </div>
    `,
    card: `
      <div class="animate-pulse">
        <div class="bg-gray-200 rounded-lg h-32 mb-3"></div>
        <div class="space-y-2">
          <div class="bg-gray-200 h-3 rounded w-2/3"></div>
          <div class="bg-gray-200 h-3 rounded w-1/2"></div>
        </div>
      </div>
    `,
    text: `
      <div class="animate-pulse space-y-2">
        <div class="bg-gray-200 h-4 rounded w-full"></div>
        <div class="bg-gray-200 h-4 rounded w-5/6"></div>
        <div class="bg-gray-200 h-4 rounded w-4/6"></div>
      </div>
    `
  };
  
  return skeletons[type] || skeletons.text;
}

export function showSkeletonLoader(container, count = 6, type = 'product') {
  if (!container) return;
  
  const skeletonHTML = Array(count).fill(createSkeletonLoader(type)).join('');
  container.innerHTML = skeletonHTML;
}

// Initialize cart badge on page load
document.addEventListener('DOMContentLoaded', () => updateCartBadge());

// Register Service Worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const base = getBasePath();
    navigator.serviceWorker.register(`${base}sw.js`).catch(() => {});
  });
}