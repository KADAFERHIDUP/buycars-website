<?= $this->extend('admin/layout') ?>
<?= $this->section('content') ?>
<?php $cfg = config('Showroom'); ?>
<div class="toolbar">
    <form method="get" class="filters">
        <input type="search" name="q" value="<?= esc($q) ?>" placeholder="Cari merek atau model">
        <select name="status" onchange="this.form.submit()">
            <option value="">Semua status</option>
            <?php foreach ($cfg->carStatuses as $k => $v): ?><option value="<?= $k ?>" <?= $status === $k ? 'selected' : '' ?>><?= $v ?></option><?php endforeach ?>
        </select>
        <button class="btn" type="submit">Cari</button>
    </form>
    <a class="btn primary" href="<?= site_url('admin/mobil/tambah') ?>">+ Tambah mobil</a>
</div>
<section class="card">
<?php if (! $cars): ?>
    <p class="empty">Belum ada mobil.</p>
<?php else: ?>
    <div class="table-wrap"><table>
        <thead><tr><th>Mobil</th><th>Harga</th><th>Kondisi</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>
        <?php foreach ($cars as $c): ?>
            <tr>
                <td class="car-cell"><img src="<?= esc(car_image_url($c['image'])) ?>" alt=""><div><b><?= esc(car_name($c)) ?></b><br><span class="muted"><?= esc($c['year']) ?> · <?= number_format((int) $c['mileage_km'], 0, ',', '.') ?> km · <?= esc($c['color']) ?></span><?php if ($c['is_featured']): ?> <span class="tag hot">Unggulan</span><?php endif ?></div></td>
                <td><?= rupiah($c['price']) ?></td>
                <td><?= esc($cfg->conditions[$c['condition']] ?? $c['condition']) ?></td>
                <td>
                    <form method="post" action="<?= site_url("admin/mobil/{$c['id']}/status") ?>"><?= csrf_field() ?>
                        <select name="status" class="s-<?= esc($c['status']) ?>" onchange="this.form.submit()" aria-label="Status <?= esc(car_name($c)) ?>">
                            <?php foreach ($cfg->carStatuses as $k => $v): ?><option value="<?= $k ?>" <?= $c['status'] === $k ? 'selected' : '' ?>><?= $v ?></option><?php endforeach ?>
                        </select>
                    </form>
                </td>
                <td><div class="actions">
                    <a class="btn sm" href="<?= site_url("admin/mobil/{$c['id']}/edit") ?>">Edit</a>
                    <form method="post" action="<?= site_url("admin/mobil/{$c['id']}/unggulan") ?>"><?= csrf_field() ?><button class="btn sm" type="submit"><?= $c['is_featured'] ? '★ Lepas' : '☆ Unggulkan' ?></button></form>
                    <form method="post" action="<?= site_url("admin/mobil/{$c['id']}/hapus") ?>" onsubmit="return confirm('Hapus <?= esc(car_name($c), 'js') ?>? Booking untuk mobil ini ikut terhapus.')"><?= csrf_field() ?><button class="btn sm danger" type="submit">Hapus</button></form>
                </div></td>
            </tr>
        <?php endforeach ?>
        </tbody>
    </table></div>
<?php endif ?>
</section>
<?= $this->endSection() ?>
