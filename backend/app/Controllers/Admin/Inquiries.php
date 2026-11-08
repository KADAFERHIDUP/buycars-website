<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\InquiryModel;

class Inquiries extends BaseController
{
    public function index()
    {
        $rows = (new InquiryModel())
            ->select('inquiries.*, cars.brand, cars.model, cars.variant, cars.year')
            ->join('cars', 'cars.id = inquiries.car_id', 'left')
            ->orderBy('inquiries.is_read', 'ASC')->orderBy('inquiries.created_at', 'DESC')
            ->findAll(200);

        return view('admin/inquiries/index', ['title' => 'Pesan masuk', 'messages' => $rows]);
    }

    public function markRead(int $id)
    {
        (new InquiryModel())->update($id, ['is_read' => 1]);

        return redirect()->back()->with('success', 'Pesan ditandai sudah dibaca.');
    }

    public function delete(int $id)
    {
        (new InquiryModel())->delete($id);

        return redirect()->back()->with('success', 'Pesan dihapus.');
    }
}
