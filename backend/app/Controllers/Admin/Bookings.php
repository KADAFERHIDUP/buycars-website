<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\BookingModel;

class Bookings extends BaseController
{
    public function index()
    {
        $status = (string) $this->request->getGet('status');
        $when   = (string) $this->request->getGet('waktu');
        $m      = (new BookingModel())->withCar();

        if (isset(config('Showroom')->bookingStatuses[$status])) {
            $m->where('bookings.status', $status);
        }
        if ($when === 'akan-datang') {
            $m->where('bookings.date >=', date('Y-m-d'))->orderBy('bookings.date', 'ASC')->orderBy('bookings.time', 'ASC');
        } else {
            $m->orderBy('bookings.created_at', 'DESC');
        }

        return view('admin/bookings/index', ['title' => 'Booking test drive', 'bookings' => $m->findAll(200), 'status' => $status, 'when' => $when]);
    }

    public function updateStatus(int $id)
    {
        $m       = new BookingModel();
        $booking = $m->find($id) ?? throw new \CodeIgniter\Exceptions\PageNotFoundException();
        $status  = (string) $this->request->getPost('status');
        $labels  = config('Showroom')->bookingStatuses;

        if (! isset($labels[$status])) {
            return redirect()->back()->with('error', 'Status tidak dikenal.');
        }
        $m->update($id, ['status' => $status]);

        return redirect()->back()->with('success', "Booking {$booking['code']} sekarang {$labels[$status]}.");
    }

    public function delete(int $id)
    {
        $m       = new BookingModel();
        $booking = $m->find($id) ?? throw new \CodeIgniter\Exceptions\PageNotFoundException();
        $m->delete($id);

        return redirect()->back()->with('success', "Booking {$booking['code']} dihapus.");
    }
}
