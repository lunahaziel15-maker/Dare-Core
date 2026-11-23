(function () {
  const ADMIN_AI_KEY = "darecore_admin_ai_prompt";

  // 1. Silenciar voz hablada de la IA (solo responde en texto)
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak = function () {};
  }

  // 2. Eliminar/ocultar definitivamente el boton rojo de detener (sin tocar el microfono)
  function hideStopButtonForever() {
    const sendBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => /^enviar$/i.test((b.textContent || "").trim())
    );
    if (!sendBtn || !sendBtn.parentElement) return;
    const bar = sendBtn.parentElement;
    const btns = Array.from(bar.querySelectorAll("button")).filter((b) => b !== sendBtn);
    if (btns.length < 2) return;

    // El boton rojo de detener es el primero antes del microfono (o el que tiene fondo rojo/cuadro rect)
    const stopBtn = btns.find((b) => {
      const bg = getComputedStyle(b).backgroundColor || "";
      const meta = (b.id + " " + b.className + " " + (b.title || "") + " " + (b.getAttribute("aria-label") || "")).toLowerCase();
      return /stop|detener|cancel/.test(meta) || /rgb\(\s*255\s*,\s*(5[0-9]|6[0-9]|7[0-9]|8[0-9])\s*,/.test(bg) || !!b.querySelector("rect");
    }) || btns[0];

    if (stopBtn) {
      stopBtn.style.setProperty("display", "none", "important");
      stopBtn.setAttribute("hidden", "true");
    }
  }

  // 3. Conectar conocimiento del panel Admin ("Modificar IA")
  function syncAdminKnowledge() {
    try {
      if (window.db && typeof window.db.collection === "function") {
        ["config", "settings", "ai", "ia", "admin"].forEach((col) => {
          window.db.collection(col).get().then((snap) => {
            snap.forEach((doc) => {
              const d = doc.data() || {};
              const txt = d.prompt || d.instrucciones || d.knowledge || d.conocimiento || d.aiPrompt || d.systemPrompt || d.texto;
              if (typeof txt === "string" && txt.trim()) localStorage.setItem(ADMIN_AI_KEY, txt.trim());
            });
          }).catch(() => {});
        });
      }
    } catch (e) {}
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (/guardar|actualizar|modificar ia/i.test(btn.textContent || "")) {
      const areas = Array.from(document.querySelectorAll("textarea"));
      const area = areas.find((t) => /ia|prompt|instruc|conocimiento|asistente/i.test(t.id + " " + t.name + " " + (t.placeholder || ""))) || areas[0];
      if (area && area.value.trim()) localStorage.setItem(ADMIN_AI_KEY, area.value.trim());
    }
  }, true);

  const origFetch = window.fetch.bind(window);
  window.fetch = async function (resource, init) {
    try {
      const url = typeof resource === "string" ? resource : (resource && resource.url) || "";
      if (/groq|openai|chat|completions|ai/i.test(url) && init && typeof init.body === "string") {
        const body = JSON.parse(init.body);
        const extra = localStorage.getItem(ADMIN_AI_KEY);
        if (extra && Array.isArray(body.messages)) {
          const idx = body.messages.findIndex((m) => m.role === "system");
          const rule = "\n\nCONOCIMIENTO CONFIGURADO EN ADMIN DARE CORE:\n" + extra;
          if (idx >= 0) body.messages[idx].content += rule;
          else body.messages.unshift({ role: "system", content: "Eres DareCore Intelligence." + rule });
          init = Object.assign({}, init, { body: JSON.stringify(body) });
        }
      }
    } catch (e) {}
    return origFetch(resource, init);
  };

  window.addEventListener("DOMContentLoaded", () => {
    hideStopButtonForever();
    syncAdminKnowledge();
    setInterval(hideStopButtonForever, 300);
    new MutationObserver(hideStopButtonForever).observe(document.body, { childList: true, subtree: true, attributes: true });
  });
})();