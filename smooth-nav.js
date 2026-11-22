(function () {
    var forbiddenWords = {
        'INICIO': 1,
        'HOMBRE': 1,
        'MUJER': 1,
        'OVERSIZE': 1,
        'PERSONALIZAR': 1
    };

    // Un color underground distinto por prenda, siempre combinado con negro
    var distinctColors = [
        'rgba(220, 38, 38, 0.58)',   // Rojo sangre
        'rgba(37, 99, 235, 0.60)',   // Azul eléctrico
        'rgba(16, 185, 129, 0.56)',  // Verde esmeralda
        'rgba(147, 51, 234, 0.58)',  // Morado underground
        'rgba(217, 119, 6, 0.58)',   // Ámbar quemado
        'rgba(6, 182, 212, 0.56)'    // Cian oscuro
    ];

    var rafId = null;

    function hideCartToast() {
        document.querySelectorAll('div, span, p, section').forEach(function (el) {
            var txt = (el.textContent || '').trim();
            if (/agregado al carrito/i.test(txt) && el.children.length <= 1) {
                var box = el.closest('[class*="toast"], [id*="toast"], [class*="alert"], [class*="notify"]') || el;
                box.style.setProperty('display', 'none', 'important');
                box.style.setProperty('opacity', '0', 'important');
                box.style.setProperty('pointer-events', 'none', 'important');
            }
        });
    }

    function cleanCardImageBoxes() {
        document.querySelectorAll('.product-card .product-img').forEach(function (el) {
            el.style.setProperty('background-color', 'transparent', 'important');
            el.style.setProperty('background-size', 'contain', 'important');
            el.style.setProperty('background-repeat', 'no-repeat', 'important');
            el.style.setProperty('background-position', 'center', 'important');
        });
    }

    function getCartBtn() {
        return (
            document.getElementById('cartBtn') ||
            document.querySelector('.cart-btn') ||
            document.querySelector('header button')
        );
    }

    function getGarmentVisual(btn) {
        var container =
            btn.closest('.modal, [class*="modal"], .product-card, article, .card') ||
            document.body;

        var img = container.querySelector('img');
        if (img) {
            var r = img.getBoundingClientRect();
            var src = img.currentSrc || img.getAttribute('src') || '';
            if (r.width > 20 && r.height > 20 && src) {
                return { rect: r, bg: 'url("' + src + '")' };
            }
        }

        var els = container.querySelectorAll('.product-img, div, figure, picture');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            var rect = el.getBoundingClientRect();
            if (rect.width >= 70 && rect.height >= 70 && rect.height <= 460) {
                var bg = el.style.backgroundImage || getComputedStyle(el).backgroundImage;
                if (bg && bg !== 'none') {
                    return { rect: rect, bg: bg };
                }
            }
        }

        var cr = container.getBoundingClientRect();
        return {
            rect: {
                left: cr.left + 24,
                top: cr.top + 32,
                width: Math.min(220, Math.max(110, cr.width * 0.35)),
                height: 180
            },
            bg: 'linear-gradient(135deg, #ff2a00, #ff5500)'
        };
    }

    function popCart(cartBtn) {
        if (!cartBtn) return;
        cartBtn.style.transition = 'transform 0.16s cubic-bezier(0.22, 1.35, 0.36, 1), box-shadow 0.16s ease';
        cartBtn.style.transform = 'scale(1.26)';
        cartBtn.style.boxShadow = '0 0 0 8px rgba(255, 85, 0, 0.28), 0 8px 22px rgba(255, 42, 0, 0.55)';

        setTimeout(function () {
            cartBtn.style.transform = 'scale(0.94)';
        }, 150);

        setTimeout(function () {
            cartBtn.style.transform = 'scale(1)';
            cartBtn.style.boxShadow = '';
        }, 310);
    }

    function flyGarmentToCart(btn) {
        var visual = getGarmentVisual(btn);
        var cartBtn = getCartBtn();
        if (!visual || !cartBtn) return;

        var gRect = visual.rect;
        var cRect = cartBtn.getBoundingClientRect();
        if (!gRect.width || !cRect.width) return;

        var flyer = document.createElement('div');
        flyer.style.position = 'fixed';
        flyer.style.left = gRect.left + 'px';
        flyer.style.top = gRect.top + 'px';
        flyer.style.width = gRect.width + 'px';
        flyer.style.height = gRect.height + 'px';
        flyer.style.backgroundImage = visual.bg;
        flyer.style.backgroundSize = 'contain';
        flyer.style.backgroundColor = 'transparent';
        flyer.style.backgroundPosition = 'center';
        flyer.style.backgroundRepeat = 'no-repeat';
        flyer.style.borderRadius = '18px';
        flyer.style.boxShadow = '0 16px 38px rgba(255, 42, 0, 0.45)';
        flyer.style.zIndex = '2147483647';
        flyer.style.pointerEvents = 'none';
        flyer.style.opacity = '1';
        flyer.style.transform = 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
        flyer.style.transition = 'none';

        document.body.appendChild(flyer);
        void flyer.offsetWidth;

        var targetX = cRect.left + cRect.width / 2 - 18;
        var targetY = cRect.top + cRect.height / 2 - 18;

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                flyer.style.transition =
                    'left 0.6s cubic-bezier(0.22, 0.88, 0.3, 1), ' +
                    'top 0.6s cubic-bezier(0.55, 0.06, 0.68, 0.53), ' +
                    'width 0.6s cubic-bezier(0.22, 0.88, 0.3, 1), ' +
                    'height 0.6s cubic-bezier(0.22, 0.88, 0.3, 1), ' +
                    'transform 0.6s cubic-bezier(0.22, 0.88, 0.3, 1), ' +
                    'opacity 0.6s ease';

                flyer.style.left = targetX + 'px';
                flyer.style.top = targetY + 'px';
                flyer.style.width = '36px';
                flyer.style.height = '36px';
                flyer.style.transform = 'translate3d(0, -14px, 0) scale(0.28) rotate(-14deg)';
                flyer.style.opacity = '0.25';
            });
        });

        setTimeout(function () {
            flyer.remove();
            popCart(cartBtn);
            hideCartToast();
        }, 620);
    }

    function getColorForGarment(name, index) {
        var n = (name || '').toLowerCase();
        if (n.indexOf('aro') !== -1) return distinctColors[0];     // Rojo
        if (n.indexOf('focus') !== -1) return distinctColors[1];   // Azul
        if (n.indexOf('motor') !== -1) return distinctColors[2];   // Verde
        if (n.indexOf('gymbro') !== -1) return distinctColors[4];  // Ámbar
        return distinctColors[Math.abs(index || 0) % distinctColors.length];
    }

    function updateHeroNow() {
        rafId = null;
        hideCartToast();
        cleanCardImageBoxes();

        var stage = document.querySelector('.darecore-hero-stage');
        if (!stage) return;

        var titleEl = stage.querySelector('.darecore-hero-title, h1, h2, h3');
        var rawName = (titleEl ? titleEl.textContent : '').trim();
        var upperName = rawName.toUpperCase();

        var dots = Array.prototype.slice.call(stage.querySelectorAll('.darecore-hero-dot'));
        var activeIdx = dots.findIndex(function (d) {
            return d.classList.contains('active');
        });
        if (activeIdx < 0) activeIdx = 0;

        var color = getColorForGarment(rawName, activeIdx);
        stage.style.setProperty('--garment-accent', color);

        // Eliminar cualquier texto de sección (INICIO, HOMBRE, etc.) y poner el nombre de la prenda
        var wm = null;
        stage.querySelectorAll('div, span, p').forEach(function (el) {
            if (
                el.closest('.darecore-hero-content') ||
                el.closest('.darecore-hero-visual') ||
                el.closest('.darecore-hero-dots')
            ) {
                return;
            }
            var txt = (el.textContent || '').trim().toUpperCase();
            var isWm = el.classList.contains('darecore-hero-watermark') || /watermark/i.test(el.className || '');

            if (isWm || (forbiddenWords[txt] && el.children.length === 0)) {
                if (!wm) {
                    wm = el;
                    wm.classList.add('darecore-hero-watermark');
                } else {
                    el.remove();
                }
            }
        });

        if (!wm) {
            wm = document.createElement('div');
            wm.className = 'darecore-hero-watermark';
            stage.appendChild(wm);
        }

        if (upperName && !forbiddenWords[upperName] && wm.textContent !== upperName) {
            wm.textContent = upperName;
        } else if (forbiddenWords[(wm.textContent || '').trim().toUpperCase()]) {
            wm.textContent = '';
        }
    }

    function scheduleHeroUpdate() {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(updateHeroNow);
    }

    document.addEventListener('click', function (e) {
        if (e.target.closest('.darecore-hero-stage, .darecore-hero-dot')) {
            scheduleHeroUpdate();
        }

        var btn = e.target.closest('button, a, [role="button"]');
        if (!btn) return;

        var text = (btn.textContent || '').trim().toLowerCase();
        var isAdd =
            btn.classList.contains('btn-add') ||
            text === 'agregar' ||
            text.indexOf('agregar') === 0 ||
            /addtocart|agregar/i.test(btn.getAttribute('onclick') || '');

        if (!isAdd) return;

        hideCartToast();
        flyGarmentToCart(btn);
    }, true);

    var obs = new MutationObserver(function () {
        scheduleHeroUpdate();
    });

    if (document.body) {
        updateHeroNow();
        obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            updateHeroNow();
            obs.observe(document.body, { childList: true, subtree: true, characterData: true });
        });
    }
})();