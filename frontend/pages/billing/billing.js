let currentPaymentMethod = 'vodafone';

    function showToast(msg, icon = '✓') {
      const toast = document.getElementById('appToast');
      document.getElementById('toastMsg').innerHTML = msg;
      document.getElementById('toastIcon').textContent = icon;
      toast.classList.add('show');
      clearTimeout(window._toastTimeout);
      window._toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
      }, 2600);
    }

    function initLiveClock() {
      const el = document.getElementById('headerLiveTime');
      function update() {
        const now = new Date();
        const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
        const options = {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        };
        el.textContent = now.toLocaleString(isAr ? 'ar-EG' : 'en-US', options);
      }
      update();
      setInterval(update, 1000);
    }

    function toggleAppTheme() {
      const isDark = document.documentElement.classList.toggle('dark');
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      localStorage.setItem('wafar-theme', isDark ? 'dark' : 'light');
      const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
      showToast(isDark ? (isAr ? 'تم تفعيل الوضع الليلي' : 'Dark Mode Enabled') : (isAr ? 'تم تفعيل الوضع النهاري' : 'Light Mode Enabled'));
    }

    function selectPaymentMethod(method, element) {
      currentPaymentMethod = method;
      document.querySelectorAll('.method-card').forEach(card => {
        card.classList.remove('selected');
        const check = card.querySelector('.method-check-circle');
        if (check) check.classList.remove('checked');
      });

      element.classList.add('selected');
      const check = element.querySelector('.method-check-circle');
      if (check) check.classList.add('checked');

      const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
      let methodName = method === 'vodafone' ? 'Vodafone Cash' : (method === 'instapay' ? 'Instapay' : 'Credit / Debit Card');
      showToast(isAr ? `تم اختيار ${methodName}` : `Selected ${methodName}`, '✓');
    }

    function handlePayBill() {
      const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
      showToast(
        isAr ? 'جاري تحويلك لبوابة الدفع الآمنة (334.50 ج.م)...' : 'Redirecting to secure gateway for 334.50 EGP...',
        '✓'
      );
    }

    function updateSidebarLampBadge(isOn) {
      const sbBadge = document.getElementById('sidebarLampBadge');
      if (sbBadge) {
        sbBadge.textContent = isOn ? 'ON' : 'OFF';
        sbBadge.className = `nav-badge ${isOn ? 'badge-on' : ''}`;
      }
    }

    document.addEventListener('DOMContentLoaded', async () => {
      // 1. Session Protection Check
      const isAuthed = await AuthAPI.requireAuth();
      if (!isAuthed) return;

      initLiveClock();
      
      const savedTheme = localStorage.getItem('wafar-theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      }

      // 2. Fetch Initial LED State from Database (public.led_control row id = 1)
      try {
        const initialLedState = await LedAPI.getLedState();
        updateSidebarLampBadge(initialLedState);
      } catch (err) {
        console.warn("Could not fetch initial LED state:", err);
      }

      // 3. Subscribe to Realtime Changes on led_control table
      const ledChannel = LedAPI.subscribeToLedState((isOn) => {
        updateSidebarLampBadge(isOn);
      });

      window.addEventListener('beforeunload', () => {
        LedAPI.unsubscribe(ledChannel);
      });

      const mobileToggle = document.getElementById('mobileToggleBtn');
      const backdrop = document.getElementById('sidebarBackdrop');
      const sidebar = document.getElementById('appSidebar');

      if (mobileToggle && sidebar && backdrop) {
        mobileToggle.addEventListener('click', () => {
          sidebar.classList.toggle('open');
          backdrop.classList.toggle('active');
        });

        backdrop.addEventListener('click', () => {
          sidebar.classList.remove('open');
          backdrop.classList.remove('active');
        });
      }
    });
