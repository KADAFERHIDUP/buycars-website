# BuyCars: Website Showroom Mobil

Website showroom mobil baru dan bekas di Lhokseumawe, oleh **Ahmad Umraithi**. Dibagi dua bagian:

| Folder | Isi | Teknologi | Cara pakai |
|---|---|---|---|
| [`frontend/`](frontend/) | Website: mobil 3D, katalog, simulasi kredit, booking test drive, ulasan | HTML, CSS, JavaScript (ES modules), three.js | Bisa langsung online di GitHub Pages |
| [`backend/`](backend/) | REST API + panel admin dengan database | CodeIgniter 4, PHP 8.1+, MySQL | Dijalankan dengan XAMPP/Laragon, lihat [`backend/README.md`](backend/README.md) |

`index.html` di folder utama hanya mengarahkan GitHub Pages ke `frontend/`.

## Fitur

- **Mobil 3D interaktif** di halaman utama, dibuat langsung dengan three.js tanpa file model: bisa diputar dan di-zoom, ganti 7 warna cat, nyalakan lampu, mode "jalan" (roda berputar, marka jalan bergerak), dan pindah sudut kamera (depan, samping, belakang). Kalau browser tidak mendukung WebGL2, otomatis tampil foto biasa.
- **Katalog** 15 mobil dengan pencarian, filter (merek, bahan bakar, transmisi, kondisi, tipe bodi, harga maksimal), urutan, dan halaman detail berisi spesifikasi serta contoh cicilan. Kartu mobil punya efek 3D saat kursor bergerak di atasnya.
- **Simulasi kredit:** uang muka, tenor 1–5 tahun, bunga flat, lalu diajukan lewat WhatsApp.
- **Booking test drive:** tanggal mulai besok, Senin–Sabtu, dengan jam yang tersedia. Dengan backend, tersimpan di database dan mendapat kode booking. Tanpa backend, dikirim lewat WhatsApp.
- **Form kontak, newsletter, dan ulasan.** Ulasan hanya tampil setelah disetujui admin, tanpa ulasan palsu.
- **Responsif** dari HP 360 px sampai layar lebar, mendukung keyboard, dan menghormati pengaturan *reduced motion*.

## Dua mode

| | Tanpa backend (GitHub Pages) | Dengan backend (CodeIgniter) |
|---|---|---|
| Katalog | `frontend/data/cars.json` | Database, dikelola dari panel admin |
| Booking & pesan | Dikirim lewat WhatsApp | Tersimpan, muncul di panel admin |
| Ulasan & newsletter | Butuh server | Tersimpan, ulasan dimoderasi admin |

Mode dipilih otomatis (`frontend/js/config.js`, `api: 'auto'`). Kalau website dibuka dari server CodeIgniter, website memakai API; kalau tidak, memakai data bawaan. Kontak showroom (WhatsApp, email, kota) juga diatur di file itu.

## Struktur

```
frontend/
  index.html          halaman utama
  css/style.css       tampilan (tema gelap, responsif)
  js/main.js          katalog, filter, kredit, form, galeri
  js/car3d.js         mobil 3D (three.js)
  js/api.js           penghubung ke backend
  js/config.js        kontak showroom & mode API
  data/cars.json      katalog bawaan
  vendor/three/       three.js r187 (lisensi MIT)
backend/
  app/                CodeIgniter 4: API, panel admin, migrasi, seeder
  public/css/admin.css
  install.bat / install.sh
```

## Catatan

Harga, kilometer, dan spesifikasi di katalog adalah **data contoh** untuk demo showroom. Foto mobil dan galeri berasal dari file project sebelumnya.

## Kontak
- Email: umraithi769@gmail.com
- WhatsApp: 0822-7607-8880
- LinkedIn: https://www.linkedin.com/in/ahmadumraithi/
