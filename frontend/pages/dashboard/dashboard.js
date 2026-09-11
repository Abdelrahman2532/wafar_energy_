/* Dashboard State */
const state = {
  isLampOn: false,
  chartRange: '24',
  householdId: null,
  profile: null,
  energyData: null,
  hourlyData: [],
  breakdownData: [],
  pointsData: null,
  billsData: null,
  activitiesData: []
};

let isUpdatingLamp = false;

/* Toast Helper */
function showToast(msg, icon = '✓') {
  const toast = document.getElementById('appToast');
  if (!toast) return;
  const msgEl = document.getElementById('toastMsg');
  const iconEl = document.getElementById('toastIcon');
  if (msgEl) msgEl.innerHTML = msg;
  if (iconEl) iconEl.textContent = icon;
  toast.classList.add('show');
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

/* Live Clock */
function initLiveClock() {
  const el = document.getElementById('headerLiveTime');
  if (!el) return;
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

/* Render Lamp UI from State (public.led_control row id = 1) */
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
      sidebarBadge.className = 'nav-badge badge-on';
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
      sidebarBadge.className = 'nav-badge';
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

/* Draw Hourly Usage Canvas Chart */
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

  let labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '19:00', '22:00'];
  let actual = [0.4, 0.3, 0.8, 1.4, 1.8, 2.2, 1.1];
  let average = [0.5, 0.4, 1.0, 1.6, 2.1, 2.4, 1.3];

  if (Array.isArray(state.hourlyData) && state.hourlyData.length > 0) {
    labels = state.hourlyData.map(d => (typeof d.hour === 'number' ? `${String(d.hour).padStart(2, '0')}:00` : String(d.hour)));
    actual = state.hourlyData.map(d => Number(d.consumption_kwh) || 0);
    const avgVal = actual.reduce((a, b) => a + b, 0) / (actual.length || 1);
    average = actual.map(() => Number((avgVal * 1.1).toFixed(2)));
  } else if (state.energyData && state.energyData.records && state.energyData.records.length > 0) {
    const latestKWh = Number(state.energyData.latest?.energy_consumption_kwh || 8.0);
    const avgKWh = state.energyData.avgKWh || latestKWh;
    const factors = [0.04, 0.03, 0.08, 0.16, 0.22, 0.32, 0.15];
    actual = factors.map(f => Number((latestKWh * f).toFixed(2)));
    average = factors.map(f => Number((avgKWh * f * 1.05).toFixed(2)));
  }
  
  const padding = { top: 30, right: 20, bottom: 35, left: 40 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const maxDataVal = Math.max(...actual, ...average, 1.0);
  const maxVal = Math.ceil(maxDataVal * 1.25 * 10) / 10;
  
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
  
  const ySteps = 4;
  for (let i = 0; i <= ySteps; i++) {
    const val = (maxVal / ySteps) * i;
    const y = padding.top + chartH - (val / maxVal) * chartH;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
    ctx.fillText(val.toFixed(1), padding.left - 8, y);
  }

  function getCoord(index, val) {
    const totalPoints = Math.max(labels.length - 1, 1);
    const x = padding.left + (index / totalPoints) * chartW;
    const y = padding.top + chartH - (Math.min(val, maxVal) / maxVal) * chartH;
    return { x, y };
  }

  // 2. Draw X-axis labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  labels.forEach((label, i) => {
    const pt = getCoord(i, 0);
    ctx.fillText(label, pt.x, h - 22);
  });

  // 3. Draw Average Baseline
  ctx.beginPath();
  ctx.setLineDash([4, 5]);
  ctx.strokeStyle = dashLineColor;
  ctx.lineWidth = 1.6;
  average.forEach((val, i) => {
    const pt = getCoord(i, val);
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  // 4. Draw Smooth Spline
  const points = actual.map((val, i) => getCoord(i, val));

  if (points.length > 1) {
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
  }

  // 5. Draw Data Dots
  let maxIdx = 0;
  let maxActual = actual[0] || 0;
  points.forEach((pt, i) => {
    if (actual[i] > maxActual) {
      maxActual = actual[i];
      maxIdx = i;
    }
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
  const hPt = points[maxIdx];
  if (hPt && actual.length > 0) {
    const tooltipW = 84;
    const tooltipH = 34;
    const ttX = Math.min(Math.max(hPt.x - tooltipW / 2, padding.left), w - padding.right - tooltipW);
    const ttY = Math.max(hPt.y - tooltipH - 12, 6);

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
    ctx.fillText(labels[maxIdx] || '', ttX + tooltipW / 2, ttY + 10);

    ctx.font = '800 11.5px Plus Jakarta Sans, Tajawal, sans-serif';
    ctx.fillStyle = greenLine;
    ctx.fillText(`• ${maxActual.toFixed(2)} kWh`, ttX + tooltipW / 2, ttY + 23);
  }
}

/* Render Dynamic Supabase Dashboard Data */
async function loadDashboardData() {
  const isAr = typeof i18n !== 'undefined' && i18n.isRtl();

  try {
    // 1. Fetch Household Context
    const { householdId, profile } = await DataAPI.getHouseholdContext();
    state.householdId = householdId;
    state.profile = profile;

    if (!householdId) {
      console.warn("[Dashboard] No household_id resolved.");
      return;
    }

    // 2. Query all database resources concurrently
    const [energy, hourly, breakdown, points, bills, activities] = await Promise.all([
      DataAPI.getEnergyConsumption(householdId),
      DataAPI.getHourlyEnergyUsage(householdId),
      DataAPI.getConsumptionBreakdown(householdId),
      DataAPI.getWafarPoints(householdId),
      DataAPI.getBills(householdId),
      DataAPI.getActivities(householdId, 5)
    ]);

    state.energyData = energy;
    state.hourlyData = hourly;
    state.breakdownData = breakdown;
    state.pointsData = points;
    state.billsData = bills;
    state.activitiesData = activities;

    // 3. Sync User Profile & Sidebar
    DataAPI.syncSidebar(profile, points.points);

    // 4. Update KPI 1: Today's Consumption
    const valTodayKwh = document.getElementById('valTodayKwh');
    const valSavedToday = document.getElementById('valSavedToday');
    const latestKWh = energy.latest ? Number(energy.latest.energy_consumption_kwh) : 0;
    const prevKWh = energy.previous ? Number(energy.previous.energy_consumption_kwh) : latestKWh;
    const diffKWh = Number((prevKWh - latestKWh).toFixed(2));

    if (valTodayKwh) valTodayKwh.textContent = latestKWh.toFixed(2);
    if (valSavedToday) {
      if (diffKWh >= 0) {
        valSavedToday.textContent = `↓ ${diffKWh.toFixed(2)} kWh`;
        valSavedToday.className = 'chip-pill';
      } else {
        valSavedToday.textContent = `↑ ${Math.abs(diffKWh).toFixed(2)} kWh`;
        valSavedToday.className = 'chip-pill amber';
      }
    }

    // 5. Update KPI 2: Average Daily
    const valAvgDailyKwh = document.getElementById('valAvgDailyKwh');
    const valAvgTarget = document.getElementById('valAvgTarget');
    if (valAvgDailyKwh) valAvgDailyKwh.textContent = energy.avgKWh.toFixed(2);
    if (valAvgTarget) {
      const targetVal = (energy.avgKWh * 1.05).toFixed(1);
      valAvgTarget.innerHTML = `<strong style="color:var(--text-main);">${isAr ? 'الهدف:' : 'Target:'}</strong> ≤ ${targetVal} kWh`;
    }

    // 6. Update KPI 3: Current Bill
    const valCurrentBill = document.getElementById('valCurrentBill');
    const valBillDiscount = document.getElementById('valBillDiscount');
    const latestBill = bills?.latest || (Array.isArray(bills?.bills) && bills.bills[0]) || (Array.isArray(bills) && bills[0]) || null;
    const pts = Number(points?.points ?? points?.points_balance ?? 0);

    const billOriginal = latestBill ? (Number(latestBill.original_amount) || Number(latestBill.total_amount) || 0) : 0;
    const billCalc = DataAPI.calculateBillDiscount(billOriginal, pts);
    const billDiscount = billCalc.discountAmount;
    const billTotal = billCalc.totalAmount;

    if (valCurrentBill) valCurrentBill.textContent = billTotal.toFixed(2);
    if (valBillDiscount) {
      valBillDiscount.textContent = `↓ ${billDiscount.toFixed(2)} EGP ${isAr ? 'خصم وفّر' : 'WAFAR Discount'}`;
    }

    // 7. Update KPI 4: WAFAR Points
    const valWafarPoints = document.getElementById('valWafarPoints');
    const valPointsDiscount = document.getElementById('valPointsDiscount');
    if (valWafarPoints) valWafarPoints.textContent = pts.toLocaleString();
    if (valPointsDiscount) {
      valPointsDiscount.textContent = `↑ ${billDiscount.toFixed(2)} EGP ${isAr ? 'خصم متاح' : 'discount'}`;
    }

    // 8. Update Sidebar "You're Saving!" progress bar
    const savingProgressBar = document.getElementById('savingProgressBar');
    const savingProgressText = document.querySelector('.saving-progress-text');
    let savePct = 78;
    if (energy.avgKWh > 0 && latestKWh > 0) {
      savePct = Math.min(98, Math.max(15, Math.round(((energy.avgKWh - latestKWh) / energy.avgKWh + 1) * 50)));
    }
    if (savingProgressBar) savingProgressBar.style.width = `${savePct}%`;
    if (savingProgressText) savingProgressText.textContent = `${savePct}%`;

    // 9. Update Consumption Breakdown Donut & Legend
    const donutCenterVal = document.getElementById('donutCenterVal');
    if (donutCenterVal) donutCenterVal.textContent = latestKWh.toFixed(2);

    const breakdownLegend = document.getElementById('breakdownLegend');
    if (breakdownLegend) {
      if (Array.isArray(breakdown) && breakdown.length > 0) {
        const totalBreakdown = breakdown.reduce((sum, b) => sum + (Number(b.consumption_kwh) || 0), 0) || 1;
        const colors = ['#587b44', '#8aa57a', '#d5b66d', '#e8a735', '#a0b19d'];
        
        let legendHtml = '';
        breakdown.forEach((item, idx) => {
          const itemKWh = Number(item.consumption_kwh) || 0;
          const pct = Math.round((itemKWh / totalBreakdown) * 100);
          const color = colors[idx % colors.length];
          legendHtml += `
            <div class="breakdown-row">
              <div class="breakdown-label-group">
                <span class="breakdown-dot" style="background-color: ${color};"></span>
                <span>${escapeHtml(item.category || (isAr ? 'أجهزة' : 'Category'))}</span>
              </div>
              <div>
                <span class="breakdown-pct">${pct}%</span>
                <span class="breakdown-kwh">${itemKWh.toFixed(2)} kWh</span>
              </div>
            </div>
          `;
        });
        breakdownLegend.innerHTML = legendHtml;
      } else {
        breakdownLegend.innerHTML = `
          <div style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 12px;">
            ${isAr ? 'لا تتوفر تفاصيل أجهزة حالياً' : 'No breakdown data available'}
          </div>
        `;
      }
    }

    // 10. Update Monthly Comparison Bars
    const monthlyBox = document.getElementById('monthlyChartBox');
    if (monthlyBox && energy.records && energy.records.length > 0) {
      let barsHtml = '';
      const recs = energy.records.slice(-5);
      const maxRecKWh = Math.max(...recs.map(r => Number(r.energy_consumption_kwh) || 1), 10);

      recs.forEach((r, idx) => {
        const isLatest = idx === recs.length - 1;
        const rKWh = Number(r.energy_consumption_kwh) || 0;
        const heightPx = Math.max(20, Math.min(80, Math.round((rKWh / maxRecKWh) * 80)));
        const dObj = new Date(r.date);
        const dayLabel = !isNaN(dObj) ? dObj.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' }) : r.date;

        barsHtml += `
          <div class="month-bar-col ${isLatest ? 'active' : ''}">
            ${isLatest ? `<div class="month-tooltip-badge">${rKWh.toFixed(2)} kWh</div>` : ''}
            <div class="month-bar-pill" style="height: ${heightPx}px;" title="${dayLabel}: ${rKWh.toFixed(2)} kWh"></div>
            <span class="month-name" ${isLatest ? 'style="font-weight: 800; color: var(--text-main);"' : ''}>${dayLabel}</span>
          </div>
        `;
      });
      monthlyBox.innerHTML = barsHtml;
    }

    // 11. Update Bottom Insights
    const insightAiDesc = document.getElementById('insightAiDesc');
    const insightSavingTime = document.getElementById('insightSavingTime');
    const insightTopDevice = document.getElementById('insightTopDevice');
    const insightTopDevicePct = document.getElementById('insightTopDevicePct');
    const insightProjectedBill = document.getElementById('insightProjectedBill');
    const insightProjectedSub = document.getElementById('insightProjectedSub');

    if (insightAiDesc) {
      if (diffKWh > 0) {
        const pct = Math.round((diffKWh / (prevKWh || 1)) * 100);
        insightAiDesc.innerHTML = isAr ? 
          `استهلاكك اليوم <strong>أقل بنسبة ${pct}%</strong> عن الأمس. استمر في الترشيد!` : 
          `Your consumption is <strong>${pct}% lower</strong> than yesterday. Keep it up!`;
      } else {
        insightAiDesc.innerHTML = isAr ? 
          `استهلاكك مستقر ومتوازن مع المعدل اليومي (${energy.avgKWh.toFixed(1)} kWh).` : 
          `Your consumption is optimal and balanced with your daily average (${energy.avgKWh.toFixed(1)} kWh).`;
      }
    }

    if (insightSavingTime) {
      insightSavingTime.textContent = "13:00 - 16:00";
    }

    if (insightTopDevice) {
      if (breakdown && breakdown.length > 0) {
        const sortedB = [...breakdown].sort((a, b) => Number(b.consumption_kwh) - Number(a.consumption_kwh));
        insightTopDevice.textContent = sortedB[0].category || "Air Conditioner";
        const topPct = Math.round((Number(sortedB[0].consumption_kwh) / (latestKWh || 1)) * 100);
        if (insightTopDevicePct) insightTopDevicePct.textContent = `${Math.min(topPct, 100)}%`;
      } else {
        insightTopDevice.textContent = isAr ? "المكيف الهوائي" : "Air Conditioner";
        if (insightTopDevicePct) insightTopDevicePct.textContent = "38%";
      }
    }

    if (insightProjectedBill) {
      const projAmount = latestBill ? billTotal : (latestKWh * 30 * 1.5);
      insightProjectedBill.textContent = `${projAmount.toFixed(2)} EGP`;
    }
    if (insightProjectedSub) {
      insightProjectedSub.innerHTML = `↓ ${billDiscount.toFixed(2)} EGP <span data-i18n="vs_last_month">${isAr ? 'وفر وفّر' : 'WAFAR savings'}</span>`;
    }

    // 12. Update Recent Activity List from Supabase public.activities
    const activityList = document.getElementById('recentActivityList');
    if (activityList) {
      if (Array.isArray(activities) && activities.length > 0) {
        let actHtml = '';
        activities.forEach(act => {
          const actType = act.activity_type || 'energy';
          const isLamp = actType.includes('lamp') || (act.title && act.title.toLowerCase().includes('lamp'));
          const iconClass = isLamp ? 'amber' : 'green';
          
          let iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`;
          if (isLamp) {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"></path></svg>`;
          }

          let timeStr = 'Today';
          if (act.created_at) {
            const actDate = new Date(act.created_at);
            if (!isNaN(actDate)) {
              timeStr = actDate.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
            }
          }

          actHtml += `
            <div class="activity-item">
              <div class="activity-icon-box ${iconClass}">
                ${iconSvg}
              </div>
              <div class="activity-text">
                ${escapeHtml(act.title || act.description || 'Activity logged')}
              </div>
              <div class="activity-time">${timeStr}</div>
            </div>
          `;
        });
        activityList.innerHTML = actHtml;
      } else {
        activityList.innerHTML = `
          <div class="activity-item">
            <div class="activity-icon-box amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"></path>
              </svg>
            </div>
            <div class="activity-text">
              ${isAr ? 'مصباح غرفة النوم الذكي متصل ومراقب' : 'Bedroom smart lamp connected and monitored'}
            </div>
            <div class="activity-time">Live</div>
          </div>
          <div class="activity-item">
            <div class="activity-icon-box green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            </div>
            <div class="activity-text">
              ${isAr ? `تسجيل استهلاك اليوم: ${latestKWh.toFixed(2)} kWh` : `Today's energy logged: ${latestKWh.toFixed(2)} kWh`}
            </div>
            <div class="activity-time">${isAr ? 'اليوم' : 'Today'}</div>
          </div>
          <div class="activity-item">
            <div class="activity-icon-box amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <div class="activity-text">
              ${isAr ? `رصيد نقاط وفّر الحالي: ${points.points} نقطة` : `Active WAFAR Points balance: ${points.points} pts`}
            </div>
            <div class="activity-time">${isAr ? 'نشط' : 'Active'}</div>
          </div>
        `;
      }
    }

    // Redraw Chart with fetched data
    drawHourlyChart();

  } catch (err) {
    console.error("[Dashboard] Error loading dynamic data:", err);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

  // 2. Fetch and render dynamic Supabase data
  await loadDashboardData();
  window.addEventListener('resize', drawHourlyChart);

  // 3. Fetch Initial LED State from Database (public.led_control row id = 1)
  try {
    const initialLedState = await LedAPI.getLedState();
    renderLampUI(initialLedState);
  } catch (err) {
    console.warn("Could not fetch initial LED state:", err);
  }

  // 4. Subscribe to Realtime Changes on led_control table
  const ledChannel = LedAPI.subscribeToLedState((isOn) => {
    renderLampUI(isOn);
  });

  window.addEventListener('beforeunload', () => {
    LedAPI.unsubscribe(ledChannel);
  });

  // Listen for language change event from i18n
  window.addEventListener('wafar:langchange', () => {
    loadDashboardData();
    renderLampUI(state.isLampOn);
  });

  const rangeSelect = document.getElementById('chartRangeSelect');
  if (rangeSelect) {
    rangeSelect.addEventListener('change', (e) => {
      state.chartRange = e.target.value;
      drawHourlyChart();
    });
  }

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

