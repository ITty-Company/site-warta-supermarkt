/* Warta — demo webshop: mandje (localStorage), filters, afrekenen (demo iDEAL). */
(function () {
  var KEY = 'warta-cart', DELIVERY = 3.95;
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  var cart = load();
  var pl = function () { return document.documentElement.lang === 'pl'; };
  function eur(v) { return '€ ' + v.toFixed(2).replace('.', ','); }
  function count() { return Object.keys(cart).reduce(function (s, k) { return s + cart[k].q; }, 0); }
  function badge() {
    document.querySelectorAll('.cart-count').forEach(function (b) {
      var n = count(); b.textContent = n; b.parentNode.classList.toggle('has', n > 0);
    });
  }
  badge();
  var grid = document.querySelector('.pgrid');
  if (!grid) return;

  var toast = document.querySelector('.toast');
  function say(t) { if (!toast) return; toast.textContent = t; toast.classList.add('on'); clearTimeout(say.t); say.t = setTimeout(function () { toast.classList.remove('on'); }, 2200); }

  /* filters */
  var tabs = document.querySelectorAll('.ftab');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.classList.toggle('on', x === t); });
      var c = t.dataset.cat;
      grid.querySelectorAll('.pcard').forEach(function (p) {
        var show = c === 'alles' || p.dataset.cat === c;
        p.hidden = !show; if (show) p.classList.add('in');
      });
    });
  });

  /* qty + add */
  grid.querySelectorAll('.pcard').forEach(function (p) {
    var out = p.querySelector('output'), q = 1;
    p.querySelector('.q-').addEventListener('click', function () { q = Math.max(1, q - 1); out.textContent = q; });
    p.querySelector('.q\\+').addEventListener('click', function () { q = Math.min(20, q + 1); out.textContent = q; });
    p.querySelector('.add').addEventListener('click', function (e) {
      var id = p.dataset.id, name = p.querySelector('h3').textContent;
      cart[id] = cart[id] || { q: 0, price: +p.dataset.price, name: name, img: p.querySelector('img').getAttribute('src') };
      cart[id].q += q; cart[id].name = name; save(cart); fresh = id; render(); fresh = null; badge();
      q = 1; out.textContent = 1;
      fly(p.querySelector('img'), e);
      say((pl() ? 'Dodano: ' : 'Toegevoegd: ') + name);
    });
  });

  /* fly-to-cart animation */
  function fly(img, e) {
    var target = document.querySelector('.cart-btn'); if (!target || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var a = img.getBoundingClientRect(), b = target.getBoundingClientRect();
    var c = img.cloneNode(); c.className = 'flyer';
    c.style.cssText = 'left:' + a.left + 'px;top:' + a.top + 'px;width:' + a.width + 'px;height:' + a.height + 'px';
    document.body.appendChild(c);
    requestAnimationFrame(function () {
      c.style.transform = 'translate(' + (b.left + b.width / 2 - a.left - a.width / 2) + 'px,' + (b.top + b.height / 2 - a.top - a.height / 2) + 'px) scale(.08)';
      c.style.opacity = '.3';
    });
    setTimeout(function () { c.remove(); target.classList.add('pop'); setTimeout(function () { target.classList.remove('pop'); }, 400); }, 750);
  }

  /* cart list */
  var fresh = null, list = document.getElementById('cartList'), empty = document.getElementById('cartEmpty');
  var form = document.getElementById('checkout');
  function mode() { var r = form.querySelector('input[name=mode]:checked'); return r ? r.value : 'afhalen'; }
  function render() {
    list.innerHTML = '';
    var sub = 0;
    Object.keys(cart).forEach(function (id) {
      var it = cart[id]; sub += it.q * it.price;
      var li = document.createElement('li'); if (id === fresh) li.className = 'new';
      li.innerHTML = '<img src="' + it.img + '" alt=""><span class="n"></span><span class="qq"><button type="button" aria-label="Minder">−</button><b>' + it.q + '</b><button type="button" aria-label="Meer">+</button></span><span class="p">' + eur(it.q * it.price) + '</span>';
      li.querySelector('.n').textContent = it.name;
      var bs = li.querySelectorAll('button');
      bs[0].addEventListener('click', function () { it.q--; if (it.q <= 0) delete cart[id]; save(cart); render(); badge(); });
      bs[1].addEventListener('click', function () { it.q++; save(cart); render(); badge(); });
      list.appendChild(li);
    });
    var del = sub > 0 && mode() === 'bezorgen' ? DELIVERY : 0;
    empty.hidden = sub > 0;
    document.getElementById('tSub').textContent = eur(sub);
    document.getElementById('tDel').textContent = eur(del);
    document.getElementById('tTot').textContent = eur(sub + del);
    form.querySelector('.addr').hidden = mode() !== 'bezorgen';
    return sub + del;
  }
  form.addEventListener('change', render);
  render();

  /* checkout (demo) */
  var paid = document.getElementById('paid');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var total = render();
    if (!total) { say(pl() ? 'Koszyk jest pusty.' : 'Je mandje is nog leeg.'); return; }
    var bad = [].slice.call(form.querySelectorAll('[required]')).filter(function (i) { return !i.value.trim(); });
    if (mode() === 'bezorgen' && !form.adres.value.trim()) bad.push(form.adres);
    form.querySelectorAll('.fld').forEach(function (f) { f.classList.remove('err'); });
    if (bad.length) { bad.forEach(function (i) { i.closest('.fld').classList.add('err'); }); bad[0].focus(); say(pl() ? 'Uzupełnij zaznaczone pola.' : 'Vul de gemarkeerde velden in.'); return; }
    var btn = form.querySelector('.pay'); btn.classList.add('busy'); btn.disabled = true;
    setTimeout(function () {
      btn.classList.remove('busy'); btn.disabled = false;
      var when = form.moment.options[form.moment.selectedIndex].text.toLowerCase();
      document.getElementById('paidTxt').textContent = pl()
        ? 'Tak będzie wyglądać potwierdzenie. Zamówienie na ' + eur(total) + ' — ' + (mode() === 'bezorgen' ? 'dostawa ' : 'odbiór ') + when + '. W prawdziwym sklepie tutaj otworzy się płatność iDEAL.'
        : 'Zo ziet de bevestiging eruit. Bestelling van ' + eur(total) + ' — ' + (mode() === 'bezorgen' ? 'bezorgen ' : 'afhalen ') + when + '. In de echte webshop opent hier de iDEAL-betaling.';
      paid.hidden = false; paid.classList.add('in');
      paid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 1100);
  });
  document.getElementById('again').addEventListener('click', function () {
    cart = {}; save(cart); render(); badge(); form.reset(); render(); paid.hidden = true;
    document.getElementById('producten').scrollIntoView({ behavior: 'smooth' });
  });
})();
