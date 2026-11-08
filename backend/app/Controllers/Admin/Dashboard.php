<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\BookingModel;

class Dashboard extends BaseController
{
    public function index()
    {
        $db = db_connect();

        return view('admin/dashboard', [
            'title' => 'Dashboard',
            'stats' => [
                'available' => $db->table('cars')->where('status', 'tersedia')->countAllResults(),
                'sold'      => $db->table('cars')->where('status', 'terjual')->countAllResults(),
                'stock'     => (int) ($db->table('cars')->selectSum('price')->where('status', 'tersedia')->get()->getRow()->price ?? 0),
                'bookings'  => $db->table('bookings')->where('status', 'baru')->countAllResults(),
                'unread'    => $db->table('inquiries')->where('is_read', 0)->countAllResults(),
                'reviews'   => $db->table('reviews')->where('is_approved', 0)->countAllResults(),
                'subs'      => $db->table('subscribers')->countAllResults(),
            ],
            'upcoming' => (new BookingModel())->withCar()
                ->where('bookings.date >=', date('Y-m-d'))
                ->whereIn('bookings.status', ['baru', 'dikonfirmasi'])
                ->orderBy('bookings.date', 'ASC')->orderBy('bookings.time', 'ASC')
                ->findAll(8),
        ]);
    }
}
