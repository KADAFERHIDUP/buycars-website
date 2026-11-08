<?= $this->extend('admin/layout') ?>
<?= $this->section('content') ?>
<?php if (! $messages): ?>
    <section class="card"><p class="empty">Belum ada pesan.</p></section>
<?php endif ?>
<div class="list">
<?php foreach ($messages as $m): ?>
    <article class="card msg <?= $m['is_read'] ? 'read' : '' ?>">
        <header>
            <div><b><?= esc($m['name']) ?></b> <span class="tag"><?= esc($m['subject']) ?></span><?php if (! $m['is_read']): ?> <span class="tag hot">Baru</span><?php endif ?><br>
                <span class="muted"><a href="mailto:<?= esc($m['email']) ?>"><?= esc($m['email']) ?></a><?= $m['phone'] ? ' · ' . esc($m['phone']) : '' ?> · <?= esc(date('d/m/Y H:i', strtotime($m['created_at']))) ?><?= $m['brand'] ? ' · ' . esc(car_name($m)) : '' ?></span></div>
            <div class="actions">
                <?php if ($m['phone']): ?><a class="btn sm wa" target="_blank" rel="noopener" href="<?= esc(wa_url($m['phone'], "Halo {$m['name']}, terima kasih sudah menghubungi " . config('Showroom')->name . '.')) ?>">WhatsApp</a><?php endif ?>
                <a class="btn sm" href="mailto:<?= esc($m['email']) ?>?subject=<?= rawurlencode('Re: ' . $m['subject']) ?>">Balas email</a>
                <?php if (! $m['is_read']): ?><form method="post" action="<?= site_url("admin/pesan/{$m['id']}/dibaca") ?>"><?= csrf_field() ?><button class="btn sm" type="submit">Tandai dibaca</button></form><?php endif ?>
                <form method="post" action="<?= site_url("admin/pesan/{$m['id']}/hapus") ?>" onsubmit="return confirm('Hapus pesan ini?')"><?= csrf_field() ?><button class="btn sm danger" type="submit">Hapus</button></form>
            </div>
        </header>
        <p><?= nl2br(esc($m['message'])) ?></p>
    </article>
<?php endforeach ?>
</div>
<?= $this->endSection() ?>
