/* DARECORE HARD ONE-SHOT EMAIL GUARD */
(function () {
  if (window.__dcHardOneShotEmailGuard) return;
  window.__dcHardOneShotEmailGuard = true;

  const DONE_KEYS = new Set();

  function makeMailKey(folio, email, status) {
    const f = String(folio || "").replace(/^#/, "").trim().toUpperCase();
    const e = String(email || "").trim().toLowerCase();
    const s = String(status || "").trim().toLowerCase();
    return (f || "ORDER") + "::" + (e || "MAIL") + "::" + (s || "STATUS");
  }

  function isAlreadyDone(key) {
    if (DONE_KEYS.has(key)) return true;
    try {
      if (sessionStorage.getItem("dc_oneshot_" + key) === "1") return true;
    } catch (_) {}
    DONE_KEYS.add(key);
    try {
      sessionStorage.setItem("dc_oneshot_" + key, "1");
    } catch (_) {}
    return false;
  }

  function hookTransport() {
    if (typeof window.triggerAutomatedEmail === "function" && !window.triggerAutomatedEmail.__dcOneShot) {
      const prevFn = window.triggerAutomatedEmail;
      window.triggerAutomatedEmail = function (data) {
        const d = data || {};
        const txt = String(d.status || d.subject || d.message || "");
        const isOrderMail = /estatus de tu pedido|actualizaci[oó]n de tu pedido|enviado|en proceso|pendiente|listo para enviar|paquete/i.test(txt);
        if (isOrderMail && !/enviado|shipped|paquete.*enviado/i.test(txt)) {
          return Promise.resolve({ blocked: true, reason: "NOT_SHIPPED" });
        }
        const k = makeMailKey(d.folio || d.orderNumber || d.purchaseNumber, d.to || d.to_email || d.email, "enviado");
        if (isAlreadyDone(k)) {
          return Promise.resolve({ blocked: true, reason: "ALREADY_SENT_ONCE" });
        }
        return prevFn.apply(this, arguments);
      };
      window.triggerAutomatedEmail.__dcOneShot = true;
    }

    if (window.emailjs && typeof window.emailjs.send === "function" && !window.emailjs.__dcOneShot) {
      const prevSend = window.emailjs.send.bind(window.emailjs);
      window.emailjs.send = function (serviceId, templateId, templateParams, publicKey) {
        const tp = templateParams || {};
        const txt = String(tp.status || tp.subject || tp.message || "");
        const isOrderMail = /estatus de tu pedido|actualizaci[oó]n de tu pedido|enviado|en proceso|pendiente|listo para enviar|paquete/i.test(txt);
        if (isOrderMail && !/enviado|shipped|paquete.*enviado/i.test(txt)) {
          return Promise.resolve({ status: 200, text: "BLOCKED_NOT_SHIPPED" });
        }
        const k = makeMailKey(tp.folio || tp.order_id, tp.to_email || tp.email || tp.to, "enviado");
        if (isAlreadyDone(k)) {
          return Promise.resolve({ status: 200, text: "BLOCKED_DUPLICATE" });
        }
        return prevSend(serviceId, templateId, templateParams, publicKey);
      };
      window.emailjs.__dcOneShot = true;
    }
  }

  hookTransport();
  const poll = setInterval(hookTransport, 50);
  setTimeout(function () { clearInterval(poll); }, 10000);
})();
(function () {
  const AI_KB_KEY = "darecore_ai_knowledge";
  const GUEST_EMAIL_KEY = "darecore_guest_email";
  const GUEST_NAME_KEY = "darecore_guest_name";
  const EMAIL_GATE_KEY = "darecore_customer_email";
  const EMAILJS_PUBLIC_KEY = "";
  const EMAILJS_SERVICE_ID = "";
  const EMAILJS_TEMPLATE_ID = "";

  function getDb() {
    if (window.db) return window.db;
    if (typeof firebase !== "undefined" && firebase.firestore) {
      window.db = firebase.firestore();
      return window.db;
    }
    return null;
  }

  function normalizeEmail(email) {
    return (email || "").trim().toLowerCase();
  }

  function docIdFromEmail(email) {
    const clean = normalizeEmail(email);
    return clean ? "user_" + clean.replace(/[^a-z0-9]/g, "_") : "";
  }

  const CORRUPT_PAIRS = [
    ["\u00C3\u00A1", "\u00E1"], ["\u00C3\u00A9", "\u00E9"], ["\u00C3\u00AD", "\u00ED"],
    ["\u00C3\u00B3", "\u00F3"], ["\u00C3\u00BA", "\u00FA"], ["\u00C3\u0081", "\u00C1"],
    ["\u00C3\u2030", "\u00C9"], ["\u00C3\u008D", "\u00CD"], ["\u00C3\u201C", "\u00D3"],
    ["\u00C3\u0161", "\u00DA"], ["\u00C3\u00B1", "\u00F1"], ["\u00C3\u2018", "\u00D1"],
    ["\u00C3\u00BC", "\u00FC"], ["\u00C3\u0153", "\u00DC"], ["\u00E2\u20AC\u00A2", "\u2022"],
    ["\u00E2\u20AC\u009D", "\u2014"], ["\u00E2\u20AC\u009C", "\u2013"], ["\u00E2\u20AC\u02DC", "\u2018"],
    ["\u00E2\u20AC\u2122", "\u2019"], ["\u00E2\u20AC\u0153", "\u201C"], ["\u00E2\u20AC\u009D", "\u201D"],
    ["\u00C2\u00BF", "\u00BF"], ["\u00C2\u00A1", "\u00A1"], ["\u00C2\u00B0", "\u00B0"],
    ["\u00C2\u00B7", "\u00B7"]
  ];

  function cleanMojibake(str) {
    if (typeof str !== "string" || !str) return str;
    let out = str;
    for (let pass = 0; pass < 3; pass++) {
      let changed = false;
      for (const [bad, good] of CORRUPT_PAIRS) {
        if (out.includes(bad)) {
          out = out.split(bad).join(good);
          changed = true;
        }
      }
      if (!changed) break;
    }
    return out;
  }

  function scrubDomMojibake(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && /[\u00C3\u00C2\u00E2]/.test(node.nodeValue)) {
        const fixed = cleanMojibake(node.nodeValue);
        if (fixed !== node.nodeValue) node.nodeValue = fixed;
      }
    }
    root.querySelectorAll("[placeholder],[title]").forEach((el) => {
      ["placeholder", "title"].forEach((attr) => {
        const val = el.getAttribute(attr);
        if (val && /[\u00C3\u00C2\u00E2]/.test(val)) {
          el.setAttribute(attr, cleanMojibake(val));
        }
      });
    });
  }

  function autoDismissToasts() {
    const candidates = Array.from(document.querySelectorAll("div, span, p"));
    candidates.forEach((el) => {
      if (el.id === "dc-user-email-bar" || el.closest("#dc-user-email-bar")) return;
      if (el.children.length > 2) return;
      const txt = (el.textContent || "").trim();
      if (!txt || txt.length > 220) return;
      const style = getComputedStyle(el);
      const isFloating = style.position === "fixed" || style.position === "absolute";
      const isToastText = /estatus actualizado|notificación enviada|guardado|actualizado|eliminado|archivado/i.test(txt);

      if (isFloating && isToastText && !el.dataset.dcToastTimer) {
        el.dataset.dcToastTimer = "1";
        setTimeout(() => {
          try {
            el.style.transition = "opacity 0.25s ease";
            el.style.opacity = "0";
            setTimeout(() => {
              if (el && el.parentElement) el.remove();
            }, 260);
          } catch (_) {}
        }, 3500);
      }
    });
  }

  function getActiveCustomer() {
    const authUser =
      (typeof firebase !== "undefined" && firebase.auth && firebase.auth().currentUser) ||
      window.auth?.currentUser;
    if (authUser && authUser.email) {
      const em = normalizeEmail(authUser.email);
      return {
        uid: docIdFromEmail(em),
        email: em,
        name: cleanMojibake(authUser.displayName || em.split("@")[0]),
        method: "Google"
      };
    }
    const guestEmail = normalizeEmail(
      localStorage.getItem(EMAIL_GATE_KEY) ||
        localStorage.getItem(GUEST_EMAIL_KEY) ||
        localStorage.getItem("darecore_user_email") ||
        sessionStorage.getItem(GUEST_EMAIL_KEY) ||
        ""
    );

    if (guestEmail && guestEmail.includes("@")) {
      return {
        uid: docIdFromEmail(guestEmail),
        email: guestEmail,
        name: cleanMojibake(localStorage.getItem(GUEST_NAME_KEY) || guestEmail.split("@")[0]),
        method: "Correo manual"
      };
    }
    return null;
  }

  async function deduplicateUsersCollection() {
    const db = getDb();
    if (!db || window.__dcDedupRunning) return;
    window.__dcDedupRunning = true;
    try {
      const snap = await db.collection("users").get();
      const byEmail = new Map();
      snap.forEach((docSnap) => {
        const d = docSnap.data() || {};
        const em = normalizeEmail(d.email);
        if (!em || !em.includes("@")) return;
        const canonicalId = docIdFromEmail(em);
        const existing = byEmail.get(em);
        if (!existing) {
          byEmail.set(em, { id: docSnap.id, data: d, canonicalId });
        } else {
          const keepCurrent = docSnap.id === canonicalId;
          if (keepCurrent) {
            db.collection("users").doc(existing.id).delete().catch(() => {});
            byEmail.set(em, { id: docSnap.id, data: d, canonicalId });
          } else {
            db.collection("users").doc(docSnap.id).delete().catch(() => {});
          }
        }
      });

      for (const [em, entry] of byEmail.entries()) {
        if (entry.id !== entry.canonicalId) {
          await db.collection("users").doc(entry.canonicalId).set(
            {
              uid: entry.canonicalId,
              email: em,
              name: cleanMojibake(entry.data.name || em.split("@")[0]),
              loginMethod: entry.data.loginMethod || "Google",
              lastLogin: entry.data.lastLogin || new Date().toISOString()
            },
            { merge: true }
          );
          await db.collection("users").doc(entry.id).delete().catch(() => {});
        }
      }
    } catch (_) {}
    window.__dcDedupRunning = false;
  }

  async function syncCustomerToFirestore(customEmail, customName, method) {
    const db = getDb();
    if (!db) return;
    const customer = customEmail
      ? {
          uid: docIdFromEmail(customEmail),
          email: normalizeEmail(customEmail),
          name: cleanMojibake(customName || customEmail.split("@")[0]),
          method: method || "Correo manual"
        }
      : getActiveCustomer();

    if (!customer || !customer.email || !customer.uid) return;

    try {
      const docRef = db.collection("users").doc(customer.uid);
      const prev = await docRef.get();
      const prevData = prev.exists ? prev.data() : {};

      await docRef.set(
        {
          uid: customer.uid,
          email: customer.email,
          name:
            prevData.name && prevData.name !== customer.email.split("@")[0]
              ? prevData.name
              : customer.name,
          loginMethod: prevData.loginMethod === "Google" ? "Google" : customer.method,
          lastLogin: new Date().toISOString()
        },
        { merge: true }
      );
      deduplicateUsersCollection();
    } catch (_) {}
  }

  function patchUserCollectionUniqueness() {
    const db = getDb();
    if (!db || db.__dcUsersPatched) return;
    db.__dcUsersPatched = true;

    const origCol = db.collection.bind(db);
    db.collection = function (colName) {
      const ref = origCol(colName);
      if (colName === "users") {
        const origDoc = ref.doc.bind(ref);
        ref.doc = function (id) {
          const docRef = origDoc(id);
          const origSet = docRef.set.bind(docRef);
          docRef.set = function (data, opts) {
            if (data && data.email) {
              const canonId = docIdFromEmail(data.email);
              if (canonId && id !== canonId) {
                const merged = Object.assign({}, data, {
                  uid: canonId,
                  email: normalizeEmail(data.email),
                  name: cleanMojibake(data.name || "")
                });
                return origDoc(canonId).set(merged, opts || { merge: true });
              }
            }
            return origSet(data, opts);
          };
          return docRef;
        };
      }
      if (colName === "orders" || colName === "darelab_orders") {
        const origAdd = ref.add.bind(ref);
        ref.add = function (data) {
          const customer = getActiveCustomer();
          const enriched = Object.assign({}, data);
          if (customer && (!enriched.userEmail || /invitado/i.test(enriched.userEmail))) {
            enriched.userEmail = customer.email;
            enriched.userName = customer.name;
          }
          if (enriched.userEmail) enriched.userEmail = normalizeEmail(enriched.userEmail);
          if (!enriched.createdAt) enriched.createdAt = new Date().toISOString();
          if (enriched.userEmail && !/invitado/i.test(enriched.userEmail)) {
            syncCustomerToFirestore(enriched.userEmail, enriched.userName);
          }
          return origAdd(enriched);
        };
      }
      return ref;
    };
  }

  const origSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (k, v) {
    origSetItem(k, v);
    if (/email/i.test(k) && typeof v === "string" && v.includes("@")) {
      const cleanEm = normalizeEmail(v);
      origSetItem(GUEST_EMAIL_KEY, cleanEm);
      syncCustomerToFirestore(cleanEm, null, "Correo manual");
    }
  };

  document.addEventListener(
    "submit",
    (e) => {
      const emailInput =
        e.target.querySelector &&
        e.target.querySelector('input[type="email"], input[id*="email" i], input[placeholder*="correo" i]');
      if (emailInput && emailInput.value && emailInput.value.includes("@")) {
        const em = normalizeEmail(emailInput.value);
        origSetItem(GUEST_EMAIL_KEY, em);
        syncCustomerToFirestore(em, null, "Correo manual");
      }
    },
    true
  );

  function handleOneClickLogout(e) {
    const target = e.target.closest("#dc-logout-email-btn, button, a");
    if (!target) return;
    const label = (target.textContent || "").trim().toLowerCase();
    if (target.id === "dc-logout-email-btn" || label === "cerrar sesión" || label === "cerrar sesion") {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

      [
        EMAIL_GATE_KEY,
        GUEST_EMAIL_KEY,
        GUEST_NAME_KEY,
        "darecore_user_email",
        "darecore_user_name",
        "darecore_guest_verified",
        "darecore_session_email",
        "darecore_active_client_view"
      ].forEach((key) => {
        try { localStorage.removeItem(key); } catch (_) {}
        try { sessionStorage.removeItem(key); } catch (_) {}
      });

      const bar = document.getElementById("dc-user-email-bar") || target.closest("div");
      if (bar && bar.id === "dc-user-email-bar") {
        bar.remove();
      }

      const authObj =
        (typeof firebase !== "undefined" && firebase.auth && firebase.auth()) ||
        window.auth;

      const finishLogout = () => {
        window.location.reload();
      };

      if (authObj && typeof authObj.signOut === "function") {
        authObj.signOut().then(finishLogout).catch(finishLogout);
        setTimeout(finishLogout, 400);
      } else {
        finishLogout();
      }
    }
  }

  document.addEventListener("click", handleOneClickLogout, true);

  async function sendOrderStatusEmail(orderData, collectionName, docId, newStatus) {
    const toEmail = normalizeEmail(orderData.userEmail || "");
    if (!toEmail || !toEmail.includes("@") || /invitado/i.test(toEmail)) return;

    const folio = orderData.purchaseNumber || orderData.orderNumber || docId;
    const customerName = cleanMojibake(orderData.userName || toEmail.split("@")[0]);
    const itemsSummary =
      collectionName === "darelab_orders"
        ? `Personalizado Dare Lab: ${cleanMojibake(orderData.baseName || "Prenda")} (${cleanMojibake(orderData.size || "")})`
        : Array.isArray(orderData.items)
        ? orderData.items.map((i) => `${i.qty}x ${cleanMojibake(i.name)}`).join(", ")
        : "Pedido DareCore";

    const subject = `Actualización de tu pedido #${folio} - DareCore Store`;
    const message =
      `Hola ${customerName},\n\n` +
      `El estatus de tu pedido #${folio} en DareCore Store se ha actualizado a:\n` +
      `>>> ${newStatus.toUpperCase()} <<<\n\n` +
      `Detalle: ${itemsSummary}\n` +
      (orderData.total ? `Total: $${Number(orderData.total).toLocaleString("es-MX")} MXN\n\n` : "\n") +
      `Puedes revisar el seguimiento en tiempo real entrando a nuestra tienda con tu correo (${toEmail}):\n` +
      `${window.location.origin}\n\n` +
      `Gracias por vestir DareCore.`;

    if (typeof window.triggerAutomatedEmail === "function") {
      await window.triggerAutomatedEmail({
        type: "order_status_updated",
        recipients: [toEmail],
        to: toEmail,
        folio: folio,
        status: newStatus,
        subject: subject,
        message: message
      });
    }

    if (EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && window.emailjs) {
      try {
        window.emailjs.init(EMAILJS_PUBLIC_KEY);
        await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_email: toEmail,
          to_name: customerName,
          folio: folio,
          status: newStatus,
          items: itemsSummary,
          subject: subject,
          message: message
        });
      } catch (_) {}
    }
  }

  function wrapAdminStatusUpdater() {
    if (typeof window.updateOrderStatus === "function" && !window.updateOrderStatus.__dcWrapped) {
      const origUpdate = window.updateOrderStatus;
      window.updateOrderStatus = async function (collectionName, docId, newStatus) {
        const db = getDb();
        let orderSnapData = null;
        if (db && docId) {
          try {
            const snap = await db.collection(collectionName).doc(docId).get();
            if (snap.exists) orderSnapData = snap.data();
          } catch (_) {}
        }

        origUpdate(collectionName, docId, newStatus);

        if (orderSnapData) {
          await sendOrderStatusEmail(orderSnapData, collectionName, docId, newStatus);
        }
        setTimeout(autoDismissToasts, 50);
        setTimeout(autoDismissToasts, 3550);
      };
      window.updateOrderStatus.__dcWrapped = true;
    }
  }

  async function initAiKnowledgeSync() {
    const db = getDb();
    if (!db) return;

    try {
      const doc = await db.collection("settings").doc("aiKnowledge").get();
      if (doc.exists && doc.data() && typeof doc.data().text === "string" && doc.data().text.trim()) {
        const cloudText = cleanMojibake(doc.data().text.trim());
        origSetItem(AI_KB_KEY, cloudText);
        document.querySelectorAll("#darecoreAiKbTextarea").forEach((ta) => {
          ta.value = cloudText;
        });
      }
    } catch (_) {}

    document.addEventListener(
      "click",
      async (e) => {
        const btn = e.target.closest("#saveDarecoreAiKbBtn, button");
        if (!btn) return;
        if (!/guardar informaci/i.test(btn.textContent || "")) return;

        const textareas = Array.from(document.querySelectorAll("#darecoreAiKbTextarea, textarea"));
        const activeTa = textareas.find((t) => t.offsetParent !== null) || textareas[0];
        if (!activeTa) return;

        const newText = cleanMojibake(activeTa.value.trim());
        origSetItem(AI_KB_KEY, newText);
        textareas.forEach((t) => (t.value = newText));

        try {
          await db.collection("settings").doc("aiKnowledge").set(
            {
              text: newText,
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );
        } catch (err) {
          console.error("Error guardando IA en Firestore:", err);
        }
      },
      true
    );
  }

  function patchClientOrderLookup() {
    if (typeof window.fetchClientPendingOrders === "function" && !window.fetchClientPendingOrders.__dcWrapped) {
      const origFetch = window.fetchClientPendingOrders;
      window.fetchClientPendingOrders = async function () {
        await origFetch();
        const db = getDb();
        const customer = getActiveCustomer();
        if (!db || !customer || !customer.email) return;

        try {
          const [cartSnap, labSnap] = await Promise.all([
            db.collection("orders").where("userEmail", "==", customer.email).get(),
            db.collection("darelab_orders").where("userEmail", "==", customer.email).get()
          ]);
          const list = [];
          cartSnap.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              folio: data.purchaseNumber || d.id,
              type: "Carrito",
              summary: Array.isArray(data.items)
                ? data.items.map((i) => `${i.qty}x ${cleanMojibake(i.name)}`).join(", ")
                : "Compra en tienda",
              total: data.total || 0,
              status: data.status || "Pago pendiente",
              createdAt: data.createdAt || new Date().toISOString()
            });
          });
          labSnap.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              folio: data.orderNumber || d.id,
              type: "Dare Lab",
              summary: `${cleanMojibake(data.baseName || "Personalizado")} (${cleanMojibake(data.size || "")})`,
              total: data.total || 0,
              status: data.status || "Pago pendiente",
              createdAt: data.createdAt || new Date().toISOString()
            });
          });
          if (list.length > 0) {
            origSetItem("darecore_active_client_view", JSON.stringify(list));
            if (typeof window.renderClientPendingOrders === "function") {
              window.renderClientPendingOrders();
            }
          }
        } catch (_) {}
      };
      window.fetchClientPendingOrders.__dcWrapped = true;
    }
  }

  function extractOrderFolioFromText(raw) {
    const str = String(raw || "");
    const match =
      str.match(/(?:Folio|Pedido|Compra|Orden)\s*:?\s*#?([A-Za-z0-9_-]+)/i) ||
      str.match(/#(PEDIDO-[A-Za-z0-9_-]+|COMPRA-[A-Za-z0-9_-]+|[A-Za-z0-9_-]{4,})/i);
    if (match && match[1]) {
      return "#" + match[1].replace(/^#+/, "");
    }
    try {
      const orders = JSON.parse(localStorage.getItem("darecore_active_client_view") || "[]");
      if (Array.isArray(orders) && orders[0] && orders[0].folio) {
        const f = String(orders[0].folio).trim();
        return f.startsWith("#") ? f : "#" + f;
      }
    } catch (_) {}
    return "#PEDIDO";
  }

  function buildShortWhatsAppMessage(originalText) {
    const folio = extractOrderFolioFromText(originalText);
    return `Hola DareCore, me gustaría procesar el pago de mi pedido "${folio}"`;
  }

  function patchWhatsAppSameTab() {
    const phone = window.WHATSAPP_PHONE || "5214777035509";

    window.openWhatsAppWithMessage = function (message) {
  const __waEl = document.getElementById("customWhatsapp");
  if (__waEl) {
    const __digits = String(__waEl.value || "").replace(/\D+/g, "");
    if (__digits.length !== 10) {
      const __m = "Debes escribir tu número de WhatsApp de 10 dígitos para solicitar tu mockup digital.";
      if (typeof window.showFloatingToast === "function") { try { window.showFloatingToast(__m); } catch (_) {} } else { alert(__m); }
      __waEl.required = true;
      __waEl.style.setProperty("border", "2px solid #ef4444", "important");
      __waEl.style.setProperty("box-shadow", "0 0 0 3px rgba(239,68,68,0.28)", "important");
      try { __waEl.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (_) {}
      try { __waEl.focus(); } catch (_) {}
      return;
    }
  }
      const cleanMsg = buildShortWhatsAppMessage(message);
      const url = `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(cleanMsg)}`;
      window.location.assign(url);
    };

    const origWindowOpen = window.open.bind(window);
    window.open = function (url, target, features) {
      if (typeof url === "string" && /whatsapp\.com|wa\.me/i.test(url)) {
        try {
          const u = new URL(url, window.location.origin);
          const rawText = u.searchParams.get("text") || "";
          u.searchParams.set("text", buildShortWhatsAppMessage(rawText));
          window.location.assign(u.toString());
        } catch (_) {
          window.location.assign(url);
        }
        return null;
      }
      return origWindowOpen(url, target, features);
    };

    document.addEventListener(
      "click",
      (e) => {
        const link = e.target.closest("a[href*='whatsapp.com'], a[href*='wa.me']");
        if (!link) return;
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        try {
          const u = new URL(link.href, window.location.origin);
          const rawText = u.searchParams.get("text") || "";
          u.searchParams.set("text", buildShortWhatsAppMessage(rawText));
          window.location.assign(u.toString());
        } catch (_) {
          window.location.assign(link.href);
        }
      },
      true
    );
  }

  function periodicSweep() {
    if (document.body) scrubDomMojibake(document.body);
    autoDismissToasts();
  }

  function boot() {
    patchUserCollectionUniqueness();
    wrapAdminStatusUpdater();
    patchClientOrderLookup();
    initAiKnowledgeSync();
    patchWhatsAppSameTab();
    periodicSweep();

    if (typeof firebase !== "undefined" && firebase.auth) {
      firebase.auth().onAuthStateChanged((user) => {
        if (user && user.email) {
          syncCustomerToFirestore(user.email, user.displayName, "Google");
        }
      });
    }
    syncCustomerToFirestore();
    deduplicateUsersCollection();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  setInterval(periodicSweep, 600);
  
  // Registro local de respaldo para clientes, pedidos, personalizados y entregados (nunca se borra al cerrar sesion)
  const DC_REG_USERS_KEY = "darecore_registry_users_v1";
  const DC_REG_ORDERS_KEY = "darecore_registry_orders_v1";
  const DC_REG_LAB_KEY = "darecore_registry_darelab_v1";
  const DC_REG_DELIVERED_KEY = "darecore_registry_delivered_v1";
  const DC_REG_MEASURES_KEY = "darecore_size_tables_v1";

  function readRegArray(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function writeRegArray(key, arr) {
    try {
      origSetItem(key, JSON.stringify(arr));
    } catch (_) {}
  }

  function recordClientAccount(email, name, method) {
    const em = normalizeEmail(email);
    if (!em || !em.includes("@") || /invitado/i.test(em)) return;
    const list = readRegArray(DC_REG_USERS_KEY);
    const cleanName = cleanMojibake(name || em.split("@")[0]);
    const idx = list.findIndex((u) => normalizeEmail(u.email) === em);
    const entry = {
      uid: docIdFromEmail(em),
      email: em,
      name: idx >= 0 && list[idx].name && list[idx].name !== em.split("@")[0] ? list[idx].name : cleanName,
      loginMethod: idx >= 0 && list[idx].loginMethod === "Google" ? "Google" : (method || "Cuenta tienda"),
      lastLogin: new Date().toISOString()
    };
    if (idx >= 0) list[idx] = Object.assign({}, list[idx], entry);
    else list.unshift(entry);
    writeRegArray(DC_REG_USERS_KEY, list);
  }

  function recordOrderEntry(targetKey, payload) {
    if (!payload || typeof payload !== "object") return;
    const list = readRegArray(targetKey);
    const id = payload.id || payload.docId || ("rec_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7));
    const copy = Object.assign({ id: id, createdAt: new Date().toISOString() }, payload);
    if (copy.userEmail) copy.userEmail = normalizeEmail(copy.userEmail);
    const existingIdx = list.findIndex((x) => x.id === id || (copy.folio && x.folio === copy.folio));
    if (existingIdx >= 0) list[existingIdx] = Object.assign({}, list[existingIdx], copy);
    else list.unshift(copy);
    writeRegArray(targetKey, list);
  }

  const origSyncCust = syncCustomerToFirestore;
  syncCustomerToFirestore = async function (customEmail, customName, method) {
    const c = customEmail
      ? { email: customEmail, name: customName, method: method }
      : getActiveCustomer();
    if (c && c.email) recordClientAccount(c.email, c.name, c.method);
    return origSyncCust(customEmail, customName, method);
  };

  function hydrateAdminRegistries() {
    if (!/admin\.html/i.test(window.location.pathname || "")) return;

    const usersBox = document.getElementById("adminUsersList");
    const usersCountEl = document.getElementById("usersCount");
    const savedUsers = readRegArray(DC_REG_USERS_KEY);
    if (usersBox && savedUsers.length > 0 && (!usersBox.children.length || /no hay clientes/i.test(usersBox.textContent || ""))) {
      usersBox.innerHTML = savedUsers
        .map(
          (u) => `<div style="padding:12px 15px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <div>
              <div style="font-weight:700;font-size:13.5px;color:#18181b;">${cleanMojibake(u.name || u.email)}</div>
              <div style="font-size:12px;color:#52525b;">${normalizeEmail(u.email)} • <span style="font-weight:600;">${cleanMojibake(u.loginMethod || "Cuenta")}</span></div>
            </div>
            <div style="font-size:11px;color:#71717a;">${new Date(u.lastLogin || Date.now()).toLocaleString("es-MX")}</div>
          </div>`
        )
        .join("");
      if (usersCountEl) usersCountEl.textContent = String(savedUsers.length);
    }

    const ordersBox = document.getElementById("adminOrdersList");
    const ordersCountEl = document.getElementById("ordersCount");
    const savedOrders = readRegArray(DC_REG_ORDERS_KEY);
    if (ordersBox && savedOrders.length > 0 && (!ordersBox.children.length || /no hay pedidos/i.test(ordersBox.textContent || ""))) {
      ordersBox.innerHTML = savedOrders
        .map(
          (o) => `<div style="padding:14px 16px;">
            <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:6px;">
              <strong style="font-size:13px;">#${cleanMojibake(o.purchaseNumber || o.folio || o.id)}</strong>
              <span style="font-size:11px;font-weight:700;color:#ff4500;">${cleanMojibake(o.status || "Pendiente")}</span>
            </div>
            <div style="font-size:12px;color:#52525b;margin-bottom:6px;">Cliente: ${normalizeEmail(o.userEmail || "Sin correo")}</div>
            <div style="font-size:12.5px;font-weight:600;">Total: ${Number(o.total || 0).toLocaleString("es-MX")} MXN</div>
          </div>`
        )
        .join("");
      if (ordersCountEl) ordersCountEl.textContent = String(savedOrders.length);
    }

    const labBox = document.getElementById("adminDareLabList");
    const labCountEl = document.getElementById("dareLabCount");
    const savedLab = readRegArray(DC_REG_LAB_KEY);
    if (labBox && savedLab.length > 0 && (!labBox.children.length || /no hay solicitudes/i.test(labBox.textContent || ""))) {
      labBox.innerHTML = savedLab
        .map(
          (l) => `<div style="padding:14px 16px;">
            <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:6px;">
              <strong style="font-size:13px;">#${cleanMojibake(l.orderNumber || l.folio || l.id)}</strong>
              <span style="font-size:11px;font-weight:700;color:#ff4500;">${cleanMojibake(l.status || "Cotización")}</span>
            </div>
            <div style="font-size:12px;color:#52525b;margin-bottom:4px;">Base: ${cleanMojibake(l.baseName || "Personalizado")} (${cleanMojibake(l.size || "")})</div>
            <div style="font-size:12px;color:#71717a;">Cliente: ${normalizeEmail(l.userEmail || "Sin correo")}</div>
          </div>`
        )
        .join("");
      if (labCountEl) labCountEl.textContent = String(savedLab.length);
    }

    const deliveredBox = document.getElementById("adminDeliveredOrdersList");
    const deliveredCountEl = document.getElementById("deliveredOrdersCount");
    const savedDelivered = readRegArray(DC_REG_DELIVERED_KEY);
    if (deliveredBox) {
      if (savedDelivered.length > 0) {
        deliveredBox.innerHTML = savedDelivered
          .map(
            (d) => `<div style="padding:14px 16px;border-left:3px solid #15803d;">
              <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:6px;">
                <strong style="font-size:13px;">#${cleanMojibake(d.purchaseNumber || d.orderNumber || d.folio || d.id)}</strong>
                <span style="font-size:11px;font-weight:700;color:#15803d;background:#dcfce7;padding:2px 8px;border-radius:999px;">Entregado</span>
              </div>
              <div style="font-size:12px;color:#52525b;">Cliente: ${normalizeEmail(d.userEmail || "Sin correo")}</div>
              <div style="font-size:12px;color:#71717a;margin-top:4px;">Fecha: ${new Date(d.deliveredAt || d.createdAt || Date.now()).toLocaleString("es-MX")}</div>
            </div>`
          )
          .join("");
      } else if (!deliveredBox.innerHTML.trim()) {
        deliveredBox.innerHTML = `<div style="padding:16px;font-size:12.5px;color:#71717a;">Aún no hay pedidos marcados como entregados.</div>`;
      }
      if (deliveredCountEl) deliveredCountEl.textContent = String(savedDelivered.length);
    }
  }

  const origPatchUsers = patchUserCollectionUniqueness;
  patchUserCollectionUniqueness = function () {
    origPatchUsers();
    const db = getDb();
    if (!db || db.__dcRegistryHooked) return;
    db.__dcRegistryHooked = true;
    const rawCol = db.collection.bind(db);
    db.collection = function (name) {
      const cRef = rawCol(name);
      const rawAdd = cRef.add.bind(cRef);
      cRef.add = function (data) {
        if (name === "orders") recordOrderEntry(DC_REG_ORDERS_KEY, data);
        if (name === "darelab_orders") recordOrderEntry(DC_REG_LAB_KEY, data);
        if (name === "delivered_orders") recordOrderEntry(DC_REG_DELIVERED_KEY, Object.assign({}, data, { deliveredAt: new Date().toISOString() }));
        if (data && data.userEmail) recordClientAccount(data.userEmail, data.userName, "Pedido");
        return rawAdd(data);
      };
      return cRef;
    };
  };

  const origWrapStatus = wrapAdminStatusUpdater;
  wrapAdminStatusUpdater = function () {
    origWrapStatus();
    if (typeof window.updateOrderStatus === "function" && !window.updateOrderStatus.__dcDeliveredHook) {
      const prevFn = window.updateOrderStatus;
      window.updateOrderStatus = function (collectionName, docId, newStatus) {
        if (/entregad/i.test(String(newStatus || "")) || collectionName === "delivered_orders") {
          const db = getDb();
          if (db && docId) {
            db.collection(collectionName).doc(docId).get().then((snap) => {
              if (snap.exists) {
                recordOrderEntry(DC_REG_DELIVERED_KEY, Object.assign({ id: docId }, snap.data(), { status: "Entregado", deliveredAt: new Date().toISOString() }));
                hydrateAdminRegistries();
              }
            }).catch(() => {});
          } else {
            recordOrderEntry(DC_REG_DELIVERED_KEY, { id: docId || ("ent_" + Date.now()), status: "Entregado", deliveredAt: new Date().toISOString() });
            hydrateAdminRegistries();
          }
        }
        return prevFn(collectionName, docId, newStatus);
      };
      window.updateOrderStatus.__dcDeliveredHook = true;
    }
  };
  
  // Persistencia garantizada de pedidos y cambio de estatus en vivo (admin <-> cliente)
  function syncOrderStatusEverywhere(collectionName, docId, folioOrId, newStatus) {
    const cleanStatus = String(newStatus || "En proceso").trim();
    const isDelivered = /entregad/i.test(cleanStatus);

    [DC_REG_ORDERS_KEY, DC_REG_LAB_KEY, "darecore_client_orders"].forEach((storageKey) => {
      const arr = readRegArray(storageKey);
      let changed = false;
      const updated = arr.map((item) => {
        const match =
          (docId && (item.id === docId || item.docId === docId)) ||
          (folioOrId && (item.purchaseNumber === folioOrId || item.orderNumber === folioOrId || item.folio === folioOrId));
        if (match) {
          changed = true;
          const nextItem = Object.assign({}, item, {
            status: cleanStatus,
            updatedAt: new Date().toISOString()
          });
          if (isDelivered) {
            recordOrderEntry(DC_REG_DELIVERED_KEY, Object.assign({}, nextItem, { deliveredAt: new Date().toISOString() }));
          }
          return nextItem;
        }
        return item;
      });
      if (changed) writeRegArray(storageKey, updated);
    });

    const db = getDb();
    if (db && docId) {
      db.collection(collectionName).doc(docId).set({
        status: cleanStatus,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    }
  }

  window.dcChangeAdminOrderStatus = function (collectionName, docId, folioOrId, newStatus) {
    syncOrderStatusEverywhere(collectionName, docId, folioOrId, newStatus);
    if (typeof window.updateOrderStatus === "function" && docId) {
      try { window.updateOrderStatus(collectionName, docId, newStatus); } catch (_) {}
    }
    hydrateAdminRegistries();
  };

  hydrateAdminRegistries = function () {
    if (!/admin\.html/i.test(window.location.pathname || "")) return;

    const usersBox = document.getElementById("adminUsersList");
    const usersCountEl = document.getElementById("usersCount");
    const savedUsers = readRegArray(DC_REG_USERS_KEY);
    if (usersBox && savedUsers.length > 0 && (!usersBox.children.length || /no hay clientes/i.test(usersBox.textContent || ""))) {
      usersBox.innerHTML = savedUsers
        .map(
          (u) => `<div style="padding:12px 15px;border:1px solid #eceef2;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <div>
              <div style="font-weight:600;font-size:13.5px;color:#18181b;">${cleanMojibake(u.name || u.email)}</div>
              <div style="font-size:12px;color:#52525b;">${normalizeEmail(u.email)} • ${cleanMojibake(u.loginMethod || "Cuenta")}</div>
            </div>
            <div style="font-size:11px;color:#71717a;">${new Date(u.lastLogin || Date.now()).toLocaleString("es-MX")}</div>
          </div>`
        )
        .join("");
      if (usersCountEl) usersCountEl.textContent = String(savedUsers.length);
    }

    const renderEditableOrderCards = (containerId, countId, list, collectionName, emptyMsg) => {
      const box = document.getElementById(containerId);
      const countEl = document.getElementById(countId);
      if (!box) return;
      if (countEl && list.length > 0) countEl.textContent = String(list.length);

      const hasEmptyText = /no hay (pedidos|solicitudes|compras)/i.test(box.textContent || "");
      if (list.length > 0 && (!box.children.length || hasEmptyText)) {
        const statuses = ["Pendiente", "En proceso", "Enviado", "En camino", "Entregado"];
        box.innerHTML = list
          .map((o) => {
            const code = cleanMojibake(o.purchaseNumber || o.orderNumber || o.folio || o.id || "PEDIDO");
            const curStatus = cleanMojibake(o.status || "Pendiente");
            const opts = statuses
              .map((st) => `<option value="${st}" ${curStatus.toLowerCase() === st.toLowerCase() ? "selected" : ""}>${st}</option>`)
              .join("");
            const detailLine = o.baseName
              ? `Base: ${cleanMojibake(o.baseName)} (${cleanMojibake(o.size || "Única")})`
              : `Total: ${Number(o.total || 0).toLocaleString("es-MX")} MXN`;

            return `<div style="padding:15px 16px;border:1px solid #e4e4e7;border-radius:14px;background:#ffffff;display:flex;flex-direction:column;gap:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <span style="font-weight:600;font-size:13.5px;color:#18181b;">#${code}</span>
                <span style="font-size:11px;font-weight:600;color:#ff4500;background:rgba(255,69,0,0.08);padding:3px 9px;border-radius:999px;">${curStatus}</span>
              </div>
              <div style="font-size:12px;color:#52525b;">Cliente: ${normalizeEmail(o.userEmail || "Sin correo")}</div>
              <div style="font-size:12.5px;font-weight:500;color:#27272a;">${detailLine}</div>
              <div style="margin-top:4px;">
                <label style="font-size:10.5px;font-weight:600;color:#71717a;display:block;margin-bottom:4px;">Estado del pedido</label>
                <select onchange="dcChangeAdminOrderStatus('${collectionName}', '${o.docId || o.id || ""}', '${code}', this.value)" style="width:100%;padding:7px 10px;border-radius:10px;border:1px solid #d4d4d8;background:#fafafa;font-size:12px;color:#18181b;cursor:pointer;">
                  ${opts}
                </select>
              </div>
            </div>`;
          })
          .join("");
      } else if (!box.innerHTML.trim() && emptyMsg) {
        box.innerHTML = `<div style="padding:14px;font-size:12.5px;color:#71717a;">${emptyMsg}</div>`;
      }
    };

    renderEditableOrderCards("adminOrdersList", "ordersCount", readRegArray(DC_REG_ORDERS_KEY), "orders", "Aún no hay compras registradas.");
    renderEditableOrderCards("adminDareLabList", "dareLabCount", readRegArray(DC_REG_LAB_KEY), "darelab_orders", "Aún no hay solicitudes Dare Lab.");

    const deliveredBox = document.getElementById("adminDeliveredOrdersList");
    const deliveredCountEl = document.getElementById("deliveredOrdersCount");
    const savedDelivered = readRegArray(DC_REG_DELIVERED_KEY);
    if (deliveredBox) {
      if (savedDelivered.length > 0) {
        deliveredBox.innerHTML = savedDelivered
          .map(
            (d) => `<div style="padding:14px 16px;border:1px solid #e4e4e7;border-left:3px solid #15803d;border-radius:14px;background:#fff;">
              <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:6px;">
                <span style="font-weight:600;font-size:13px;">#${cleanMojibake(d.purchaseNumber || d.orderNumber || d.folio || d.id)}</span>
                <span style="font-size:11px;font-weight:600;color:#15803d;background:#dcfce7;padding:2px 9px;border-radius:999px;">Entregado</span>
              </div>
              <div style="font-size:12px;color:#52525b;">Cliente: ${normalizeEmail(d.userEmail || "Sin correo")}</div>
              <div style="font-size:11.5px;color:#71717a;margin-top:4px;">${new Date(d.deliveredAt || d.createdAt || Date.now()).toLocaleString("es-MX")}</div>
            </div>`
          )
          .join("");
      } else if (!deliveredBox.innerHTML.trim()) {
        deliveredBox.innerHTML = `<div style="padding:14px;font-size:12.5px;color:#71717a;">Aún no hay pedidos marcados como entregados.</div>`;
      }
      if (deliveredCountEl) deliveredCountEl.textContent = String(savedDelivered.length);
    }
  };
  setTimeout(boot, 1200);
  setInterval(hydrateAdminRegistries, 900);
})();
/* PUENTE EN VIVO CLIENTE <-> ADMIN (SIN BORRAR PEDIDOS AL ACTUALIZAR ESTATUS) */
(function () {
  if (window.__dcClientOrderBridgeInstalled) return;
  window.__dcClientOrderBridgeInstalled = true;

  const channel = (typeof BroadcastChannel !== "undefined") ? new BroadcastChannel("darecore_orders_sync") : null;

  function getStoredOrders() {
    const keys = ["darecore_orders", "dc_orders", "orders", "darecorePedidos", "dc_pedidos"];
    const map = new Map();
    keys.forEach(function (k) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const arr = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === "object" ? Object.values(parsed) : []);
        arr.forEach(function (item) {
          if (!item || typeof item !== "object") return;
          const id = String(item.id || item.orderId || item.codigo || item.numero || "").trim();
          if (!id) return;
          const prev = map.get(id) || {};
          map.set(id, Object.assign({}, prev, item, {
            id: id,
            status: item.status || item.estado || prev.status || prev.estado || "Pendiente",
            estado: item.estado || item.status || prev.estado || prev.status || "Pendiente"
          }));
        });
      } catch (_) {}
    });
    return Array.from(map.values());
  }

  function persistOrders(orders) {
    try {
      const json = JSON.stringify(orders);
      localStorage.setItem("darecore_orders", json);
      localStorage.setItem("dc_orders", json);
    } catch (_) {}
    try {
      if (channel) channel.postMessage({ type: "orders_updated", orders: orders, ts: Date.now() });
    } catch (_) {}
    try {
      window.dispatchEvent(new CustomEvent("darecore:orders:updated", { detail: { orders: orders } }));
    } catch (_) {}
  }

  function showStatusNotice(message) {
    if (!message) return;
    let toast = document.getElementById("dcClientStatusToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "dcClientStatusToast";
      toast.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:99999;background:#111827;color:#ffffff;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.22);";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = "block";
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      toast.style.display = "none";
    }, 3500);
  }

  function syncClientOrderBadges() {
    const orders = getStoredOrders();
    if (!orders.length) return;
    const byId = new Map(orders.map(function (o) { return [String(o.id).replace(/^#/, "").toUpperCase(), o]; }));

    document.querySelectorAll("article, section, div, tr, li").forEach(function (el) {
      if (el.children.length > 12) return;
      const txt = el.textContent || "";
      const match = txt.match(/#(COMPRA|PEDIDO)-[A-Z0-9_-]+/i);
      if (!match) return;
      const cleanId = match[0].replace(/^#/, "").toUpperCase();
      const found = byId.get(cleanId);
      if (!found) return;
      const currentStatus = found.status || found.estado || "Pendiente";
      let badge = el.querySelector("[data-dc-live-status]");
      if (!badge) {
        badge = document.createElement("span");
        badge.setAttribute("data-dc-live-status", "1");
        badge.style.cssText = "display:inline-block;margin-left:8px;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:700;background:#eef2ff;color:#1e1b4b;";
        el.appendChild(badge);
      }
      badge.textContent = "Estatus: " + currentStatus;
    });
  }

  document.addEventListener("click", function (e) {
    const btn = e.target && e.target.closest ? e.target.closest("button, a") : null;
    if (!btn) return;
    const label = (btn.textContent || "").trim().toLowerCase();
    if (/actualizar\s*estatus|actualizar\s*estado/i.test(label)) {
      setTimeout(function () {
        const orders = getStoredOrders();
        syncClientOrderBadges();
        if (orders.length > 0) {
          const latest = orders[0];
          const st = latest.status || latest.estado || "Pendiente";
          showStatusNotice("Pedido #" + String(latest.id).replace(/^#/, "") + " — Estatus actual: " + st);
        }
      }, 60);
    }
  }, true);

  window.addEventListener("storage", function () {
    syncClientOrderBadges();
  });

  if (channel) {
    channel.onmessage = function () {
      syncClientOrderBadges();
    };
  }

  document.addEventListener("DOMContentLoaded", function () {
    syncClientOrderBadges();
    setTimeout(syncClientOrderBadges, 400);
  });
})();
/* DARECORE ONLY-SENT EMAIL RULE */
(function () {
  if (window.__dcOnlySentEmailRuleInstalled) return;
  window.__dcOnlySentEmailRuleInstalled = true;

  // Cambia aquí si deseas forzar un correo específico o deja "" para usar el correo registrado del cliente
  window.DARECORE_SHIPPED_EMAIL_CONFIG = Object.assign({
    overrideRecipientEmail: "",
    senderName: "DareCore Store",
    publicKey: (typeof EMAILJS_PUBLIC_KEY !== "undefined" ? EMAILJS_PUBLIC_KEY : "oPqh5dU4hbXT_uZng"),
    serviceId: (typeof EMAILJS_SERVICE_ID !== "undefined" ? EMAILJS_SERVICE_ID : "service_a3uxsit"),
    templateId: (typeof EMAILJS_TEMPLATE_ID !== "undefined" ? EMAILJS_TEMPLATE_ID : "template_gxvi2ue")
  }, window.DARECORE_SHIPPED_EMAIL_CONFIG || {});

  try {
    const savedOverride = localStorage.getItem("darecore_shipped_override_email");
    if (savedOverride !== null) {
      window.DARECORE_SHIPPED_EMAIL_CONFIG.overrideRecipientEmail = savedOverride.trim();
    }
  } catch (_) {}

  function isSentStatus(val) {
    return String(val || "").trim().toLowerCase() === "enviado";
  }

  function buildPackageShippedMessage(folio, customerName, itemsText, totalText) {
    const safeName = customerName || "Cliente";
    const safeFolio = folio || "DareCore";
    return (
      "Hola " + safeName + ",\n\n" +
      "¡Excelentes noticias! Tu paquete correspondiente al pedido #" + safeFolio +
      " ha sido enviado exitosamente por DareCore.\n\n" +
      (itemsText ? "Productos enviados: " + itemsText + "\n" : "") +
      (totalText ? "Total del pedido: " + totalText + "\n" : "") +
      "\nYa va en camino hacia tu destino. Gracias por confiar en DareCore y formar parte del drop."
    );
  }

  async function sendPackageShippedNotification(orderInfo) {
    const cfg = window.DARECORE_SHIPPED_EMAIL_CONFIG || {};
    const targetEmail = String(cfg.overrideRecipientEmail || orderInfo.email || "").trim();
    if (!targetEmail || !targetEmail.includes("@")) return;

    const folio = String(orderInfo.folio || "").replace(/^#/, "").trim();
    const customerName = String(orderInfo.customerName || targetEmail.split("@")[0]).trim();
    const itemsText = String(orderInfo.itemsText || "").trim();
    const totalText = String(orderInfo.totalText || "").trim();

    const subject = "Tu paquete #" + folio + " ha sido enviado exitosamente — DareCore";
    const message = buildPackageShippedMessage(folio, customerName, itemsText, totalText);

    if (typeof window.triggerAutomatedEmail === "function") {
      try {
        await window.triggerAutomatedEmail({
          type: "order_shipped",
          status: "Enviado",
          to: targetEmail,
          recipients: [targetEmail],
          folio: folio,
          customerName: customerName,
          items: itemsText,
          total: totalText,
          subject: subject,
          message: message
        });
      } catch (_) {}
    }

    if (cfg.publicKey && cfg.serviceId && cfg.templateId && window.emailjs && typeof window.emailjs.send === "function") {
      try {
        if (typeof window.emailjs.init === "function") {
          window.emailjs.init(cfg.publicKey);
        }
        await window.emailjs.send(cfg.serviceId, cfg.templateId, {
          to_email: targetEmail,
          email: targetEmail,
          to_name: customerName,
          folio: folio,
          status: "Enviado",
          items: itemsText,
          total: totalText,
          subject: subject,
          message: message
        });
      } catch (_) {}
    }
  }

  function extractOrderDetailsFromCard(card, selectEl) {
    const container = card || (selectEl ? selectEl.closest("div, article, section, li") : null) || document.body;
    const rawText = container.textContent || "";
    const folioMatch = rawText.match(/#(COMPRA|PEDIDO)-[A-Z0-9_-]+/i);
    const emailMatch = rawText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const clientMatch = rawText.match(/Cliente:\s*([^\n(]+)/i);
    const totalMatch = rawText.match(/Total:\s*\$?[0-9.,]+\s*(?:MXN)?/i);

    let folio = folioMatch ? folioMatch[0].replace(/^#/, "") : "";
    let email = emailMatch ? emailMatch[0] : "";
    let customerName = clientMatch ? clientMatch[1].trim() : "";
    let totalText = totalMatch ? totalMatch[0].replace(/^Total:\s*/i, "").trim() : "";

    // Buscar también en ancestros cercanos por si el correo o folio está un nivel arriba
    if ((!folio || !email) && selectEl) {
      let p = selectEl.parentElement;
      for (let i = 0; i < 5 && p && p !== document.body; i++) {
        const pt = p.textContent || "";
        if (!folio) {
          const fm = pt.match(/#(COMPRA|PEDIDO)-[A-Z0-9_-]+/i);
          if (fm) folio = fm[0].replace(/^#/, "");
        }
        if (!email) {
          const em = pt.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
          if (em) email = em[0];
        }
        p = p.parentElement;
      }
    }

    return {
      folio: folio,
      email: email,
      customerName: customerName,
      totalText: totalText
    };
  }

  // Escuchar cambios en los selectores de estatus del panel admin
  document.addEventListener("change", function (e) {
    const sel = e.target && e.target.closest ? e.target.closest("select") : null;
    if (!sel) return;
    const chosen = sel.value || (sel.options[sel.selectedIndex] && (sel.options[sel.selectedIndex].value || sel.options[sel.selectedIndex].textContent)) || "";
    if (!isSentStatus(chosen)) return;

    const details = extractOrderDetailsFromCard(sel.closest("div, article, section, li"), sel);
    sendPackageShippedNotification(details);
  }, true);
})();
/* DARECORE SINGLE SHIPPED EMAIL LOCK */
(function () {
  if (window.__dcSingleShippedEmailLockInstalled) return;
  window.__dcSingleShippedEmailLockInstalled = true;

  window.DARECORE_SHIPPED_EMAIL_CONFIG = Object.assign({}, window.DARECORE_SHIPPED_EMAIL_CONFIG || {}, {
    senderEmail: "darecore313@gmail.com",
    replyTo: "darecore313@gmail.com",
    from_email: "darecore313@gmail.com"
  });

  const sentKeys = new Set();

  // Bloquear envíos duplicados rápidos para el mismo folio/correo en menos de 8 segundos
  function shouldAllowSingleEmail(key) {
    const now = Date.now();
    const prevTs = sentKeys.get(key) || 0;
    if (now - prevTs < 8000) {
      return false;
    }
    sentKeys.set(key, now);
    return true;
  }

  if (typeof window.emailjs === "object" && window.emailjs && typeof window.emailjs.send === "function" && !window.emailjs.__dcSingleWrapped) {
    const origEmailJsSend = window.emailjs.send.bind(window.emailjs);
    window.emailjs.send = function (serviceId, templateId, templateParams, publicKey) {
      const params = Object.assign({}, templateParams || {}, {
        from_email: paramsFromOrDefault(templateParams),
        sender_email: "darecore313@gmail.com",
        reply_to: "darecore313@gmail.com"
      });
      const lockKey = [
        String(params.folio || params.order_id || "").trim(),
        String(params.to_email || params.email || "").trim().toLowerCase(),
        String(params.status || "").trim().toLowerCase()
      ].join("|");

      if (lockKey && lockKey !== "||" && !shouldAllowSingleEmail(lockKey)) {
        return Promise.resolve({ status: 200, text: "DEDUPED_SINGLE_EMAIL" });
      }
      return origEmailJsSend(serviceId, templateId, params, publicKey);
    };
    window.emailjs.__dcSingleWrapped = true;
  }

  function paramsFromOrDefault(p) {
    return (p && p.from_email) ? p.from_email : "darecore313@gmail.com";
  }
})();
/* DARECORE STRICT SINGLE EMAIL GUARD V2 */
(function () {
  if (window.__dcStrictSingleEmailV2Installed) return;
  window.__dcStrictSingleEmailV2Installed = true;

  const MEMORY_SENT = new Set();
  const STORAGE_PREFIX = "dc_shipped_sent_v2_";

  function alreadySentForOrder(folio, toEmail, statusVal) {
    const f = String(folio || "").replace(/^#/, "").trim().toUpperCase();
    const e = String(toEmail || "").trim().toLowerCase();
    const s = String(statusVal || "").trim().toLowerCase();
    if (!f && !e) return false;
    const key = f + "|" + e + "|" + s;
    if (MEMORY_SENT.has(key)) return true;
    try {
      if (sessionStorage.getItem(STORAGE_PREFIX + key) === "1") return true;
    } catch (_) {}
    MEMORY_SENT.add(key);
    try {
      sessionStorage.setItem(STORAGE_PREFIX + key, "1");
    } catch (_) {}
    return false;
  }

  function wrapEmailJsOnce() {
    if (!window.emailjs || typeof window.emailjs.send !== "function" || window.emailjs.__dcV2Wrapped) return;
    const origSend = window.emailjs.send.bind(window.emailjs);
    window.emailjs.send = function (serviceId, templateId, templateParams, publicKey) {
      const p = templateParams || {};
      const statusText = String(p.status || p.subject || p.message || "").toLowerCase();
      const isShippedMsg = /enviado|shipped/i.test(statusText);
      const folio = String(p.folio || p.order_id || "").trim();
      const recipient = String(p.to_email || p.email || p.to || "").trim();

      if (isShippedMsg && alreadySentForOrder(folio, recipient, "enviado")) {
        return Promise.resolve({ status: 200, text: "BLOCKED_DUPLICATE_SHIPPED_EMAIL" });
      }
      return origSend(serviceId, templateId, templateParams, publicKey);
    };
    window.emailjs.__dcV2Wrapped = true;
  }

  wrapEmailJsOnce();
  setInterval(wrapEmailJsOnce, 400);
})();
/* DARECORE MASTER SINGLE EMAIL KILLSWITCH */
(function () {
  if (window.__dcMasterSingleEmailKillswitch) return;
  window.__dcMasterSingleEmailKillswitch = true;

  const SENT_FINGERPRINTS = new Set();
  const STORAGE_KEY_PREFIX = "dc_master_mail_sent_";

  function extractFolioFromText(str) {
    const m = String(str || "").match(/#?(COMPRA|PEDIDO)-[A-Z0-9_-]+/i);
    return m ? m[0].replace(/^#/, "").toUpperCase() : "";
  }

  function extractEmailFromText(str) {
    const m = String(str || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return m ? m[0].toLowerCase() : "";
  }

  function isDuplicateOrDisallowed(folioRaw, emailRaw, statusRaw, subjectRaw, bodyRaw) {
    const combined = [statusRaw, subjectRaw, bodyRaw].join(" ");
    const isShippedEvent = /enviado|shipped|paquete.*enviado/i.test(combined);

    // Si es un correo de actualización de estatus de pedido, solo permitir si corresponde a "Enviado"
    const isOrderStatusEvent = /estatus de tu pedido|actualizaci[oó]n de tu pedido|order_status|enviado|en proceso|pendiente|listo para enviar/i.test(combined);
    if (isOrderStatusEvent && !isShippedEvent) {
      return true;
    }

    const folio = extractFolioFromText(folioRaw || subjectRaw || bodyRaw);
    const email = extractEmailFromText(emailRaw || bodyRaw);
    const modeKey = isShippedEvent ? "SHIPPED" : "OTHER";
    const fp = (folio || "NOFOLIO") + "|" + (email || "NOEMAIL") + "|" + modeKey;

    if (SENT_FINGERPRINTS.has(fp)) return true;
    try {
      if (sessionStorage.getItem(STORAGE_KEY_PREFIX + fp) === "1") return true;
    } catch (_) {}

    SENT_FINGERPRINTS.add(fp);
    try {
      sessionStorage.setItem(STORAGE_KEY_PREFIX + fp, "1");
    } catch (_) {}
    return false;
  }

  function patchTransportAPIs() {
    if (typeof window.triggerAutomatedEmail === "function" && !window.triggerAutomatedEmail.__dcMasterGuarded) {
      const origTrigger = window.triggerAutomatedEmail.bind(window);
      window.triggerAutomatedEmail = function (payload) {
        const p = payload || {};
        const blocked = isDuplicateOrDisallowed(
          p.folio || p.orderNumber || p.purchaseNumber || "",
          p.to || p.to_email || p.email || (Array.isArray(p.recipients) ? p.recipients[0] : ""),
          p.status || p.type || "",
          p.subject || "",
          p.message || ""
        );
        if (blocked) {
          return Promise.resolve({ skipped: true, reason: "MASTER_SINGLE_EMAIL_GUARD" });
        }
        return origTrigger(payload);
      };
      window.triggerAutomatedEmail.__dcMasterGuarded = true;
    }

    if (window.emailjs && typeof window.emailjs.send === "function" && !window.emailjs.__dcMasterGuarded) {
      const origSend = window.emailjs.send.bind(window.emailjs);
      window.emailjs.send = function (serviceId, templateId, templateParams, publicKey) {
        const tp = templateParams || {};
        const blocked = isDuplicateOrDisallowed(
          tp.folio || tp.order_id || "",
          tp.to_email || tp.email || tp.to || "",
          tp.status || "",
          tp.subject || "",
          tp.message || ""
        );
        if (blocked) {
          return Promise.resolve({ status: 200, text: "MASTER_SINGLE_EMAIL_GUARD" });
        }
        return origSend(serviceId, templateId, templateParams, publicKey);
      };
      window.emailjs.__dcMasterGuarded = true;
    }
  }

  patchTransportAPIs();
  setInterval(patchTransportAPIs, 150);
})();