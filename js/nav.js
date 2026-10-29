/**
 * DizpatchGO — Shared Navigation & Scroll Utilities
 * Security: No inline event handlers, strict input handling
 */
(function () {
  'use strict';

  /* ── Scroll-reveal ─────────────────────────────────────── */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ── Sticky nav shadow on scroll ───────────────────────── */
  function initNavScroll() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    const handler = () => {
      nav.classList.toggle('scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
  }

  /* ── Mobile hamburger menu ──────────────────────────────── */
  function initMobileMenu() {
    const btn = document.getElementById('hamburgerBtn');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    // Close on link click
    menu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        menu.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        menu.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── Active nav link highlight ──────────────────────────── */
  function initActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .mobile-menu a').forEach((a) => {
      const href = a.getAttribute('href') || '';
      const name = href.split('/').pop();
      if (name === current || (current === 'index.html' && (name === '' || name === '/'))) {
        a.classList.add('active');
      }
    });
  }

  /* ── Language switcher ──────────────────────────────────── */
  function initLangSwitch() {
    const btns = document.querySelectorAll('.lang-switch');
    if (!btns.length) return;
    const saved = localStorage.getItem('dgo_lang') || 'en';
    applyLang(saved, btns);

    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const current = document.body.classList.contains('lang-zh') ? 'zh' : 'en';
        const next = current === 'en' ? 'zh' : 'en';
        applyLang(next, btns);
        localStorage.setItem('dgo_lang', next);
      });
    });
  }

  function applyLang(lang, btns) {
    if (lang === 'zh') {
      document.body.classList.add('lang-zh');
      btns.forEach((btn) => {
        btn.textContent = btn.id === 'mobileLangSwitchBtn' ? '切换至 English' : 'EN';
      });
    } else {
      document.body.classList.remove('lang-zh');
      btns.forEach((btn) => {
        btn.textContent = btn.id === 'mobileLangSwitchBtn' ? '切换至 中文' : '中文';
      });
    }
  }

  /* ── Animated counter ───────────────────────────────────── */
  function initCounters() {
    const counters = document.querySelectorAll('.count-up');
    if (!counters.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseFloat(el.dataset.target || '0');
            const suffix = el.dataset.suffix || '';
            const duration = 1400;
            const start = performance.now();
            function tick(now) {
              const elapsed = now - start;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              const value = target * eased;
              el.textContent = (Number.isInteger(target) ? Math.round(value) : value.toFixed(1)) + suffix;
              if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => io.observe(c));
  }

  /* ── Pricing billing period toggle (Annual vs Monthly) ── */
  function initPricingToggle() {
    const btnAnnual = document.getElementById('btnBillingAnnual');
    const btnMonthly = document.getElementById('btnBillingMonthly');
    const container = document.getElementById('pricingSection');
    if (!btnAnnual || !btnMonthly || !container) return;

    btnAnnual.addEventListener('click', () => {
      btnAnnual.classList.add('active');
      btnMonthly.classList.remove('active');
      btnAnnual.setAttribute('aria-pressed', 'true');
      btnMonthly.setAttribute('aria-pressed', 'false');
      container.classList.add('show-annual');
      container.classList.remove('show-monthly');
    });

    btnMonthly.addEventListener('click', () => {
      btnMonthly.classList.add('active');
      btnAnnual.classList.remove('active');
      btnMonthly.setAttribute('aria-pressed', 'true');
      btnAnnual.setAttribute('aria-pressed', 'false');
      container.classList.add('show-monthly');
      container.classList.remove('show-annual');
    });
  }

  /* ── Init ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initNavScroll();
    initMobileMenu();
    initActiveNav();
    initLangSwitch();
    initCounters();
    initPricingToggle();
  });
})();
