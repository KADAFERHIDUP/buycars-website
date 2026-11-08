<?= $this->extend('admin/layout') ?>
<?= $this->section('content') ?>
<?php $labels = config('Showroom')->bookingStatuses; ?>
<div class="toolbar">
    <nav class="tabs">
        <a class="<?= $status === '' && $when === '' ? 'active' : '' ?>" href="<?= site_url('admin/booking') ?>">Semua</a>
        <a class="<?= $when === 'akan-datang' ? 'active' : '' ?>" href="<?= site_url('admin/booking?waktu=akan-datang') ?>">Akan datang</a>
        <?php foreach ($labels as $k => $l): ?><a class="<?= $status === $k ? 'active' : '' ?>" href="<?= site_url('admin/booking?status=' . $k) ?>"><?= $l ?></a><?php endforeach ?>
    </nav>
</div>
<section class="card">
<?php if (! $bookings): ?>
    <p class="empty">Belum ada booking.</p>
<?php else: ?>
    <div class="table-wrap"><table>
        <thead><tr><th>Kode</th><th>Jadwal</th><th>Mobil</th><th>Pelanggan</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>
        <?php foreach ($bookings as $b): ?>
            <tr>
                <td><b><?= esc($b['code']) ?></b><br><span class="muted">masuk <?= esc(date('d/m H:i', strtotime($b['created_at']))) ?></span></td>
                <td><?= esc(tanggal($b['date'])) ?><br><span class="muted">jam <?= esc($b['time']) ?></span></td>
                <td><?= $b['brand'] ? esc(car_name($b) . ' ' . $b['year']) : '<span class="muted">mobil dihapus</span>' ?></td>
                <td><?= esc($b['name']) ?><br><span class="muted"><?= esc($b['phone']) ?><?= $b['email'] ? ' · ' . esc($b['email']) : '' ?></span><?php if ($b['notes']): ?><br><em class="note">“<?= esc($b['notes']) ?>”</em><?php endif ?></td>
                <td>
                    <form method="post" action="<?= site_url("admin/booking/{$b['id']}/status") ?>"><?= csrf_field() ?>
                        <select name="status" class="s-<?= esc($b['status']) ?>" onchange="this.form.submit()" aria-label="Status <?= esc($b['code']) ?>">
                            <?php foreach ($labels as $k => $l): ?><option value="<?= $k ?>" <?= $b['status'] === $k ? 'selected' : '' ?>><?= $l ?></option><?php endforeach ?>
                        </select>
                    </form>
                </td>
                <td><div class="actions">
                    <a class="btn sm wa" target="_blank" rel="noopener" href="<?= esc(wa_url($b['phone'], "Halo {$b['name']}, kami dari " . config('Showroom')->name . ". Test drive {$b['code']}" . ($b['brand'] ? ' ' . car_name($b) : '') . ' pada ' . tanggal($b['date']) . " jam {$b['time']} sudah kami terima.")) ?>">WhatsApp</a>
                    <form method="post" action="<?= site_url("admin/booking/{$b['id']}/hapus") ?>" onsubmit="return confirm('Hapus booking <?= esc($b['code'], 'js') ?>?')"><?= csrf_field() ?><button class="btn sm danger" type="submit">Hapus</button></form>
                </div></td>
            </tr>
        <?php endforeach ?>
        </tbody>
    </table></div>
<?php endif ?>
</section>
<?= $this->endSection() ?>
