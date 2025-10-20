import { fetchProducts, getCart, setCart, updateCartBadge, formatPrice, formatDate, showNotification, resolveAsset } from './common.js';

function getId() {
  const p = new URLSearchParams(location.search).get('id');
  return p ? Number(p) : NaN;
}

function setOrUpdateMeta(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function setOrUpdateProperty(property, content) {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function setOrUpdateName(name, content) {
  return setOrUpdateMeta(name, content);
}

function createProductTemplate(product, groupVariants) {
  const ratingStars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));
  const isInStock = product.inStock !== false;
  const weights = Array.from(new Set(groupVariants.map(v => v.weight).filter(Boolean)));
  const packagings = Array.from(new Set(groupVariants.map(v => v.packaging).filter(Boolean)));
  
  return `
    <div class="space-y-6">
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div class="h-96 bg-gray-50 flex items-center justify-center relative">
          <img src="${resolveAsset(product.image)}" alt="${product.name}" class="max-h-96 object-contain">
          ${!isInStock ? '<div class="absolute top-4 right-4 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-medium">Out of Stock</div>' : ''}
        </div>
      </div>
      
      <!-- Product Gallery Placeholder -->
      <div class="grid grid-cols-4 gap-2">
        <div class="aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer border-2 border-[#556b2f]">
          <img src="${resolveAsset(product.image)}" alt="${product.name}" class="w-full h-full object-contain rounded-lg">
        </div>
        <div class="aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#556b2f] border-2 border-transparent transition-colors">
          <i class="fas fa-image text-gray-400"></i>
        </div>
        <div class="aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#556b2f] border-2 border-transparent transition-colors">
          <i class="fas fa-image text-gray-400"></i>
        </div>
        <div class="aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#556b2f] border-2 border-transparent transition-colors">
          <i class="fas fa-image text-gray-400"></i>
        </div>
      </div>
    </div>
    
    <div class="space-y-6">
      <div>
        <h1 class="font-cormorant text-5xl text-[#556b2f] mb-4">${product.name}</h1>
        <div class="flex items-center gap-4 mb-4">
          <div class="flex items-center">
            <span class="text-yellow-400 text-lg mr-2">${ratingStars}</span>
            <span class="text-gray-600">${product.rating} (${Math.floor(Math.random() * 50) + 10} reviews)</span>
          </div>
          <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">${product.category}</span>
        </div>
      </div>
      
      <div class="prose max-w-none">
        <p class="text-gray-700 text-lg leading-relaxed mb-6">${product.description}</p>
        
        ${product.bundleContents ? `
        <!-- Bundle Contents -->
        <div class="border-t border-gray-200 pt-6 mb-6">
          <h3 class="font-cormorant text-2xl text-[#556b2f] mb-4">Bundle Contents</h3>
          <div class="bg-beige rounded-lg p-4">
            <ul class="space-y-2">
              ${product.bundleContents.map(item => `
                <li class="flex items-center text-gray-700">
                  <i class="fas fa-check-circle text-green-500 mr-3"></i>
                  <span class="font-medium">${item.name}</span>
                  <span class="text-gray-500 ml-2">(${item.weight})</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
        ` : ''}
        
        <!-- Expandable Description -->
        <div class="border-t border-gray-200 pt-6">
          <h3 class="font-cormorant text-2xl text-[#556b2f] mb-4">Product Details</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Category:</span>
              <span class="font-medium capitalize">${product.category}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Date Added:</span>
              <span class="font-medium">${formatDate(product.date)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Availability:</span>
              <span class="font-medium ${isInStock ? 'text-green-600' : 'text-red-600'}">${isInStock ? 'In Stock' : 'Out of Stock'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Rating:</span>
              <span class="font-medium">${product.rating}/5</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-gray-50 rounded-xl p-6">
        ${weights.length > 1 || packagings.length > 1 ? `
        <div class="mb-6 space-y-4">
          ${weights.length > 1 ? `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-weight mr-2 text-[#556b2f]"></i>Select Weight
            </label>
            <div class="grid grid-cols-3 gap-2">
              ${weights.map((w, idx) => `
                <button class="weight-option px-4 py-2 border-2 rounded-lg transition-all ${idx === 0 ? 'border-[#556b2f] bg-[#556b2f] text-white' : 'border-gray-300 hover:border-[#556b2f]'}" data-weight="${w}">
                  ${w}
                </button>
              `).join('')}
            </div>
          </div>
          ` : ''}
          ${packagings.length > 1 ? `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-box mr-2 text-[#556b2f]"></i>Select Packaging
            </label>
            <div class="grid grid-cols-2 gap-2">
              ${packagings.map((pkg, idx) => `
                <button class="packaging-option px-4 py-2 border-2 rounded-lg transition-all capitalize ${idx === 0 ? 'border-[#556b2f] bg-[#556b2f] text-white' : 'border-gray-300 hover:border-[#556b2f]'}" data-packaging="${pkg}">
                  ${pkg}
                </button>
              `).join('')}
            </div>
          </div>
          ` : ''}
        </div>
        ` : ''}
        <div class="flex items-center justify-between mb-6">
          <div>
            <span id="productPrice" class="text-3xl text-[#c96a3d] font-bold">${formatPrice(product.price)}</span>
            <p class="text-sm text-gray-600 mt-1">Free shipping for orders over $50</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">Quantity</p>
            <div class="flex items-center border rounded-lg mt-2">
              <button id="decreaseQty" class="px-3 py-2 hover:bg-gray-100 transition-colors">
                <i class="fas fa-minus"></i>
              </button>
              <span id="quantity" class="px-4 py-2 border-x min-w-[3rem] text-center">1</span>
              <button id="increaseQty" class="px-3 py-2 hover:bg-gray-100 transition-colors">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div class="space-y-3">
          <button id="addToCart" class="w-full bg-[#c96a3d] text-white py-4 rounded-lg font-medium text-lg hover:bg-[#b55a2d] transition-colors flex items-center justify-center ${!isInStock ? 'opacity-50 cursor-not-allowed' : ''}" ${!isInStock ? 'disabled' : ''}>
            <i class="fas fa-cart-plus mr-3"></i>
            ${isInStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
          
          <div class="grid grid-cols-2 gap-3">
            <button class="bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              <i class="fas fa-heart mr-2"></i>Wishlist
            </button>
            <button class="bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              <i class="fas fa-share mr-2"></i>Share
            </button>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-4 pt-6 border-t">
        <a href="products.html" class="text-[#556b2f] hover:underline flex items-center">
          <i class="fas fa-arrow-left mr-2"></i>Back to products
        </a>
        <span class="text-gray-400">|</span>
        <a href="../index.html" class="text-[#556b2f] hover:underline">Home</a>
      </div>
    </div>
  `;
}

function bindProductInteractions(product, groupVariants) {
  // Setup quantity controls
  let quantity = 1;
  const quantitySpan = document.getElementById('quantity');
  const decreaseBtn = document.getElementById('decreaseQty');
  const increaseBtn = document.getElementById('increaseQty');

  if (decreaseBtn && increaseBtn && quantitySpan) {
    decreaseBtn.addEventListener('click', () => {
      if (quantity > 1) {
        quantity--;
        quantitySpan.textContent = quantity;
      }
    });
    increaseBtn.addEventListener('click', () => {
      quantity++;
      quantitySpan.textContent = quantity;
    });
  }

  // Variant selectors
  let selectedWeight = (groupVariants.map(v => v.weight).find(Boolean)) || null;
  let selectedPackaging = (groupVariants.map(v => v.packaging).find(Boolean)) || null;
  const priceEl = document.getElementById('productPrice');
  const weightButtons = document.querySelectorAll('.weight-option');
  const packagingButtons = document.querySelectorAll('.packaging-option');

  function findVariant() {
    const byWeight = selectedWeight ? groupVariants.filter(v => v.weight === selectedWeight) : groupVariants;
    const byPkg = selectedPackaging ? byWeight.filter(v => v.packaging === selectedPackaging) : byWeight;
    // Prefer exact match; fallback to any
    return byPkg[0] || byWeight[0] || groupVariants[0] || product;
  }

  function updatePriceFromSelection() {
    const v = findVariant();
    if (priceEl && v && typeof v.price === 'number') {
      priceEl.textContent = formatPrice(v.price);
    }
  }

  if (weightButtons.length) {
    weightButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        weightButtons.forEach(b => {
          b.classList.remove('border-[#556b2f]', 'bg-[#556b2f]', 'text-white');
          b.classList.add('border-gray-300');
        });
        btn.classList.add('border-[#556b2f]', 'bg-[#556b2f]', 'text-white');
        btn.classList.remove('border-gray-300');
        selectedWeight = btn.dataset.weight;
        updatePriceFromSelection();
      });
    });
  }

  if (packagingButtons.length) {
    packagingButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        packagingButtons.forEach(b => {
          b.classList.remove('border-[#556b2f]', 'bg-[#556b2f]', 'text-white');
          b.classList.add('border-gray-300');
        });
        btn.classList.add('border-[#556b2f]', 'bg-[#556b2f]', 'text-white');
        btn.classList.remove('border-gray-300');
        selectedPackaging = btn.dataset.packaging;
        updatePriceFromSelection();
      });
    });
  }

  // Initialize price for default selection
  updatePriceFromSelection();

  const addBtn = document.getElementById('addToCart');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      if (!product.inStock) return;
      const selectedVariant = findVariant();
      const cart = getCart();
      const uniqueId = `${selectedVariant.id}-${selectedVariant.weight || 'default'}-${selectedVariant.packaging || 'default'}`;
      const existing = cart.find(it => it.uniqueId === uniqueId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.push({ 
          id: selectedVariant.id,
          uniqueId,
          name: `${product.name}${selectedVariant.weight ? ' ' + selectedVariant.weight : ''}${selectedVariant.packaging ? ' (' + selectedVariant.packaging + ')' : ''}`,
          price: selectedVariant.price || product.price,
          image: selectedVariant.image || product.image,
          quantity
        });
      }
      setCart(cart);
      showNotification(`${product.name} (${quantity}x) added to cart!`, 'success');
      quantity = 1;
      if (quantitySpan) quantitySpan.textContent = quantity;
    });
  }

  updateCartBadge();
  setupMobileMenu();
}

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

    try {
        const productId = getId();
        if (isNaN(productId)) {
            document.getElementById('content').innerHTML = '<p class="text-center text-red-500">Product not found</p>';
            return;
        }

        const products = await fetchProducts();
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            document.getElementById('content').innerHTML = '<p class="text-center text-red-500">Product not found</p>';
            return;
        }

        // Build group variants from products that share the same base name (ignoring trailing weight tokens)
        const groupKey = new URLSearchParams(location.search).get('group');
        const weightRegex = /(\s|^)(250g|500g|1000g)\s*$/i;
        const baseEn = (product.nameEn || product.name || '').replace(weightRegex, '').trim();
        const baseAr = (product.nameAr || '').replace(weightRegex, '').trim();
        const derivedGroupKey = (groupKey || baseEn || product.name).toLowerCase();
        const groupVariants = products.filter(p => {
          const bEn = (p.nameEn || p.name || '').replace(weightRegex, '').trim().toLowerCase();
          const bAr = (p.nameAr || '').replace(weightRegex, '').trim().toLowerCase();
          return bEn === derivedGroupKey || (baseAr && bAr === baseAr.toLowerCase());
        });

        document.getElementById('content').innerHTML = createProductTemplate(product, groupVariants);
        // Basic dynamic SEO for product page
        try {
            document.title = `Mounifull – ${product.name}`;
            const desc = product.description;
            setOrUpdateMeta('description', desc);
            setOrUpdateProperty('og:title', `Mounifull – ${product.name}`);
            setOrUpdateProperty('og:description', desc);
            setOrUpdateProperty('og:image', resolveAsset(product.image));
            setOrUpdateName('twitter:title', `Mounifull – ${product.name}`);
            setOrUpdateName('twitter:description', desc);
            setOrUpdateName('twitter:image', resolveAsset(product.image));
        } catch {}
        bindProductInteractions(product, groupVariants);
        setupBackToTop();
    } catch (error) {
        console.error('Error loading product:', error);
        document.getElementById('content').innerHTML = '<p class="text-center text-red-500">Error loading product. Please refresh the page.</p>';
    }
});

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