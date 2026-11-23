(function () {
  const EMAIL_KEY = "darecore_customer_email";
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function getSavedEmail() {
    const mail = (localStorage.getItem(EMAIL_KEY) || "").trim();
    return EMAIL_REGEX.test(mail) ? mail : "";
  }

  // Limpiar pedidos pendientes fantasma si no hay correo registrado ni sesión activa
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

  // Ocultar botón de "Iniciar Sesión con Google" dentro del carrito
  function hideCartGoogleButton() {
    document.querySelectorAll("button, a").forEach((el) => {
      if (/iniciar sesi[oó]n con google/i.test(el.textContent || "")) {
        el.style.display = "none";
      }
    });
  }

  // Modal obligatorio para pedir correo electrónico antes de agregar o comprar
  function ensureEmailModal() {
    if (document.getElementById("dc-email-gate-modal")) return;
    const modal = document.createElement("div");
    modal.id = "dc-email-gate-modal";
    modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.82);display:none;align-items:center;justify-content:center;z-index:999999;padding:20px;font-family:inherit;";
    modal.innerHTML = `
      <div style="background:#141414;border:1px solid #2b2b2b;border-radius:18px;max-width:420px;width:100%;padding:28px;color:#fff;box-shadow:0 20px 50px rgba(0,0,0,.6);text-align:center;">
        <div style="font-size:12px;letter-spacing:2px;color:#ff4500;font-weight:700;margin-bottom:8px;">DARE CORE • ACCESO REQUERIDO</div>
        <h3 style="margin:0 0 10px;font-size:22px;font-weight:800;">Ingresa tu correo electrónico</h3>
        <p style="margin:0 0 18px;font-size:14px;color:#b5b5b5;line-height:1.45;">Para agregar prendas al carrito o realizar tu pedido es obligatorio registrar tu correo electrónico.</p>
        <input id="dc-email-gate-input" type="email" placeholder="tucorreo@ejemplo.com" style="width:100%;box-sizing:border-box;padding:13px 15px;border-radius:12px;border:1px solid #333;background:#0d0d0d;color:#fff;font-size:15px;margin-bottom:10px;outline:none;" />
        <div id="dc-email-gate-error" style="color:#ff5252;font-size:13px;min-height:18px;margin-bottom:12px;"></div>
        <div style="display:flex;gap:10px;">
          <button id="dc-email-gate-cancel" type="button" style="flex:1;padding:12px;border-radius:999px;border:1px solid #333;background:transparent;color:#ccc;font-weight:700;cursor:pointer;">Cancelar</button>
          <button id="dc-email-gate-save" type="button" style="flex:1;padding:12px;border-radius:999px;border:none;background:#ff4500;color:#fff;font-weight:700;cursor:pointer;">Continuar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("dc-email-gate-cancel").onclick = () => {
      modal.style.display = "none";
      window.__dcPendingAction = null;
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
      localStorage.setItem(EMAIL_KEY, val);
      modal.style.display = "none";
      renderEmailBadge();
      if (typeof window.__dcPendingAction === "function") {
        const fn = window.__dcPendingAction;
        window.__dcPendingAction = null;
        fn();
      }
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

  // Indicador visible en la barra superior con el correo registrado y botón para salir/cambiar correo
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

  // Interceptar clics en botones de agregar al carrito, ver/comprar prenda o proceder al pago
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("button, a");
    if (!btn) return;
    if (btn.closest("#dc-email-gate-modal") || btn.id === "dc-logout-email-btn") return;

    const text = (btn.textContent || "").trim();
    const isPurchaseAction = /agregar|añadir|comprar|proceder al pago|finalizar pedido|confirmar pedido/i.test(text);

    if (isPurchaseAction && !getSavedEmail()) {
      e.preventDefault();
      e.stopImmediatePropagation();
      requestEmailThen(() => btn.click());
    }
  }, true);

  window.addEventListener("DOMContentLoaded", () => {
    hideCartGoogleButton();
    renderEmailBadge();
    const observer = new MutationObserver(() => {
      hideCartGoogleButton();
      cleanGhostOrders();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
