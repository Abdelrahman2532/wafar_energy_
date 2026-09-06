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

    function clearChatHistory() {
      const viewport = document.getElementById('chatViewport');
      const isAr = typeof i18n !== 'undefined' && i18n.isRtl();
      viewport.innerHTML = `
        <img src="../../assets/images/wafar-ai-avatar.png" alt="Watermark" class="chat-watermark">
        <div class="chat-message-row ai">
          <div class="msg-avatar">
            <img src="../../assets/images/wafar-ai-avatar.png" alt="AI Avatar">
          </div>
          <div class="msg-bubble-wrap">
            <div class="msg-bubble-card">
              <strong>${isAr ? 'مرحباً يا عبد الله!' : 'Hello Abdalla!'}</strong><br>
              ${isAr ? 'تم مسح المحادثة السابقة. كيف يمكنني مساعدتك الآن بخصوص ترشيد الطاقة؟' : 'Thread cleared! How can I assist you with your smart energy savings today?'}
            </div>
            <span class="msg-time-stamp">${isAr ? 'الآن' : 'Just now'}</span>
          </div>
        </div>
      `;
      showToast(isAr ? 'تم مسح المحادثة بنجاح' : 'Chat thread cleared', '✓');
    }

    function sendPrompt(text) {
      document.getElementById('chatInput').value = text;
      handleChatSubmit(new Event('submit'));
    }

    function formatAssistantResponse(text) {
      if (!text) return "";
      let formatted = escapeHtml(text);
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/(?:^|\n)\s*\*\s+/g, '<br>• ');
      formatted = formatted.replace(/\n/g, '<br>');
      formatted = formatted.replace(/^(<br>)+/, '');
      return formatted;
    }

    async function handleChatSubmit(e) {
      if (e) e.preventDefault();
      const input = document.getElementById('chatInput');
      const sendBtn = document.querySelector('.btn-send-message');
      const query = input.value.trim();
      if (!query) return;

      const viewport = document.getElementById('chatViewport');
      const isAr = typeof i18n !== 'undefined' && i18n.isRtl();

      // Append User message
      const userRow = document.createElement('div');
      userRow.className = 'chat-message-row user';
      userRow.innerHTML = `
        <div class="msg-avatar">AM</div>
        <div class="msg-bubble-wrap">
          <div class="msg-bubble-card">${escapeHtml(query)}</div>
          <span class="msg-time-stamp">${isAr ? 'الآن' : 'Just now'}</span>
        </div>
      `;
      viewport.appendChild(userRow);
      input.value = '';
      input.disabled = true;
      if (sendBtn) sendBtn.disabled = true;
      viewport.scrollTop = viewport.scrollHeight;

      // Append AI typing indicator
      const typingRow = document.createElement('div');
      typingRow.className = 'chat-message-row ai';
      typingRow.id = 'aiTypingBubble';
      typingRow.innerHTML = `
        <div class="msg-avatar">
          <img src="../../assets/images/wafar-ai-avatar.png" alt="AI Avatar">
        </div>
        <div class="msg-bubble-wrap">
          <div class="msg-bubble-card" style="display:flex; align-items:center; gap:6px; padding: 12px 18px;">
            <span style="font-size: 12px; color: var(--text-muted);">${isAr ? 'جاري التحليل...' : 'WAFAR AI is analyzing...'}</span>
          </div>
        </div>
      `;
      viewport.appendChild(typingRow);
      viewport.scrollTop = viewport.scrollHeight;

      const householdId = localStorage.getItem("wafar_household_id") || "H00001";

      try {
        const res = await AssistantAPI.askQuestion(query, householdId);
        const typingEl = document.getElementById('aiTypingBubble');
        if (typingEl) typingEl.remove();

        input.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        input.focus();

        const aiRow = document.createElement('div');
        aiRow.className = 'chat-message-row ai';

        if (res.success && res.answer) {
          aiRow.innerHTML = `
            <div class="msg-avatar">
              <img src="../../assets/images/wafar-ai-avatar.png" alt="AI Avatar">
            </div>
            <div class="msg-bubble-wrap">
              <div class="msg-bubble-card">${formatAssistantResponse(res.answer)}</div>
              <span class="msg-time-stamp">${isAr ? 'الآن' : 'Just now'}</span>
            </div>
          `;
        } else {
          const errorMsg = isAr ? 
            'عذراً، لم أتمكن من الاتصال بالمساعد الذكي حالياً. يرجى المحاولة مرة أخرى.' : 
            "Sorry, I couldn't connect to the AI Assistant right now. Please try again.";
          aiRow.innerHTML = `
            <div class="msg-avatar">
              <img src="../../assets/images/wafar-ai-avatar.png" alt="AI Avatar">
            </div>
            <div class="msg-bubble-wrap">
              <div class="msg-bubble-card" style="border-left: 3px solid #e74c3c;">${escapeHtml(errorMsg)}</div>
              <span class="msg-time-stamp">${isAr ? 'الآن' : 'Just now'}</span>
            </div>
          `;
        }

        viewport.appendChild(aiRow);
        viewport.scrollTop = viewport.scrollHeight;
      } catch (err) {
        const typingEl = document.getElementById('aiTypingBubble');
        if (typingEl) typingEl.remove();

        input.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        input.focus();

        const aiRow = document.createElement('div');
        aiRow.className = 'chat-message-row ai';
        const errorMsg = isAr ? 
          'عذراً، حدث خطأ أثناء الاتصال. يرجى المحاولة مرة أخرى.' : 
          "Sorry, a network error occurred. Please try again.";
        aiRow.innerHTML = `
          <div class="msg-avatar">
            <img src="../../assets/images/wafar-ai-avatar.png" alt="AI Avatar">
          </div>
          <div class="msg-bubble-wrap">
            <div class="msg-bubble-card" style="border-left: 3px solid #e74c3c;">${escapeHtml(errorMsg)}</div>
            <span class="msg-time-stamp">${isAr ? 'الآن' : 'Just now'}</span>
          </div>
        `;
        viewport.appendChild(aiRow);
        viewport.scrollTop = viewport.scrollHeight;
      }
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
