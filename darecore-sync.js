(function () {
  const AI_KB_KEY = "darecore_ai_knowledge";
  const PRODUCTS_KEY = "darecore_products";
  const BASES_KEY = "darecore_custom_bases";
  const GUEST_EMAIL_KEY = "darecore_guest_email";
  const GUEST_NAME_KEY = "darecore_guest_name";
  const EMAIL_GATE_KEY = "darecore_customer_email";
  const EMAILJS_PUBLIC_KEY = "";
  const EMAILJS_SERVICE_ID = "";
  const EMAILJS_TEMPLATE_ID = "";

  const FALLBACK_PRODUCTS = [
    {
      id: "p-aro-front",
      name: "ARO FRONT",
      price: 650,
      category: "oversize",
      badge: "NEW",
      desc: "Oversize para cualquier deporte",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "p-focus",
      name: "FOCUS",
      price: 680,
      category: "hombre",
      badge: "PIEZA UNICA",
      desc: "Corte estructurado de alto gramaje",
      image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "p-gymbro",
      name: "GYMBRO",
      price: 740,
      category: "hombre",
      badge: "NEW",
      desc: "Perfecta para entrenar cualquier deporte",
      image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "p-motor",
      name: "MOTOR",
      price: 720,
      category: "oversize",
      badge: "NEW",
      desc: "Inspiración motorsport y paddock",
      image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "p-strong",
      name: "STRONG",
      price: 690,
      category: "hombre",
      badge: "PIEZA UNICA",
      desc: "Diseño de alto impacto para entrenamiento",
      image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "p-overbola",
      name: "OVERBOLA",
      price: 710,
      category: "oversize",
      badge: "NEW",
      desc: "Silueta amplia con caída pesada",
      image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "p-car",
      name: "CAR",
      price: 730,
      category: "oversize",
      badge: "NEW",
      desc: "Estética automotriz callejera",
      image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "p-apex-top",
      name: "TOP DEPORTIVO 'APEX CORE'",
      price: 540,
      category: "mujer",
      badge: "NEW",
      desc: "Ajuste firme y transpirable para gym",
      image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "p-aro-back",
      name: "ARO BACK",
      price: 880,
      category: "oversize",
      badge: "NEW",
      desc: "Ideal para la cancha y gym",
      image: "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?auto=format&fit=crop&w=800&q=80"
    }
  ];

  const FALLBACK_BASES = [
    { id: "b1", name: "BOXY TEE 240G", price: 580, desc: "Camisa / playera algodón peinado pesado", garmentType: "camisa" },
    { id: "b2", name: "HEAVY HOODIE 400G", price: 1099, desc: "Sudadera / hoodie felpa francesa alto gramaje", garmentType: "sudadera" },
    { id: "b3", name: "VARSITY JACKET BORDADA", price: 1750, desc: "Chamarra de equipo", garmentType: "sudadera" },
    { id: "b4", name: "TOP DEPORTIVO SEAMLESS", price: 460, desc: "Top / licra compresión gym", garmentType: "top" }
  ];

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

  function ensureLocalCatalogAndRefresh(productsList) {
    const list = Array.isArray(productsList) && productsList.length > 0 ? productsList : FALLBACK_PRODUCTS;
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));

    const grid = document.getElementById("productGrid") || document.querySelector(".product-grid");
    const gridText = grid ? (grid.textContent || "") : "";
    if (grid && (/no hay prendas registradas/i.test(gridText) || !grid.children.length)) {
      if (typeof window.initStore === "function") {
        window.initStore();
      }
      if (typeof window.renderHeroSlide === "function") {
        window.renderHeroSlide(0);
      }
    }
  }

  async function syncCatalogAcrossAccounts() {
    let currentLocal = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) currentLocal = parsed;
    } catch (_) {}

    if (currentLocal.length === 0) {
      ensureLocalCatalogAndRefresh(FALLBACK_PRODUCTS);
      currentLocal = FALLBACK_PRODUCTS;
    }

    const db = getDb();
    if (!db) return;

    try {
      const snap = await db.collection("products").get();
      if (!snap.empty) {
        const cloudProds = snap.docs.map((d) => ({ ...d.data(), firestoreId: d.id }));
        ensureLocalCatalogAndRefresh(cloudProds);
      } else {
        for (const item of currentLocal) {
          const docId = item.id || ("prod_" + Math.random().toString(36).slice(2, 9));
          await db.collection("products").doc(docId).set({ ...item, id: docId }, { merge: true }).catch(() => {});
        }
      }
    } catch (_) {}

    try {
      const basesDoc = await db.collection("settings").doc("customBases").get();
      if (basesDoc.exists && Array.isArray(basesDoc.data()?.items) && basesDoc.data().items.length > 0) {
        localStorage.setItem(BASES_KEY, JSON.stringify(basesDoc.data().items));
        if (typeof window.renderCustomBasesPublic === "function") {
          window.renderCustomBasesPublic();
        }
      } else if (!localStorage.getItem(BASES_KEY)) {
        localStorage.setItem(BASES_KEY, JSON.stringify(FALLBACK_BASES));
        await db.collection("settings").doc("customBases").set({ items: FALLBACK_BASES }, { merge: true }).catch(() => {});
      }
    } catch (_) {}
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
        "darecore_client_orders"
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
    const grid = document.getElementById("productGrid") || document.querySelector(".product-grid");
    if (grid && /no hay prendas registradas/i.test(grid.textContent || "")) {
      ensureLocalCatalogAndRefresh();
    }
  }

  function boot() {
    ensureLocalCatalogAndRefresh();
    patchUserCollectionUniqueness();
    wrapAdminStatusUpdater();
    patchClientOrderLookup();
    initAiKnowledgeSync();
    syncCatalogAcrossAccounts();
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