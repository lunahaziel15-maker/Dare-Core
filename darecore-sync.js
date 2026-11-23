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
  setTimeout(boot, 1200);
  setInterval(hydrateAdminRegistries, 900);
})();