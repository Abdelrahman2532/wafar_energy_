let currentPaymentMethod = 'vodafone';
let currentBillAmount = 0;

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
      const amountStr = currentBillAmount > 0 ? `${currentBillAmount.toFixed(2)}` : '';
      const amountText = amountStr ? (isAr ? ` (${amountStr} ج.م)` : ` for ${amountStr} EGP`) : '';
      showToast(
        isAr ? `جاري تحويلك لبوابة الدفع الآمنة${amountText}...` : `Redirecting to secure gateway${amountText}...`,
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

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    async function loadBillingData() {
      const tbody = document.getElementById('invoicesTableBody');
      const dueDateEl = document.getElementById('billDueDate');
      const billOrigEl = document.getElementById('billOriginalAmount');
      const billDiscEl = document.getElementById('billDiscountAmount');
      const billTotEl = document.getElementById('billTotalAmount');

      try {
        const { profile, householdId } = await DataAPI.getHouseholdContext();
        if (!householdId) {
          console.warn("[Billing] No household context found.");
          if (tbody) {
            tbody.innerHTML = `
              <tr>
                <td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">
                  Please sign in to view your billing history.
                </td>
              </tr>
            `;
          }
          return;
        }

        const [billsRes, pointsData] = await Promise.all([
          DataAPI.getBills(householdId),
          DataAPI.getWafarPoints(householdId)
        ]);

        const pts = Number(pointsData?.points ?? pointsData?.points_balance ?? 0);
        DataAPI.syncSidebar(profile, pts);

        const billsList = billsRes && Array.isArray(billsRes.bills) ? billsRes.bills : (Array.isArray(billsRes) ? billsRes : []);
        const activeBill = billsRes?.latest || (billsList.length > 0 ? billsList[0] : null);

        if (!billsList || billsList.length === 0) {
          if (tbody) {
            tbody.innerHTML = `
              <tr>
                <td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">
                  No billing history found for this household.
                </td>
              </tr>
            `;
          }
          if (billOrigEl) billOrigEl.textContent = '0.00 EGP';
          if (billDiscEl) billDiscEl.textContent = '-0.00 EGP';
          if (billTotEl) billTotEl.textContent = '0.00 EGP';
          if (dueDateEl) dueDateEl.textContent = 'Due: --';
          return;
        }

        // Active/Latest bill for the top overview
        if (activeBill) {
          const rawOrig = Number(activeBill.original_amount) || Number(activeBill.total_amount) || 0;
          const billCalc = DataAPI.calculateBillDiscount(rawOrig, pts);
          currentBillAmount = billCalc.totalAmount;
          const orig = billCalc.originalAmount.toFixed(2);
          const disc = billCalc.discountAmount.toFixed(2);
          const tot = billCalc.totalAmount.toFixed(2);

          const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
          let dueStr = '';
          if (activeBill.due_date) {
            const dueDateObj = new Date(activeBill.due_date);
            dueStr = !isNaN(dueDateObj) ? dueDateObj.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }) : activeBill.due_date;
          }

          if (dueDateEl) dueDateEl.textContent = `${isAr ? 'تاريخ الاستحقاق: ' : 'Due: '}${dueStr || '--'}`;
          if (billOrigEl) billOrigEl.textContent = `${orig} EGP`;
          if (billDiscEl) billDiscEl.textContent = `-${disc} EGP`;
          if (billTotEl) billTotEl.textContent = `${tot} EGP`;
        }

        // Invoices History Table
        if (tbody) {
          const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
          tbody.innerHTML = billsList.map(bill => {
            const isDue = bill.status === 'due' || bill.status === 'pending' || bill.status === 'unpaid';
            const statusClass = isDue ? 'badge-due' : 'badge-paid';
            const statusLabel = isDue 
              ? (isAr ? 'مستحقة قريباً' : 'Due Soon') 
              : (isAr ? 'مدفوعة' : 'Paid');
            
            const rawBillOrig = Number(bill.original_amount) || Number(bill.total_amount) || 0;
            const billPoints = isDue ? pts : (Number(bill.discount_amount) ? Number(bill.discount_amount) * 10 : 0);
            const billCalc = DataAPI.calculateBillDiscount(rawBillOrig, billPoints);
            const netAmount = billCalc.totalAmount.toFixed(2);
            const consumption = Number(bill.consumption_kwh || 0).toFixed(1);

            return `
              <tr>
                <td class="inv-id-cell">${escapeHtml(bill.invoice_no || 'INV-00')}</td>
                <td>${escapeHtml(bill.billing_month || '--')}</td>
                <td>${consumption} kWh</td>
                <td class="inv-amount-cell">${netAmount} EGP</td>
                <td><span class="badge-status ${statusClass}">${statusLabel}</span></td>
              </tr>
            `;
          }).join('');
        }

      } catch (err) {
        console.error("Error loading billing data:", err);
        if (tbody) {
          tbody.innerHTML = `
            <tr>
              <td colspan="5" style="text-align: center; padding: 20px; color: var(--danger-red, #e74c3c);">
                Failed to load invoices. Please try again.
              </td>
            </tr>
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

      // 2. Load dynamic billing data
      await loadBillingData();

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
