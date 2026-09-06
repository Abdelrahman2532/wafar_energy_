// State (Synchronized with 4 database lights: Bedroom Light, Kitchen Light, Reception Light, Living Room Light)
const apartmentState = {
  viewMode: '3D', // '2D' or '3D'
  lightingMode: 'day', // 'day' or 'night'
  zoomLevel: 1,
  rotationAngle: 0,
  lights: {
    1: { id: 1, name: 'Bedroom Light', is_on: false, watts: 15 },
    2: { id: 2, name: 'Kitchen Light', is_on: false, watts: 12 },
    3: { id: 3, name: 'Reception Light', is_on: false, watts: 20 },
    4: { id: 4, name: 'Living Room Light', is_on: false, watts: 15 }
  }
};

const updatingLightIds = new Set();

// Helper: Toast
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

// Set View Mode (2D / 3D)
function setViewMode(mode) {
  apartmentState.viewMode = mode;
  const img = document.getElementById('floorPlanImg');
  const btn2D = document.getElementById('btn2DView');
  const btn3D = document.getElementById('btn3DView');
  const subTitle = document.getElementById('pageSubTitle');
  const hintText = document.getElementById('bottomHintText');
  const dayNightBar = document.getElementById('dayNightToggleBar');

  resetPlanTransform();

  if (mode === '2D') {
    img.src = '../../assets/images/apartment-2d.png';
    btn2D.classList.add('active');
    btn3D.classList.remove('active');
    subTitle.setAttribute('data-i18n', 'apartment_layout_sub_2d');
    hintText.setAttribute('data-i18n', 'bottom_hint_2d');
    dayNightBar.style.display = 'none';

    // Adjust badge positioning classes for 2D
    updateBadgeClassesFor2D(true);
  } else {
    img.src = '../../assets/images/apartment-3d.png';
    btn3D.classList.add('active');
    btn2D.classList.remove('active');
    subTitle.setAttribute('data-i18n', 'apartment_layout_sub_3d');
    hintText.setAttribute('data-i18n', 'bottom_hint_3d');
    dayNightBar.style.display = 'flex';

    updateBadgeClassesFor2D(false);
  }

  if (typeof i18n !== 'undefined') {
    i18n.translateDOM();
  }

  showToast(mode === '2D' ? 'Switched to 2D Floor Plan' : 'Switched to 3D Isometric View');
}

// Room Anchor Coordinate Mapping System (4 Rooms: Bedroom, Kitchen, Living Room, Reception)
const roomAnchors = {
  '2D': {
    tagBedroom:    { left: '24.0%', top: '25.0%' },
    tagKitchen:    { left: '79.0%', top: '31.0%' },
    tagLiving:     { left: '21.0%', top: '81.0%' },
    tagReception:  { left: '80.0%', top: '77.0%' },
    entranceArrow: { left: '39.0%', top: '78.5%' }
  },
  '3D': {
    tagBedroom:    { left: '28.0%', top: '34.0%' },
    tagKitchen:    { left: '77.0%', top: '34.0%' },
    tagLiving:     { left: '28.0%', top: '72.0%' },
    tagReception:  { left: '77.0%', top: '73.0%' },
    entranceArrow: { left: '41.5%', top: '80.0%' }
  }
};

// Synchronize Room Badges Overlay container to match rendered img bounding box
function syncBadgesContainerBounds() {
  const img = document.getElementById('floorPlanImg');
  const container = document.getElementById('roomBadgesContainer');
  if (!img || !container) return;

  container.style.position = 'absolute';
  container.style.left = img.offsetLeft + 'px';
  container.style.top = img.offsetTop + 'px';
  container.style.width = img.offsetWidth + 'px';
  container.style.height = img.offsetHeight + 'px';
}

function applyRoomAnchors(mode) {
  const anchors = roomAnchors[mode];
  if (!anchors) return;

  for (const [id, pos] of Object.entries(anchors)) {
    const el = document.getElementById(id);
    if (el) {
      el.style.left = pos.left;
      el.style.top = pos.top;
    }
  }
}

function updateBadgeClassesFor2D(is2D) {
  const mode = is2D ? '2D' : '3D';
  const tBed = document.getElementById('tagBedroom');
  const tKit = document.getElementById('tagKitchen');
  const tLiv = document.getElementById('tagLiving');
  const tRec = document.getElementById('tagReception');
  const arrow = document.getElementById('entranceArrow');

  const bedLight = apartmentState.lights[1];
  const kitLight = apartmentState.lights[2];
  const recLight = apartmentState.lights[3];
  const livLight = apartmentState.lights[4];

  if (is2D) {
    if (tBed) tBed.className = `room-badge-tag tag-bedroom-2d ${bedLight?.is_on ? '' : 'is-off'}`;
    if (tKit) tKit.className = `room-badge-tag tag-kitchen-2d ${kitLight?.is_on ? '' : 'is-off'}`;
    if (tLiv) tLiv.className = `room-badge-tag tag-living-2d ${livLight?.is_on ? '' : 'is-off'}`;
    if (tRec) tRec.className = `room-badge-tag tag-reception-2d ${recLight?.is_on ? '' : 'is-off'}`;
    if (arrow) arrow.className = 'entrance-arrow entrance-arrow-2d';
  } else {
    if (tBed) tBed.className = `room-badge-tag tag-bedroom-3d ${bedLight?.is_on ? '' : 'is-off'}`;
    if (tKit) tKit.className = `room-badge-tag tag-kitchen-3d ${kitLight?.is_on ? '' : 'is-off'}`;
    if (tLiv) tLiv.className = `room-badge-tag tag-living-3d ${livLight?.is_on ? '' : 'is-off'}`;
    if (tRec) tRec.className = `room-badge-tag tag-reception-3d ${recLight?.is_on ? '' : 'is-off'}`;
    if (arrow) arrow.className = 'entrance-arrow entrance-arrow-3d';
  }

  applyRoomAnchors(mode);
  syncBadgesContainerBounds();
}

// Set Day / Night Mode in 3D
function setLightingMode(mode) {
  apartmentState.lightingMode = mode;
  const btnDay = document.getElementById('btnDayMode');
  const btnNight = document.getElementById('btnNightMode');
  const container = document.getElementById('floorPlanContainer');

  if (mode === 'night') {
    btnNight.classList.add('active');
    btnDay.classList.remove('active');
    container.classList.add('night-mode');
    showToast('Night Atmosphere Enabled');
  } else {
    btnDay.classList.add('active');
    btnNight.classList.remove('active');
    container.classList.remove('night-mode');
    showToast('Daylight Mode Enabled');
  }
}

// Zoom & Rotate Floor Plan
function zoomPlan(delta) {
  apartmentState.zoomLevel = Math.max(0.7, Math.min(1.8, apartmentState.zoomLevel + delta));
  applyPlanTransform();
}

function rotatePlan() {
  apartmentState.rotationAngle = (apartmentState.rotationAngle + 90) % 360;
  applyPlanTransform();
  showToast(`Rotated to ${apartmentState.rotationAngle}°`);
}

function resetPlanTransform() {
  apartmentState.zoomLevel = 1;
  apartmentState.rotationAngle = 0;
  applyPlanTransform();
}

function applyPlanTransform() {
  const wrapper = document.getElementById('planImgWrapper');
  wrapper.style.transform = `scale(${apartmentState.zoomLevel}) rotate(${apartmentState.rotationAngle}deg)`;
}

// Toggle Device Handler (Integrated with Supabase per-row by ID)
async function handleDeviceSwitch(lightId, isChecked) {
  const id = Number(lightId);
  const light = apartmentState.lights[id];
  if (!light) return;

  if (updatingLightIds.has(id)) return;
  updatingLightIds.add(id);

  const switchEl = document.getElementById(`switchLight${id}`);
  if (switchEl) switchEl.disabled = true;

  try {
    const res = await LedAPI.setLightState(id, isChecked);
    updatingLightIds.delete(id);
    if (switchEl) switchEl.disabled = false;

    if (res.success) {
      light.is_on = res.is_on;
      if (switchEl) switchEl.checked = res.is_on;
      updateDevicesUI();

      showToast(
        res.is_on ? `${light.name} Turned ON` : `${light.name} Turned OFF`,
        '✓'
      );
    } else {
      light.is_on = !isChecked;
      if (switchEl) switchEl.checked = !isChecked;
      updateDevicesUI();
      showToast(`Failed to update ${light.name} in database.`, '!');
    }
  } catch (e) {
    updatingLightIds.delete(id);
    if (switchEl) switchEl.disabled = false;
    light.is_on = !isChecked;
    if (switchEl) switchEl.checked = !isChecked;
    updateDevicesUI();
    showToast(`Communication error while updating ${light.name}.`, '!');
  }
}

function toggleDevice(lightId) {
  const id = Number(lightId);
  const light = apartmentState.lights[id];
  if (!light) return;
  handleDeviceSwitch(id, !light.is_on);
}

// Update Device UI, Badges, and Totals
function updateDevicesUI() {
  let activeCount = 0;
  let totalWatts = 0;

  const lightConfigs = [
    { id: 1, tagId: 'tagBedroom', tagMetaId: 'tagMetaBedroom', defaultWatts: 15 },
    { id: 2, tagId: 'tagKitchen', tagMetaId: 'tagMetaKitchen', defaultWatts: 12 },
    { id: 3, tagId: 'tagReception', tagMetaId: 'tagMetaReception', defaultWatts: 20 },
    { id: 4, tagId: 'tagLiving', tagMetaId: 'tagMetaLiving', defaultWatts: 15 }
  ];

  lightConfigs.forEach(({ id, tagId, tagMetaId, defaultWatts }) => {
    const light = apartmentState.lights[id];
    if (!light) return;

    const isOn = Boolean(light.is_on);
    if (isOn) {
      activeCount++;
      totalWatts += (light.watts || defaultWatts);
    }

    // Update Device Tile
    const tile = document.getElementById(`tileLight${id}`);
    const badge = document.getElementById(`badgeLight${id}`);
    const nameEl = document.getElementById(`nameLight${id}`);
    const metaEl = document.getElementById(`metaLight${id}`);
    const switchEl = document.getElementById(`switchLight${id}`);
    const tag = document.getElementById(tagId);
    const tagMeta = document.getElementById(tagMetaId);

    if (nameEl && light.name) {
      nameEl.textContent = light.name;
    }

    if (metaEl) {
      metaEl.textContent = `${light.watts || defaultWatts} W • 192.168.1.10${id - 1}`;
    }

    if (tile) {
      if (isOn) {
        tile.classList.add('is-active');
        tile.classList.remove('is-off');
      } else {
        tile.classList.remove('is-active');
        tile.classList.add('is-off');
      }
    }

    if (badge) {
      badge.textContent = isOn ? 'ON' : 'OFF';
    }

    if (switchEl && switchEl.checked !== isOn) {
      switchEl.checked = isOn;
    }

    if (tag) {
      if (isOn) tag.classList.remove('is-off');
      else tag.classList.add('is-off');
    }

    if (tagMeta) {
      tagMeta.textContent = isOn ? '1 Device • ON' : '1 Device • OFF';
    }
  });

  // Update Overview stats
  const elConnected = document.getElementById('topConnectedBadge');
  if (elConnected) elConnected.textContent = '4 Connected Devices';

  const elCount = document.getElementById('overviewActiveCount');
  if (elCount) elCount.textContent = activeCount;

  const elTopBadge = document.getElementById('topActiveBadge');
  if (elTopBadge) elTopBadge.textContent = `${activeCount} Active Device${activeCount !== 1 ? 's' : ''}`;

  const elTotalPower = document.getElementById('overviewTotalPower');
  if (elTotalPower) elTotalPower.innerHTML = `${totalWatts} <span class="overview-stat-unit">W</span>`;

  // Update Sidebar Lamp Badge
  const bedLight = apartmentState.lights[1];
  const sbBadge = document.getElementById('sidebarLampBadge');
  if (sbBadge && bedLight) {
    sbBadge.textContent = bedLight.is_on ? 'ON' : 'OFF';
    sbBadge.className = `nav-badge ${bedLight.is_on ? 'badge-on' : ''}`;
  }
}

function filterDevices(val) {
  const tiles = document.querySelectorAll('.device-tile');
  tiles.forEach(tile => {
    if (val === 'all') {
      tile.style.display = 'flex';
    } else if (val === 'active') {
      tile.style.display = tile.classList.contains('is-active') ? 'flex' : 'none';
    } else if (val === 'off') {
      tile.style.display = tile.classList.contains('is-off') ? 'flex' : 'none';
    }
  });
  showToast(`Showing ${val} devices`);
}

// Live Clock
function initClock() {
  const el = document.getElementById('headerLiveTime');
  function update() {
    const now = new Date();
    const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
    const options = { weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true };
    el.textContent = now.toLocaleString(isAr ? 'ar-EG' : 'en-US', options);
  }
  update();
  setInterval(update, 1000);
}

// Theme Toggle
function initTheme() {
  const btn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('wafar-theme') || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
    showToast(isDark ? (isAr ? 'تم تفعيل الوضع الليلي' : 'Dark Mode Enabled') : (isAr ? 'تم تفعيل الوضع النهاري' : 'Light Mode Enabled'));
  });
}

// Mobile Sidebar
function initMobileSidebar() {
  const toggle = document.getElementById('mobileToggleBtn');
  const sidebar = document.getElementById('appSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (toggle && sidebar && backdrop) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      backdrop.classList.toggle('active');
    });

    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
    });
  }
}

// Initialize Everything on Load
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Session Protection Check
  const isAuthed = await AuthAPI.requireAuth();
  if (!isAuthed) return;

  initClock();
  initTheme();
  initMobileSidebar();

  // 2. Fetch Initial 4 Lights from Database table `public.led_control`
  try {
    const records = await LedAPI.getAllLights();
    if (Array.isArray(records)) {
      records.forEach(rec => {
        const id = Number(rec.id);
        if (apartmentState.lights[id]) {
          apartmentState.lights[id].name = rec.name || apartmentState.lights[id].name;
          apartmentState.lights[id].is_on = Boolean(rec.is_on);
        } else {
          apartmentState.lights[id] = {
            id: id,
            name: rec.name || `Light ${id}`,
            is_on: Boolean(rec.is_on),
            watts: 15
          };
        }
      });
    }
  } catch (err) {
    console.warn("Could not fetch initial lights from database:", err);
  }

  // Room Badges Container Auto-sync
  const imgEl = document.getElementById('floorPlanImg');
  if (imgEl) {
    imgEl.addEventListener('load', syncBadgesContainerBounds);
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(syncBadgesContainerBounds).observe(imgEl);
    }
  }
  window.addEventListener('resize', syncBadgesContainerBounds);
  syncBadgesContainerBounds();

  updateDevicesUI();

  // 3. Subscribe to Realtime Changes on all rows in led_control table
  const ledChannel = LedAPI.subscribeToAllLights((changedId, isOn, record) => {
    const id = Number(changedId);
    if (apartmentState.lights[id]) {
      apartmentState.lights[id].is_on = isOn;
      if (record && record.name) {
        apartmentState.lights[id].name = record.name;
      }
      updateDevicesUI();
    }
  });

  window.addEventListener('beforeunload', () => {
    LedAPI.unsubscribe(ledChannel);
  });

  window.addEventListener('wafar:langchange', () => {
    initClock();
    updateDevicesUI();
  });
});
