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

    function showHowToEarnModal() {
      const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
      showToast(
        isAr ? 'اجمع 10 نقاط عند إطفاء المصباح وترشيد الاستهلاك في أوقات الذروة!' : 'Earn 10 pts by turning off lamps and saving power during peak hours!',
        '⚡'
      );
    }

    function updateSidebarLampBadge(isOn) {
      const sbBadge = document.getElementById('sidebarLampBadge');
      if (sbBadge) {
        sbBadge.textContent = isOn ? 'ON' : 'OFF';
        sbBadge.className = `nav-badge ${isOn ? 'badge-on' : ''}`;
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    async function loadPointsData() {
      const userPointsEl = document.getElementById('userPointsVal');
      const discountEgpEl = document.getElementById('discountEgpVal');
      const historyContainer = document.getElementById('pointsHistoryList');

      try {
        const { profile, householdId } = await DataAPI.getHouseholdContext();
        if (!householdId) {
          console.warn("[Points] No household context found.");
          if (userPointsEl) userPointsEl.textContent = '--';
          if (discountEgpEl) discountEgpEl.textContent = '-- EGP';
          if (historyContainer) {
            historyContainer.innerHTML = `
              <div style="padding: 24px; text-align: center; color: var(--text-muted);">
                Please sign in to view your WAFAR points.
              </div>
            `;
          }
          return;
        }

        const [pointsData, historyList] = await Promise.all([
          DataAPI.getWafarPoints(householdId),
          DataAPI.getPointsHistory(householdId)
        ]);

        const pts = Number(pointsData?.points ?? pointsData?.points_balance ?? 0);
        DataAPI.syncSidebar(profile, pts);

        const discountVal = (pts / 10).toFixed(1);

        if (userPointsEl) userPointsEl.textContent = pts.toLocaleString();
        if (discountEgpEl) discountEgpEl.textContent = `${discountVal} EGP`;

        // Render History Items
        if (historyContainer) {
          if (!historyList || historyList.length === 0) {
            historyContainer.innerHTML = `
              <div style="padding: 24px; text-align: center; color: var(--text-muted);">
                No points transactions recorded yet.
              </div>
            `;
          } else {
            const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
            historyContainer.innerHTML = historyList.map(item => {
              const ptsChange = Number(item.points_change || item.points || 0);
              const isPositive = ptsChange >= 0;
              const equivEgp = (Math.abs(ptsChange) / 10).toFixed(1);
              const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '';

              const title = item.reason || (isAr ? 'ترشيد استهلاك' : 'Energy Savings Reward');

              return `
                <div class="history-row-item">
                  <div class="history-item-left">
                    <div class="history-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                      </svg>
                    </div>
                    <div class="history-item-details">
                      <span class="history-item-title">${escapeHtml(title)}</span>
                      <span class="history-item-time">${dateStr}</span>
                    </div>
                  </div>
                  <div class="history-item-right">
                    <span class="points-earned-pill" style="${!isPositive ? 'background-color: var(--accent-amber-light); color: var(--accent-amber-dark);' : ''}">
                      ${isPositive ? '+' : ''}${ptsChange} pts
                    </span>
                    <span class="points-egp-equiv">${equivEgp} EGP</span>
                  </div>
                </div>
              `;
            }).join('');
          }
        }
      } catch (err) {
        console.error("[Points] Error loading points data:", err);
        if (historyContainer) {
          historyContainer.innerHTML = `
            <div style="padding: 24px; text-align: center; color: var(--danger-red, #e74c3c);">
              Failed to load points data. Please try again.
            </div>
          `;
        }
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

      // 2. Load dynamic Points data
      await loadPointsData();

      // 3. Fetch Initial LED State from Database (public.led_control row id = 1)
      try {
        const initialLedState = await LedAPI.getLedState();
        updateSidebarLampBadge(initialLedState);
      } catch (err) {
        console.warn("Could not fetch initial LED state:", err);
      }

      // 4. Subscribe to Realtime Changes on led_control table
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
