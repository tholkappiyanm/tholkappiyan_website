/*  =============================================
    HERO CANVAS SEQUENCE — Self-Contained Module
    Handles: preloading, canvas draw, scroll phases
    Files: ./frame/frame_000_delay-0.066s.webp … frame_119_delay-0.066s.webp
    ============================================= */

(function () {
    'use strict';

    // ── DOM ──
    const canvas  = document.getElementById('heroCanvas');
    if (!canvas) { console.error('[hero-seq] #heroCanvas not found'); return; }
    const ctx = canvas.getContext('2d');

    const heroSection  = document.getElementById('hero');
    const heroSticky   = document.getElementById('heroSticky');
    const heroName     = document.getElementById('heroName');
    const heroRole     = document.getElementById('heroRole');
    const heroExtra1   = document.getElementById('heroExtra1');
    const heroExtra2   = document.getElementById('heroExtra2');
    const heroInfo     = document.getElementById('heroInfo');
    const heroBottom   = document.getElementById('heroBottom');
    const ringFill     = document.getElementById('ringFill');
    const ringFrame    = document.getElementById('ringFrame');
    const preloader    = document.getElementById('preloader');
    const preloaderBar = document.getElementById('preloaderBar');
    const preloaderStatus = document.getElementById('preloaderStatus');

    // ── CONFIG ──
    const TOTAL_FRAMES = 120;
    const isMobile = window.innerWidth < 768;
    const framesToLoad = isMobile ? 60 : TOTAL_FRAMES;

    // ── STATE ──
    const frames = [];
    let loadedCount = 0;
    let errorCount = 0;
    let currentFrame = 0;
    let targetFrame = 0;
    let scrollRatio = 0;
    let running = false;

    console.log('[hero-seq] Init — loading', framesToLoad, 'frames');

    // ── CANVAS SIZE ──
    function sizeCanvas() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);

    // ── PRELOAD FRAMES ──
    for (let i = 0; i < framesToLoad; i++) {
        const img = new Image();
        const n = isMobile ? (i * 2) : i;                       // skip every other on mobile
        const idx = String(n).padStart(3, '0');
        img.src = './frame/frame_' + idx + '_delay-0.066s.webp'; // exact filename on disk

        img.onload = onFrameReady;
        img.onerror = function () {
            errorCount++;
            console.warn('[hero-seq] 404 → ' + this.src);
            onFrameReady();
        };
        frames.push(img);
    }

    function onFrameReady() {
        loadedCount++;
        const pct = Math.round((loadedCount / framesToLoad) * 100);
        if (preloaderBar)    preloaderBar.style.width = pct + '%';
        if (preloaderStatus) preloaderStatus.textContent = pct + '%';

        // Draw very first frame immediately so canvas isn't blank
        if (loadedCount === 1) drawFrame(0);

        if (loadedCount >= framesToLoad) {
            console.log('[hero-seq] All frames ready (' + errorCount + ' errors)');
            hidePreloader();
        }
    }

    function hidePreloader() {
        if (preloader) {
            preloader.style.transition = 'opacity .6s ease';
            preloader.style.opacity = '0';
            setTimeout(function () {
                preloader.style.display = 'none';
                startLoop();
            }, 650);
        } else {
            startLoop();
        }
    }

    // ── SCROLL TRACKING ──
    // Works with native scroll — Lenis lets native scrollY update normally
    window.addEventListener('scroll', function () {
        if (!heroSection) return;
        var heroH = heroSection.offsetHeight - window.innerHeight;
        if (heroH <= 0) heroH = 1;
        scrollRatio  = Math.min(Math.max(window.scrollY / heroH, 0), 1);
        targetFrame  = scrollRatio * (framesToLoad - 1);
    }, { passive: true });

    // ── RENDER LOOP ──
    function startLoop() {
        if (running) return;
        running = true;
        console.log('[hero-seq] Render loop started');
        tick();
    }

    function tick() {
        // LERP smoothing
        currentFrame += (targetFrame - currentFrame) * 0.12;
        drawFrame(currentFrame);
        updateOverlays(scrollRatio);
        requestAnimationFrame(tick);
    }

    function drawFrame(f) {
        var W = canvas.width, H = canvas.height;
        // Always fill background
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, W, H);

        var idx = Math.max(0, Math.min(Math.round(f), framesToLoad - 1));
        var img = frames[idx];
        if (img && img.complete && img.naturalWidth > 0) {
            // Cover-fit: figure out scale so image covers canvas
            var imgRatio = img.naturalWidth / img.naturalHeight;
            var canRatio = W / H;
            var dw, dh, dx, dy;
            if (imgRatio > canRatio) {
                dh = H; dw = H * imgRatio; dx = (W - dw) / 2; dy = 0;
            } else {
                dw = W; dh = W / imgRatio; dx = 0; dy = (H - dh) / 2;
            }
            ctx.drawImage(img, dx, dy, dw, dh);
        }

        // Raw data scatter overlay (frames 39-62 equivalent)
        drawRawData(scrollRatio);
    }

    // ── RAW DATA SCATTER ──
    var rawVals = ['NaN','0.847','NULL','23.4%','1,247','0.003','?','50,000','—','0.91',
                   'error','True','False','NaN','inf','0.002','missing','99.1%','404','1.0'];
    var rngPositions = [];
    for (var p = 0; p < 20; p++) rngPositions.push({ x: Math.random(), y: Math.random() });

    function drawRawData(ratio) {
        var df = Math.round(ratio * 119);
        var op = 0;
        if (df >= 39 && df < 46)       op = (df - 39) / 7;
        else if (df >= 46 && df <= 55)  op = 1;
        else if (df > 55 && df <= 62)   op = 1 - (df - 55) / 7;
        if (op <= 0) return;

        ctx.save();
        ctx.globalAlpha = op;
        ctx.font = "12px 'JetBrains Mono', monospace";
        ctx.fillStyle = '#D85A30';
        rngPositions.forEach(function (pt, i) {
            ctx.fillText(rawVals[i], pt.x * canvas.width, pt.y * canvas.height);
        });
        ctx.restore();
    }

    // ── OVERLAY PHASES ──
    function mapOp(ratio, a, b, c, d) {
        if (ratio < a) return 0;
        if (ratio < b) return (ratio - a) / (b - a);
        if (ratio < c) return 1;
        if (ratio < d) return 1 - (ratio - c) / (d - c);
        return 0;
    }

    function updateOverlays(r) {
        // Phase 1: Name (0.00 -> 0.19)
        if (heroName) {
            var op1 = mapOp(r, 0.00, 0.04, 0.15, 0.19);
            heroName.style.opacity = op1;
            heroName.style.transform = 'translateY(-50%) translateX(' + (30 * (op1 - 1)) + 'px)';
        }

        // Phase 2: Role (0.20 -> 0.39)
        if (heroRole) {
            var op2 = mapOp(r, 0.20, 0.24, 0.35, 0.39);
            heroRole.style.opacity = op2;
            heroRole.style.transform = 'translateY(-50%) translateX(' + (30 * (op2 - 1)) + 'px)';
        }

        // Phase 3: Extra 1 (0.40 -> 0.59)
        if (heroExtra1) {
            var op3 = mapOp(r, 0.40, 0.44, 0.55, 0.59);
            heroExtra1.style.opacity = op3;
            heroExtra1.style.transform = 'translateY(-50%) translateX(' + (30 * (op3 - 1)) + 'px)';
        }

        // Phase 4: Extra 2 (0.60 -> 0.81)
        if (heroExtra2) {
            var op4 = mapOp(r, 0.60, 0.64, 0.77, 0.81);
            heroExtra2.style.opacity = op4;
            heroExtra2.style.transform = 'translateY(-50%) translateX(' + (30 * (op4 - 1)) + 'px)';
        }

        // Phase 5: Hero Info (0.83 -> 1.0)
        if (heroInfo) {
            if (r < 0.83) {
                heroInfo.style.opacity = 0;
                heroInfo.style.transform = 'translateX(40px)';
            } else {
                var t = (r - 0.83) / 0.05; // Fades in quickly over 0.05
                t = Math.min(Math.max(t, 0), 1);
                heroInfo.style.opacity = t;
                heroInfo.style.transform = 'translateX(' + (40 * (1 - t)) + 'px)';
            }
        }

        if (heroBottom) heroBottom.style.opacity  = mapOp(r, 0.00, 0.001, 0.06, 0.09);

        if (ringFill && ringFrame) {
            var circ = 276.46;
            ringFill.style.strokeDasharray  = circ;
            ringFill.style.strokeDashoffset = circ - (r * circ);
            ringFrame.textContent = String(Math.round(r * 119) + 1).padStart(3, '0');
        }
    }

})();
