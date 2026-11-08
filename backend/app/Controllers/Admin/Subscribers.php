<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\SubscriberModel;

class Subscribers extends BaseController
{
    public function index()
    {
        return view('admin/subscribers/index', ['title' => 'Pelanggan newsletter', 'subs' => (new SubscriberModel())->orderBy('created_at', 'DESC')->findAll()]);
    }

    /** Unduh daftar email (CSV) untuk diimpor ke layanan email. */
    public function export()
    {
        $rows = (new SubscriberModel())->orderBy('created_at', 'ASC')->findAll();
        $out  = fopen('php://temp', 'w+');
        fputcsv($out, ['email', 'terdaftar'], ',', '"', '');
        foreach ($rows as $r) {
            fputcsv($out, [$r['email'], $r['created_at']], ',', '"', '');
        }
        rewind($out);
        $csv = stream_get_contents($out);

        return $this->response->download('pelanggan-buycars-' . date('Ymd') . '.csv', $csv)->setContentType('text/csv');
    }

    public function delete(int $id)
    {
        (new SubscriberModel())->delete($id);

        return redirect()->back()->with('success', 'Email dihapus dari daftar.');
    }
}
