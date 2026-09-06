/**
 * WAFAR Global UI Manager (Theme, Language, Modals, Toasts)
 */

const WafarUI = {
  currentTheme: localStorage.getItem('wafar_theme') || 'light',

  init: function () {
    this.setupTheme();
    this.setupNavigation();
    this.setupClock();
    this.setupModals();
  },

  // Setup Theme (Light / Dark)
  setupTheme: function () {
    this.applyTheme(this.currentTheme);
    
    // Listen for theme buttons if dynamically attached
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => this.toggleTheme());
    });
  },

  applyTheme: function (theme) {
    this.currentTheme = theme;
    localStorage.setItem('wafar_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);

    // Update Theme Toggle Buttons Icon/Text
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.innerHTML = theme === 'dark' ? 
        `<span>☀️</span>` : 
        `<span>🌙</span>`;
      btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    });

    // Notify charts or components
    window.dispatchEvent(new CustomEvent('wafar:themechange', { detail: { theme } }));
  },

  toggleTheme: function () {
    const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
  },

  // Setup Sidebar Active State & Mobile Drawer
  setupNavigation: function () {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href) {
        const pageKey = href.replace('../', '').replace('/index.html', '');
        if (currentPath.includes(pageKey) || (currentPath.endsWith('/dashboard/') && pageKey === 'dashboard')) {
          item.classList.add('active');
        }
      }
    });

    // Mobile Drawer Setup
    const mobileMenuBtn = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.app-sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');

    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        if (backdrop) backdrop.classList.toggle('active');
      });
    }

    if (backdrop && sidebar) {
      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        backdrop.classList.remove('active');
      });
    }
  },

  // Live Clock for Header Bar
  setupClock: function () {
    const timeDisplay = document.getElementById('liveTimeDisplay');
    if (!timeDisplay) return;

    const updateTime = () => {
      const now = new Date();
      const lang = typeof i18n !== 'undefined' ? i18n.getLang() : 'en';
      const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
      const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      timeDisplay.textContent = now.toLocaleDateString(locale, options);
    };

    updateTime();
    setInterval(updateTime, 1000);
    window.addEventListener('wafar:langchange', updateTime);
  },

  // Modal Open/Close Manager
  setupModals: function () {
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-backdrop');
        if (modal) modal.classList.remove('open');
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.remove('open');
      });
    });
  },

  openModal: function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  },

  closeModal: function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  },

  // Toast Notification System
  showToast: function (message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'gold' || type === 'warning') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
    } else if (type === 'danger') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    }

    toast.innerHTML = `
      <span style="display:flex;align-items:center;color:currentColor;">${iconSvg}</span>
      <span style="flex:1;">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  WafarUI.init();
});
