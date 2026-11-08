<?php

namespace App\Controllers\Api;

use App\Models\ReviewModel;

/** Ulasan pelanggan. Ulasan baru tampil setelah disetujui admin. */
class Reviews extends BaseApi
{
    public function index()
    {
        $rows = (new ReviewModel())
            ->select("reviews.id, reviews.name, reviews.rating, reviews.comment, reviews.created_at, cars.brand, cars.model, cars.variant, cars.year")
            ->join('cars', 'cars.id = reviews.car_id', 'left')
            ->where('reviews.is_approved', 1)
            ->orderBy('reviews.created_at', 'DESC')
            ->findAll(12);

        $data = array_map(static fn ($r) => [
            'id'         => (int) $r['id'],
            'name'       => $r['name'],
            'rating'     => (int) $r['rating'],
            'comment'    => $r['comment'],
            'car_name'   => $r['brand'] ? car_name($r) . ' ' . $r['year'] : null,
            'created_at' => $r['created_at'],
        ], $rows);

        return $this->respond(['data' => $data]);
    }

    public function create()
    {
        if (! $this->allowed('review', 3)) {
            return $this->tooMany();
        }
        $data = $this->payload();
        if ($this->isBot($data)) {
            return $this->respondCreated(['message' => 'Terima kasih!']);
        }

        $data += ['name' => '', 'rating' => '', 'comment' => ''];
        $rules = [
            'name'    => 'required|min_length[2]|max_length[60]',
            'rating'  => 'required|in_list[1,2,3,4,5]',
            'comment' => 'required|min_length[10]|max_length[600]',
            'car_id'  => 'permit_empty|is_natural_no_zero',
        ];
        $messages = [
            'name'    => ['required' => 'Nama wajib diisi.', 'min_length' => 'Nama minimal 2 huruf.'],
            'rating'  => ['in_list' => 'Pilih nilai 1 sampai 5.'],
            'comment' => ['required' => 'Ulasan wajib diisi.', 'min_length' => 'Ulasan minimal 10 huruf.', 'max_length' => 'Ulasan maksimal 600 huruf.'],
        ];
        if (! $this->validateData($data, $rules, $messages)) {
            return $this->invalid();
        }

        (new ReviewModel())->insert([
            'car_id'      => ($data['car_id'] ?? '') !== '' ? (int) $data['car_id'] : null,
            'name'        => strip_tags($data['name']),
            'rating'      => (int) $data['rating'],
            'comment'     => strip_tags($data['comment']),
            'is_approved' => 0,
        ]);

        return $this->respondCreated(['message' => 'Terima kasih! Ulasanmu tampil setelah dicek admin.']);
    }
}
