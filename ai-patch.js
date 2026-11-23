(function () {
  const ADMIN_AI_KEY = "darecore_admin_ai_prompt";

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

  syncAdminKnowledge();
})();