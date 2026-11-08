<?= $this->extend('admin/layout') ?>
<?= $this->section('content') ?>
<div class="toolbar"><p class="hint"><?= count($subs) ?> email terdaftar.</p><a class="btn primary" href="<?= site_url('admin/pelanggan/csv') ?>">Unduh CSV</a></div>
<section class="card">
<?php if (! $subs): ?>
    <p class="empty">Belum ada yang berlangganan.</p>
<?php else: ?>
    <div class="table-wrap"><table>
        <thead><tr><th>Email</th><th>Terdaftar</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($subs as $s): ?>
            <tr><td><?= esc($s['email']) ?></td><td><?= esc(date('d/m/Y H:i', strtotime($s['created_at']))) ?></td>
                <td><div class="actions"><form method="post" action="<?= site_url("admin/pelanggan/{$s['id']}/hapus") ?>" onsubmit="return confirm('Hapus email ini dari daftar?')"><?= csrf_field() ?><button class="btn sm danger" type="submit">Hapus</button></form></div></td></tr>
        <?php endforeach ?>
        </tbody>
    </table></div>
<?php endif ?>
</section>
<?= $this->endSection() ?>
