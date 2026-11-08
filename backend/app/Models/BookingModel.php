<?php

namespace App\Models;

use CodeIgniter\Model;

class BookingModel extends Model
{
    protected $table         = 'bookings';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = ['code', 'car_id', 'name', 'phone', 'email', 'date', 'time', 'notes', 'status'];

    /** Kode booking yang mudah dibacakan lewat telepon, contoh TD-261109-7K4Q. */
    public function newCode(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        do {
            $rand = '';
            for ($i = 0; $i < 4; $i++) {
                $rand .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
            $code = 'TD-' . date('ymd') . '-' . $rand;
        } while ($this->where('code', $code)->countAllResults() > 0);

        return $code;
    }

    public function withCar()
    {
        return $this->select('bookings.*, cars.brand, cars.model, cars.variant, cars.year, cars.slug')
            ->join('cars', 'cars.id = bookings.car_id', 'left');
    }
}
