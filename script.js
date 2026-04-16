/* ============================================
   M. Tholkappiyan — Portfolio JS
   Lenis smooth-scroll, Nav, Cursor, Reveal, Interactions
   Canvas + frame sequence is in hero-sequence.js
   ============================================ */

(function () {
    'use strict';

    const $ = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);

    const heroSection = $('#hero');
    const heroSticky  = $('#heroSticky');
    const heroBottom  = $('#heroBottom');
    const cursor      = $('#cursor');
    const cursorFollower = $('#cursorFollower');
    const nav         = $('#mainNav');
    const navToggle   = $('#navToggle');
    const mobileMenu  = $('#mobileMenu');
    const navLinks    = $$('.nav-link');
    const mobileLinks = $$('.mobile-link');
    const sections    = $$('.section, .hero-section');

    let mouseX = 0, mouseY = 0, followerX = 0, followerY = 0;

    // ==================== LENIS ====================
    let lenis;

    function initLenis() {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        lenis.on('scroll', ({ scroll }) => {
            handleScroll(scroll);
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    function handleScroll(scrollY) {
        if (typeof scrollY !== 'number') scrollY = window.scrollY;

        const heroH = heroSection ? (heroSection.offsetHeight - window.innerHeight) : 1;
        const f = Math.min(1, Math.max(0, scrollY / heroH));

        // Sticky visibility
        if (heroSticky) {
            if (scrollY > heroH) {
                heroSticky.style.opacity = '0';
                heroSticky.style.pointerEvents = 'none';
            } else {
                heroSticky.style.opacity = '1';
                heroSticky.style.pointerEvents = 'auto';
            }
        }

        if (heroBottom) heroBottom.classList.toggle('hidden', scrollY > 60);
        if (nav) nav.classList.toggle('scrolled', scrollY > 60);
        updateActiveNav();
    }

    // ==================== CURSOR ====================
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX; mouseY = e.clientY;
        if (cursor) { cursor.style.left = mouseX + 'px'; cursor.style.top = mouseY + 'px'; }
    });

    function animateFollower() {
        followerX += (mouseX - followerX) * 0.1;
        followerY += (mouseY - followerY) * 0.1;
        if (cursorFollower) { cursorFollower.style.left = followerX + 'px'; cursorFollower.style.top = followerY + 'px'; }
        requestAnimationFrame(animateFollower);
    }
    animateFollower();

    function initCursorHovers() {
        $$('a, button, .skill-tags span, .project-card, .contact-row, .stat-card').forEach(el => {
            el.addEventListener('mouseenter', () => { cursor?.classList.add('hover'); cursorFollower?.classList.add('hover'); });
            el.addEventListener('mouseleave', () => { cursor?.classList.remove('hover'); cursorFollower?.classList.remove('hover'); });
        });
    }

    // ==================== NAV ====================
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });
    }
    mobileLinks.forEach(l => l.addEventListener('click', () => {
        navToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    }));

    function updateActiveNav() {
        let current = '';
        sections.forEach(s => { if (window.scrollY >= s.offsetTop - 200) current = s.getAttribute('id'); });
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('data-section') === current));
    }

    // ==================== SCROLL REVEAL ====================
    function initScrollReveal() {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
        }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
        $$('.reveal-up').forEach(el => obs.observe(el));
    }

    // ==================== SMOOTH SCROLL ====================
    function initSmoothScroll() {
        $$('a[href^="#"]').forEach(a => {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                const t = $(this.getAttribute('href'));
                if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
            });
        });
    }

    // ==================== TILT & GLOW ====================
    function initInteractions() {
        $$('.project-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                card.style.transform = `perspective(800px) rotateX(${y * -2}deg) rotateY(${x * 2}deg) translateY(-4px)`;
            });
            card.addEventListener('mouseleave', () => { card.style.transform = ''; });
        });

        $$('.contact-row').forEach(row => {
            row.addEventListener('mousemove', (e) => {
                const r = row.getBoundingClientRect();
                row.style.background = `radial-gradient(circle at ${e.clientX - r.left}px ${e.clientY - r.top}px, rgba(0,229,255,.02), var(--surface))`;
            });
            row.addEventListener('mouseleave', () => { row.style.background = ''; });
        });

        $$('.skill-tags span').forEach(tag => {
            tag.addEventListener('mousemove', (e) => {
                const r = tag.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                tag.style.transform = `perspective(300px) rotateX(${y * -4}deg) rotateY(${x * 4}deg) translateY(-1px)`;
            });
            tag.addEventListener('mouseleave', () => { tag.style.transform = ''; });
        });
    }

    // ==================== INIT ====================
    function initAll() {
        initLenis();
        initScrollReveal();
        initSmoothScroll();
        initInteractions();
        initCursorHovers();
        handleScroll(window.scrollY);
    }

    // Start everything once page is ready
    window.addEventListener('load', () => {
        initAll();
    });
})();
