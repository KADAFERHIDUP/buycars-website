<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <title><?= esc($title) ?> · <?= esc(config('Showroom')->name) ?></title>
    <link rel="stylesheet" href="<?= base_url('css/admin.css') ?>">
</head>
<body class="login-page">
    <form class="login card" method="post" action="<?= site_url('admin/login') ?>">
        <?= csrf_field() ?>
        <a href="<?= base_url('/') ?>" class="brand"><span class="mark">B</span><span>Buy<b>Cars</b></span></a>
        <h1>Masuk ke panel admin</h1>
        <?php if (session('error')): ?><div class="alert err"><?= esc(session('error')) ?></div><?php endif ?>
        <?php if (session('success')): ?><div class="alert ok"><?= esc(session('success')) ?></div><?php endif ?>
        <label>Email<input type="email" name="email" value="<?= esc(old('email')) ?>" required autocomplete="username"></label>
        <label>Password<input type="password" name="password" required autocomplete="current-password"></label>
        <button class="btn primary" type="submit">Masuk</button>
        <a class="muted" href="<?= base_url('/') ?>">← Kembali ke website</a>
    </form>
</body>
</html>
