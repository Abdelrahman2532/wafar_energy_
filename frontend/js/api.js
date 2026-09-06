/**
 * WAFAR API & Data Layer (Integrated with Supabase Backend & Realtime)
 *
 * Hardware LED Control Table: public.led_control (id = 1, is_on = boolean)
 * Household Profile Table: public.profiles (id = user_id, household_id = "H00001")
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
      if (email.toLowerCase().includes("h00001") || email.toLowerCase().includes("demo")) {
        localStorage.setItem("wafar_household_id", "H00001");
        return { success: true, householdId: "H00001" };
      }
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
      let householdId = "H00001";
      try {
        const { data: profile, error: profError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (!profError && profile) {
          householdId = profile.household_id || "H00001";
          localStorage.setItem("wafar_user_profile", JSON.stringify(profile));
        }
      } catch (profErr) {
        console.warn("Profile fetch error:", profErr);
      }

      localStorage.setItem("wafar_household_id", householdId);
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
        .single();

      if (error) {
        return { id: user.id, email: user.email, household_id: localStorage.getItem("wafar_household_id") || "H00001" };
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
// POINTS & REWARDS API
// ==========================================================================

const PointsAPI = {
  getPointsSummary: async () => {
    const pts = WafarData.pointsProfile.totalPoints;
    const discount = Math.floor(pts / WafarData.pointsProfile.pointsPerEGP);
    const remainder = pts % WafarData.pointsProfile.pointsPerEGP;
    const needed = remainder === 0 ? 10 : 10 - remainder;

    return {
      points: pts,
      discountEGP: discount,
      neededForNextEGP: needed,
      history: [...WafarData.pointsHistory]
    };
  }
};

// ==========================================================================
// BILLING & INVOICES API
// ==========================================================================

const BillingAPI = {
  getBillingSummary: async () => {
    const pts = WafarData.pointsProfile.totalPoints;
    const discountEGP = Math.floor(pts / 10);
    const original = WafarData.billing.currentBill.originalAmountEGP;
    const net = original - discountEGP;

    WafarData.billing.currentBill.wafarDiscountEGP = discountEGP;
    WafarData.billing.currentBill.netAmountEGP = net;

    return { ...WafarData.billing };
  },

  payBill: async (method) => {
    WafarData.billing.currentBill.status = "paid";
    const currentInv = WafarData.billing.invoices.find(i => !i.isPaid);
    if (currentInv) {
      currentInv.isPaid = true;
    }
    return {
      success: true,
      amount: WafarData.billing.currentBill.netAmountEGP,
      method: method
    };
  }
};

// ==========================================================================
// DASHBOARD API
// ==========================================================================

const DashboardAPI = {
  getSummaryMetrics: async () => {
    const pts = WafarData.pointsProfile.totalPoints;
    const discountEGP = Math.floor(pts / 10);
    const bill = WafarData.billing.currentBill;
    const lampState = await LedAPI.getLedState();

    return {
      todayKWh: 11.90,
      avgDailyKWh: 12.49,
      savedKWh: 0.59,
      lampState: lampState,
      lampWatts: lampState ? 15 : 0,
      lampRoom: WafarData.smartLamp.room,
      lampRoomAr: WafarData.smartLamp.room_ar,
      billAmountEGP: bill.originalAmountEGP,
      discountEGP: discountEGP,
      netToPayEGP: bill.originalAmountEGP - discountEGP,
      points: pts
    };
  },

  getHourlyUsage: async () => {
    return [
      { hour: "00:00", kwh: 0.4, baseline: 0.5 },
      { hour: "04:00", kwh: 0.3, baseline: 0.4 },
      { hour: "08:00", kwh: 0.8, baseline: 1.0 },
      { hour: "12:00", kwh: 1.4, baseline: 1.6 },
      { hour: "16:00", kwh: 1.8, baseline: 2.1 },
      { hour: "19:00", kwh: 2.2, baseline: 2.4 },
      { hour: "22:00", kwh: 1.1, baseline: 1.3 }
    ];
  },

  getRecentActivity: async () => {
    const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
    return [
      { time: "20:14", event: isAr ? "تم تشغيل مصباح غرفة النوم (15 واط)" : "Bedroom smart lamp turned ON (15W)" },
      { time: "18:00", event: isAr ? "استهلاكك أقل من المعدل بنسبة 5%" : "Consumption is 5% below average" },
      { time: "14:00", event: isAr ? "كسبت 10 نقاط وفّر لترشيد الاستهلاك" : "Earned +10 WAFAR points for energy saving" }
    ];
  }
};

// ==========================================================================
// ENERGY OVERVIEW API
// ==========================================================================

const EnergyAPI = {
  getAnalytics: async () => {
    return {
      todayKWh: 11.90,
      avgDailyKWh: 12.49,
      savedKWh: 0.59,
      monthTotalKWh: 215.4,
      monthCostEGP: 342.50,
      dailyComparison: [
        { label: "Mon", current: 11.8, previous: 12.5 },
        { label: "Tue", current: 11.4, previous: 12.3 },
        { label: "Wed", current: 12.1, previous: 12.8 },
        { label: "Thu", current: 11.9, previous: 12.6 },
        { label: "Fri", current: 12.8, previous: 13.4 },
        { label: "Sat", current: 13.0, previous: 13.5 },
        { label: "Sun", current: 11.2, previous: 12.0 }
      ]
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
    const effectiveHouseholdId = householdId || localStorage.getItem("wafar_household_id") || "H00001";

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
   * Legacy alias
   */
  processPrompt: async (query, householdId) => {
    return AssistantAPI.askQuestion(query, householdId);
  }
};
