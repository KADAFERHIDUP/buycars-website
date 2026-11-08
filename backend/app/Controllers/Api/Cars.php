<?php

namespace App\Controllers\Api;

use App\Models\CarModel;

/**
 * GET /api/cars?q=&brand=&body=&fuel=&transmission=&condition=&min=&max=&sort=&page=&per_page=
 * GET /api/cars/{slug atau id}
 * Mobil berstatus "terjual" tidak ditampilkan.
 */
class Cars extends BaseApi
{
    private const SORTS = [
        'featured'   => [['is_featured', 'DESC'], ['year', 'DESC']],
        'price_asc'  => [['price', 'ASC']],
        'price_desc' => [['price', 'DESC']],
        'year_desc'  => [['year', 'DESC']],
        'km_asc'     => [['mileage_km', 'ASC']],
        'newest'     => [['created_at', 'DESC']],
    ];

    public function index()
    {
        $g   = fn (string $k) => trim((string) $this->request->getGet($k));
        $cfg = config('Showroom');
        $m   = (new CarModel())->where('status !=', 'terjual');

        if (($q = $g('q')) !== '') {
            $m->groupStart()->like('brand', $q)->orLike('model', $q)->orLike('variant', $q)->orLike('color', $q)->groupEnd();
        }
        if (($v = $g('brand')) !== '') {
            $m->where('brand', $v);
        }
        foreach (['body' => ['body_type', $cfg->bodyTypes], 'fuel' => ['fuel', $cfg->fuels], 'transmission' => ['transmission', $cfg->transmissions], 'condition' => ['condition', $cfg->conditions]] as $param => [$col, $allowed]) {
            if (($v = $g($param)) !== '' && isset($allowed[$v])) {
                $m->where($col, $v);
            }
        }
        if (ctype_digit($g('min'))) {
            $m->where('price >=', (int) $g('min'));
        }
        if (ctype_digit($g('max'))) {
            $m->where('price <=', (int) $g('max'));
        }

        $perPage = min(200, max(1, (int) ($g('per_page') ?: 12)));
        $page    = max(1, (int) ($g('page') ?: 1));
        $total   = $m->countAllResults(false);

        foreach (self::SORTS[$g('sort')] ?? self::SORTS['featured'] as [$col, $dir]) {
            $m->orderBy($col, $dir);
        }
        $rows = $m->findAll($perPage, ($page - 1) * $perPage);

        return $this->respond([
            'data' => array_map([CarModel::class, 'present'], $rows),
            'meta' => ['total' => $total, 'page' => $page, 'per_page' => $perPage, 'pages' => (int) ceil($total / $perPage)],
        ]);
    }

    public function show(string $key)
    {
        $m   = new CarModel();
        $car = ctype_digit($key) ? $m->find((int) $key) : $m->where('slug', $key)->first();

        if (! $car || $car['status'] === 'terjual') {
            return $this->failNotFound('Mobil tidak ditemukan.');
        }

        return $this->respond(['data' => CarModel::present($car)]);
    }
}
