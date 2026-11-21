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

Akun admin awal diambil dari `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Isi `ADMIN_PASSWORD` sendiri sebelum menjalankan seeder (minimal 10 karakter, ada huruf dan angka), dan jangan pernah meng-commit file `.env`.

Installer menyalin isi `../frontend` ke `public/`. Kalau frontend diubah, jalankan installer lagi.

## Pengamanan

- Harga, total, dan stok selalu dihitung di server dari database. Angka kiriman browser tidak dipercaya.
- Login admin dibatasi 5 percobaan per 5 menit per IP, dengan waktu respons yang sama untuk email terdaftar maupun tidak.
- Semua kiriman API publik dibatasi per menit **dan** per hari per IP, supaya satu orang tidak bisa menghabiskan stok atau membanjiri admin dengan data palsu.
- Tidak ada password admin bawaan. `ADMIN_PASSWORD` wajib minimal 10 karakter berisi huruf dan angka; kalau dikosongkan, password acak dibuat saat seeding. Password contoh lama (misalnya `admin12345`) ditolak saat login.
- Ganti password admin kapan saja: `php spark admin:password`.
- File CSV untuk admin aman dibuka di Excel: isi yang diawali `=`, `+`, `-`, atau `@` tidak dijalankan sebagai rumus.
- Foto upload dicek isinya, diberi nama acak, dan folder upload menolak menjalankan skrip.

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
- **Mobil:** tambah, edit, hapus, upload foto (JPG/PNG/WEBP maks. 3 MB) atau tempel link foto https beserta kredit fotografer, tandai unggulan, ubah status tersedia/dipesan/terjual.
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
