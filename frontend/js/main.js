/* BuyCars · interaksi halaman */
import * as api from './api.js';

const CFG = window.BUYCARS || {};
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rupiah = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const short = n => n >= 1e9 ? `Rp ${(n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M` : `Rp ${Math.round(n / 1e6).toLocaleString('id-ID')} jt`;
const waLink = text => `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(text)}`;
const LABEL = {
  body: { suv: 'SUV', sedan: 'Sedan', coupe: 'Coupe', convertible: 'Convertible', hatchback: 'Hatchback', mpv: 'MPV', pickup: 'Pickup' },
  fuel: { bensin: 'Bensin', diesel: 'Diesel', listrik: 'Listrik', hybrid: 'Hybrid' },
  trans: { otomatis: 'Otomatis', manual: 'Manual' },
};
const nameOf = c => `${c.brand} ${c.model} ${c.variant || ''}`.trim();

let cars = [];
let shown = 9;
const filter = { q: '', brand: '', fuel: '', transmission: '', condition: '', body: '', max: Infinity, sort: 'featured' };

// ---------------------------------------------------------------- toast
let toastT = 0;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200);
}

// ---------------------------------------------------------------- config into the page
function applyConfig() {
  $$('[data-cfg-text]').forEach(el => { el.textContent = CFG[el.dataset.cfgText] || ''; });
  const href = { tel: `tel:+${CFG.whatsapp}`, mailto: `mailto:${CFG.email}`, wa: waLink('Halo BuyCars, saya mau tanya soal mobil.'), maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CFG.mapsQuery)}` };
  $$('[data-cfg-href]').forEach(el => { el.href = href[el.dataset.cfgHref]; if (el.dataset.cfgHref === 'wa') { el.target = '_blank'; el.rel = 'noopener'; } });
  $('#maps-link').href = href.maps;
  $('#map').src = `https://www.google.com/maps?q=${encodeURIComponent(CFG.mapsQuery)}&z=13&output=embed`;
  $('#year').textContent = new Date().getFullYear();
}

// ---------------------------------------------------------------- header + nav
function setupNav() {
  const header = $('#header'), nav = $('#nav'), btn = $('#menu-btn');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const close = () => { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', () => { const o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', String(o)); });
  nav.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  // highlight the section in view
  const links = new Map($$('a', nav).map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { links.forEach(a => a.classList.remove('active')); links.get(e.target.id)?.classList.add('active'); }
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}

// ---------------------------------------------------------------- 3D hero
async function setup3D() {
  const stage = $('#stage');
  try {
    const { initCar3D, webglAvailable } = await import('./car3d.js');
    if (!webglAvailable()) throw new Error('WebGL2 tidak tersedia');
    const car = initCar3D(stage, { color: '#c8102e', shift: w => (innerWidth > 980 ? 0.3 : 0) });
    document.body.classList.add('has-3d');
    window.__car = car;
    $$('.swatch').forEach(b => b.addEventListener('click', () => {
      $$('.swatch').forEach(x => x.setAttribute('aria-checked', String(x === b)));
      car.setColor(b.dataset.color);
    }));
    const press = (name, on) => $(`[data-cfg="${name}"]`).setAttribute('aria-pressed', String(on));
    $$('[data-cfg]').forEach(b => b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      if (b.dataset.cfg === 'lights') { car.setLights(on); press('lights', on); }
      if (b.dataset.cfg === 'drive') { const lit = car.setDrive(on); press('drive', on); if (on) press('lights', lit); }
      if (b.dataset.cfg === 'rotate') { car.setAutoRotate(on); press('rotate', on); }
    }));
    $$('[data-view]').forEach(b => b.addEventListener('click', () => { car.view(b.dataset.view); press('rotate', false); }));
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { car.setAutoRotate(false); press('rotate', false); }
  } catch (e) {
    document.body.classList.add('no-3d');
    console.info('3D dimatikan:', e.message);
  }
}

// ---------------------------------------------------------------- catalogue
const PRICE_STEPS = [300e6, 500e6, 750e6, 1e9, 1.5e9, 2e9, 3e9, 5e9];
function setupFilters() {
  const f = $('#filters');
  const brands = [...new Set(cars.map(c => c.brand))].sort();
  f.brand.insertAdjacentHTML('beforeend', brands.map(b => `<option>${esc(b)}</option>`).join(''));
  f.max.max = PRICE_STEPS.length; f.max.value = PRICE_STEPS.length;
  const priceLabel = () => { const i = Number(f.max.value); $('#price-out').textContent = i >= PRICE_STEPS.length ? 'Semua' : short(PRICE_STEPS[i]); };
  priceLabel();
  let t = 0;
  f.addEventListener('input', e => {
    if (e.target.name === 'max') priceLabel();
    clearTimeout(t); t = setTimeout(read, e.target.name === 'q' ? 160 : 0);
  });
  f.addEventListener('change', read);
  $('#body-chips').addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    $$('#body-chips .chip').forEach(x => x.classList.toggle('active', x === c));
    filter.body = c.dataset.body; shown = 9; renderCars();
  });
  $('#reset-filters').addEventListener('click', () => {
    f.reset(); priceLabel();
    $$('#body-chips .chip').forEach((x, i) => x.classList.toggle('active', i === 0));
    Object.assign(filter, { q: '', brand: '', fuel: '', transmission: '', condition: '', body: '', max: Infinity, sort: 'featured' });
    shown = 9; renderCars();
  });
  $('#load-more').addEventListener('click', () => { shown += 9; renderCars(); });
  function read() {
    Object.assign(filter, { q: f.q.value.trim().toLowerCase(), brand: f.brand.value, fuel: f.fuel.value, transmission: f.transmission.value, condition: f.condition.value, sort: f.sort.value });
    const i = Number(f.max.value); filter.max = i >= PRICE_STEPS.length ? Infinity : PRICE_STEPS[i];
    shown = 9; renderCars();
  }
}

function matches(c) {
  if (filter.q && !`${nameOf(c)} ${c.color} ${c.body_type} ${c.year}`.toLowerCase().includes(filter.q)) return false;
  if (filter.brand && c.brand !== filter.brand) return false;
  if (filter.fuel && c.fuel !== filter.fuel) return false;
  if (filter.transmission && c.transmission !== filter.transmission) return false;
  if (filter.condition && c.condition !== filter.condition) return false;
  if (filter.body && c.body_type !== filter.body) return false;
  return Number(c.price) <= filter.max;
}
const SORT = {
  featured: (a, b) => (b.is_featured - a.is_featured) || (b.year - a.year),
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  year_desc: (a, b) => b.year - a.year,
  km_asc: (a, b) => a.mileage_km - b.mileage_km,
};

function card(c) {
  const sold = c.status && c.status !== 'tersedia';
  return `<article class="car-card" data-id="${c.id}">
    <button type="button" class="car-media" data-detail="${c.id}" aria-label="Lihat detail ${esc(nameOf(c))}">
      <span class="badges">${c.condition === 'baru' ? '<span class="badge new">Baru</span>' : '<span class="badge">Bekas</span>'}${Number(c.is_featured) ? '<span class="badge hot">Unggulan</span>' : ''}${sold ? `<span class="badge sold">${esc(c.status === 'dipesan' ? 'Dipesan' : 'Terjual')}</span>` : ''}</span>
      <img src="${esc(c.image)}" alt="${esc(nameOf(c))} warna ${esc(c.color)}" loading="lazy" width="900" height="500">
    </button>
    <div class="car-info">
      <div class="car-title"><small>${esc(c.brand)} · ${c.year}</small><h3>${esc(c.model)} ${esc(c.variant || '')}</h3></div>
      <ul class="specs">
        <li><svg><use href="#i-gauge"/></svg>${Number(c.mileage_km) ? Number(c.mileage_km).toLocaleString('id-ID') + ' km' : '0 km'}</li>
        <li><svg><use href="#i-gear"/></svg>${LABEL.trans[c.transmission] || esc(c.transmission)}</li>
        <li><svg><use href="#i-fuel"/></svg>${LABEL.fuel[c.fuel] || esc(c.fuel)}</li>
        <li><svg><use href="#i-seat"/></svg>${c.seats} kursi</li>
      </ul>
      <div class="car-foot">
        <div class="price">${rupiah(c.price)}<small>Cicilan ±${short(monthly(Number(c.price), 30, 36, 5.5).monthly)}/bln</small></div>
        <button type="button" class="btn btn-ghost btn-sm" data-detail="${c.id}">Detail</button>
      </div>
    </div>
  </article>`;
}

function renderCars() {
  const list = cars.filter(matches).sort(SORT[filter.sort] || SORT.featured);
  const grid = $('#car-grid');
  grid.innerHTML = list.length ? list.slice(0, shown).map(card).join('') : `<div class="empty">Belum ada mobil yang cocok dengan filter ini.<br><button type="button" class="link-btn" onclick="document.getElementById('reset-filters').click()">Reset filter</button> atau <a href="${waLink('Halo BuyCars, saya cari mobil yang belum ada di katalog.')}" target="_blank" rel="noopener">tanya stok lewat WhatsApp</a>.</div>`;
  const active = filter.q || filter.brand || filter.fuel || filter.transmission || filter.condition || filter.body || filter.max !== Infinity || filter.sort !== 'featured';
  $('#result-count').textContent = `${list.length} mobil ditemukan`;
  $('#reset-filters').hidden = !active;
  $('#load-more').hidden = list.length <= shown;
  setupTilt();
}

function setupTilt() {
  if (matchMedia('(hover: none), (prefers-reduced-motion: reduce)').matches) return;
  $$('.car-card').forEach(el => {
    if (el.dataset.tilt) return; el.dataset.tilt = 1;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--ry', `${x * 10}deg`); el.style.setProperty('--rx', `${-y * 8}deg`);
    });
    el.addEventListener('pointerleave', () => { el.style.removeProperty('--ry'); el.style.removeProperty('--rx'); });
  });
}

// ---------------------------------------------------------------- detail modal
function openDetail(id) {
  const c = cars.find(x => String(x.id) === String(id));
  if (!c) return;
  const m = monthly(Number(c.price), 30, 36, 5.5);
  $('#modal-body').innerHTML = `
    <div class="modal-media"><span class="badges">${c.condition === 'baru' ? '<span class="badge new">Baru</span>' : '<span class="badge">Bekas</span>'}</span><img src="${esc(c.image)}" alt="${esc(nameOf(c))}"></div>
    <div class="modal-info">
      <div><p class="eyebrow">${esc(c.brand)} · ${c.year}</p><h2 id="modal-title">${esc(c.model)} ${esc(c.variant || '')}</h2></div>
      <div class="price">${rupiah(c.price)}</div>
      <p class="est">Contoh cicilan: <b>${rupiah(m.monthly)}/bulan</b> (DP 30%, 3 tahun, bunga flat 5,5%).</p>
      <p class="muted">${esc(c.description || '')}</p>
      <dl class="spec-table">
        <div><dt>Tahun</dt><dd>${c.year}</dd></div>
        <div><dt>Kilometer</dt><dd>${Number(c.mileage_km).toLocaleString('id-ID')} km</dd></div>
        <div><dt>Mesin</dt><dd>${esc(c.engine || '–')}</dd></div>
        <div><dt>Tenaga</dt><dd>${c.power_hp ? c.power_hp + ' hp' : '–'}</dd></div>
        <div><dt>Transmisi</dt><dd>${LABEL.trans[c.transmission] || esc(c.transmission)}</dd></div>
        <div><dt>Bahan bakar</dt><dd>${LABEL.fuel[c.fuel] || esc(c.fuel)}</dd></div>
        <div><dt>Tipe</dt><dd>${LABEL.body[c.body_type] || esc(c.body_type)}</dd></div>
        <div><dt>Warna</dt><dd>${esc(c.color)}</dd></div>
      </dl>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" data-book="${c.id}"><svg><use href="#i-cal"/></svg> Booking test drive</button>
        <button type="button" class="btn btn-ghost" data-credit="${c.id}"><svg><use href="#i-card"/></svg> Hitung kredit</button>
        <a class="btn btn-ghost" target="_blank" rel="noopener" href="${waLink(`Halo BuyCars, saya tertarik dengan ${nameOf(c)} ${c.year} (${rupiah(c.price)}). Apakah masih tersedia?`)}"><svg><use href="#i-wa"/></svg> Tanya</a>
      </div>
    </div>`;
  const d = $('#car-modal');
  d.showModal();
}

function bookCar(id) {
  $('#car-modal').close();
  showTab('drive');
  const f = $('#booking-form');
  f.car_id.value = id;
  $('#kontak').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => f.name.focus({ preventScroll: true }), 600);
}
function creditCar(id) {
  $('#car-modal').close();
  const f = $('#calc');
  f.car.value = id; f.car.dispatchEvent(new Event('change', { bubbles: true }));
  $('#kredit').scrollIntoView({ behavior: 'smooth' });
}

// ---------------------------------------------------------------- credit calculator
function monthly(price, dpPct, months, ratePct) {
  const dp = price * dpPct / 100, loan = price - dp;
  const interest = loan * (ratePct / 100) * (months / 12);
  return { dp, loan, interest, monthly: (loan + interest) / months };
}
const digits = s => Number(String(s).replace(/[^\d]/g, '')) || 0;
function setupCalc() {
  const f = $('#calc');
  f.car.insertAdjacentHTML('beforeend', cars.map(c => `<option value="${c.id}">${esc(nameOf(c))} · ${c.year}</option>`).join(''));
  const calc = () => {
    const price = digits(f.price.value), dp = Number(f.dp.value), months = Number(f.tenor.value), rate = Math.max(0, Number(f.rate.value) || 0);
    $('#dp-out').textContent = dp + '%';
    if (!price) { ['monthly', 'dp', 'loan', 'interest'].forEach(k => { $('#out-' + k).textContent = '–'; }); return; }
    const r = monthly(price, dp, months, rate);
    $('#out-monthly').textContent = rupiah(r.monthly);
    $('#out-dp').textContent = rupiah(r.dp);
    $('#out-loan').textContent = rupiah(r.loan);
    $('#out-interest').textContent = rupiah(r.interest);
    return { price, dpPct: dp, months, rate, ...r };
  };
  f.addEventListener('input', e => {
    if (e.target.name === 'price') { const v = digits(e.target.value); e.target.value = v ? v.toLocaleString('id-ID') : ''; f.car.value = ''; }
    calc();
  });
  f.car.addEventListener('change', () => {
    const c = cars.find(x => String(x.id) === f.car.value);
    if (c) f.price.value = Number(c.price).toLocaleString('id-ID');
    calc();
  });
  $('#calc-wa').addEventListener('click', () => {
    const r = calc(); if (!r) { toast('Isi harga mobil dulu.'); return; }
    const c = cars.find(x => String(x.id) === f.car.value);
    const text = `Halo BuyCars, saya mau ajukan kredit${c ? ` untuk ${nameOf(c)} ${c.year}` : ''}.\nHarga: ${rupiah(r.price)}\nDP ${r.dpPct}%: ${rupiah(r.dp)}\nTenor: ${r.months} bulan\nPerkiraan cicilan: ${rupiah(r.monthly)}/bulan`;
    window.open(waLink(text), '_blank', 'noopener');
  });
  calc();
}

// ---------------------------------------------------------------- forms
function showTab(which) {
  const drive = which === 'drive';
  $('#tab-drive').classList.toggle('active', drive); $('#tab-drive').setAttribute('aria-selected', String(drive));
  $('#tab-msg').classList.toggle('active', !drive); $('#tab-msg').setAttribute('aria-selected', String(!drive));
  $('#booking-form').hidden = !drive; $('#message-form').hidden = drive;
}
function msg(form, text, kind = '') { const p = $('.form-msg', form); p.className = 'form-msg ' + kind; p.innerHTML = text; }
function invalid(form, names) {
  $$('.field', form).forEach(f => f.classList.remove('invalid'));
  names.forEach(n => form[n]?.closest('.field')?.classList.add('invalid'));
  if (names.length) form[names[0]]?.focus();
  return names.length > 0;
}
const phoneOk = p => /^(\+?62|0)8\d{7,12}$/.test(String(p).replace(/[\s-]/g, ''));
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
async function submit(form, run) {
  const btn = $('button[type="submit"]', form);
  btn.disabled = true;
  try { await run(); } catch (e) { msg(form, esc(e.message || 'Gagal mengirim. Coba lagi.'), 'err'); } finally { btn.disabled = false; }
}

function setupForms() {
  const opts = cars.map(c => `<option value="${c.id}">${esc(nameOf(c))} · ${c.year}</option>`).join('');
  $('#booking-form').car_id.insertAdjacentHTML('beforeend', opts);
  $('#review-form').car_id.insertAdjacentHTML('beforeend', opts);
  $('#tab-drive').addEventListener('click', () => showTab('drive'));
  $('#tab-msg').addEventListener('click', () => showTab('msg'));
  $$('[data-testdrive]').forEach(a => a.addEventListener('click', () => showTab('drive')));

  // booking: tomorrow to 60 days ahead, no Sundays
  const bf = $('#booking-form');
  const day = d => d.toISOString().slice(0, 10);
  const t = new Date(); t.setDate(t.getDate() + 1);
  const max = new Date(); max.setDate(max.getDate() + 60);
  bf.date.min = day(t); bf.date.max = day(max); bf.date.value = day(t.getDay() === 0 ? new Date(t.getTime() + 864e5) : t);

  bf.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(bf));
    const bad = [];
    if (!d.car_id) bad.push('car_id');
    if (d.name.trim().length < 3) bad.push('name');
    if (!phoneOk(d.phone)) bad.push('phone');
    if (!d.date || d.date < bf.date.min || d.date > bf.date.max || new Date(d.date + 'T00:00').getDay() === 0) bad.push('date');
    if (d.email && !emailOk(d.email)) bad.push('email');
    if (invalid(bf, bad)) { msg(bf, bad.includes('date') ? 'Pilih tanggal mulai besok, Senin–Sabtu.' : 'Periksa kolom yang ditandai merah.', 'err'); return; }
    const c = cars.find(x => String(x.id) === d.car_id);
    const text = `Halo BuyCars, saya mau booking test drive.\nMobil: ${nameOf(c)} ${c.year}\nNama: ${d.name}\nTanggal: ${new Date(d.date + 'T00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, jam ${d.time}${d.notes ? `\nCatatan: ${d.notes}` : ''}`;
    submit(bf, async () => {
      if (api.online()) {
        const r = await api.book(d);
        msg(bf, `Booking tersimpan dengan kode <b>${esc(r.data.code)}</b>. Kami konfirmasi lewat WhatsApp. <a href="${esc(r.whatsapp_url || waLink(text + `\nKode: ${r.data.code}`))}" target="_blank" rel="noopener">Konfirmasi sekarang</a>`, 'ok');
        bf.reset(); bf.date.value = day(t);
      } else {
        window.open(waLink(text), '_blank', 'noopener');
        msg(bf, `Booking dikirim lewat WhatsApp. Kalau tidak terbuka, <a href="${waLink(text)}" target="_blank" rel="noopener">klik di sini</a>.`, 'ok');
      }
    });
  });

  const mf = $('#message-form');
  mf.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(mf));
    const bad = [];
    if (d.name.trim().length < 3) bad.push('name');
    if (!emailOk(d.email)) bad.push('email');
    if (d.phone && !phoneOk(d.phone)) bad.push('phone');
    if (d.message.trim().length < 10) bad.push('message');
    if (invalid(mf, bad)) { msg(mf, 'Periksa kolom yang ditandai merah. Pesan minimal 10 huruf.', 'err'); return; }
    submit(mf, async () => {
      if (api.online()) { await api.inquire(d); msg(mf, 'Pesan terkirim. Kami balas secepatnya lewat email atau WhatsApp.', 'ok'); mf.reset(); }
      else {
        const text = `Halo BuyCars, saya ${d.name} (${d.email}).\nTopik: ${d.subject}\n${d.message}`;
        window.open(waLink(text), '_blank', 'noopener');
        msg(mf, `Pesan dikirim lewat WhatsApp. Kalau tidak terbuka, <a href="${waLink(text)}" target="_blank" rel="noopener">klik di sini</a>.`, 'ok');
      }
    });
  });

  const nf = $('#news-form');
  nf.addEventListener('submit', e => {
    e.preventDefault();
    const email = nf.email.value.trim();
    if (!emailOk(email)) { msg(nf, 'Tulis alamat email yang benar.', 'err'); nf.email.focus(); return; }
    submit(nf, async () => {
      if (api.online()) { const r = await api.subscribe(email); msg(nf, esc(r.message || 'Terima kasih! Kamu sudah terdaftar.'), 'ok'); nf.reset(); }
      else msg(nf, `Langganan email butuh server yang aktif. Untuk sekarang, <a href="${waLink(`Halo BuyCars, kabari saya kalau ada mobil baru. Email saya: ${email}`)}" target="_blank" rel="noopener">minta dikabari lewat WhatsApp</a>.`);
    });
  });

  const rf = $('#review-form');
  rf.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(rf));
    const bad = [];
    if (d.name.trim().length < 2) bad.push('name');
    if (d.comment.trim().length < 10) bad.push('comment');
    if (invalid(rf, bad)) { msg(rf, 'Isi nama dan ulasan (minimal 10 huruf).', 'err'); return; }
    submit(rf, async () => {
      if (!api.online()) { msg(rf, 'Ulasan butuh server yang aktif supaya bisa dicek admin. Coba lagi nanti.', 'err'); return; }
      await api.review({ ...d, rating: Number(d.rating) });
      msg(rf, 'Terima kasih! Ulasanmu tampil setelah dicek admin.', 'ok'); rf.reset();
    });
  });
}

// ---------------------------------------------------------------- reviews
async function loadReviews() {
  const box = $('#reviews');
  let list = [];
  try { list = await api.reviews(); } catch { /* keep empty */ }
  if (!list.length) {
    box.innerHTML = `<div class="empty">${api.online() ? 'Belum ada ulasan. Jadilah yang pertama menulis ulasan.' : 'Ulasan pelanggan tampil di sini setelah server aktif dan ulasan dicek admin.'}</div>`;
    return;
  }
  box.innerHTML = list.map(r => `<article class="review">
    <div class="review-head"><span class="avatar" aria-hidden="true">${esc((r.name || '?').trim()[0].toUpperCase())}</span><div><b>${esc(r.name)}</b><small>${esc(r.car_name || 'Pelanggan BuyCars')} · ${new Date(r.created_at.replace(' ', 'T')).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</small></div></div>
    <div class="stars" aria-label="${r.rating} dari 5">${[1, 2, 3, 4, 5].map(i => `<svg class="${i <= r.rating ? '' : 'off'}"><use href="#i-star"/></svg>`).join('')}</div>
    <p>${esc(r.comment)}</p></article>`).join('');
}

// ---------------------------------------------------------------- hero stats, brands, gallery, dialogs
function heroStats() {
  const avail = cars.filter(c => !c.status || c.status === 'tersedia');
  $('[data-stat="count"]').textContent = avail.length;
  $('[data-stat="brands"]').textContent = new Set(cars.map(c => c.brand)).size;
  $('[data-stat="from"]').textContent = avail.length ? short(Math.min(...avail.map(c => Number(c.price)))) : '–';
  const brands = [...new Set(cars.map(c => c.brand))];
  const row = brands.map(b => `<span>${esc(b)}</span>`).join('');
  $('#brand-track').innerHTML = row + row + row + row;
}
function setupDialogs() {
  document.addEventListener('click', e => {
    const d = e.target.closest('[data-detail]'); if (d) openDetail(d.dataset.detail);
    const b = e.target.closest('[data-book]'); if (b) bookCar(b.dataset.book);
    const c = e.target.closest('[data-credit]'); if (c) creditCar(c.dataset.credit);
    if (e.target.closest('[data-close]')) e.target.closest('dialog').close();
  });
  $$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));
  const lb = $('#lightbox');
  $('#gallery').addEventListener('click', e => {
    const g = e.target.closest('.g-item'); if (!g) return;
    const img = $('img', g);
    $('img', lb).src = img.src; $('img', lb).alt = img.alt;
    lb.showModal();
  });
}

// ---------------------------------------------------------------- boot
async function boot() {
  applyConfig();
  setupNav();
  setupDialogs();
  setup3D();
  await api.connect();
  const badge = $('#mode-badge');
  badge.textContent = api.online() ? 'Terhubung ke server' : 'Mode tanpa server';
  badge.title = api.online() ? 'Katalog dan form memakai database.' : 'Katalog memakai data bawaan; form dikirim lewat WhatsApp.';
  badge.classList.toggle('live', api.online());
  try { cars = await api.cars(); } catch { cars = []; }
  cars.forEach(c => { c.price = Number(c.price); c.year = Number(c.year); c.mileage_km = Number(c.mileage_km); c.is_featured = Number(c.is_featured); c.seats = Number(c.seats); });
  heroStats();
  setupFilters();
  renderCars();
  setupCalc();
  setupForms();
  loadReviews();
}
boot();
