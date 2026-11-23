(function () {
  const AI_KB_KEY = "darecore_ai_knowledge";
  const GUEST_EMAIL_KEY = "darecore_guest_email";
  const GUEST_NAME_KEY = "darecore_guest_name";
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

  // Limpiador universal de doble/triple codificacion UTF-8 / Latin-1
  const CORRUPT_PAIRS = [
    ["\u00C3\u00A1", "\u00E1"], // á
    ["\u00C3\u00A9", "\u00E9"], // é
    ["\u00C3\u00AD", "\u00ED"], // í
    ["\u00C3\u00B3", "\u00F3"], // ó
    ["\u00C3\u00BA", "\u00FA"], // ú
    ["\u00C3\u0081", "\u00C1"], // Á
    ["\u00C3\u2030", "\u00C9"], // É
    ["\u00C3\u008D", "\u00CD"], // Í
    ["\u00C3\u201C", "\u00D3"], // Ó
    ["\u00C3\u0161", "\u00DA"], // Ú
    ["\u00C3\u00B1", "\u00F1"], // ñ
    ["\u00C3\u2018", "\u00D1"], // Ñ
    ["\u00C3\u00BC", "\u00FC"], // ü
    ["\u00C3\u0153", "\u00DC"], // Ü
    ["\u00E2\u20AC\u00A2", "\u2022"], // •
    ["\u00E2\u20AC\u201D", "\u2014"], // —
    ["\u00E2\u20AC\u201C", "\u2013"], // –
    ["\u00E2\u20AC\u02DC", "\u2018"], // ‘
    ["\u00E2\u20AC\u2122", "\u2019"], // ’
    ["\u00E2\u20AC\u0153", "\u201C"], // “
    ["\u00E2\u20AC\u009D", "\u201D"], // ”
    ["\u00C2\u00BF", "\u00BF"], // ¿
    ["\u00C2\u00A1", "\u00A1"], // ¡
    ["\u00C2\u00B0", "\u00B0"], // °
    ["\u00C2\u00B7", "\u00B7"]  // ·
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

  // Auto-ocultar cualquier banner verde / toast despues de 3.5 segundos
  function autoDismissToasts() {
    const candidates = Array.from(document.querySelectorAll("div, span, p"));
    candidates.forEach((el) => {
      if (el.children.length > 2) return;
      const txt = (el.textContent || "").trim();
      if (!txt || txt.length > 220) return;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const isFloating = style.position === "fixed" || style.position === "absolute";
      const isGreenToast =
        /estatus actualizado|guardado|actualizado|notificación enviada/i.test(txt) &&
        (isFloating || rect.top < 160 || /rgb\(\s*(22|34|16|21|5|4)\s*,\s*(163|197|128|150|150|120)\s*,/i.test(style.backgroundColor));

      if (isGreenToast && !el.dataset.dcToastTimer) {
        el.dataset.dcToastTimer = "1";
        setTimeout(() => {
          try {
            el.style.transition = "opacity 0.25s ease, transform 0.25s ease";
            el.style.opacity = "0";
            el.style.transform = "translateY(-8px)";
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

  // Deduplicar cuentas con el mismo correo en Firestore 'users'
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
          // Conservar el documento canonico o el mas reciente y borrar el duplicado
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

  // 1. Registrar cliente UNA SOLA VEZ por correo en Firestore 'users'
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
    } catch (e) {
      console.warn("Error registrando cliente en Firestore:", e);
    }
  }

  // Evitar que script.js escriba un documento duplicado con uid aleatorio/google si ya existe por correo
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
                const merged = Object.assign({}, data, { uid: canonId, email: normalizeEmail(data.email), name: cleanMojibake(data.name || "") });
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

  // Interceptar guardado de correo manual
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

  // Cerrar sesion limpio en UN SOLO CLIC
  function handleOneClickLogout(e) {
    const target = e.target.closest("button, a");
    if (!target) return;
    const label = (target.textContent || "").trim().toLowerCase();
    if (label === "cerrar sesión" || label === "cerrar sesion") {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

      [
        GUEST_EMAIL_KEY,
        GUEST_NAME_KEY,
        "darecore_user_email",
        "darecore_user_name",
        "darecore_guest_verified",
        "darecore_session_email"
      ].forEach((key) => {
        try { localStorage.removeItem(key); } catch (_) {}
        try { sessionStorage.removeItem(key); } catch (_) {}
      });

      const signOutPromise =
        typeof firebase !== "undefined" && firebase.auth && firebase.auth().currentUser
          ? firebase.auth().signOut().catch(() => {})
          : Promise.resolve();

      signOutPromise.finally(() => {
        // Ocultar barra flotante de sesion de inmediato
        const bar = target.closest("div");
        if (bar && (bar.textContent || "").includes("@")) {
          bar.remove();
        }
        if (typeof window.renderAuthBar === "function") {
          try { window.renderAuthBar(); } catch (_) {}
        }
        window.location.reload();
      });
    }
  }

  document.addEventListener("click", handleOneClickLogout, true);

  // Notificacion automatica por correo al actualizar estatus
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
      } catch (err) {
        console.warn("EmailJS error:", err);
      }
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
          } catch (e) {}
        }

        origUpdate(collectionName, docId, newStatus);

        if (orderSnapData) {
          await sendOrderStatusEmail(orderSnapData, collectionName, docId, newStatus);
        }
      };
      window.updateOrderStatus.__dcWrapped = true;
    }
  }

  // Sincronizar "Modificar IA" en admin.html con Firestore ('settings/aiKnowledge')
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
    } catch (e) {}

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
            origSetItem("darecore_client_orders", JSON.stringify(list));
            if (typeof window.renderClientPendingOrders === "function") {
              window.renderClientPendingOrders();
            }
          }
        } catch (_) {}
      };
      window.fetchClientPendingOrders.__dcWrapped = true;
    }
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
  setTimeout(boot, 1200);
})();