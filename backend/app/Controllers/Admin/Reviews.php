<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\ReviewModel;

class Reviews extends BaseController
{
    public function index()
    {
        $rows = (new ReviewModel())
            ->select('reviews.*, cars.brand, cars.model, cars.variant, cars.year')
            ->join('cars', 'cars.id = reviews.car_id', 'left')
            ->orderBy('reviews.is_approved', 'ASC')->orderBy('reviews.created_at', 'DESC')
            ->findAll(200);

        return view('admin/reviews/index', ['title' => 'Ulasan', 'reviews' => $rows]);
    }

    public function approve(int $id)
    {
        (new ReviewModel())->update($id, ['is_approved' => 1]);

        return redirect()->back()->with('success', 'Ulasan disetujui dan tampil di website.');
    }

    public function hide(int $id)
    {
        (new ReviewModel())->update($id, ['is_approved' => 0]);

        return redirect()->back()->with('success', 'Ulasan disembunyikan dari website.');
    }

    public function delete(int $id)
    {
        (new ReviewModel())->delete($id);

        return redirect()->back()->with('success', 'Ulasan dihapus.');
    }
}
