/* main.js — page interactions (navigation, stage jump links, comparison slider, reveals). */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var nav = document.getElementById('nav');
  var toggle = document.getElementById('nav-toggle');
  var links = document.getElementById('nav-links');

  /* Nav turns solid once the film has handed over to the content */
  document.addEventListener('sequence:progress', function (e) {
    nav.classList.toggle('is-solid', e.detail.p >= 0.985);
  });

  /* Mobile menu */
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    links.classList.toggle('is-open', open);
    nav.classList.toggle('is-open-menu', open);
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* Solutions index: one item open at a time; the stage image follows it */
  var items = Array.prototype.slice.call(document.querySelectorAll('.sol__item'));
  var stageImgs = Array.prototype.slice.call(document.querySelectorAll('.sol__stage img'));
  function openItem(n) {
    items.forEach(function (it, i) {
      var on = i === n;
      it.classList.toggle('is-active', on);
      it.querySelector('.sol__btn').setAttribute('aria-expanded', String(on));
      if (stageImgs[i]) stageImgs[i].classList.toggle('is-active', on);
    });
    if (stageImgs[n] && stageImgs[n].loading === 'lazy') stageImgs[n].loading = 'eager';
  }
  items.forEach(function (it, i) {
    var btn = it.querySelector('.sol__btn');
    btn.addEventListener('click', function () { openItem(i); });
    btn.addEventListener('focus', function () { openItem(i); });
    // Hover-to-preview only on devices with a real pointer and room for the stage
    btn.addEventListener('mouseenter', function () {
      if (window.matchMedia('(hover: hover) and (min-width: 62.01rem)').matches) openItem(i);
    });
  });

  /* Headline reveals: once, no repeat */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Observe the parent: a fully clipped element can report as not intersecting.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
    var seen = [];
    reveals.forEach(function (el) { var par = el.parentElement; if (seen.indexOf(par) < 0) { seen.push(par); io.observe(par); } });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
