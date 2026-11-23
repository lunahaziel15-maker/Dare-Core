(function () {
  const origFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : (input && input.url) || "";
    if (url.includes("api.groq.com/openai/v1/chat/completions")) {
      return origFetch("/api/groq", {
        method: (init && init.method) || "POST",
        headers: { "Content-Type": "application/json" },
        body: init && init.body
      });
    }
    return origFetch(input, init);
  };
})();
(function () {
    const GROQ_API_KEY = "";
    const TEXT_MODELS = ["openai/gpt-oss-20b", "qwen/qwen3.8-27b", "openai/gpt-oss-120b"];

    const SYSTEM_PROMPT = `Eres DareCore Intelligence, el asistente de IA oficial de Dare Core.
Dare Core es una marca local en León, Guanajuato, dedicada a la creación y venta de ropa urbana y playeras personalizadas 100 % de algodón.

Lo que ofrecen:
- Prendas básicas y estilo urbano: fabrican playeras (incluyendo cortes oversize y sin mangas) elaboradas en algodón suave.
- Personalización completa: estampan diseños exclusivos, frases o detalles a petición del cliente.

Responde siempre en español, de forma clara, directa, breve y amable, basándote únicamente en esta información y en el catálogo actual de la tienda.
No uses emojis ni asteriscos dobles (**). Escribe solo texto plano limpio.`;

    const chatHistory = [];
    let isSending = false;
    let workingModel = null;

    function cleanAiText(text) {
        if (typeof text !== "string") return "";
        return text
            .replace(/\*\*/g, "")
            .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
            .replace(/\uFE0F/g, "")
            .replace(/[ \t]{2,}/g, " ")
            .replace(/ +\n/g, "\n")
            .trim();
    }

    const AI_KNOWLEDGE_KEY = "darecore_ai_knowledge";

    function getAdminKnowledgeText() {
        try {
            const raw = localStorage.getItem(AI_KNOWLEDGE_KEY);
            return raw && raw.trim() ? raw.trim() : "";
        } catch (e) {
            return "";
        }
    }

    function buildDynamicSystemPrompt() {
        const customKnowledge = getAdminKnowledgeText();
        const baseRules = SYSTEM_PROMPT + getCatalogContextText();
        if (!customKnowledge) {
            return baseRules;
        }
        return (
            baseRules +
            "\n\n=== REGLAS Y POLÍTICAS OFICIALES DEFINIDAS POR ADMINISTRACIÓN (PRIORIDAD MÁXIMA) ===\n" +
            "Debes obedecer estrictamente la siguiente información oficial de Dare Core. Si algo no se menciona o se contradice con suposiciones generales, esta información manda:\n" +
            customKnowledge +
            "\n=== FIN DE INFORMACIÓN OFICIAL ==="
        );
    }

    function getCatalogContextText() {
        try {
            const raw = localStorage.getItem("darecore_products");
            const list = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(list) || list.length === 0) return "";
            const items = list.slice(0, 15).map(p =>
                `- ${p.name} (${p.category || "general"}): $${Number(p.price || 0).toLocaleString("es-MX")} MXN. ${p.desc || ""}`
            ).join("\n");
            return "\n\nCatálogo actual en tienda:\n" + items;
        } catch (e) {
            return "";
        }
    }

    async function getCandidateModels() {
        const candidates = [];
        if (workingModel) candidates.push(workingModel);
        for (const m of TEXT_MODELS) {
            if (!candidates.includes(m)) candidates.push(m);
        }
        return candidates;
    }

    function injectAiStyles() {
        if (document.getElementById("darecoreAiStyles")) return;
        const style = document.createElement("style");
        style.id = "darecoreAiStyles";
        style.textContent = `
            html, body {
                scrollbar-width: none;
                -ms-overflow-style: none;
            }
            html::-webkit-scrollbar,
            body::-webkit-scrollbar {
                display: none;
                width: 0;
                height: 0;
            }
            #darecoreAiFab {
                position: fixed;
                right: 22px;
                bottom: 22px;
                z-index: 99990;
                background: linear-gradient(135deg, #ff2a00 0%, #ff5500 100%);
                color: #ffffff;
                border: 1px solid rgba(255,255,255,0.25);
                border-radius: 999px;
                padding: 12px 18px;
                font-size: 12px;
                font-weight: 800;
                letter-spacing: 0.5px;
                cursor: pointer;
                box-shadow: 0 14px 34px rgba(255, 42, 0, 0.38);
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            #darecoreAiPanel {
                display: none;
                position: fixed;
                right: 22px;
                bottom: 78px;
                width: 370px;
                max-width: calc(100vw - 32px);
                height: 500px;
                max-height: calc(100vh - 105px);
                z-index: 99991;
                background: #111115;
                color: #ffffff;
                border: 1.5px solid #ff2a00;
                border-radius: 24px;
                box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75);
                flex-direction: column;
                overflow: hidden;
            }
            #darecoreAiPanel.open {
                display: flex;
            }
            .darecore-ai-header {
                padding: 14px 16px;
                background: #17171d;
                border-bottom: 1px solid rgba(255,255,255,0.08);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .darecore-ai-title {
                font-size: 13px;
                font-weight: 900;
                letter-spacing: 0.4px;
            }
            .darecore-ai-sub {
                font-size: 10px;
                color: #ff6b52;
                font-weight: 700;
                text-transform: uppercase;
            }
            .darecore-ai-close {
                background: rgba(255,255,255,0.08);
                color: #ffffff;
                border: none;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                font-size: 18px;
                cursor: pointer;
            }
            .darecore-ai-messages {
                flex: 1;
                padding: 14px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 10px;
                scrollbar-width: none;
                -ms-overflow-style: none;
            }
            .darecore-ai-messages::-webkit-scrollbar {
                display: none;
                width: 0;
                height: 0;
            }
            .darecore-ai-msg {
                max-width: 85%;
                padding: 10px 13px;
                border-radius: 16px;
                font-size: 12.5px;
                line-height: 1.45;
                white-space: pre-wrap;
                word-break: break-word;
            }
            .darecore-ai-msg.bot {
                align-self: flex-start;
                background: #1c1c24;
                color: #f4f4f5;
                border: 1px solid rgba(255,255,255,0.08);
            }
            .darecore-ai-msg.user {
                align-self: flex-end;
                background: linear-gradient(135deg, #ff2a00 0%, #ff5500 100%);
                color: #ffffff;
                font-weight: 600;
            }
            .darecore-ai-form {
                padding: 10px 12px;
                background: #17171d;
                border-top: 1px solid rgba(255,255,255,0.08);
                display: flex;
                gap: 8px;
            }
            .darecore-ai-input {
                flex: 1;
                background: #0e0e12;
                color: #ffffff;
                border: 1px solid rgba(255,255,255,0.16);
                border-radius: 999px;
                padding: 10px 14px;
                font-size: 12.5px;
                outline: none;
            }
            .darecore-ai-input:focus {
                border-color: #ff5500;
            }
            .darecore-ai-send {
                background: #ff2a00;
                color: #ffffff;
                border: none;
                border-radius: 999px;
                padding: 0 16px;
                font-size: 12px;
                font-weight: 800;
                cursor: pointer;
            }
            .darecore-ai-send:disabled {
                opacity: 0.55;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);
    }

    function appendMessage(role, text) {
        const container = document.getElementById("darecoreAiMessages");
        if (!container) return null;
        const bubble = document.createElement("div");
        bubble.className = "darecore-ai-msg " + role;
        bubble.textContent = role === "bot" ? cleanAiText(text) : text;
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
        return bubble;
    }

    async function sendToGroq(userText) {
        if (isSending) return;
        const cleanText = (userText || "").trim();
        if (!cleanText) return;

        if (false && (!GROQ_API_KEY || GROQ_API_KEY === "gsk_tu_llave_aqui")) {
            appendMessage("bot", "Configura primero tu GROQ_API_KEY (gsk_...) dentro de darecore-ai.js para activar el chat.");
            return;
        }

        isSending = true;
        const input = document.getElementById("darecoreAiInput");
        const sendBtn = document.getElementById("darecoreAiSend");
        if (sendBtn) sendBtn.disabled = true;

        appendMessage("user", cleanText);
        chatHistory.push({ role: "user", content: cleanText });

        const loadingBubble = appendMessage("bot", "Generando respuesta...");

        try {
            const candidates = await getCandidateModels();
            let reply = "";
            let lastError = "No se pudo obtener respuesta de Groq.";

            for (const modelId of candidates) {
                try {
                    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + GROQ_API_KEY
                        },
                        body: JSON.stringify({
                            model: modelId,
                            temperature: 0.6,
                            messages: [
                                { role: "system", content: buildDynamicSystemPrompt() },
                                ...chatHistory.slice(-10)
                            ]
                        })
                    });

                    const data = await response.json();
                    if (!response.ok) {
                        lastError = data?.error?.message || lastError;
                        continue;
                    }

                    const rawReply = data?.choices?.[0]?.message?.content || "";
                    const cleaned = cleanAiText(rawReply);
                    if (cleaned) {
                        workingModel = modelId;
                        reply = cleaned;
                        break;
                    }
                } catch (modelErr) {
                    lastError = modelErr?.message || lastError;
                }
            }

            if (!reply) {
                throw new Error(lastError);
            }

            chatHistory.push({ role: "assistant", content: reply });
            if (loadingBubble) loadingBubble.textContent = reply;
        } catch (err) {
            if (loadingBubble) {
                loadingBubble.textContent = "Error: " + (err.message || "No se pudo conectar con Groq.");
            }
        } finally {
            isSending = false;
            if (sendBtn) sendBtn.disabled = false;
            if (input) input.focus();
        }
    }

    function initDarecoreAiWidget() {
        if (window.location.pathname.toLowerCase().includes("admin.html")) return;
        injectAiStyles();

        if (!document.getElementById("darecoreAiFab")) {
            const fab = document.createElement("button");
            fab.id = "darecoreAiFab";
            fab.type = "button";
            fab.textContent = "DareCore AI";
            document.body.appendChild(fab);
        }

        if (!document.getElementById("darecoreAiPanel")) {
            const panel = document.createElement("div");
            panel.id = "darecoreAiPanel";
            panel.innerHTML = `
                <div class="darecore-ai-header">
                    <div>
                        <div class="darecore-ai-title">DareCore Intelligence</div>
                        <div class="darecore-ai-sub">AI Assistant • Groq</div>
                    </div>
                    <button type="button" class="darecore-ai-close" id="darecoreAiClose" aria-label="Cerrar chat">×</button>
                </div>
                <div class="darecore-ai-messages" id="darecoreAiMessages"></div>
                <form class="darecore-ai-form" id="darecoreAiForm">
                    <input type="text" class="darecore-ai-input" id="darecoreAiInput" placeholder="Pregúntame por prendas, tallas o envíos..." autocomplete="off">
                    <button type="submit" class="darecore-ai-send" id="darecoreAiSend">Enviar</button>
                </form>
            `;
            document.body.appendChild(panel);

            appendMessage(
                "bot",
                "Hola. Soy DareCore Intelligence. Pregúntame por nuestras prendas, cortes, tallas o personalización en Dare Lab."
            );
        }

        const fab = document.getElementById("darecoreAiFab");
        const panel = document.getElementById("darecoreAiPanel");
        const closeBtn = document.getElementById("darecoreAiClose");
        const form = document.getElementById("darecoreAiForm");
        const input = document.getElementById("darecoreAiInput");

        fab.addEventListener("click", () => {
            panel.classList.toggle("open");
            if (panel.classList.contains("open") && input) {
                setTimeout(() => input.focus(), 60);
            }
        });

        closeBtn.addEventListener("click", () => {
            panel.classList.remove("open");
        });

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            if (!input) return;
            const val = input.value;
            input.value = "";
            sendToGroq(val);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initDarecoreAiWidget);
    } else {
        initDarecoreAiWidget();
    }
})();





(function () {
  const oldStyle = document.getElementById("dcOrbStyle");
  if (oldStyle) oldStyle.remove();

  const st = document.createElement("style");
  st.id = "dcOrbStyle";
  st.textContent = `
    .dc-chatgpt-orb {
      position: fixed !important;
      right: 24px !important;
      bottom: 24px !important;
      left: auto !important;
      top: auto !important;
      transform: none !important;
      z-index: 99999 !important;
      width: 64px !important;
      height: 64px !important;
      min-width: 64px !important;
      max-width: 64px !important;
      max-height: 64px !important;
      padding: 0 !important;
      margin: 0 !important;
      border: 1px solid rgba(255, 255, 255, 0.16) !important;
      border-radius: 50% !important;
      overflow: hidden !important;
      background: radial-gradient(circle at 50% 50%, #18181b 0%, #09090b 82%, #050506 100%) !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45) !important;
      color: transparent !important;
      font-size: 0 !important;
      line-height: 0 !important;
      cursor: pointer !important;
    }
    .dc-chatgpt-orb > *:not(canvas.dc-orb-canvas) {
      display: none !important;
    }
    .dc-chatgpt-orb canvas.dc-orb-canvas {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      display: block !important;
      border-radius: 50% !important;
      pointer-events: none !important;
    }
    .dc-chatgpt-orb:hover,
    .dc-chatgpt-orb.is-active {
      border-color: rgba(255, 255, 255, 0.34) !important;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.65) !important;
    }
  `;
  document.head.appendChild(st);

  let mouseX = 0;
  let mouseY = 0;
  let targetTiltX = 0;
  let targetTiltY = 0;
  let curTiltX = 0;
  let curTiltY = 0;
  let hovered = false;
  let t = 0;

  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
    mouseY = (e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
    targetTiltX = mouseY * 0.7;
    targetTiltY = mouseX * 0.9;
  }, { passive: true });

  const PARTICLE_COUNT = 540;
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, idx) => {
    // Distribución volumétrica dispersa para que no formen un borde rígido
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const rad = Math.pow(Math.random(), 0.55);
    return {
      bx: rad * Math.sin(phi) * Math.cos(theta),
      by: rad * Math.cos(phi),
      bz: rad * Math.sin(phi) * Math.sin(theta),
      r: (idx % 9 === 0) ? 1.35 : (0.65 + (idx % 4) * 0.22),
      baseAlpha: 0.25 + (idx % 7) * 0.11,
      phase: (idx * 0.41) % (Math.PI * 2),
      freq: 0.6 + (idx % 5) * 0.18
    };
  });

  function startCanvasLoop(canvas) {
    if (canvas.dataset.dcLoopStarted === "1") return;
    canvas.dataset.dcLoopStarted = "1";
    const ctx = canvas.getContext("2d");
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const cx = size * 0.5;
    const cy = size * 0.5;
    const radius = size * 0.44;

    function render() {
      const active = hovered || (canvas.parentElement && canvas.parentElement.classList.contains("is-active"));
      t += active ? 0.024 : 0.012;

      curTiltX += (targetTiltX - curTiltX) * 0.08;
      curTiltY += (targetTiltY - curTiltY) * 0.08;

      ctx.clearRect(0, 0, size, size);

      // Onda de dispersión lateral global para que se esparzan de un lado a otro
      const globalSweepX = Math.sin(t * 0.85) * 0.36 + curTiltY * 0.25;
      const globalSpread = 1.0 + Math.sin(t * 1.1) * 0.22 + (active ? 0.12 : 0);

      const cosY = Math.cos(t * 0.6 + curTiltY);
      const sinY = Math.sin(t * 0.6 + curTiltY);
      const cosX = Math.cos(curTiltX * 0.5 + Math.sin(t * 0.4) * 0.2);
      const sinX = Math.sin(curTiltX * 0.5 + Math.sin(t * 0.4) * 0.2);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];

        // Cada partícula se esparce y oscila de un lado a otro con su propio ritmo
        const scatterX = Math.sin(t * p.freq + p.phase) * 0.28 * globalSpread;
        const scatterY = Math.cos(t * (p.freq * 0.85) + p.phase * 1.3) * 0.22 * globalSpread;
        const scatterZ = Math.sin(t * (p.freq * 0.7) + p.phase * 0.7) * 0.22;

        const px = (p.bx * globalSpread) + scatterX + globalSweepX;
        const py = (p.by * globalSpread) + scatterY;
        const pz = p.bz + scatterZ;

        const x1 = px * cosY - pz * sinY;
        const z1 = pz * cosY + px * sinY;

        const y2 = py * cosX - z1 * sinX;
        const z2 = z1 * cosX + py * sinX;

        const perspective = 2.5 / (2.5 - z2);
        const sx = cx + x1 * radius * perspective;
        const sy = cy + y2 * radius * perspective;

        const depthFactor = (z2 + 1.2) / 2.4;
        const alpha = Math.max(0.08, Math.min(0.95, p.baseAlpha * (0.35 + depthFactor * 0.85)));
        const dotR = Math.max(0.55, p.r * (0.65 + depthFactor * 0.65));

        ctx.fillStyle = `rgba(244, 244, 245, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, dotR, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }

  const applyOrb = () => {
    const candidates = Array.from(document.querySelectorAll("button, a, div[role='button']"));
    const matches = candidates.filter(el => (el.textContent || "").trim() === "DareCore AI" || el.classList.contains("dc-chatgpt-orb"));

    matches.forEach((el, idx) => {
      if (idx === 0) {
        if (el.parentElement && el.parentElement !== document.body) {
          document.body.appendChild(el);
        }
        if (!el.classList.contains("dc-chatgpt-orb")) {
          el.classList.add("dc-chatgpt-orb");
          el.setAttribute("aria-label", "DareCore AI");
          el.title = "DareCore AI";
          el.addEventListener("mouseenter", () => { hovered = true; });
          el.addEventListener("mouseleave", () => { hovered = false; });
        }
        let canvas = el.querySelector("canvas.dc-orb-canvas");
        if (!canvas) {
          canvas = document.createElement("canvas");
          canvas.className = "dc-orb-canvas";
          el.appendChild(canvas);
        }
        startCanvasLoop(canvas);
      } else {
        el.style.setProperty("display", "none", "important");
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyOrb);
  } else {
    applyOrb();
  }
  new MutationObserver(applyOrb).observe(document.body || document.documentElement, { childList: true, subtree: true });
})();

/* DC_UNIFIED_CHAT_MIC_TTS_START */
(function () {
  window.DC_CUSTOM_TTS = null;
  const synth = window.speechSynthesis || null;
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  let nextTurnIsVoice = false;
  let speakingActive = false;
  let speakWatchdog = null;
  let activeFetchPromise = null;
  let activeFetchKey = "";
  let lastDoneKey = "";
  let lastDoneTime = 0;

  function stopVoiceNow() {
    speakingActive = false;
    if (speakWatchdog) {
      clearInterval(speakWatchdog);
      speakWatchdog = null;
    }
    try {
      if (synth) synth.cancel();
    } catch (_) {}
    updateStopIcon();
  }

  function updateStopIcon() {
    const stopBtn = document.getElementById("dcVoiceStopIconBtn");
    if (!stopBtn) return;
    const isPlaying = speakingActive || Boolean(synth && (synth.speaking || synth.pending));
    stopBtn.style.display = "none";
  }

  function speakTextSimultaneously(text) {
    if (!synth || !text) return;
    const clean = String(text)
      .replace(/\*\*/g, "")
      .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
      .replace(/\uFE0F/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) return;

    stopVoiceNow();
    speakingActive = true;
    updateStopIcon();

    try {
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = "es-MX";
      utter.rate = 1.0;
      utter.pitch = 1.0;

      const voices = synth.getVoices ? synth.getVoices() : [];
      const esVoice = voices.find(v => /es-MX/i.test(v.lang)) || voices.find(v => /^es/i.test(v.lang));
      if (esVoice) utter.voice = esVoice;

      utter.onend = utter.onerror = () => {
        speakingActive = false;
        if (speakWatchdog) {
          clearInterval(speakWatchdog);
          speakWatchdog = null;
        }
        updateStopIcon();
      };

      synth.speak(utter);
      if (synth.paused) synth.resume();
    } catch (_) {
      speakingActive = false;
      updateStopIcon();
      return;
    }

    const maxEnd = Date.now() + Math.min(45000, Math.max(2500, clean.length * 80));
    speakWatchdog = setInterval(() => {
      if (synth && synth.paused) {
        try { synth.resume(); } catch (_) {}
      }
      const stillSpeaking = synth && (synth.speaking || synth.pending);
      if (!stillSpeaking && Date.now() > maxEnd) {
        speakingActive = false;
        clearInterval(speakWatchdog);
        speakWatchdog = null;
      } else if (!stillSpeaking && Date.now() > maxEnd - 1500 && !speakingActive) {
        clearInterval(speakWatchdog);
        speakWatchdog = null;
      }
      updateStopIcon();
    }, 200);
  }

  function mountControls() {
    const form = document.getElementById("darecoreAiForm");
    const input = document.getElementById("darecoreAiInput");
    const sendBtn = document.getElementById("darecoreAiSend");
    if (!form || !input || !sendBtn) return;

    if (false && !document.getElementById("dcVoiceStopIconBtn")) {
      const stopBtn = document.createElement("button");
      stopBtn.id = "dcVoiceStopIconBtn";
      stopBtn.type = "button";
      stopBtn.setAttribute("aria-label", "Detener voz");
      stopBtn.title = "Detener voz";
      stopBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2.5"></rect></svg>';
      stopBtn.style.cssText = "display:none;align-items:center;justify-content:center;width:34px;height:34px;min-width:34px;border-radius:50%;border:1px solid rgba(255,255,255,0.22);background:#ff2a00;color:#ffffff;cursor:pointer;flex-shrink:0;";
      stopBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        stopVoiceNow();
      });
      form.insertBefore(stopBtn, sendBtn);
    }

    if (SpeechRec && !document.getElementById("dcMicBtn")) {
      const micBtn = document.createElement("button");
      micBtn.id = "dcMicBtn";
      micBtn.type = "button";
      micBtn.setAttribute("aria-label", "Dictar por micrófono");
      micBtn.title = "Dictar por micrófono";
      micBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 10v1a7 7 0 0 0 14 0v-1"></path><line x1="12" y1="18" x2="12" y2="22"></line></svg>';
      micBtn.style.cssText = "display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;min-width:36px;border-radius:50%;border:1.5px solid #ff2a00;background:#ffffff;color:#111115;cursor:pointer;flex-shrink:0;";

      const rec = new SpeechRec();
      rec.lang = "es-MX";
      rec.continuous = false;
      rec.interimResults = true;

      let listening = false;
      let transcriptText = "";
      let silenceTimer = null;
      let alreadySubmitted = false;

      function setMicVisual(isRec) {
        micBtn.style.background = isRec ? "#ff2a00" : "#ffffff";
        micBtn.style.color = isRec ? "#ffffff" : "#111115";
      }

      function submitVoicePromptOnce() {
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }
        if (alreadySubmitted) return;
        const textToSend = (transcriptText || input.value || "").trim();
        listening = false;
        setMicVisual(false);
        if (!textToSend) return;

        alreadySubmitted = true;
        nextTurnIsVoice = true;
        try { rec.stop(); } catch (_) {}

        input.value = textToSend;
        if (typeof form.requestSubmit === "function") {
          form.requestSubmit();
        } else {
          sendBtn.click();
        }
        setTimeout(() => {
          if (input.value === textToSend) input.value = "";
        }, 0);
      }

      rec.onstart = () => {
        stopVoiceNow();
        listening = true;
        alreadySubmitted = false;
        transcriptText = "";
        setMicVisual(true);
      };

      rec.onresult = (event) => {
        let combined = "";
        let hasFinal = false;
        for (let i = 0; i < event.results.length; i++) {
          combined += (event.results[i][0] && event.results[i][0].transcript) ? event.results[i][0].transcript + " " : "";
          if (event.results[i].isFinal) hasFinal = true;
        }
        transcriptText = combined.trim();
        input.value = transcriptText;
        input.dispatchEvent(new Event("input", { bubbles: true }));

        if (silenceTimer) clearTimeout(silenceTimer);
        if (transcriptText) {
          silenceTimer = setTimeout(() => {
            submitVoicePromptOnce();
          }, hasFinal ? 550 : 1200);
        }
      };

      rec.onerror = () => {
        if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
        listening = false;
        setMicVisual(false);
      };

      rec.onend = () => {
        if (listening && transcriptText && !alreadySubmitted) {
          submitVoicePromptOnce();
        } else {
          listening = false;
          setMicVisual(false);
        }
      };

      micBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        stopVoiceNow();
        if (!listening) {
          alreadySubmitted = false;
          transcriptText = "";
          input.value = "";
          try {
            rec.start();
          } catch (_) {
            listening = false;
            setMicVisual(false);
          }
        } else {
          submitVoicePromptOnce();
        }
      });

      form.insertBefore(micBtn, sendBtn);
    }

    updateStopIcon();
  }

  document.addEventListener("submit", (e) => {
    if (e.target && e.target.id === "darecoreAiForm") {
      if (!nextTurnIsVoice) {
        stopVoiceNow();
      }
    }
  }, true);

  const origFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : (input && input.url) || "";
    if (url.includes("api.groq.com/openai/v1/chat/completions")) {
      const shouldSpeak = nextTurnIsVoice;
      nextTurnIsVoice = false;
      if (!shouldSpeak) {
        stopVoiceNow();
      }

      let payloadKey = "";
      try {
        const parsed = init && init.body ? JSON.parse(init.body) : null;
        payloadKey = JSON.stringify(parsed && parsed.messages ? parsed.messages : []);
      } catch (_) {
        payloadKey = String((init && init.body) || "");
      }

      const now = Date.now();
      if (activeFetchPromise && payloadKey === activeFetchKey) {
        return activeFetchPromise.then(r => r.clone());
      }
      if (payloadKey && payloadKey === lastDoneKey && (now - lastDoneTime) < 2500) {
        return new Response(JSON.stringify({ choices: [{ message: { content: "" } }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      activeFetchKey = payloadKey;
      activeFetchPromise = origFetch("/api/groq", {
        method: (init && init.method) || "POST",
        headers: { "Content-Type": "application/json" },
        body: init && init.body
      });

      try {
        const res = await activeFetchPromise;
        lastDoneKey = payloadKey;
        lastDoneTime = Date.now();

        if (shouldSpeak && res.ok) {
          res.clone().json().then(data => {
            const replyText = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
            if (replyText) {
              speakTextSimultaneously(replyText);
            }
          }).catch(() => {});
        }
        return res;
      } finally {
        setTimeout(() => {
          activeFetchPromise = null;
        }, 300);
      }
    }

    return origFetch(input, init);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountControls);
  } else {
    mountControls();
  }
  setInterval(() => {
    mountControls();
    updateStopIcon();
  }, 400);
})();
/* DC_UNIFIED_CHAT_MIC_TTS_END */