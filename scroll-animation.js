/* =========================================================
   scroll-animation.js — 112-frame scroll-scrubbed canvas sequence.

   How the start-position bug is avoided:
   - .cine is the first element in <main>; its top is 0.
   - A single CSS `position: sticky` stage replaces JS pinning, so there
     is no pin-spacer, no duplicate pin and no start offset to mis-measure.
   - Progress is read from cine.getBoundingClientRect() on every frame,
     so there is no cached measurement that can go stale after load,
     resize or font swap.
   - progress 0..ANIM_END maps to frame 1..112. The remaining tail holds
     frame 112 while the stage fades to forest green, so the hand-off
     to the next section is seamless.
   No dependencies. Classic script (works from file:// as well as http://).
   ========================================================= */
(function () {
  'use strict';

  var CFG = {
    count: 112,
    path: 'assets/frames/ezgif-frame-',
    ext: '.jpg',
    pad: 3,
    animEnd: 0.92,           // share of the scroll range used by the 112 frames
    focusX: 0.47,            // horizontal centre of the product inside each frame
    beatStarts: [1, 17, 53, 81] // first frame of each stage / caption
  };

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var cine, stage, canvas, ctx, veil, copy, cue, railFill, railFrame, railBtns, beats, loaderEl, loaderBar, errEl;
  var frames = [], loaded = 0, started = false;
  var W = 0, H = 0, dpr = 1, imgW = 1280, imgH = 720, bg = '#184E3A';
  var cur = -1, curBeat = -1, lastP = -1, ticking = false, destroyed = false, ro = null;
  var geom = null;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pad(n) { var s = String(n); while (s.length < CFG.pad) s = '0' + s; return s; }
  function src(i) { return CFG.path + pad(i + 1) + CFG.ext; }

  /* ---------- loading ---------- */
  function loadFrame(i) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () {
        var done = function () { frames[i] = im; loaded++; progressUI(); resolve(im); };
        if (im.decode) { im.decode().then(done, done); } else { done(); }
      };
      im.onerror = function () { progressUI(); resolve(null); };
      im.src = src(i);
    });
  }

  function progressUI() {
    if (loaderBar) loaderBar.style.width = Math.round((loaded / CFG.count) * 100) + '%';
    if (loaded >= CFG.count && loaderEl) {
      loaderEl.classList.add('is-done');
    }
  }

  function loadAll() {
    // Frame 1 first, painted immediately; the rest stream in with limited concurrency.
    return loadFrame(0).then(function (first) {
      if (!first) { if (errEl) errEl.hidden = false; return; }
      imgW = first.naturalWidth || imgW; imgH = first.naturalHeight || imgH;
      layout();
      update(true);
      var next = 1, workers = 6;
      function run() {
        if (destroyed || next >= CFG.count) return Promise.resolve();
        var i = next++;
        return loadFrame(i).then(function () { dirty = true; schedule(); return run(); });
      }
      var pool = [];
      for (var w = 0; w < workers; w++) pool.push(run());
      return Promise.all(pool).then(function () {
        if (loaderEl) loaderEl.classList.add('is-done');
        update(true);
      });
    });
  }

  /* ---------- geometry + drawing ---------- */
  var dirty = true;

  function layout() {
    W = stage.clientWidth; H = stage.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    var portrait = H / W > 1.05;
    // Portrait: footage lives in the top 60%, copy sits on solid green beneath.
    var box = portrait ? { w: W, h: Math.round(H * 0.6) } : { w: W, h: H };
    var scale = Math.max(box.w / imgW, box.h / imgH) * (portrait ? 1 : 1.12); // cover, never stretched
    var dw = imgW * scale, dh = imgH * scale;
    var targetX = box.w * (portrait ? 0.5 : 0.62);
    var dx = clamp(targetX - CFG.focusX * dw, box.w - dw, 0);
    var dy = (box.h - dh) / 2;
    geom = { box: box, dx: dx, dy: dy, dw: dw, dh: dh };
    dirty = true;
  }

  function nearest(idx) {
    if (frames[idx]) return frames[idx];
    for (var d = 1; d < CFG.count; d++) {
      if (idx - d >= 0 && frames[idx - d]) return frames[idx - d];
      if (idx + d < CFG.count && frames[idx + d]) return frames[idx + d];
    }
    return null;
  }

  function draw(idx) {
    if (!geom) return;
    var im = nearest(idx);
    if (!im) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, geom.box.w, geom.box.h); ctx.clip();
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(im, geom.dx, geom.dy, geom.dw, geom.dh);
    ctx.restore();
  }

  /* ---------- scroll → state ---------- */
  function range() { return Math.max(1, cine.offsetHeight - stage.clientHeight); }
  function progress() {
    var top = cine.getBoundingClientRect().top;
    return clamp(-top / range(), 0, 1);
  }
  function beatFor(frameNo) {
    var b = 0, s = CFG.beatStarts;
    for (var i = 0; i < s.length; i++) if (frameNo >= s[i]) b = i;
    return b;
  }

  function update(force) {
    ticking = false;
    if (destroyed) return;
    var p = progress();
    var a = clamp(p / CFG.animEnd, 0, 1);
    var idx = Math.round(a * (CFG.count - 1));

    if (idx !== cur || dirty || force) { draw(idx); cur = idx; dirty = false; }

    if (p !== lastP || force) {
      lastP = p;
      var frameNo = idx + 1;
      if (railFrame) railFrame.textContent = pad(frameNo);
      if (railFill) railFill.style.transform = 'scaleY(' + a.toFixed(4) + ')';
      var b = beatFor(frameNo);
      if (b !== curBeat) setBeat(b);

      var v = clamp((p - CFG.animEnd) / (1 - CFG.animEnd), 0, 1);   // hand-off tail
      veil.style.opacity = v.toFixed(3);
      copy.style.opacity = (1 - clamp(v * 1.6, 0, 1)).toFixed(3);
      if (cue) cue.classList.toggle('is-hidden', p > 0.01);

      document.dispatchEvent(new CustomEvent('sequence:progress', { detail: { p: p, frame: frameNo } }));
    }
  }

  function setBeat(b) {
    curBeat = b;
    for (var i = 0; i < beats.length; i++) beats[i].classList.toggle('is-active', i === b);
    for (var j = 0; j < railBtns.length; j++) {
      if (j === b) railBtns[j].setAttribute('aria-current', 'true'); else railBtns[j].removeAttribute('aria-current');
    }
  }

  function schedule() {
    if (!ticking && !destroyed) { ticking = true; requestAnimationFrame(function () { update(false); }); }
  }

  /* ---------- public: jump to a frame ---------- */
  function jumpToFrame(n) {
    var f = clamp(n, 1, CFG.count);
    var a = (f - 1) / (CFG.count - 1);
    var docTop = cine.getBoundingClientRect().top + window.pageYOffset;
    var y = docTop + a * CFG.animEnd * range();   // maps back to exactly frame f
    window.scrollTo({ top: Math.round(y), behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  /* ---------- lifecycle ---------- */
  function onResize() { layout(); schedule(); }

  function init() {
    cine = document.getElementById('top');
    if (!cine) return;
    stage = cine.querySelector('.cine__stage');
    canvas = document.getElementById('seq');
    ctx = canvas.getContext('2d', { alpha: false });
    veil = document.getElementById('veil');
    copy = document.getElementById('beats');
    cue = document.getElementById('cue');
    railFill = document.getElementById('rail-fill');
    railFrame = document.getElementById('rail-frame');
    railBtns = Array.prototype.slice.call(cine.querySelectorAll('.rail__stages button'));
    beats = Array.prototype.slice.call(cine.querySelectorAll('.beat'));
    loaderEl = document.getElementById('loader');
    loaderBar = document.getElementById('loader-bar');
    errEl = document.getElementById('seq-error');
    var cssBg = getComputedStyle(document.documentElement).getPropertyValue('--brand-forest-green').trim();
    if (cssBg) bg = cssBg;

    layout();
    setBeat(0);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    window.addEventListener('pageshow', function () { update(true); });
    if (window.ResizeObserver) { ro = new ResizeObserver(onResize); ro.observe(stage); }
    window.addEventListener('pagehide', destroy);

    railBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { jumpToFrame(parseInt(btn.getAttribute('data-frame'), 10)); });
    });

    loadAll().then(function () { started = true; });
  }

  function destroy() {
    destroyed = true;
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
    if (ro) ro.disconnect();
  }

  window.Sequence = {
    jumpToFrame: jumpToFrame,
    destroy: destroy,
    get frame() { return cur + 1; },
    get loaded() { return loaded; },
    config: CFG
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
