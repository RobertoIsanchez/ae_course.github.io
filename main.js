'use strict';
/* ╔═══════════════════════════════════════════════════════════╗
   ║       MASTERING AFTER EFFECTS — main.js                 ║
   ║  ① Three.js subtle particles  ② GSAP animations        ║
   ║  ③ Video hero fade on scroll  ④ Card flip / counters   ║
   ╚═══════════════════════════════════════════════════════════╝ */

/* ══════════════════════════════════════════════════════════════
   1. THREE.JS — SUBTLE ROUND FLOATING PARTICLES
   Soft white/green dots floating upward, ethereal & magical
══════════════════════════════════════════════════════════════ */
(function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
        -W / 2, W / 2,   // left / right
         H / 2, -H / 2,  // top / bottom
         0.1, 1000
    );
    camera.position.z = 100;

    /* ── Build particles ── */
    const COUNT    = 90;   // subtle – not too many
    const SPREAD_X = W;
    const SPREAD_Y = H * 2;

    // Store per-particle data for individual animation
    const particles = [];

    // Simple circle sprite via canvas texture
    function makeCircleTex(radius, color, opacity) {
        const size = radius * 2 + 4;
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d');
        const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        // parse hex color
        const r = parseInt(color.slice(1,3),16);
        const g = parseInt(color.slice(3,5),16);
        const b = parseInt(color.slice(5,7),16);
        grad.addColorStop(0,   `rgba(${r},${g},${b},${opacity})`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${opacity * 0.5})`);
        grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
        ctx.fill();
        const tex = new THREE.CanvasTexture(c);
        return tex;
    }

    // Palette: mostly soft whites, a few greens, a couple purples — very muted
    const palette = [
        { color: '#ffffff', opacity: 0.22, weight: 50 },
        { color: '#ccffe8', opacity: 0.18, weight: 25 },
        { color: '#00ffaa', opacity: 0.15, weight: 15 },
        { color: '#d8b4fe', opacity: 0.13, weight: 10 },
    ];

    // Build weighted list
    const weightedPalette = [];
    palette.forEach(p => {
        for (let i = 0; i < p.weight; i++) weightedPalette.push(p);
    });

    for (let i = 0; i < COUNT; i++) {
        const p = weightedPalette[Math.floor(Math.random() * weightedPalette.length)];
        const radius = 2 + Math.random() * 5;  // 2–7 px — small & subtle
        const tex = makeCircleTex(Math.ceil(radius), p.color, p.opacity);

        const mat = new THREE.SpriteMaterial({
            map: tex,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        const sprite = new THREE.Sprite(mat);

        const scaleVal = radius * 2.4;
        sprite.scale.set(scaleVal, scaleVal, 1);

        // Random starting position spread across full page (tall)
        sprite.position.set(
            (Math.random() - 0.5) * SPREAD_X,
            (Math.random() - 0.5) * SPREAD_Y,
            0
        );

        scene.add(sprite);

        particles.push({
            sprite,
            // Individual drift parameters
            speedY:    0.18 + Math.random() * 0.32,   // upward drift speed
            speedX:    (Math.random() - 0.5) * 0.12,  // gentle side sway
            driftAmp:  8 + Math.random() * 18,         // horizontal sine amplitude
            driftFreq: 0.3 + Math.random() * 0.7,      // sine frequency
            phase:     Math.random() * Math.PI * 2,    // sine phase offset
            baseX:     (Math.random() - 0.5) * SPREAD_X,
            startY:    (Math.random() - 0.5) * SPREAD_Y,
            opacity:   p.opacity,
            pulseAmp:  0.04 + Math.random() * 0.06,   // opacity pulse
            pulseFreq: 0.5 + Math.random() * 1.0,
        });
    }

    /* ── Mouse subtle influence ── */
    let mouseNX = 0, mouseNY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseNX = (e.clientX / window.innerWidth  - 0.5);
        mouseNY = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });

    /* ── Scroll: offset camera Y so particles appear across whole page ── */
    let scrollY = 0;
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    }, { passive: true });

    /* ── Animate loop ── */
    let t = 0;
    (function animate() {
        requestAnimationFrame(animate);
        t += 0.016; // ~60fps time step

        // Camera follows scroll so particles float across the full page
        camera.position.y = scrollY * 0.6;

        // Subtle mouse drift on camera
        camera.position.x += (mouseNX * 12 - camera.position.x) * 0.02;

        particles.forEach(p => {
            // Float upward, reset when too high
            p.sprite.position.y += p.speedY;

            // When particle floats out of view range, reset to bottom
            const viewTop    = scrollY * 0.6 + H / 2 + 60;
            const viewBottom = scrollY * 0.6 - H / 2 - 60;

            if (p.sprite.position.y > viewTop + 100) {
                p.sprite.position.y = viewBottom - Math.random() * 200;
                p.sprite.position.x = (Math.random() - 0.5) * SPREAD_X;
            }

            // Gentle horizontal sway
            p.sprite.position.x = p.baseX + Math.sin(t * p.driftFreq + p.phase) * p.driftAmp;

            // Soft opacity pulse
            const pulsedOpacity = p.opacity + Math.sin(t * p.pulseFreq + p.phase) * p.pulseAmp;
            p.sprite.material.opacity = Math.max(0, Math.min(1, pulsedOpacity));
        });

        renderer.render(scene, camera);
    })();

    /* ── Resize ── */
    window.addEventListener('resize', () => {
        const nW = window.innerWidth;
        const nH = window.innerHeight;
        camera.left   = -nW / 2;
        camera.right  =  nW / 2;
        camera.top    =  nH / 2;
        camera.bottom = -nH / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(nW, nH);
    });
})();


/* ══════════════════════════════════════════════════════════════
   2. GSAP + SCROLLTRIGGER ANIMATIONS
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    /* ── Navbar scroll class ── */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });

    /* ── Hero video fade-out as content scrolls over it ──
       The .hero-video-bg is fixed. We smoothly fade it out
       as page-content scrolls over it, so the transition feels cinematic.
    ── */
    const videoBg = document.getElementById('hero-video-bg');
    ScrollTrigger.create({
        trigger: '#page-content',
        start: 'top bottom',   // when page-content top hits viewport bottom
        end: 'top top',        // when page-content top hits viewport top (fully covered)
        scrub: true,
        onUpdate: (self) => {
            // progress 0 → 1 as page-content scrolls from bottom to top of viewport
            // fade video out as content scrolls up
            const opacity = 1 - self.progress;
            videoBg.style.opacity = opacity;
        }
    });

    /* ── Title block entrance ── */
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });
    heroTl
        .to('#eyebrow',       { opacity: 1, y: 0, delay: 0.2 })
        .to('#main-title',    { opacity: 1, y: 0 }, '-=0.5')
        .to('#main-sub',      { opacity: 1, y: 0 }, '-=0.5')
        .to('#hero-actions',  { opacity: 1, y: 0 }, '-=0.5')
        .to('#stats-bar',     { opacity: 1, y: 0, ease: 'back.out(1.5)' }, '-=0.3');

    /* ── Section headings ── */
    gsap.utils.toArray('.section-header, .forwho-text, .cta-double').forEach(el => {
        gsap.from(el, {
            scrollTrigger: { trigger: el, start: 'top 80%' },
            opacity: 0, y: 50, duration: 0.9, ease: 'power3.out',
        });
    });

    /* ── Cards stagger ── */
    gsap.from('.card-wrap', {
        scrollTrigger: { trigger: '.cards-container', start: 'top 78%' },
        y: 80, opacity: 0, duration: 1, stagger: 0.16, ease: 'back.out(1.7)',
    });

    /* ── For-who section ── */
    gsap.from('.forwho-visual', {
        scrollTrigger: { trigger: '.section-forwho', start: 'top 72%' },
        x: 60, opacity: 0, duration: 1.1, ease: 'power3.out',
    });
    gsap.from('.check-list li', {
        scrollTrigger: { trigger: '.check-list', start: 'top 82%' },
        x: -30, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out',
    });
    gsap.from('.vid-label', {
        scrollTrigger: { trigger: '.forwho-visual', start: 'top 72%' },
        opacity: 0, x: 20, duration: 0.7, stagger: 0.15, ease: 'back.out(2)',
    });

    /* ── Project cards ── */
    gsap.from('.project-card', {
        scrollTrigger: { trigger: '.project-grid', start: 'top 80%' },
        y: 40, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out',
    });

    /* ── Pricing ── */
    gsap.from('.price-row', {
        scrollTrigger: { trigger: '.price-row', start: 'top 80%' },
        opacity: 0, scale: 0.9, duration: 1, ease: 'back.out(1.4)',
    });
    gsap.from('.cta-btns', {
        scrollTrigger: { trigger: '.cta-btns', start: 'top 88%' },
        opacity: 0, y: 24, duration: 0.8, ease: 'power2.out',
    });

    /* ── CTA button pulsing glow ── */
    const enrollBtn = document.getElementById('enroll-btn');
    if (enrollBtn) {
        gsap.to(enrollBtn, {
            boxShadow: '0 0 40px rgba(114,196,90,0.6), 0 10px 30px rgba(114,196,90,0.28)',
            yoyo: true, repeat: -1, duration: 1.5, ease: 'sine.inOut',
        });
    }
    const heroCtaBtn = document.getElementById('hero-cta');
    if (heroCtaBtn) {
        gsap.to(heroCtaBtn, {
            boxShadow: '0 0 30px rgba(114,196,90,0.5)',
            yoyo: true, repeat: -1, duration: 1.8, ease: 'sine.inOut',
        });
    }


    /* ══════════════════════════════════════════════════════════
       3. COUNTER ANIMATION
    ══════════════════════════════════════════════════════════ */
    const counters = document.querySelectorAll('.stat-num[data-target]');
    ScrollTrigger.create({
        trigger: '#stats-bar',
        start: 'top 90%',
        once: true,
        onEnter: () => {
            counters.forEach(el => {
                const target = +el.getAttribute('data-target');
                gsap.fromTo(
                    { val: 0 },
                    { val: target },
                    {
                        duration: 2.4,
                        ease: 'power2.out',
                        onUpdate: function () {
                            el.textContent = Math.round(this.targets()[0].val);
                        }
                    }
                );
            });
        }
    });


    /* ══════════════════════════════════════════════════════════
       4. CARD FLIP — click toggle (touch/mobile) + badge animations
    ══════════════════════════════════════════════════════════ */
    document.querySelectorAll('.card-scene').forEach(scene => {
        const card  = scene.querySelector('.card');
        const badge = scene.querySelector('.card-lvl-badge');

        // ── Click flip (mobile / touch) ──
        scene.addEventListener('click', () => {
            const wasFlipped = card.classList.contains('flipped');
            card.classList.toggle('flipped');
            // Si volvemos al frente → animar el badge de regreso
            if (wasFlipped && badge) triggerBadgeLanding(badge);
        });

        // ── Hover leave → badge vuelve girando ──
        scene.addEventListener('mouseleave', () => {
            if (badge) triggerBadgeLanding(badge);
        });
    });

    /** Lanza la animación badge-spin-in una sola vez y la limpia al terminar */
    function triggerBadgeLanding(badge) {
        // Pequeño delay para que la animación de salida termine primero
        setTimeout(() => {
            badge.classList.add('badge-landing');
            badge.addEventListener('animationend', () => {
                badge.classList.remove('badge-landing');
            }, { once: true });
        }, 50);
    }



    /* ══════════════════════════════════════════════════════════
       5. SMOOTH SCROLL for internal links
    ══════════════════════════════════════════════════════════ */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const target = document.querySelector(link.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            gsap.to(window, {
                duration: 1.1,
                scrollTo: { y: target, offsetY: 70 },
                ease: 'power3.inOut',
            });
        });
    });

});
