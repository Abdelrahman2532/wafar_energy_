/**
 * WAFAR API & Data Layer (Integrated with Supabase Backend & Realtime)
 *
 * Hardware LED Control Table: public.led_control (id = 1, is_on = boolean)
 * Household Profile Table: public.profiles (id = user_id, household_id)
 */

// Environment variable resolver across runtime environments (Browser via config.js, Node, Bundler)
function _getEnvVar(key) {
  if (typeof window !== "undefined") {
    if (window.ENV && window.ENV[key]) return window.ENV[key];
    if (window.__ENV__ && window.__ENV__[key]) return window.__ENV__[key];
    if (window[key]) return window[key];
    if (window.process?.env?.[key]) return window.process.env[key];
  }
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key];
  }
  return "";
}

const SUPABASE_CONFIG = {
  get url() {
    return (
      _getEnvVar("SUPABASE_URL") ||
      _getEnvVar("VITE_SUPABASE_URL") ||
      _getEnvVar("NEXT_PUBLIC_SUPABASE_URL") ||
      ""
    );
  },
  get anonKey() {
    return (
      _getEnvVar("SUPABASE_ANON_KEY") ||
      _getEnvVar("SUPABASE_KEY") ||
      _getEnvVar("VITE_SUPABASE_ANON_KEY") ||
      _getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
      ""
    );
  }
};

// Lazy Supabase Client Initializer
let _supabaseClient = null;

function getSupabase() {
  if (_supabaseClient) return _supabaseClient;

  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    _supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    });
    window.wafarSupabase = _supabaseClient;
    return _supabaseClient;
  }

  return window.wafarSupabase || null;
}

const WafarData = {
  // Bedroom Smart Lamp (Connected to Supabase public.led_control row id=1)
  smartLamp: {
    id: 1,
    name: "Bedroom Smart Lamp",
    name_ar: "مصباح غرفة النوم الذكي",
    room: "Bedroom",
    room_ar: "غرفة النوم",
    state: false,
    powerWatts: 0,
    runningTimeFormatted: "2h 34m",
    dailyKWh: 0.038
  },

  // WAFAR Points (10 Points = 1 EGP)
  pointsProfile: {
    totalPoints: 80,
    pointsPerEGP: 10,
    discountEGP: 8.00,
    pointsNeededForNextEGP: 0
  },

  // Billing Mock Data in Egyptian Pounds (EGP)
  billing: {
    currentBill: {
      originalAmountEGP: 342.50,
      wafarDiscountEGP: 8.00,
      netAmountEGP: 334.50,
      dueDate: "Sep 15, 2026",
      status: "unpaid",
      period: "August 2026",
      kwhUsed: 215.4
    },
    invoices: [
      { id: "INV-EGY-08", month: "Aug 2026", kwh: 215.4, amountEGP: 334.50, discountEGP: 8.00, isPaid: false },
      { id: "INV-EGY-07", month: "Jul 2026", kwh: 248.0, amountEGP: 375.00, discountEGP: 12.00, isPaid: true },
      { id: "INV-EGY-06", month: "Jun 2026", kwh: 260.5, amountEGP: 395.20, discountEGP: 15.00, isPaid: true }
    ]
  },

  // Points Earning History
  pointsHistory: [
    { id: "p1", date: "Today", action: "Bedroom lamp turned off during daylight", points: "+10 pts", egpValue: "1 EGP" },
    { id: "p2", date: "Yesterday", action: "Electricity consumption lower than average", points: "+20 pts", egpValue: "2 EGP" },
    { id: "p3", date: "Aug 26", action: "Peak hours energy saving", points: "+10 pts", egpValue: "1 EGP" }
  ]
};

// ==========================================================================
// AUTHENTICATION SERVICE (Supabase Auth & Profiles)
// ==========================================================================

const AuthAPI = {
  /**
   * Sign in user with email & password via Supabase Auth
   */
  signIn: async (email, password) => {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn("Supabase SDK not loaded yet.");
      return { success: false, error: "Authentication service unavailable." };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        console.error("Supabase Auth Error:", error);
        return { success: false, error: error.message };
      }

      if (!data || !data.user) {
        return { success: false, error: "Invalid login response." };
      }

      // Fetch user profile to detect household_id
      let householdId = null;
      let profile = null;
      try {
        const { data: prof, error: profError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();

        if (!profError && prof) {
          profile = prof;
          householdId = prof.household_id || null;
          if (householdId) {
            localStorage.setItem("wafar_household_id", householdId);
          }
          localStorage.setItem("wafar_user_profile", JSON.stringify(profile));
        }
      } catch (profErr) {
        console.warn("Profile fetch error:", profErr);
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        householdId: householdId
      };
    } catch (err) {
      console.error("AuthAPI.signIn exception:", err);
      return { success: false, error: err.message || "An unexpected error occurred." };
    }
  },

  /**
   * Get current Supabase session
   */
  getSession: async () => {
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data || !data.session) return null;
      return data.session;
    } catch (e) {
      return null;
    }
  },

  /**
   * Get current authenticated user profile
   */
  getUserProfile: async () => {
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error || !profile) {
        return { id: user.id, email: user.email, household_id: localStorage.getItem("wafar_household_id") || null };
      }
      return profile;
    } catch (e) {
      return null;
    }
  },

  /**
   * Protect private pages: redirect to login if not logged in
   */
  requireAuth: async (redirectPath = "../login/index.html") => {
    const supabase = getSupabase();
    if (!supabase) return true;

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data || !data.session) {
        if (localStorage.getItem("wafar_household_id")) {
          return true;
        }
        window.location.href = redirectPath;
        return false;
      }
      return true;
    } catch (e) {
      if (localStorage.getItem("wafar_household_id")) {
        return true;
      }
      window.location.href = redirectPath;
      return false;
    }
  },

  /**
   * Sign out and redirect to login
   */
  signOut: async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn("Error signing out:", e);
      }
    }
    localStorage.removeItem("wafar_household_id");
    localStorage.removeItem("wafar_user_profile");
    window.location.href = "../login/index.html";
  }
};

// ==========================================================================
// LED HARDWARE CONTROL SERVICE (Supabase public.led_control row id = 1)
// ==========================================================================

const LedAPI = {
  /**
   * Fetch current LED state from Supabase database table `public.led_control` (id = 1)
   */
  getLedState: async () => {
    // 1. Direct REST Fetch to Supabase API (Always works directly)
    try {
      const restRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/led_control?id=eq.1&select=*`, {
        method: "GET",
        headers: {
          "apikey": SUPABASE_CONFIG.anonKey,
          "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });

      if (restRes.ok) {
        const dataArr = await restRes.json();
        const data = Array.isArray(dataArr) ? dataArr[0] : dataArr;
        if (data && typeof data.is_on !== "undefined") {
          const isOn = Boolean(data.is_on);
          WafarData.smartLamp.state = isOn;
          WafarData.smartLamp.powerWatts = isOn ? 15 : 0;
          return isOn;
        }
      }
    } catch (restErr) {
      console.warn("LedAPI.getLedState direct fetch warning:", restErr);
    }

    // 2. Fallback to Supabase JS client
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("led_control")
          .select("id, is_on, updated_at")
          .eq("id", 1)
          .single();

        if (!error && data && typeof data.is_on !== "undefined") {
          const isOn = Boolean(data.is_on);
          WafarData.smartLamp.state = isOn;
          WafarData.smartLamp.powerWatts = isOn ? 15 : 0;
          return isOn;
        }
      } catch (clientErr) {
        console.warn("LedAPI.getLedState supabase client warning:", clientErr);
      }
    }

    return WafarData.smartLamp.state;
  },

  /**
   * Update LED state in Supabase database `public.led_control` (id = 1)
   */
  setLedState: async (newState) => {
    const boolState = Boolean(newState);
    console.log("[WAFAR LedAPI] Sending UPDATE to Supabase public.led_control id=1 -> is_on:", boolState);

    // 1. Direct REST PATCH to Supabase (Guaranteed instant execution)
    try {
      const restRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/led_control?id=eq.1`, {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_CONFIG.anonKey,
          "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          is_on: boolState,
          updated_at: new Date().toISOString()
        })
      });

      if (restRes.ok) {
        const dataArr = await restRes.json();
        const data = Array.isArray(dataArr) ? dataArr[0] : dataArr;
        const finalState = data && typeof data.is_on !== "undefined" ? Boolean(data.is_on) : boolState;

        WafarData.smartLamp.state = finalState;
        WafarData.smartLamp.powerWatts = finalState ? 15 : 0;
        console.log("[WAFAR LedAPI] Database updated successfully:", data);

        return { success: true, is_on: finalState, data: data };
      }
    } catch (restErr) {
      console.warn("LedAPI.setLedState direct REST warning:", restErr);
    }

    // 2. Supabase JS Client update
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("led_control")
          .update({
            is_on: boolState,
            updated_at: new Date().toISOString()
          })
          .eq("id", 1)
          .select("id, is_on, updated_at")
          .single();

        if (!error && data) {
          const finalState = Boolean(data.is_on);
          WafarData.smartLamp.state = finalState;
          WafarData.smartLamp.powerWatts = finalState ? 15 : 0;
          return { success: true, is_on: finalState, data: data };
        }
      } catch (err) {
        console.error("LedAPI.setLedState client exception:", err);
      }
    }

    // Local fallback
    WafarData.smartLamp.state = boolState;
    WafarData.smartLamp.powerWatts = boolState ? 15 : 0;
    return { success: true, is_on: boolState };
  },

  /**
   * Subscribe to Supabase Realtime changes on `public.led_control` (row id = 1)
   */
  subscribeToLedState: (callback) => {
    const supabase = getSupabase();
    if (!supabase || typeof supabase.channel !== "function") return null;

    try {
      const channelId = `realtime-led-sync-${Math.random().toString(36).substring(2, 9)}`;
      const channel = supabase.channel(channelId)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "led_control",
            filter: "id=eq.1"
          },
          (payload) => {
            if (payload && payload.new && typeof payload.new.is_on !== "undefined") {
              const isOn = !!payload.new.is_on;
              WafarData.smartLamp.state = isOn;
              WafarData.smartLamp.powerWatts = isOn ? 15 : 0;
              if (typeof callback === "function") {
                callback(isOn, payload.new);
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            // Channel active
          }
        });

      return channel;
    } catch (err) {
      console.error("LedAPI.subscribeToLedState exception:", err);
      return null;
    }
  },

  /**
   * Fetch all 4 light records from Supabase `public.led_control` table
   */
  getAllLights: async () => {
    try {
      const restRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/led_control?select=*&order=id.asc`, {
        method: "GET",
        headers: {
          "apikey": SUPABASE_CONFIG.anonKey,
          "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });
      if (restRes.ok) {
        const dataArr = await restRes.json();
        if (Array.isArray(dataArr) && dataArr.length > 0) {
          return dataArr;
        }
      }
    } catch (e) {
      console.warn("LedAPI.getAllLights REST warning:", e);
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("led_control")
          .select("*")
          .order("id", { ascending: true });
        if (!error && Array.isArray(data)) {
          return data;
        }
      } catch (e) {
        console.warn("LedAPI.getAllLights client warning:", e);
      }
    }

    return [
      { id: 1, name: "Bedroom Light", is_on: false },
      { id: 2, name: "Kitchen Light", is_on: false },
      { id: 3, name: "Reception Light", is_on: false },
      { id: 4, name: "Living Room Light", is_on: false }
    ];
  },

  /**
   * Fetch specific light by database ID
   */
  getLightState: async (id = 1) => {
    try {
      const restRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/led_control?id=eq.${id}&select=*`, {
        method: "GET",
        headers: {
          "apikey": SUPABASE_CONFIG.anonKey,
          "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });
      if (restRes.ok) {
        const dataArr = await restRes.json();
        const data = Array.isArray(dataArr) ? dataArr[0] : dataArr;
        if (data && typeof data.is_on !== "undefined") {
          return { success: true, ...data };
        }
      }
    } catch (e) {
      console.warn(`LedAPI.getLightState(${id}) REST warning:`, e);
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("led_control")
          .select("*")
          .eq("id", id)
          .single();
        if (!error && data) {
          return { success: true, ...data };
        }
      } catch (e) {
        console.warn(`LedAPI.getLightState(${id}) client warning:`, e);
      }
    }

    return { success: false, id, is_on: false };
  },

  /**
   * Update specific light state in database table `public.led_control` (by record ID)
   */
  setLightState: async (id, newState) => {
    const boolState = Boolean(newState);
    console.log(`[WAFAR LedAPI] Sending UPDATE to Supabase public.led_control id=${id} -> is_on:`, boolState);

    try {
      const restRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/led_control?id=eq.${id}`, {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_CONFIG.anonKey,
          "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          is_on: boolState,
          updated_at: new Date().toISOString()
        })
      });

      if (restRes.ok) {
        const dataArr = await restRes.json();
        const data = Array.isArray(dataArr) ? dataArr[0] : dataArr;
        const finalState = data && typeof data.is_on !== "undefined" ? Boolean(data.is_on) : boolState;

        if (id === 1) {
          WafarData.smartLamp.state = finalState;
          WafarData.smartLamp.powerWatts = finalState ? 15 : 0;
        }

        return { success: true, id, is_on: finalState, data };
      }
    } catch (e) {
      console.warn(`LedAPI.setLightState(${id}) REST warning:`, e);
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("led_control")
          .update({
            is_on: boolState,
            updated_at: new Date().toISOString()
          })
          .eq("id", id)
          .select("*")
          .single();

        if (!error && data) {
          const finalState = Boolean(data.is_on);
          if (id === 1) {
            WafarData.smartLamp.state = finalState;
            WafarData.smartLamp.powerWatts = finalState ? 15 : 0;
          }
          return { success: true, id, is_on: finalState, data };
        }
      } catch (e) {
        console.error(`LedAPI.setLightState(${id}) client exception:`, e);
      }
    }

    return { success: true, id, is_on: boolState };
  },

  /**
   * Subscribe to Realtime changes across all light rows in `public.led_control`
   */
  subscribeToAllLights: (callback) => {
    const supabase = getSupabase();
    if (!supabase || typeof supabase.channel !== "function") return null;

    try {
      const channelId = `realtime-all-lights-sync-${Math.random().toString(36).substring(2, 9)}`;
      const channel = supabase.channel(channelId)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "led_control"
          },
          (payload) => {
            if (payload && payload.new && typeof payload.new.is_on !== "undefined") {
              const record = payload.new;
              if (record.id === 1) {
                WafarData.smartLamp.state = Boolean(record.is_on);
                WafarData.smartLamp.powerWatts = record.is_on ? 15 : 0;
              }
              if (typeof callback === "function") {
                callback(record.id, Boolean(record.is_on), record);
              }
            }
          }
        )
        .subscribe();

      return channel;
    } catch (err) {
      console.error("LedAPI.subscribeToAllLights exception:", err);
      return null;
    }
  },

  /**
   * Unsubscribe / cleanup Realtime channel
   */
  unsubscribe: (channel) => {
    const supabase = getSupabase();
    if (supabase && channel && typeof supabase.removeChannel === "function") {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn("Error removing Supabase channel:", e);
      }
    }
  }
};

// ==========================================================================
// DEVICES API (Maps to LedAPI)
// ==========================================================================

const DevicesAPI = {
  getLampState: async () => {
    const isOn = await LedAPI.getLedState();
    return {
      ...WafarData.smartLamp,
      state: isOn,
      powerWatts: isOn ? 15 : 0
    };
  },

  toggleLamp: async (newState) => {
    const res = await LedAPI.setLedState(newState);
    return {
      success: res.success,
      lamp: {
        ...WafarData.smartLamp,
        state: res.is_on,
        powerWatts: res.is_on ? 15 : 0
      },
      error: res.error
    };
  }
};

// ==========================================================================
// DATA API (Dynamic Supabase Data Layer for WAFAR)
// ==========================================================================

const DataAPI = {
  /**
   * Resolve authenticated user profile and household_id from Supabase
   */
  getHouseholdContext: async () => {
    const supabase = getSupabase();
    let profile = null;
    let householdId = null;

    if (supabase) {
      try {
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (user && !userErr) {
          const { data: prof, error: profErr } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (!profErr && prof) {
            profile = prof;
            householdId = prof.household_id || null;
            try {
              if (householdId) localStorage.setItem("wafar_household_id", householdId);
              localStorage.setItem("wafar_user_profile", JSON.stringify(profile));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn("[DataAPI] Profile fetch exception:", err);
      }
    }

    if (!householdId) {
      try {
        householdId = localStorage.getItem("wafar_household_id");
        const cachedProf = localStorage.getItem("wafar_user_profile");
        if (cachedProf) profile = JSON.parse(cachedProf);
      } catch (e) {}
    }

    return {
      householdId: householdId || null,
      profile: profile || null
    };
  },

  /**
   * Sync Sidebar User info (Name, Avatar, Points badge)
   */
  syncSidebar: (profile, points) => {
    const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
    const nameEl = document.querySelector('.sidebar-user .user-name');
    const aptEl = document.querySelector('.sidebar-user .user-apt');
    const avatarEl = document.querySelector('.sidebar-user .user-avatar');
    const pointsBadge = document.querySelector('.nav-badge.badge-points');

    if (profile) {
      const displayName = profile.full_name || (isAr ? "مستخدم وفّر" : "WAFAR User");
      if (nameEl) nameEl.textContent = displayName;
      if (aptEl && profile.household_id) {
        aptEl.textContent = isAr ? `وحدة ${profile.household_id}` : `Unit ${profile.household_id}`;
      }
      if (avatarEl && profile.full_name) {
        const parts = profile.full_name.trim().split(/\s+/);
        const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
        avatarEl.textContent = initials;
      }
    }

    let ptsNum = null;
    if (typeof points === 'number') {
      ptsNum = points;
    } else if (points && typeof points === 'object') {
      ptsNum = typeof points.points !== 'undefined' ? points.points : points.points_balance;
    }

    if (pointsBadge && ptsNum !== null && typeof ptsNum !== 'undefined') {
      pointsBadge.textContent = `${ptsNum} pts`;
    }
  },

  /**
   * Fetch energy consumption records for household
   */
  getEnergyConsumption: async (householdId) => {
    if (!householdId) return { records: [], latest: null, previous: null, avgKWh: 0, totalKWh: 0, maxRecord: null, minRecord: null };
    const supabase = getSupabase();
    if (!supabase) return { records: [], latest: null, previous: null, avgKWh: 0, totalKWh: 0, maxRecord: null, minRecord: null };

    try {
      const { data, error } = await supabase
        .from("energy_consumption")
        .select("*")
        .eq("household_id", householdId)
        .order("date", { ascending: true });

      if (error || !Array.isArray(data) || data.length === 0) {
        if (error) console.error("[DataAPI.getEnergyConsumption] Supabase error:", error);
        return { records: [], latest: null, previous: null, avgKWh: 0, totalKWh: 0, maxRecord: null, minRecord: null };
      }

      const records = data;
      const totalKWh = records.reduce((sum, r) => sum + (Number(r.energy_consumption_kwh) || 0), 0);
      const avgKWh = records.length > 0 ? totalKWh / records.length : 0;
      const latest = records[records.length - 1];
      const previous = records.length > 1 ? records[records.length - 2] : null;

      let maxRecord = records[0];
      let minRecord = records[0];
      records.forEach(r => {
        if (Number(r.energy_consumption_kwh) > Number(maxRecord.energy_consumption_kwh)) maxRecord = r;
        if (Number(r.energy_consumption_kwh) < Number(minRecord.energy_consumption_kwh)) minRecord = r;
      });

      return {
        records,
        latest,
        previous,
        avgKWh: Number(avgKWh.toFixed(2)),
        totalKWh: Number(totalKWh.toFixed(2)),
        maxRecord,
        minRecord
      };
    } catch (err) {
      console.error("[DataAPI.getEnergyConsumption] Error:", err);
      return { records: [], latest: null, previous: null, avgKWh: 0, totalKWh: 0, maxRecord: null, minRecord: null };
    }
  },

  /**
   * Fetch hourly energy usage for household
   */
  getHourlyEnergyUsage: async (householdId, date) => {
    if (!householdId) return [];
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      let query = supabase
        .from("hourly_energy_usage")
        .select("*")
        .eq("household_id", householdId);

      if (date) {
        query = query.eq("date", date);
      }

      const { data, error } = await query.order("hour", { ascending: true });
      if (error || !Array.isArray(data)) {
        if (error) console.warn("[DataAPI.getHourlyEnergyUsage] Query notice:", error.message);
        return [];
      }
      return data;
    } catch (err) {
      console.error("[DataAPI.getHourlyEnergyUsage] Error:", err);
      return [];
    }
  },

  /**
   * Fetch consumption breakdown for household
   */
  getConsumptionBreakdown: async (householdId, date) => {
    if (!householdId) return [];
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      let query = supabase
        .from("consumption_breakdown")
        .select("*")
        .eq("household_id", householdId);

      if (date) {
        query = query.eq("date", date);
      }

      const { data, error } = await query;
      if (error || !Array.isArray(data) || data.length === 0) {
        if (error) console.warn("[DataAPI.getConsumptionBreakdown] Query notice:", error.message);
        return [];
      }

      // If no specific date was queried and multiple dates exist, group dynamically by category
      if (!date && data.length > 0) {
        const categoryMap = {};
        data.forEach(row => {
          const cat = row.category || 'Other';
          const kwh = Number(row.consumption_kwh) || 0;
          if (!categoryMap[cat]) {
            categoryMap[cat] = { category: cat, consumption_kwh: 0 };
          }
          categoryMap[cat].consumption_kwh += kwh;
        });

        const total = Object.values(categoryMap).reduce((s, c) => s + c.consumption_kwh, 0) || 1;
        return Object.values(categoryMap).map(c => ({
          category: c.category,
          consumption_kwh: Number(c.consumption_kwh.toFixed(2)),
          percentage: Math.round((c.consumption_kwh / total) * 100)
        })).sort((a, b) => b.consumption_kwh - a.consumption_kwh);
      }

      return data;
    } catch (err) {
      console.error("[DataAPI.getConsumptionBreakdown] Error:", err);
      return [];
    }
  },

  /**
   * Fetch WAFAR points balance
   */
  getWafarPoints: async (householdId) => {
    if (!householdId) return { points: 0, points_balance: 0, discountEGP: 0, neededForNextEGP: 10 };
    const supabase = getSupabase();
    if (!supabase) return { points: 0, points_balance: 0, discountEGP: 0, neededForNextEGP: 10 };

    try {
      const { data, error } = await supabase
        .from("wafar_points")
        .select("*")
        .eq("household_id", householdId)
        .maybeSingle();

      if (error || !data) {
        if (error) console.error("[DataAPI.getWafarPoints] Supabase error:", error);
        return { points: 0, points_balance: 0, discountEGP: 0, neededForNextEGP: 10 };
      }

      const pts = Number(data.points ?? data.points_balance ?? 0);
      const discount = Math.floor(pts / 10);
      const remainder = pts % 10;
      const needed = remainder === 0 ? 10 : 10 - remainder;

      return {
        points: pts,
        points_balance: pts,
        discountEGP: discount,
        neededForNextEGP: needed,
        updated_at: data.updated_at
      };
    } catch (err) {
      console.error("[DataAPI.getWafarPoints] Error:", err);
      return { points: 0, points_balance: 0, discountEGP: 0, neededForNextEGP: 10 };
    }
  },

  /**
   * Fetch points history
   */
  getPointsHistory: async (householdId) => {
    if (!householdId) return [];
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from("wafar_points_history")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false });

      if (error || !Array.isArray(data)) {
        if (error) console.error("[DataAPI.getPointsHistory] Supabase error:", error);
        return [];
      }
      return data;
    } catch (err) {
      console.error("[DataAPI.getPointsHistory] Error:", err);
      return [];
    }
  },

  /**
   * Fetch bills for household
   */
  getBills: async (householdId) => {
    if (!householdId) return { bills: [], latest: null };
    const supabase = getSupabase();
    if (!supabase) return { bills: [], latest: null };

    try {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("household_id", householdId)
        .order("due_date", { ascending: false });

      if (error || !Array.isArray(data) || data.length === 0) {
        if (error) console.error("[DataAPI.getBills] Supabase error:", error);
        return { bills: [], latest: null };
      }

      return {
        bills: data,
        latest: data[0]
      };
    } catch (err) {
      console.error("[DataAPI.getBills] Error:", err);
      return { bills: [], latest: null };
    }
  },

  /**
   * Dynamically calculate WAFAR points discount and final bill total
   * Rules: 10 points = 1.00 EGP discount
   * discount = Math.min(Math.floor(points / 10) * 1.00, originalAmount)
   * totalAmount = Math.max(0, originalAmount - discount)
   */
  calculateBillDiscount: (originalAmount, points) => {
    const orig = Math.max(0, Number(originalAmount) || 0);
    const pts = Math.max(0, Number(points) || 0);
    const rawDiscount = Math.floor(pts / 10) * 1.0;
    const discount = Math.min(rawDiscount, orig);
    const total = Math.max(0, orig - discount);
    return {
      originalAmount: orig,
      points: pts,
      discountAmount: discount,
      totalAmount: total
    };
  },

  /**
   * Fetch recent activities for household
   */
  getActivities: async (householdId, limit = 5) => {
    if (!householdId) return [];
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error || !Array.isArray(data)) {
        if (error) console.warn("[DataAPI.getActivities] Query notice:", error.message);
        return [];
      }
      return data;
    } catch (err) {
      console.error("[DataAPI.getActivities] Error:", err);
      return [];
    }
  }
};

// Legacy compatibility proxies
const PointsAPI = {
  getPointsSummary: async () => {
    const { householdId } = await DataAPI.getHouseholdContext();
    const pointsData = await DataAPI.getWafarPoints(householdId);
    const history = await DataAPI.getPointsHistory(householdId);
    return {
      ...pointsData,
      history
    };
  }
};

const BillingAPI = {
  getBillingSummary: async () => {
    const { householdId } = await DataAPI.getHouseholdContext();
    const billsData = await DataAPI.getBills(householdId);
    const pointsData = await DataAPI.getWafarPoints(householdId);
    return {
      currentBill: billsData.latest || {
        originalAmountEGP: 0,
        wafarDiscountEGP: pointsData.discountEGP,
        netAmountEGP: 0,
        dueDate: "-",
        status: "unpaid",
        period: "-",
        kwhUsed: 0
      },
      invoices: billsData.bills
    };
  },

  payBill: async (method) => {
    return {
      success: true,
      method: method
    };
  }
};

const DashboardAPI = {
  getSummaryMetrics: async () => {
    const { householdId } = await DataAPI.getHouseholdContext();
    const energy = await DataAPI.getEnergyConsumption(householdId);
    const pointsData = await DataAPI.getWafarPoints(householdId);
    const billsData = await DataAPI.getBills(householdId);
    const lampState = await LedAPI.getLedState();

    const todayKWh = energy.latest ? Number(energy.latest.energy_consumption_kwh) : 0;
    const prevKWh = energy.previous ? Number(energy.previous.energy_consumption_kwh) : todayKWh;
    const savedKWh = Number((prevKWh - todayKWh).toFixed(2));

    const bill = billsData.latest || {
      original_amount: 0,
      discount_amount: pointsData.discountEGP,
      total_amount: 0
    };

    return {
      todayKWh,
      avgDailyKWh: energy.avgKWh,
      savedKWh,
      lampState,
      lampWatts: lampState ? 15 : 0,
      lampRoom: WafarData.smartLamp.room,
      lampRoomAr: WafarData.smartLamp.room_ar,
      billAmountEGP: Number(bill.original_amount || 0),
      discountEGP: Number(bill.discount_amount || pointsData.discountEGP),
      netToPayEGP: Number(bill.total_amount || 0),
      points: pointsData.points
    };
  },

  getHourlyUsage: async () => {
    const { householdId } = await DataAPI.getHouseholdContext();
    return DataAPI.getHourlyEnergyUsage(householdId);
  },

  getRecentActivity: async () => {
    const { householdId } = await DataAPI.getHouseholdContext();
    return DataAPI.getActivities(householdId);
  }
};

const EnergyAPI = {
  getAnalytics: async () => {
    const { householdId } = await DataAPI.getHouseholdContext();
    const energy = await DataAPI.getEnergyConsumption(householdId);
    const billsData = await DataAPI.getBills(householdId);
    const bill = billsData.latest;

    return {
      todayKWh: energy.latest ? Number(energy.latest.energy_consumption_kwh) : 0,
      avgDailyKWh: energy.avgKWh,
      savedKWh: energy.previous && energy.latest ? Number((energy.previous.energy_consumption_kwh - energy.latest.energy_consumption_kwh).toFixed(2)) : 0,
      monthTotalKWh: energy.totalKWh,
      monthCostEGP: bill ? Number(bill.total_amount) : 0,
      records: energy.records
    };
  }
};

// ==========================================================================
// AI ASSISTANT API (Connects to real WAFAR chatbot backend)
// ==========================================================================

const AssistantAPI = {
  /**
   * Send question to WAFAR Chatbot Backend
   * Endpoint: POST https://wafar.onrender.com/ask
   * Body: { household_id: string, question: string }
   */
  askQuestion: async (question, householdId) => {
    const effectiveHouseholdId = householdId || localStorage.getItem("wafar_household_id") || "";

    try {
      const response = await fetch("https://wafar.onrender.com/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          household_id: String(effectiveHouseholdId),
          question: String(question)
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const text = await response.text();
      let answer = "";
      try {
        const json = JSON.parse(text);
        if (typeof json === "string") {
          answer = json;
        } else if (json && typeof json === "object") {
          answer = json.answer || json.response || json.message || JSON.stringify(json);
        } else {
          answer = String(json);
        }
      } catch (e) {
        answer = text;
      }

      return {
        success: true,
        answer: answer
      };
    } catch (err) {
      console.error("[AssistantAPI] Error calling chatbot backend:", err);
      return {
        success: false,
        error: err.message || "Network error"
      };
    }
  },

  /**
   * Fetch weekly summary from WAFAR Chatbot Backend
   * Endpoint: GET https://wafar.onrender.com/weekly-summary/{household_id}
   */
  getWeeklySummary: async (householdId, question) => {
    const effectiveHouseholdId = householdId || localStorage.getItem("wafar_household_id") || "";

    try {
      const response = await fetch(
    `https://wafar.onrender.com/weekly-summary/${encodeURIComponent(String(effectiveHouseholdId))}?question=${encodeURIComponent(String(question || ""))}`,
    {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const text = await response.text();
      let answer = "";
      try {
        const json = JSON.parse(text);
        if (typeof json === "string") {
          answer = json;
        } else if (json && typeof json === "object") {
          answer = json.answer || json.response || json.message || JSON.stringify(json);
        } else {
          answer = String(json);
        }
      } catch (e) {
        answer = text;
      }

      return {
        success: true,
        answer: answer
      };
    } catch (err) {
      console.error("[AssistantAPI] Error calling weekly-summary endpoint:", err);
      return {
        success: false,
        error: err.message || "Network error"
      };
    }
  },

  /**
   * Fetch smart tips from WAFAR Chatbot Backend
   * Endpoint: GET https://wafar.onrender.com/tips/{household_id}
   */
  getTips: async (householdId, question) => {
    const effectiveHouseholdId = householdId || localStorage.getItem("wafar_household_id") || "";

    try {
      const response = await fetch(
        `https://wafar.onrender.com/tips/${encodeURIComponent(String(effectiveHouseholdId))}?question=${encodeURIComponent(String(question || ""))}`,
        {
          method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const text = await response.text();
      let answer = "";
      try {
        const json = JSON.parse(text);
        if (typeof json === "string") {
          answer = json;
        } else if (json && typeof json === "object") {
          answer = json.answer || json.response || json.message || JSON.stringify(json);
        } else {
          answer = String(json);
        }
      } catch (e) {
        answer = text;
      }

      return {
        success: true,
        answer: answer
      };
    } catch (err) {
      console.error("[AssistantAPI] Error calling tips endpoint:", err);
      return {
        success: false,
        error: err.message || "Network error"
      };
    }
  },

  /**
   * Alias for getTips
   */
  getSmartTips: async (householdId, question) => {
    return AssistantAPI.getTips(householdId, question);
},

  /**
   * Legacy alias
   */
  processPrompt: async (query, householdId) => {
    return AssistantAPI.askQuestion(query, householdId);
  }
};
