/* DC_SYNC_MIC_VOICE_AND_STOP_START */
(function () {
  window.DC_CUSTOM_TTS = null;
  let lastInputWasVoice = false;
  let blockVoiceInputUntil = 0;
  let speakingToken = 0;
  let speechExpectedEndTime = 0;
  let keepAliveTimer = null;

  function isVoiceActuallyPlaying() {
    if ("speechSynthesis" in window) {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) return true;
    }
    return Date.now() < speechExpectedEndTime;
  }

  function updateStopLogoVisibility() {
    const stopBtn = document.getElementById("dcStopVoiceLogoBtn");
    if (!stopBtn) return;
    stopBtn.style.display = isVoiceActuallyPlaying() ? "inline-flex" : "none";
  }

  function clearKeepAlive() {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
  }

  function stopAllSpeech() {
    speakingToken++;
    speechExpectedEndTime = 0;
    clearKeepAlive();
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch (_) {}
    try {
      document.querySelectorAll("audio").forEach(a => {
        a.pause();
        a.currentTime = 0;
      });
    } catch (_) {}
    updateStopLogoVisibility();
  }

  function speakSimultaneously(rawText) {
    if (!("speechSynthesis" in window) || !rawText) return;
    const cleanTxt = String(rawText).replace(/\*\*/g, "").replace(/[#*`]/g, "").trim();
    if (!cleanTxt) return;

    stopAllSpeech();
    const myToken = speakingToken;
    const estimatedMs = Math.max(2500, Math.min(45000, cleanTxt.length * 75));
    speechExpectedEndTime = Date.now() + estimatedMs;

    const utter = new SpeechSynthesisUtterance(cleanTxt);
    utter.lang = "es-MX";
    utter.rate = 1.02;
    utter.pitch = 1.0;

    utter.onstart = () => {
      if (myToken !== speakingToken) return;
      speechExpectedEndTime = Date.now() + estimatedMs;
      updateStopLogoVisibility();
    };

    utter.onend = utter.onerror = () => {
      if (myToken !== speakingToken) return;
      speechExpectedEndTime = 0;
      clearKeepAlive();
      updateStopLogoVisibility();
    };

    try {
      window.speechSynthesis.speak(utter);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (_) {}

    updateStopLogoVisibility();

    keepAliveTimer = setInterval(() => {
      if (myToken !== speakingToken) {
        clearKeepAlive();
        return;
      }
      if ("speechSynthesis" in window && window.speechSynthesis.paused) {
        try { window.speechSynthesis.resume(); } catch (_) {}
      }
      if (!("speechSynthesis" in window && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) && Date.now() >= speechExpectedEndTime) {
        speechExpectedEndTime = 0;
        clearKeepAlive();
      }
      updateStopLogoVisibility();
    }, 200);
  }

  function getChatInput(panel) {
    const root = panel || document;
    return root.querySelector("input[type='text'], input:not([type]), textarea");
  }

  function clearChatInputField(panel) {
    const input = getChatInput(panel);
    if (input) {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function lockAndClearAfterVoiceSend(panel) {
    blockVoiceInputUntil = Date.now() + 900;
    clearChatInputField(panel);
    [60, 180, 400, 750].forEach(ms => {
      setTimeout(() => clearChatInputField(panel), ms);
    });
  }

  function ensureStopLogoButton() {
    const panel = Array.from(document.querySelectorAll("div, section, aside")).find(el => {
      const t = el.innerText || "";
      return t.includes("DareCore Intelligence") && t.includes("Enviar");
    });
    if (!panel) return;

    const buttons = Array.from(panel.querySelectorAll("button"));
    const sendBtn = buttons.find(b => (b.textContent || "").trim().toLowerCase() === "enviar");
    if (sendBtn) {
      sendBtn.style.setProperty("display", "inline-flex", "important");
      sendBtn.style.setProperty("align-items", "center", "important");
      sendBtn.style.setProperty("justify-content", "center", "important");
      sendBtn.style.setProperty("opacity", "1", "important");
      sendBtn.style.setProperty("visibility", "visible", "important");
      sendBtn.style.setProperty("flex-shrink", "0", "important");
      sendBtn.style.setProperty("min-width", "68px", "important");
      sendBtn.style.setProperty("padding", "8px 14px", "important");
    }

    let stopBtn = document.getElementById("dcStopVoiceLogoBtn");
    if (!stopBtn) {
      stopBtn = document.createElement("button");
      stopBtn.id = "dcStopVoiceLogoBtn";
      stopBtn.type = "button";
      stopBtn.setAttribute("aria-label", "Detener voz");
      stopBtn.title = "Detener voz";
      stopBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2.5"></rect></svg>';
      stopBtn.style.cssText = [
        "display:none",
        "align-items:center",
        "justify-content:center",
        "width:34px",
        "height:34px",
        "border-radius:50%",
        "border:1px solid rgba(255,255,255,0.22)",
        "background:#ea580c",
        "color:#ffffff",
        "cursor:pointer",
        "flex-shrink:0",
        "margin-right:6px"
      ].join(";");
      stopBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        stopAllSpeech();
      }, true);

      if (sendBtn && sendBtn.parentElement) {
        sendBtn.parentElement.insertBefore(stopBtn, sendBtn);
      }
    }
    updateStopLogoVisibility();
  }

  function triggerSendInPanel() {
    const panel = Array.from(document.querySelectorAll("div, section, aside")).find(el => {
      const t = el.innerText || "";
      return t.includes("DareCore Intelligence") && t.includes("Enviar");
    });
    if (!panel) return;
    const input = getChatInput(panel);
    if (!input || !(input.value || "").trim()) return;

    const form = input.closest("form");
    const sendBtn = Array.from(panel.querySelectorAll("button")).find(b => (b.textContent || "").trim().toLowerCase() === "enviar");

    lastInputWasVoice = true;
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.click();
    } else if (form) {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    } else {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true }));
    }

    lockAndClearAfterVoiceSend(panel);
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR && !SR.__dcSyncVoicePatched) {
    const OrigSR = SR;
    function SyncVoiceSR() {
      const rec = new OrigSR();
      rec.lang = "es-MX";
      rec.interimResults = true;
      let latestTranscript = "";
      let sentForSession = false;

      rec.addEventListener("start", () => {
        lastInputWasVoice = true;
        blockVoiceInputUntil = 0;
        latestTranscript = "";
        sentForSession = false;
        stopAllSpeech();
      });

      rec.addEventListener("result", (e) => {
        if (Date.now() < blockVoiceInputUntil) {
          clearChatInputField();
          return;
        }
        lastInputWasVoice = true;
        let combined = "";
        let hasFinal = false;
        for (let i = 0; i < e.results.length; i++) {
          combined += e.results[i][0].transcript + " ";
          if (e.results[i].isFinal) hasFinal = true;
        }
        latestTranscript = combined.trim();

        const panel = Array.from(document.querySelectorAll("div, section, aside")).find(el => {
          const t = el.innerText || "";
          return t.includes("DareCore Intelligence") && t.includes("Enviar");
        });
        const input = getChatInput(panel);
        if (input && latestTranscript && !sentForSession) {
          input.value = latestTranscript;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }

        if (hasFinal && latestTranscript && !sentForSession) {
          sentForSession = true;
          setTimeout(() => {
            triggerSendInPanel();
          }, 100);
        }
      });

      rec.addEventListener("end", () => {
        if (latestTranscript && !sentForSession) {
          sentForSession = true;
          setTimeout(() => {
            triggerSendInPanel();
          }, 100);
        } else if (sentForSession) {
          lockAndClearAfterVoiceSend();
        }
      });

      return rec;
    }
    SyncVoiceSR.prototype = OrigSR.prototype;
    SyncVoiceSR.__dcSyncVoicePatched = true;
    window.SpeechRecognition = SyncVoiceSR;
    window.webkitSpeechRecognition = SyncVoiceSR;
  }

  document.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest ? e.target.closest("button") : null;
    if (!btn) return;
    if (btn.id === "dcStopVoiceLogoBtn") {
      e.preventDefault();
      e.stopPropagation();
      stopAllSpeech();
      return;
    }
    const label = ((btn.textContent || "") + " " + (btn.getAttribute("aria-label") || "") + " " + (btn.title || "")).toLowerCase();
    if (label.includes("enviar") || btn.type === "submit") {
      lastInputWasVoice = false;
      stopAllSpeech();
    }
  }, true);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const active = document.activeElement;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
        lastInputWasVoice = false;
        stopAllSpeech();
      }
    }
  }, true);

  const origFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : (input && input.url) || "";
    if (url.includes("api.groq.com/openai/v1/chat/completions")) {
      const speakThisTurn = lastInputWasVoice;
      lastInputWasVoice = false;
      if (speakThisTurn) {
        lockAndClearAfterVoiceSend();
      } else {
        stopAllSpeech();
      }

      const res = await origFetch("/api/groq", {
        method: (init && init.method) || "POST",
        headers: { "Content-Type": "application/json" },
        body: init && init.body
      });

      if (speakThisTurn && res.ok) {
        res.clone().json().then(data => {
          const txt = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
          if (txt) {
            speakSimultaneously(txt);
            lockAndClearAfterVoiceSend();
          }
        }).catch(() => {});
      } else if (!speakThisTurn) {
        setTimeout(() => clearChatInputField(), 60);
      }

      return res;
    }

    if (url.includes("api.groq.com/openai/v1/models")) {
      return new Response(JSON.stringify({
        data: [
          { id: "llama-3.3-70b-versatile" },
          { id: "openai/gpt-oss-20b" }
        ]
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return origFetch(input, init);
  };

  setInterval(updateStopLogoVisibility, 250);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureStopLogoButton);
  } else {
    ensureStopLogoButton();
  }
  new MutationObserver(ensureStopLogoButton).observe(document.body || document.documentElement, { childList: true, subtree: true });
})();
/* DC_SYNC_MIC_VOICE_AND_STOP_END */
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
    const TEXT_MODELS = ["llama-3.3-70b-versatile", "openai/gpt-oss-20b"];

    const SYSTEM_PROMPT = `Eres DareCore Intelligence, el asistente de IA oficial de Dare Core.
Dare Core es una marca local en León, Guanajuato, dedicada a la creación y venta de ropa urbana y playeras personalizadas 100 % de algodón.

Lo que ofrecen:
- Prendas básicas y estilo urbano: fabrican playeras (incluyendo cortes oversize y sin mangas) elaboradas en algodón suave.
- Personalización completa: estampan diseños exclusivos, frases o detalles a petición del cliente.

Responde siempre en español, de forma clara, directa, breve y amable, basándote únicamente en esta información y en el catálogo actual de la tienda.
No uses emojis ni asteriscos dobles (**). Escribe solo texto plano limpio.
Para dudas sobre envios, tiempos de entrega o pedidos personalizados en Dare Core (Leon, Guanajuato), orienta al cliente indicando que puede revisar los detalles en la tienda o contactar a Dare Core para confirmar tiempos y cobertura segun su ubicacion.`;

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

        try {
            const res = await fetch("https://api.groq.com/openai/v1/models", {
                headers: { "Authorization": "Bearer " + GROQ_API_KEY }
            });
            const data = await res.json();
            if (Array.isArray(data?.data)) {
                for (const item of data.data) {
                    const id = item?.id;
                    if (!id) continue;
                    const isAudioOrSpeechOrGuard = /whisper|tts|orpheus|audio|guard|embed|safeguard|prompt/i.test(id);
                    if (!isAudioOrSpeechOrGuard && !candidates.includes(id)) {
                        candidates.push(id);
                    }
                }
            }
        } catch (e) {
            // Continúa con los modelos de texto predefinidos
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





// === DC_VOICE_CHAT_START ===
(function () {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis || null;
  let activeAudioEl = null;

  const MIC_SVG = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3"></rect>
      <path d="M5 10v1a7 7 0 0 0 14 0v-1"></path>
      <line x1="12" y1="18" x2="12" y2="22"></line>
    </svg>
  `;

  let awaitingBotReplyForVoice = false;
  let lastUserPromptSent = "";
  let spokenTextsHistory = new Set();

  function stopSpeakingNow() {
    if (synth) {
      try { synth.cancel(); } catch (e) {}
    }
    if (activeAudioEl) {
      try {
        activeAudioEl.pause();
        activeAudioEl.currentTime = 0;
      } catch (e) {}
      activeAudioEl = null;
    }
  }

  function normalizeText(str) {
    return String(str || "")
      .replace(/\*\*/g, "")
      .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
      .replace(/\uFE0F/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isIgnoredText(str) {
    const clean = normalizeText(str);
    const low = clean.toLowerCase();
    if (!clean || clean.length < 2) return true;
    if (
      low.includes("generando respuesta") ||
      low.includes("generando...") ||
      low.includes("pensando") ||
      low.includes("escribiendo") ||
      clean === "..." ||
      clean === "•••"
    ) {
      return true;
    }
    if (
      clean === "Enviar" ||
      clean === "DareCore Intelligence" ||
      clean === "AI ASSISTANT • GROQ" ||
      low.startsWith("hola. soy darecore intelligence")
    ) {
      return true;
    }
    if (lastUserPromptSent && low === normalizeText(lastUserPromptSent).toLowerCase()) {
      return true;
    }
    return false;
  }

  function pickNaturalSpanishVoice() {
    if (!synth || !synth.getVoices) return null;
    const voices = synth.getVoices() || [];
    const esVoices = voices.filter(v => /^es([-_]|$)/i.test(v.lang || ""));
    if (!esVoices.length) return null;

    const scored = esVoices.map(v => {
      const n = (v.name || "").toLowerCase();
      const l = (v.lang || "").toLowerCase();
      let score = 0;
      if (n.includes("natural") || n.includes("neural") || n.includes("online")) score += 100;
      if (n.includes("google español")) score += 75;
      if (n.includes("dalia") || n.includes("jorge") || n.includes("paulina") || n.includes("alonso")) score += 50;
      if (l.includes("es-mx") || l.includes("es-419") || l.includes("es-us")) score += 25;
      return { voice: v, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0] ? scored[0].voice : esVoices[0];
  }

  async function speakGeneratedReply(rawText) {
    const clean = normalizeText(rawText);
    if (!clean || isIgnoredText(clean)) return;

    stopSpeakingNow();

    if (typeof window.DC_CUSTOM_TTS === "function") {
      try {
        const audioOut = await window.DC_CUSTOM_TTS(clean);
        if (audioOut) {
          const url = typeof audioOut === "string" ? audioOut : URL.createObjectURL(audioOut);
          activeAudioEl = new Audio(url); activeAudioEl.preservesPitch = true; activeAudioEl.playbackRate = 1.04; await activeAudioEl.play();
          return;
        }
      } catch (e) {}
    }

    if (!synth) return;

    try {
      const voice = pickNaturalSpanishVoice();
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = voice ? voice.lang : "es-MX";
      if (voice) utter.voice = voice;
      utter.rate = 1.0;
      utter.pitch = 1.0;
      utter.volume = 1.0;
      synth.speak(utter);
    } catch (e) {}
  }

  function findChatMessagesContainer(inputEl) {
    if (!inputEl) return document.body;
    let cur = inputEl.parentElement;
    for (let i = 0; i < 6 && cur; i++) {
      const scrollCandidate = cur.previousElementSibling || cur.parentElement;
      if (scrollCandidate && scrollCandidate.scrollHeight >= 0) {
        const hasMessages = scrollCandidate.querySelectorAll("div, p").length >= 2;
        if (hasMessages) return scrollCandidate;
      }
      cur = cur.parentElement;
    }
    return document.body;
  }

  function extractLatestAssistantBubbleText(chatRoot) {
    if (!chatRoot) return "";
    // Busca bloques/burbujas directas o de nivel superior dentro del contenedor del chat
    const bubbles = Array.from(chatRoot.children).filter(el => {
      if (!el || el.id === "dcChatGeminiMicBtn") return false;
      const txt = normalizeText(el.innerText || el.textContent || "");
      return txt.length > 0;
    });

    const pool = bubbles.length ? bubbles : Array.from(chatRoot.querySelectorAll("div, p"));
    for (let i = pool.length - 1; i >= 0; i--) {
      const b = pool[i];
      const fullTxt = normalizeText(b.innerText || b.textContent || "");
      if (!fullTxt || isIgnoredText(fullTxt)) continue;
      // Evita tomar un contenedor padre gigante que abarque todo el historial
      if (fullTxt.length > 1800) continue;
      return fullTxt;
    }
    return "";
  }

  function observeBotReplies(inputEl) {
    if (window.__dcVoiceReplyObserverAttached) return;
    window.__dcVoiceReplyObserverAttached = true;

    let speakTimer = null;

    const observer = new MutationObserver(() => {
      const micBtn = document.getElementById("dcChatGeminiMicBtn");
      const userStillSpeaking = micBtn && micBtn.dataset.userSpeaking === "1";
      if (userStillSpeaking || !awaitingBotReplyForVoice) return;

      const chatRoot = findChatMessagesContainer(inputEl);
      const latestText = extractLatestAssistantBubbleText(chatRoot);
      if (!latestText || isIgnoredText(latestText)) return;

      const key = latestText.toLowerCase();
      if (spokenTextsHistory.has(key)) return;

      clearTimeout(speakTimer);
      speakTimer = setTimeout(() => {
        const currentBtn = document.getElementById("dcChatGeminiMicBtn");
        if (currentBtn && currentBtn.dataset.userSpeaking === "1") return;
        const settledText = extractLatestAssistantBubbleText(findChatMessagesContainer(inputEl));
        const settledClean = normalizeText(settledText);
        if (!settledClean || isIgnoredText(settledClean)) return;
        const settledKey = settledClean.toLowerCase();
        if (spokenTextsHistory.has(settledKey)) return;

        spokenTextsHistory.add(settledKey);
        awaitingBotReplyForVoice = false;
        speakGeneratedReply(settledClean);
      }, 500);
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function findChatInputAndSend() {
    const inputs = Array.from(document.querySelectorAll("input, textarea")).filter(el => {
      if (el.type === "hidden" || el.type === "checkbox" || el.type === "radio") return false;
      const ph = (el.getAttribute("placeholder") || "").toLowerCase();
      return ph.includes("prendas") || ph.includes("tallas") || ph.includes("envíos") || ph.includes("envios") || ph.includes("pregunta");
    });
    const input = inputs[inputs.length - 1] || null;
    if (!input) return null;

    const container = input.parentElement;
    if (!container) return null;

    const sendBtn = Array.from(container.querySelectorAll("button")).find(b => b.id !== "dcChatGeminiMicBtn");
    return { input, container, sendBtn };
  }

  function mountChatMic() {
    const found = findChatInputAndSend();
    if (!found || !found.container) return;
    observeBotReplies(found.input);
    if (document.getElementById("dcChatGeminiMicBtn")) return;

    const micBtn = document.createElement("button");
    micBtn.type = "button";
    micBtn.id = "dcChatGeminiMicBtn";
    micBtn.setAttribute("aria-label", "Hablar con DareCore Intelligence");
    micBtn.title = "Hablar con voz";
    micBtn.innerHTML = MIC_SVG;
    micBtn.dataset.userSpeaking = "0";

    const styleIdle = () => {
      micBtn.style.setProperty("width", "38px", "important");
      micBtn.style.setProperty("height", "38px", "important");
      micBtn.style.setProperty("min-width", "38px", "important");
      micBtn.style.setProperty("padding", "0", "important");
      micBtn.style.setProperty("margin-right", "6px", "important");
      micBtn.style.setProperty("border-radius", "999px", "important");
      micBtn.style.setProperty("background", "#ffffff", "important");
      micBtn.style.setProperty("background-color", "#ffffff", "important");
      micBtn.style.setProperty("color", "#111115", "important");
      micBtn.style.setProperty("border", "1.5px solid #ff2a00", "important");
      micBtn.style.setProperty("box-shadow", "0 0 10px rgba(255,42,0,0.35)", "important");
      micBtn.style.setProperty("display", "inline-flex", "important");
      micBtn.style.setProperty("align-items", "center", "important");
      micBtn.style.setProperty("justify-content", "center", "important");
      micBtn.style.setProperty("cursor", "pointer", "important");
    };

    const styleListening = () => {
      micBtn.style.setProperty("width", "38px", "important");
      micBtn.style.setProperty("height", "38px", "important");
      micBtn.style.setProperty("min-width", "38px", "important");
      micBtn.style.setProperty("padding", "0", "important");
      micBtn.style.setProperty("margin-right", "6px", "important");
      micBtn.style.setProperty("border-radius", "999px", "important");
      micBtn.style.setProperty("background", "#ff2a00", "important");
      micBtn.style.setProperty("background-color", "#ff2a00", "important");
      micBtn.style.setProperty("color", "#ffffff", "important");
      micBtn.style.setProperty("border", "1.5px solid #ff2a00", "important");
      micBtn.style.setProperty("box-shadow", "0 0 0 4px rgba(255,42,0,0.25), 0 0 18px rgba(255,42,0,0.8)", "important");
      micBtn.style.setProperty("display", "inline-flex", "important");
      micBtn.style.setProperty("align-items", "center", "important");
      micBtn.style.setProperty("justify-content", "center", "important");
      micBtn.style.setProperty("cursor", "pointer", "important");
    };

    styleIdle();

    if (found.sendBtn) {
      found.container.insertBefore(micBtn, found.sendBtn);
    } else {
      found.container.appendChild(micBtn);
    }

    if (!SpeechRecognition) {
      micBtn.disabled = true;
      micBtn.style.setProperty("opacity", "0.45", "important");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-MX";
    recognition.continuous = true;
    recognition.interimResults = true;

    let listening = false;
    let committedText = "";
    let finishSpeechTimer = null;

    function flushAndSend() {
      clearTimeout(finishSpeechTimer);
      const finalPayload = (found.input.value || committedText || "").trim();
      listening = false;
      micBtn.dataset.userSpeaking = "0";
      styleIdle();
      try { recognition.stop(); } catch (e) {}

      if (finalPayload && found.sendBtn) {
        lastUserPromptSent = finalPayload;
        awaitingBotReplyForVoice = true;
        found.input.value = finalPayload;
        found.input.dispatchEvent(new Event("input", { bubbles: true }));
        found.sendBtn.click();
      }
    }

    recognition.onspeechstart = function () {
      stopSpeakingNow();
      clearTimeout(finishSpeechTimer);
    };

    recognition.onresult = function (event) {
      stopSpeakingNow();
      clearTimeout(finishSpeechTimer);

      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const tr = event.results[i][0].transcript || "";
        if (event.results[i].isFinal) {
          finalChunk += tr;
        } else {
          interimChunk += tr;
        }
      }

      if (finalChunk.trim()) {
        committedText = (committedText ? committedText + " " : "") + finalChunk.trim();
      }

      const liveText = (committedText + (interimChunk.trim() ? " " + interimChunk.trim() : "")).trim();
      found.input.value = liveText;
      found.input.dispatchEvent(new Event("input", { bubbles: true }));

      if (liveText) {
        finishSpeechTimer = setTimeout(() => {
          flushAndSend();
        }, 1700);
      }
    };

    recognition.onerror = function () {
      clearTimeout(finishSpeechTimer);
      listening = false;
      micBtn.dataset.userSpeaking = "0";
      styleIdle();
    };

    recognition.onend = function () {
      if (listening) {
        flushAndSend();
      } else {
        micBtn.dataset.userSpeaking = "0";
        styleIdle();
      }
    };

    micBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      stopSpeakingNow();

      if (!listening) {
        committedText = "";
        found.input.value = "";
        found.input.dispatchEvent(new Event("input", { bubbles: true }));
        listening = true;
        micBtn.dataset.userSpeaking = "1";
        styleListening();
        try {
          recognition.start();
        } catch (err) {
          listening = false;
          micBtn.dataset.userSpeaking = "0";
          styleIdle();
        }
      } else {
        flushAndSend();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountChatMic);
  } else {
    mountChatMic();
  }
  setInterval(mountChatMic, 500);
})();
// === DC_VOICE_CHAT_END ===
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