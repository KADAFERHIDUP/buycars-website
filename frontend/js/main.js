/* BuyCars · dashboard katalog */
import * as api from './api.js';

const CFG = window.BUYCARS || {};
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rupiah = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const short = n => n >= 1e9 ? `Rp ${(n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M` : `Rp ${Math.round(n / 1e6).toLocaleString('id-ID')} jt`;
const waLink = text => `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(text)}`;
const mapSrc = () => `https://www.google.com/maps?q=${encodeURIComponent(CFG.mapsQuery)}&z=13&output=embed`;
const LABEL = {
  body: { suv: 'SUV', sedan: 'Sedan', coupe: 'Coupe', convertible: 'Convertible', hatchback: 'Hatchback', mpv: 'MPV', pickup: 'Pickup' },
  fuel: { bensin: 'Bensin', diesel: 'Diesel', listrik: 'Listrik', hybrid: 'Hybrid' },
  trans: { otomatis: 'Otomatis', manual: 'Manual' },
};
const nameOf = c => `${c.brand} ${c.model} ${c.variant || ''}`.trim();
const specOf = c => [c.engine, c.power_hp ? `${c.power_hp} hp` : '', LABEL.trans[c.transmission]].filter(Boolean).join(' · ');
const monthly = (price, dpPct, months, ratePct) => {
  const dp = price * dpPct / 100, loan = price - dp, interest = loan * (ratePct / 100) * (months / 12);
  return { dp, loan, interest, monthly: (loan + interest) / months };
};

let cars = [];
let view = 'mobil';
let shown = 12;
let selectedId = null;
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};
let favs = new Set(store.get('buycars-fav').map(String));
let recent = store.get('buycars-recent').map(String);

// ---------------------------------------------------------------- toast
let toastT = 0;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3000);
}

// ---------------------------------------------------------------- config + clock
function applyConfig() {
  $$('[data-cfg-text]').forEach(el => { el.textContent = CFG[el.dataset.cfgText] || ''; });
  const href = { tel: `tel:+${CFG.whatsapp}`, mailto: `mailto:${CFG.email}`, wa: waLink('Halo BuyCars, saya mau tanya soal mobil.') };
  $$('[data-cfg-href]').forEach(el => { el.href = href[el.dataset.cfgHref]; });
  $('#maps-link').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CFG.mapsQuery)}`;
  $('#year').textContent = new Date().getFullYear();
  const tick = () => { $('#clock').textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB'; };
  tick(); setInterval(tick, 20000);
}

// ---------------------------------------------------------------- views (hash routing)
const VIEWS = { beranda: 'view-beranda', mobil: 'view-catalog', favorit: 'view-catalog', terakhir: 'view-catalog', kredit: 'view-kredit', kontak: 'view-kontak', ulasan: 'view-ulasan' };
let threeStarted = false;
function route() {
  const [name, slug] = location.hash.slice(1).split('/');
  const next = VIEWS[name] ? name : 'mobil';
  const changed = next !== view;
  view = next;
  document.body.dataset.view = view;
  const target = VIEWS[view];
  $$('.view').forEach(v => { v.hidden = v.id !== target; });
  $$('[data-nav]').forEach(a => { if (a.dataset.nav === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (view === 'beranda' && !threeStarted) { threeStarted = true; setup3D(); }
  if (target === 'view-catalog') { if (changed) shown = 12; renderCars(); }
  if (view === 'ulasan') loadReviews();
  closeFilters();
  if (changed) { scrollTo({ top: 0 }); $('#main').focus({ preventScroll: true }); }
  if (slug) { const c = cars.find(x => x.slug === slug || String(x.id) === slug); if (c) openDetail(c.id, false); }
}

// ---------------------------------------------------------------- 3D (Beranda)
async function setup3D() {
  const stage = $('#stage');
  try {
    const { initCar3D, webglAvailable } = await import('./car3d.js');
    if (!webglAvailable()) throw new Error('WebGL2 tidak tersedia');
    const car = initCar3D(stage, { color: '#c8102e', shift: () => (innerWidth > 1040 ? 0.32 : 0) });
    document.body.classList.add('has-3d');
    window.__car = car;
    $$('.swatch').forEach(b => b.addEventListener('click', () => {
      $$('.swatch').forEach(x => x.setAttribute('aria-checked', String(x === b)));
      car.setColor(b.dataset.color);
    }));
    const press = (n, on) => $(`[data-cfg="${n}"]`).setAttribute('aria-pressed', String(on));
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

// ---------------------------------------------------------------- filters
const F = { q: '', condition: '', available: false, pmin: 0, pmax: Infinity, brands: new Set(), year: 0, bodies: new Set(), transmission: '', fuels: new Set(), sort: 'featured' };
let priceLo = 0, priceHi = 1;
// price slider positions (0..100) follow a log scale so cheap and expensive cars both get room
const posToPrice = p => Math.round(Math.exp(Math.log(priceLo) + (Math.log(priceHi) - Math.log(priceLo)) * p / 100) / 1e6) * 1e6;
const priceToPos = v => 100 * (Math.log(v) - Math.log(priceLo)) / (Math.log(priceHi) - Math.log(priceLo));

function setupFilters() {
  const f = $('#filters');
  const prices = cars.map(c => c.price).filter(Boolean);
  priceLo = Math.max(1e6, Math.min(...prices) * 0.95); priceHi = Math.max(...prices) * 1.05;
  // histogram: 28 buckets on the same log scale as the slider
  const N = 28, buckets = new Array(N).fill(0);
  prices.forEach(p => { buckets[Math.min(N - 1, Math.floor(priceToPos(p) / 100 * N))]++; });
  const top = Math.max(...buckets, 1);
  $('#histogram').innerHTML = buckets.map((n, i) => `<i data-i="${i}" style="height:${n ? 18 + 82 * n / top : 6}%"></i>`).join('');

  const brands = [...new Set(cars.map(c => c.brand))].sort();
  $('#brand-checks').innerHTML = brands.map(b => `<label><input type="checkbox" name="brand" value="${esc(b)}"><span>${esc(b)}</span><small>${cars.filter(c => c.brand === b).length}</small></label>`).join('');
  const years = [...new Set(cars.map(c => c.year))].sort((a, b) => b - a);
  f.year.insertAdjacentHTML('beforeend', years.map(y => `<option value="${y}">${y} ke atas</option>`).join(''));

  const read = () => {
    const lo = Math.min(+f.pmin.value, +f.pmax.value), hi = Math.max(+f.pmin.value, +f.pmax.value);
    Object.assign(F, {
      condition: f.condition.value, available: f.available.checked, transmission: f.transmission.value, year: +f.year.value || 0,
      pmin: lo <= 0 ? 0 : posToPrice(lo), pmax: hi >= 100 ? Infinity : posToPrice(hi),
      brands: new Set($$('input[name=brand]:checked', f).map(i => i.value)),
      bodies: new Set($$('input[name=body]:checked', f).map(i => i.value)),
      fuels: new Set($$('input[name=fuel]:checked', f).map(i => i.value)),
    });
    $('#pmin-out').textContent = F.pmin ? short(F.pmin) : short(priceLo);
    $('#pmax-out').textContent = F.pmax === Infinity ? short(priceHi) : short(F.pmax);
    $$('#histogram i').forEach(b => { const p = (+b.dataset.i + 0.5) / N * 100; b.classList.toggle('on', p >= lo && p <= hi); });
    shown = 12; renderCars();
  };
  f.addEventListener('input', read);
  f.addEventListener('change', read);
  $('#reset-filters').addEventListener('click', () => { f.reset(); read(); });
  let t = 0;
  $('#q').addEventListener('input', e => {
    clearTimeout(t);
    t = setTimeout(() => { F.q = e.target.value.trim().toLowerCase(); shown = 12; if (VIEWS[view] !== 'view-catalog') location.hash = 'mobil'; else renderCars(); }, 150);
  });
  $('#sort').addEventListener('change', e => { F.sort = e.target.value; renderCars(); });
  $('#load-more').addEventListener('click', () => { shown += 12; renderCars(); });
  $$('[data-open-filters]').forEach(b => b.addEventListener('click', openFilters));
  $$('[data-close-filters]').forEach(b => b.addEventListener('click', closeFilters));
  read();
}
function openFilters() { $('#filters-panel').classList.add('open'); $('.scrim').hidden = false; $('#filters-panel').querySelector('input, button').focus(); }
function closeFilters() { $('#filters-panel').classList.remove('open'); $('.scrim').hidden = true; }
function activeFilterCount() {
  return (F.condition ? 1 : 0) + (F.available ? 1 : 0) + (F.pmin || F.pmax !== Infinity ? 1 : 0) + F.brands.size + (F.year ? 1 : 0) + F.bodies.size + (F.transmission ? 1 : 0) + F.fuels.size;
}

function matches(c) {
  if (F.q && !`${nameOf(c)} ${c.color} ${c.body_type} ${c.year}`.toLowerCase().includes(F.q)) return false;
  if (F.condition && c.condition !== F.condition) return false;
  if (F.available && c.status && c.status !== 'tersedia') return false;
  if (c.price < F.pmin || c.price > F.pmax) return false;
  if (F.brands.size && !F.brands.has(c.brand)) return false;
  if (F.year && c.year < F.year) return false;
  if (F.bodies.size && !F.bodies.has(c.body_type)) return false;
  if (F.transmission && c.transmission !== F.transmission) return false;
  if (F.fuels.size && !F.fuels.has(c.fuel)) return false;
  return true;
}
const SORT = {
  featured: (a, b) => (b.is_featured - a.is_featured) || (b.year - a.year),
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  year_desc: (a, b) => b.year - a.year,
  km_asc: (a, b) => a.mileage_km - b.mileage_km,
};

// ---------------------------------------------------------------- cards
function card(c, i = 0) {
  const fav = favs.has(String(c.id));
  const cond = c.status && c.status !== 'tersedia' ? `<span class="tag sold">${c.status === 'dipesan' ? 'Dipesan' : 'Terjual'}</span>`
    : c.condition === 'baru' ? '<span class="tag">Baru</span>' : Number(c.is_featured) ? '<span class="tag hot">Unggulan</span>' : '<span class="tag used">Bekas</span>';
  return `<article class="car-card${String(c.id) === String(selectedId) && $('#catalog-body')?.classList.contains('with-map') ? ' selected' : ''}" data-id="${c.id}" style="--i:${Math.min(i, 11)}">
    <div class="card-meta"><span>${cond} · ${c.year} · ${Number(c.mileage_km).toLocaleString('id-ID')} km</span>
      <button type="button" class="fav" data-fav="${c.id}" aria-pressed="${fav}" aria-label="${fav ? 'Hapus dari' : 'Simpan ke'} favorit: ${esc(nameOf(c))}"><svg><use href="#i-heart${fav ? '-fill' : ''}"/></svg></button></div>
    <button type="button" class="card-media" data-detail="${c.id}" aria-label="Lihat detail ${esc(nameOf(c))}">
      <img src="${esc(c.image)}" alt="${esc(nameOf(c))} warna ${esc(c.color)}" loading="lazy" width="900" height="500">
    </button>
    <div class="card-info">
      <div><h3>${esc(nameOf(c))}</h3><p>${esc(specOf(c))}</p></div>
      <div class="price">${short(c.price)}<small>±${short(monthly(c.price, 30, 36, 5.5).monthly)}/bln</small></div>
    </div>
  </article>`;
}

function listForView() {
  if (view === 'favorit') return cars.filter(c => favs.has(String(c.id)));
  if (view === 'terakhir') return recent.map(id => cars.find(c => String(c.id) === id)).filter(Boolean);
  return cars;
}

function renderCars() {
  const base = listForView();
  let list = base.filter(matches);
  if (view !== 'terakhir') list = list.sort(SORT[F.sort] || SORT.featured);
  const grid = $('#car-grid');
  const label = { mobil: 'mobil tersedia', favorit: 'mobil favorit', terakhir: 'terakhir dilihat' }[view];
  $('#result-count').textContent = list.length;
  $('#catalog-label').textContent = label;
  $('#apply-count').textContent = list.length;
  const n = activeFilterCount();
  $('#filter-count').hidden = !n; $('#filter-count').textContent = n;
  if (!list.length) {
    grid.innerHTML = view === 'favorit' && !base.length ? '<div class="empty">Belum ada favorit. Ketuk ikon hati di kartu mobil untuk menyimpannya di sini.</div>'
      : view === 'terakhir' && !base.length ? '<div class="empty">Mobil yang kamu buka detailnya akan muncul di sini.</div>'
      : `<div class="empty">Belum ada mobil yang cocok dengan filter ini.<br><button type="button" class="link-btn" onclick="document.getElementById('reset-filters').click()">Reset filter</button> atau <a href="${waLink('Halo BuyCars, saya cari mobil yang belum ada di katalog.')}" target="_blank" rel="noopener">tanya stok lewat WhatsApp</a>.</div>`;
  } else grid.innerHTML = list.slice(0, shown).map(card).join('');
  $('#load-more').hidden = list.length <= shown;
  if (!list.some(c => String(c.id) === String(selectedId))) selectedId = list[0]?.id ?? null;
  renderMapCard();
}

// ---------------------------------------------------------------- map view
function setupMap() {
  const btn = $('#map-toggle'), body = $('.catalog-body'), panel = $('#map-panel');
  body.id = 'catalog-body';
  btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(on));
    $('span', btn).textContent = on ? 'Sembunyikan peta' : 'Tampilkan peta';
    body.classList.toggle('with-map', on);
    panel.hidden = !on;
    if (on && !$('#map-catalog').src) $('#map-catalog').src = mapSrc();
    renderCars();
  });
}
function renderMapCard() {
  const box = $('#map-card');
  const c = cars.find(x => String(x.id) === String(selectedId));
  if (!box || !c) { if (box) box.innerHTML = ''; return; }
  box.innerHTML = `<img src="${esc(c.image)}" alt="">
    <div><h3>${esc(nameOf(c))}</h3><p>${esc(specOf(c))}</p></div>
    <p>Bisa dilihat di showroom ${esc(CFG.city)}</p>
    <button type="button" class="btn btn-primary btn-sm" data-book="${c.id}">Booking <span>${short(c.price)}</span></button>`;
}

// ---------------------------------------------------------------- favourites + recents
function toggleFav(id) {
  id = String(id);
  favs.has(id) ? favs.delete(id) : favs.add(id);
  store.set('buycars-fav', [...favs]);
  const on = favs.has(id);
  $$(`[data-fav="${id}"]`).forEach(b => { b.setAttribute('aria-pressed', String(on)); $('use', b).setAttribute('href', on ? '#i-heart-fill' : '#i-heart'); });
  updateFavCount();
  toast(on ? 'Disimpan ke favorit' : 'Dihapus dari favorit');
  if (view === 'favorit') renderCars();
}
function updateFavCount() { const n = favs.size; $('#fav-count').hidden = !n; $('#fav-count').textContent = n; }
function remember(id) {
  id = String(id);
  recent = [id, ...recent.filter(x => x !== id)].slice(0, 8);
  store.set('buycars-recent', recent);
}

// ---------------------------------------------------------------- detail drawer
function openDetail(id, push = true) {
  const c = cars.find(x => String(x.id) === String(id));
  if (!c) return;
  selectedId = c.id;
  remember(c.id);
  const fav = favs.has(String(c.id));
  const plans = [
    { k: 'cash', label: 'Tunai', value: short(c.price), note: 'harga di showroom' },
    { k: '36', label: 'Kredit 3 th', value: short(monthly(c.price, 30, 36, 5.5).monthly), note: 'per bulan · DP 30%', tag: '' },
    { k: '60', label: 'Kredit 5 th', value: short(monthly(c.price, 30, 60, 5.5).monthly), note: 'per bulan · DP 30%' },
  ];
  $('#drawer-body').innerHTML = `
    <div class="drawer-scroll">
      <div class="drawer-top">
        <button type="button" class="icon-btn" data-close aria-label="Tutup"><svg><use href="#i-x"/></svg></button>
        <button type="button" class="fav" data-fav="${c.id}" aria-pressed="${fav}" aria-label="${fav ? 'Hapus dari' : 'Simpan ke'} favorit"><svg><use href="#i-heart${fav ? '-fill' : ''}"/></svg></button>
      </div>
      <div class="drawer-media"><img src="${esc(c.image)}" alt="${esc(nameOf(c))} warna ${esc(c.color)}"></div>
      <div class="drawer-title">
        <div><h2 id="drawer-title">${esc(nameOf(c))}</h2><p>${c.year} · ${esc(specOf(c))}</p></div>
        <div class="price">${short(c.price)}<small>${rupiah(c.price)}</small></div>
      </div>
      <div class="d-tabs" role="tablist">
        <button type="button" role="tab" class="d-tab" aria-selected="true" data-pane="info">Info</button>
        <button type="button" role="tab" class="d-tab" aria-selected="false" data-pane="spec">Spesifikasi</button>
        <button type="button" role="tab" class="d-tab" aria-selected="false" data-pane="credit">Kredit</button>
        <button type="button" role="tab" class="d-tab" aria-selected="false" data-pane="loc">Lokasi</button>
      </div>
      <div class="d-pane" data-pane="info" role="tabpanel">
        <p>${esc(c.description || 'Hubungi kami untuk detail lengkap mobil ini.')}</p>
        <div class="tiles">${plans.map((p, i) => `<div class="tile${i === 1 ? ' on' : ''}"><span>${p.label}</span><b>${p.value}</b><small>${p.note}</small></div>`).join('')}</div>
        <p class="note">Contoh cicilan dengan bunga flat 5,5% per tahun. Angka final mengikuti leasing.</p>
      </div>
      <div class="d-pane" data-pane="spec" role="tabpanel" hidden>
        <dl class="spec-table">
          <div><dt>Tahun</dt><dd>${c.year}</dd></div>
          <div><dt>Kilometer</dt><dd>${Number(c.mileage_km).toLocaleString('id-ID')} km</dd></div>
          <div><dt>Kondisi</dt><dd>${c.condition === 'baru' ? 'Baru' : 'Bekas'}</dd></div>
          <div><dt>Tipe</dt><dd>${LABEL.body[c.body_type] || esc(c.body_type)}</dd></div>
          <div><dt>Mesin</dt><dd>${esc(c.engine || '–')}</dd></div>
          <div><dt>Tenaga</dt><dd>${c.power_hp ? c.power_hp + ' hp' : '–'}</dd></div>
          <div><dt>Transmisi</dt><dd>${LABEL.trans[c.transmission] || esc(c.transmission)}</dd></div>
          <div><dt>Bahan bakar</dt><dd>${LABEL.fuel[c.fuel] || esc(c.fuel)}</dd></div>
          <div><dt>Kursi</dt><dd>${c.seats}</dd></div>
          <div><dt>Warna</dt><dd>${esc(c.color)}</dd></div>
        </dl>
      </div>
      <div class="d-pane" data-pane="credit" role="tabpanel" hidden>
        <div class="tiles">${[24, 36, 60].map(m => { const r = monthly(c.price, 30, m, 5.5); return `<div class="tile"><span>${m / 12} tahun</span><b>${short(r.monthly)}</b><small>per bulan</small></div>`; }).join('')}</div>
        <div class="calc-row"><span>Uang muka 30%</span><b>${rupiah(c.price * 0.3)}</b></div>
        <button type="button" class="btn btn-ghost" data-credit="${c.id}"><svg><use href="#i-card"/></svg> Atur DP dan tenor sendiri</button>
      </div>
      <div class="d-pane" data-pane="loc" role="tabpanel" hidden>
        <div class="d-map"><iframe class="map" title="Lokasi showroom" loading="lazy" data-src="${esc(mapSrc())}"></iframe></div>
        <p>Mobil ini ada di showroom ${esc(CFG.city)}. Jam buka ${esc(CFG.hours)}.</p>
      </div>
    </div>
    <div class="drawer-bar">
      <button type="button" class="btn btn-primary" data-book="${c.id}"><span>Booking test drive</span><span>Gratis</span></button>
      <a class="icon-btn" target="_blank" rel="noopener" aria-label="Tanya lewat WhatsApp" href="${waLink(`Halo BuyCars, saya tertarik dengan ${nameOf(c)} ${c.year} (${rupiah(c.price)}). Apakah masih tersedia?`)}"><svg><use href="#i-wa"/></svg></a>
    </div>`;
  const d = $('#car-drawer');
  if (!d.open) d.showModal();
  $('.drawer-scroll', d).scrollTop = 0;
  if (push && VIEWS[view] === 'view-catalog') history.replaceState(null, '', `#${view}/${c.slug || c.id}`);
  if (VIEWS[view] === 'view-catalog') renderMapCard();
}
function setupDrawer() {
  const d = $('#car-drawer');
  d.addEventListener('click', e => {
    if (e.target === d || e.target.closest('[data-close]')) d.close();
    const tab = e.target.closest('.d-tab');
    if (tab) {
      $$('.d-tab', d).forEach(t => t.setAttribute('aria-selected', String(t === tab)));
      $$('.d-pane', d).forEach(p => { p.hidden = p.dataset.pane !== tab.dataset.pane; });
      const fr = $(`.d-pane[data-pane="${tab.dataset.pane}"] iframe[data-src]`, d);
      if (fr && !fr.src) fr.src = fr.dataset.src;
    }
  });
  d.addEventListener('close', () => { if (location.hash.includes('/')) history.replaceState(null, '', `#${view}`); });
}

function bookCar(id) {
  if ($('#car-drawer').open) $('#car-drawer').close();
  location.hash = 'kontak';
  showTab('drive');
  const f = $('#booking-form');
  f.car_id.value = id;
  setTimeout(() => f.name.focus(), 80);
}
function creditCar(id) {
  if ($('#car-drawer').open) $('#car-drawer').close();
  location.hash = 'kredit';
  const f = $('#calc');
  f.car.value = id; f.car.dispatchEvent(new Event('change', { bubbles: true }));
}

// ---------------------------------------------------------------- credit calculator
const digits = s => Number(String(s).replace(/[^\d]/g, '')) || 0;
function setupCalc() {
  const f = $('#calc');
  f.car.insertAdjacentHTML('beforeend', cars.map(c => `<option value="${c.id}">${esc(nameOf(c))} · ${c.year}</option>`).join(''));
  const calc = () => {
    const price = digits(f.price.value), dp = Number(f.dp.value), months = Number(f.tenor.value), rate = Math.max(0, Number(f.rate.value) || 0);
    $('#dp-out').textContent = dp + '%';
    if (!price) { ['monthly', 'dp', 'loan', 'interest'].forEach(k => { $('#out-' + k).textContent = '–'; }); return null; }
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
    if (c) f.price.value = c.price.toLocaleString('id-ID');
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
let reviewsLoaded = false;
async function loadReviews() {
  if (reviewsLoaded) return; reviewsLoaded = true;
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

// ---------------------------------------------------------------- home stats + featured
function homeExtras() {
  const avail = cars.filter(c => !c.status || c.status === 'tersedia');
  $('[data-stat="count"]').textContent = avail.length;
  $('[data-stat="brands"]').textContent = new Set(cars.map(c => c.brand)).size;
  $('[data-stat="from"]').textContent = avail.length ? short(Math.min(...avail.map(c => c.price))) : '–';
  const feat = cars.filter(c => c.is_featured).slice(0, 4);
  $('#featured-row').innerHTML = (feat.length ? feat : cars.slice(0, 4)).map(card).join('');
}

// ---------------------------------------------------------------- clicks
function setupClicks() {
  document.addEventListener('click', e => {
    const f = e.target.closest('[data-fav]'); if (f) { toggleFav(f.dataset.fav); return; }
    const d = e.target.closest('[data-detail]');
    if (d) {
      // in map view the first click selects the car on the map, the second opens it
      if ($('#catalog-body').classList.contains('with-map') && String(selectedId) !== d.dataset.detail && d.closest('#car-grid')) {
        selectedId = d.dataset.detail;
        $$('#car-grid .car-card').forEach(c => c.classList.toggle('selected', c.dataset.id === selectedId));
        renderMapCard();
        return;
      }
      openDetail(d.dataset.detail);
    }
    const b = e.target.closest('[data-book]'); if (b) bookCar(b.dataset.book);
    const c = e.target.closest('[data-credit]'); if (c) creditCar(c.dataset.credit);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeFilters(); });
}

// ---------------------------------------------------------------- boot
async function boot() {
  applyConfig();
  setupClicks();
  setupDrawer();
  setupMap();
  updateFavCount();
  $('#map').src = mapSrc();
  await api.connect();
  const badge = $('#mode-badge');
  badge.textContent = api.online() ? 'Server aktif' : 'Mode demo';
  badge.title = api.online() ? 'Katalog dan form memakai database.' : 'Katalog memakai data bawaan; form dikirim lewat WhatsApp.';
  badge.classList.toggle('live', api.online());
  $('#admin-link').hidden = !api.online();
  try { cars = await api.cars(); } catch { cars = []; }
  cars.forEach(c => { c.price = Number(c.price); c.year = Number(c.year); c.mileage_km = Number(c.mileage_km); c.is_featured = Number(c.is_featured); c.seats = Number(c.seats); });
  setupFilters();
  setupCalc();
  setupForms();
  homeExtras();
  addEventListener('hashchange', route);
  view = null;
  route();
}
boot();
