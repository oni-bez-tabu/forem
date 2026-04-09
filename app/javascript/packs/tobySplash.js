/**
 * Toby AI splash background — Canvas renderer
 * Scrolling card grid drawn on offscreen buffer, blitted each frame.
 * No image loading — avatars are colored circles with initials.
 */

var NAMES = [
  'Alex', 'Kasia', 'Marek', 'Ola', 'Piotr',
  'Iga', 'Marta', 'Adam', 'Julia', 'Tomek'
];

var AVATAR_COLORS = [
  '#7c3aed', '#db2777', '#ea580c', '#0891b2', '#059669',
  '#d97706', '#4f46e5', '#be185d', '#0d9488', '#7e22ce'
];

var CARD_GAP = 10;
var CARD_PAD_X = 13;
var CARD_PAD_Y = 11;
var CARD_R = 16;
var AV_SIZE = 24;
var AV_R = 12;
var NAME_FONT = '600 11px Inter, system-ui, sans-serif';
var Q_FONT = '13px Inter, system-ui, sans-serif';
var Q_LH = 19;
var MAX_QL = 2;
var SPEED = 50;
var FADE_H_DARK = 140;
var FADE_H_LIGHT = 80;

var LIGHT = {
  fill: 'rgba(255,255,255,0.9)',
  stroke: 'rgba(168,85,247,0.18)',
  name: 'rgba(80,60,120,0.7)',
  question: 'rgba(40,30,60,0.8)',
  css: 'saturate(0.85) brightness(1.0)'
};
var DARK = {
  fill: 'rgba(52,49,44,0.75)',
  stroke: 'rgba(255,255,255,0.28)',
  name: 'rgba(255,255,255,0.75)',
  question: 'rgba(255,255,255,0.9)',
  css: 'saturate(0.76) brightness(0.62)'
};

function rng(seed) {
  var s = seed >>> 0;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function seededShuffle(arr, seed) {
  var r = rng(seed), a = arr.slice(), i, j, t;
  for (i = a.length - 1; i > 0; i--) { j = Math.floor(r() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

// --- Layout ---

function computeLayout(vw, vh, questions) {
  var rowCount = Math.ceil((vh * 1.9) / 90);
  var maxOff = Math.round(Math.min(220, vw * 0.2));
  var rows = [], cc = 0, totalH = 6;
  var cardH = CARD_PAD_Y + AV_SIZE + 6 + Q_LH * MAX_QL + CARD_PAD_Y;

  for (var ri = 0; ri < rowCount; ri++) {
    var rr = rng(ri * 2371 + 19);
    var off = -Math.round(14 + rr() * maxOff);
    var target = vw - off + 200;
    var rq = seededShuffle(questions, ri * 977 + 29);
    var cards = [], ws = 0, qi = 0;

    while (ws < target) {
      var q = rq[qi % rq.length];
      var cardRng = rng(cc * 3571 + 137);

      // Randomize width: base from text length + random ±25%
      var mn = Math.max(130, vw * 0.12), mx = Math.min(360, vw * 0.42);
      var baseW = mn + Math.min(1, Math.max(0, (q.length - 12) / 80)) * (mx - mn);
      var wJitter = 0.75 + cardRng() * 0.5; // 0.75x to 1.25x
      var w = Math.round(baseW * wJitter);
      w = Math.max(Math.round(mn * 0.85), Math.min(Math.round(mx * 1.1), w));

      // Random horizontal gap (8-16px)
      var gap = 8 + Math.round(cardRng() * 8);

      cards.push({ x: off + ws, w: w, h: cardH, q: q, ni: cc % NAMES.length, yOff: 0, ml: MAX_QL });
      ws += w + gap; qi++; cc++;
    }
    rows.push({ y: totalH, cards: cards });
    totalH += cardH + CARD_GAP;
  }
  return { rows: rows, secH: totalH };
}

// --- Text ---

function truncate(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  var ew = ctx.measureText('...').width, t = text;
  while (t.length > 0 && ctx.measureText(t).width + ew > maxW) t = t.slice(0, -1);
  return t + '...';
}

function wrapText(ctx, text, maxW, maxLines) {
  var ml = maxLines || MAX_QL;
  var words = text.split(' '), lines = [], cur = '';
  for (var i = 0; i < words.length; i++) {
    var test = cur ? cur + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur); cur = words[i];
      if (lines.length >= ml) break;
    } else { cur = test; }
  }
  if (lines.length < ml && cur) lines.push(cur);
  if (lines.length) lines[lines.length - 1] = truncate(ctx, lines[lines.length - 1], maxW);
  return lines;
}

// --- Draw card ---

function drawCard(ctx, x, y, card, pal) {
  var w = card.w, h = card.h;
  var name = NAMES[card.ni];
  var color = AVATAR_COLORS[card.ni];
  var initial = name.charAt(0);

  // Card rect
  ctx.beginPath();
  ctx.moveTo(x + CARD_R, y);
  ctx.lineTo(x + w - CARD_R, y);
  ctx.arcTo(x + w, y, x + w, y + CARD_R, CARD_R);
  ctx.lineTo(x + w, y + h - CARD_R);
  ctx.arcTo(x + w, y + h, x + w - CARD_R, y + h, CARD_R);
  ctx.lineTo(x + CARD_R, y + h);
  ctx.arcTo(x, y + h, x, y + h - CARD_R, CARD_R);
  ctx.lineTo(x, y + CARD_R);
  ctx.arcTo(x, y, x + CARD_R, y, CARD_R);
  ctx.closePath();
  ctx.fillStyle = pal.fill;
  ctx.fill();
  ctx.strokeStyle = pal.stroke;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Avatar — colored circle with initial
  var ax = x + CARD_PAD_X, ay = y + CARD_PAD_Y;
  var cx = ax + AV_R, cy = ay + AV_R;
  ctx.beginPath();
  ctx.arc(cx, cy, AV_R, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initial, cx, cy + 1);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';

  // Name
  ctx.font = NAME_FONT;
  ctx.fillStyle = pal.name;
  var nmMaxW = w - CARD_PAD_X * 2 - AV_SIZE - 8;
  ctx.fillText(truncate(ctx, name, nmMaxW), ax + AV_SIZE + 8, ay + AV_SIZE / 2 + 4);

  // Question
  ctx.font = Q_FONT;
  ctx.fillStyle = pal.question;
  var lines = wrapText(ctx, card.q, w - CARD_PAD_X * 2, card.ml);
  for (var i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x + CARD_PAD_X, ay + AV_SIZE + 6 + 13 + i * Q_LH);
  }
}

// --- Build buffer ---

function buildBuffer(vw, layout, pal, dpr) {
  var bufH = layout.secH * 2;
  var c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(vw * dpr));
  c.height = Math.max(1, Math.round(bufH * dpr));
  var bx = c.getContext('2d');
  bx.scale(dpr, dpr);

  for (var copy = 0; copy < 2; copy++) {
    var oy = copy * layout.secH;
    for (var r = 0; r < layout.rows.length; r++) {
      var row = layout.rows[r];
      for (var ci = 0; ci < row.cards.length; ci++) {
        var card = row.cards[ci];
        drawCard(bx, card.x, row.y + oy + (card.yOff || 0), card, pal);
      }
    }
  }
  return { canvas: c, height: bufH };
}

// --- Fades ---

function colorToRgba(color, alpha) {
  var m = color.match(/\d+/g);
  if (!m || m.length < 3) return 'rgba(0,0,0,' + alpha + ')';
  return 'rgba(' + m[0] + ',' + m[1] + ',' + m[2] + ',' + alpha + ')';
}

function drawFades(ctx, w, h, color, fadeH) {
  var g1 = ctx.createLinearGradient(0, 0, 0, fadeH);
  g1.addColorStop(0, color); g1.addColorStop(1, colorToRgba(color, 0));
  ctx.fillStyle = g1; ctx.fillRect(0, 0, w, fadeH);
  var g2 = ctx.createLinearGradient(0, h - fadeH, 0, h);
  g2.addColorStop(0, colorToRgba(color, 0)); g2.addColorStop(1, color);
  ctx.fillStyle = g2; ctx.fillRect(0, h - fadeH, w, fadeH);
}

function bgColor() {
  if (document.body && document.body.classList.contains('dark-theme')) return 'rgb(12,11,9)';
  try {
    var c = getComputedStyle(document.body).backgroundColor;
    if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c;
    c = getComputedStyle(document.documentElement).backgroundColor;
    if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c;
  } catch (e) {}
  return 'rgb(246,246,246)';
}

// --- Init ---

function initTobySplash(canvas, opts) {
  var questions = opts.questions;
  if (!canvas || !questions.length) return { destroy: function () {} };

  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var animId = null, scrollY = 0, lastT = 0;
  var buffer = null, layout = null;
  var isDark = document.body.classList.contains('dark-theme');
  var dead = false, resizeT = null;

  function pal() { return isDark ? DARK : LIGHT; }

  function dims() {
    var p = canvas.parentElement;
    var w = p ? p.clientWidth : 0, h = p ? p.clientHeight : 0;
    if (!w) w = window.innerWidth;
    if (!h) h = window.innerHeight;
    return { w: w, h: h };
  }

  function rebuild() {
    var d = dims();
    canvas.width = d.w * dpr;
    canvas.height = d.h * dpr;
    canvas.style.width = d.w + 'px';
    canvas.style.height = d.h + 'px';
    canvas.style.filter = pal().css;
    canvas.style.opacity = '0.7';
    layout = computeLayout(d.w, d.h, questions);
    buffer = buildBuffer(d.w, layout, pal(), dpr);
  }

  function tick(t) {
    if (dead) return;
    if (!buffer || !layout) { animId = requestAnimationFrame(tick); return; }
    if (!lastT) lastT = t;
    var dt = (t - lastT) / 1000;
    lastT = t;
    scrollY = (scrollY + SPEED * dt) % layout.secH;

    var w = canvas.width / dpr, h = canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (buffer.canvas.width > 0 && buffer.canvas.height > 0) {
      var bw = buffer.canvas.width, bh = buffer.canvas.height, bufH = buffer.height;
      ctx.drawImage(buffer.canvas, 0, 0, bw, bh, 0, -scrollY, w, bufH);
      if (scrollY > 0) ctx.drawImage(buffer.canvas, 0, 0, bw, bh, 0, -scrollY + bufH, w, bufH);
    }

    drawFades(ctx, w, h, bgColor(), isDark ? FADE_H_DARK : FADE_H_LIGHT);
    animId = requestAnimationFrame(tick);
  }

  var mo = new MutationObserver(function () {
    var was = isDark;
    isDark = document.body.classList.contains('dark-theme');
    if (was !== isDark) rebuild();
  });
  mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { if (!dead) rebuild(); }, 300);
  });

  // Start after layout reflow
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      if (dead) return;
      rebuild();
      animId = requestAnimationFrame(tick);
    });
  });

  return {
    destroy: function () {
      dead = true;
      if (animId) cancelAnimationFrame(animId);
      clearTimeout(resizeT);
      mo.disconnect();
    }
  };
}

window.initTobySplash = initTobySplash;

(function () {
  var c = document.getElementById('outer-splash-canvas');
  var b = document.getElementById('startBanner');
  if (!c || !b) return;
  var qq;
  try { qq = JSON.parse(b.dataset.questions || '[]'); } catch (e) { return; }
  if (qq.length) window._tobySplashInstance = initTobySplash(c, { questions: qq });
})();
