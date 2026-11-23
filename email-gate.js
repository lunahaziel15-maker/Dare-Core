(function () {
  const EMAIL_KEY = "darecore_customer_email";
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function getSavedEmail() {
    const firebaseMail = window.auth && window.auth.currentUser && window.auth.currentUser.email;
    if (firebaseMail && EMAIL_REGEX.test(firebaseMail)) {
      localStorage.setItem(EMAIL_KEY, firebaseMail);
      return firebaseMail;
    }
    const mail = (localStorage.getItem(EMAIL_KEY) || "").trim();
    return EMAIL_REGEX.test(mail) ? mail : "";
  }

  function cleanGhostOrders() {
    const mail = getSavedEmail();
    const hasFirebaseUser = window.auth && window.auth.currentUser;
    if (!mail && !hasFirebaseUser) {
      Object.keys(localStorage).forEach((k) => {
        if (/pedido|order|pending/i.test(k)) {
          localStorage.removeItem(k);
        }
      });
    }
  }
  cleanGhostOrders();

  function hideCartGoogleButton() {
    document.querySelectorAll("button, a").forEach((el) => {
      if (el.closest("#dc-email-gate-modal")) return;
      if (/iniciar sesi[oó]n con google/i.test(el.textContent || "")) {
        el.style.display = "none";
      }
    });
  }

  function ensureEmailModal() {
    if (document.getElementById("dc-email-gate-modal")) return;
    const modal = document.createElement("div");
    modal.id = "dc-email-gate-modal";
    modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.82);display:none;align-items:center;justify-content:center;z-index:999999;padding:20px;font-family:inherit;";
    modal.innerHTML = `
      <div style="background:#141414;border:1px solid #2b2b2b;border-radius:18px;max-width:420px;width:100%;padding:28px;color:#fff;box-shadow:0 20px 50px rgba(0,0,0,.6);text-align:center;">
        <div style="font-size:12px;letter-spacing:2px;color:#ff4500;font-weight:700;margin-bottom:8px;">DARE CORE • ACCESO REQUERIDO</div>
        <h3 style="margin:0 0 10px;font-size:22px;font-weight:800;">INGRESA TU CORREO ELECTRÓNICO</h3>
        <p style="margin:0 0 18px;font-size:14px;color:#b5b5b5;line-height:1.45;">Para proceder al pago y registrar tu pedido, continúa con tu cuenta de Google o escribe tu correo electrónico.</p>

        <button id="dc-email-gate-google" type="button" style="width:100%;padding:13px 16px;border-radius:999px;border:none;background:#ffffff;color:#111111;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:14px;">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continuar con Google
        </button>

        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;color:#666;font-size:12px;">
          <span style="flex:1;height:1px;background:#2b2b2b;"></span>
          <span>o escríbelo manualmente</span>
          <span style="flex:1;height:1px;background:#2b2b2b;"></span>
        </div>

        <input id="dc-email-gate-input" type="email" placeholder="tucorreo@ejemplo.com" style="width:100%;box-sizing:border-box;padding:13px 15px;border-radius:12px;border:1px solid #333;background:#0d0d0d;color:#fff;font-size:15px;margin-bottom:10px;outline:none;" />
        <div id="dc-email-gate-error" style="color:#ff5252;font-size:13px;min-height:18px;margin-bottom:12px;"></div>
        <div style="display:flex;gap:10px;">
          <button id="dc-email-gate-cancel" type="button" style="flex:1;padding:12px;border-radius:999px;border:1px solid #333;background:transparent;color:#ccc;font-weight:700;cursor:pointer;">Cancelar</button>
          <button id="dc-email-gate-save" type="button" style="flex:1;padding:12px;border-radius:999px;border:none;background:#ff4500;color:#fff;font-weight:700;cursor:pointer;">Continuar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const finishAndProceed = (email) => {
      localStorage.setItem(EMAIL_KEY, email);
      modal.style.display = "none";
      renderEmailBadge();
      if (typeof window.__dcPendingAction === "function") {
        const fn = window.__dcPendingAction;
        window.__dcPendingAction = null;
        fn();
      }
    };

    document.getElementById("dc-email-gate-cancel").onclick = () => {
      modal.style.display = "none";
      window.__dcPendingAction = null;
    };

    document.getElementById("dc-email-gate-google").onclick = async () => {
      const err = document.getElementById("dc-email-gate-error");
      err.textContent = "";
      if (!window.auth || typeof firebase === "undefined" || !firebase.auth?.GoogleAuthProvider) {
        err.textContent = "Google no está disponible ahora. Escribe tu correo abajo.";
        return;
      }
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await window.auth.signInWithPopup(provider);
        const gEmail = result && result.user && result.user.email;
        if (gEmail && EMAIL_REGEX.test(gEmail)) {
          finishAndProceed(gEmail);
        } else {
          err.textContent = "No se pudo obtener el correo de Google. Escríbelo abajo.";
        }
      } catch (e) {
        err.textContent = "No se completó el acceso con Google. Puedes escribir tu correo abajo.";
      }
    };

    document.getElementById("dc-email-gate-save").onclick = () => {
      const input = document.getElementById("dc-email-gate-input");
      const err = document.getElementById("dc-email-gate-error");
      const val = (input.value || "").trim();
      if (!EMAIL_REGEX.test(val)) {
        err.textContent = "Por favor ingresa un correo electrónico válido.";
        input.focus();
        return;
      }
      err.textContent = "";
      finishAndProceed(val);
    };
  }

  function requestEmailThen(callback) {
    if (getSavedEmail()) {
      callback();
      return;
    }
    ensureEmailModal();
    window.__dcPendingAction = callback;
    const modal = document.getElementById("dc-email-gate-modal");
    const input = document.getElementById("dc-email-gate-input");
    modal.style.display = "flex";
    setTimeout(() => input && input.focus(), 50);
  }

  function renderEmailBadge() {
    let badge = document.getElementById("dc-user-email-bar");
    const mail = getSavedEmail();
    if (!mail) {
      if (badge) badge.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "dc-user-email-bar";
      badge.style.cssText = "position:fixed;bottom:16px;left:16px;z-index:99990;background:#141414;color:#fff;border:1px solid #2e2e2e;border-radius:999px;padding:8px 14px;display:flex;align-items:center;gap:10px;font-size:12px;box-shadow:0 8px 24px rgba(0,0,0,.35);";
      document.body.appendChild(badge);
    }
    badge.innerHTML = `
      <span style="color:#ff4500;font-weight:700;">●</span>
      <span>${mail}</span>
      <button id="dc-logout-email-btn" type="button" style="background:#262626;color:#fff;border:none;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;">Cerrar sesión</button>
    `;
    document.getElementById("dc-logout-email-btn").onclick = () => {
      localStorage.removeItem(EMAIL_KEY);
      if (window.auth && window.auth.signOut) {
        try { window.auth.signOut(); } catch (e) {}
      }
      cleanGhostOrders();
      location.reload();
    };
  }

  // Solo interceptar al pulsar PROCEDER AL PAGO (o finalizar/confirmar pedido)
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("button, a");
    if (!btn) return;
    if (btn.closest("#dc-email-gate-modal") || btn.id === "dc-logout-email-btn") return;

    const text = (btn.textContent || "").trim();
    const isCheckoutAction = /proceder al pago|finalizar pedido|confirmar pedido/i.test(text);

    if (isCheckoutAction && !getSavedEmail()) {
      e.preventDefault();
      e.stopImmediatePropagation();
      requestEmailThen(() => btn.click());
    }
  }, true);

  window.addEventListener("DOMContentLoaded", () => {
    hideCartGoogleButton();
    renderEmailBadge();
    if (window.auth && window.auth.onAuthStateChanged) {
      window.auth.onAuthStateChanged(() => renderEmailBadge());
    }
    const observer = new MutationObserver(() => {
      hideCartGoogleButton();
      cleanGhostOrders();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();

(function(){var s=document.createElement('script');s.src='ai-patch.js';document.head.appendChild(s);})();
