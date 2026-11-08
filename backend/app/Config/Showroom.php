<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

/** Data showroom yang dipakai di panel admin dan pesan WhatsApp. */
class Showroom extends BaseConfig
{
    public string $name     = 'BuyCars';
    public string $city     = 'Lhokseumawe, Aceh';
    public string $whatsapp = '6282276078880';     // format internasional tanpa +
    public string $email    = 'umraithi769@gmail.com';

    /** Jam test drive yang bisa dipilih pelanggan. */
    public array $slots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

    /** Batas booking: mulai besok sampai sekian hari ke depan. Hari Minggu tutup. */
    public int $bookingDaysAhead = 60;

    public array $bodyTypes    = ['suv' => 'SUV', 'sedan' => 'Sedan', 'coupe' => 'Coupe', 'convertible' => 'Convertible', 'hatchback' => 'Hatchback', 'mpv' => 'MPV', 'pickup' => 'Pickup'];
    public array $fuels        = ['bensin' => 'Bensin', 'diesel' => 'Diesel', 'listrik' => 'Listrik', 'hybrid' => 'Hybrid'];
    public array $transmissions = ['otomatis' => 'Otomatis', 'manual' => 'Manual'];
    public array $conditions   = ['baru' => 'Baru', 'bekas' => 'Bekas'];
    public array $carStatuses  = ['tersedia' => 'Tersedia', 'dipesan' => 'Dipesan', 'terjual' => 'Terjual'];
    public array $bookingStatuses = ['baru' => 'Baru', 'dikonfirmasi' => 'Dikonfirmasi', 'selesai' => 'Selesai', 'batal' => 'Batal'];
    public array $subjects     = ['Tanya stok mobil', 'Tukar tambah', 'Kredit', 'Servis', 'Lainnya'];
}
