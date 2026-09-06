/* Dashboard State */
    const state = {
      isLampOn: false,
      chartRange: '24'
    };

    let isUpdatingLamp = false;

    /* Toast Helper */
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

    /* Live Clock */
    function initLiveClock() {
      const el = document.getElementById('headerLiveTime');
      function update() {
        const now = new Date();
        const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
        const options = {
          weekday: 'short',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        };
        el.textContent = now.toLocaleString(isAr ? 'ar-EG' : 'en-US', options);
      }
      update();
      setInterval(update, 1000);
    }

    /* Theme Toggle */
    function toggleAppTheme() {
      const isDark = document.documentElement.classList.toggle('dark');
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      localStorage.setItem('wafar-theme', isDark ? 'dark' : 'light');
      drawHourlyChart();
      const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
      showToast(isDark ? (isAr ? 'تم تفعيل الوضع الليلي' : 'Dark Mode Enabled') : (isAr ? 'تم تفعيل الوضع النهاري' : 'Light Mode Enabled'));
    }

    /* Render Lamp UI from State */
    function renderLampUI(isOn) {
      state.isLampOn = !!isOn;
      const card = document.getElementById('lampControlCard');
      const statusChip = document.getElementById('lampStatusChip');
      const sidebarBadge = document.getElementById('sidebarLampBadge');
      const wattsVal = document.getElementById('lampWattsVal');
      const btnLabel = document.getElementById('lampBtnLabel');
      const isAr = typeof i18n !== 'undefined' && i18n.isRtl();

      if (state.isLampOn) {
        if (card) card.classList.remove('is-off');
        if (statusChip) {
          statusChip.textContent = 'ON';
          statusChip.style.backgroundColor = 'var(--primary-green-light)';
          statusChip.style.color = 'var(--primary-green-dark)';
        }
        if (sidebarBadge) {
          sidebarBadge.textContent = 'ON';
          sidebarBadge.style.display = 'inline-block';
        }
        if (wattsVal) wattsVal.textContent = '15 W';
        if (btnLabel) btnLabel.textContent = isAr ? 'إطفاء المصباح' : 'Turn Off';
      } else {
        if (card) card.classList.add('is-off');
        if (statusChip) {
          statusChip.textContent = 'OFF';
          statusChip.style.backgroundColor = 'var(--border-color)';
          statusChip.style.color = 'var(--text-muted)';
        }
        if (sidebarBadge) {
          sidebarBadge.textContent = 'OFF';
          sidebarBadge.style.display = 'inline-block';
        }
        if (wattsVal) wattsVal.textContent = '0 W';
        if (btnLabel) btnLabel.textContent = isAr ? 'تشغيل المصباح' : 'Turn On';
      }
    }

    /* Lamp Toggle with Supabase Database Update */
    async function toggleDashLamp() {
      if (isUpdatingLamp) return;
      isUpdatingLamp = true;

      const targetState = !state.isLampOn;
      const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
      const btn = document.getElementById('lampToggleBtn');
      if (btn) btn.style.opacity = '0.7';

      try {
        const res = await LedAPI.setLedState(targetState);
        if (btn) btn.style.opacity = '1';
        isUpdatingLamp = false;

        if (res.success) {
          renderLampUI(res.is_on);
          showToast(
            res.is_on ? 
              (isAr ? 'تم تشغيل مصباح غرفة النوم (15W)' : 'Bedroom Lamp Turned ON (15W)') : 
              (isAr ? 'تم إطفاء مصباح غرفة النوم (0W)' : 'Bedroom Lamp Turned OFF (0W)'),
            '✓'
          );
        } else {
          renderLampUI(state.isLampOn);
          showToast(isAr ? 'فشل تحديث حالة المصباح.' : 'Failed to update lamp state in database.', '!');
        }
      } catch (err) {
        if (btn) btn.style.opacity = '1';
        isUpdatingLamp = false;
        renderLampUI(state.isLampOn);
        showToast(isAr ? 'حدث خطأ في الاتصال.' : 'Communication error occurred.', '!');
      }
    }

    /* Hourly Chart */
    const chartDataSets = {
      '24': {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '19:00', '22:00'],
        actual: [0.65, 0.40, 1.25, 2.10, 2.65, 3.20, 1.65],
        average: [0.95, 0.75, 1.70, 2.45, 2.95, 3.50, 2.05],
        highlightIndex: 5,
        highlightVal: '2.45 kWh'
      },
      '12': {
        labels: ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
        actual: [1.60, 2.10, 2.40, 2.65, 3.10, 2.40, 1.65],
        average: [1.90, 2.45, 2.70, 2.95, 3.40, 2.90, 2.05],
        highlightIndex: 4,
        highlightVal: '3.10 kWh'
      },
      '8': {
        labels: ['15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '22:00'],
        actual: [2.50, 2.65, 2.90, 3.10, 3.20, 2.40, 1.65],
        average: [2.80, 2.95, 3.20, 3.40, 3.50, 2.90, 2.05],
        highlightIndex: 4,
        highlightVal: '3.20 kWh'
      }
    };

    function drawHourlyChart() {
      const canvas = document.getElementById('hourlyChartCanvas');
      if (!canvas) return;
      
      const container = canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      
      const w = rect.width;
      const h = rect.height;
      const data = chartDataSets[state.chartRange] || chartDataSets['24'];
      
      const padding = { top: 30, right: 20, bottom: 35, left: 40 };
      const chartW = w - padding.left - padding.right;
      const chartH = h - padding.top - padding.bottom;
      const maxVal = 4.0;
      
      ctx.clearRect(0, 0, w, h);
      
      const isDark = document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
      const gridColor = isDark ? '#263323' : '#e6ede0';
      const textColor = isDark ? '#80917e' : '#97a393';
      const greenLine = isDark ? '#7db060' : '#587b44';
      const greenFillTop = isDark ? 'rgba(125, 176, 96, 0.28)' : 'rgba(88, 123, 68, 0.22)';
      const greenFillBottom = 'rgba(88, 123, 68, 0.0)';
      const dashLineColor = isDark ? '#60725c' : '#97a393';

      // 1. Draw horizontal grid & Y-axis labels
      ctx.lineWidth = 1;
      ctx.strokeStyle = gridColor;
      ctx.font = '500 11px Plus Jakarta Sans, Tajawal, sans-serif';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      const yTicks = [0.0, 1.0, 2.0, 3.0, 4.0];
      yTicks.forEach(val => {
        const y = padding.top + chartH - (val / maxVal) * chartH;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();
        ctx.fillText(val.toFixed(1), padding.left - 8, y);
      });

      function getCoord(index, val) {
        const x = padding.left + (index / (data.labels.length - 1)) * chartW;
        const y = padding.top + chartH - (val / maxVal) * chartH;
        return { x, y };
      }

      // 2. Draw X-axis labels
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      data.labels.forEach((label, i) => {
        const pt = getCoord(i, 0);
        ctx.fillText(label, pt.x, h - 22);
      });

      // 3. Draw Average Baseline
      ctx.beginPath();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = dashLineColor;
      ctx.lineWidth = 1.6;
      data.average.forEach((val, i) => {
        const pt = getCoord(i, val);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Draw Smooth Spline
      const points = data.actual.map((val, i) => getCoord(i, val));

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX = (p0.x + p1.x) / 2;
        ctx.bezierCurveTo(cpX, p0.y, cpX, p1.y, p1.x, p1.y);
      }
      ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
      ctx.lineTo(points[0].x, padding.top + chartH);
      ctx.closePath();

      const fillGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      fillGrad.addColorStop(0, greenFillTop);
      fillGrad.addColorStop(1, greenFillBottom);
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // Stroke Line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX = (p0.x + p1.x) / 2;
        ctx.bezierCurveTo(cpX, p0.y, cpX, p1.y, p1.x, p1.y);
      }
      ctx.strokeStyle = greenLine;
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // 5. Draw Data Dots
      points.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = greenLine;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#192118' : '#ffffff';
        ctx.fill();
      });

      // 6. Tooltip at Peak
      const hIdx = data.highlightIndex;
      const hPt = points[hIdx];
      if (hPt) {
        const tooltipW = 76;
        const tooltipH = 34;
        const ttX = Math.min(Math.max(hPt.x - tooltipW / 2, padding.left), w - padding.right - tooltipW);
        const ttY = hPt.y - tooltipH - 12;

        ctx.fillStyle = isDark ? '#232f21' : '#ffffff';
        ctx.strokeStyle = isDark ? '#3d4f3b' : '#e0e7db';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.roundRect(ttX, ttY, tooltipW, tooltipH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(hPt.x - 4, ttY + tooltipH);
        ctx.lineTo(hPt.x, ttY + tooltipH + 5);
        ctx.lineTo(hPt.x + 4, ttY + tooltipH);
        ctx.closePath();
        ctx.fillStyle = isDark ? '#232f21' : '#ffffff';
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '600 10.5px Plus Jakarta Sans, Tajawal, sans-serif';
        ctx.fillStyle = isDark ? '#a0b19d' : '#677363';
        ctx.fillText(data.labels[hIdx], ttX + tooltipW / 2, ttY + 10);

        ctx.font = '800 11.5px Plus Jakarta Sans, Tajawal, sans-serif';
        ctx.fillStyle = greenLine;
        ctx.fillText('• ' + data.highlightVal, ttX + tooltipW / 2, ttY + 23);
      }
    }

    // Initialize Everything on Load
    document.addEventListener('DOMContentLoaded', async () => {
      // 1. Session Protection Check
      const isAuthed = await AuthAPI.requireAuth();
      if (!isAuthed) return;

      initLiveClock();

      // Theme restore
      const savedTheme = localStorage.getItem('wafar-theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      }

      drawHourlyChart();
      window.addEventListener('resize', drawHourlyChart);

      // 2. Fetch Initial LED State from Database (public.led_control row id = 1)
      try {
        const initialLedState = await LedAPI.getLedState();
        renderLampUI(initialLedState);
      } catch (err) {
        console.warn("Could not fetch initial LED state:", err);
      }

      // 3. Subscribe to Realtime Changes on led_control table
      const ledChannel = LedAPI.subscribeToLedState((isOn) => {
        renderLampUI(isOn);
      });

      window.addEventListener('beforeunload', () => {
        LedAPI.unsubscribe(ledChannel);
      });

      // Listen for language change event from i18n
      window.addEventListener('wafar:langchange', () => {
        drawHourlyChart();
        renderLampUI(state.isLampOn);
      });

      document.getElementById('chartRangeSelect').addEventListener('change', (e) => {
        state.chartRange = e.target.value;
        drawHourlyChart();
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
