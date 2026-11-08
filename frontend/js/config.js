/* Pengaturan website BuyCars.
 * api: 'auto'  → kalau halaman dibuka dari server CodeIgniter (backend/), katalog & form memakai database.
 *               Kalau dibuka dari GitHub Pages / file biasa, website memakai data bawaan dan form dikirim lewat WhatsApp.
 * api: 'https://domain-backend/api' → paksa memakai backend di alamat lain.
 * api: ''      → selalu mode tanpa server. */
window.BUYCARS = {
  api: 'auto',
  name: 'BuyCars',
  city: 'Lhokseumawe, Aceh',
  whatsapp: '6282276078880',
  phoneDisplay: '0822-7607-8880',
  email: 'umraithi769@gmail.com',
  mapsQuery: 'Lhokseumawe, Aceh',
  hours: 'Senin–Sabtu, 09.00–17.00 WIB',
};
