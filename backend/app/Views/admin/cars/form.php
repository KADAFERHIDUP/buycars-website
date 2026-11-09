<?= $this->extend('admin/layout') ?>
<?= $this->section('content') ?>
<?php
$cfg = config('Showroom');
$v   = static fn (string $k, $d = '') => old($k, $car[$k] ?? $d);
$sel = static function (string $name, array $opts, $current) {
    $h = '<select name="' . $name . '" required>';
    foreach ($opts as $k => $label) {
        $h .= '<option value="' . esc($k) . '"' . ((string) $current === (string) $k ? ' selected' : '') . '>' . esc($label) . '</option>';
    }

    return $h . '</select>';
};
?>
<form class="card form" method="post" enctype="multipart/form-data" action="<?= $car ? site_url("admin/mobil/{$car['id']}") : site_url('admin/mobil') ?>">
    <?= csrf_field() ?>
    <div class="grid">
        <label>Merek<input name="brand" value="<?= esc($v('brand')) ?>" required maxlength="60" placeholder="Toyota"></label>
        <label>Model<input name="model" value="<?= esc($v('model')) ?>" required maxlength="60" placeholder="Fortuner"></label>
        <label>Varian<input name="variant" value="<?= esc($v('variant')) ?>" maxlength="80" placeholder="2.8 VRZ"></label>
        <label>Tahun<input name="year" type="number" min="1950" max="<?= date('Y') + 1 ?>" value="<?= esc($v('year', date('Y'))) ?>" required></label>
        <label>Harga (Rp)<input name="price" inputmode="numeric" value="<?= esc($v('price')) ?>" required placeholder="550000000"></label>
        <label>Kilometer<input name="mileage_km" inputmode="numeric" value="<?= esc($v('mileage_km', 0)) ?>"></label>
        <label>Kondisi<?= $sel('condition', $cfg->conditions, $v('condition', 'bekas')) ?></label>
        <label>Tipe bodi<?= $sel('body_type', $cfg->bodyTypes, $v('body_type', 'suv')) ?></label>
        <label>Transmisi<?= $sel('transmission', $cfg->transmissions, $v('transmission', 'otomatis')) ?></label>
        <label>Bahan bakar<?= $sel('fuel', $cfg->fuels, $v('fuel', 'bensin')) ?></label>
        <label>Mesin<input name="engine" value="<?= esc($v('engine')) ?>" maxlength="80" placeholder="2.0L turbo"></label>
        <label>Tenaga (hp)<input name="power_hp" type="number" min="1" value="<?= esc($v('power_hp')) ?>"></label>
        <label>Jumlah kursi<input name="seats" type="number" min="1" max="19" value="<?= esc($v('seats', 5)) ?>" required></label>
        <label>Warna<input name="color" value="<?= esc($v('color')) ?>" required maxlength="40"></label>
        <label>Status<?= $sel('status', $cfg->carStatuses, $v('status', 'tersedia')) ?></label>
        <label class="check"><input type="checkbox" name="is_featured" value="1" <?= $v('is_featured') ? 'checked' : '' ?>> Tampilkan sebagai unggulan</label>
        <label class="full">Deskripsi<textarea name="description" rows="4" maxlength="2000"><?= esc($v('description')) ?></textarea></label>
        <div class="full photo">
            <?php if ($car && $car['image']): ?><img src="<?= esc(car_image_url($car['image'])) ?>" alt=""><?php endif ?>
            <label>Foto mobil <?= $car ? '(kosongkan kalau tidak diganti)' : '' ?><input type="file" name="image" accept="image/jpeg,image/png,image/webp"></label>
            <p class="muted">JPG, PNG, atau WEBP, maksimal 3 MB. Paling bagus foto landscape dengan mobil menghadap serong.</p>
        </div>
        <label class="full">Atau link foto (https)<input name="image_url" type="url" value="<?= esc(old('image_url', $car && preg_match('#^https://#', (string) $car['image']) ? $car['image'] : '')) ?>" maxlength="255" placeholder="https://images.unsplash.com/photo-..."></label>
        <label>Kredit foto<input name="image_credit" value="<?= esc($v('image_credit')) ?>" maxlength="80" placeholder="Nama fotografer"></label>
        <label>Link kredit foto<input name="image_credit_url" type="url" value="<?= esc($v('image_credit_url')) ?>" maxlength="255" placeholder="https://unsplash.com/@nama"></label>
    </div>
    <div class="form-foot">
        <a class="btn" href="<?= site_url('admin/mobil') ?>">Batal</a>
        <button class="btn primary" type="submit"><?= $car ? 'Simpan perubahan' : 'Tambah mobil' ?></button>
    </div>
</form>
<?= $this->endSection() ?>
