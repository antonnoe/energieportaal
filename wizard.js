/**
 * wizard.js — Section/Phase navigation for EnergiePortaal
 * Based on Financieel Kompas wizard v2 pattern
 * Slides addressed as "section-phase" e.g. "2-explain", "2-input", "2-confirm"
 */
(function () {
  'use strict';

  var currentSection = 1;
  var currentPhase = 'main';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); };

  document.addEventListener('DOMContentLoaded', function () {
    var slides = $$('.slide');
    var stepItems = $$('.step-item');

    // --- Navigation clicks ---
    document.addEventListener('click', function (e) {
      var goBtn = e.target.closest('[data-go]');
      if (!goBtn) return;

      var parts = goBtn.dataset.go.split('-');
      var sec = parts[0];
      var phase = parts[1] || 'main';

      // If it's a confirm-step button, build the confirm card first
      if (goBtn.classList.contains('btn-confirm-step')) {
        if (typeof buildConfirm === 'function') buildConfirm(sec);
      }

      // If navigating to result section, trigger calculation + DPE
      if (sec === '3') {
        if (typeof computeAndRender === 'function') computeAndRender();
      }

      goTo(sec, phase);
    });

    // --- Step indicator clicks ---
    stepItems.forEach(function (item) {
      item.addEventListener('click', function () {
        var sec = parseInt(item.dataset.section, 10);
        if (sec === 3 && typeof computeAndRender === 'function') computeAndRender();
        goTo(String(sec), 'main');
      });
    });

    // ============================================================
    // NAVIGATION
    // ============================================================
    function goTo(section, phase) {
      section = String(section);
      phase = phase || 'main';
      var secNum = parseInt(section, 10);

      // Find target slide
      var target = null;
      slides.forEach(function (s) {
        if (s.dataset.section === section && s.dataset.phase === phase) target = s;
      });
      if (!target) return;

      // Hide all, show target
      slides.forEach(function (s) { s.classList.remove('active'); });
      target.classList.add('active');
      target.scrollTop = 0;

      // Update step indicator
      stepItems.forEach(function (item) {
        var itemSec = parseInt(item.dataset.section, 10);
        item.classList.remove('active', 'completed');
        if (itemSec === secNum) item.classList.add('active');
        else if (itemSec < secNum) item.classList.add('completed');
      });

      currentSection = secNum;
      currentPhase = phase;
    }

    // Expose for external use
    window.wizardGoTo = goTo;
  });
})();
