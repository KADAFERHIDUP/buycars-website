<?php
$admin   = session('admin');
$db      = db_connect();
$badge   = [
    'booking' => $db->table('bookings')->where('status', 'baru')->countAllResults(),
    'pesan'   => $db->table('inquiries')->where('is_read', 0)->countAllResults(),
    'ulasan'  => $db->table('reviews')->where('is_approved', 0)->countAllResults(),
];
$path = uri_string();
$nav  = [
    ['admin', 'Dashboard', 'M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z', null],
    ['admin/booking', 'Booking', 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z', 'booking'],
    ['admin/mobil', 'Mobil', 'M5 17h14M3 13l2-6h14l2 6v4H3zM7 17v2M17 17v2', null],
    ['admin/pesan', 'Pesan', 'M4 5h16v12H8l-4 4z', 'pesan'],
    ['admin/ulasan', 'Ulasan', 'M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4 6.8 19.2l1-5.9-4.3-4.1 5.9-.8z', 'ulasan'],
    ['admin/pelanggan', 'Newsletter', 'M3 6h18v12H3zM3 6l9 7 9-7', null],
];
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <title><?= esc($title ?? 'Admin') ?> · Admin <?= esc(config('Showroom')->name) ?></title>
    <link rel="stylesheet" href="<?= base_url('css/admin.css') ?>">
</head>
<body>
<div class="admin">
    <aside class="sidebar" id="sidebar">
        <a href="<?= site_url('admin') ?>" class="brand"><span class="mark">B</span><span>Buy<b>Cars</b></span> <small>admin</small></a>
        <nav>
            <?php foreach ($nav as [$url, $label, $icon, $key]): $on = $url === 'admin' ? $path === 'admin' : str_starts_with($path, $url); ?>
                <a href="<?= site_url($url) ?>" class="<?= $on ? 'active' : '' ?>"><svg viewBox="0 0 24 24"><path d="<?= $icon ?>"/></svg><?= $label ?><?php if ($key && $badge[$key]): ?><span class="pill"><?= $badge[$key] ?></span><?php endif ?></a>
            <?php endforeach ?>
        </nav>
        <div class="sidebar-foot">
            <a href="<?= base_url('/') ?>" target="_blank" rel="noopener">↗ Lihat website</a>
            <a href="<?= site_url('admin/logout') ?>">⎋ Logout</a>
        </div>
    </aside>
    <main class="main">
        <header class="topbar">
            <button type="button" class="menu-toggle" aria-label="Buka menu" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>
            <h1><?= esc($title ?? 'Admin') ?></h1>
            <span class="who"><?= esc($admin['name'] ?? '') ?></span>
        </header>
        <?php if (session('success')): ?><div class="alert ok"><?= session('success') ?></div><?php endif ?>
        <?php if (session('error')): ?><div class="alert err"><?= esc(session('error')) ?></div><?php endif ?>
        <?php if (session('errors')): ?><div class="alert err"><ul><?php foreach ((array) session('errors') as $e): ?><li><?= esc($e) ?></li><?php endforeach ?></ul></div><?php endif ?>
        <?= $this->renderSection('content') ?>
    </main>
</div>
</body>
</html>
