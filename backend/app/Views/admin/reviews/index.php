<?= $this->extend('admin/layout') ?>
<?= $this->section('content') ?>
<p class="hint">Ulasan dari pengunjung baru tampil di website setelah kamu setujui. Jangan setujui ulasan yang bukan dari pelanggan asli.</p>
<?php if (! $reviews): ?>
    <section class="card"><p class="empty">Belum ada ulasan.</p></section>
<?php endif ?>
<div class="list">
<?php foreach ($reviews as $r): ?>
    <article class="card msg <?= $r['is_approved'] ? 'read' : '' ?>">
        <header>
            <div><b><?= esc($r['name']) ?></b> <span class="stars"><?= str_repeat('★', (int) $r['rating']) . str_repeat('☆', 5 - (int) $r['rating']) ?></span>
                <?= $r['is_approved'] ? '<span class="tag s-selesai">Tampil</span>' : '<span class="tag hot">Menunggu</span>' ?><br>
                <span class="muted"><?= esc(date('d/m/Y H:i', strtotime($r['created_at']))) ?><?= $r['brand'] ? ' · ' . esc(car_name($r)) : '' ?></span></div>
            <div class="actions">
                <?php if ($r['is_approved']): ?>
                    <form method="post" action="<?= site_url("admin/ulasan/{$r['id']}/sembunyikan") ?>"><?= csrf_field() ?><button class="btn sm" type="submit">Sembunyikan</button></form>
                <?php else: ?>
                    <form method="post" action="<?= site_url("admin/ulasan/{$r['id']}/setujui") ?>"><?= csrf_field() ?><button class="btn sm primary" type="submit">Setujui</button></form>
                <?php endif ?>
                <form method="post" action="<?= site_url("admin/ulasan/{$r['id']}/hapus") ?>" onsubmit="return confirm('Hapus ulasan ini?')"><?= csrf_field() ?><button class="btn sm danger" type="submit">Hapus</button></form>
            </div>
        </header>
        <p><?= nl2br(esc($r['comment'])) ?></p>
    </article>
<?php endforeach ?>
</div>
<?= $this->endSection() ?>
