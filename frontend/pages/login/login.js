/* =======================================================
       CHECK EXISTING SESSION ON LOAD
       ======================================================= */
    document.addEventListener("DOMContentLoaded", async () => {
      try {
        const session = await AuthAPI.getSession();
        if (session) {
          window.location.href = "../dashboard/index.html";
        }
      } catch (e) {
        // Continue to login
      }
    });

    /* =======================================================
       PASSWORD VISIBILITY
       ======================================================= */
    function togglePasswordVisibility() {
      const input = document.getElementById("passwordInput");
      input.type = input.type === "password" ? "text" : "password";
    }

    /* =======================================================
       LOGIN WITH SUPABASE AUTH
       ======================================================= */
    async function handleLoginSubmit(event) {
      event.preventDefault();

      const email = document.getElementById("emailInput").value;
      const password = document.getElementById("passwordInput").value;
      const btn = document.getElementById("submitBtn");
      const originalBtnContent = btn.innerHTML;

      btn.disabled = true;
      btn.innerHTML = `
        <span>
          ${i18n.t("login_authenticating") || "Signing in..."}
        </span>
      `;
      btn.style.opacity = "0.85";

      try {
        const res = await AuthAPI.signIn(email, password);

        if (res.success) {
          WafarUI.showToast(
            i18n.isRtl()
              ? "تم تسجيل الدخول بنجاح!"
              : "Signed in successfully!",
            "success"
          );

          setTimeout(() => {
            window.location.href = "../dashboard/index.html";
          }, 400);
        } else {
          btn.disabled = false;
          btn.innerHTML = originalBtnContent;
          btn.style.opacity = "1";

          let msg = res.error;
          if (res.error && (res.error.includes("Invalid login credentials") || res.error.includes("invalid_credentials"))) {
            msg = i18n.isRtl()
              ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
              : "Invalid email or password. Please try again.";
          } else if (!msg) {
            msg = i18n.isRtl() ? "فشل تسجيل الدخول." : "Login failed.";
          }

          WafarUI.showToast(msg, "danger");
        }
      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = originalBtnContent;
        btn.style.opacity = "1";
        WafarUI.showToast(
          i18n.isRtl() ? "حدث خطأ أثناء الاتصال." : "An error occurred during authentication.",
          "danger"
        );
      }
    }

    /* =======================================================
       FORGOT PASSWORD
       ======================================================= */
    function handleForgotPassword(event) {
      event.preventDefault();
      WafarUI.showToast(
        i18n.isRtl()
          ? "تم إرسال تعليمات استعادة كلمة المرور."
          : "Password reset instructions sent.",
        "gold"
      );
    }
