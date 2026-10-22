/* Event-driven interaction for the live workflow scene. */
(() => {
  'use strict';

  function initialize() {
    const scene = document.getElementById('workflowScene');
    const world = scene?.querySelector('.spatial-world');
    if (!scene || !world) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const buttons = Array.from(document.querySelectorAll('button[data-workflow]'));
    const panels = Array.from(document.querySelectorAll('[data-workflow-panel]'));
    const clamp = value => Math.max(-3, Math.min(3, value));
    let inView = !('IntersectionObserver' in window);
    let frame = null;
    let pendingTilt = { x: 0, y: 0 };

    function writeTilt(x, y) {
      world.style.setProperty('--scene-tilt-x', `${clamp(x).toFixed(2)}deg`);
      world.style.setProperty('--scene-tilt-y', `${clamp(y).toFixed(2)}deg`);
    }

    function resetTilt() {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      pendingTilt = { x: 0, y: 0 };
      writeTilt(0, 0);
    }

    function canMove() {
      return inView && !document.hidden && !reducedMotion.matches && finePointer.matches;
    }

    function queueTilt(x, y) {
      if (!canMove()) return;
      pendingTilt = { x: clamp(x), y: clamp(y) };
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        if (canMove()) writeTilt(pendingTilt.x, pendingTilt.y);
      });
    }

    function syncVisibility() {
      scene.classList.toggle('is-inview', inView && !document.hidden);
      scene.classList.toggle('is-reduced-motion', reducedMotion.matches);
      if (!canMove()) resetTilt();
    }

    function select(button) {
      if (!button || button.disabled) return;
      const selection = button.dataset.workflow;
      buttons.forEach(item => {
        const active = item === button;
        item.setAttribute('aria-pressed', String(active));
        item.classList.toggle('is-selected', active);
      });
      panels.forEach(panel => {
        const active = panel.dataset.workflowPanel === selection;
        panel.classList.toggle('is-selected', active);
        panel.setAttribute('aria-hidden', String(!active));
        if (active) {
          const preview = panel.querySelector('img');
          if (preview) preview.loading = 'eager';
        }
      });
      scene.dataset.selected = selection;
    }

    buttons.forEach(button => button.addEventListener('click', () => select(button)));
    scene.addEventListener('pointermove', event => {
      if (!canMove() || event.pointerType !== 'mouse') return;
      const bounds = scene.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
      const y = (event.clientY - bounds.top) / bounds.height * 2 - 1;
      queueTilt(-y * 2, x * 3);
    }, { passive: true });

    scene.addEventListener('pointerleave', resetTilt, { passive: true });
    scene.addEventListener('pointercancel', resetTilt, { passive: true });
    window.addEventListener('blur', resetTilt);
    document.addEventListener('visibilitychange', syncVisibility);

    function listenForPreference(query, listener) {
      if (query.addEventListener) query.addEventListener('change', listener);
      else if (query.addListener) query.addListener(listener);
    }
    listenForPreference(reducedMotion, syncVisibility);
    listenForPreference(finePointer, resetTilt);

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        const entry = entries[entries.length - 1];
        inView = Boolean(entry?.isIntersecting);
        syncVisibility();
      }, { threshold: 0.08 });
      observer.observe(scene);
    }

    select(buttons.find(button => button.getAttribute('aria-pressed') === 'true') ||
      buttons.find(button => button.dataset.workflow === 'inventory') || buttons[0]);
    resetTilt();
    syncVisibility();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
