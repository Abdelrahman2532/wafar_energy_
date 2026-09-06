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
      drawDailyTrendChart();
      const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
      showToast(isDark ? (isAr ? 'تم تفعيل الوضع الليلي' : 'Dark Mode Enabled') : (isAr ? 'تم تفعيل الوضع النهاري' : 'Light Mode Enabled'));
    }

    function setPeriod(p) {
      document.getElementById('btnWeekPeriod').classList.toggle('active', p === 'week');
      document.getElementById('btnMonthPeriod').classList.toggle('active', p === 'month');
      showToast(`Showing ${p} data`);
      drawDailyTrendChart();
    }

    /* Trend Chart */
    const trendData = {
      labels: ['Aug 26', 'Aug 27', 'Aug 28', 'Aug 29', 'Aug 30', 'Aug 31', 'Sep 01'],
      values: [14.4, 15.2, 16.6, 21.4, 14.3, 12.5, 8.7],
      yTicks: [0, 6, 13, 19, 25]
    };

    function drawDailyTrendChart() {
      const canvas = document.getElementById('dailyTrendCanvas');
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
      const padding = { top: 35, right: 25, bottom: 35, left: 45 };
      const chartW = w - padding.left - padding.right;
      const chartH = h - padding.top - padding.bottom;
      const maxVal = 25.0;

      ctx.clearRect(0, 0, w, h);

      const isDark = document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
      const gridColor = isDark ? '#263323' : '#e6ede0';
      const textColor = isDark ? '#80917e' : '#97a393';
      const greenLine = isDark ? '#6c9950' : '#4d6d39';
      const greenFillTop = isDark ? 'rgba(108, 153, 80, 0.28)' : 'rgba(77, 109, 57, 0.22)';
      const greenFillBottom = 'rgba(77, 109, 57, 0.0)';

      // 1. Grid & Y-Ticks
      ctx.lineWidth = 1;
      ctx.strokeStyle = gridColor;
      ctx.font = '600 11px Plus Jakarta Sans, Tajawal, sans-serif';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      trendData.yTicks.forEach(val => {
        const y = padding.top + chartH - (val / maxVal) * chartH;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();
        ctx.fillText(`${val}k`, padding.left - 10, y);
      });

      function getCoord(index, val) {
        const x = padding.left + (index / (trendData.labels.length - 1)) * chartW;
        const y = padding.top + chartH - (val / maxVal) * chartH;
        return { x, y };
      }

      // 2. X Labels
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      trendData.labels.forEach((label, i) => {
        const pt = getCoord(i, 0);
        ctx.fillText(label, pt.x, h - 22);
      });

      // 3. Spline Curve & Gradient Fill
      const points = trendData.values.map((val, i) => getCoord(i, val));

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

      // Curve Stroke
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

      // Data Dots
      points.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = greenLine;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#192118' : '#ffffff';
        ctx.fill();
      });

      // Peak Tooltip (Aug 29 - Index 3)
      const peakPt = points[3];
      if (peakPt) {
        const ttW = 68;
        const ttH = 26;
        const ttX = peakPt.x - ttW / 2;
        const ttY = peakPt.y - ttH - 10;

        ctx.fillStyle = '#2c3e24';
        ctx.beginPath();
        ctx.roundRect(ttX, ttY, ttW, ttH, 6);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '700 11px Plus Jakarta Sans, Tajawal, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('21.4 kWh', peakPt.x, ttY + ttH / 2);
      }

      // End Tooltip (Sep 01 - Index 6)
      const endPt = points[6];
      if (endPt) {
        const ttW = 62;
        const ttH = 24;
        const ttX = endPt.x - ttW / 2;
        const ttY = endPt.y - ttH - 10;

        ctx.fillStyle = isDark ? '#232f21' : '#ebf3e7';
        ctx.strokeStyle = isDark ? '#3d4f3b' : '#d5e4cf';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(ttX, ttY, ttW, ttH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '700 10.5px Plus Jakarta Sans, Tajawal, sans-serif';
        ctx.fillStyle = isDark ? '#97c879' : '#4d6d39';
        ctx.fillText('8.7 kWh', endPt.x, ttY + ttH / 2);
      }
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

      drawDailyTrendChart();
      window.addEventListener('resize', drawDailyTrendChart);

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

      window.addEventListener('wafar:langchange', () => {
        drawDailyTrendChart();
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
