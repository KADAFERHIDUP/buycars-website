<?php

if (! function_exists('rupiah')) {
    function rupiah(int|float|string|null $n): string
    {
        return 'Rp ' . number_format((float) $n, 0, ',', '.');
    }
}

if (! function_exists('rupiah_short')) {
    /** 22200000000 → Rp 22,2 M · 345000000 → Rp 345 jt */
    function rupiah_short(int|float $n): string
    {
        return $n >= 1e9 ? 'Rp ' . rtrim(rtrim(number_format($n / 1e9, 1, ',', '.'), '0'), ',') . ' M' : 'Rp ' . number_format($n / 1e6, 0, ',', '.') . ' jt';
    }
}

if (! function_exists('wa_url')) {
    /** Link WhatsApp ke nomor tertentu (08…, 62…, +62…) dengan pesan terisi. */
    function wa_url(string $phone, string $text = ''): string
    {
        $digits = preg_replace('/\D+/', '', $phone);
        if (str_starts_with($digits, '0')) {
            $digits = '62' . substr($digits, 1);
        }

        return 'https://wa.me/' . $digits . ($text !== '' ? '?text=' . rawurlencode($text) : '');
    }
}

if (! function_exists('normalize_phone')) {
    /** 0812-3456 7890 → 081234567890. Mengembalikan null kalau bukan nomor HP Indonesia. */
    function normalize_phone(?string $phone): ?string
    {
        $p = preg_replace('/[\s\-().]/', '', (string) $phone);
        if (str_starts_with($p, '+62')) {
            $p = '0' . substr($p, 3);
        } elseif (str_starts_with($p, '62')) {
            $p = '0' . substr($p, 2);
        }

        return preg_match('/^08\d{7,12}$/', $p) ? $p : null;
    }
}

if (! function_exists('car_name')) {
    function car_name(array $car): string
    {
        return trim($car['brand'] . ' ' . $car['model'] . ' ' . ($car['variant'] ?? ''));
    }
}

if (! function_exists('car_image_url')) {
    function car_image_url(?string $path): string
    {
        if (! $path) {
            return base_url('images/cars/placeholder.webp');
        }

        return preg_match('#^https?://#', $path) ? $path : base_url($path);
    }
}

if (! function_exists('tanggal')) {
    /** 2026-11-09 → Senin, 9 November 2026 */
    function tanggal(string $date, bool $withDay = true): string
    {
        $days   = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        $months = [1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        $t      = strtotime($date);

        return ($withDay ? $days[(int) date('w', $t)] . ', ' : '') . date('j', $t) . ' ' . $months[(int) date('n', $t)] . ' ' . date('Y', $t);
    }
}
