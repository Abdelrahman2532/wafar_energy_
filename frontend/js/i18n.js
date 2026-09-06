/**
 * WAFAR Internationalization & Translation Engine (Natural Egyptian Arabic & English)
 */

const translations = {
  en: {
    // Brand & Header
    brand_name: "WAFAR",
    tagline: "Smart Energy. Better Tomorrow.",
    grid_status: "Smart energy system active",
    user_name: "Abdalla M.",
    user_location: "Apartment #4",
    welcome_title: "Welcome back, Abdalla",
    welcome_sub: "Here's your energy overview for today",

    // Navigation
    nav_main: "Main Menu",
    nav_dashboard: "Dashboard",
    nav_apartment: "Apartment & Lamp",
    nav_devices: "Apartment & Lamp",
    nav_energy: "Energy",
    nav_points: "WAFAR Points",
    nav_billing: "Billing",
    nav_assistant: "AI Assistant",
    nav_logout: "Sign Out",

    // Login Page
    login_welcome: "Welcome to WAFAR",
    login_subtitle: "Smart energy monitoring and bill savings for your home",
    login_tab_signin: "Sign In",
    login_tab_signup: "Create Account",
    login_email: "Email Address",
    login_password: "Password",
    login_forgot: "Forgot Password?",
    login_remember: "Remember this device",
    login_demo: "Demo Mode",
    login_btn: "Sign In to Dashboard",
    login_authenticating: "Signing in...",
    login_footer: "Protected by WAFAR Intelligent Eco Shield",

    // Sidebar Savings
    saving_title: "You're Saving!",
    saving_subtitle: "Excellent performance this month",
    saving_month_title: "This Month Savings",
    saving_month_sub: "Saving this month",
    view_energy_details: "View Energy Details",

    // Dashboard KPIs
    kpi_today_title: "Today's Consumption",
    kpi_today_usage: "Today's Consumption",
    saved_today: "Saved Today",
    kpi_avg_title: "Average Daily",
    kpi_avg_usage: "Average Daily",
    target_kwh: "Target: ≤ 13.0 kWh",
    kpi_bill_title: "Current Bill",
    kpi_current_bill: "Current Bill",
    wafar_discount: "↓ 8.00 EGP WAFAR Discount",
    kpi_points_title: "WAFAR Points",
    kpi_points_balance: "WAFAR Points",
    points_discount_badge: "↑ 8 EGP discount",

    // Dashboard Charts & Widgets
    chart_title: "Today's Hourly Usage",
    chart_sub: "Real-time consumption in kWh vs baseline",
    chart_view_24: "24h View",
    chart_view_12: "12h View",
    chart_view_8: "8h View",
    legend_actual: "Actual (kWh)",
    legend_average: "Average",
    lamp_title: "Bedroom Lamp",
    lamp_more: "Apartment & Lamp >",
    lamp_device_name: "Bedroom Smart Lamp",
    power_draw: "Power Draw:",
    lamp_btn_off: "Turn Off",
    lamp_btn_on: "Turn On",
    breakdown_title: "Consumption Breakdown",
    filter_today: "Today",
    filter_yesterday: "Yesterday",
    filter_this_week: "This Week",
    cat_lighting: "Lighting",
    cat_appliances: "Appliances",
    cat_cooling: "Cooling",
    cat_others: "Others",
    monthly_title: "Monthly Comparison",
    filter_this_month: "This Month",
    filter_last_6_months: "Last 6 Months",
    activity_title: "Recent Activity",
    view_all: "View All",
    act_lamp: "Bedroom smart lamp turned ON (15W)",
    act_avg: "Consumption is 5% below average",
    act_points: "Earned +10 WAFAR points for energy saving",

    // Dashboard Bottom Insights
    insight_ai_title: "AI Insight",
    insight_ai_desc: "Your consumption is <strong>8% lower</strong> than last week. Keep it up!",
    view_details: "View Details",
    insight_saving_title: "Best Saving Time",
    insight_saving_desc: "Your lowest usage window",
    insight_device_title: "Top Consuming Device",
    device_ac: "Air Conditioner",
    device_fridge: "Refrigerator",
    device_heater: "Water Heater",
    of_total: "of total usage",
    insight_bill_title: "Projected Bill",
    vs_last_month: "vs last month",

    // Apartment Layout Page
    apartment_layout_title: "Apartment Layout",
    apartment_layout_sub_3d: "Interactive 3D view of your apartment and connected smart devices.",
    apartment_layout_sub_2d: "Interactive house floor plan and connected smart devices.",
    apartment_info_header: "Apartment #4 (2 Rooms + Reception)",
    view_2d: "2D View",
    view_3d: "3D View",
    connected_device_btn: "Connected Device",
    active_device_btn: "Active Device",
    edit_layout_btn: "Edit Layout",
    smart_devices_title: "Smart Devices",
    filter_all_devices: "All Devices",
    filter_active_only: "Active Only",
    filter_off_only: "Off Only",
    room_bedroom: "Bedroom",
    room_living: "Living Room",
    room_reception: "Reception",
    room_kitchen: "Kitchen",
    room_bathroom: "Bathroom",
    dev_bedroom_lamp: "Bedroom Smart Lamp",
    dev_reception_lamp: "Reception Lamp",
    dev_kitchen_light: "Kitchen Light",
    dev_bathroom_light: "Bathroom Light",
    status_running: "Running",
    status_last_seen: "Last seen",
    apartment_overview_title: "Apartment Overview",
    stat_connected: "Connected",
    stat_active: "Active",
    stat_total_power: "Total Power",
    stat_today_usage: "Today's Usage",
    controls_rotate: "Rotate",
    controls_zoom_in: "Zoom In",
    controls_zoom_out: "Zoom Out",
    controls_reset: "Reset",
    time_day: "Day",
    time_night: "Night",
    bottom_hint_3d: "Drag to rotate • Scroll to zoom • Click on a room or device to view more details and control options.",
    bottom_hint_2d: "Click on a room or device to view more details and control options.",
    esp_network_status: "ESP32 Network: Online",

    // Energy Page
    energy_overview_title: "Energy Overview",
    energy_overview_sub: "Track your consumption and save more energy.",
    btn_period_week: "Week",
    btn_period_month: "Month",
    kpi_energy_today: "TODAY'S CONSUMPTION",
    kpi_energy_saved_badge: "↓ 0.59 kWh saved vs yesterday",
    kpi_energy_total_month: "TOTAL ENERGY (THIS MONTH)",
    kpi_energy_cycle: "August Cycle",
    kpi_energy_cost: "TOTAL COST (THIS MONTH)",
    kpi_energy_cost_discount: "-8.00 EGP discount ready",
    trend_chart_title: "Daily Energy Trend (kWh)",
    filter_past_7: "Past 7 Days",
    filter_past_14: "Past 14 Days",
    filter_past_30: "Past 30 Days",
    stat_daily_avg: "Daily Average",
    stat_highest_day: "Highest Day",
    stat_lowest_day: "Lowest Day",
    stat_vs_last_week: "vs Last Week",
    energy_log_title: "Energy Log",
    th_date: "Date",
    th_usage_kwh: "Usage (kWh)",
    th_diff: "Difference",
    top_devices_title: "Top Consuming Devices",
    ai_insight_header: "AI Energy Insight",
    ai_insight_energy_desc: "You can save up to <strong>2.4 kWh</strong> daily by optimizing your kitchen usage between <strong>12:00 - 3:00 PM</strong>.",
    btn_ai_recom: "View AI Recommendations",

    // Points Page
    points_page_title: "WAFAR Points",
    points_page_sub: "Earn points by saving energy and get exclusive rewards.",
    btn_how_earn: "How to earn points",
    badge_current_balance: "CURRENT BALANCE",
    points_label: "WAFAR Points",
    label_discount_value: "Discount Value",
    btn_pay_my_bill: "Pay My Bill",
    subtext_pay_points: "Use your points to get amazing discounts",
    points_history_header: "Points History",
    badge_points_rule: "10 pts = 1 EGP",
    act_bed_lamp_off: "Bedroom lamp turned off during daylight",
    time_today_1030: "Today • 10:30 AM",
    act_elec_lower: "Electricity consumption lower than average",
    time_yest_0815: "Yesterday • 08:15 PM",
    act_peak_saving: "Peak hours energy saving",
    time_aug26_0945: "Aug 26 • 09:45 PM",
    btn_view_all_history: "View All History",

    // Billing Page
    billing_page_title: "Billing",
    billing_page_sub: "Manage your bill, choose payment method and view invoices history.",
    bill_overview_title: "Bill Overview",
    bill_due_date_label: "Due: Sep 15, 2026",
    bill_original_amount: "Bill Original Amount",
    discount_applied: "Discount Applied",
    total_amount_label: "Total Amount",
    select_payment_method: "Select Payment Method",
    method_vodafone_cash: "Vodafone Cash",
    method_instapay: "Instapay",
    sub_instapay: "IPA / Bank Transfer",
    method_card: "Credit / Debit Card",
    sub_card: "Visa / Mastercard",
    points_discount_note_title: "10 WAFAR Points = 1 EGP discount",
    points_discount_note_sub: "Automatically deducted from your electricity bill.",
    invoices_history_title: "Invoices History",
    th_invoice_no: "Invoice No.",
    th_month: "Month",
    th_consumption: "Consumption",
    th_net_amount: "Net Amount",
    th_status: "Status",
    status_due_soon: "Due Soon",
    status_paid: "Paid",
    btn_view_all_invoices: "View All Invoices",

    // AI Assistant Page
    assistant_page_title: "AI Assistant",
    btn_clear: "Clear Thread",
    ai_online: "Online",
    ai_hero_title: "WAFAR AI Assistant",
    ai_hero_sub: "Powered by WAFAR AI to help you manage and save energy smarter.",
    badge_247_support: "AI Support",
    badge_95_accuracy: "Accuracy",
    badge_secure_data: "Your Data",
    badge_smart_sugg: "Suggestions",
    metric_energy_saved: "Energy Saved",
    sub_vs_last_month: "vs last month",
    metric_efficiency_score: "Efficiency Score",
    sub_excellent: "Excellent",
    metric_wafar_points: "WAFAR Points",
    sub_available: "Available",
    chat_header_sub: "Always here to help you save energy.",
    badge_ai_copilot: "WAFAR AI Copilot",
    chat_welcome_hello: "Hello Abdalla!",
    chat_welcome_intro: "I am your WAFAR AI Energy Assistant.",
    chat_welcome_ask: "Ask me anything about your power usage, saving tips, or your smart lamp.",
    chat_just_now: "Just now",
    label_suggested_for_you: "Suggested for you",
    prompt_save_energy: "How can I save more energy?",
    prompt_daily_avg: "What is my daily average usage?",
    prompt_best_time: "Best time to use appliances?",
    prompt_more_suggestions: "More suggestions",
    input_placeholder: "Type your message...",
    btn_send: "Send",

    // Common
    status_on: "ON",
    status_off: "OFF",
    unit_w: "W",
    unit_kwh: "kWh",
    currency_egp: "EGP"
  },

  ar: {
    // Brand & Header
    brand_name: "وفّر",
    tagline: "طاقة ذكية. لغدٍ أفضل.",
    grid_status: "نظام الطاقة الذكي نشط",
    user_name: "عبدالله م.",
    user_location: "شقة #4",
    welcome_title: "مرحباً بعودتك، عبد الله",
    welcome_sub: "إليك ملخص استهلاك الطاقة لمنزلك اليوم",

    // Navigation
    nav_main: "القائمة الرئيسية",
    nav_dashboard: "لوحة التحكم",
    nav_apartment: "الشقة والمصباح",
    nav_devices: "الشقة والمصباح",
    nav_energy: "استهلاك الطاقة",
    nav_points: "نقاط وفّـر",
    nav_billing: "الفواتير والدفع",
    nav_assistant: "المساعد الذكي",
    nav_logout: "تسجيل الخروج",

    // Login Page
    login_welcome: "مرحباً بك في وفّر",
    login_subtitle: "راقب استهلاك الكهرباء في بيتك ووفّر في فاتورتك",
    login_tab_signin: "تسجيل الدخول",
    login_tab_signup: "حساب جديد",
    login_email: "البريد الإلكتروني",
    login_password: "كلمة المرور",
    login_forgot: "نسيت كلمة المرور؟",
    login_remember: "تذكر هذا الجهاز",
    login_demo: "نسخة تجريبية",
    login_btn: "الدخول للوحة التحكم",
    login_authenticating: "جاري الدخول...",
    login_footer: "محمي بنظام وفّر لترشيد الطاقة",

    // Sidebar Savings
    saving_title: "أنت توفّر الآن!",
    saving_subtitle: "أداء ممتاز وترشيد متميز هذا الشهر",
    saving_month_title: "توفير هذا الشهر",
    saving_month_sub: "نسبة التوفير الحالية",
    view_energy_details: "عرض تفاصيل الطاقة",

    // Dashboard KPIs
    kpi_today_title: "استهلاك اليوم",
    kpi_today_usage: "استهلاك اليوم",
    saved_today: "وفرت اليوم",
    kpi_avg_title: "المعدل اليومي",
    kpi_avg_usage: "المعدل اليومي",
    target_kwh: "الهدف: ≤ 13.0 ك.و.س",
    kpi_bill_title: "الفاتورة الحالية",
    kpi_current_bill: "الفاتورة الحالية",
    wafar_discount: "↓ خصم وفّر 8.00 ج.م",
    kpi_points_title: "نقاط وفّـر",
    kpi_points_balance: "نقاط وفّـر",
    points_discount_badge: "↑ خصم 8 جنيه",

    // Dashboard Charts & Widgets
    chart_title: "الاستهلاك بالساعة اليوم",
    chart_sub: "الاستهلاك الفعلي بالكيلوواط/س مقارنة بالمعدل",
    chart_view_24: "عرض 24 ساعة",
    chart_view_12: "عرض 12 ساعة",
    chart_view_8: "عرض 8 ساعات",
    legend_actual: "الفعلي (kWh)",
    legend_average: "المعدل الطبيعي",
    lamp_title: "مصباح غرفة النوم",
    lamp_more: "الشقة والمصابيح >",
    lamp_device_name: "مصباح غرفة النوم الذكي",
    power_draw: "سحب الطاقة:",
    lamp_btn_off: "إطفاء المصباح",
    lamp_btn_on: "تشغيل المصباح",
    breakdown_title: "تفاصيل الاستهلاك",
    filter_today: "اليوم",
    filter_yesterday: "أمس",
    filter_this_week: "هذا الأسبوع",
    cat_lighting: "الإضاءة",
    cat_appliances: "الأجهزة المنزلية",
    cat_cooling: "التكييف والتبريد",
    cat_others: "أخرى",
    monthly_title: "مقارنة الأشهر",
    filter_this_month: "هذا الشهر",
    filter_last_6_months: "آخر 6 أشهر",
    activity_title: "النشاط الأخير",
    view_all: "عرض الكل",
    act_lamp: "تم تشغيل مصباح غرفة النوم الذكي (15 واط)",
    act_avg: "الاستهلاك أقل بـ 5% من المعدل",
    act_points: "حصلت على +10 نقاط وفّر لترشيد الاستهلاك",

    // Dashboard Bottom Insights
    insight_ai_title: "رؤية الذكاء الاصطناعي",
    insight_ai_desc: "استهلاكك أقل بنسبة <strong>8%</strong> مقارنة بالأسبوع الماضي. استمر!",
    view_details: "عرض التفاصيل",
    insight_saving_title: "أفضل وقت للتوفير",
    insight_saving_desc: "نافذة الاستهلاك الأقل تكلفة",
    insight_device_title: "الجهاز الأكثر استهلاكاً",
    device_ac: "مكيف الهواء",
    device_fridge: "الثلاجة",
    device_heater: "سخان المياه",
    of_total: "من إجمالي الاستهلاك",
    insight_bill_title: "الفاتورة المتوقعة",
    vs_last_month: "مقارنة بالشهر الماضي",

    // Apartment Layout Page
    apartment_layout_title: "مخطط الشقة والأجهزة",
    apartment_layout_sub_3d: "عرض ثلاثي الأبعاد 3D تفاعلي للشقة والأجهزة الذكية المتصلة.",
    apartment_layout_sub_2d: "المخطط المعماري 2D وتوزيع الأجهزة الذكية المتصلة.",
    apartment_info_header: "شقة رقم #4 (غرفتين + ريسبشن)",
    view_2d: "عرض 2D",
    view_3d: "عرض 3D",
    connected_device_btn: "جهاز متصل",
    active_device_btn: "جهاز نشط",
    edit_layout_btn: "تعديل المخطط",
    smart_devices_title: "الأجهزة الذكية",
    filter_all_devices: "جميع الأجهزة",
    filter_active_only: "النشطة فقط",
    filter_off_only: "المغلقة فقط",
    room_bedroom: "غرفة النوم",
    room_living: "غرفة المعيشة",
    room_reception: "الريسبشن",
    room_kitchen: "المطبخ",
    room_bathroom: "الحمام",
    dev_bedroom_lamp: "مصباح غرفة النوم الذكي",
    dev_reception_lamp: "مصباح الريسبشن",
    dev_kitchen_light: "إضاءة المطبخ",
    dev_bathroom_light: "إضاءة الحمام",
    status_running: "شغّال من",
    status_last_seen: "آخر ظهور",
    apartment_overview_title: "نظرة عامة على الشقة",
    stat_connected: "أجهزة متصلة",
    stat_active: "أجهزة نشطة",
    stat_total_power: "إجمالي السحب",
    stat_today_usage: "استهلاك اليوم",
    controls_rotate: "تدوير",
    controls_zoom_in: "تكبير",
    controls_zoom_out: "تصغير",
    controls_reset: "إعادة تعيين",
    time_day: "نهاري",
    time_night: "ليلي",
    bottom_hint_3d: "اسحب للتدوير • مرر للتكبير • اضغط على أي غرفة أو جهاز لعرض التفاصيل وخيارات التحكم.",
    bottom_hint_2d: "اضغط على أي غرفة أو جهاز لعرض التفاصيل وخيارات التحكم المباشرة.",
    esp_network_status: "شبكة ESP32: متصلة",

    // Energy Page
    energy_overview_title: "نظرة عامة على الطاقة",
    energy_overview_sub: "تتبع استهلاكك ووفّر المزيد من الطاقة والمال.",
    btn_period_week: "أسبوع",
    btn_period_month: "شهر",
    kpi_energy_today: "استهلاك اليوم",
    kpi_energy_saved_badge: "↓ وفرت 0.59 ك.و.س مقارنة بأمس",
    kpi_energy_total_month: "إجمالي الطاقة (هذا الشهر)",
    kpi_energy_cycle: "دورة شهر أغسطس",
    kpi_energy_cost: "التكلفة الإجمالية (هذا الشهر)",
    kpi_energy_cost_discount: "خصم متاح -8.00 ج.م",
    trend_chart_title: "معدل استهلاك الطاقة اليومي (ك.و.س)",
    filter_past_7: "آخر 7 أيام",
    filter_past_14: "آخر 14 يوم",
    filter_past_30: "آخر 30 يوم",
    stat_daily_avg: "المعدل اليومي",
    stat_highest_day: "اليوم الأعلى",
    stat_lowest_day: "اليوم الأقل",
    stat_vs_last_week: "مقارنة بالأسبوع الماضي",
    energy_log_title: "سجل استهلاك الطاقة",
    th_date: "التاريخ",
    th_usage_kwh: "الاستهلاك (ك.و.س)",
    th_diff: "الفارق",
    top_devices_title: "الأجهزة الأكثر استهلاكاً",
    ai_insight_header: "رؤية الذكاء الاصطناعي",
    ai_insight_energy_desc: "يمكنك توفير حتى <strong>2.4 ك.و.س</strong> يومياً بترشيد استهلاك المطبخ بين <strong>12:00 - 3:00 م</strong>.",
    btn_ai_recom: "عرض توصيات الذكاء الاصطناعي",

    // Points Page
    points_page_title: "نقاط وفّـر",
    points_page_sub: "اجمع النقاط بترشيد استهلاك الطاقة واحصل على خصومات حصرية.",
    btn_how_earn: "كيف تجمع النقاط",
    badge_current_balance: "الرصيد الحالي",
    points_label: "نقاط وفّر",
    label_discount_value: "قيمة الخصم",
    btn_pay_my_bill: "ادفع فاتورتي",
    subtext_pay_points: "استخدم نقاطك للحصول على خصومات رائعة",
    points_history_header: "سجل تجميع النقاط",
    badge_points_rule: "10 نقاط = 1 جنيه",
    act_bed_lamp_off: "إطفاء مصباح غرفة النوم خلال ضوء النهار",
    time_today_1030: "اليوم • 10:30 ص",
    act_elec_lower: "استهلاك الكهرباء أقل من المعدل الطبيعي",
    time_yest_0815: "أمس • 08:15 م",
    act_peak_saving: "ترشيد استهلاك الطاقة في ساعات الذروة",
    time_aug26_0945: "26 أغسطس • 09:45 م",
    btn_view_all_history: "عرض كل السجل",

    // Billing Page
    billing_page_title: "الفواتير والدفع",
    billing_page_sub: "إدارة فاتورتك، واختيار طريقة الدفع وعرض سجل الفواتير السابقة.",
    bill_overview_title: "ملخص الفاتورة",
    bill_due_date_label: "تاريخ الاستحقاق: 15 سبتمبر 2026",
    bill_original_amount: "قيمة الفاتورة الأصلية",
    discount_applied: "الخصم المطبق",
    total_amount_label: "المبلغ الإجمالي",
    select_payment_method: "اختر طريقة الدفع",
    method_vodafone_cash: "فودافون كاش",
    method_instapay: "إنستاباي",
    sub_instapay: "تحويل بنكي / حساب لحظي",
    method_card: "بطاقة ائتمان / خصم مباشر",
    sub_card: "فيزا / ماستركارد",
    points_discount_note_title: "10 نقاط وفّر = 1 جنيه خصم",
    points_discount_note_sub: "تُخصم تلقائياً من فاتورة الكهرباء الشهرية.",
    invoices_history_title: "سجل الفواتير السابقة",
    th_invoice_no: "رقم الفاتورة",
    th_month: "الشهر",
    th_consumption: "الاستهلاك",
    th_net_amount: "المبلغ الصافي",
    th_status: "الحالة",
    status_due_soon: "مستحقة قريباً",
    status_paid: "تم الدفع",
    btn_view_all_invoices: "عرض كل الفواتير",

    // AI Assistant Page
    assistant_page_title: "المساعد الذكي",
    btn_clear: "مسح المحادثة",
    ai_online: "متصل الآن",
    ai_hero_title: "مساعد وفّـر الذكي",
    ai_hero_sub: "مدعوم بالذكاء الاصطناعي لمساعدتك في إدارة وترشيد استهلاك الطاقة بذكاء.",
    badge_247_support: "دعم 24/7",
    badge_95_accuracy: "دقة 95%",
    badge_secure_data: "بياناتك آمنة",
    badge_smart_sugg: "اقتراحات ذكية",
    metric_energy_saved: "توفير الطاقة",
    sub_vs_last_month: "مقارنة بالشهر الماضي",
    metric_efficiency_score: "مؤشر الكفاءة",
    sub_excellent: "ممتاز",
    metric_wafar_points: "نقاط وفّـر",
    sub_available: "متاحة للاستخدام",
    chat_header_sub: "جاهز دائماً لمساعدتك في توفير الكهرباء وخفض الفاتورة.",
    badge_ai_copilot: "مساعد وفّر الذكي",
    chat_welcome_hello: "مرحباً يا عبد الله!",
    chat_welcome_intro: "أنا مساعد وفّر الذكي لترشيد الطاقة.",
    chat_welcome_ask: "اسألني عن أي تفاصيل تخص استهلاكك للكهرباء، نصائح التوفير، أو التحكم في المصباح الذكي.",
    chat_just_now: "الآن",
    label_suggested_for_you: "مقترح لك",
    prompt_save_energy: "كيف يمكنني توفير المزيد من الطاقة؟",
    prompt_daily_avg: "ما هو معدل استهلاكي اليومي؟",
    prompt_best_time: "ما أفضل أوقات تشغيل الأجهزة؟",
    prompt_more_suggestions: "اقتراحات إضافية",
    input_placeholder: "اكتب رسالتك أو استفسارك هنا...",
    btn_send: "إرسال",

    // Common
    status_on: "شغّال",
    status_off: "مُغلق",
    unit_w: "واط",
    unit_kwh: "ك.و.س",
    currency_egp: "ج.م"
  }
};

const i18n = {
  currentLang: localStorage.getItem('wafar_lang') || 'en',

  init: function () {
    const saved = localStorage.getItem('wafar_lang') || 'en';
    this.setLanguage(saved);
  },

  setLanguage: function (lang) {
    if (!translations[lang]) lang = 'en';
    this.currentLang = lang;
    localStorage.setItem('wafar_lang', lang);

    const isRtl = lang === 'ar';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');

    this.translateDOM();

    // Update Language Toggle Buttons across header or login
    const langBtn = document.getElementById('langSwitchBtn');
    if (langBtn) {
      const currentLangLabel = document.getElementById('currentLangLabel');
      if (currentLangLabel) {
        currentLangLabel.textContent = isRtl ? 'English' : 'عربي';
      } else {
        langBtn.textContent = isRtl ? 'English' : 'عربي';
      }
      langBtn.title = isRtl ? 'Switch to English' : 'التحويل للغة العربية';
    }

    // Fire custom event
    window.dispatchEvent(new CustomEvent('wafar:langchange', { detail: { lang, isRtl } }));
  },

  toggleLanguage: function () {
    const nextLang = this.currentLang === 'en' ? 'ar' : 'en';
    this.setLanguage(nextLang);
  },

  t: function (key) {
    if (!key) return '';
    return (translations[this.currentLang] && translations[this.currentLang][key]) ||
           (translations['en'] && translations['en'][key]) ||
           key;
  },

  getLang: function () {
    return this.currentLang;
  },

  isRtl: function () {
    return this.currentLang === 'ar';
  },

  translateDOM: function () {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (translation !== undefined) {
        if (translation.includes('<') && translation.includes('>')) {
          el.innerHTML = translation;
        } else {
          el.textContent = translation;
        }
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);
      if (translation !== undefined) {
        el.setAttribute('placeholder', translation);
      }
    });
  }
};

// Auto initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  i18n.init();
});
