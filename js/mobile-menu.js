// Mobile Menu Functionality - RTL/LTR Aware
export function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const closeMobileMenu = document.getElementById('closeMobileMenu');
  const mobileMenuPanel = document.getElementById('mobileMenuPanel');
  
  if (!mobileMenuBtn || !mobileMenu || !closeMobileMenu || !mobileMenuPanel) return;
  
  // Open mobile menu
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Small delay to ensure the panel is visible before animating
    setTimeout(() => {
      mobileMenuPanel.classList.add('open');
      
      // Set up mobile language switcher when menu is opened
      if (window.i18n && typeof window.i18n.setupMobileLanguageSwitcher === 'function') {
        window.i18n.setupMobileLanguageSwitcher();
      }
    }, 10);
  });
  
  // Close mobile menu
  const closeMenu = () => {
    mobileMenuPanel.classList.remove('open');
    
    setTimeout(() => {
      mobileMenu.classList.add('hidden');
      document.body.style.overflow = '';
    }, 300); // Match CSS transition duration
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
