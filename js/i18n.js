// Simple i18n implementation
class I18n {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {};
        this.init();
    }

    async init() {
        try {
            // Determine correct base path for all pages
            const path = location.pathname;
            const base = path.includes('/pages/legal/') ? '../../' : (path.includes('/pages/') ? '../' : '');

            // Load translations with page-aware base path
            const enResponse = await fetch(`${base}js/translations/en.json`);
            const arResponse = await fetch(`${base}js/translations/ar.json`);
            
            this.translations.en = await enResponse.json();
            this.translations.ar = await arResponse.json();
            
            // Set initial language from localStorage or default to English
            this.currentLanguage = localStorage.getItem('language') || 'en';
            // Ensure document direction/locale reflect persisted language immediately
            document.documentElement.dir = this.currentLanguage === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = this.currentLanguage;
            
            // Set up language switcher first
            this.setupLanguageSwitcher();
            // Ensure mobile sidebar switcher is always bound
            this.setupMobileLanguageSwitcher();
            
            // Apply initial translations after a short delay to ensure DOM is ready
            setTimeout(() => {
                this.applyTranslations();
                // Sync button styles (desktop and mobile) to current language
                this.updateLanguageButtons();
                // Dispatch event that i18n has finished loading
                document.dispatchEvent(new CustomEvent('i18nLoaded'));
            }, 100);
            
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    }

    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }
        
        // Replace parameters in translation
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            Object.keys(params).forEach(param => {
                value = value.replace(`{{${param}}}`, params[param]);
            });
        }
        
        return value || key;
    }

    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('language', lang);
            this.applyTranslations();
            
            // Update document direction
            document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = lang;
            
            // Dispatch language change event
            document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
        }
    }

    applyTranslations() {
        // Update all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            // Skip option elements - they are handled by custom translation function
            if (element.tagName === 'OPTION') {
                return;
            }
            
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = translation;
            } else if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Handle placeholder-specific translations
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.t(key);
            element.placeholder = translation;
        });

        // Update product names and descriptions
        this.updateProductContent();
    }

    updateProductContent() {
        // This will be called by the products page to update product content
        if (typeof window.updateProductTranslations === 'function') {
            window.updateProductTranslations(this.currentLanguage);
        }
    }

    setupLanguageSwitcher() {
        // Check if switcher already exists in header
        const existingSwitcher = document.getElementById('languageSwitcher');
        if (existingSwitcher) {
            // Update existing switcher buttons
            this.updateLanguageButtons();
            
            // Add event listeners if not already added
            const enBtn = document.getElementById('langEn');
            const arBtn = document.getElementById('langAr');
            
            if (enBtn && !enBtn.hasAttribute('data-listener-added')) {
                enBtn.addEventListener('click', () => {
                    this.setLanguage('en');
                    this.updateLanguageButtons();
                });
                enBtn.setAttribute('data-listener-added', 'true');
            }
            
            if (arBtn && !arBtn.hasAttribute('data-listener-added')) {
                arBtn.addEventListener('click', () => {
                    this.setLanguage('ar');
                    this.updateLanguageButtons();
                });
                arBtn.setAttribute('data-listener-added', 'true');
            }
            
            // Also handle mobile menu switcher (kept here; also called from init as safety)
            this.setupMobileLanguageSwitcher();
            
            console.log('Language switcher found in header and configured');
            return;
        }

        // If not found in header, create a fallback
        const switcher = document.createElement('div');
        switcher.id = 'languageSwitcher';
        switcher.className = 'fixed top-4 right-4 z-50';
        switcher.innerHTML = `
            <div class="bg-white rounded-md shadow-lg p-1 flex gap-1 border">
                <button id="langEn" class="px-3 py-1 text-sm rounded transition-colors ${this.currentLanguage === 'en' ? 'bg-terracotta text-white' : 'text-gray-600 hover:bg-gray-100'}">
                    EN
                </button>
                <button id="langAr" class="px-3 py-1 text-sm rounded transition-colors ${this.currentLanguage === 'ar' ? 'bg-terracotta text-white' : 'text-gray-600 hover:bg-gray-100'}">
                    AR
                </button>
            </div>
        `;
        document.body.appendChild(switcher);

        // Add event listeners
        document.getElementById('langEn').addEventListener('click', () => {
            this.setLanguage('en');
            this.updateLanguageButtons();
        });
        
        document.getElementById('langAr').addEventListener('click', () => {
            this.setLanguage('ar');
            this.updateLanguageButtons();
        });

        console.log('Language switcher created as fallback');
    }

    setupMobileLanguageSwitcher() {
        const enBtnMobile = document.getElementById('langEnMobile');
        const arBtnMobile = document.getElementById('langArMobile');
        
        if (enBtnMobile && !enBtnMobile.hasAttribute('data-listener-added')) {
            enBtnMobile.addEventListener('click', () => {
                this.setLanguage('en');
                this.updateLanguageButtons();
            });
            enBtnMobile.setAttribute('data-listener-added', 'true');
        }
        
        if (arBtnMobile && !arBtnMobile.hasAttribute('data-listener-added')) {
            arBtnMobile.addEventListener('click', () => {
                this.setLanguage('ar');
                this.updateLanguageButtons();
            });
            arBtnMobile.setAttribute('data-listener-added', 'true');
        }
    }

    updateLanguageButtons() {
        const enBtn = document.getElementById('langEn');
        const arBtn = document.getElementById('langAr');
        const enBtnMobile = document.getElementById('langEnMobile');
        const arBtnMobile = document.getElementById('langArMobile');
        
        if (enBtn && arBtn) {
            enBtn.className = `px-2 py-1 text-xs rounded transition-colors ${this.currentLanguage === 'en' ? 'bg-terracotta text-white' : 'text-gray-600 hover:bg-gray-100'}`;
            arBtn.className = `px-2 py-1 text-xs rounded transition-colors ${this.currentLanguage === 'ar' ? 'bg-terracotta text-white' : 'text-gray-600 hover:bg-gray-100'}`;
        }
        
        if (enBtnMobile && arBtnMobile) {
            enBtnMobile.className = `px-2 py-1 text-xs rounded transition-colors ${this.currentLanguage === 'en' ? 'bg-terracotta text-white' : 'text-gray-600 hover:bg-gray-100'}`;
            arBtnMobile.className = `px-2 py-1 text-xs rounded transition-colors ${this.currentLanguage === 'ar' ? 'bg-terracotta text-white' : 'text-gray-600 hover:bg-gray-100'}`;
        }
    }
}

// Initialize i18n when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18n();
});

// Export for use in other scripts
window.t = (key, params) => window.i18n ? window.i18n.t(key, params) : key;
