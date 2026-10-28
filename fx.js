/* fx.js — editorial motion layer. Does not touch the hero script. */
(function () {
  'use strict';
  var D = document, R = D.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var mouse = { x: -999, y: -999 };
  addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

  /* ---------- split headings into masked words ---------- */
  $('.display, .huge').forEach(function (el) {
    var t = el.textContent.trim().replace(/\s+/g, ' ');
    el.setAttribute('aria-label', t);
    el.innerHTML = t.split(' ').map(function (w, i) { return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w + '</span></span>'; }).join(' ');
  });
  /* statement: one span per word for scroll fill */
  var fill = $('[data-fill]')[0], fillWords = [];
  if (fill) {
    var ft = fill.textContent.trim(); fill.setAttribute('aria-label', ft);
    fill.innerHTML = ft.split(' ').map(function (w) { return '<span class="sf" aria-hidden="true">' + w + '</span>'; }).join(' ');
    fillWords = $('.sf', fill);
  }

  /* ---------- reveal on view ---------- */
  var io = new IntersectionObserver(function (en) {
    en.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target; io.unobserve(el);
      if (el.matches('.eng__figure')) el.querySelector('.eng__img').classList.add('is-in'); else el.classList.add(el.matches('.display, .huge') ? 'is-in' : 'is-in-up');
    });
  }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  $('.display, .huge, .eng__figure, .facts > div, .eng .lede, .sol .lede, .cta .lede, .phil__text, .sol__item').forEach(function (el, i) { io.observe(el); });
  setTimeout(function () { $('.display, .huge, .eng__img').forEach(function (el) { el.classList.add('is-in'); }); $('.facts > div, .lede, .phil__text, .sol__item').forEach(function (el) { el.classList.add('is-in-up'); }); }, 12000);

  /* ---------- preloader ---------- */
  var pre = D.getElementById('pre'), nEl = D.getElementById('pre-n');
  function closePre() { R.classList.remove('is-loading'); if (pre) { pre.classList.add('is-out'); setTimeout(function () { pre.remove(); }, 1100); } }
  if (pre && !reduce) {
    var t0 = performance.now(), loaded = D.readyState === 'complete', done = false;
    addEventListener('load', function () { loaded = true; });
    (function tick(t) {
      var p = clamp((t - t0) / 1900, 0, 1), v = p < 1 ? p * p * (3 - 2 * p) : (loaded ? 1 : .99);
      nEl.textContent = ('00' + Math.round(v * 100)).slice(-3);
      if (v >= 1 && !done) { done = true; setTimeout(closePre, 250); return; }
      requestAnimationFrame(tick);
    })(t0);
    setTimeout(closePre, 7000);
  } else if (pre) { R.classList.remove('is-loading'); pre.remove(); }

  /* ---------- scroll-driven bits ---------- */
  var nav = D.getElementById('nav'), cine = $('.cine')[0], lastY = scrollY, tk = false;
  var huge = $('.phil .huge')[0], mq = $('.marq__track')[0], mqx = 0, vel = 0;
  function onScroll() {
    var y = scrollY, vh = innerHeight;
    var past = cine && y > cine.offsetHeight - vh * .6;
    var menuOpen = nav.classList.contains('is-open-menu');
    nav.classList.toggle('is-hidden', past && y > lastY + 2 && !menuOpen);
    if (y < lastY - 2) nav.classList.remove('is-hidden');
    vel = y - lastY; lastY = y;
    if (fill) {
      var r = fill.getBoundingClientRect(), p = clamp((vh * .78 - r.top) / (r.height + vh * .2), 0, 1), n = fillWords.length;
      fillWords.forEach(function (w, i) { w.style.opacity = (.16 + .84 * clamp(p * (n + 3) - i, 0, 1)).toFixed(3); });
    }
    if (huge && !reduce) {
      var hr = huge.parentElement.getBoundingClientRect(), hp = clamp((vh - hr.top) / (vh + hr.height), 0, 1);
      huge.style.transform = 'translateX(' + ((hp - .5) * -9).toFixed(2) + 'vw)';
    }
    tk = false;
  }
  addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* marquee: drifts on its own, speeds up with scroll velocity */
  if (mq && !reduce) (function loop() {
    var half = mq.scrollWidth / 2;
    mqx -= .7 + Math.min(Math.abs(vel), 60) * .12; vel *= .92;
    if (-mqx >= half) mqx += half;
    mq.style.transform = 'translateX(' + mqx + 'px)';
    requestAnimationFrame(loop);
  })();

  /* ---------- cursor dot ---------- */
  if (fine && !reduce) {
    var c = D.createElement('div'); c.className = 'cur'; c.setAttribute('aria-hidden', 'true'); D.body.appendChild(c);
    var cx = 0, cy = 0;
    (function loop() { cx += (mouse.x - cx) * .22; cy += (mouse.y - cy) * .22; c.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; requestAnimationFrame(loop); })();
    D.addEventListener('pointerover', function (e) { c.classList.add('is-on'); c.classList.toggle('is-hot', !!e.target.closest('a, button')); });
    R.addEventListener('pointerleave', function () { c.classList.remove('is-on'); });
  }

  /* ---------- solutions: product preview follows the pointer ---------- */
  var list = D.getElementById('sol-list');
  if (list && fine && !reduce && matchMedia('(min-width: 62.01rem)').matches) {
    R.classList.add('has-float');
    var fl = D.createElement('div'); fl.className = 'float'; fl.setAttribute('aria-hidden', 'true'); fl.innerHTML = '<img alt="">'; D.body.appendChild(fl);
    var fi = fl.firstChild, fx = 0, fy = 0, rot = 0;
    $('.sol__item', list).forEach(function (it) {
      var src = it.querySelector('.sol__thumb').getAttribute('src');
      it.addEventListener('mouseenter', function () { fi.src = src; fl.classList.add('is-on'); });
      it.addEventListener('mouseleave', function () { fl.classList.remove('is-on'); });
    });
    (function loop() {
      var tx = mouse.x + 40, ty = mouse.y - fl.offsetHeight / 2;
      var dx = tx - fx; fx += dx * .12; fy += (ty - fy) * .12; rot += (clamp(dx * .06, -9, 9) - rot) * .15;
      fl.style.transform = 'translate(' + fx + 'px,' + fy + 'px) rotate(' + rot.toFixed(2) + 'deg)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- hotspot labels ---------- */
  var names = $('.legend li').map(function (li) { return li.textContent; });
  $('.mk').forEach(function (m, i) {
    m.tabIndex = 0; m.setAttribute('role', 'img'); m.setAttribute('aria-label', (i + 1) + ': ' + (names[i] || ''));
    var t = D.createElement('span'); t.className = 'mk__tip'; t.setAttribute('aria-hidden', 'true'); t.textContent = names[i] || ''; m.appendChild(t);
  });

  /* ---------- subtle magnetic buttons ---------- */
  if (fine && !reduce) $('.btn').forEach(function (b) {
    b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .15) + 'px,' + ((e.clientY - r.top - r.height / 2) * .25) + 'px)'; });
    b.addEventListener('pointerleave', function () { b.style.transform = ''; });
  });
})();
