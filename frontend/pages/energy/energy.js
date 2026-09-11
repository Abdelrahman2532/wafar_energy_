/* Energy Page State */
const state = {
  householdId: null,
  profile: null,
  energyData: null,
  billsData: null,
  pointsData: null,
  breakdownData: [],
  period: 'week',
  trendRange: 7
};

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

function initLiveClock() {
  const el = document.getElementById('headerLiveTime');
  if (!el) return;
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
  state.period = p;
  const btnW = document.getElementById('btnWeekPeriod');
  const btnM = document.getElementById('btnMonthPeriod');
  if (btnW) btnW.classList.toggle('active', p === 'week');
  if (btnM) btnM.classList.toggle('active', p === 'month');
  const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
  showToast(isAr ? `عرض بيانات ${p === 'week' ? 'الأسبوع' : 'الشهر'}` : `Showing ${p} data`);
  drawDailyTrendChart();
}

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

  const isAr = typeof i18n !== 'undefined' && i18n.isRtl();

  // 1. Prepare dynamic trend points from energyData
  let labels = ['Apr 01', 'Apr 02', 'Apr 03', 'Apr 04', 'Apr 05', 'Apr 06', 'Apr 07'];
  let values = [8.4, 7.9, 9.2, 7.9, 9.6, 7.5, 9.1];

  if (state.energyData && Array.isArray(state.energyData.records) && state.energyData.records.length > 0) {
    const recs = state.energyData.records.slice(-Number(state.trendRange || 7));
    labels = recs.map(r => {
      const d = new Date(r.date);
      return !isNaN(d) ? d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }) : r.date;
    });
    values = recs.map(r => Number(r.energy_consumption_kwh) || 0);
  }

  const maxVal = Math.max(...values, 10.0) * 1.25;

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

  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];
  yTicks.forEach(val => {
    const y = padding.top + chartH - (val / maxVal) * chartH;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
    ctx.fillText(`${val.toFixed(0)}k`, padding.left - 10, y);
  });

  function getCoord(index, val) {
    const totalPoints = Math.max(labels.length - 1, 1);
    const x = padding.left + (index / totalPoints) * chartW;
    const y = padding.top + chartH - (Math.min(val, maxVal) / maxVal) * chartH;
    return { x, y };
  }

  // 2. X Labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  labels.forEach((label, i) => {
    const pt = getCoord(i, 0);
    ctx.fillText(label, pt.x, h - 22);
  });

  // 3. Spline Curve & Gradient Fill
  const points = values.map((val, i) => getCoord(i, val));

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
  }

  // Data Dots & Find Peak
  let peakIdx = 0;
  let peakVal = values[0] || 0;
  points.forEach((pt, i) => {
    if (values[i] > peakVal) {
      peakVal = values[i];
      peakIdx = i;
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

  // Peak Tooltip
  const peakPt = points[peakIdx];
  if (peakPt && values.length > 0) {
    const ttW = 76;
    const ttH = 26;
    const ttX = Math.min(Math.max(peakPt.x - ttW / 2, padding.left), w - padding.right - ttW);
    const ttY = Math.max(peakPt.y - ttH - 10, 6);

    ctx.fillStyle = '#2c3e24';
    ctx.beginPath();
    ctx.roundRect(ttX, ttY, ttW, ttH, 6);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 11px Plus Jakarta Sans, Tajawal, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${peakVal.toFixed(1)} kWh`, ttX + ttW / 2, ttY + ttH / 2);
  }

  // End Tooltip
  const endIdx = points.length - 1;
  const endPt = points[endIdx];
  if (endPt && endIdx !== peakIdx && values.length > 0) {
    const endVal = values[endIdx];
    const ttW = 70;
    const ttH = 24;
    const ttX = Math.min(Math.max(endPt.x - ttW / 2, padding.left), w - padding.right - ttW);
    const ttY = Math.max(endPt.y - ttH - 10, 6);

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
    ctx.fillText(`${endVal.toFixed(1)} kWh`, ttX + ttW / 2, ttY + ttH / 2);
  }
}

/* Load Dynamic Supabase Energy Data */
async function loadEnergyData() {
  const isAr = typeof i18n !== 'undefined' && i18n.isRtl();

  try {
    const { householdId, profile } = await DataAPI.getHouseholdContext();
    state.householdId = householdId;
    state.profile = profile;

    if (!householdId) {
      console.warn("[Energy] No household_id resolved.");
      return;
    }

    const [energy, bills, points, breakdown] = await Promise.all([
      DataAPI.getEnergyConsumption(householdId),
      DataAPI.getBills(householdId),
      DataAPI.getWafarPoints(householdId),
      DataAPI.getConsumptionBreakdown(householdId)
    ]);

    state.energyData = energy;
    state.billsData = bills;
    state.pointsData = points;
    state.breakdownData = breakdown;

    const latestBill = bills?.latest || (Array.isArray(bills?.bills) && bills.bills[0]) || (Array.isArray(bills) && bills[0]) || null;
    const pts = Number(points?.points ?? points?.points_balance ?? 0);
    const ptsDiscount = Math.floor(pts / 10);

    // 1. Sync User Sidebar
    DataAPI.syncSidebar(profile, pts);

    // 2. Top KPI 1: Today's Consumption
    const valToday = document.getElementById('energyValTodayKwh');
    const valSavedBadge = document.getElementById('energyValSavedBadge');
    const latestKWh = energy.latest ? Number(energy.latest.energy_consumption_kwh) : 0;
    const prevKWh = energy.previous ? Number(energy.previous.energy_consumption_kwh) : latestKWh;
    const diffKWh = Number((prevKWh - latestKWh).toFixed(2));

    if (valToday) valToday.textContent = latestKWh.toFixed(2);
    if (valSavedBadge) {
      if (diffKWh >= 0) {
        valSavedBadge.textContent = isAr ? `↓ ${diffKWh.toFixed(2)} kWh توفير عن الأمس` : `↓ ${diffKWh.toFixed(2)} kWh saved vs yesterday`;
        valSavedBadge.className = 'chip-pill';
      } else {
        valSavedBadge.textContent = isAr ? `↑ ${Math.abs(diffKWh).toFixed(2)} kWh عن الأمس` : `↑ ${Math.abs(diffKWh).toFixed(2)} kWh vs yesterday`;
        valSavedBadge.className = 'chip-pill amber';
      }
    }

    // 3. Top KPI 2: Total Energy (This Month / Recorded Period)
    const valTotalMonth = document.getElementById('energyValTotalMonth');
    const valCycle = document.getElementById('energyValCycle');
    if (valTotalMonth) valTotalMonth.textContent = energy.totalKWh.toFixed(1);
    if (valCycle) {
      const monthName = latestBill?.billing_month || (isAr ? 'الدورة الحالية' : 'Current Cycle');
      valCycle.textContent = monthName;
    }

    // 4. Top KPI 3: Total Cost (This Month / Recorded Period)
    const valTotalCost = document.getElementById('energyValTotalCost');
    const valCostDiscount = document.getElementById('energyValCostDiscount');
    const billOriginal = latestBill ? Number(latestBill.original_amount || 0) : (energy.totalKWh * 1.5);
    const billDiscount = latestBill ? Number(latestBill.discount_amount || 0) : Math.min(ptsDiscount, billOriginal);
    const billTotal = latestBill ? Number(latestBill.total_amount || 0) : Math.max(0, billOriginal - billDiscount);

    if (valTotalCost) valTotalCost.textContent = billTotal.toFixed(2);
    if (valCostDiscount) {
      valCostDiscount.textContent = isAr ? `-${ptsDiscount}.00 ج.م خصم متاح` : `-${ptsDiscount}.00 EGP discount ready`;
    }

    // 5. Trend Stats (under chart)
    const trendDailyAvg = document.getElementById('trendDailyAvg');
    const trendHighestVal = document.getElementById('trendHighestVal');
    const trendHighestDay = document.getElementById('trendHighestDay');
    const trendLowestVal = document.getElementById('trendLowestVal');
    const trendLowestDay = document.getElementById('trendLowestDay');
    const trendVsLastWeek = document.getElementById('trendVsLastWeek');

    if (trendDailyAvg) trendDailyAvg.textContent = `${energy.avgKWh.toFixed(1)} kWh`;

    if (energy.maxRecord) {
      const maxKWh = Number(energy.maxRecord.energy_consumption_kwh);
      const d = new Date(energy.maxRecord.date);
      const dayLabel = !isNaN(d) ? d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }) : energy.maxRecord.date;
      if (trendHighestVal) trendHighestVal.textContent = `${maxKWh.toFixed(1)} kWh`;
      if (trendHighestDay) trendHighestDay.textContent = dayLabel;
    }

    if (energy.minRecord) {
      const minKWh = Number(energy.minRecord.energy_consumption_kwh);
      const d = new Date(energy.minRecord.date);
      const dayLabel = !isNaN(d) ? d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }) : energy.minRecord.date;
      if (trendLowestVal) trendLowestVal.textContent = `${minKWh.toFixed(1)} kWh`;
      if (trendLowestDay) trendLowestDay.textContent = dayLabel;
    }

    if (trendVsLastWeek) {
      const avgDiff = Number((((latestKWh - energy.avgKWh) / (energy.avgKWh || 1)) * 100).toFixed(0));
      if (avgDiff <= 0) {
        trendVsLastWeek.textContent = `↓ ${Math.abs(avgDiff)}%`;
        trendVsLastWeek.style.color = 'var(--primary-green)';
      } else {
        trendVsLastWeek.textContent = `↑ ${avgDiff}%`;
        trendVsLastWeek.style.color = '#e8a735';
      }
    }

    // 6. Energy Log Table (Dynamic <tr> Rows)
    const tableBody = document.getElementById('energyLogTableBody');
    if (tableBody) {
      if (energy.records && energy.records.length > 0) {
        const sortedRecs = [...energy.records].reverse();
        let rowsHtml = '';

        sortedRecs.forEach((r, idx) => {
          const rKWh = Number(r.energy_consumption_kwh) || 0;
          const prevInOrder = idx < sortedRecs.length - 1 ? Number(sortedRecs[idx + 1].energy_consumption_kwh) : null;
          
          let diffHtml = '<span style="color:var(--text-light);">-</span>';
          if (prevInOrder !== null) {
            const diff = Number((rKWh - prevInOrder).toFixed(2));
            if (diff <= 0) {
              diffHtml = `<span class="diff-badge down">${diff.toFixed(2)} ↓</span>`;
            } else {
              diffHtml = `<span class="diff-badge up">+${diff.toFixed(2)} ↑</span>`;
            }
          }

          const d = new Date(r.date);
          const dateStr = !isNaN(d) ? d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : r.date;

          rowsHtml += `
            <tr>
              <td>${dateStr}</td>
              <td>${rKWh.toFixed(2)}</td>
              <td>${diffHtml}</td>
            </tr>
          `;
        });
        tableBody.innerHTML = rowsHtml;
      } else {
        tableBody.innerHTML = `
          <tr>
            <td colspan="3" style="text-align:center; color:var(--text-muted);">${isAr ? 'لا توجد سجلات استهلاك' : 'No consumption records available'}</td>
          </tr>
        `;
      }
    }

    // 7. Consumption Breakdown Donut & Top Devices List
    const donutCenterVal = document.getElementById('energyDonutCenterVal');
    if (donutCenterVal) donutCenterVal.textContent = energy.totalKWh.toFixed(1);

    const breakdownLegend = document.getElementById('energyBreakdownLegend');
    const topDevicesList = document.getElementById('topDevicesList');

    if (Array.isArray(breakdown) && breakdown.length > 0) {
      const totalBreakdown = breakdown.reduce((sum, b) => sum + (Number(b.consumption_kwh) || 0), 0) || 1;
      const colors = ['#4d6d39', '#799b61', '#d5b66d', '#f3b41c', '#a0b19d'];

      let legendHtml = '';
      let devicesHtml = '';

      const sortedBreakdown = [...breakdown].sort((a, b) => (Number(b.consumption_kwh) || 0) - (Number(a.consumption_kwh) || 0));

      sortedBreakdown.forEach((item, idx) => {
        const itemKWh = Number(item.consumption_kwh) || 0;
        const pct = Math.round((itemKWh / totalBreakdown) * 100);
        const color = colors[idx % colors.length];

        legendHtml += `
          <div class="breakdown-row">
            <div class="breakdown-label-group">
              <span class="breakdown-dot" style="background-color: ${color};"></span>
              <span>${item.category || 'Device'}</span>
            </div>
            <span class="breakdown-pct">${pct}%</span>
          </div>
        `;

        devicesHtml += `
          <div class="device-progress-item">
            <div class="device-icon-mini">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <span class="device-progress-name">${item.category || 'Device'}</span>
            <div class="device-progress-bar-wrap">
              <div class="device-progress-bar-fill" style="width: ${pct}%; background-color: ${color};"></div>
            </div>
            <span class="device-progress-pct">${pct}%</span>
          </div>
        `;
      });

      if (breakdownLegend) breakdownLegend.innerHTML = legendHtml;
      if (topDevicesList) topDevicesList.innerHTML = devicesHtml;
    }

    // 8. AI Energy Insight
    const aiInsightText = document.getElementById('energyAiInsightText');
    if (aiInsightText) {
      const peakKWh = energy.latest?.peak_hours_usage_kwh ? Number(energy.latest.peak_hours_usage_kwh) : (latestKWh * 0.35);
      aiInsightText.innerHTML = isAr ? 
        `يمكنك توفير حتى <strong>${peakKWh.toFixed(1)} kWh</strong> يومياً من خلال ترشيد الأحمال في ساعات الذروة بين <strong>01:00 - 04:00 مساءً</strong>.` : 
        `You can save up to <strong>${peakKWh.toFixed(1)} kWh</strong> daily by optimizing appliances during peak hours between <strong>01:00 - 04:00 PM</strong>.`;
    }

    // Redraw Trend Canvas
    drawDailyTrendChart();

  } catch (err) {
    console.error("[Energy] Error loading dynamic data:", err);
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

  // 2. Load dynamic data
  await loadEnergyData();
  window.addEventListener('resize', drawDailyTrendChart);

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

  window.addEventListener('wafar:langchange', () => {
    loadEnergyData();
  });

  const trendSelect = document.getElementById('trendRangeSelect');
  if (trendSelect) {
    trendSelect.addEventListener('change', (e) => {
      state.trendRange = Number(e.target.value) || 7;
      drawDailyTrendChart();
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

