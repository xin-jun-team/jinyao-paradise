/* 金耀天堂 站內搜尋（固定右上 + 導引泡泡 + 全站全文）— 由 jy_search.py 複製到 assets/js/search.js */
(function () {
  var cs = document.currentScript || document.querySelector('script[src*="search.js"]');
  var ROOT = cs ? cs.src.replace(/assets\/js\/search\.js.*$/, '') : '';
  var IDX = null, loading = false, pending = null;

  var css = document.createElement('style');
  css.textContent =
    '#jysrch{position:fixed;top:106px;right:14px;z-index:36;width:190px;font-family:"Noto Sans TC",sans-serif}' +
    '#jysrch .kin{width:100%;padding:9px 14px 9px 34px;border-radius:22px;border:1px solid rgba(227,172,44,.75);background:rgba(28,10,16,.96);color:#fcefd6;font-size:.88rem;outline:none;box-shadow:0 4px 16px rgba(0,0,0,.55);transition:width .2s,border-color .2s}' +
    '#jysrch .kin::placeholder{color:#c4ab82}#jysrch .kin:focus{border-color:#ffd35a;width:260px;margin-left:-70px}' +
    '#jysrch .kic{position:absolute;left:12px;top:9px;color:#ffd35a;font-size:.95rem;pointer-events:none}' +
    '#jysrch.hint .kin{animation:jyPulse 2.2s ease-in-out infinite}' +
    '@keyframes jyPulse{0%,100%{box-shadow:0 4px 16px rgba(0,0,0,.55),0 0 0 0 rgba(255,211,90,.55)}50%{box-shadow:0 4px 16px rgba(0,0,0,.55),0 0 0 9px rgba(255,211,90,0)}}' +
    /* 導引泡泡 */
    '#jysrch .ktip{position:absolute;right:100%;top:50%;transform:translateY(-50%);margin-right:16px;white-space:nowrap;padding:9px 30px 9px 14px;border-radius:10px;background:linear-gradient(180deg,#a3162f,#6a0f22);border:1px solid #ffd35a;color:#fff3c8;font-size:.84rem;font-weight:700;letter-spacing:.04em;box-shadow:0 10px 24px -8px rgba(0,0,0,.8);animation:jyNudgeX 1.6s ease-in-out infinite}' +
    '#jysrch .ktip b{color:#ffd35a;margin-right:4px}' +
    '#jysrch .ktip::after{content:"";position:absolute;left:100%;top:50%;margin-top:-7px;border:7px solid transparent;border-left:9px solid #ffd35a}' +
    '#jysrch .ktip button{position:absolute;right:6px;top:50%;transform:translateY(-50%);background:none;border:0;color:#f7e6b0;font-size:1rem;cursor:pointer;line-height:1;padding:2px 4px}' +
    '@keyframes jyNudgeX{0%,100%{transform:translate(0,-50%)}50%{transform:translate(-7px,-50%)}}' +
    /* 結果 */
    '#jysrch .kres{position:absolute;top:46px;right:0;width:340px;max-width:92vw;max-height:64vh;overflow-y:auto;background:#1a080d;border:1px solid rgba(227,172,44,.5);border-top:2px solid #e0334f;border-radius:10px;box-shadow:0 16px 38px -8px rgba(0,0,0,.9);display:none;padding:6px}' +
    '#jysrch .kres a{display:block;padding:10px 12px;color:#e6d2b0;border-radius:6px;text-decoration:none;line-height:1.5}' +
    '#jysrch .kres a:hover,#jysrch .kres a.on{background:rgba(163,22,47,.45)}' +
    '#jysrch .kres a b{display:block;color:#ffd35a;font-size:.92rem}' +
    '#jysrch .kres a span{display:block;font-size:.8rem;color:#c9b48e;margin-top:2px;word-break:break-all}' +
    '#jysrch .kres mark{background:rgba(255,211,90,.28);color:#fff3c8;border-radius:3px;padding:0 2px}' +
    '#jysrch .kcnt{padding:4px 12px 8px;font-size:.74rem;color:#b29a74;letter-spacing:.08em}' +
    '#jysrch .kno{padding:14px 12px;color:#b29a74;font-size:.86rem;text-align:center}' +
    '@media(max-width:1180px){#jysrch{top:auto;bottom:24px;right:78px;width:160px;z-index:39}' +
    '#jysrch .kin:focus{width:230px;margin-left:-60px}' +
    '#jysrch .kres{top:auto;bottom:46px;right:-64px;width:min(340px,92vw)}' +
    '#jysrch .ktip{right:0;top:auto;bottom:100%;margin:0 0 14px;transform:none;animation:jyNudgeY 1.6s ease-in-out infinite}' +
    '#jysrch .ktip::after{left:auto;right:34px;top:100%;margin-top:0;border:7px solid transparent;border-top:9px solid #ffd35a}' +
    '@keyframes jyNudgeY{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}}';
  document.head.appendChild(css);

  var seen = false;
  try { seen = localStorage.getItem('jySrchSeen') === '1'; } catch (e) {}

  var box = document.createElement('div');
  box.id = 'jysrch';
  box.innerHTML = '<span class="kic">🔍</span><input class="kin" type="text" placeholder="搜尋全站內容…" aria-label="站內搜尋" autocomplete="off"><div class="kres"></div>' +
    (seen ? '' : '<div class="ktip"><b>找資料？</b>打關鍵字直接搜尋<button type="button" aria-label="關閉提示">×</button></div>');
  if (!seen) box.classList.add('hint');
  document.body.appendChild(box);

  var inp = box.querySelector('.kin'), res = box.querySelector('.kres'), tip = box.querySelector('.ktip');
  function dismissTip() {
    if (tip) { tip.style.display = 'none'; box.classList.remove('hint'); }
    try { localStorage.setItem('jySrchSeen', '1'); } catch (e) {}
  }
  if (tip) tip.querySelector('button').addEventListener('click', function (e) { e.stopPropagation(); dismissTip(); });
  inp.addEventListener('focus', dismissTip);

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hi(text, terms) {
    var out = esc(text);
    terms.forEach(function (t) {
      if (!t) return;
      var re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/&/g, '&amp;'), 'ig');
      out = out.replace(re, function (m) { return '<mark>' + m + '</mark>'; });
    });
    return out;
  }
  function snippet(x, terms) {
    var segs = x.split('｜'), low = terms.map(function (t) { return t.toLowerCase(); });
    for (var i = 0; i < segs.length; i++) {
      var sl = segs[i].toLowerCase();
      for (var k = 0; k < low.length; k++) {
        var p = sl.indexOf(low[k]);
        if (p >= 0) {
          var a = Math.max(0, p - 22), b = Math.min(segs[i].length, p + low[k].length + 40);
          return (a > 0 ? '…' : '') + segs[i].slice(a, b) + (b < segs[i].length ? '…' : '');
        }
      }
    }
    return '';
  }

  function run(q) {
    var terms = q.split(/\s+/).filter(Boolean);
    if (!terms.length) { res.style.display = 'none'; res.innerHTML = ''; return; }
    var lows = terms.map(function (t) { return t.toLowerCase(); }), hits = [];
    for (var i = 0; i < IDX.length; i++) {
      var o = IDX[i], tl = o.t.toLowerCase(), hl = (o.h || '').toLowerCase(), xl = (o.x || '').toLowerCase(), sc = 0, ok = true;
      for (var k = 0; k < lows.length; k++) {
        var inT = tl.indexOf(lows[k]) >= 0, inH = hl.indexOf(lows[k]) >= 0, inX = xl.indexOf(lows[k]) >= 0;
        if (!inT && !inH && !inX) { ok = false; break; }
        sc += (inT ? 6 : 0) + (inH ? 3 : 0) + (inX ? 1 : 0);
      }
      if (ok) hits.push([sc, o]);
    }
    hits.sort(function (a, b) { return b[0] - a[0]; });
    var total = hits.length;
    hits = hits.slice(0, 15);
    if (!hits.length) { res.innerHTML = '<div class="kno">查無「' + esc(q) + '」相關內容</div>'; res.style.display = 'block'; return; }
    res.innerHTML = '<div class="kcnt">找到 ' + total + ' 個頁面</div>' + hits.map(function (h) {
      var sn = snippet(h[1].x || '', terms);
      return '<a href="' + ROOT + h[1].u + '#:~:text=' + encodeURIComponent(terms[0]) + '"><b>' + hi(h[1].t, terms) + '</b>' + (sn ? '<span>' + hi(sn, terms) + '</span>' : '') + '</a>';
    }).join('');
    res.style.display = 'block';
  }

  function load(cb) {
    if (IDX) return cb();
    pending = cb;
    if (loading) return;
    loading = true;
    res.innerHTML = '<div class="kno">載入搜尋資料…</div>'; res.style.display = 'block';
    fetch(ROOT + 'assets/search-index.json?v=20261024').then(function (r) { return r.json(); }).then(function (d) {
      IDX = d; loading = false; if (pending) pending();
    }).catch(function () { loading = false; res.innerHTML = '<div class="kno">搜尋資料載入失敗，請重新整理</div>'; });
  }

  inp.addEventListener('input', function () {
    var q = inp.value.trim();
    if (!q) { res.style.display = 'none'; res.innerHTML = ''; return; }
    load(function () { run(inp.value.trim()); });
  });
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { res.style.display = 'none'; inp.blur(); }
    if (e.key === 'Enter') { var a = res.querySelector('a'); if (a) location.href = a.href; }
  });
  document.addEventListener('click', function (e) { if (!box.contains(e.target)) res.style.display = 'none'; });
})();
