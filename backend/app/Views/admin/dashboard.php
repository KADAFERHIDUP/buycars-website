<?= $this->extend('admin/layout') ?>
<?= $this->section('content') ?>
<div class="stats">
    <a class="stat" href="<?= site_url('admin/booking?status=baru') ?>"><span>Booking baru</span><b><?= $stats['bookings'] ?></b></a>
    <a class="stat" href="<?= site_url('admin/mobil?status=tersedia') ?>"><span>Mobil tersedia</span><b><?= $stats['available'] ?></b></a>
    <div class="stat"><span>Nilai stok</span><b title="<?= rupiah($stats['stock']) ?>"><?= rupiah_short($stats['stock']) ?></b></div>
    <a class="stat" href="<?= site_url('admin/mobil?status=terjual') ?>"><span>Terjual</span><b><?= $stats['sold'] ?></b></a>
    <a class="stat" href="<?= site_url('admin/pesan') ?>"><span>Pesan belum dibaca</span><b><?= $stats['unread'] ?></b></a>
    <a class="stat" href="<?= site_url('admin/ulasan') ?>"><span>Ulasan menunggu</span><b><?= $stats['reviews'] ?></b></a>
    <a class="stat" href="<?= site_url('admin/pelanggan') ?>"><span>Newsletter</span><b><?= $stats['subs'] ?></b></a>
</div>
<section class="card">
    <div class="card-head"><h2>Test drive terdekat</h2><a href="<?= site_url('admin/booking?waktu=akan-datang') ?>">Semua →</a></div>
    <?php if (! $upcoming): ?>
        <p class="empty">Belum ada jadwal test drive.</p>
    <?php else: ?>
        <div class="table-wrap"><table>
            <thead><tr><th>Jadwal</th><th>Mobil</th><th>Pelanggan</th><th>Status</th><th></th></tr></thead>
            <tbody>
            <?php foreach ($upcoming as $b): ?>
                <tr>
                    <td><b><?= esc(tanggal($b['date'])) ?></b><br><span class="muted"><?= esc($b['time']) ?> · <?= esc($b['code']) ?></span></td>
                    <td><?= esc(car_name($b)) ?> <?= esc($b['year']) ?></td>
                    <td><?= esc($b['name']) ?><br><span class="muted"><?= esc($b['phone']) ?></span></td>
                    <td><span class="tag s-<?= esc($b['status']) ?>"><?= esc(config('Showroom')->bookingStatuses[$b['status']]) ?></span></td>
                    <td><a class="btn sm wa" target="_blank" rel="noopener" href="<?= esc(wa_url($b['phone'], "Halo {$b['name']}, kami dari " . config('Showroom')->name . ". Konfirmasi test drive {$b['code']} " . car_name($b) . ' pada ' . tanggal($b['date']) . " jam {$b['time']}.")) ?>">WhatsApp</a></td>
                </tr>
            <?php endforeach ?>
            </tbody>
        </table></div>
    <?php endif ?>
</section>
<?= $this->endSection() ?>
