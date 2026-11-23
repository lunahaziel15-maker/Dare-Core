(function () {
  const AI_KB_KEY = "darecore_ai_knowledge";
  const GUEST_EMAIL_KEY = "darecore_guest_email";
  const GUEST_NAME_KEY = "darecore_guest_name";
  // Opcional: si configuras EmailJS (gratis en emailjs.com), pon tus IDs aqui para envio directo desde navegador
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

  function getActiveCustomer() {
    const authUser = (typeof firebase !== "undefined" && firebase.auth && firebase.auth().currentUser) || window.auth?.currentUser;
    if (authUser && authUser.email) {
      return {
        uid: authUser.uid,
        email: authUser.email.trim().toLowerCase(),
        name: authUser.displayName || authUser.email.split("@")[0],
        method: "Google"
      };
    }
    const guestEmail = (
      localStorage.getItem(GUEST_EMAIL_KEY) ||
      localStorage.getItem("darecore_user_email") ||
      sessionStorage.getItem(GUEST_EMAIL_KEY) ||
      ""
    ).trim().toLowerCase();

    if (guestEmail && guestEmail.includes("@")) {
      return {
        uid: "manual_" + guestEmail.replace(/[^a-z0-9]/g, "_"),
        email: guestEmail,
        name: localStorage.getItem(GUEST_NAME_KEY) || guestEmail.split("@")[0],
        method: "Correo manual"
      };
    }
    return null;
  }

  // 1. Registrar cliente (Google o Manual) en Firestore 'users'
  async function syncCustomerToFirestore(customEmail, customName, method) {
    const db = getDb();
    if (!db) return;
    const customer = customEmail
      ? {
          uid: "manual_" + customEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, "_"),
          email: customEmail.trim().toLowerCase(),
          name: customName || customEmail.split("@")[0],
          method: method || "Correo manual"
        }
      : getActiveCustomer();

    if (!customer || !customer.email) return;

    try {
      await db.collection("users").doc(customer.uid).set(
        {
          uid: customer.uid,
          email: customer.email,
          name: customer.name,
          loginMethod: customer.method,
          lastLogin: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("Error registrando cliente en Firestore:", e);
    }
  }

  // Interceptar cualquier guardado de correo manual en email-gate.js o inputs de correo
  const origSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (k, v) {
    origSetItem(k, v);
    if (/email/i.test(k) && typeof v === "string" && v.includes("@")) {
      origSetItem(GUEST_EMAIL_KEY, v.trim().toLowerCase());
      syncCustomerToFirestore(v, null, "Correo manual");
    }
  };

  document.addEventListener("submit", (e) => {
    const emailInput = e.target.querySelector && e.target.querySelector('input[type="email"], input[id*="email" i], input[placeholder*="correo" i]');
    if (emailInput && emailInput.value && emailInput.value.includes("@")) {
      const em = emailInput.value.trim().toLowerCase();
      origSetItem(GUEST_EMAIL_KEY, em);
      syncCustomerToFirestore(em, null, "Correo manual");
    }
  }, true);

  // 2. Asegurar que pedidos de Carrito y Dare Lab lleven el correo real (nunca 'Invitado' si ya dio correo)
  function patchFirestoreWrites() {
    const db = getDb();
    if (!db || db.__dcPatched) return;
    db.__dcPatched = true;

    const origCollection = db.collection.bind(db);
    db.collection = function (colName) {
      const colRef = origCollection(colName);
      if (colName === "orders" || colName === "darelab_orders") {
        const origAdd = colRef.add.bind(colRef);
        colRef.add = function (data) {
          const customer = getActiveCustomer();
          const enriched = Object.assign({}, data);
          if (customer && (!enriched.userEmail || /invitado/i.test(enriched.userEmail))) {
            enriched.userEmail = customer.email;
            enriched.userName = customer.name;
          }
          if (!enriched.createdAt) enriched.createdAt = new Date().toISOString();
          syncCustomerToFirestore(enriched.userEmail, enriched.userName);
          return origAdd(enriched);
        };
      }
      return colRef;
    };
  }

  // 3. Notificacion automatica por correo al actualizar estatus en admin.html
  async function sendOrderStatusEmail(orderData, collectionName, docId, newStatus) {
    const toEmail = (orderData.userEmail || "").trim();
    if (!toEmail || !toEmail.includes("@") || /invitado/i.test(toEmail)) return;

    const folio = orderData.purchaseNumber || orderData.orderNumber || docId;
    const customerName = orderData.userName || toEmail.split("@")[0];
    const itemsSummary =
      collectionName === "darelab_orders"
        ? `Personalizado Dare Lab: ${orderData.baseName || "Prenda"} (${orderData.size || ""})`
        : Array.isArray(orderData.items)
        ? orderData.items.map((i) => `${i.qty}x ${i.name}`).join(", ")
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

    // A) Encolar en Firestore 'mail_queue' (compatible con Firebase Trigger Email / Webhook)
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

    // B) Envio directo automatico desde navegador si EmailJS esta configurado
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

  // Envolver updateOrderStatus de script.js para disparar correo automatico y recargar tablas
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
          if (typeof window.showFloatingToast === "function") {
            window.showFloatingToast(`Estatus actualizado a "${newStatus}" y notificación enviada a ${orderSnapData.userEmail || "cliente"}`);
          }
        }
      };
      window.updateOrderStatus.__dcWrapped = true;
    }
  }

  // 4. Sincronizar "Modificar IA" en admin.html con Firestore ('settings/aiKnowledge') y DareCore Intelligence
  async function initAiKnowledgeSync() {
    const db = getDb();
    if (!db) return;

    // Cargar conocimiento guardado en la nube al abrir la tienda o el admin
    try {
      const doc = await db.collection("settings").doc("aiKnowledge").get();
      if (doc.exists && doc.data() && typeof doc.data().text === "string" && doc.data().text.trim()) {
        const cloudText = doc.data().text.trim();
        origSetItem(AI_KB_KEY, cloudText);
        // Rellenar todos los textareas del panel admin si estamos en admin.html
        document.querySelectorAll("#darecoreAiKbTextarea").forEach((ta) => {
          ta.value = cloudText;
        });
      }
    } catch (e) {
      console.warn("No se pudo leer settings/aiKnowledge:", e);
    }

    // Interceptar clic en "Guardar informacion de la IA" en admin.html
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("#saveDarecoreAiKbBtn, button");
      if (!btn) return;
      if (!/guardar informaci/i.test(btn.textContent || "")) return;

      const textareas = Array.from(document.querySelectorAll("#darecoreAiKbTextarea, textarea"));
      const activeTa = textareas.find((t) => t.offsetParent !== null) || textareas[0];
      if (!activeTa) return;

      const newText = activeTa.value.trim();
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
        if (typeof window.showFloatingToast === "function") {
          window.showFloatingToast("Conocimiento de IA guardado en Firebase y activo en la tienda");
        }
      } catch (err) {
        console.error("Error guardando IA en Firestore:", err);
      }
    }, true);
  }

  // 5. Permitir que el cliente vea sus pedidos en 'PEDIDO PENDIENTE' usando su correo manual aunque no use Google
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
              summary: Array.isArray(data.items) ? data.items.map((i) => `${i.qty}x ${i.name}`).join(", ") : "Compra en tienda",
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
              summary: `${data.baseName || "Personalizado"} (${data.size || ""})`,
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
        } catch (e) {}
      };
      window.fetchClientPendingOrders.__dcWrapped = true;
    }
  }

  function boot() {
    patchFirestoreWrites();
    wrapAdminStatusUpdater();
    patchClientOrderLookup();
    initAiKnowledgeSync();

    if (typeof firebase !== "undefined" && firebase.auth) {
      firebase.auth().onAuthStateChanged((user) => {
        if (user && user.email) {
          syncCustomerToFirestore(user.email, user.displayName, "Google");
        }
      });
    }
    syncCustomerToFirestore();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  setTimeout(boot, 1200);
})();