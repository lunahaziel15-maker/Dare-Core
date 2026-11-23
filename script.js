/* DARECORE INTELLIGENCE EXEMPTION FOR PHONE GATE */
(function () {
  window.__dcIsInsideDareCoreAI = function (el) {
    if (!el) return false;
    let cur = el;
    for (let i = 0; i < 12 && cur; i++) {
      const id = String(cur.id || "").toLowerCase();
      const cls = String(cur.className || "").toLowerCase();
      const txt = String(cur.textContent || "").toLowerCase();
      if (/darecore\s*intelligence|ai\s*assistant|groq|chat.*ai|ai.*chat|assistant/i.test(id + " " + cls)) {
        return true;
      }
      if (i <= 5 && /darecore intelligence/i.test(txt) && /groq/i.test(txt)) {
        return true;
      }
      cur = cur.parentElement;
    }
    return false;
  };
})();
/* DARECORE STRICT PHONE BEFORE WHATSAPP */
(function () {
  if (window.__dcStrictPhoneBeforeWa) return;
  window.__dcStrictPhoneBeforeWa = true;

  function findPhoneInput() {
    const candidates = Array.from(document.querySelectorAll("input, tel"));
    return candidates.find(function (el) {
      const idn = ((el.id || "") + " " + (el.name || "") + " " + (el.placeholder || "") + " " + (el.getAttribute("aria-label") || "")).toLowerCase();
      if (/whatsapp|tel[eé]fono|telefono|celular|phone|477/i.test(idn)) return true;
      const parentTxt = (el.parentElement && el.parentElement.textContent || "").toLowerCase();
      return /whatsapp|tel[eé]fono|telefono|celular/i.test(parentTxt);
    }) || null;
  }

  function hasValidPhone() {
    const inp = findPhoneInput();
    if (!inp) return true;
    const digits = String(inp.value || "").replace(/\D+/g, "");
    return digits.length >= 10;
  }

  function alertPhoneRequired() {
    const msg = "Primero debes ingresar tu número de teléfono / WhatsApp (10 dígitos) antes de enviar o ir a WhatsApp.";
    if (typeof window.showFloatingToast === "function") {
      try { window.showFloatingToast(msg); } catch (_) {}
    } else {
      alert(msg);
    }
    const inp = findPhoneInput();
    if (inp) {
      inp.style.setProperty("border", "2px solid #ef4444", "important");
      inp.focus();
      setTimeout(function () { inp.style.border = ""; }, 3000);
    }
  }

  // Interceptar clics en botones de Dare Lab antes de cualquier otro handler
  document.addEventListener("click", function (e) { if (window.__dcIsInsideDareCoreAI && window.__dcIsInsideDareCoreAI(e.target)) return;
    const btn = e.target && e.target.closest ? e.target.closest("button, a, input[type='submit']") : null;
    if (!btn) return;
    const txt = ((btn.textContent || "") + " " + (btn.value || "")).trim().toLowerCase();
    const isDareLabBtn = /mockup|estimado|cotizar|personalizar|whatsapp/i.test(txt);
    const isPersonalizarPage = /personalizar/i.test(window.location.pathname || "");

    if ((isDareLabBtn || isPersonalizarPage) && /solicitar|estimado|cotizar|enviar|whatsapp/i.test(txt)) {
      if (!hasValidPhone()) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        window.__dcBlockWaUntil = Date.now() + 3000;
        alertPhoneRequired();
      }
    }
  }, true);

  // Interceptar envío de formularios en personalizar.html si falta teléfono
  document.addEventListener("submit", function (e) { if (window.__dcIsInsideDareCoreAI && window.__dcIsInsideDareCoreAI(e.target)) return;
    const isPersonalizarPage = /personalizar/i.test(window.location.pathname || "");
    if (isPersonalizarPage && !hasValidPhone()) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      window.__dcBlockWaUntil = Date.now() + 3000;
      alertPhoneRequired();
    }
  }, true);

  // Bloquear apertura de WhatsApp si el usuario no llenó el teléfono
  const origWinOpen = window.open.bind(window);
  window.open = function (url) {
    const u = String(url || "");
    if (/whatsapp\.com|wa\.me|api\.whatsapp/i.test(u)) {
      const blockedWindow = window.__dcBlockWaUntil && Date.now() < window.__dcBlockWaUntil;
      if (blockedWindow || !hasValidPhone()) {
        alertPhoneRequired();
        return null;
      }
    }
    return origWinOpen.apply(window, arguments);
  };
})();
/* ==========================================
   DARECORE - SCRIPT MAESTRO COMPLETO
   ========================================== */

const DARE_LAB_GLB_SRC = 'silueta-hombre.glb';
const WHATSAPP_PHONE = '5214777035509';

let selectedCustomBaseIndex = 0;
let selectedGender = 'hombre';
let selectedSizeLabel = 'M';
let selectedChestSize = 'M';
let selectedWaistSize = 'M';
let selectedLengthSize = 'M';
let selectedMeasurementZone = 'chest'; // 'chest' | 'waist' | 'length'
let adminSelectedGender = 'hombre';
let adminSelectedGarmentType = 'camisa';

let cart = readCartFromStorage();
let activeCartTab = 'cart';
let isSyncing = false;
let currentSearchTerm = '';
let heroSlideIndex = 0;
let heroAutoTimer = null;

function readCartFromStorage() {
    try {
        const raw = localStorage.getItem('darecore_cart');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

const ORDER_STATUSES = [
    'Pago pendiente',
    'Pedido pendiente',
    'En proceso',
    'Listo para enviar',
    'Enviado'
];

const STORE_URL = 'https://darecore-store-web.vercel.app';
const AVATAR_URL = 'https://i.ibb.co/cSm45r2D/darecorelogo.png';

const EMAIL_WEBHOOK_URL = '';

const EMAILJS_CONFIG = {
    publicKey: 'oPqh5dU4hbXT_uZng',
    serviceId: 'service_a3uxsit',
    newProductTemplateId: 'template_gxvi2ue',
    abandonedCartTemplateId: 'template_gxvi2ue'
};

const CINEMA_CARD_THEMES = [
    {
        bg: 'radial-gradient(circle at 80% 18%, rgba(255, 42, 0, 0.38) 0%, rgba(153, 27, 27, 0.22) 45%, rgba(18, 18, 23, 0.96) 85%)',
        glow: 'rgba(255, 42, 0, 0.34)',
        dot: '#ff2a00',
        heroBg: 'radial-gradient(circle at 80% 35%, #8f1d14 0%, #2a0c0d 52%, #0a0a0d 100%)'
    },
    {
        bg: 'radial-gradient(circle at 80% 18%, rgba(59, 130, 246, 0.36) 0%, rgba(30, 58, 138, 0.22) 45%, rgba(18, 18, 23, 0.96) 85%)',
        glow: 'rgba(59, 130, 246, 0.32)',
        dot: '#60a5fa',
        heroBg: 'radial-gradient(circle at 80% 35%, #1e3a8a 0%, #111827 55%, #090a0d 100%)'
    },
    {
        bg: 'radial-gradient(circle at 80% 18%, rgba(245, 158, 11, 0.34) 0%, rgba(146, 64, 14, 0.22) 45%, rgba(18, 18, 23, 0.96) 85%)',
        glow: 'rgba(245, 158, 11, 0.32)',
        dot: '#fbbf24',
        heroBg: 'radial-gradient(circle at 80% 35%, #78350f 0%, #1c1917 55%, #09090b 100%)'
    },
    {
        bg: 'radial-gradient(circle at 80% 18%, rgba(6, 182, 212, 0.36) 0%, rgba(21, 94, 117, 0.22) 45%, rgba(18, 18, 23, 0.96) 85%)',
        glow: 'rgba(6, 182, 212, 0.32)',
        dot: '#22d3ee',
        heroBg: 'radial-gradient(circle at 80% 35%, #155e75 0%, #0f172a 55%, #080a0c 100%)'
    },
    {
        bg: 'radial-gradient(circle at 80% 18%, rgba(168, 85, 247, 0.36) 0%, rgba(88, 28, 135, 0.22) 45%, rgba(18, 18, 23, 0.96) 85%)',
        glow: 'rgba(168, 85, 247, 0.32)',
        dot: '#c084fc',
        heroBg: 'radial-gradient(circle at 80% 35%, #581c87 0%, #181024 55%, #09080d 100%)'
    },
    {
        bg: 'radial-gradient(circle at 80% 18%, rgba(16, 185, 129, 0.34) 0%, rgba(6, 95, 70, 0.22) 45%, rgba(18, 18, 23, 0.96) 85%)',
        glow: 'rgba(16, 185, 129, 0.30)',
        dot: '#34d399',
        heroBg: 'radial-gradient(circle at 80% 35%, #065f46 0%, #0d1b18 55%, #080c0b 100%)'
    }
];

const DEFAULT_SIZE_CHARTS = {
    hombre: {
        camisa: {
            label: 'Camisa / Playera (Algodón)',
            fabricNote: 'Corte recto / boxy en algodón peinado (sin elongación elástica alta).',
            rows: [
                { size: 'CH / S', chestCm: '102', waistCm: '96', lengthCm: '70' },
                { size: 'M', chestCm: '108', waistCm: '102', lengthCm: '72' },
                { size: 'G / L', chestCm: '114', waistCm: '108', lengthCm: '74' },
                { size: 'EG / XL', chestCm: '120', waistCm: '114', lengthCm: '76' }
            ]
        },
        sudadera: {
            label: 'Sudadera / Hoodie (Felpa)',
            fabricNote: 'Felpa pesada con holgura extra para capas internas.',
            rows: [
                { size: 'CH / S', chestCm: '110', waistCm: '104', lengthCm: '71' },
                { size: 'M', chestCm: '116', waistCm: '110', lengthCm: '73' },
                { size: 'G / L', chestCm: '122', waistCm: '116', lengthCm: '75' },
                { size: 'EG / XL', chestCm: '128', waistCm: '122', lengthCm: '77' }
            ]
        },
        top: {
            label: 'Top / Compresión / Licra',
            fabricNote: 'Tejido elástico tipo licra: medidas en cm con ajuste ceñido/compresivo.',
            rows: [
                { size: 'CH / S', chestCm: '88', waistCm: '74', lengthCm: '64' },
                { size: 'M', chestCm: '94', waistCm: '80', lengthCm: '66' },
                { size: 'G / L', chestCm: '100', waistCm: '86', lengthCm: '68' },
                { size: 'EG / XL', chestCm: '106', waistCm: '92', lengthCm: '70' }
            ]
        }
    },
    mujer: {
        camisa: {
            label: 'Camisa / Playera (Algodón)',
            fabricNote: 'Silueta adaptada a contorno de busto, cintura y cadera en algodón.',
            rows: [
                { size: 'CH / S', chestCm: '88', waistCm: '70', lengthCm: '62' },
                { size: 'M', chestCm: '94', waistCm: '76', lengthCm: '64' },
                { size: 'G / L', chestCm: '100', waistCm: '82', lengthCm: '66' },
                { size: 'EG / XL', chestCm: '106', waistCm: '88', lengthCm: '68' }
            ]
        },
        sudadera: {
            label: 'Sudadera / Hoodie (Felpa)',
            fabricNote: 'Corte relajado en felpa con caída cómoda.',
            rows: [
                { size: 'CH / S', chestCm: '98', waistCm: '84', lengthCm: '63' },
                { size: 'M', chestCm: '104', waistCm: '90', lengthCm: '65' },
                { size: 'G / L', chestCm: '110', waistCm: '96', lengthCm: '67' },
                { size: 'EG / XL', chestCm: '116', waistCm: '102', lengthCm: '69' }
            ]
        },
        top: {
            label: 'Top / Licra / Seamless',
            fabricNote: 'Licra / spandex de alta elasticidad: se toma medida corporal directa en cm.',
            rows: [
                { size: 'CH / S', chestCm: '82', waistCm: '62', lengthCm: '38' },
                { size: 'M', chestCm: '88', waistCm: '68', lengthCm: '40' },
                { size: 'G / L', chestCm: '94', waistCm: '74', lengthCm: '42' },
                { size: 'EG / XL', chestCm: '100', waistCm: '80', lengthCm: '44' }
            ]
        }
    }
};

function ensureFirebaseRefs() {
    if (typeof firebase !== 'undefined' && Array.isArray(firebase.apps) && firebase.apps.length > 0) {
        if (!window.auth && typeof firebase.auth === 'function') {
            window.auth = firebase.auth();
        }
        if (!window.db && typeof firebase.firestore === 'function') {
            window.db = firebase.firestore();
        }
    }
    return { auth: window.auth || null, db: window.db || null };
}

async function persistGoogleUserSession(user) {
    if (!user) return;
    const { db } = ensureFirebaseRefs();

    if (db) {
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            name: user.displayName || 'Sin nombre',
            email: user.email || '',
            photoURL: user.photoURL || '',
            lastLogin: new Date().toISOString()
        }, { merge: true }).catch(err => console.error('Error guardando usuario:', err));
    }

    syncAbandonedCartState();
    await fetchClientPendingOrders();
}

function initGoogleRedirectHandler() {
    const { auth } = ensureFirebaseRefs();
    if (!auth || typeof auth.getRedirectResult !== 'function' || window._darecoreRedirectListenerBound) {
        return;
    }
    window._darecoreRedirectListenerBound = true;

    auth.getRedirectResult().then(async (result) => {
        if (result && result.user) {
            await persistGoogleUserSession(result.user);
            showFloatingToast(`Bienvenido, ${result.user.displayName || result.user.email}`);
            openCartModal('pending');
        }
    }).catch((err) => {
        console.error('Error en getRedirectResult:', err.code, err.message);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    cart = readCartFromStorage();
    ensureFirebaseRefs();
    initGoogleRedirectHandler();
    injectResponsiveMobileStyles();
    updateTopAnnouncementBanner();
    styleBrandLogoInHeader();
    layoutPublicHeaderZones();
    cleanExtraHeroBlocks();
    initHeroShowcase();
    initStore();
    setupSearch();
    setupDareLab();
    initAdminPanel();
    initCartSystem();
    checkAbandonedCartReminder();
});

window.addEventListener('pageshow', () => {
    cart = readCartFromStorage();
    updateCartUI();
});

window.addEventListener('storage', (e) => {
    if (e.key === 'darecore_cart') {
        cart = readCartFromStorage();
        updateCartUI();
    }
});

window.addEventListener('resize', () => {
    layoutPublicHeaderZones();
    applyMobileGridLayout();
});

function injectResponsiveMobileStyles() {
    if (document.getElementById('darecoreMobileResponsiveStyle')) return;
    const style = document.createElement('style');
    style.id = 'darecoreMobileResponsiveStyle';
    style.textContent = `
        #dareLabSizeGuideBox,
        #dareLabSizeGuideBox * {
            box-sizing: border-box;
            max-width: 100%;
        }

        .darelab-guide-split {
            display: grid;
            grid-template-columns: minmax(220px, 260px) minmax(0, 1fr);
            gap: 16px;
            align-items: start;
        }

        .darelab-zones-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
        }

        @media (max-width: 768px) {
            #productGrid,
            .product-grid {
                display: grid !important;
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 10px !important;
                padding: 8px !important;
            }

            #productGrid .product-card,
            .product-grid .product-card {
                padding: 10px !important;
                border-radius: 18px !important;
                min-width: 0 !important;
            }

            #productGrid .product-card-top,
            .product-grid .product-card-top {
                margin-bottom: 6px !important;
                gap: 4px !important;
            }

            #productGrid .product-tag,
            .product-grid .product-tag {
                font-size: 9px !important;
                padding: 2px 7px !important;
            }

            #productGrid .product-img,
            .product-grid .product-img {
                height: 128px !important;
                border-radius: 12px !important;
                margin-bottom: 8px !important;
            }

            #productGrid .product-name,
            .product-grid .product-name {
                font-size: 12px !important;
                line-height: 1.25 !important;
                margin-bottom: 4px !important;
            }

            #productGrid .product-desc,
            .product-grid .product-desc {
                font-size: 10px !important;
                line-height: 1.3 !important;
                margin-bottom: 8px !important;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            #productGrid .product-footer,
            .product-grid .product-footer {
                flex-direction: column !important;
                align-items: stretch !important;
                gap: 6px !important;
            }

            #productGrid .price,
            .product-grid .price {
                font-size: 12px !important;
            }

            #productGrid .btn-add,
            .product-grid .btn-add {
                width: 100% !important;
                padding: 7px 10px !important;
                font-size: 10px !important;
                border-radius: 999px !important;
            }

            .darelab-guide-split {
                grid-template-columns: minmax(0, 1fr) !important;
                gap: 14px !important;
            }

            .darelab-zones-grid {
                grid-template-columns: minmax(0, 1fr) !important;
                gap: 8px !important;
            }
        }
    `;
    document.head.appendChild(style);
}

function applyMobileGridLayout() {
    const grid = document.getElementById('productGrid') || document.querySelector('.product-grid');
    if (!grid) return;

    if (window.innerWidth <= 768) {
        grid.style.setProperty('display', 'grid', 'important');
        grid.style.setProperty('grid-template-columns', 'repeat(2, minmax(0, 1fr))', 'important');
        grid.style.setProperty('gap', '10px', 'important');
    } else {
        grid.style.removeProperty('grid-template-columns');
        grid.style.removeProperty('gap');
    }
}

function isHomePageSection() {
    const path = window.location.pathname.toLowerCase();
    const isSubpage =
        path.includes('hombre') ||
        path.includes('mujer') ||
        path.includes('oversize') ||
        path.includes('personalizar') ||
        path.includes('admin');

    if (isSubpage) return false;

    return (
        path === '/' ||
        path === '' ||
        path.endsWith('/index.html') ||
        path === 'index.html'
    );
}

function generateFolio(prefix) {
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${randomPart}`;
}

function styleBrandLogoInHeader() {
    const isAdminPage = window.location.pathname.toLowerCase().includes('admin');
    const logoLinks = document.querySelectorAll('header a.logo, .navbar a.logo, .site-header a.logo, .logo');

    logoLinks.forEach(logo => {
        if (isAdminPage && logo.closest('.admin-header, [class*="admin"]')) return;

        const cleanText = (logo.textContent || '').replace(/\s+/g, '').trim();
        if (/^DARECORE$/i.test(cleanText)) {
            const darePart = cleanText.slice(0, 4).toUpperCase();
            const corePart = cleanText.slice(4).toUpperCase();
            logo.innerHTML = `<span class="brand-dare" style="color:#0b0b0e !important;font-weight:900;">${darePart}</span><span class="brand-core-orange" style="color:#ff5500 !important;font-weight:900;">${corePart}</span>`;
            logo.dataset.darecoreStyled = 'true';
        }
    });
}

function layoutPublicHeaderZones() {
    if (window.location.pathname.toLowerCase().includes('admin')) return;

    const header = document.querySelector('header');
    const navContainer = document.querySelector('header .nav-container') || header;
    if (!navContainer) return;

    styleBrandLogoInHeader();

    if (window.innerWidth > 1024) {
        navContainer.style.setProperty('display', 'grid', 'important');
        navContainer.style.setProperty('grid-template-columns', 'auto minmax(0, 1fr) auto', 'important');
        navContainer.style.setProperty('align-items', 'center', 'important');
        navContainer.style.setProperty('width', '100%', 'important');
        navContainer.style.setProperty('max-width', '1440px', 'important');
        navContainer.style.setProperty('margin', '0 auto', 'important');
        navContainer.style.setProperty('padding', '0 24px', 'important');
        navContainer.style.setProperty('gap', '32px', 'important');

        const logo = navContainer.querySelector('.logo, a[href*="index.html"]');
        const navLinks = navContainer.querySelector('.nav-links, ul');
        const navActions = navContainer.querySelector('.nav-actions');

        if (logo) {
            logo.style.setProperty('grid-column', '1', 'important');
            logo.style.setProperty('justify-self', 'start', 'important');
            logo.style.setProperty('align-self', 'center', 'important');
            logo.style.setProperty('display', 'inline-flex', 'important');
            logo.style.setProperty('align-items', 'center', 'important');
            logo.style.setProperty('line-height', '1', 'important');
            logo.style.setProperty('margin', '0', 'important');
            logo.style.setProperty('white-space', 'nowrap', 'important');
        }

        if (navLinks) {
            navLinks.style.setProperty('grid-column', '2', 'important');
            navLinks.style.setProperty('justify-self', 'center', 'important');
            navLinks.style.setProperty('align-self', 'center', 'important');
            navLinks.style.setProperty('display', 'flex', 'important');
            navLinks.style.setProperty('flex-direction', 'row', 'important');
            navLinks.style.setProperty('align-items', 'center', 'important');
            navLinks.style.setProperty('gap', '28px', 'important');
            navLinks.style.setProperty('list-style', 'none', 'important');
            navLinks.style.setProperty('margin', '0', 'important');
            navLinks.style.setProperty('padding', '0', 'important');
            navLinks.style.setProperty('flex-wrap', 'nowrap', 'important');

            navLinks.querySelectorAll('li').forEach(li => {
                li.style.setProperty('display', 'inline-flex', 'important');
                li.style.setProperty('align-items', 'center', 'important');
                li.style.setProperty('margin', '0', 'important');
                li.style.setProperty('padding', '0', 'important');
                li.style.setProperty('white-space', 'nowrap', 'important');
            });

            navLinks.querySelectorAll('a').forEach(a => {
                a.style.setProperty('white-space', 'nowrap', 'important');
            });
        }

        if (navActions) {
            navActions.style.setProperty('grid-column', '3', 'important');
            navActions.style.setProperty('justify-self', 'end', 'important');
            navActions.style.setProperty('align-self', 'center', 'important');
            navActions.style.setProperty('display', 'flex', 'important');
            navActions.style.setProperty('flex-direction', 'row', 'important');
            navActions.style.setProperty('align-items', 'center', 'important');
            navActions.style.setProperty('gap', '12px', 'important');
            navActions.style.setProperty('margin', '0', 'important');
            navActions.style.setProperty('flex-shrink', '0', 'important');
        }
    } else {
        navContainer.style.setProperty('display', 'flex', 'important');
        navContainer.style.setProperty('flex-wrap', 'wrap', 'important');
        navContainer.style.setProperty('justify-content', 'space-between', 'important');
        navContainer.style.setProperty('gap', '12px', 'important');
        navContainer.style.setProperty('padding', '0 16px', 'important');
    }
}

function cleanExtraHeroBlocks() {
    const descTarget = 'NUESTRAS PIEZAS DE HOMBRE SON CONSTRUIDAS CON HILO OPEN-END PEINADO.';
    const extraTexts = [
        'SPOTLIGHT / DRAG RACE CLUB',
        'MONTE CARLO RACING #04',
        'DROP ACTIVO: APEX & GYM',
        'DISEÑOS DE ALTO RENDIMIENTO CON ESTÉTICA UNDERGROUND.',
        'DISENOS DE ALTO RENDIMIENTO CON ESTETICA UNDERGROUND.',
        'ALGODÓN 240G+ CON RIB GRUESO DE 3.2 CM',
        'ALGODON 240G+ CON RIB GRUESO DE 3.2 CM',
        'GRAMAJE POR PIEZA',
        'ANCHO DEL RIB DE CUELLO',
        'DEFORMACIÓN GARANTIZADA',
        'DEFORMACION GARANTIZADA',
        'ANATOMÍA DEL CORTE BOXY',
        'ANATOMIA DEL CORTE BOXY',
        'DROP SHOULDER 25 CM+',
        'SQUAT-PROOF & SEAMLESS',
        'ALTA COMPRESIÓN Y SOPORTE',
        'ALTA COMPRESION Y SOPORTE',
        'ESPECIFICACIÓN TÉCNICA',
        'ESPECIFICACION TECNICA',
        'ALGODÓN PEINADO 240G - 400G',
        'ALGODON PEINADO 240G - 400G'
    ];

    document.querySelectorAll('p, span, div, h1, h2, h3, h4, section, article').forEach(el => {
        if (el.id === 'darecoreHeroWrapper' || el.closest('#darecoreHeroWrapper')) return;
        const txt = (el.textContent || '').trim().toUpperCase();
        if (!txt) return;

        const isCottonDesc = el.children.length === 0 && (txt.includes('CONSTRUIDAS CON HILO OPEN-END PEINADO') || txt === descTarget);
        const isExtraBlockText = extraTexts.some(item => txt === item || (el.children.length === 0 && txt.includes(item)));

        if (isCottonDesc || isExtraBlockText) {
            if (el.children.length === 0) {
                el.textContent = '';
            }
            el.style.display = 'none';
            const smallContainer = el.closest('section, article, div');
            if (
                smallContainer &&
                smallContainer.id !== 'darecoreHeroWrapper' &&
                smallContainer.id !== 'productGrid' &&
                !smallContainer.classList.contains('product-grid') &&
                smallContainer.innerText.trim().length < 350
            ) {
                smallContainer.style.display = 'none';
            }
        }
    });

    const headings = Array.from(document.querySelectorAll('h2, h3, h4'));
    const columnHeads = headings.filter(h => {
        const t = (h.textContent || '').trim().toUpperCase();
        return t.includes('COLECCIONES') || t.includes('AYUDA') || t.includes('LEGAL');
    });

    if (columnHeads.length >= 2) {
        const boxes = columnHeads.map(h => h.closest('div, section, article') || h.parentElement).filter(Boolean);
        const uniqueBoxes = Array.from(new Set(boxes));

        if (uniqueBoxes.length >= 2) {
            const parent = uniqueBoxes[0].parentElement;
            if (parent && !parent.classList.contains('darecore-cinema-columns-grid')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'darecore-cinema-columns-grid';
                parent.insertBefore(wrapper, uniqueBoxes[0]);

                uniqueBoxes.forEach(box => {
                    box.classList.add('darecore-cinema-column-card');
                    wrapper.appendChild(box);
                });
            }
        }
    }
}

/* ==========================================
   HERO CAROUSEL AUTOMÁTICO (SOLO INICIO)
   ========================================== */
function getHeroSlides() {
    const products = getStoredProducts().filter(p => p && p.image);
    if (products.length > 0) {
        return products.slice(0, 5).map((p, idx) => {
            const theme = CINEMA_CARD_THEMES[idx % CINEMA_CARD_THEMES.length];
            return {
                id: p.id || p.firestoreId,
                kicker: p.tag || 'DROP UNDERGROUND • EDICIÓN LIMITADA',
                title: p.name,
                desc: p.desc || 'Corte boxy heavyweight diseñado para destacar en la escena urbana.',
                watermark: (p.category || 'DARECORE').toUpperCase(),
                image: p.image,
                price: p.price,
                heroBg: theme.heroBg
            };
        });
    }

    return [
        {
            id: null,
            kicker: 'DROP 01 • HEAVYWEIGHT 280G',
            title: 'Boxy Tee Nocturne',
            desc: 'Algodón de alto gramaje con caída estructurada y estética cinematográfica oscura.',
            watermark: 'DARECORE',
            image: AVATAR_URL,
            price: 550,
            heroBg: CINEMA_CARD_THEMES[0].heroBg
        },
        {
            id: null,
            kicker: 'DARE LAB • CUSTOM STUDIO',
            title: 'Oversized Graphite',
            desc: 'Tonos carbón y silueta amplia lista para personalizar con tu propio arte.',
            watermark: 'UNDERGROUND',
            image: AVATAR_URL,
            price: 620,
            heroBg: CINEMA_CARD_THEMES[1].heroBg
        }
    ];
}

function initHeroShowcase() {
    const existingHero = document.getElementById('darecoreHeroWrapper');

    if (!isHomePageSection()) {
        clearInterval(heroAutoTimer);
        if (existingHero) existingHero.remove();
        return;
    }

    const grid = document.getElementById('productGrid') || document.querySelector('.product-grid');
    if (!grid) return;

    let heroWrapper = existingHero;
    if (!heroWrapper) {
        heroWrapper = document.createElement('section');
        heroWrapper.id = 'darecoreHeroWrapper';
        heroWrapper.className = 'darecore-hero-wrapper';
        const anchor = grid.closest('section') || grid;
        anchor.parentNode.insertBefore(heroWrapper, anchor);
    }

    renderHeroSlide(0);
    startHeroAutoPlay();
}

function renderHeroSlide(index) {
    if (!isHomePageSection()) {
        clearInterval(heroAutoTimer);
        const existingHero = document.getElementById('darecoreHeroWrapper');
        if (existingHero) existingHero.remove();
        return;
    }

    const heroWrapper = document.getElementById('darecoreHeroWrapper');
    if (!heroWrapper) return;

    const slides = getHeroSlides();
    heroSlideIndex = ((index % slides.length) + slides.length) % slides.length;
    const current = slides[heroSlideIndex];

    const dotsHtml = slides.map((_, idx) =>
        `<button type="button" class="darecore-hero-dot ${idx === heroSlideIndex ? 'active' : ''}" onclick="goToHeroSlide(${idx})" aria-label="Slide ${idx + 1}"></button>`
    ).join('');

    const ctaAction = current.id
        ? `openProductModal('${current.id}')`
        : `document.getElementById('productGrid')?.scrollIntoView({ behavior: 'smooth' })`;

    heroWrapper.innerHTML = `
        <div class="darecore-hero-stage" style="background: ${current.heroBg};">
            <div class="darecore-hero-watermark">${current.watermark}</div>
            <div class="darecore-hero-content">
                <span class="darecore-hero-kicker">${current.kicker}</span>
                <h1 class="darecore-hero-title">${current.title}</h1>
                <p class="darecore-hero-desc">${current.desc}</p>
                <div class="darecore-hero-actions">
                    <button type="button" class="darecore-hero-cta" onclick="${ctaAction}">
                        Ver prenda • $${Number(current.price || 550).toLocaleString('es-MX')} MXN
                    </button>
                </div>
            </div>
            <div class="darecore-hero-visual">
                <img src="${current.image}" alt="${current.title}">
            </div>
            <div class="darecore-hero-dots">${dotsHtml}</div>
        </div>
    `;
}

function goToHeroSlide(index) {
    renderHeroSlide(index);
    startHeroAutoPlay();
}

function startHeroAutoPlay() {
    clearInterval(heroAutoTimer);
    if (!isHomePageSection()) return;
    heroAutoTimer = setInterval(() => {
        renderHeroSlide(heroSlideIndex + 1);
    }, 4500);
}

/* ==========================================
   FRANJA SUPERIOR, TOAST VERDE Y MODAL CONFIRMACIÓN
   ========================================== */
function updateTopAnnouncementBanner() {
    const targetText = 'NUEVA COLECCIÓN DISPONIBLE • PERSONALIZA TU PRENDA IDEAL';
    const allElements = document.querySelectorAll('header *, nav *, section *, div *, p, span, a');

    allElements.forEach(el => {
        if (el.children.length === 0 && el.textContent) {
            const raw = el.textContent.trim();
            const upper = raw.toUpperCase();
            const isPromoStrip =
                upper.includes('EDICIÓN LIMITADA') ||
                upper.includes('EDICION LIMITADA') ||
                upper.includes('HECHO EN MÉXICO') ||
                upper.includes('HECHO EN MEXICO') ||
                upper.includes('NUEVA COLECCIÓN DISPONIBLE') ||
                upper.includes('NUEVA COLECCION DISPONIBLE') ||
                upper.includes('DARE LAB CUSTOM STUDIO');

            if (isPromoStrip) {
                el.textContent = targetText;
            }
        }
    });
}

function showFloatingToast(message) {
    let toast = document.getElementById('darecoreFloatingToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'darecoreFloatingToast';
        toast.style.cssText = [
            'position: fixed',
            'top: 50%',
            'left: 50%',
            'transform: translate(-50%, -50%) scale(0.95)',
            'background: #16a34a',
            'color: #ffffff',
            'padding: 14px 26px',
            'border-radius: 999px',
            'font-size: 13px',
            'font-weight: 800',
            'letter-spacing: 0.4px',
            'box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55)',
            'border: 1px solid rgba(255, 255, 255, 0.25)',
            'z-index: 99999',
            'opacity: 0',
            'pointer-events: none',
            'text-align: center',
            'max-width: 90vw',
            'transition: opacity 0.22s ease, transform 0.22s ease'
        ].join(';');
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    clearTimeout(window._darecoreToastTimer);
    window._darecoreToastTimer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -50%) scale(0.95)';
    }, 2400);
}

function showConfirmModal(message) {
    return new Promise((resolve) => {
        let overlay = document.getElementById('darecoreConfirmModal');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'darecoreConfirmModal';
            overlay.style.cssText = [
                'display: none',
                'position: fixed',
                'inset: 0',
                'background: rgba(0, 0, 0, 0.78)',
                'backdrop-filter: blur(8px)',
                'z-index: 100000',
                'justify-content: center',
                'align-items: center',
                'padding: 20px'
            ].join(';');
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div style="background: #121216; color: #ffffff; border: 1px solid rgba(255,255,255,0.12); border-radius: 26px; padding: 28px; max-width: 400px; width: 100%; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8); text-align: center;">
                <div style="font-size: 11px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">DARECORE</div>
                <div style="font-size: 15px; font-weight: 700; color: #ffffff; line-height: 1.45; margin-bottom: 24px;">${message}</div>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button id="darecoreConfirmAccept" type="button" style="flex: 1; background: #16a34a; color: #ffffff; border: none; padding: 12px 16px; border-radius: 999px; font-size: 13px; font-weight: 800; cursor: pointer; text-transform: uppercase;">Aceptar</button>
                    <button id="darecoreConfirmCancel" type="button" style="flex: 1; background: #dc2626; color: #ffffff; border: none; padding: 12px 16px; border-radius: 999px; font-size: 13px; font-weight: 800; cursor: pointer; text-transform: uppercase;">Cancelar</button>
                </div>
            </div>
        `;

        overlay.style.display = 'flex';

        const cleanup = (result) => {
            overlay.style.display = 'none';
            resolve(result);
        };

        document.getElementById('darecoreConfirmAccept').onclick = () => cleanup(true);
        document.getElementById('darecoreConfirmCancel').onclick = () => cleanup(false);
        overlay.onclick = (e) => {
            if (e.target === overlay) cleanup(false);
        };
    });
}

function getStatusBadgeStyle(status) {
    switch (status) {
        case 'Pago pendiente':
            return 'background: rgba(249, 115, 22, 0.18); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.45);';
        case 'En proceso':
            return 'background: rgba(255, 193, 7, 0.16); color: #ffc107; border: 1px solid rgba(255, 193, 7, 0.45);';
        case 'Listo para enviar':
            return 'background: rgba(59, 130, 246, 0.18); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.45);';
        case 'Enviado':
            return 'background: rgba(34, 197, 94, 0.16); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.45);';
        case 'Pedido pendiente':
        default:
            return 'background: rgba(255, 59, 27, 0.16); color: #ff6b52; border: 1px solid rgba(255, 59, 27, 0.45);';
    }
}

/* ==========================================
1. GESTIÓN DE PRODUCTOS, DIFUMINADO MULTICOLOR Y TOUCH MÓVIL
   ========================================== */
function getStoredProducts() {
    const { db } = ensureFirebaseRefs();
    if (db && !isSyncing) {
        isSyncing = true;
        db.collection('products').orderBy('id', 'desc').get().then((snapshot) => {
            if (!snapshot.empty) {
                const cloudProducts = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id }));
                localStorage.setItem('darecore_products', JSON.stringify(cloudProducts));
                if (!currentSearchTerm.trim()) {
                    initStore();
                    renderHeroSlide(heroSlideIndex);
                }
            }
        }).catch(err => console.log("Modo offline:", err))
          .finally(() => { setTimeout(() => { isSyncing = false; }, 2000); });
    }

    const local = localStorage.getItem('darecore_products');
    if (local) {
        try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) { /* fallback */ }
    }
    return [];
}

function saveProductsLocal(products) {
    localStorage.setItem('darecore_products', JSON.stringify(products));
}

function initStore() {
    const grid = document.getElementById('productGrid') || document.querySelector('.product-grid');
    if (!grid) return;

    const path = window.location.pathname.toLowerCase();
    let currentCategory = 'inicio';
    if (path.includes('hombre')) currentCategory = 'hombre';
    else if (path.includes('mujer')) currentCategory = 'mujer';
    else if (path.includes('oversize')) currentCategory = 'oversize';

    const allProducts = getStoredProducts();
    const filtered = currentCategory === 'inicio'
        ? allProducts
        : allProducts.filter(p => p.category === currentCategory || p.category === 'inicio');

    renderProducts(filtered);
}

function setupTouchPopCards() {
    const cards = document.querySelectorAll('.product-card');
    if (!cards.length) return;

    const activateCard = (targetCard) => {
        cards.forEach(c => {
            if (c !== targetCard) c.classList.remove('touch-pop-active');
        });
        if (targetCard) targetCard.classList.add('touch-pop-active');
    };

    cards.forEach(card => {
        card.addEventListener('touchstart', () => {
            activateCard(card);
        }, { passive: true });
    });

    document.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        if (!touch) return;
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const hoveredCard = el ? el.closest('.product-card') : null;
        if (hoveredCard) {
            activateCard(hoveredCard);
        }
    }, { passive: true });
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid') || document.querySelector('.product-grid');
    if (!grid) return;

    applyMobileGridLayout();

    grid.innerHTML = '';
    if (!products || products.length === 0) {
        grid.innerHTML = '<p style="color: #71717a; grid-column: 1/-1; text-align: center; padding: 48px; background: #ffffff; border-radius: 24px; border: 1.5px solid rgba(0,0,0,0.08);">No hay prendas registradas todavía. Agrega tus productos desde el Panel de Administración.</p>';
        return;
    }

    products.forEach((p, idx) => {
        const theme = CINEMA_CARD_THEMES[idx % CINEMA_CARD_THEMES.length];
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.setProperty('--dot-color', theme.dot);
        card.style.setProperty('--card-border', theme.dot);
        card.style.setProperty('--card-glow', theme.glow);
        card.style.setProperty('--card-aura', theme.bg);

        card.innerHTML = `
            <div class="product-card-top">
                <span class="product-tag">${p.tag || 'DARECORE'}</span>
                <span class="product-color-dot"></span>
            </div>
            <div class="product-img" style="background-image: url('${p.image || ''}');"></div>
            <div class="product-name">${p.name}</div>
            <div class="product-desc">${p.desc}</div>
            <div class="product-footer">
                <span class="price">$${Number(p.price).toLocaleString('es-MX')} <small style="font-weight:600; opacity:0.75;">MXN</small></span>
                <button class="btn-add" onclick="event.stopPropagation(); addToCart('${p.id || p.firestoreId}')">Agregar</button>
            </div>
        `;

        card.addEventListener('click', () => {
            openProductModal(p.id || p.firestoreId);
        });

        grid.appendChild(card);
    });

    setupTouchPopCards();
}

/* ==========================================
2. BUSCADOR GLOBAL INTELIGENTE
   ========================================== */
function setupSearch() {
    const searchInput = document.getElementById('searchInput') || document.querySelector('.search-box');
    if (!searchInput) return;

    const applyFilter = (rawValue) => {
        currentSearchTerm = (rawValue || '').toLowerCase().trim();
        const products = getStoredProducts();

        if (!currentSearchTerm) {
            initStore();
            return;
        }

        const filtered = products.filter(p =>
            (p.name && p.name.toLowerCase().includes(currentSearchTerm)) ||
            (p.desc && p.desc.toLowerCase().includes(currentSearchTerm)) ||
            (p.category && p.category.toLowerCase().includes(currentSearchTerm)) ||
            (p.tag && p.tag.toLowerCase().includes(currentSearchTerm))
        );
        renderProducts(filtered);
    };

    searchInput.addEventListener('input', (e) => applyFilter(e.target.value));
}

/* ==========================================
3. MODAL DE VISTA RÁPIDA
   ========================================== */
function openProductModal(productId) {
    const products = getStoredProducts();
    const product = products.find(p => p.id == productId || p.firestoreId == productId);
    if (!product) return;

    let modalOverlay = document.getElementById('quickViewModal');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'quickViewModal';
        modalOverlay.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(10px); z-index:9999; justify-content:center; align-items:center; padding:20px;";
        document.body.appendChild(modalOverlay);
    }

    modalOverlay.innerHTML = `
        <div class="product-modal-content" style="background:#121217; border:1.5px solid #ff2a00; padding:30px; border-radius:28px; max-width:680px; width:100%; position:relative; display:grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap:24px; box-shadow:0 28px 70px rgba(0,0,0,0.85);">
            <button onclick="closeProductModal()" class="product-modal-close" style="position:absolute; top:14px; right:18px; background:rgba(255,255,255,0.08); border:none; color:#fff; width:34px; height:34px; border-radius:50%; font-size:20px; cursor:pointer;">×</button>
            <div style="background-image: url('${product.image}'); background-size: cover; background-position: center; height:280px; border-radius:20px; background-color:#1e1e24;"></div>
            <div style="display: flex; flex-direction: column; justify-content: center; color: #ffffff;">
                <span style="color: #ff2a00; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing:1px; margin-bottom: 6px;">${product.tag || 'DARECORE'}</span>
                <h2 style="font-size: 22px; font-weight: 900; margin-bottom: 10px; color: #ffffff;">${product.name}</h2>
                <p style="color: #a1a1aa; font-size: 13px; margin-bottom: 18px; line-height: 1.5;">${product.desc}</p>
                <div style="font-size: 20px; font-weight: 900; color: #ffffff; margin-bottom: 22px;">$${Number(product.price).toLocaleString('es-MX')} MXN</div>
                <button onclick="addToCart('${product.id || product.firestoreId}'); closeProductModal();" style="background:linear-gradient(135deg, #ff2a00 0%, #ff5500 100%); color:#fff; border:none; padding:14px 20px; border-radius:999px; font-weight:800; cursor:pointer; text-transform: uppercase; letter-spacing:0.5px;">Agregar al Carrito</button>
            </div>
        </div>
    `;
    modalOverlay.style.display = 'flex';
}

function closeProductModal() {
    const modalOverlay = document.getElementById('quickViewModal');
    if (modalOverlay) modalOverlay.style.display = 'none';
}

/* ==========================================
4. DARE LAB (SILUETA .GLB FIJA, MEDIDAS INDEPENDIENTES Y WHATSAPP)
   ========================================== */
function getCustomBases() {
    const local = localStorage.getItem('darecore_custom_bases');
    if (local) {
        try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) { /* fallback */ }
    }
    return [
        { id: 'b1', name: 'BOXY TEE 240G', price: 580, desc: 'Camisa / playera algodón peinado pesado', garmentType: 'camisa' },
        { id: 'b2', name: 'HEAVY HOODIE 400G', price: 1099, desc: 'Sudadera / hoodie felpa francesa alto gramaje', garmentType: 'sudadera' },
        { id: 'b3', name: 'VARSITY JACKET BORDADA', price: 1750, desc: 'Chamarra de equipo', garmentType: 'sudadera' },
        { id: 'b4', name: 'TOP DEPORTIVO SEAMLESS', price: 460, desc: 'Top / licra compresión gym', garmentType: 'top' }
    ];
}

function getSizeChartsData() {
    const local = localStorage.getItem('darecore_size_charts');
    if (local) {
        try {
            const parsed = JSON.parse(local);
            if (parsed && parsed.hombre && parsed.mujer) return parsed;
        } catch (e) { /* fallback */ }
    }
    return JSON.parse(JSON.stringify(DEFAULT_SIZE_CHARTS));
}

function persistSizeChartsData(chartsData) {
    localStorage.setItem('darecore_size_charts', JSON.stringify(chartsData));
    const { db } = ensureFirebaseRefs();
    if (db) {
        db.collection('settings').doc('sizeCharts').set(chartsData, { merge: true }).catch(err => console.log(err));
    }
}

function detectGarmentTypeFromBase(baseObj) {
    const charts = getSizeChartsData();
    const genderCharts = charts[selectedGender] || charts.hombre;
    const keys = Object.keys(genderCharts);

    if (baseObj && baseObj.garmentType && genderCharts[baseObj.garmentType]) {
        return baseObj.garmentType;
    }

    const combinedText = `${baseObj?.name || ''} ${baseObj?.desc || ''}`.toLowerCase();
    if (combinedText.includes('top') || combinedText.includes('licra') || combinedText.includes('seamless') || combinedText.includes('compres')) {
        return genderCharts.top ? 'top' : keys[0];
    }
    if (combinedText.includes('sudadera') || combinedText.includes('hoodie') || combinedText.includes('varsity') || combinedText.includes('chamarra') || combinedText.includes('felpa')) {
        return genderCharts.sudadera ? 'sudadera' : keys[0];
    }
    if (combinedText.includes('camisa') || combinedText.includes('playera') || combinedText.includes('tee')) {
        return genderCharts.camisa ? 'camisa' : keys[0];
    }

    return keys[0] || 'camisa';
}

function getZoneLabelText(zone, gender) {
    if (zone === 'waist') {
        return 'Cintura (cm): Contorno natural de la cintura donde se toma la referencia.';
    }
    if (zone === 'length') {
        return 'Largo (cm): Medida desde el punto más alto del hombro hasta el borde inferior.';
    }
    return gender === 'mujer'
        ? 'Busto / Pecho (cm): Contorno completo sobre la parte más prominente del busto.'
        : 'Pecho (cm): Contorno completo alrededor del pecho a la altura de las axilas.';
}

function getSelectedMixSummaryText() {
    if (
        selectedChestSize === selectedWaistSize &&
        selectedWaistSize === selectedLengthSize
    ) {
        return selectedChestSize;
    }
    return `Pecho ${selectedChestSize} / Cintura ${selectedWaistSize} / Largo ${selectedLengthSize}`;
}

function getGlbGlowStyle(zone) {
    if (zone === 'waist') {
        return 'top: 56%; width: 106px; height: 28px; border-radius: 999px;';
    }
    if (zone === 'length') {
        return 'top: 52%; width: 96px; height: 92px; border-radius: 18px;';
    }
    return 'top: 43%; width: 124px; height: 36px; border-radius: 999px;';
}

function renderSculptedAnatomySvg(gender, zone) {
    const glowStyle = getGlbGlowStyle(zone);
    return `
        <div style="position:relative; width:100%; height:100%; min-height:240px;">
            <model-viewer
                src="${DARE_LAB_GLB_SRC}"
                disable-pan
                disable-tap
                disable-zoom
                interaction-prompt="none"
                camera-orbit="0deg 78deg 105%"
                camera-target="0m auto 0m"
                shadow-intensity="0.8"
                exposure="1"
                style="width:100%; height:100%; min-height:240px; background:transparent; --poster-color:transparent; pointer-events:none;">
            </model-viewer>
            <div id="dareLabGlbZoneGlow" style="position:absolute; left:50%; transform:translate(-50%, -50%); border:1.5px dashed #ff5500; background:radial-gradient(ellipse at center, rgba(255, 85, 0, 0.42) 0%, rgba(255, 42, 0, 0.06) 75%); box-shadow:0 0 22px rgba(255, 85, 0, 0.5); pointer-events:none; transition:all 0.3s ease; ${glowStyle}"></div>
        </div>
    `;
}

function updateActiveAnatomyAndSummary() {
    const glbGlow = document.getElementById('dareLabGlbZoneGlow');
    const viewport = document.getElementById('dareLabThreeViewport');
    if (glbGlow) {
        glbGlow.setAttribute(
            'style',
            `position:absolute; left:50%; transform:translate(-50%, -50%); border:1.5px dashed #ff5500; background:radial-gradient(ellipse at center, rgba(255, 85, 0, 0.42) 0%, rgba(255, 42, 0, 0.06) 75%); box-shadow:0 0 22px rgba(255, 85, 0, 0.5); pointer-events:none; transition:all 0.3s ease; ${getGlbGlowStyle(selectedMeasurementZone)}`
        );
    } else if (viewport) {
        viewport.innerHTML = renderSculptedAnatomySvg(selectedGender, selectedMeasurementZone);
    }

    const caption = document.getElementById('dareLabZoneCaption');
    if (caption) {
        caption.textContent = getZoneLabelText(selectedMeasurementZone, selectedGender);
    }

    const bases = getCustomBases();
    const activeBase = bases[selectedCustomBaseIndex] || bases[0];
    const charts = getSizeChartsData();
    const genderMap = charts[selectedGender] || charts.hombre;
    const garmentKeys = Object.keys(genderMap);
    const activeGarmentKey = detectGarmentTypeFromBase(activeBase);
    const activeChart = genderMap[activeGarmentKey] || genderMap[garmentKeys[0]];
    const rows = Array.isArray(activeChart?.rows) ? activeChart.rows : [];
    const fallbackRow = rows[0] || { size: 'M', chestCm: '100', waistCm: '82', lengthCm: '68' };

    const chestRow = rows.find(r => r.size === selectedChestSize) || fallbackRow;
    const waistRow = rows.find(r => r.size === selectedWaistSize) || fallbackRow;
    const lengthRow = rows.find(r => r.size === selectedLengthSize) || fallbackRow;

    const chestCard = document.getElementById('cardZoneChest');
    const waistCard = document.getElementById('cardZoneWaist');
    const lengthCard = document.getElementById('cardZoneLength');
    if (chestCard) chestCard.style.borderColor = selectedMeasurementZone === 'chest' ? '#ff2a00' : '#e4e4e7';
    if (waistCard) waistCard.style.borderColor = selectedMeasurementZone === 'waist' ? '#ff2a00' : '#e4e4e7';
    if (lengthCard) lengthCard.style.borderColor = selectedMeasurementZone === 'length' ? '#ff2a00' : '#e4e4e7';

    const measuresBar = document.getElementById('dareLabActiveMeasuresBar');
    if (measuresBar) {
        measuresBar.innerHTML = `
            <span><strong>Pecho/Busto (${chestRow.size}):</strong> ${chestRow.chestCm} cm</span>
            <span><strong>Cintura (${waistRow.size}):</strong> ${waistRow.waistCm} cm</span>
            <span><strong>Largo (${lengthRow.size}):</strong> ${lengthRow.lengthCm} cm</span>
        `;
    }

    const selectedLabelEl = document.getElementById('dareLabSelectedSizeSummary');
    if (selectedLabelEl) {
        selectedLabelEl.innerHTML = `
            Selección actual: <strong style="color:#ff2a00;">${getSelectedMixSummaryText()}</strong> (${selectedGender === 'mujer' ? 'Mujer' : 'Hombre'} • ${activeChart?.label || activeGarmentKey})
        `;
    }

    const selChest = document.getElementById('dropdownChestMeasure');
    const selWaist = document.getElementById('dropdownWaistMeasure');
    const selLength = document.getElementById('dropdownLengthMeasure');
    if (selChest && selChest.value !== chestRow.size) selChest.value = chestRow.size;
    if (selWaist && selWaist.value !== waistRow.size) selWaist.value = waistRow.size;
    if (selLength && selLength.value !== lengthRow.size) selLength.value = lengthRow.size;

    updateCustomSummary();
}

function renderSizeGuideBlock() {
    const container = document.getElementById('customBasesContainer');
    if (!container) return;

    const bases = getCustomBases();
    const activeBase = bases[selectedCustomBaseIndex] || bases[0];
    const charts = getSizeChartsData();
    const genderMap = charts[selectedGender] || charts.hombre;
    const garmentKeys = Object.keys(genderMap);
    const activeGarmentKey = detectGarmentTypeFromBase(activeBase);
    const activeChart = genderMap[activeGarmentKey] || genderMap[garmentKeys[0]];
    const rows = Array.isArray(activeChart?.rows) ? activeChart.rows : [];
    const defaultSize = rows[0]?.size || 'M';

    if (!rows.some(r => r.size === selectedSizeLabel)) selectedSizeLabel = defaultSize;
    if (!rows.some(r => r.size === selectedChestSize)) selectedChestSize = selectedSizeLabel;
    if (!rows.some(r => r.size === selectedWaistSize)) selectedWaistSize = selectedSizeLabel;
    if (!rows.some(r => r.size === selectedLengthSize)) selectedLengthSize = selectedSizeLabel;

    const fallbackRow = rows[0] || { size: 'M', chestCm: '100', waistCm: '82', lengthCm: '68' };
    const chestRow = rows.find(r => r.size === selectedChestSize) || fallbackRow;
    const waistRow = rows.find(r => r.size === selectedWaistSize) || fallbackRow;
    const lengthRow = rows.find(r => r.size === selectedLengthSize) || fallbackRow;

    const hasHtmlTemplate = Boolean(
        document.getElementById('dareLabModelViewer') &&
        document.getElementById('dropdownChestMeasure') &&
        document.getElementById('dropdownWaistMeasure') &&
        document.getElementById('dropdownLengthMeasure')
    );

    if (hasHtmlTemplate) {
        const chartTitle = document.getElementById('dareLabChartTitle');
        if (chartTitle) {
            chartTitle.textContent = `${activeChart?.label || 'Guía de tallas'} • ${selectedGender === 'mujer' ? 'Mujer' : 'Hombre'}`;
        }

        const btnHombre = document.getElementById('btnGenderHombre');
        const btnMujer = document.getElementById('btnGenderMujer');
        if (btnHombre) {
            btnHombre.style.background = selectedGender === 'hombre' ? '#ff2a00' : '#fff';
            btnHombre.style.color = selectedGender === 'hombre' ? '#fff' : '#0b0b0e';
        }
        if (btnMujer) {
            btnMujer.style.background = selectedGender === 'mujer' ? '#ff2a00' : '#fff';
            btnMujer.style.color = selectedGender === 'mujer' ? '#fff' : '#0b0b0e';
        }

        const tabsEl = document.getElementById('dareLabGarmentTabs');
        if (tabsEl) {
            tabsEl.innerHTML = garmentKeys.map(key => {
                const item = genderMap[key];
                const isActive = key === activeGarmentKey;
                return `<button type="button" onclick="setDareLabGarmentType('${key}')" style="padding:6px 12px; border-radius:999px; font-size:11px; font-weight:700; cursor:pointer; border:1px solid ${isActive ? '#0b0b0e' : '#d4d4d8'}; background:${isActive ? '#0b0b0e' : '#f4f4f5'}; color:${isActive ? '#fff' : '#3f3f46'};">${item.label || key}</button>`;
            }).join('');
        }

        const noteEl = document.getElementById('dareLabFabricNote');
        if (noteEl) {
            noteEl.textContent = activeChart?.fabricNote || '';
            noteEl.style.display = activeChart?.fabricNote ? 'block' : 'none';
        }

        const silLabel = document.getElementById('dareLabSilhouetteLabel');
        if (silLabel) {
            silLabel.textContent = `SILUETA • ${selectedGender === 'mujer' ? 'MUJER' : 'HOMBRE'}`;
        }

        const modelViewer = document.getElementById('dareLabModelViewer');
        if (modelViewer && modelViewer.getAttribute('src') !== DARE_LAB_GLB_SRC) {
            modelViewer.setAttribute('src', DARE_LAB_GLB_SRC);
        }

        const selChest = document.getElementById('dropdownChestMeasure');
        const selWaist = document.getElementById('dropdownWaistMeasure');
        const selLength = document.getElementById('dropdownLengthMeasure');

        if (selChest) {
            selChest.innerHTML = rows.map(r => `<option value="${r.size}" ${r.size === chestRow.size ? 'selected' : ''}>Talla ${r.size} — ${r.chestCm} cm</option>`).join('');
        }
        if (selWaist) {
            selWaist.innerHTML = rows.map(r => `<option value="${r.size}" ${r.size === waistRow.size ? 'selected' : ''}>Talla ${r.size} — ${r.waistCm} cm</option>`).join('');
        }
        if (selLength) {
            selLength.innerHTML = rows.map(r => `<option value="${r.size}" ${r.size === lengthRow.size ? 'selected' : ''}>Talla ${r.size} — ${r.lengthCm} cm</option>`).join('');
        }

        updateActiveAnatomyAndSummary();
        return;
    }

    let guideBox = document.getElementById('dareLabSizeGuideBox');
    if (!guideBox) {
        guideBox = document.createElement('div');
        guideBox.id = 'dareLabSizeGuideBox';
        container.insertAdjacentElement('afterend', guideBox);
    }

    guideBox.style.cssText = 'margin-top: 18px; width: 100%; background: #ffffff; border: 1.5px solid #ff2a00; border-radius: 26px; padding: 18px; box-shadow: 0 10px 26px rgba(255, 42, 0, 0.08); color: #0b0b0e;';

    guideBox.innerHTML = `
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:10px; margin-bottom:14px;">
            <div style="min-width:0;">
                <div style="font-size:11px; font-weight:900; color:#ff2a00; text-transform:uppercase; letter-spacing:0.6px;">TABLA DE MEDIDAS EN 3D (CM)</div>
                <div style="font-size:14px; font-weight:800; color:#0b0b0e;">${activeChart?.label || 'Guía de tallas'} • ${selectedGender === 'mujer' ? 'Mujer' : 'Hombre'}</div>
            </div>
            <div style="display:flex; gap:8px;">
                <button type="button" id="btnGenderHombre" onclick="setDareLabGender('hombre')" style="padding:7px 14px; border-radius:999px; font-size:11px; font-weight:800; cursor:pointer; border:1.5px solid #ff2a00; ${selectedGender === 'hombre' ? 'background:#ff2a00; color:#fff;' : 'background:#fff; color:#0b0b0e;'}">Hombre</button>
                <button type="button" id="btnGenderMujer" onclick="setDareLabGender('mujer')" style="padding:7px 14px; border-radius:999px; font-size:11px; font-weight:800; cursor:pointer; border:1.5px solid #ff2a00; ${selectedGender === 'mujer' ? 'background:#ff2a00; color:#fff;' : 'background:#fff; color:#0b0b0e;'}">Mujer</button>
            </div>
        </div>

        <div id="dareLabGarmentTabs" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            ${garmentKeys.map(key => {
                const item = genderMap[key];
                const isActive = key === activeGarmentKey;
                return `<button type="button" onclick="setDareLabGarmentType('${key}')" style="padding:6px 12px; border-radius:999px; font-size:11px; font-weight:700; cursor:pointer; border:1px solid ${isActive ? '#0b0b0e' : '#d4d4d8'}; background:${isActive ? '#0b0b0e' : '#f4f4f5'}; color:${isActive ? '#fff' : '#3f3f46'};">${item.label || key}</button>`;
            }).join('')}
        </div>

        <p id="dareLabFabricNote" style="margin:0 0 14px 0; font-size:12px; color:#52525b; ${activeChart?.fabricNote ? '' : 'display:none;'}">${activeChart?.fabricNote || ''}</p>

        <div class="darelab-guide-split">
            <div style="background:#0c0c10; border:1.5px solid #ff2a00; border-radius:20px; padding:12px; color:#fff; box-shadow: 0 12px 28px rgba(255, 42, 0, 0.16); min-width:0;">
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; font-weight:800; color:#ff5500; text-transform:uppercase; margin-bottom:6px;">
                    <span id="dareLabSilhouetteLabel">SILUETA • ${selectedGender === 'mujer' ? 'MUJER' : 'HOMBRE'}</span>
                    <span>DIFUMINADO NARANJA</span>
                </div>
                <div id="dareLabThreeViewport" style="width:100%; height:240px; border-radius:14px; overflow:hidden; background: radial-gradient(circle at 50% 35%, #27272a 0%, #0c0c10 75%);">
                    ${renderSculptedAnatomySvg(selectedGender, selectedMeasurementZone)}
                </div>
                <div id="dareLabZoneCaption" style="margin-top:10px; font-size:11px; color:#e4e4e7; line-height:1.45; background:rgba(255, 42, 0, 0.14); border:1px solid rgba(255, 85, 0, 0.4); padding:8px 10px; border-radius:12px;">
                    ${getZoneLabelText(selectedMeasurementZone, selectedGender)}
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:12px; min-width:0;">
                <div class="darelab-zones-grid">
                    <div id="cardZoneChest" style="background:#fafafa; border:1.5px solid ${selectedMeasurementZone === 'chest' ? '#ff2a00' : '#e4e4e7'}; border-radius:16px; padding:10px; min-width:0;">
                        <label for="dropdownChestMeasure" style="display:block; font-size:11px; font-weight:800; color:#ff2a00; margin-bottom:6px; cursor:pointer;">Pecho / Busto (cm)</label>
                        <select id="dropdownChestMeasure" onmousedown="setMeasurementZone('chest')" onfocus="setMeasurementZone('chest')" onchange="selectIndependentMeasure('chest', this.value)" style="width:100%; padding:8px 10px; border-radius:10px; border:1px solid #d4d4d8; font-size:12px; font-weight:700; background:#fff; color:#0b0b0e; cursor:pointer;">
                            ${rows.map(r => `<option value="${r.size}" ${r.size === chestRow.size ? 'selected' : ''}>Talla ${r.size} — ${r.chestCm} cm</option>`).join('')}
                        </select>
                    </div>

                    <div id="cardZoneWaist" style="background:#fafafa; border:1.5px solid ${selectedMeasurementZone === 'waist' ? '#ff2a00' : '#e4e4e7'}; border-radius:16px; padding:10px; min-width:0;">
                        <label for="dropdownWaistMeasure" style="display:block; font-size:11px; font-weight:800; color:#ff2a00; margin-bottom:6px; cursor:pointer;">Cintura (cm)</label>
                        <select id="dropdownWaistMeasure" onmousedown="setMeasurementZone('waist')" onfocus="setMeasurementZone('waist')" onchange="selectIndependentMeasure('waist', this.value)" style="width:100%; padding:8px 10px; border-radius:10px; border:1px solid #d4d4d8; font-size:12px; font-weight:700; background:#fff; color:#0b0b0e; cursor:pointer;">
                            ${rows.map(r => `<option value="${r.size}" ${r.size === waistRow.size ? 'selected' : ''}>Talla ${r.size} — ${r.waistCm} cm</option>`).join('')}
                        </select>
                    </div>

                    <div id="cardZoneLength" style="background:#fafafa; border:1.5px solid ${selectedMeasurementZone === 'length' ? '#ff2a00' : '#e4e4e7'}; border-radius:16px; padding:10px; min-width:0;">
                        <label for="dropdownLengthMeasure" style="display:block; font-size:11px; font-weight:800; color:#ff2a00; margin-bottom:6px; cursor:pointer;">Largo (cm)</label>
                        <select id="dropdownLengthMeasure" onmousedown="setMeasurementZone('length')" onfocus="setMeasurementZone('length')" onchange="selectIndependentMeasure('length', this.value)" style="width:100%; padding:8px 10px; border-radius:10px; border:1px solid #d4d4d8; font-size:12px; font-weight:700; background:#fff; color:#0b0b0e; cursor:pointer;">
                            ${rows.map(r => `<option value="${r.size}" ${r.size === lengthRow.size ? 'selected' : ''}>Talla ${r.size} — ${r.lengthCm} cm</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div id="dareLabActiveMeasuresBar" style="background:#f9fafb; border:1px solid #e4e4e7; border-radius:16px; padding:12px; font-size:12px; color:#27272a; display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px;">
                    <span><strong>Pecho/Busto (${chestRow.size}):</strong> ${chestRow.chestCm} cm</span>
                    <span><strong>Cintura (${waistRow.size}):</strong> ${waistRow.waistCm} cm</span>
                    <span><strong>Largo (${lengthRow.size}):</strong> ${lengthRow.lengthCm} cm</span>
                </div>
            </div>
        </div>

        <div id="dareLabSelectedSizeSummary" style="margin-top:12px; font-size:12px; color:#0b0b0e;">
            Selección actual: <strong style="color:#ff2a00;">${getSelectedMixSummaryText()}</strong> (${selectedGender === 'mujer' ? 'Mujer' : 'Hombre'} • ${activeChart?.label || activeGarmentKey})
        </div>
    `;

    updateCustomSummary();
}

function setMeasurementZone(zone) {
    if (selectedMeasurementZone === zone) return;
    selectedMeasurementZone = zone;
    updateActiveAnatomyAndSummary();
}

function setDareLabGender(gender) {
    selectedGender = gender === 'mujer' ? 'mujer' : 'hombre';
    renderSizeGuideBlock();
}

function setDareLabGarmentType(garmentKey) {
    const bases = getCustomBases();
    if (bases[selectedCustomBaseIndex]) {
        bases[selectedCustomBaseIndex].garmentType = garmentKey;
        localStorage.setItem('darecore_custom_bases', JSON.stringify(bases));
    }
    renderSizeGuideBlock();
}

function selectIndependentMeasure(zone, sizeLabel) {
    selectedMeasurementZone = zone;
    if (zone === 'chest') selectedChestSize = sizeLabel;
    else if (zone === 'waist') selectedWaistSize = sizeLabel;
    else if (zone === 'length') selectedLengthSize = sizeLabel;

    if (
        selectedChestSize === selectedWaistSize &&
        selectedWaistSize === selectedLengthSize
    ) {
        selectedSizeLabel = sizeLabel;
    } else {
        selectedSizeLabel = getSelectedMixSummaryText();
    }

    updateActiveAnatomyAndSummary();
}

function selectDareLabSize(sizeLabel) {
    selectedSizeLabel = sizeLabel;
    selectedChestSize = sizeLabel;
    selectedWaistSize = sizeLabel;
    selectedLengthSize = sizeLabel;
    updateActiveAnatomyAndSummary();
}

function moveQuoteBelowWhatsapp() {
    if (!window.location.pathname.toLowerCase().includes('personalizar')) return;

    const whatsappEl = document.getElementById('customWhatsapp');
    const summaryPriceEl = document.getElementById('summaryTotalPrice');
    const quoteBox =
        (summaryPriceEl && summaryPriceEl.closest('div[class*="card"], div[class*="summary"], div[class*="quote"], section, aside')) ||
        Array.from(document.querySelectorAll('h2, h3, h4, div')).find(el =>
            el.children.length <= 8 &&
            (el.textContent || '').toUpperCase().includes('RESUMEN DE COTIZACIÓN')
        )?.closest('div');

    if (!whatsappEl || !quoteBox) return;

    const whatsappContainer =
        whatsappEl.closest('.form-group, .input-group, .field-group, div[class*="form"], div[class*="input"]') ||
        whatsappEl.parentElement;

    if (!whatsappContainer || whatsappContainer.contains(quoteBox)) return;

    const mainRowOrGrid = quoteBox.parentElement;
    if (mainRowOrGrid && mainRowOrGrid !== document.body) {
        mainRowOrGrid.style.setProperty('grid-template-columns', 'minmax(0, 1fr)', 'important');
        mainRowOrGrid.style.setProperty('display', 'block', 'important');
    }

    quoteBox.style.setProperty('width', '100%', 'important');
    quoteBox.style.setProperty('max-width', '100%', 'important');
    quoteBox.style.setProperty('margin-top', '24px', 'important');

    whatsappContainer.insertAdjacentElement('afterend', quoteBox);
}

function compressImageFile(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/')) {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(null);
            img.src = event.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

function getSelectExtra(selectEl) {
    if (!selectEl || !selectEl.options || selectEl.selectedIndex < 0) {
        return { label: '', extra: 0 };
    }
    const opt = selectEl.options[selectEl.selectedIndex];
    const labelText = (opt.textContent || opt.value || '').trim();
    const rawExtra =
        opt.getAttribute('data-extra') ??
        opt.getAttribute('data-price') ??
        opt.dataset?.extra ??
        opt.dataset?.price ??
        '0';

    let extra = Number(String(rawExtra).replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(extra)) extra = 0;

    if (extra === 0 && !opt.hasAttribute('data-extra') && !opt.hasAttribute('data-price') && labelText.includes('+')) {
        const match = labelText.match(/\+\s*\$?\s*([0-9]+(?:\.[0-9]+)?)/);
        if (match) {
            const parsedNum = Number(match[1]);
            if (Number.isFinite(parsedNum)) extra = parsedNum;
        }
    }

    const cleanLabel = (opt.value || labelText.split('(+')[0] || labelText).trim();
    return { label: cleanLabel, extra };
}

function getTechniqueSelectionData() {
    const techSelect =
        document.getElementById('customTechniqueSelect') ||
        document.querySelector('select[name*="technique" i], select[id*="technique" i], select[id*="estampado" i], select[name*="estampado" i]');

    const placementSelect =
        document.getElementById('customPlacementSelect') ||
        document.querySelector('select[id*="placement" i], select[name*="placement" i], select[id*="ubicacion" i], select[name*="ubicacion" i], select[id*="posicion" i], select[name*="posicion" i]');

    if (techSelect || placementSelect) {
        const techInfo = getSelectExtra(techSelect);
        const placeInfo = getSelectExtra(placementSelect);

        const parts = [techInfo.label, placeInfo.label].filter(Boolean);
        return {
            label: parts.length > 0 ? parts.join(' • ') : 'Estándar',
            extra: techInfo.extra + placeInfo.extra
        };
    }

    const activeBtn = document.querySelector(
        '[data-technique].active, [data-technique].selected, [data-technique][aria-pressed="true"], ' +
        '.technique-btn.active, .technique-btn.selected, .estampado-option.active, .estampado-option.selected'
    );
    if (activeBtn) {
        const rawExtra = activeBtn.getAttribute('data-extra') ?? activeBtn.getAttribute('data-price') ?? '0';
        const extra = Number(String(rawExtra).replace(/[^0-9.-]/g, '')) || 0;
        const label = (activeBtn.getAttribute('data-technique') || activeBtn.textContent || '').trim();
        return { label: label || 'Estándar', extra };
    }

    const techInput = document.getElementById('customTechnique') || document.getElementById('estampadoInput');
    if (techInput) {
        const rawExtra = techInput.getAttribute('data-extra') ?? techInput.getAttribute('data-price') ?? '0';
        const extra = Number(String(rawExtra).replace(/[^0-9.-]/g, '')) || 0;
        return { label: (techInput.value || '').trim() || 'Estándar', extra };
    }

    return { label: 'Estándar', extra: 0 };
}

function updateCustomSummary() {
    const bases = getCustomBases();
    const selectedBase = bases[selectedCustomBaseIndex] || bases[0];
    const basePrice = Number(selectedBase ? selectedBase.price : 0) || 0;

    const { label: techLabel, extra: extraCost } = getTechniqueSelectionData();
    const totalPrice = basePrice + extraCost;

    const summaryBaseName = document.getElementById('summaryBaseName');
    const summaryTechName = document.getElementById('summaryTechName');
    const summaryTotalPrice = document.getElementById('summaryTotalPrice');

    if (summaryBaseName && selectedBase) {
        summaryBaseName.textContent = `${selectedBase.name} (${getSelectedMixSummaryText()})`;
    }
    if (summaryTechName) {
        summaryTechName.textContent = techLabel;
    }
    if (summaryTotalPrice) {
        summaryTotalPrice.textContent = `$${totalPrice.toLocaleString('es-MX')} MXN`;
    }
}

function resetDareLabForm() {
    selectedCustomBaseIndex = 0;
    selectedGender = 'hombre';
    selectedSizeLabel = 'M';
    selectedChestSize = 'M';
    selectedWaistSize = 'M';
    selectedLengthSize = 'M';
    selectedMeasurementZone = 'chest';
    const fileInput = document.getElementById('customDesignFile');
    if (fileInput) fileInput.value = '';
    const notesInput = document.getElementById('customNotes');
    if (notesInput) notesInput.value = '';
    const techSelect = document.getElementById('customTechniqueSelect');
    if (techSelect) techSelect.selectedIndex = 0;
    const placementSelect = document.getElementById('customPlacementSelect');
    if (placementSelect) placementSelect.selectedIndex = 0;
    renderCustomBasesPublic();
}

function bindDareLabTechniqueListeners() {
    const controls = document.querySelectorAll(
        '#customTechniqueSelect, #customPlacementSelect, #customTechnique, #estampadoInput, ' +
        'select[name*="technique" i], select[id*="technique" i], select[id*="estampado" i], select[name*="estampado" i], ' +
        'select[id*="placement" i], select[name*="placement" i], select[id*="ubicacion" i], select[name*="ubicacion" i]'
    );
    controls.forEach(el => {
        if (!el.dataset.darecoreBound) {
            el.dataset.darecoreBound = 'true';
            el.addEventListener('change', updateCustomSummary);
            el.addEventListener('input', updateCustomSummary);
        }
    });

    if (!document.body.dataset.darecoreTechDelegation) {
        document.body.dataset.darecoreTechDelegation = 'true';
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-technique], [data-extra], [data-price], .technique-btn, .estampado-option');
            if (target) {
                setTimeout(updateCustomSummary, 0);
            }
        });
        document.addEventListener('change', (e) => {
            if (e.target && e.target.matches('select, input[type="radio"], input[type="checkbox"]')) {
                updateCustomSummary();
            }
        });
    }
}

function getMockupSubmitButton() {
    return (
        document.getElementById('requestMockupBtn') ||
        document.getElementById('whatsappMockupBtn') ||
        document.querySelector('[data-whatsapp-mockup], .btn-whatsapp-mockup') ||
        Array.from(document.querySelectorAll('button, input[type="submit"], a[role="button"], a.btn, a')).find(el => {
            const txt = (el.textContent || el.value || '').trim();
            return /solicitar\s*mockup|enviar\s*por\s*whatsapp|cotizar\s*en\s*whatsapp/i.test(txt);
        }) ||
        null
    );
}

function buildDareLabWhatsAppMessage({ orderNumber, selectedBase, selectedGender, mixText, techName, total, whatsapp, rawNotes, fileName }) {
    const lines = [
        `Hola DareCore, quiero solicitar mi mockup digital y cotización:`,
        `• Folio: #${orderNumber}`,
        `• Prenda base: ${selectedBase.name} ($${Number(selectedBase.price || 0).toLocaleString('es-MX')} MXN)`,
        `• Género / Medidas: ${selectedGender === 'mujer' ? 'Mujer' : 'Hombre'} — ${mixText}`,
        `• Técnica / Posición: ${techName}`,
        `• Total estimado: $${Number(total || 0).toLocaleString('es-MX')} MXN`,
        `• Diseño / Archivo: ${fileName}`
    ];

    if (rawNotes) {
        lines.push(`• Notas: ${rawNotes}`);
    }
    if (whatsapp) {
        lines.push(`• Mi WhatsApp: ${whatsapp}`);
    }

    return lines.join('\n');
}

function openWhatsAppWithMessage(message) {
    const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    const popup = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        window.location.href = waUrl;
    }
}

function handleMockupRequestSubmit(e) {
    if (e) {
        e.preventDefault();
        if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
        }
    }

    if (window._darecoreSubmittingMockup) return;
    window._darecoreSubmittingMockup = true;

    setTimeout(() => {
        window._darecoreSubmittingMockup = false;
    }, 800);

    const whatsappInput =
        document.getElementById('customWhatsapp') ||
        document.querySelector('input[type="tel"], input[name*="whatsapp" i], input[id*="whatsapp" i]');
    const whatsapp = whatsappInput ? whatsappInput.value.trim() : '';

    const bases = getCustomBases();
    const selectedBase = bases[selectedCustomBaseIndex] || bases[0] || { name: 'BOXY TEE 240G', price: 580 };
    const garmentType = detectGarmentTypeFromBase(selectedBase);
    const { label: techName, extra: extraCost } = getTechniqueSelectionData();
    const total = (Number(selectedBase.price) || 0) + extraCost;

    const fileInput = document.getElementById('customDesignFile');
    const fileObj = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    const fileName = fileObj ? fileObj.name : 'Lo enviaré por chat';
    const rawNotes = document.getElementById('customNotes')?.value.trim() || '';
    const mixText = getSelectedMixSummaryText();
    const sizeInfoText = `Género: ${selectedGender === 'mujer' ? 'Mujer' : 'Hombre'} | Tipo: ${garmentType} | Medidas: ${mixText}`;
    const notes = rawNotes ? `${sizeInfoText} — ${rawNotes}` : sizeInfoText;

    const { auth, db } = ensureFirebaseRefs();
    const currentUser = auth && auth.currentUser ? auth.currentUser : null;
    const orderNumber = generateFolio('PEDIDO');
    const initialStatus = 'Pago pendiente';
    const createdAt = new Date().toISOString();

    const waMessage = buildDareLabWhatsAppMessage({
        orderNumber,
        selectedBase,
        selectedGender,
        mixText,
        techName,
        total,
        whatsapp,
        rawNotes,
        fileName
    });

    // Guardar pedido pendiente al instante para que aparezca en el carrito
    saveClientPendingOrder({
        id: orderNumber,
        collection: 'darelab_orders',
        folio: orderNumber,
        typeLabel: 'Dare Lab',
        summary: `${selectedBase.name} • ${mixText} (${techName})`,
        total: total,
        status: initialStatus,
        delivered: false,
        createdAt: createdAt
    });

    showFloatingToast(`Solicitud #${orderNumber} enviada a WhatsApp`);

    // Abrir WhatsApp de forma síncrona dentro del evento de clic para evitar bloqueos de pop-up
    openWhatsAppWithMessage(waMessage);

    // Guardar en Firestore y comprimir imagen en segundo plano
    (async () => {
        let compressedImageBase64 = '';
        if (fileObj) {
            try {
                compressedImageBase64 = (await compressImageFile(fileObj)) || '';
            } catch (err) {
                console.log("Error comprimiendo imagen:", err);
            }
        }

        if (db) {
            try {
                const docRef = await db.collection('darelab_orders').add({
                    orderNumber: orderNumber,
                    orderType: 'pedido_darelab',
                    status: initialStatus,
                    userEmail: currentUser ? currentUser.email : 'Invitado (sin sesión)',
                    userName: currentUser ? currentUser.displayName : 'Invitado',
                    whatsapp: whatsapp || 'No ingresado',
                    baseName: selectedBase.name,
                    gender: selectedGender,
                    garmentType: garmentType,
                    size: mixText,
                    chestSize: selectedChestSize,
                    waistSize: selectedWaistSize,
                    lengthSize: selectedLengthSize,
                    technique: techName,
                    fileName: fileName,
                    imageData: compressedImageBase64,
                    notes: notes,
                    total: total,
                    createdAt: createdAt
                });

                saveClientPendingOrder({
                    id: docRef.id,
                    collection: 'darelab_orders',
                    folio: orderNumber,
                    typeLabel: 'Dare Lab',
                    summary: `${selectedBase.name} • ${mixText} (${techName})`,
                    total: total,
                    status: initialStatus,
                    delivered: false,
                    createdAt: createdAt
                });
            } catch (err) {
                console.error("Error guardando solicitud de Dare Lab:", err);
            }
        }
    })();
}

function setupDareLab() {
    const isCustomizePage = window.location.pathname.toLowerCase().includes('personalizar');
    const container = document.getElementById('customBasesContainer');

    if (container) {
        renderCustomBasesPublic();
        moveQuoteBelowWhatsapp();
        bindDareLabTechniqueListeners();
        updateCustomSummary();
    }

    const mockupBtn = getMockupSubmitButton();
    if (mockupBtn && !mockupBtn.dataset.darecoreSubmitBound) {
        mockupBtn.dataset.darecoreSubmitBound = 'true';
        mockupBtn.addEventListener('click', handleMockupRequestSubmit, true);

        const parentForm = mockupBtn.closest('form');
        if (parentForm && !parentForm.dataset.darecoreFormBound) {
            parentForm.dataset.darecoreFormBound = 'true';
            parentForm.addEventListener('submit', handleMockupRequestSubmit, true);
        }
    }

    if (isCustomizePage && !document.body.dataset.darecoreMockupDelegation) {
        document.body.dataset.darecoreMockupDelegation = 'true';
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('#requestMockupBtn, #whatsappMockupBtn, [data-whatsapp-mockup], .btn-whatsapp-mockup, button, a[role="button"]');
            if (!btn) return;
            const txt = (btn.textContent || btn.value || '').trim();
            if (/solicitar\s*mockup|enviar\s*por\s*whatsapp|cotizar\s*en\s*whatsapp/i.test(txt)) {
                handleMockupRequestSubmit(e);
            }
        }, true);
    }
}

function renderCustomBasesPublic() {
    const container = document.getElementById('customBasesContainer');
    if (!container) return;

    const bases = getCustomBases();
    if (selectedCustomBaseIndex >= bases.length) {
        selectedCustomBaseIndex = 0;
    }

    const activeBase = bases[selectedCustomBaseIndex] || bases[0];

    container.style.cssText = 'display: block; width: 100%;';
    container.innerHTML = `
        <div style="background: #ffffff; border: 1.5px solid #ff2a00; border-radius: 26px; padding: 18px 20px; box-shadow: 0 10px 26px rgba(255, 42, 0, 0.08);">
            <label for="customBaseSelect" style="display: block; font-size: 12px; font-weight: 800; color: #0b0b0e; margin-bottom: 10px;">
                Prenda base y gramaje
            </label>
            <select id="customBaseSelect" style="width: 100%; background: #ffffff; color: #0b0b0e; border: 1.5px solid #ff2a00; border-radius: 999px; padding: 12px 18px; font-size: 13px; font-weight: 700; cursor: pointer; outline: none;">
                ${bases.map((base, index) => `
                    <option value="${index}" ${index === selectedCustomBaseIndex ? 'selected' : ''}>
                        ${base.name}${base.desc ? ` — ${base.desc}` : ''} ($${Number(base.price).toLocaleString('es-MX')} MXN)
                    </option>
                `).join('')}
            </select>
            <div id="customBaseHelperInfo" style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; color: #52525b; padding: 0 4px;">
                <span>${activeBase ? (activeBase.desc || '') : ''}</span>
                <strong style="color: #ff2a00; font-size: 14px;">$${Number(activeBase ? activeBase.price : 0).toLocaleString('es-MX')} MXN</strong>
            </div>
        </div>
    `;

    const selectEl = document.getElementById('customBaseSelect');
    if (selectEl) {
        selectEl.addEventListener('change', (e) => {
            selectedCustomBaseIndex = Number(e.target.value) || 0;
            const currentBase = bases[selectedCustomBaseIndex] || bases[0];
            const helperEl = document.getElementById('customBaseHelperInfo');
            if (helperEl && currentBase) {
                helperEl.innerHTML = `
                    <span>${currentBase.desc || ''}</span>
                    <strong style="color: #ff2a00; font-size: 14px;">$${Number(currentBase.price).toLocaleString('es-MX')} MXN</strong>
                `;
            }
            renderSizeGuideBlock();
        });
    }

    renderSizeGuideBlock();
}

/* ==========================================
5. SISTEMA DE CARRITO COMPARTIDO, ESTATUS, RECORDATORIO 24H Y PAGOS
   ========================================== */
function getClientPendingOrdersLocal() {
    try {
        const raw = localStorage.getItem('darecore_client_orders');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function saveClientPendingOrder(orderEntry) {
    const list = getClientPendingOrdersLocal();
    const filtered = list.filter(item => item.folio !== orderEntry.folio);
    filtered.unshift(orderEntry);
    localStorage.setItem('darecore_client_orders', JSON.stringify(filtered.slice(0, 25)));
}

async function getDeliveredFoliosSet() {
    const deliveredSet = new Set();
    const { db } = ensureFirebaseRefs();
    if (!db) return deliveredSet;

    try {
        const snap = await db.collection('delivered_folios').get();
        snap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.folio) deliveredSet.add(data.folio);
            if (data.orderId) deliveredSet.add(data.orderId);
            deliveredSet.add(docSnap.id);
        });
    } catch (err) {
        console.log("No se pudieron consultar folios entregados:", err);
    }
    return deliveredSet;
}

async function fetchClientPendingOrders() {
    const localOrders = getClientPendingOrdersLocal();
    const { auth, db } = ensureFirebaseRefs();
    const currentUser = auth && auth.currentUser ? auth.currentUser : null;
    const mergedMap = new Map();

    localOrders.forEach(item => {
        if (item && item.folio) {
            mergedMap.set(item.folio, { ...item });
        }
    });

    if (db) {
        try {
            const deliveredSet = await getDeliveredFoliosSet();
            mergedMap.forEach((entry, folio) => {
                const isMarkedDelivered = Boolean(entry.delivered) ||
                    deliveredSet.has(folio) ||
                    (entry.id && deliveredSet.has(entry.id));
                if (isMarkedDelivered) {
                    mergedMap.set(folio, { ...entry, delivered: true, status: 'Entregado' });
                }
            });

            if (currentUser && currentUser.email) {
                const [cartSnap, labSnap, deliveredSnap] = await Promise.all([
                    db.collection('orders').where('userEmail', '==', currentUser.email).get(),
                    db.collection('darelab_orders').where('userEmail', '==', currentUser.email).get(),
                    db.collection('delivered_orders').where('userEmail', '==', currentUser.email).get()
                ]);

                cartSnap.forEach(docSnap => {
                    const d = docSnap.data();
                    const folio = d.purchaseNumber || docSnap.id;
                    const summaryText = Array.isArray(d.items)
                        ? d.items.map(i => `${i.qty}x ${i.name}`).join(', ')
                        : 'Compra en tienda';
                    mergedMap.set(folio, {
                        id: docSnap.id,
                        collection: 'orders',
                        folio: folio,
                        typeLabel: 'Carrito',
                        summary: summaryText,
                        total: d.total || 0,
                        status: d.status || 'Pago pendiente',
                        delivered: false,
                        createdAt: d.createdAt || ''
                    });
                });

                labSnap.forEach(docSnap => {
                    const d = docSnap.data();
                    const folio = d.orderNumber || docSnap.id;
                    mergedMap.set(folio, {
                        id: docSnap.id,
                        collection: 'darelab_orders',
                        folio: folio,
                        typeLabel: 'Dare Lab',
                        summary: `${d.baseName || 'Prenda'} (${d.technique || 'Estándar'})`,
                        total: d.total || 0,
                        status: d.status || 'Pago pendiente',
                        delivered: false,
                        createdAt: d.createdAt || ''
                    });
                });

                deliveredSnap.forEach(docSnap => {
                    const d = docSnap.data();
                    const folio = d.folio || d.purchaseNumber || d.orderNumber || docSnap.id;
                    mergedMap.set(folio, {
                        id: docSnap.id,
                        collection: 'delivered_orders',
                        folio: folio,
                        typeLabel: d.typeLabel || 'Pedido',
                        summary: d.summary || 'Pedido completado',
                        total: d.total || 0,
                        status: 'Entregado',
                        delivered: true,
                        createdAt: d.createdAt || ''
                    });
                });
            }
        } catch (err) {
            console.log("Error refrescando pedidos desde Firestore:", err);
        }
    }

    const combined = Array.from(mergedMap.values()).sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    }).slice(0, 25);

    localStorage.setItem('darecore_client_orders', JSON.stringify(combined));
    return combined;
}

function syncAbandonedCartState() {
    cart = readCartFromStorage();
    if (cart.length === 0) {
        localStorage.removeItem('darecore_cart_updated_at');
        localStorage.removeItem('darecore_cart_reminded_24h');
        const { auth, db } = ensureFirebaseRefs();
        const currentUser = auth && auth.currentUser ? auth.currentUser : null;
        if (db && currentUser && currentUser.uid) {
            db.collection('abandoned_carts').doc(currentUser.uid).delete().catch(() => {});
        }
        return;
    }

    const nowIso = new Date().toISOString();
    localStorage.setItem('darecore_cart_updated_at', nowIso);

    const { auth, db } = ensureFirebaseRefs();
    const currentUser = auth && auth.currentUser ? auth.currentUser : null;
    if (db && currentUser && currentUser.email) {
        const remindAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        db.collection('abandoned_carts').doc(currentUser.uid).set({
            uid: currentUser.uid,
            userName: currentUser.displayName || 'Cliente',
            userEmail: currentUser.email,
            items: cart.map(i => ({ name: i.name, qty: Number(i.qty || 1), price: Number(i.price) })),
            updatedAt: nowIso,
            remindAt: remindAt,
            storeUrl: STORE_URL,
            avatarUrl: AVATAR_URL,
            emailSubject: 'Tienes un carrito pendiente en DareCore Store',
            emailBody: `Tienes un carrito pendiente en DareCore Store. No pierdas la oportunidad de lucir con estilo a donde vayas. Visita la tienda: ${STORE_URL}`
        }, { merge: true }).catch(() => {});
    }
}

function checkAbandonedCartReminder() {
    cart = readCartFromStorage();
    if (cart.length === 0) return;
    const updatedAt = localStorage.getItem('darecore_cart_updated_at');
    if (!updatedAt) return;

    const elapsedMs = Date.now() - new Date(updatedAt).getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    const alreadyReminded = localStorage.getItem('darecore_cart_reminded_24h') === 'true';

    if (elapsedMs >= twentyFourHoursMs && !alreadyReminded) {
        localStorage.setItem('darecore_cart_reminded_24h', 'true');
        const { auth } = ensureFirebaseRefs();
        const currentUser = auth && auth.currentUser ? auth.currentUser : null;
        if (currentUser && currentUser.email) {
            triggerAutomatedEmail({
                type: 'abandoned_cart_24h',
                recipients: [currentUser.email],
                subject: 'Tienes un carrito pendiente en DareCore Store',
                message: `Tienes un carrito pendiente en DareCore Store. No pierdas la oportunidad de lucir con estilo a donde vayas.\n\nIr a la tienda: ${STORE_URL}`
            });
        }
    }
}

async function triggerAutomatedEmail(payload) {
    const { db } = ensureFirebaseRefs();
    if (db) {
        try {
            await db.collection('mail_queue').add({
                ...payload,
                storeUrl: STORE_URL,
                avatarUrl: AVATAR_URL,
                createdAt: new Date().toISOString(),
                status: 'queued'
            });
        } catch (err) {
            console.log("No se pudo encolar notificación:", err);
        }
    }

    if (EMAIL_WEBHOOK_URL) {
        try {
            await fetch(EMAIL_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    storeUrl: STORE_URL,
                    avatarUrl: AVATAR_URL
                })
            });
        } catch (err) {
            console.log("Webhook de correo no disponible:", err);
        }
    }

    const templateId = payload.type === 'abandoned_cart_24h'
        ? EMAILJS_CONFIG.abandonedCartTemplateId
        : EMAILJS_CONFIG.newProductTemplateId;

    if (EMAILJS_CONFIG.publicKey && EMAILJS_CONFIG.serviceId && templateId && Array.isArray(payload.recipients)) {
        await Promise.all(payload.recipients.map(email =>
            fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lib_version: '4.4.1',
                    user_id: EMAILJS_CONFIG.publicKey,
                    service_id: EMAILJS_CONFIG.serviceId,
                    template_id: templateId,
                    template_params: {
                        to_email: email,
                        subject: payload.subject,
                        message: payload.message,
                        product_name: payload.productName || '',
                        product_price: payload.productPrice || '',
                        store_url: STORE_URL,
                        avatar_url: AVATAR_URL
                    }
                })
            }).catch(() => {})
        ));
    }
}

function addToCart(productId) {
    cart = readCartFromStorage();
    const products = getStoredProducts();
    const product = products.find(p => p.id == productId || p.firestoreId == productId);
    if (!product) return;

    const existingItem = cart.find(item => (item.id == productId || item.firestoreId == productId));
    if (existingItem) {
        existingItem.qty = Number(existingItem.qty || 1) + 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    saveCart();
    updateCartUI();
    showFloatingToast(`"${product.name}" agregado al carrito`);
}

function changeCartQty(index, delta) {
    cart = readCartFromStorage();
    if (!cart[index]) return;
    const nextQty = Number(cart[index].qty || 1) + delta;
    if (nextQty <= 0) {
        cart.splice(index, 1);
    } else {
        cart[index].qty = nextQty;
    }
    saveCart();
    updateCartUI();
    openCartModal('cart');
}

function saveCart() {
    localStorage.setItem('darecore_cart', JSON.stringify(cart));
    syncAbandonedCartState();
}

function updateCartUI() {
    const latestCart = readCartFromStorage();
    cart = latestCart;
    const badges = document.querySelectorAll('.cart-badge, #cartCount, #cartBadge, [data-cart-count]');
    const totalCount = latestCart.reduce((sum, item) => sum + Number(item.qty || 1), 0);
    badges.forEach(b => {
        b.textContent = totalCount;
        b.innerText = totalCount;
    });
}

function initCartSystem() {
    updateCartUI();

    const cartBtns = document.querySelectorAll('.cart-btn, #cartBtn, [data-open-cart]');
    cartBtns.forEach(btn => {
        if (!btn.dataset.darecoreCartBound) {
            btn.dataset.darecoreCartBound = 'true';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                cart = readCartFromStorage();
                updateCartUI();
                openCartModal(activeCartTab);
            });
        }
    });
}

function switchCartTab(tabName) {
    activeCartTab = tabName;
    openCartModal(tabName);
}

function renderCartModalContent(modalOverlay, pendingOrders) {
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty || 1)), 0);

    const cartTabStyle = activeCartTab === 'cart'
        ? 'background:#ff2a00; color:#fff; border:1px solid #ff2a00;'
        : 'background:#1a1a20; color:#bbb; border:1px solid rgba(255,255,255,0.1);';

    const pendingTabStyle = activeCartTab === 'pending'
        ? 'background:#ff2a00; color:#fff; border:1px solid #ff2a00;'
        : 'background:#1a1a20; color:#bbb; border:1px solid rgba(255,255,255,0.1);';

    let bodyContentHtml = '';

    if (activeCartTab === 'cart') {
        if (cart.length === 0) {
            bodyContentHtml = '<p style="color:#9ca3af; text-align:center; padding:40px 15px;">Tu carrito está vacío. Agrega prendas o revisa la pestaña <strong>Pedido pendiente</strong>.</p>';
        } else {
            bodyContentHtml = cart.map((item, idx) => {
                const qty = Number(item.qty || 1);
                const lineTotal = Number(item.price) * qty;
                return `
                    <div style="display:flex; gap:12px; align-items:center; background:#18181e; padding:12px; border-radius:20px; margin-bottom:10px; border:1px solid rgba(255,255,255,0.08);">
                        <img src="${item.image || ''}" style="width:56px; height:56px; object-fit:cover; border-radius:14px; background:#24242c;">
                        <div style="flex-grow:1; min-width:0;">
                            <div style="font-weight:700; font-size:13px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</div>
                            <div style="font-size:11px; color:#9ca3af;">$${Number(item.price).toLocaleString('es-MX')} MXN c/u • <strong style="color:#fff;">$${lineTotal.toLocaleString('es-MX')} MXN</strong></div>
                            <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
                                <button onclick="changeCartQty(${idx}, -1)" style="background:#26262e; color:#fff; border:1px solid rgba(255,255,255,0.14); width:26px; height:26px; cursor:pointer; font-weight:800; border-radius:50%;">-</button>
                                <span style="color:#fff; font-size:12px; font-weight:800; min-width:18px; text-align:center;">${qty}</span>
                                <button onclick="changeCartQty(${idx}, 1)" style="background:#26262e; color:#fff; border:1px solid rgba(255,255,255,0.14); width:26px; height:26px; cursor:pointer; font-weight:800; border-radius:50%;" title="Agregar otra pieza igual">+</button>
                            </div>
                        </div>
                        <button onclick="removeFromCart(${idx})" style="background:none; border:none; color:#ff2a00; cursor:pointer; font-size:20px; padding:0 6px;" title="Quitar prenda">×</button>
                    </div>
                `;
            }).join('');
        }
    } else {
        if (!pendingOrders || pendingOrders.length === 0) {
            bodyContentHtml = '<p style="color:#9ca3af; text-align:center; padding:40px 15px;">Aún no tienes pedidos registrados aquí. Al enviar una solicitud o compra aparecerán con su estatus.</p>';
        } else {
            bodyContentHtml = pendingOrders.map((ord) => {
                const isDelivered = Boolean(ord.delivered);
                const currentStatus = ord.status || 'Pago pendiente';
                const badgeStyle = isDelivered
                    ? 'background: rgba(148, 163, 184, 0.16); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.4);'
                    : getStatusBadgeStyle(currentStatus);

                const strikeStyle = isDelivered ? 'text-decoration: line-through; opacity: 0.65;' : '';
                const cardBorderStyle = isDelivered
                    ? 'background:#141418; border:1px solid rgba(255,255,255,0.08); opacity:0.88;'
                    : 'background:#18181e; border:1px solid rgba(255,255,255,0.1);';

                const deliveredBannerHtml = isDelivered
                    ? `<div style="margin-top:8px; padding:6px 12px; border-radius:999px; background:rgba(34, 197, 94, 0.12); color:#86efac; font-size:11px; font-weight:800; letter-spacing:0.3px;">ESTE PEDIDO YA TE FUE ENTREGADO</div>`
                    : '';

                return `
                    <div style="${cardBorderStyle} padding:14px; border-radius:20px; margin-bottom:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
                            <span style="color:#fff; font-weight:800; font-size:12px; ${strikeStyle}">#${ord.folio}</span>
                            <span style="font-size:10px; font-weight:800; padding:3px 10px; border-radius:999px; ${badgeStyle}">${isDelivered ? 'Entregado' : currentStatus}</span>
                        </div>
                        <div style="color:#bbb; font-size:11px; margin-bottom:6px; ${strikeStyle}">${ord.summary || ord.typeLabel || 'Pedido DARECORE'}</div>
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#888; ${strikeStyle}">
                            <span>${ord.typeLabel || 'Tienda'}</span>
                            <strong style="color:#ff2a00; font-size:12px;">$${Number(ord.total || 0).toLocaleString('es-MX')} MXN</strong>
                        </div>
                        ${deliveredBannerHtml}
                    </div>
                `;
            }).join('');
        }
    }

    const footerHtml = activeCartTab === 'cart'
        ? `
            <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:15px; margin-bottom:15px; display:flex; justify-content:space-between; color:#fff; font-weight:800; font-size:16px;">
                <span>Subtotal a Pagar:</span>
                <span style="color:#ff2a00;">$${subtotal.toLocaleString('es-MX')} MXN</span>
            </div>
            <button onclick="checkoutCart()" style="background:linear-gradient(135deg, #ff2a00 0%, #ff5500 100%); color:#fff; border:none; border-radius:999px; width:100%; padding:13px; font-weight:800; cursor:pointer; text-transform:uppercase; margin-bottom:10px;">Proceder al Pago</button>
            <button onclick="openGoogleAuthModal()" style="background:#fff; color:#111; border:none; border-radius:999px; width:100%; padding:11px; font-weight:800; cursor:pointer; font-size:12px;">Iniciar Sesión con Google</button>
        `
        : `
            <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:12px; display:flex; flex-direction:column; gap:8px;">
                <button onclick="openCartModal('pending')" style="background:#222228; color:#fff; border:1px solid rgba(255,255,255,0.12); border-radius:999px; width:100%; padding:11px; font-weight:800; cursor:pointer; font-size:12px;">Actualizar Estatus</button>
                <button onclick="switchCartTab('cart')" style="background:linear-gradient(135deg, #ff2a00 0%, #ff5500 100%); color:#fff; border:none; border-radius:999px; width:100%; padding:12px; font-weight:800; cursor:pointer; font-size:12px; text-transform:uppercase;">Seguir Comprando</button>
            </div>
        `;

    modalOverlay.innerHTML = `
        <div style="background:#111115; width:420px; max-width:100%; padding:26px; border-top-left-radius:28px; border-bottom-left-radius:28px; display:flex; flex-direction:column; justify-content:space-between; box-shadow: -8px 0 30px rgba(0,0,0,0.65);">
            <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
                    <h3 style="color:#fff; font-size:16px; margin:0; font-weight:900;">CARRITO DE COMPRAS</h3>
                    <button onclick="closeCartModal()" style="background:rgba(255,255,255,0.08); border:none; color:#fff; width:32px; height:32px; border-radius:50%; font-size:20px; cursor:pointer;">×</button>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:16px;">
                    <button onclick="switchCartTab('cart')" style="padding:9px; font-size:11px; font-weight:800; cursor:pointer; border-radius:999px; text-transform:uppercase; ${cartTabStyle}">Carrito (${cart.reduce((s, i) => s + Number(i.qty || 1), 0)})</button>
                    <button onclick="switchCartTab('pending')" style="padding:9px; font-size:11px; font-weight:800; cursor:pointer; border-radius:999px; text-transform:uppercase; ${pendingTabStyle}">Pedido pendiente (${pendingOrders.length})</button>
                </div>

                <div style="max-height:52vh; overflow-y:auto;">
                    ${bodyContentHtml}
                </div>
            </div>
            <div>
                ${footerHtml}
            </div>
        </div>
    `;
    modalOverlay.style.display = 'flex';
}

async function openCartModal(tab = activeCartTab) {
    activeCartTab = tab;
    cart = readCartFromStorage();
    updateCartUI();

    let modalOverlay = document.getElementById('cartModalOverlay');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'cartModalOverlay';
        modalOverlay.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:99999; justify-content:flex-end; align-items:stretch;";
        document.body.appendChild(modalOverlay);
    }

    // Mostrar al instante lo guardado localmente
    renderCartModalContent(modalOverlay, getClientPendingOrdersLocal());

    // Actualizar en segundo plano con datos remotos
    const pendingOrders = await fetchClientPendingOrders();
    if (modalOverlay.style.display === 'flex') {
        renderCartModalContent(modalOverlay, pendingOrders);
    }
}

function closeCartModal() {
    const modalOverlay = document.getElementById('cartModalOverlay');
    if (modalOverlay) modalOverlay.style.display = 'none';
}

function removeFromCart(index) {
    cart = readCartFromStorage();
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
    openCartModal('cart');
}

function checkoutCart() {
    cart = readCartFromStorage();
    if (cart.length === 0) {
        showFloatingToast('Tu carrito está vacío');
        return;
    }

    const purchaseNumber = generateFolio('COMPRA');
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty || 1)), 0);
    const { auth, db } = ensureFirebaseRefs();
    const currentUser = auth && auth.currentUser ? auth.currentUser : null;
    const initialStatus = 'Pago pendiente';
    const createdAt = new Date().toISOString();

    const cleanItems = cart.map(item => ({
        id: item.id || item.firestoreId || '',
        name: item.name,
        price: Number(item.price),
        qty: Number(item.qty || 1)
    }));

    const itemsSummary = cleanItems.map(i => `${i.qty}x ${i.name} ($${(Number(i.price) * Number(i.qty)).toLocaleString('es-MX')} MXN)`).join(', ');
    const mensaje = [
        `Hola DareCore, me gustaría procesar el pago de mi pedido #${purchaseNumber}:`,
        `• Prendas: ${itemsSummary}`,
        `• Total: $${subtotal.toLocaleString('es-MX')} MXN`
    ].join('\n');

    const summaryText = cleanItems.map(i => `${i.qty}x ${i.name}`).join(', ');
    saveClientPendingOrder({
        id: purchaseNumber,
        collection: 'orders',
        folio: purchaseNumber,
        typeLabel: 'Carrito',
        summary: summaryText,
        total: subtotal,
        status: initialStatus,
        delivered: false,
        createdAt: createdAt
    });

    cart = [];
    saveCart();
    updateCartUI();
    openCartModal('pending');
    openWhatsAppWithMessage(mensaje);

    if (db) {
        db.collection('orders').add({
            purchaseNumber: purchaseNumber,
            orderType: 'compra_carrito',
            status: initialStatus,
            userEmail: currentUser ? currentUser.email : 'Invitado (sin sesión)',
            userName: currentUser ? currentUser.displayName : 'Invitado',
            items: cleanItems,
            total: subtotal,
            createdAt: createdAt
        }).then(docRef => {
            saveClientPendingOrder({
                id: docRef.id,
                collection: 'orders',
                folio: purchaseNumber,
                typeLabel: 'Carrito',
                summary: summaryText,
                total: subtotal,
                status: initialStatus,
                delivered: false,
                createdAt: createdAt
            });
        }).catch(err => console.error("Error guardando compra:", err));
    }
}

function openGoogleAuthModal() {
    const { auth } = ensureFirebaseRefs();
    if (!auth || typeof firebase === 'undefined' || !firebase.auth?.GoogleAuthProvider) {
        showFloatingToast('Firebase Auth no está inicializado');
        return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
        'prompt': 'select_account'
    });

    auth.signInWithPopup(provider)
        .then(async (result) => {
            const user = result.user;
            await persistGoogleUserSession(user);

            showFloatingToast(`Bienvenido, ${user.displayName || user.email}`);
            openCartModal('pending');
        }).catch((error) => {
            console.error("Error en autenticación con Google:", error.code, error.message);

            if (
                (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') &&
                typeof auth.signInWithRedirect === 'function'
            ) {
                showFloatingToast('Popup bloqueado, redirigiendo a Google...');
                auth.signInWithRedirect(provider);
                return;
            }

            const codeLabel = error.code || 'error';
            showFloatingToast(`Error Google (${codeLabel}): ${error.message || 'revisa consola F12'}`);
        });
}

/* ==========================================
6. PANEL DE ADMINISTRACIÓN
   ========================================== */
function initAdminPanel() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const logoutBtn = document.getElementById('logoutBtn');

    const bootDashboard = () => {
        ensureDeliveredOrdersSection();
        loadAdminProducts();
        loadAdminCustomBases();
        loadAdminSizeChartsEditor();
        loadAdminUsers();
        loadAdminDareLabOrders();
        loadAdminOrders();
        loadAdminDeliveredOrders();
    };

    if (localStorage.getItem('darecore_admin_logged') === 'true') {
        if (loginSection) loginSection.classList.add('hidden');
        if (dashboardSection) dashboardSection.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        bootDashboard();
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('adminUser').value.trim();
        const pass = document.getElementById('adminPass').value.trim();
        const errorMsg = document.getElementById('loginError');

        if ((user === 'admin' || user === 'admin@darecore.mx') && pass === 'darecore2026') {
            localStorage.setItem('darecore_admin_logged', 'true');
            if (loginSection) loginSection.classList.add('hidden');
            if (dashboardSection) dashboardSection.classList.remove('hidden');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            bootDashboard();
        } else {
            if (errorMsg) errorMsg.style.display = 'block';
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('darecore_admin_logged');
            window.location.reload();
        });
    }

    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleProductSubmit);
    }
}

function loadAdminSizeChartsEditor() {
    const basesContainer = document.getElementById('adminCustomBasesList');
    const anchorCard = (basesContainer && basesContainer.closest('.admin-card')) || document.getElementById('dashboardSection');
    if (!anchorCard) return;

    let editorSection = document.getElementById('adminSizeChartsSection');
    if (!editorSection) {
        editorSection = document.createElement('div');
        editorSection.id = 'adminSizeChartsSection';
        editorSection.className = 'admin-card';
        editorSection.style.cssText = 'margin-top: 24px; background: #ffffff; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 24px; padding: 24px; color: #0b0b0e;';
        if (anchorCard.id === 'dashboardSection') {
            anchorCard.appendChild(editorSection);
        } else {
            anchorCard.insertAdjacentElement('afterend', editorSection);
        }
    }

    const charts = getSizeChartsData();
    const genderMap = charts[adminSelectedGender] || charts.hombre;
    const garmentKeys = Object.keys(genderMap);
    if (!genderMap[adminSelectedGarmentType]) {
        adminSelectedGarmentType = garmentKeys[0] || 'camisa';
    }
    const activeChart = genderMap[adminSelectedGarmentType];
    const rows = Array.isArray(activeChart.rows) ? activeChart.rows : [];

    editorSection.innerHTML = `
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px; margin-bottom:14px;">
            <div>
                <h3 style="margin:0 0 4px 0; font-size:16px; font-weight:900; color:#0b0b0e; text-transform:uppercase;">
                    TABLAS DE MEDIDAS POR GÉNERO Y PRENDA / TELA (CM)
                </h3>
                <p style="margin:0; font-size:12px; color:#52525b;">
                    Modifica tallas o centímetros (pecho/busto, cintura y largo) para hombre o mujer según el tipo de tela (algodón, felpa, licra, top, etc.).
                </p>
            </div>
            <div style="display:flex; gap:8px;">
                <button type="button" onclick="setAdminChartGender('hombre')" style="padding:8px 16px; border-radius:999px; font-size:11px; font-weight:800; cursor:pointer; border:1.5px solid #ff2a00; ${adminSelectedGender === 'hombre' ? 'background:#ff2a00; color:#fff;' : 'background:#fff; color:#0b0b0e;'}">Hombre</button>
                <button type="button" onclick="setAdminChartGender('mujer')" style="padding:8px 16px; border-radius:999px; font-size:11px; font-weight:800; cursor:pointer; border:1.5px solid #ff2a00; ${adminSelectedGender === 'mujer' ? 'background:#ff2a00; color:#fff;' : 'background:#fff; color:#0b0b0e;'}">Mujer</button>
            </div>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;">
            ${garmentKeys.map(key => {
                const item = genderMap[key];
                const active = key === adminSelectedGarmentType;
                return `<button type="button" onclick="setAdminChartGarmentType('${key}')" style="padding:7px 14px; border-radius:999px; font-size:11px; font-weight:800; cursor:pointer; border:1px solid ${active ? '#0b0b0e' : '#d4d4d8'}; background:${active ? '#0b0b0e' : '#f4f4f5'}; color:${active ? '#fff' : '#0b0b0e'};">${item.label || key}</button>`;
            }).join('')}
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-bottom:16px;">
            <div>
                <label style="font-size:10px; font-weight:800; color:#52525b; display:block; margin-bottom:4px;">NOMBRE DE PRENDA / TELA</label>
                <input type="text" id="chartGarmentLabelInput" value="${activeChart.label || ''}" class="form-control" style="font-size:12px;">
            </div>
            <div>
                <label style="font-size:10px; font-weight:800; color:#52525b; display:block; margin-bottom:4px;">NOTA DE TELA / AJUSTE</label>
                <input type="text" id="chartFabricNoteInput" value="${activeChart.fabricNote || ''}" class="form-control" style="font-size:12px;">
            </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:14px;">
            ${rows.map((r, idx) => `
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)) auto; gap:8px; align-items:center; background:#f9fafb; border:1px solid #e4e4e7; padding:10px; border-radius:16px;">
                    <div>
                        <label style="font-size:10px; font-weight:700; color:#52525b; display:block;">Talla</label>
                        <input type="text" id="chartRowSize_${idx}" value="${r.size}" class="form-control" style="font-size:12px;">
                    </div>
                    <div>
                        <label style="font-size:10px; font-weight:700; color:#52525b; display:block;">Pecho/Busto (cm)</label>
                        <input type="text" id="chartRowChest_${idx}" value="${r.chestCm}" class="form-control" style="font-size:12px;">
                    </div>
                    <div>
                        <label style="font-size:10px; font-weight:700; color:#52525b; display:block;">Cintura (cm)</label>
                        <input type="text" id="chartRowWaist_${idx}" value="${r.waistCm}" class="form-control" style="font-size:12px;">
                    </div>
                    <div>
                        <label style="font-size:10px; font-weight:700; color:#52525b; display:block;">Largo (cm)</label>
                        <input type="text" id="chartRowLength_${idx}" value="${r.lengthCm}" class="form-control" style="font-size:12px;">
                    </div>
                    <button type="button" class="btn-delete" style="padding:8px 12px; font-size:11px; margin-top:14px;" onclick="deleteSizeChartRow(${idx})">Quitar</button>
                </div>
            `).join('')}
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:20px;">
            <button type="button" class="btn-primary" style="padding:9px 16px; font-size:11px;" onclick="addSizeChartRow()">+ Agregar fila de talla</button>
            <button type="button" class="btn-primary" style="padding:9px 18px; font-size:11px; background:#16a34a;" onclick="saveCurrentSizeChart()">Guardar tabla (${adminSelectedGender})</button>
        </div>

        <div style="border-top:1px dashed #d4d4d8; padding-top:16px;">
            <div style="font-size:11px; font-weight:900; color:#ff2a00; text-transform:uppercase; margin-bottom:10px;">
                + AGREGAR NUEVO TIPO DE PRENDA / TELA PARA ${adminSelectedGender === 'mujer' ? 'MUJER' : 'HOMBRE'}
            </div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
                <input type="text" id="newChartKeyInput" placeholder="Clave ej. licra, camisola, jogger" class="form-control" style="font-size:12px;">
                <input type="text" id="newChartLabelInput" placeholder="Nombre visible ej. Licra Deportiva" class="form-control" style="font-size:12px;">
                <input type="text" id="newChartNoteInput" placeholder="Nota de tela ej. Alta elasticidad en cm" class="form-control" style="font-size:12px;">
                <button type="button" class="btn-primary" style="padding:9px 14px; font-size:11px;" onclick="addNewGarmentSizeChart()">+ Crear tabla de prenda</button>
            </div>
        </div>
    `;
}

function setAdminChartGender(gender) {
    adminSelectedGender = gender === 'mujer' ? 'mujer' : 'hombre';
    const charts = getSizeChartsData();
    const keys = Object.keys(charts[adminSelectedGender] || {});
    if (!keys.includes(adminSelectedGarmentType)) {
        adminSelectedGarmentType = keys[0] || 'camisa';
    }
    loadAdminSizeChartsEditor();
}

function setAdminChartGarmentType(garmentKey) {
    adminSelectedGarmentType = garmentKey;
    loadAdminSizeChartsEditor();
}

function collectCurrentChartRowsFromDom(count) {
    const updatedRows = [];
    for (let i = 0; i < count; i++) {
        const sizeVal = document.getElementById(`chartRowSize_${i}`)?.value.trim() || `T${i + 1}`;
        const chestVal = document.getElementById(`chartRowChest_${i}`)?.value.trim() || '0';
        const waistVal = document.getElementById(`chartRowWaist_${i}`)?.value.trim() || '0';
        const lengthVal = document.getElementById(`chartRowLength_${i}`)?.value.trim() || '0';
        updatedRows.push({
            size: sizeVal,
            chestCm: chestVal,
            waistCm: waistVal,
            lengthCm: lengthVal
        });
    }
    return updatedRows;
}

function addSizeChartRow() {
    const charts = getSizeChartsData();
    const chart = charts[adminSelectedGender]?.[adminSelectedGarmentType];
    if (!chart) return;

    const currentRows = collectCurrentChartRowsFromDom((chart.rows || []).length);
    currentRows.push({ size: '2XL', chestCm: '126', waistCm: '120', lengthCm: '78' });
    chart.rows = currentRows;
    persistSizeChartsData(charts);
    loadAdminSizeChartsEditor();
    renderSizeGuideBlock();
}

function deleteSizeChartRow(index) {
    const charts = getSizeChartsData();
    const chart = charts[adminSelectedGender]?.[adminSelectedGarmentType];
    if (!chart || !Array.isArray(chart.rows)) return;
    if (chart.rows.length <= 1) {
        showFloatingToast('Debe quedar al menos una talla en la tabla');
        return;
    }

    const currentRows = collectCurrentChartRowsFromDom(chart.rows.length);
    currentRows.splice(index, 1);
    chart.rows = currentRows;
    persistSizeChartsData(charts);
    loadAdminSizeChartsEditor();
    renderSizeGuideBlock();
}

function saveCurrentSizeChart() {
    const charts = getSizeChartsData();
    const chart = charts[adminSelectedGender]?.[adminSelectedGarmentType];
    if (!chart) return;

    const labelVal = document.getElementById('chartGarmentLabelInput')?.value.trim();
    const noteVal = document.getElementById('chartFabricNoteInput')?.value.trim();
    const currentRows = collectCurrentChartRowsFromDom((chart.rows || []).length);

    if (labelVal) chart.label = labelVal;
    chart.fabricNote = noteVal || '';
    chart.rows = currentRows;

    persistSizeChartsData(charts);
    showFloatingToast(`Tabla "${chart.label}" guardada`);
    loadAdminSizeChartsEditor();
    renderSizeGuideBlock();
}

function addNewGarmentSizeChart() {
    const rawKey = document.getElementById('newChartKeyInput')?.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || '';
    const labelVal = document.getElementById('newChartLabelInput')?.value.trim() || '';
    const noteVal = document.getElementById('newChartNoteInput')?.value.trim() || 'Medidas en cm según prenda y tela.';

    if (!rawKey || !labelVal) {
        showFloatingToast('Ingresa una clave y un nombre visible para la nueva prenda/tela');
        return;
    }

    const charts = getSizeChartsData();
    charts[adminSelectedGender][rawKey] = {
        label: labelVal,
        fabricNote: noteVal,
        rows: [
            { size: 'CH / S', chestCm: '90', waistCm: '72', lengthCm: '64' },
            { size: 'M', chestCm: '96', waistCm: '78', lengthCm: '66' },
            { size: 'G / L', chestCm: '102', waistCm: '84', lengthCm: '68' }
        ]
    };

    adminSelectedGarmentType = rawKey;
    persistSizeChartsData(charts);
    showFloatingToast(`Nueva tabla "${labelVal}" creada`);
    loadAdminSizeChartsEditor();
    renderSizeGuideBlock();
}

function openAdminProductPreviewModal(product) {
    if (!product) return;

    let modal = document.getElementById('adminProductPreviewModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminProductPreviewModal';
        modal.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.88); backdrop-filter:blur(8px); z-index:99999; justify-content:center; align-items:center; padding:20px;';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div style="background:#111115; border:1.5px solid #ff2a00; border-radius:28px; max-width:720px; width:100%; padding:28px; position:relative; display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:24px; color:#fff; box-shadow:0 28px 70px rgba(0,0,0,0.85);">
            <button onclick="document.getElementById('adminProductPreviewModal').style.display='none'" style="position:absolute; top:14px; right:18px; background:rgba(255,255,255,0.08); border:none; color:#fff; width:34px; height:34px; border-radius:50%; font-size:20px; cursor:pointer;">×</button>
            <div style="background:#18181e; border-radius:20px; padding:12px; display:flex; align-items:center; justify-content:center; min-height:280px;">
                <img src="${product.image || AVATAR_URL}" alt="${product.name}" style="width:100%; max-height:340px; object-fit:contain; border-radius:14px;">
            </div>
            <div style="display:flex; flex-direction:column; justify-content:center; gap:10px;">
                <span style="color:#ff5500; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1px;">${product.tag || 'DARECORE'} • ${product.category || 'inicio'}</span>
                <h2 style="margin:0; font-size:24px; font-weight:900; color:#fff;">${product.name}</h2>
                <p style="margin:0; font-size:13px; color:#b4b4bc; line-height:1.55;">${product.desc || 'Sin descripción registrada.'}</p>
                <div style="margin-top:8px; font-size:22px; font-weight:900; color:#ff5500;">$${Number(product.price || 0).toLocaleString('es-MX')} MXN</div>
                <div style="display:flex; gap:10px; margin-top:12px;">
                    <button type="button" class="btn-primary" style="padding:10px 18px; font-size:12px;" onclick="document.getElementById('adminProductPreviewModal').style.display='none'; editProduct('${product.id || product.firestoreId}')">Editar prenda</button>
                    <button type="button" style="background:rgba(255,255,255,0.1); color:#fff; border:none; padding:10px 18px; border-radius:999px; font-size:12px; font-weight:700; cursor:pointer;" onclick="document.getElementById('adminProductPreviewModal').style.display='none'">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
}

function ensureDeliveredOrdersSection() {
    if (document.getElementById('adminDeliveredList')) return;

    const dareLabContainer = document.getElementById('adminDareLabList');
    const ordersContainer = document.getElementById('adminOrdersList');
    const anchorCard = (dareLabContainer && dareLabContainer.closest('.admin-card')) ||
                       (ordersContainer && ordersContainer.closest('.admin-card')) ||
                       document.getElementById('dashboardSection');

    if (!anchorCard) return;

    const section = document.createElement('div');
    section.className = 'admin-card';
    section.style.cssText = 'margin-top: 24px; background: #ffffff; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 24px; padding: 24px;';
    section.innerHTML = `
        <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 900; color: #16a34a; text-transform: uppercase;">
            PEDIDOS ENTREGADOS (<span id="deliveredCount">0</span>)
        </h3>
        <p style="margin: 0 0 16px 0; font-size: 12px; color: #52525b;">
            Historial de compras y pedidos Dare Lab entregados. Haz clic en cualquier tarjeta para ver especificaciones completas.
        </p>
        <div id="adminDeliveredList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;"></div>
    `;

    if (anchorCard.id === 'dashboardSection') {
        anchorCard.appendChild(section);
    } else {
        anchorCard.insertAdjacentElement('afterend', section);
    }
}

function openAdminOrderDetailModal(orderData) {
    let modal = document.getElementById('adminOrderDetailModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminOrderDetailModal';
        modal.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.88); backdrop-filter:blur(8px); z-index:99999; justify-content:center; align-items:center; padding:20px;';
        document.body.appendChild(modal);
    }

    const itemsHtml = Array.isArray(orderData.items) && orderData.items.length > 0
        ? `<ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px;">
            ${orderData.items.map(i => `
                <li style="background:#18181e; border:1px solid rgba(255,255,255,0.08); padding:10px 14px; border-radius:16px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#fff; font-size:13px;"><strong>${i.qty}x</strong> ${i.name}</span>
                    <span style="color:#ff2a00; font-weight:800; font-size:13px;">$${(Number(i.price) * Number(i.qty || 1)).toLocaleString('es-MX')} MXN</span>
                </li>
            `).join('')}
           </ul>`
        : `<div style="background:#18181e; border:1px solid rgba(255,255,255,0.08); padding:14px; border-radius:18px; color:#ddd; font-size:13px; line-height:1.5;">
            <div><strong>Prenda base:</strong> ${orderData.baseName || orderData.summary || 'N/A'}</div>
            ${orderData.technique ? `<div><strong>Técnica:</strong> ${orderData.technique}</div>` : ''}
            ${orderData.notes ? `<div><strong>Notas del cliente:</strong> ${orderData.notes}</div>` : ''}
           </div>`;

    const imageBlock = orderData.imageData
        ? `<div style="margin-bottom:14px; text-align:center; background:#16161b; padding:12px; border-radius:20px; border:1px solid rgba(255,255,255,0.08);">
            <img src="${orderData.imageData}" style="max-width:100%; max-height:260px; object-fit:contain; border-radius:14px;">
            <div style="margin-top:8px;">
                <a href="${orderData.imageData}" download="${orderData.fileName || 'diseno-darecore.jpg'}" style="color:#60a5fa; font-size:12px; font-weight:700; text-decoration:underline;">Descargar archivo adjunto</a>
            </div>
           </div>`
        : '';

    modal.innerHTML = `
        <div style="background:#111115; border:1.5px solid #ff2a00; border-radius:28px; max-width:600px; width:100%; max-height:90vh; overflow-y:auto; padding:28px; position:relative; color:#fff;">
            <button onclick="document.getElementById('adminOrderDetailModal').style.display='none'" style="position:absolute; top:16px; right:18px; background:rgba(255,255,255,0.08); border:none; color:#fff; width:34px; height:34px; border-radius:50%; font-size:20px; cursor:pointer;">×</button>
            <div style="font-size:11px; font-weight:800; color:#ff2a00; text-transform:uppercase; margin-bottom:4px;">${orderData.typeLabel || 'PEDIDO DARECORE'}</div>
            <h2 style="margin:0 0 14px 0; font-size:22px; font-weight:900;">#${orderData.folio}</h2>

            ${imageBlock}

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; background:#16161b; padding:14px; border-radius:20px; border:1px solid rgba(255,255,255,0.08); margin-bottom:16px; font-size:12px;">
                <div><span style="color:#888;">Cliente:</span><br><strong>${orderData.userName || 'Invitado'}</strong></div>
                <div><span style="color:#888;">Correo:</span><br><strong>${orderData.userEmail || 'Sin correo'}</strong></div>
                <div><span style="color:#888;">WhatsApp:</span><br><strong>${orderData.whatsapp || 'No registrado'}</strong></div>
                <div><span style="color:#888;">Estatus:</span><br><strong style="color:#4ade80;">${orderData.status || 'Pago pendiente'}</strong></div>
            </div>

            <div style="font-size:11px; font-weight:800; color:#aaa; text-transform:uppercase; margin-bottom:8px;">Especificaciones del pedido</div>
            ${itemsHtml}

            <div style="margin-top:18px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:14px; color:#bbb; font-weight:700;">Total Cobrado:</span>
                <span style="font-size:22px; color:#ff2a00; font-weight:900;">$${Number(orderData.total || 0).toLocaleString('es-MX')} MXN</span>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
}

function renderStatusSelectHtml(collectionName, docId, currentStatus) {
    const active = currentStatus || 'Pago pendiente';
    const optionsHtml = ORDER_STATUSES.map(st =>
        `<option value="${st}" ${st === active ? 'selected' : ''}>${st}</option>`
    ).join('');

    return `
        <div style="margin-top: 4px;" onclick="event.stopPropagation();">
            <label style="font-size: 10px; color: #52525b; display: block; margin-bottom: 4px; text-transform: uppercase; font-weight: 700;">Estatus del pedido:</label>
            <select onchange="updateOrderStatus('${collectionName}', '${docId}', this.value)" style="width: 100%; background: #ffffff; color: #0b0b0e; border: 1.5px solid #d4d4d8; padding: 8px 12px; border-radius: 14px; font-size: 12px; cursor: pointer;">
                ${optionsHtml}
            </select>
        </div>
    `;
}

function updateOrderStatus(collectionName, docId, newStatus) {
    const { db } = ensureFirebaseRefs();
    if (!db || !docId) return;

    db.collection(collectionName).doc(docId).update({
        status: newStatus,
        updatedAt: new Date().toISOString()
    }).then(() => {
        const localOrders = getClientPendingOrdersLocal();
        const nextLocal = localOrders.map(item =>
            item.id === docId ? { ...item, status: newStatus } : item
        );
        localStorage.setItem('darecore_client_orders', JSON.stringify(nextLocal));

        if (collectionName === 'orders') loadAdminOrders();
        if (collectionName === 'darelab_orders') loadAdminDareLabOrders();
    }).catch(err => console.error("Error actualizando estatus:", err));
}

async function archiveOrderAsDelivered(collectionName, docId) {
    const { db } = ensureFirebaseRefs();
    if (!db || !docId) return;
    try {
        const snap = await db.collection(collectionName).doc(docId).get();
        if (!snap.exists) return;

        const d = snap.data();
        const folio = d.purchaseNumber || d.orderNumber || docId;
        const typeLabel = collectionName === 'darelab_orders' ? 'Dare Lab' : 'Carrito';
        const summary = collectionName === 'darelab_orders'
            ? `${d.baseName || 'Prenda'} (${d.technique || 'Estándar'})`
            : (Array.isArray(d.items) ? d.items.map(i => `${i.qty}x ${i.name}`).join(', ') : 'Compra en tienda');

        await Promise.all([
            db.collection('delivered_orders').doc(docId).set({
                ...d,
                originalId: docId,
                originalCollection: collectionName,
                folio: folio,
                typeLabel: typeLabel,
                summary: summary,
                status: 'Entregado',
                deliveredAt: new Date().toISOString()
            }),
            db.collection('delivered_folios').doc(docId).set({
                orderId: docId,
                folio: folio,
                collection: collectionName,
                deliveredAt: new Date().toISOString()
            }, { merge: true })
        ]);

        await db.collection(collectionName).doc(docId).delete();
    } catch (err) {
        console.error("Error moviendo pedido a entregados:", err);
    }
}

function loadAdminProducts() {
    const container = document.getElementById('adminProductList');
    const countSpan = document.getElementById('totalCount');
    if (!container) return;

    const products = getStoredProducts();
    if (countSpan) countSpan.innerText = products.length;

    container.innerHTML = '';
    products.forEach((p) => {
        const item = document.createElement('div');
        item.className = 'product-item-admin';
        item.style.cssText = 'display:flex; align-items:center; gap:12px; margin-bottom:10px; cursor:pointer; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;';

        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-4px)';
            item.style.boxShadow = '0 14px 28px rgba(0, 0, 0, 0.28)';
            item.style.borderColor = '#ff2a00';
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0)';
            item.style.boxShadow = '';
            item.style.borderColor = '';
        });

        item.addEventListener('click', () => {
            openAdminProductPreviewModal(p);
        });

        item.innerHTML = `
            <img src="${p.image || ''}" alt="${p.name}" style="width:52px; height:52px; object-fit:cover; border-radius:12px;">
            <div style="flex-grow: 1;">
                <div style="font-weight: 700; font-size: 13px;">${p.name}</div>
                <div style="font-size: 11px; opacity: 0.78;">${p.category || 'general'} | $${Number(p.price).toLocaleString('es-MX')} MXN</div>
            </div>
            <div style="display: flex; gap: 8px;" onclick="event.stopPropagation();">
                <button type="button" class="btn-primary" style="padding: 7px 14px; font-size: 11px;" onclick="editProduct('${p.id || p.firestoreId}')">Editar</button>
                <button type="button" class="btn-delete" style="padding: 7px 14px; font-size: 11px;" onclick="deleteProduct('${p.id || p.firestoreId}')">Eliminar</button>
            </div>
        `;
        container.appendChild(item);
    });
}

async function notifyUsersAboutNewProduct(product) {
    const { db } = ensureFirebaseRefs();
    if (!db) return;
    try {
        const snapshot = await db.collection('users').get();
        const emails = [];
        snapshot.forEach(doc => {
            const u = doc.data();
            if (u.email && !emails.includes(u.email)) {
                emails.push(u.email);
            }
        });

        await triggerAutomatedEmail({
            type: 'new_product_published',
            recipients: emails,
            productName: product.name,
            productPrice: product.price,
            subject: `Nuevo drop en DareCore: ${product.name}`,
            message: `Acabamos de publicar "${product.name}" ($${Number(product.price).toLocaleString('es-MX')} MXN) en DareCore Store. Entra ahora antes de que se agote.\n\nVer tienda: ${STORE_URL}`
        });
    } catch (err) {
        console.error("Error enviando correos de nuevo producto:", err);
    }
}

function handleProductSubmit(e) {
    e.preventDefault();
    const editingId = document.getElementById('editingProductId')?.value;
    const name = document.getElementById('prodName').value;
    const category = document.getElementById('prodCategory').value;
    const tag = document.getElementById('prodTag').value;
    const desc = document.getElementById('prodDesc').value;
    const price = Number(document.getElementById('prodPrice').value);
    const imageFile = document.getElementById('prodImageFile').files[0];

    let products = getStoredProducts();
    const { db } = ensureFirebaseRefs();

    const saveProductData = (imgUrl) => {
        if (editingId) {
            products = products.map(p => {
                if (p.id == editingId || p.firestoreId == editingId) {
                    const updated = { ...p, name, category, tag, desc, price, image: imgUrl || p.image };
                    if (db && p.firestoreId) {
                        db.collection('products').doc(p.firestoreId).update({ name, category, tag, desc, price, image: imgUrl || p.image }).catch(err => console.log(err));
                    }
                    return updated;
                }
                return p;
            });
            showFloatingToast(`"${name}" se actualizó exitosamente`);
        } else {
            const newId = 'prod_' + Date.now();
            const newProduct = {
                id: newId,
                category,
                tag,
                name,
                desc,
                price,
                image: imgUrl || ''
            };
            products.unshift(newProduct);

            if (db) {
                db.collection('products').add(newProduct).then(docRef => {
                    newProduct.firestoreId = docRef.id;
                    saveProductsLocal(products);
                    loadAdminProducts();
                    initStore();
                    renderHeroSlide(0);
                }).catch(err => console.log(err));
            }

            notifyUsersAboutNewProduct(newProduct);
            showFloatingToast(`"${name}" se publicó exitosamente`);
        }

        saveProductsLocal(products);
        document.getElementById('addProductForm').reset();

        const editingInput = document.getElementById('editingProductId');
        if (editingInput) editingInput.value = '';
        const formTitle = document.getElementById('formTitle');
        if (formTitle) formTitle.innerText = '+ NUEVA PRENDA';
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) submitBtn.innerText = 'PUBLICAR EN TIENDA';
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        if (cancelEditBtn) cancelEditBtn.classList.add('hidden');

        loadAdminProducts();
        initStore();
        renderHeroSlide(0);
    };

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            saveProductData(event.target.result);
        };
        reader.readAsDataURL(imageFile);
    } else {
        if (editingId) {
            const existing = products.find(p => p.id == editingId || p.firestoreId == editingId);
            saveProductData(existing ? existing.image : null);
        } else {
            saveProductData('');
        }
    }
}

function editProduct(productId) {
    const products = getStoredProducts();
    const product = products.find(p => p.id == productId || p.firestoreId == productId);
    if (!product) return;

    document.getElementById('editingProductId').value = product.id || product.firestoreId;
    document.getElementById('prodCategory').value = product.category || 'inicio';
    document.getElementById('prodTag').value = product.tag || '';
    document.getElementById('prodName').value = product.name || '';
    document.getElementById('prodDesc').value = product.desc || '';
    document.getElementById('prodPrice').value = product.price || '';

    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.innerText = 'EDITAR PRENDA';
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.innerText = 'GUARDAR CAMBIOS';
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) cancelEditBtn.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteProduct(productId) {
    const confirmed = await showConfirmModal('¿Estás seguro de eliminar esta prenda?');
    if (!confirmed) return;

    let products = getStoredProducts();
    const target = products.find(p => p.id == productId || p.firestoreId == productId);
    products = products.filter(p => p.id != productId && p.firestoreId != productId);
    saveProductsLocal(products);

    const { db } = ensureFirebaseRefs();
    if (db && target && target.firestoreId) {
        db.collection('products').doc(target.firestoreId).delete().catch(err => console.log(err));
    }

    loadAdminProducts();
    initStore();
    renderHeroSlide(0);
    showFloatingToast('Prenda eliminada correctamente');
}

function persistCustomBases(bases) {
    localStorage.setItem('darecore_custom_bases', JSON.stringify(bases));
    const { db } = ensureFirebaseRefs();
    if (db) {
        db.collection('settings').doc('customBases').set({ items: bases }).catch(err => console.log(err));
    }
}

function addCustomBaseItem() {
    const nameInput = document.getElementById('newBaseName');
    const descInput = document.getElementById('newBaseDesc');
    const priceInput = document.getElementById('newBasePrice');

    const name = nameInput ? nameInput.value.trim() : '';
    const desc = descInput ? descInput.value.trim() : '';
    const price = Number(priceInput ? priceInput.value : 0);

    if (!name) {
        showFloatingToast('Escribe el nombre de la nueva prenda base');
        if (nameInput) nameInput.focus();
        return;
    }

    if (!price || price <= 0) {
        showFloatingToast('Ingresa un precio válido en MXN');
        if (priceInput) priceInput.focus();
        return;
    }

    const bases = getCustomBases();
    bases.push({
        id: 'base_' + Date.now(),
        name: name.toUpperCase(),
        desc: desc || 'Prenda personalizada Dare Lab',
        price: price
    });

    persistCustomBases(bases);
    if (nameInput) nameInput.value = '';
    if (descInput) descInput.value = '';
    if (priceInput) priceInput.value = '';

    showFloatingToast(`"${name.toUpperCase()}" agregada a Dare Lab`);
    loadAdminCustomBases();
    renderCustomBasesPublic();
}

async function removeCustomBaseItem(index) {
    const bases = getCustomBases();
    if (bases.length <= 1) {
        showFloatingToast('Debe quedar al menos una prenda base');
        return;
    }

    const confirmed = await showConfirmModal('¿Eliminar esta prenda base de Dare Lab?');
    if (!confirmed) return;

    bases.splice(index, 1);
    if (selectedCustomBaseIndex >= bases.length) {
        selectedCustomBaseIndex = 0;
    }
    persistCustomBases(bases);
    showFloatingToast('Prenda base eliminada');
    loadAdminCustomBases();
    renderCustomBasesPublic();
}

function loadAdminCustomBases() {
    const container = document.getElementById('adminCustomBasesList');
    if (!container) return;

    const bases = getCustomBases();
    container.innerHTML = '';

    bases.forEach((base, index) => {
        const box = document.createElement('div');
        box.style.cssText = "background: #ffffff; border: 1.5px solid rgba(0,0,0,0.1); padding: 16px; border-radius: 22px;";
        box.innerHTML = `
            <div style="margin-bottom: 8px;">
                <label style="font-size: 10px; color: #52525b; display: block; margin-bottom:4px; font-weight:700;">NOMBRE BASE</label>
                <input type="text" id="baseName_${index}" value="${base.name}" class="form-control" style="font-size: 12px;">
            </div>
            <div style="margin-bottom: 8px;">
                <label style="font-size: 10px; color: #52525b; display: block; margin-bottom:4px; font-weight:700;">DESCRIPCIÓN / GRAMAJE</label>
                <input type="text" id="baseDesc_${index}" value="${base.desc || ''}" class="form-control" style="font-size: 12px;">
            </div>
            <div style="margin-bottom: 10px;">
                <label style="font-size: 10px; color: #52525b; display: block; margin-bottom:4px; font-weight:700;">PRECIO (MXN)</label>
                <input type="number" id="basePrice_${index}" value="${base.price}" class="form-control" style="font-size: 12px;">
            </div>
            <div style="display:flex; gap:8px;">
                <button type="button" class="btn-primary" style="padding: 8px 14px; font-size: 11px; flex:1;" onclick="updateCustomBaseItem(${index})">Guardar Cambios</button>
                ${bases.length > 1 ? `<button type="button" class="btn-delete" style="padding: 8px 12px; font-size: 11px;" onclick="removeCustomBaseItem(${index})">Quitar</button>` : ''}
            </div>
        `;
        container.appendChild(box);
    });

    let addBox = document.getElementById('addCustomBaseBox');
    if (!addBox) {
        addBox = document.createElement('div');
        addBox.id = 'addCustomBaseBox';
        addBox.style.cssText = "background: #ffffff; border: 1.5px dashed #ff2a00; padding: 16px; border-radius: 22px; display:flex; flex-direction:column; justify-content:space-between;";
        container.parentElement.appendChild(addBox);
    }

    addBox.style.marginTop = '16px';
    addBox.innerHTML = `
        <div style="font-size: 11px; font-weight: 900; color: #ff2a00; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px;">
            + AGREGAR OTRA PRENDA BASE
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 12px;">
            <div>
                <label style="font-size: 10px; color: #52525b; display: block; margin-bottom:4px; font-weight:700;">NOMBRE PRENDA</label>
                <input type="text" id="newBaseName" placeholder="Ej. HOODIE ZIP 420G" class="form-control" style="font-size: 12px;">
            </div>
            <div>
                <label style="font-size: 10px; color: #52525b; display: block; margin-bottom:4px; font-weight:700;">DESCRIPCIÓN / GRAMAJE</label>
                <input type="text" id="newBaseDesc" placeholder="Ej. Algodón peinado cierre" class="form-control" style="font-size: 12px;">
            </div>
            <div>
                <label style="font-size: 10px; color: #52525b; display: block; margin-bottom:4px; font-weight:700;">PRECIO (MXN)</label>
                <input type="number" id="newBasePrice" placeholder="Ej. 1190" class="form-control" style="font-size: 12px;">
            </div>
        </div>
        <button type="button" class="btn-primary" style="padding: 10px 16px; font-size: 12px; width: 100%;" onclick="addCustomBaseItem()">+ AGREGAR BASE A DARE LAB</button>
    `;
}

function updateCustomBaseItem(index) {
    const bases = getCustomBases();
    const nameInput = document.getElementById(`baseName_${index}`);
    const descInput = document.getElementById(`baseDesc_${index}`);
    const priceInput = document.getElementById(`basePrice_${index}`);

    if (nameInput && priceInput) {
        bases[index].name = nameInput.value;
        if (descInput) bases[index].desc = descInput.value;
        bases[index].price = Number(priceInput.value);
        persistCustomBases(bases);

        showFloatingToast('Base personalizada actualizada');
        loadAdminCustomBases();
        renderCustomBasesPublic();
    }
}

function loadAdminUsers() {
    const container = document.getElementById('adminUsersList');
    const countSpan = document.getElementById('usersCount');
    const { db } = ensureFirebaseRefs();
    if (!container || !db) return;

    db.collection('users').orderBy('lastLogin', 'desc').get().then((snapshot) => {
        if (countSpan) countSpan.innerText = snapshot.size;
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p style="color: #52525b; font-size: 12px;">Aún no hay usuarios registrados.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const u = doc.data();
            const row = document.createElement('div');
            row.style.cssText = "display: flex; align-items: center; gap: 12px; background: #ffffff; border: 1.5px solid rgba(0,0,0,0.1); padding: 12px 16px; border-radius: 20px;";
            row.innerHTML = `
                <img src="${u.photoURL || 'https://via.placeholder.com/40'}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;">
                <div style="flex-grow: 1;">
                    <div style="color: #0b0b0e; font-weight: 700; font-size: 13px;">${u.name || 'Usuario'}</div>
                    <div style="color: #52525b; font-size: 11px;">${u.email}</div>
                </div>
                <div style="color: #71717a; font-size: 10px;">${u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('es-MX') : ''}</div>
            `;
            container.appendChild(row);
        });
    }).catch(err => console.error("Error cargando usuarios:", err));
}

function loadAdminDareLabOrders() {
    const container = document.getElementById('adminDareLabList');
    const countSpan = document.getElementById('dareLabCount');
    const { db } = ensureFirebaseRefs();
    if (!container || !db) return;

    db.collection('darelab_orders').orderBy('createdAt', 'desc').get().then((snapshot) => {
        if (countSpan) countSpan.innerText = snapshot.size;
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p style="color: #52525b; font-size: 12px;">No hay solicitudes personalizadas todavía.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const order = doc.data();
            const status = order.status || 'Pago pendiente';
            const badgeStyle = getStatusBadgeStyle(status);
            const folio = order.orderNumber || doc.id;

            const card = document.createElement('div');
            card.style.cssText = "background: #ffffff; border: 1.5px solid rgba(0,0,0,0.1); padding: 16px; border-radius: 24px; display: flex; flex-direction: column; gap: 8px; cursor: pointer; color: #0b0b0e;";

            const imgHtml = order.imageData
                ? `<a href="${order.imageData}" download="${order.fileName || 'diseno-darelab.jpg'}" onclick="event.stopPropagation();" title="Clic para descargar imagen">
                     <img src="${order.imageData}" style="width: 100%; height: 180px; object-fit: contain; background: #f4f4f5; border-radius: 16px; cursor: pointer;">
                   </a>`
                : `<div style="height: 80px; background: #f4f4f5; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #52525b; font-size: 11px;">Sin imagen adjunta</div>`;

            const cleanPhone = (order.whatsapp || '').replace(/\D/g, '');
            const waClientLink = cleanPhone
                ? `<a href="https://wa.me/${cleanPhone.length === 10 ? '521' + cleanPhone : cleanPhone}" target="_blank" onclick="event.stopPropagation();" style="color: #16a34a; font-weight: 700; text-decoration: underline;">${order.whatsapp}</a>`
                : `<span style="color: #52525b;">${order.whatsapp || 'No proporcionado'}</span>`;

            card.innerHTML = `
                ${imgHtml}
                <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                    <span style="color: #ff2a00; font-size: 11px; font-weight: 800;">#${folio}</span>
                    <span style="font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 999px; ${badgeStyle}">${status}</span>
                </div>
                <div style="color: #0b0b0e; font-size: 13px; font-weight: 700;">${order.baseName} ${order.size ? `• ${order.size}` : ''}</div>
                <div style="color: #0b0b0e; font-size: 12px;"><strong>Cliente:</strong> ${order.userName} (${order.userEmail})</div>
                <div style="color: #0b0b0e; font-size: 12px;"><strong>WhatsApp:</strong> ${waClientLink}</div>
                <div style="color: #52525b; font-size: 11px;"><strong>Técnica:</strong> ${order.technique} | <strong>Total:</strong> $${Number(order.total).toLocaleString('es-MX')} MXN</div>
                <div style="color: #52525b; font-size: 11px;"><strong>Notas:</strong> ${order.notes}</div>
                ${renderStatusSelectHtml('darelab_orders', doc.id, status)}
                <button type="button" class="btn-delete" style="margin-top: auto; width: 100%;" onclick="event.stopPropagation(); deleteDareLabOrder('${doc.id}')">Marcar Entregado / Archivar</button>
            `;

            card.addEventListener('click', () => {
                openAdminOrderDetailModal({
                    folio,
                    typeLabel: 'Solicitud Dare Lab',
                    userName: order.userName,
                    userEmail: order.userEmail,
                    whatsapp: order.whatsapp,
                    status,
                    baseName: order.baseName,
                    technique: order.technique,
                    notes: order.notes,
                    imageData: order.imageData,
                    fileName: order.fileName,
                    total: order.total
                });
            });

            container.appendChild(card);
        });
    }).catch(err => console.error("Error cargando solicitudes Dare Lab:", err));
}

async function deleteDareLabOrder(docId) {
    const confirmed = await showConfirmModal('¿Mover esta solicitud a Pedidos Entregados?');
    if (!confirmed) return;
    await archiveOrderAsDelivered('darelab_orders', docId);
    showFloatingToast('Pedido movido a Pedidos Entregados');
    loadAdminDareLabOrders();
    loadAdminDeliveredOrders();
}

function loadAdminOrders() {
    const container = document.getElementById('adminOrdersList');
    const countSpan = document.getElementById('ordersCount');
    const { db } = ensureFirebaseRefs();
    if (!container || !db) return;

    db.collection('orders').orderBy('createdAt', 'desc').get().then((snapshot) => {
        if (countSpan) countSpan.innerText = snapshot.size;
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p style="color: #52525b; font-size: 12px;">Aún no hay compras registradas desde el carrito.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const order = doc.data();
            const status = order.status || 'Pago pendiente';
            const badgeStyle = getStatusBadgeStyle(status);
            const folio = order.purchaseNumber || doc.id;

            const itemsList = Array.isArray(order.items) && order.items.length > 0
                ? order.items.map(item => `
                    <li style="margin-bottom: 4px; color: #0b0b0e;">
                        <strong>${item.qty}x</strong> ${item.name} — <span style="color: #52525b;">$${Number(item.price).toLocaleString('es-MX')} MXN c/u</span>
                    </li>
                  `).join('')
                : '<li style="color: #52525b;">Sin detalle de prendas</li>';

            const dateText = order.createdAt ? new Date(order.createdAt).toLocaleString('es-MX') : '';

            const card = document.createElement('div');
            card.style.cssText = "background: #ffffff; border: 1.5px solid rgba(0,0,0,0.1); padding: 16px; border-radius: 24px; display: flex; flex-direction: column; gap: 8px; cursor: pointer; color: #0b0b0e;";
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                    <span style="color: #ff2a00; font-size: 12px; font-weight: 800;">#${folio}</span>
                    <span style="font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 999px; ${badgeStyle}">${status}</span>
                </div>
                <div style="color: #71717a; font-size: 10px;">${dateText}</div>
                <div style="color: #0b0b0e; font-size: 12px;"><strong>Cliente:</strong> ${order.userName || 'Invitado'} (${order.userEmail || 'Sin correo'})</div>
                <div style="background: #f4f4f5; border: 1px solid rgba(0,0,0,0.08); padding: 12px; border-radius: 16px;">
                    <div style="color: #52525b; font-size: 11px; font-weight: 700; margin-bottom: 6px; text-transform: uppercase;">Prendas solicitadas:</div>
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 12px;">
                        ${itemsList}
                    </ul>
                </div>
                <div style="color: #0b0b0e; font-size: 13px; font-weight: 800; margin-top: 2px;">
                    Total: <span style="color: #ff2a00;">$${Number(order.total || 0).toLocaleString('es-MX')} MXN</span>
                </div>
                ${renderStatusSelectHtml('orders', doc.id, status)}
                <button type="button" class="btn-delete" style="margin-top: auto; width: 100%;" onclick="event.stopPropagation(); deleteAdminOrder('${doc.id}')">Marcar Entregado / Archivar</button>
            `;

            card.addEventListener('click', () => {
                openAdminOrderDetailModal({
                    folio,
                    typeLabel: 'Compra en Tienda',
                    userName: order.userName,
                    userEmail: order.userEmail,
                    status,
                    items: order.items,
                    total: order.total
                });
            });

            container.appendChild(card);
        });
    }).catch(err => console.error("Error cargando compras del carrito:", err));
}

async function deleteAdminOrder(docId) {
    const confirmed = await showConfirmModal('¿Mover esta compra a Pedidos Entregados?');
    if (!confirmed) return;
    await archiveOrderAsDelivered('orders', docId);
    showFloatingToast('Pedido movido a Pedidos Entregados');
    loadAdminOrders();
    loadAdminDeliveredOrders();
}

function loadAdminDeliveredOrders() {
    ensureDeliveredOrdersSection();
    const container = document.getElementById('adminDeliveredList');
    const countSpan = document.getElementById('deliveredCount');
    const { db } = ensureFirebaseRefs();
    if (!container || !db) return;

    db.collection('delivered_orders').orderBy('deliveredAt', 'desc').get().then((snapshot) => {
        if (countSpan) countSpan.innerText = snapshot.size;
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p style="color: #52525b; font-size: 12px;">Aún no hay pedidos archivados en entregados.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const order = doc.data();
            const folio = order.folio || order.purchaseNumber || order.orderNumber || doc.id;
            const dateText = order.deliveredAt ? new Date(order.deliveredAt).toLocaleString('es-MX') : '';

            const card = document.createElement('div');
            card.style.cssText = "background: #ffffff; border: 1.5px solid rgba(22, 163, 74, 0.35); padding: 16px; border-radius: 24px; display: flex; flex-direction: column; gap: 6px; cursor: pointer; color: #0b0b0e;";
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                    <span style="color: #16a34a; font-size: 12px; font-weight: 800;">#${folio}</span>
                    <span style="font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 999px; background: rgba(22, 163, 74, 0.14); color: #15803d; border: 1px solid rgba(22, 163, 74, 0.35);">Entregado</span>
                </div>
                <div style="color: #71717a; font-size: 10px;">Entregado el: ${dateText}</div>
                <div style="color: #0b0b0e; font-size: 12px;"><strong>Cliente:</strong> ${order.userName || 'Invitado'} (${order.userEmail || 'Sin correo'})</div>
                <div style="color: #52525b; font-size: 11px;">${order.summary || ''}</div>
                <div style="color: #0b0b0e; font-size: 13px; font-weight: 800; margin-top: 4px;">
                    Cobrado: <span style="color: #16a34a;">$${Number(order.total || 0).toLocaleString('es-MX')} MXN</span>
                </div>
                <div style="color: #2563eb; font-size: 10px; font-weight: 700; margin-top: 4px;">Clic para ver especificaciones completas</div>
            `;

            card.addEventListener('click', () => {
                openAdminOrderDetailModal({
                    folio,
                    typeLabel: `${order.typeLabel || 'Pedido'} (Entregado)`,
                    userName: order.userName,
                    userEmail: order.userEmail,
                    whatsapp: order.whatsapp,
                    status: 'Entregado',
                    items: order.items,
                    baseName: order.baseName,
                    technique: order.technique,
                    notes: order.notes,
                    imageData: order.imageData,
                    fileName: order.fileName,
                    summary: order.summary,
                    total: order.total
                });
            });

            container.appendChild(card);
        });
    }).catch(err => console.error("Error cargando pedidos entregados:", err));
}

window.WHATSAPP_PHONE = window.WHATSAPP_PHONE || '5214777035509';

window.openWhatsAppWithMessage = function(message) {
    const phone = window.WHATSAPP_PHONE || '5214777035509';
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    const popup = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        window.location.href = waUrl;
    }
};

window.addEventListener('click', function(e) {
    const btn = e.target.closest('#requestMockupBtn, #whatsappMockupBtn, button, a[role="button"]');
    if (!btn) return;
    const label = (btn.textContent || btn.value || '').trim().toLowerCase();
    if (!label.includes('solicitar mockup') && !label.includes('whatsapp')) return;

    if (window._darecoreWaLock) return;
    window._darecoreWaLock = true;
    setTimeout(() => { window._darecoreWaLock = false; }, 900);

    const baseName = document.getElementById('summaryBaseName')?.textContent?.trim() || 'Prenda personalizada';
    const techName = document.getElementById('summaryTechName')?.textContent?.trim() || 'Estándar';
    const totalText = document.getElementById('summaryTotalPrice')?.textContent?.trim() || '$0 MXN';
    const notes = document.getElementById('customNotes')?.value?.trim() || '';
    const whatsapp = document.getElementById('customWhatsapp')?.value?.trim() || '';
    const folio = 'PEDIDO-' + Math.floor(100000 + Math.random() * 900000);

    const msg = [
        'Hola DareCore, quiero solicitar mi mockup digital y cotización:',
        '• Folio: #' + folio,
        '• Prenda: ' + baseName,
        '• Técnica / Posición: ' + techName,
        '• Total estimado: ' + totalText,
        notes ? '• Notas: ' + notes : '',
        whatsapp ? '• Mi WhatsApp: ' + whatsapp : ''
    ].filter(Boolean).join('\n');

    try {
        const ordersKey = 'darecore_client_orders';
        const existing = JSON.parse(localStorage.getItem(ordersKey) || '[]');
        existing.unshift({
            id: folio,
            folio: folio,
            typeLabel: 'Dare Lab',
            summary: baseName + ' (' + techName + ')',
            total: Number(totalText.replace(/[^0-9.]/g, '')) || 0,
            status: 'Pago pendiente',
            delivered: false,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem(ordersKey, JSON.stringify(existing.slice(0, 25)));
    } catch (err) {}

    window.openWhatsAppWithMessage(msg);
}, true);

window.addEventListener('click', function(e) {
    const btn = e.target.closest('#requestMockupBtn, #whatsappMockupBtn, button, a[role="button"]');
    if (!btn) return;
    const label = (btn.textContent || btn.value || '').trim().toLowerCase();
    if (!label.includes('solicitar mockup') && !label.includes('whatsapp')) return;

    const waInput = document.getElementById('customWhatsapp') || document.querySelector('input[type="tel"], input[name*="whatsapp" i], input[id*="whatsapp" i]');
    const rawVal = waInput ? waInput.value.trim() : '';
    const digitsOnly = rawVal.replace(/\D/g, '');

    if (digitsOnly.length < 10) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
        }
        window._darecoreWaLock = true;
        window._darecoreSubmittingMockup = true;
        setTimeout(() => {
            window._darecoreWaLock = false;
            window._darecoreSubmittingMockup = false;
        }, 400);

        if (waInput) {
            waInput.style.borderColor = '#dc2626';
            waInput.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.22)';
            waInput.focus();
            waInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        if (typeof showFloatingToast === 'function') {
            showFloatingToast('Ingresa tu número de WhatsApp (10 dígitos) para solicitar tu mockup');
        }
        return false;
    }

    if (waInput) {
        waInput.style.borderColor = '#ff2a00';
        waInput.style.boxShadow = '';
    }
}, true);

window.addEventListener('click', function(e) {
    const cartBtn = e.target.closest('.cart-btn, #cartBtn, [data-open-cart]');
    if (!cartBtn) return;

    e.preventDefault();
    e.stopPropagation();

    if (typeof readCartFromStorage === 'function') {
        cart = readCartFromStorage();
    }
    if (typeof updateCartUI === 'function') {
        updateCartUI();
    }
    if (typeof openCartModal === 'function') {
        openCartModal(typeof activeCartTab !== 'undefined' ? activeCartTab : 'cart');
    }
}, true);

(function() {
    function getWhatsappPhoneDigits() {
        const waInput =
            document.getElementById('customWhatsapp') ||
            document.querySelector('input[type="tel"], input[name*="whatsapp" i], input[id*="whatsapp" i], input[name*="telefono" i], input[id*="telefono" i], input[name*="celular" i], input[id*="celular" i]');
        if (!waInput) return { input: null, digits: '' };
        return {
            input: waInput,
            digits: (waInput.value || '').replace(/\D/g, '')
        };
    }

    function blockMissingPhone() {
        const { input, digits } = getWhatsappPhoneDigits();
        if (digits.length >= 10) {
            if (input) {
                input.style.borderColor = '#ff2a00';
                input.style.boxShadow = '';
            }
            return false;
        }

        if (input) {
            input.style.borderColor = '#dc2626';
            input.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.25)';
            input.focus();
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        if (typeof showFloatingToast === 'function') {
            showFloatingToast('Debes ingresar tu número de celular (10 dígitos) antes de enviar');
        } else {
            alert('Debes ingresar tu número de celular (10 dígitos) antes de enviar.');
        }
        return true;
    }

    const origOpenWa = window.openWhatsAppWithMessage;
    window.openWhatsAppWithMessage = function(message) {
        if (window.location.pathname.toLowerCase().includes('personalizar') || document.getElementById('customWhatsapp')) {
            if (blockMissingPhone()) {
                return;
            }
        }
        if (typeof origOpenWa === 'function') {
            return origOpenWa.apply(this, arguments);
        }
        const phone = window.WHATSAPP_PHONE || '5214777035509';
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message || '')}`, '_blank', 'noopener,noreferrer');
    };

    document.addEventListener('click', function(e) {
        const btn = e.target.closest('#requestMockupBtn, #whatsappMockupBtn, button, a[role="button"]');
        if (!btn) return;
        const label = (btn.textContent || btn.value || '').trim().toLowerCase();
        if (!label.includes('solicitar mockup') && !label.includes('whatsapp')) return;

        if (blockMissingPhone()) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }
            window._darecoreWaLock = true;
            window._darecoreSubmittingMockup = true;
            setTimeout(() => {
                window._darecoreWaLock = false;
                window._darecoreSubmittingMockup = false;
            }, 500);
        }
    }, true);
})();

(function() {
    function sanitizeWhatsAppText(raw) {
        if (typeof raw !== 'string') return raw;
        return raw
            .replace(/\s*[•|]?\s*Total estimado\s*:[^\n•|]*/gi, '')
            .replace(/\s*[•|]?\s*Mi WhatsApp\s*:[^\n•|]*/gi, '')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/[ \t]{2,}/g, ' ')
            .trim();
    }

    const prevOpenWa = window.openWhatsAppWithMessage;
    window.openWhatsAppWithMessage = function(message) {
        const cleaned = sanitizeWhatsAppText(message);
        if (typeof prevOpenWa === 'function') {
            return prevOpenWa.call(this, cleaned);
        }
        const phone = window.WHATSAPP_PHONE || '5214777035509';
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(cleaned || '')}`, '_blank', 'noopener,noreferrer');
    };

    const prevBuildWa = window.buildDareLabWhatsAppMessage;
    if (typeof prevBuildWa === 'function') {
        window.buildDareLabWhatsAppMessage = function(data) {
            const built = prevBuildWa.apply(this, arguments);
            return sanitizeWhatsAppText(built);
        };
    }
})();
/* DARECORE LIVE CLIENT ORDER & STATUS GUARD */
(function () {
  if (window.__dcLiveClientOrderGuardInstalled) return;
  window.__dcLiveClientOrderGuardInstalled = true;

  const ORDERS_KEY = "darecore_orders";
  const DELIVERED_KEY = "darecore_delivered_orders";
  const bc = (typeof BroadcastChannel !== "undefined") ? new BroadcastChannel("darecore_orders_sync") : null;

  function safeParseArray(raw) {
    if (!raw) return [];
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : (p && typeof p === "object" ? Object.values(p) : []);
    } catch (_) {
      return [];
    }
  }

  function loadOrders() {
    const merged = new Map();
    ["darecore_orders", "dc_orders", "orders"].forEach(function (k) {
      try {
        safeParseArray(localStorage.getItem(k)).forEach(function (item) {
          if (!item || typeof item !== "object") return;
          const folio = String(item.id || item.folio || item.purchaseNumber || item.orderNumber || "").replace(/^#/, "").trim();
          if (!folio) return;
          const prev = merged.get(folio) || {};
          merged.set(folio, Object.assign({}, prev, item, {
            id: folio,
            folio: folio,
            status: item.status || item.estado || prev.status || prev.estado || "Pendiente",
            estado: item.estado || item.status || prev.estado || prev.status || "Pendiente",
            updatedAt: item.updatedAt || prev.updatedAt || new Date().toISOString()
          }));
        });
      } catch (_) {}
    });
    return Array.from(merged.values());
  }

  function saveOrders(list, meta) {
    try {
      const s = JSON.stringify(list);
      localStorage.setItem(ORDERS_KEY, s);
      localStorage.setItem("dc_orders", s);
    } catch (_) {}
    try {
      if (bc) bc.postMessage({ type: "orders_sync", orders: list, meta: meta || null, ts: Date.now() });
    } catch (_) {}
    try {
      window.dispatchEvent(new CustomEvent("darecore:orders:updated", { detail: { orders: list, meta: meta || null } }));
    } catch (_) {}
  }

  function upsertOrder(folio, patch) {
    const cleanFolio = String(folio || "").replace(/^#/, "").trim();
    if (!cleanFolio) return;
    const list = loadOrders();
    let idx = list.findIndex(function (o) {
      return String(o.id || o.folio || "").replace(/^#/, "").toUpperCase() === cleanFolio.toUpperCase();
    });
    const nowIso = new Date().toISOString();
    if (idx >= 0) {
      list[idx] = Object.assign({}, list[idx], patch, {
        id: cleanFolio,
        folio: cleanFolio,
        status: (patch && (patch.status || patch.estado)) || list[idx].status || list[idx].estado || "Pendiente",
        estado: (patch && (patch.estado || patch.status)) || list[idx].estado || list[idx].status || "Pendiente",
        updatedAt: nowIso
      });
    } else {
      list.unshift(Object.assign({
        id: cleanFolio,
        folio: cleanFolio,
        status: "Pendiente",
        estado: "Pendiente",
        createdAt: nowIso,
        updatedAt: nowIso
      }, patch || {}));
    }
    saveOrders(list, { folio: cleanFolio, status: (patch && (patch.status || patch.estado)) || "Pendiente" });
  }

  function notifyClient(msg) {
    if (!msg) return;
    if (typeof window.showFloatingToast === "function") {
      try {
        window.showFloatingToast(msg);
        return;
      } catch (_) {}
    }
    let box = document.getElementById("dcLiveOrderBanner");
    if (!box) {
      box = document.createElement("div");
      box.id = "dcLiveOrderBanner";
      box.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:99999;background:#111827;color:#fff;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.25);";
      document.body.appendChild(box);
    }
    box.textContent = msg;
    box.style.display = "block";
    clearTimeout(box._t);
    box._t = setTimeout(function () { box.style.display = "none"; }, 3600);
  }

  function renderClientOrdersListIfNeeded() {
    const orders = loadOrders();
    if (!orders.length) return;

    // Si hay algún contenedor con "Aún no tienes pedidos registrados aquí", mostrar los pedidos guardados con su estatus actual
    const emptyMsgs = Array.from(document.querySelectorAll("p, div, span")).filter(function (el) {
      return /a[uú]n no tienes pedidos registrados aqu[ií]/i.test((el.textContent || "").trim());
    });

    emptyMsgs.forEach(function (el) {
      const container = el.parentElement;
      if (!container) return;
      if (container.querySelector("[data-dc-client-orders-list='1']")) return;
      el.style.display = "none";

      const listBox = document.createElement("div");
      listBox.setAttribute("data-dc-client-orders-list", "1");
      listBox.style.cssText = "display:grid;gap:10px;padding:12px 4px;";
      listBox.innerHTML = orders.map(function (o) {
        const st = o.status || o.estado || "Pendiente";
        const f = String(o.id || o.folio || "").replace(/^#/, "");
        return '<div style="padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.04);display:flex;justify-content:space-between;align-items:center;gap:10px;">' +
          '<div><div style="font-weight:700;color:#fff;">Pedido #' + f + '</div>' +
          (o.total ? '<div style="font-size:12px;color:#d1d5db;">Total: ' + o.total + '</div>' : '') + '</div>' +
          '<span style="padding:5px 10px;border-radius:999px;font-size:12px;font-weight:700;background:#1f2937;color:#34d399;border:1px solid rgba(52,211,153,0.35);">' + st + '</span>' +
          '</div>';
      }).join("");
      container.appendChild(listBox);
    });

    // Actualizar badges o textos de estatus en tarjetas existentes de pedidos
    const byFolio = new Map(orders.map(function (o) {
      return [String(o.id || o.folio || "").replace(/^#/, "").toUpperCase(), o];
    }));

    document.querySelectorAll("article, section, div, tr, li").forEach(function (card) {
      if (card.children.length > 14) return;
      const m = (card.textContent || "").match(/#(COMPRA|PEDIDO)-[A-Z0-9_-]+/i);
      if (!m) return;
      const clean = m[0].replace(/^#/, "").toUpperCase();
      const found = byFolio.get(clean);
      if (!found) return;
      const st = found.status || found.estado || "Pendiente";
      let tag = card.querySelector("[data-dc-status-tag='1']");
      if (!tag) {
        tag = document.createElement("span");
        tag.setAttribute("data-dc-status-tag", "1");
        tag.style.cssText = "display:inline-block;margin-left:8px;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;background:#065f46;color:#ecfdf5;";
        card.appendChild(tag);
      }
      tag.textContent = "Estatus: " + st;
    });
  }

  // Capturar cuando el cliente procesa pago hacia WhatsApp para registrar el pedido al instante
  document.addEventListener("click", function (e) { if (window.__dcIsInsideDareCoreAI && window.__dcIsInsideDareCoreAI(e.target)) return;
    const btn = e.target && e.target.closest ? e.target.closest("button, a") : null;
    if (!btn) return;
    const txt = (btn.textContent || "").trim().toLowerCase();

    if (/procesar\s*pago|enviar\s*pedido|whatsapp/i.test(txt)) {
      setTimeout(function () {
        const bodyTxt = document.body ? (document.body.innerText || "") : "";
        const m = bodyTxt.match(/#(COMPRA|PEDIDO)-[A-Z0-9_-]+/i);
        if (m) {
          const folio = m[0].replace(/^#/, "");
          upsertOrder(folio, {
            status: "Pedido pendiente",
            estado: "Pedido pendiente"
          });
          notifyClient("Pedido #" + folio + " enviado a WhatsApp — Estatus: Pedido pendiente");
          renderClientOrdersListIfNeeded();
        }
      }, 150);
    }

    if (/actualizar\s*estatus|actualizar\s*estado/i.test(txt)) {
      setTimeout(function () {
        renderClientOrdersListIfNeeded();
        const orders = loadOrders();
        if (orders.length > 0) {
          const latest = orders[0];
          const f = String(latest.id || latest.folio || "").replace(/^#/, "");
          const st = latest.status || latest.estado || "Pendiente";
          notifyClient("Estatus actualizado — Pedido #" + f + ": " + st);
        }
      }, 120);
    }
  }, true);

  window.addEventListener("storage", function (e) {
    if (!e || !e.key || /order|pedido|compra|darecore/i.test(e.key)) {
      renderClientOrdersListIfNeeded();
    }
  });

  if (bc) {
    bc.onmessage = function (ev) {
      if (ev && ev.data && ev.data.type === "orders_sync") {
        renderClientOrdersListIfNeeded();
        if (ev.data.meta && ev.data.meta.folio) {
          notifyClient("Pedido #" + String(ev.data.meta.folio).replace(/^#/, "") + " actualizado a: " + ev.data.meta.status);
        }
      }
    };
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderClientOrdersListIfNeeded();
    setTimeout(renderClientOrdersListIfNeeded, 400);
    setTimeout(renderClientOrdersListIfNeeded, 1200);
  });
})();
/* DARECORE STRICT WHATSAPP GATE */
(function () {
  if (window.__dcStrictWhatsAppGateInstalled) return;
  window.__dcStrictWhatsAppGateInstalled = true;

  function getValidWhatsAppDigits() {
    const inputs = Array.from(document.querySelectorAll("input, tel"));
    const waInput = inputs.find(function (inp) {
      const meta = ((inp.id || "") + " " + (inp.name || "") + " " + (inp.placeholder || "") + " " + (inp.getAttribute("aria-label") || "")).toLowerCase();
      if (/whatsapp|wa|tel[eé]fono|celular|477/i.test(meta)) return true;
      const prevTxt = (inp.previousElementSibling && inp.previousElementSibling.textContent || "").toLowerCase();
      const parentTxt = (inp.parentElement && inp.parentElement.textContent || "").toLowerCase();
      return /n[uú]mero de whatsapp|whatsapp/i.test(prevTxt + " " + parentTxt);
    });
    if (!waInput) return { ok: true, digits: "", el: null };
    const digits = String(waInput.value || "").replace(/\D+/g, "");
    return { ok: digits.length === 10, digits: digits, el: waInput };
  }

  function showStrictWaError(el) {
    const msg = "Debes ingresar tu número de WhatsApp de 10 dígitos para continuar.";
    if (typeof window.showFloatingToast === "function") {
      try { window.showFloatingToast(msg); } catch (_) {}
    } else {
      alert(msg);
    }
    if (el) {
      el.style.borderColor = "#ef4444";
      el.focus();
      setTimeout(function () { el.style.borderColor = ""; }, 2500);
    }
  }

  // Interceptar clics en botones de Dare Lab / solicitar mockup / total estimado
  document.addEventListener("click", function (e) { if (window.__dcIsInsideDareCoreAI && window.__dcIsInsideDareCoreAI(e.target)) return;
    const btn = e.target && e.target.closest ? e.target.closest("button, a") : null;
    if (!btn) return;
    const txt = (btn.textContent || "").trim().toLowerCase();
    const isDareLabAction = /solicitar\s*mockup|total\s*estimado|cotizar/i.test(txt);
    if (!isDareLabAction) return;

    const check = getValidWhatsAppDigits();
    if (!check.ok) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      showStrictWaError(check.el);
      window.__dcBlockNextWhatsAppUntil = Date.now() + 2000;
    }
  }, true);

  // Bloquear window.open hacia WhatsApp si el usuario no ingreso los 10 digitos en Dare Lab
  const origOpen = window.open.bind(window);
  window.open = function (url) {
    const u = String(url || "");
    const inPersonalizar = /personalizar/i.test(window.location.pathname || "");
    const blockedRecently = window.__dcBlockNextWhatsAppUntil && Date.now() < window.__dcBlockNextWhatsAppUntil;
    if (/whatsapp\.com|wa\.me/i.test(u) && (inPersonalizar || blockedRecently)) {
      const check = getValidWhatsAppDigits();
      if (!check.ok) {
        showStrictWaError(check.el);
        return null;
      }
    }
    return origOpen.apply(window, arguments);
  };
})();