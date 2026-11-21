/* Warta Supermarkt — ontwerpvoorstel ITty Company */
(function () {
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var html = document.documentElement, body = document.body;
  var vh = innerHeight, vw = innerWidth, mob = vw < 900;
  function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- split headings into words ---------- */
  function split(h) {
    var i = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            var w = document.createElement('span'); w.className = 'w';
            var s = document.createElement('span'); s.textContent = t; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains('tbc')) walk(n);
      });
    })(h);
  }

  /* ---------- language NL / PL ---------- */
  var orig = new Map(), lang = 'nl';
  var docTitle = document.querySelector('title'), metaD = document.querySelector('meta[name=description]');
  function setLang(l, anim) {
    lang = l; html.lang = l;
    $$('[data-pl]').forEach(function (el) {
      if (!orig.has(el)) orig.set(el, el.tagName === 'TITLE' ? el.textContent : el.tagName === 'META' ? el.content : el.innerHTML);
      var v = l === 'pl' ? el.getAttribute('data-pl') : orig.get(el);
      if (el.tagName === 'TITLE') { document.title = v; return; }
      if (el.tagName === 'META') { el.content = v; return; }
      if (orig.get(el) === v && !anim && el.dataset.done) return;
      el.innerHTML = v; el.dataset.done = 1;
      if (el.classList.contains('split')) { split(el); if (el.dataset.shown) el.classList.add('in'); }
    });
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.l === l)); });
    store('warta-lang', l);
  }
  var saved = store('warta-lang');
  if (saved === 'pl') setLang('pl'); else $$('.split').forEach(split);
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.l !== lang) setLang(b.dataset.l, true); }); });

  /* ---------- Lenis ---------- */
  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var el = document.querySelector(id); if (!el) return;
      e.preventDefault(); closeMenu();
      var off = el.classList.contains('ch') ? el.offsetHeight / 2 - innerHeight / 2 : 0;
      if (lenis) lenis.scrollTo(el, { offset: off, duration: 1.6 });
      else scrollTo(0, el.getBoundingClientRect().top + scrollY + off);
    });
  });

  /* ---------- page curtain ---------- */
  var cur = document.getElementById('curtain'), main = document.querySelector('main');
  var order = { 'index.html': 0, 'assortiment.html': 1, 'over-ons.html': 2, 'contact.html': 3, '404.html': 0 };
  var titles = { 'index.html': ['home.', 'start.'], 'assortiment.html': ['assortiment.', 'asortyment.'], 'over-ons.html': ['over ons.', 'o nas.'], 'contact.html': ['contact.', 'kontakt.'], '404.html': ['oeps.', 'ups.'] };
  var here = (location.pathname.split('/').pop() || 'index.html');
  if (!(here in order)) here = 'index.html';
  function tName(p) { var t = titles[p] || titles['index.html']; return t[lang === 'pl' ? 1 : 0]; }
  if (cur) {
    var mark = cur.querySelector('b');
    mark.textContent = tName(here);
    var arriveDir = '';
    try { arriveDir = sessionStorage.getItem('warta-dir') || ''; sessionStorage.removeItem('warta-dir'); } catch (e) {}
    if (reduced) cur.classList.remove('cover');
    else requestAnimationFrame(function () { requestAnimationFrame(function () {
      cur.classList.add('anim'); cur.classList.remove('cover'); cur.classList.add(arriveDir === 'back' ? 'down' : 'up');
    }); });
    $$('a[href$=".html"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
        var href = a.getAttribute('href'), to = href.split('/').pop();
        e.preventDefault(); closeMenu();
        if (reduced) { location.href = href; return; }
        var back = (order[to] || 0) < order[here];
        try { sessionStorage.setItem('warta-dir', back ? 'back' : 'fwd'); } catch (err) {}
        mark.textContent = tName(to);
        cur.classList.remove('anim', 'up', 'down', 'cover'); cur.classList.add(back ? 'up' : 'down');
        void cur.offsetWidth;
        cur.classList.add('anim'); cur.classList.remove('up', 'down'); cur.classList.add('cover');
        if (main) main.classList.add('leave');
        setTimeout(function () { location.href = href; }, 820);
      });
    });
    addEventListener('pageshow', function (e) {
      if (e.persisted) { cur.classList.remove('cover'); cur.classList.add('up'); if (main) main.classList.remove('leave'); }
    });
  }

  /* ---------- nav + mobile menu ---------- */
  var nav = document.getElementById('nav'), burger = document.querySelector('.burger'), mm = document.getElementById('mmenu');
  function closeMenu() {
    if (!mm || !mm.classList.contains('open')) return;
    mm.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.textContent = lang === 'pl' ? 'menu' : 'menu';
    if (lenis) lenis.start(); body.style.overflow = '';
  }
  if (burger) burger.addEventListener('click', function () {
    var open = !mm.classList.contains('open');
    if (!open) return closeMenu();
    mm.classList.add('open'); burger.setAttribute('aria-expanded', 'true'); burger.textContent = lang === 'pl' ? 'zamknij' : 'sluiten';
    if (lenis) lenis.stop(); body.style.overflow = 'hidden';
  });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  var badge = document.querySelector('.badge');
  if (badge) badge.addEventListener('click', function () { badge.classList.toggle('open'); });

  /* ---------- reveals ---------- */
  var rev = $$('.reveal, .split, [data-in]');
  function reveals() {
    var h = innerHeight;
    rev = rev.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < h * 0.95 && r.bottom > -50) { el.classList.add('in'); el.dataset.shown = 1; return false; }
      return true;
    });
  }

  /* ---------- particles ---------- */
  function FX(cv) {
    var ctx = cv.getContext('2d'), kind = cv.dataset.fx, P = [], W = 0, H = 0, vis = false, dpr = Math.min(devicePixelRatio || 1, mob ? 1.5 : 2), t = 0;
    function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function spawn(init) {
      var red = Math.random() < 0.1;
      if (kind === 'sparks') return { x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: .8 + Math.random() * 2.2, vy: -(.25 + Math.random() * .7), vx: -.2 + Math.random() * .4, ph: Math.random() * 6.28, red: red, life: 1 };
      return { x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: .5 + Math.random() * 1.8, vy: -(.08 + Math.random() * .3), vx: -.12 + Math.random() * .24, ph: Math.random() * 6.28, red: red, life: 1 };
    }
    size();
    var n = Math.round(W * H / (kind === 'sparks' ? 16000 : 13000)); if (mob) n = Math.round(n * .7);
    for (var i = 0; i < n; i++) P.push(spawn(true));
    addEventListener('resize', size);
    new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(cv);
    var B = [];
    function burst(fx, fy, count, up, spread) {
      if (reduced) return;
      for (var j = 0; j < count; j++) {
        var a = (up ? -Math.PI / 2 : 0) + (Math.random() - .5) * (spread || Math.PI * 2), sp = .6 + Math.random() * 2.4;
        B.push({ x: fx * W + (Math.random() - .5) * W * .12, y: fy * H + (Math.random() - .5) * H * .06, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: .6 + Math.random() * 2, red: Math.random() < .12, life: 1, dec: .006 + Math.random() * .01 });
      }
    }
    (function frame() {
      requestAnimationFrame(frame); if (!vis || reduced) return; t += .016;
      ctx.clearRect(0, 0, W, H);
      ctx.shadowBlur = 8;
      P.forEach(function (p, k) {
        p.y += p.vy; p.x += p.vx + Math.sin(t * .8 + p.ph) * .18;
        if (p.y < -10) P[k] = spawn(false);
        var al = (kind === 'sparks' ? .45 : .3) + .35 * Math.sin(t * 2 + p.ph);
        var c = p.red ? '255,90,74,' : '247,240,223,';
        ctx.fillStyle = 'rgba(' + c + al.toFixed(2) + ')'; ctx.shadowColor = 'rgba(' + c + '.9)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
      });
      for (var k = B.length - 1; k >= 0; k--) {
        var b = B[k]; b.x += b.vx; b.y += b.vy; b.vx *= .985; b.vy = b.vy * .985 - .004; b.life -= b.dec;
        if (b.life <= 0) { B.splice(k, 1); continue; }
        var c2 = b.red ? '255,90,74,' : '247,240,223,';
        ctx.fillStyle = 'rgba(' + c2 + (b.life * .8).toFixed(2) + ')'; ctx.shadowColor = 'rgba(' + c2 + '.9)';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.28); ctx.fill();
      }
    })();
    return { burst: burst };
  }
  var fxs = new Map();
  $$('canvas.fx').forEach(function (c) { fxs.set(c, FX(c)); });

  /* ---------- STORY (home) ---------- */
  var storyFrame = function () {};
  var story = document.querySelector('.story');
  if (story) (function () {
    var stage = story.querySelector('.stage'), frames = $$('.frames img', stage), bgs = $$('.bgs img', stage), halo = stage.querySelector('.halo');
    var chs = $$('.ch[data-step]', story), endCh = story.querySelector('.ch--end');
    var word = document.getElementById('bigword'), cnt = stage.querySelector('.counter b'), dots = $$('.sdots a', stage);
    var capEl = stage.querySelector('.cap--on'), fx = fxs.get(stage.querySelector('canvas.fx'));
    var masks = { 1: ['up'], 2: ['diag'], 3: ['drop', '62% 48%'], 4: ['drop', '72% 44%'], 5: ['wedge'], 6: ['diagr'], 7: ['drop', '64% 55%'] };
    function mask(type, at, p) {
      if (type === 'drop') { var R = p * 118 - 16; return 'radial-gradient(circle at ' + at + ',#000 ' + R.toFixed(1) + '%,transparent ' + (R + 16).toFixed(1) + '%)'; }
      var A = p * 135 - 35, Bp = A + 35, dir = { up: 'to top', diag: '135deg', diagr: '315deg', wedge: 'to left' }[type];
      return 'linear-gradient(' + dir + ',#000 ' + A.toFixed(1) + '%,transparent ' + Bp.toFixed(1) + '%)';
    }
    var lastStep = -1, lastP = [], mx = 0, my = 0;
    addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; stage.style.setProperty('--mx', (mx * -24).toFixed(1) + 'px'); stage.style.setProperty('--my', (my * -16).toFixed(1) + 'px'); }, { passive: true });
    storyFrame = function () {
      var h = innerHeight, sr = story.getBoundingClientRect();
      if (sr.bottom < 0 || sr.top > h) return;
      var p = [0];
      chs.forEach(function (c) {
        var s = +c.dataset.step; if (!s) return;
        var r = c.getBoundingClientRect();
        p[s] = cl((h * 0.9 - r.top) / (h * 0.65));
      });
      var heroOut = cl(-sr.top / (h * 0.8));
      /* frames: masked cross-transitions */
      frames.forEach(function (im, i) {
        if (!i) return;
        var v = p[i] || 0; if (lastP[i] === v) return; lastP[i] = v;
        if (v <= 0) { im.style.visibility = 'hidden'; return; }
        im.style.visibility = 'visible';
        var m = v >= 1 ? 'none' : mask(masks[i][0], masks[i][1], v);
        im.style.webkitMaskImage = m; im.style.maskImage = m;
        if (i === 3) im.style.transform = 'translateY(' + (-(1 - v) * 26).toFixed(1) + 'px)';
        if (i === 7) im.style.transform = 'scale(' + (1.14 - .14 * v).toFixed(4) + ')';
      });
      var sc = 1 + .12 * heroOut * (1 - (p[1] || 0)) + .05 * (p[6] || 0) * (1 - (p[7] || 0));
      stage.querySelector('.frames').style.transform = 'translateX(var(--fx)) scale(calc(var(--fs) * ' + sc.toFixed(4) + '))';
      /* backgrounds: round wave from the basket */
      var at = mob ? '50% 55%' : '64% 55%';
      for (var k = 1; k < bgs.length; k++) bgs[k].style.clipPath = 'circle(' + ((p[k] || 0) * 150).toFixed(1) + '% at ' + at + ')';
      halo.style.opacity = ((p[6] || 0) * .8).toFixed(3);
      var P = cl(-sr.top / (story.offsetHeight - h));
      bgs.forEach(function (b, k) { b.style.setProperty('--kb', (1 + .07 * cl((p[k + 1] === undefined ? P : (p[k + 1] || 0)))).toFixed(4)); });
      /* hero text dissolves */
      var hero = story.querySelector('.ch--hero');
      hero.style.opacity = (1 - cl(heroOut * 1.4)).toFixed(3);
      /* end: fade to ink */
      var er = endCh.getBoundingClientRect();
      stage.style.setProperty('--fo', cl(1 - (er.bottom - h) / er.height).toFixed(3));
      /* step counters */
      var step = 0; for (var s = 1; s < p.length; s++) if (p[s] > .5) step = s;
      if (step !== lastStep) {
        var prev = lastStep; lastStep = step;
        var c = chs.filter(function (x) { return +x.dataset.step === step; })[0];
        cnt.textContent = step + 1;
        dots.forEach(function (d, n) { d.classList.toggle('on', n === step); });
        if (capEl) capEl.textContent = c.dataset.cap === 'short' ? (lang === 'pl' ? 'Zdjęcie poglądowe' : 'Sfeerbeeld') : (lang === 'pl' ? 'Zdjęcie poglądowe — nie przedstawia aktualnego asortymentu.' : 'Sfeerbeeld — geen weergave van het actuele assortiment.');
        if (word && prev !== -1) {
          word.classList.add('swap');
          setTimeout(function () { word.textContent = c.dataset.word; word.classList.remove('swap'); }, 380);
        }
        if (fx && prev !== -1 && step > prev) {
          var bx = mob ? .5 : .64, by = mob ? .55 : .52;
          if (step === 1) fx.burst(bx, by, 90, true, 1.4);
          else if (step === 3) fx.burst(bx - .02, by - .02, 70, true, 2.6);
          else fx.burst(bx, by - .05, 26, true, 2);
        }
      }
    };
  })();

  /* ---------- tabs indicator (hero) ---------- */
  var tbar = document.getElementById('tabbar'), ti = 0;
  if (tbar && !reduced) setInterval(function () { ti = (ti + 1) % 4; tbar.style.transform = 'translateX(' + ti * 100 + '%)'; }, 2600);

  /* ---------- lees meer (mobile) ---------- */
  $$('.more').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = b.closest('.panel'), o = p.classList.toggle('open');
      b.textContent = o ? (lang === 'pl' ? 'mniej' : 'minder') : (lang === 'pl' ? 'czytaj dalej' : 'lees meer');
      if (lenis) lenis.resize();
    });
  });

  /* ---------- flip words + chapter-2 language teaser ---------- */
  $$('.flip, .wcard').forEach(function (f) { f.addEventListener('click', function () { var o = f.classList.toggle('on'); f.setAttribute('aria-pressed', String(o)); }); });
  $$('[data-swap]').forEach(function (b) {
    var h = document.getElementById(b.dataset.swap), alt = h.dataset.alt, nl = h.textContent, on = false;
    b.addEventListener('click', function () {
      on = !on; var showPL = lang === 'pl' ? !on : on, txt = showPL ? alt : nl; h.innerHTML = '';
      txt.split('').forEach(function (ch, i) { var s = document.createElement('span'); s.className = 'l'; s.style.setProperty('--i', i); s.textContent = ch === ' ' ? '\u00a0' : ch; h.appendChild(s); });
      h.classList.add('letters'); b.querySelector('b').textContent = showPL ? 'PL' : 'NL';
    });
  });

  /* ---------- cursor glow on cards ---------- */
  $$('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); c.style.setProperty('--cx', e.clientX - r.left + 'px'); c.style.setProperty('--cy', e.clientY - r.top + 'px'); });
  });

  /* ---------- scroll parallax on photo backgrounds ---------- */
  var pars = $$('[data-par]');
  function parallax() {
    pars.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var d = (r.top + r.height / 2 - innerHeight / 2) * -parseFloat(el.dataset.par);
      el.style.translate = '0 ' + d.toFixed(1) + 'px';
    });
  }

  /* ---------- assortiment: pinned ribbon ---------- */
  var ribbon = document.querySelector('.ribbon'), ribbonFrame = function () {};
  if (ribbon) (function () {
    var track = ribbon.querySelector('.ribbon__track'), slides = $$('.gslide', ribbon), last = -1;
    ribbonFrame = function () {
      if (innerWidth < 900) { slides.forEach(function (s) { s.classList.add('on'); }); return; }
      var r = ribbon.getBoundingClientRect(), span = ribbon.offsetHeight - innerHeight;
      var rp = cl(-r.top / span), max = track.scrollWidth - innerWidth;
      track.style.transform = 'translate3d(' + (-rp * max).toFixed(1) + 'px,0,0)';
      ribbon.style.setProperty('--rp', rp.toFixed(3));
      var i = Math.round(rp * (slides.length - 1));
      if (i !== last) { last = i; slides.forEach(function (s, n) { s.classList.toggle('on', n === i); }); }
    };
  })();

  /* ---------- assortiment: shopping list ---------- */
  var lista = document.getElementById('lista');
  if (lista) (function () {
    var btns = $$('.gbtn', lista), ol = lista.querySelector('ol'), empty = lista.querySelector('.empty'), cntEl = lista.querySelector('.cnt'), items = lista.querySelector('#items'), sel = [];
    var toast = document.querySelector('.toast');
    function name(b) { return lang === 'pl' ? b.dataset.plname : b.dataset.nl; }
    function render() {
      ol.innerHTML = ''; items.innerHTML = '';
      sel.forEach(function (b, i) {
        var li = document.createElement('li'); li.textContent = name(b); ol.appendChild(li);
        var g = document.createElement('span'); g.className = 'item' + (b._new ? ' drop' : '');
        g.style.left = [44, 60, 76, 52, 68, 36][i] + '%'; g.style.top = [44, 40, 46, 30, 28, 34][i] + '%';
        g.textContent = b.dataset.short; items.appendChild(g); b._new = false;
      });
      empty.hidden = sel.length > 0; ol.hidden = !sel.length;
      cntEl.textContent = sel.length + (lang === 'pl' ? ' w koszyku' : ' in je mand');
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var i = sel.indexOf(b);
        if (i > -1) { sel.splice(i, 1); b.setAttribute('aria-pressed', 'false'); }
        else { sel.push(b); b._new = true; b.setAttribute('aria-pressed', 'true'); }
        render();
      });
    });
    function text() {
      return (lang === 'pl' ? 'Moja lista zakupów — Warta Supermarkt, Stationsstraat 126, Waalwijk' : 'Mijn boodschappenlijst — Warta Supermarkt, Stationsstraat 126, Waalwijk') + '\n' + sel.map(function (b) { return '- ' + name(b); }).join('\n') + '\nTel. 0416 203 437';
    }
    function say(t) { toast.textContent = t; toast.classList.add('on'); setTimeout(function () { toast.classList.remove('on'); }, 2200); }
    lista.querySelector('[data-act=copy]').addEventListener('click', function () {
      var t = text();
      function fb() { var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); say(lang === 'pl' ? 'Lista skopiowana.' : 'Lijst gekopieerd.'); }
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { say(lang === 'pl' ? 'Lista skopiowana.' : 'Lijst gekopieerd.'); }, fb); else fb();
    });
    lista.querySelector('[data-act=print]').addEventListener('click', function () {
      var pl = document.getElementById('printlist'); pl.textContent = ''; text().split('\n').forEach(function (l) { var d = document.createElement('div'); d.textContent = l; pl.appendChild(d); });
      print();
    });
    lista.querySelector('[data-act=reset]').addEventListener('click', function () { sel = []; btns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); render(); });
    render();
  })();

  /* ---------- over ons: painted words + route line ---------- */
  var paints = $$('.paint');
  function paint() {
    paints.forEach(function (el) {
      var r = el.getBoundingClientRect(), ws = el.querySelectorAll('.w');
      var p = cl((innerHeight * .85 - r.top) / (innerHeight * .5)), n = Math.ceil(p * ws.length);
      for (var i = 0; i < ws.length; i++) ws[i].classList.toggle('lit', i < n);
    });
  }
  var route = document.querySelector('.route'), routeFrame = function () {};
  if (route) (function () {
    var svg = route.querySelector('svg'), bgp = svg.querySelector('.bgp'), fgp = svg.querySelector('.fgp'), dot = svg.querySelector('circle'), arts = $$('article', route), len = 0;
    function build() {
      var w = route.clientWidth, h = route.clientHeight, d;
      if (innerWidth < 900) { svg.setAttribute('viewBox', '0 0 40 ' + h); d = 'M20 10 C 2 ' + h * .3 + ', 38 ' + h * .6 + ', 20 ' + (h - 10); }
      else { svg.setAttribute('viewBox', '0 0 ' + w + ' 150'); d = 'M16 110 C ' + w * .18 + ' 10, ' + w * .3 + ' 140, ' + w * .5 + ' 70 S ' + w * .82 + ' 20, ' + (w - 16) + ' 92'; }
      bgp.setAttribute('d', d); fgp.setAttribute('d', d); len = fgp.getTotalLength(); fgp.style.strokeDasharray = len;
    }
    build(); addEventListener('resize', build);
    routeFrame = function () {
      var r = route.getBoundingClientRect(), p = cl((innerHeight * .8 - r.top) / (r.height * .9));
      fgp.style.strokeDashoffset = (len * (1 - p)).toFixed(1);
      var pt = fgp.getPointAtLength(len * p); dot.setAttribute('cx', pt.x.toFixed(1)); dot.setAttribute('cy', pt.y.toFixed(1));
      arts.forEach(function (a, i) { a.classList.toggle('on', p >= i / 3 + .05); });
    };
  })();

  /* ---------- main tick ---------- */
  function tick() {
    if (nav) nav.classList.toggle('solid', scrollY > 40);
    reveals(); storyFrame(); parallax(); ribbonFrame(); paint(); routeFrame();
  }
  addEventListener('resize', function () { vh = innerHeight; vw = innerWidth; mob = vw < 900; tick(); });
  if (lenis) lenis.on('scroll', tick);
  addEventListener('scroll', tick, { passive: true });
  tick(); setTimeout(tick, 300);
})();
