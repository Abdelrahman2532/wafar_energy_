/**
 * WAFAR Loading Screen — JS Controller
 * Handles: progress bar animation, session check, redirect
 */

(function () {
  "use strict";

  const PROGRESS_DURATION_MS = 3500;  // total loading animation time
  const FADE_OUT_MS = 600;            // fade-out before redirect

  const progressFill = document.getElementById("progressFill");
  let startTime = null;
  let animationId = null;

  /**
   * Animate the progress bar from 0% to 100%
   */
  function animateProgress(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min((elapsed / PROGRESS_DURATION_MS) * 100, 100);

    if (progressFill) {
      progressFill.style.width = progress + "%";
    }

    if (progress < 100) {
      animationId = requestAnimationFrame(animateProgress);
    }
  }

  /**
   * Fade out the entire page and then redirect
   */
  function fadeOutAndRedirect(targetUrl) {
    document.body.classList.add("loading-fade-out");
    setTimeout(function () {
      window.location.href = targetUrl;
    }, FADE_OUT_MS);
  }

  /**
   * Check Supabase auth session and decide where to redirect
   */
  async function checkSessionAndRedirect() {
    let targetUrl = "../login/index.html";

    try {
      // Wait for Supabase SDK + config to be ready
      if (typeof AuthAPI !== "undefined" && AuthAPI.getSession) {
        const session = await AuthAPI.getSession();
        if (session) {
          targetUrl = "../dashboard/index.html";
        }
      } else {
        // Fallback: check localStorage for existing household
        const hid = localStorage.getItem("wafar_household_id");
        if (hid) {
          targetUrl = "../dashboard/index.html";
        }
      }
    } catch (e) {
      console.warn("[WAFAR Loading] Session check error:", e);
      // fallback to login
    }

    return targetUrl;
  }

  /**
   * Main entry: start progress + session check in parallel
   */
  document.addEventListener("DOMContentLoaded", async function () {
    // Start progress bar animation
    animationId = requestAnimationFrame(animateProgress);

    // Check session in parallel
    const targetUrl = await checkSessionAndRedirect();

    // Wait for progress animation to finish (whichever takes longer)
    const waitRemaining = Math.max(0, PROGRESS_DURATION_MS - performance.now());

    setTimeout(function () {
      // Ensure bar is full
      if (progressFill) progressFill.style.width = "100%";

      // Small pause at 100% so user sees it complete
      setTimeout(function () {
        fadeOutAndRedirect(targetUrl);
      }, 350);
    }, waitRemaining);
  });
})();
