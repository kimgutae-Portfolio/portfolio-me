/* Progressive enhancement: the page stays readable before JavaScript runs. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let observedReveals = new WeakSet();
  let observedSteps = new WeakSet();
  let revealObserver;
  let processObserver;
  let initialized = false;

  function revealDelay(element) {
    const value = (element.dataset.delay || '0').trim();
    const match = value.match(/^(-?\d*\.?\d+)\s*(ms|s)?$/);
    const milliseconds = match
      ? Number(match[1]) * (match[2] === 's' ? 1000 : 1)
      : 0;
    element.style.setProperty('--reveal-delay', `${Math.max(0, Math.min(milliseconds, 600))}ms`);
  }

  function showEverything() {
    root.classList.remove('motion-ready');
    document.querySelectorAll('[data-reveal]').forEach(element => {
      revealDelay(element);
      element.classList.add('is-visible');
    });
    document.querySelectorAll('[data-process-step]').forEach(element => {
      element.classList.add('is-active');
    });
  }

  function refreshMotion() {
    if (!initialized) return;
    if (reducedMotion.matches || !revealObserver || !processObserver) {
      showEverything();
      return;
    }

    document.querySelectorAll('[data-reveal]').forEach(element => {
      revealDelay(element);
      if (!observedReveals.has(element) && !element.classList.contains('is-visible')) {
        observedReveals.add(element);
        revealObserver.observe(element);
      }
    });
    document.querySelectorAll('[data-process-step]').forEach(element => {
      if (!observedSteps.has(element) && !element.classList.contains('is-active')) {
        observedSteps.add(element);
        processObserver.observe(element);
      }
    });
  }

  window.refreshMotion = refreshMotion;

  function configureObservers() {
    revealObserver?.disconnect();
    processObserver?.disconnect();
    observedReveals = new WeakSet();
    observedSteps = new WeakSet();

    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      revealObserver = null;
      processObserver = null;
      showEverything();
      return;
    }

    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

    processObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-active');
        processObserver.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    refreshMotion();
    root.classList.add('motion-ready');
  }

  function initialize() {
    initialized = true;
    configureObservers();
    root.classList.add('hero-ready');
    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener('change', configureObservers);
    } else if (reducedMotion.addListener) {
      reducedMotion.addListener(configureObservers);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
