# BuyCars Backend (CodeIgniter 4 + MySQL)

REST API untuk website dan panel admin showroom.

## Yang dibutuhkan
- PHP 8.1+ dengan ekstensi `intl`, `mbstring`, `mysqlnd` (sudah ada di XAMPP/Laragon)
- MySQL / MariaDB
- [Composer](https://getcomposer.org/download/)

## Cara menjalankan

```bash
cd backend
install.bat            # Windows (atau ./install.sh di Linux/Mac)
php spark db:create buycars_db
php spark migrate
php spark db:seed DatabaseSeeder
php spark serve
```

Buka http://localhost:8080 untuk website (sudah terhubung ke database) dan http://localhost:8080/admin untuk panel admin.

Akun admin awal diambil dari `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). **Ganti `ADMIN_PASSWORD` sebelum menjalankan seeder**, dan jangan pernah meng-commit file `.env`.

Installer menyalin isi `../frontend` ke `public/`. Kalau frontend diubah, jalankan installer lagi.

## API

Semua respons berformat JSON. Form publik dilindungi batas jumlah kiriman per IP dan kolom jebakan anti-spam.

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/health` | Cek server |
| GET | `/api/cars` | Katalog. Filter: `q`, `brand`, `body`, `fuel`, `transmission`, `condition`, `min`, `max`, `sort` (`featured`, `price_asc`, `price_desc`, `year_desc`, `km_asc`, `newest`), `page`, `per_page` (maks. 200). Mobil terjual tidak ikut |
| GET | `/api/cars/{slug atau id}` | Detail satu mobil |
| POST | `/api/bookings` | `car_id, name, phone, date (Y-m-d), time, email?, notes?`. Tanggal mulai besok s.d. 60 hari, bukan Minggu. Jam yang sudah dibooking ditolak. Respons: kode booking + link WhatsApp |
| POST | `/api/inquiries` | `name, email, phone?, subject, message, car_id?` |
| POST | `/api/subscribe` | `email` |
| GET | `/api/reviews` | 12 ulasan terbaru yang sudah disetujui |
| POST | `/api/reviews` | `name, rating (1–5), comment, car_id?`. Masuk antrean moderasi |

Kalau frontend dibuka dari alamat lain (misalnya GitHub Pages), tambahkan alamat itu ke `CORS_ORIGINS` di `.env`, lalu isi `api` di `frontend/js/config.js` dengan alamat backend.

## Panel admin (`/admin`)

- **Dashboard:** booking baru, mobil tersedia, nilai stok, pesan belum dibaca, ulasan menunggu, dan jadwal test drive terdekat.
- **Booking:** filter per status atau jadwal mendatang, ubah status (baru → dikonfirmasi → selesai/batal), dan tombol WhatsApp untuk konfirmasi ke pelanggan.
- **Mobil:** tambah, edit, hapus, upload foto (JPG/PNG/WEBP maks. 3 MB), tandai unggulan, ubah status tersedia/dipesan/terjual.
- **Pesan:** pesan dari form kontak, balas lewat email/WhatsApp, tandai dibaca.
- **Ulasan:** setujui, sembunyikan, atau hapus.
- **Newsletter:** daftar email dan unduh CSV.

Semua halaman admin wajib login. Setiap form admin dicek token CSRF, dan login dibatasi 5 percobaan per menit per IP.

## Database

| Tabel | Isi |
|---|---|
| `users` | Akun admin (password di-hash) |
| `cars` | Katalog mobil |
| `bookings` | Booking test drive (kode unik, status) |
| `inquiries` | Pesan dari form kontak |
| `subscribers` | Email newsletter |
| `reviews` | Ulasan pelanggan (perlu persetujuan) |
