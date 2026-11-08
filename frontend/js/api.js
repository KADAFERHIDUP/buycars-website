/* Penghubung ke backend CodeIgniter (opsional). Tanpa backend, semua fungsi tetap jalan dari data bawaan. */
const CFG = window.BUYCARS || {};
let base = null;          // URL API yang aktif, atau '' kalau mode tanpa server
let staticCars = null;

async function probe(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 2500);
  try {
    const r = await fetch(url.replace(/\/$/, '') + '/health', { signal: ctrl.signal, cache: 'no-store' });
    if (!r.ok) return false;
    const j = await r.json();
    return j && j.ok === true;
  } catch { return false; } finally { clearTimeout(t); }
}

export async function connect() {
  if (base !== null) return base;
  const want = CFG.api === undefined ? 'auto' : CFG.api;
  if (want === 'auto') base = (location.protocol.startsWith('http') && await probe(new URL('api', location.href).href)) ? new URL('api', location.href).href.replace(/\/$/, '') : '';
  else if (want) base = (await probe(want)) ? want.replace(/\/$/, '') : '';
  else base = '';
  return base;
}
export const online = () => !!base;

async function call(path, opts = {}) {
  const r = await fetch(base + path, { headers: { Accept: 'application/json', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) }, ...opts });
  let j = null;
  try { j = await r.json(); } catch { /* not json */ }
  if (!r.ok) {
    const e = new Error((j && (j.message || (j.messages && Object.values(j.messages)[0]))) || `Server menjawab ${r.status}`);
    e.status = r.status; e.fields = j && j.errors; throw e;
  }
  return j;
}

async function loadStatic() {
  if (!staticCars) staticCars = fetch('data/cars.json').then(r => r.json()).then(j => j.cars);
  return staticCars;
}

/** Semua mobil (katalog difilter di browser supaya terasa instan). */
export async function cars() {
  if (base) {
    try { const j = await call('/cars?per_page=200'); return j.data; } catch { /* fall back */ }
  }
  return loadStatic();
}
export const reviews = async () => base ? (await call('/reviews')).data : [];
export const book = data => call('/bookings', { method: 'POST', body: JSON.stringify(data) });
export const inquire = data => call('/inquiries', { method: 'POST', body: JSON.stringify(data) });
export const subscribe = email => call('/subscribe', { method: 'POST', body: JSON.stringify({ email }) });
export const review = data => call('/reviews', { method: 'POST', body: JSON.stringify(data) });
