<?php

namespace App\Models;

use CodeIgniter\Model;

class CarModel extends Model
{
    protected $table         = 'cars';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = [
        'slug', 'brand', 'model', 'variant', 'year', 'price', 'condition', 'mileage_km', 'body_type',
        'transmission', 'fuel', 'engine', 'power_hp', 'seats', 'color', 'description', 'image', 'is_featured', 'status',
    ];

    /** Bentuk data untuk API: angka sebagai angka, gambar sebagai URL lengkap. */
    public static function present(array $c): array
    {
        foreach (['id', 'year', 'price', 'mileage_km', 'power_hp', 'seats', 'is_featured'] as $k) {
            $c[$k] = $c[$k] === null ? null : (int) $c[$k];
        }
        $c['image'] = car_image_url($c['image']);
        $c['name']  = car_name($c);
        unset($c['created_at'], $c['updated_at']);

        return $c;
    }

    /** Slug unik dari merek + model + varian + tahun. */
    public function makeSlug(array $d, ?int $ignoreId = null): string
    {
        $base = url_title(strtolower(trim("{$d['brand']} {$d['model']} " . ($d['variant'] ?? '') . " {$d['year']}")), '-', true) ?: 'mobil';
        $slug = $base;

        for ($i = 2; ; $i++) {
            $q = $this->where('slug', $slug);
            if ($ignoreId) {
                $q->where('id !=', $ignoreId);
            }
            if ($q->countAllResults() === 0) {
                return $slug;
            }
            $slug = "{$base}-{$i}";
        }
    }
}
