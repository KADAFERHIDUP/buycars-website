<?php

namespace App\Controllers\Api;

use App\Models\BookingModel;
use App\Models\CarModel;

/** POST /api/bookings: simpan booking test drive dan kembalikan kode booking. */
class Bookings extends BaseApi
{
    public function create()
    {
        if (! $this->allowed('booking', 5)) {
            return $this->tooMany();
        }

        $cfg  = config('Showroom');
        $data = $this->payload();

        if ($this->isBot($data)) {
            return $this->respondCreated(['data' => ['code' => 'TD-000000-0000'], 'message' => 'Booking tersimpan.']);
        }

        $data += ['car_id' => '', 'name' => '', 'date' => '', 'time' => '', 'email' => '', 'notes' => ''];
        $data['phone'] = normalize_phone($data['phone'] ?? '') ?? '';
        $min           = date('Y-m-d', strtotime('+1 day'));
        $max           = date('Y-m-d', strtotime("+{$cfg->bookingDaysAhead} days"));

        $rules = [
            'car_id' => 'required|is_natural_no_zero',
            'name'   => 'required|min_length[3]|max_length[80]',
            'phone'  => 'required',
            'date'   => 'required|valid_date[Y-m-d]',
            'time'   => 'required|in_list[' . implode(',', $cfg->slots) . ']',
            'email'  => 'permit_empty|valid_email|max_length[150]',
            'notes'  => 'permit_empty|max_length[500]',
        ];
        $messages = [
            'car_id' => ['required' => 'Pilih mobil yang mau dicoba.', 'is_natural_no_zero' => 'Pilih mobil yang mau dicoba.'],
            'name'   => ['required' => 'Nama wajib diisi.', 'min_length' => 'Nama minimal 3 huruf.', 'max_length' => 'Nama terlalu panjang.'],
            'phone'  => ['required' => 'Nomor WhatsApp tidak valid. Contoh: 081234567890.'],
            'date'   => ['required' => 'Pilih tanggal test drive.', 'valid_date' => 'Format tanggal tidak valid.'],
            'time'   => ['required' => 'Pilih jam test drive.', 'in_list' => 'Jam test drive tidak tersedia.'],
            'email'  => ['valid_email' => 'Alamat email tidak valid.'],
            'notes'  => ['max_length' => 'Catatan maksimal 500 huruf.'],
        ];
        if (! $this->validateData($data, $rules, $messages)) {
            return $this->invalid();
        }
        if ($data['date'] < $min || $data['date'] > $max || date('w', strtotime($data['date'])) === '0') {
            return $this->respond(['status' => 422, 'message' => 'Pilih tanggal mulai besok sampai ' . $cfg->bookingDaysAhead . ' hari ke depan, Senin–Sabtu.', 'errors' => ['date' => 'Tanggal tidak tersedia.']], 422);
        }

        $car = (new CarModel())->find((int) $data['car_id']);
        if (! $car || $car['status'] === 'terjual') {
            return $this->respond(['status' => 422, 'message' => 'Mobil ini sudah tidak tersedia.', 'errors' => ['car_id' => 'Mobil tidak tersedia.']], 422);
        }

        $bookings = new BookingModel();
        $dupe     = $bookings->where(['car_id' => $car['id'], 'phone' => $data['phone'], 'date' => $data['date']])->whereIn('status', ['baru', 'dikonfirmasi'])->first();
        if ($dupe) {
            return $this->respond(['status' => 409, 'message' => "Kamu sudah booking mobil ini di tanggal yang sama (kode {$dupe['code']}).", 'data' => ['code' => $dupe['code']]], 409);
        }
        if ($bookings->where(['car_id' => $car['id'], 'date' => $data['date'], 'time' => $data['time']])->whereIn('status', ['baru', 'dikonfirmasi'])->countAllResults() > 0) {
            return $this->respond(['status' => 409, 'message' => 'Jam itu sudah dibooking orang lain untuk mobil ini. Pilih jam lain.', 'errors' => ['time' => 'Jam sudah terisi.']], 409);
        }

        $code = $bookings->newCode();
        $bookings->insert([
            'code'   => $code,
            'car_id' => $car['id'],
            'name'   => strip_tags($data['name']),
            'phone'  => $data['phone'],
            'email'  => ($data['email'] ?? '') ?: null,
            'date'   => $data['date'],
            'time'   => $data['time'],
            'notes'  => strip_tags((string) ($data['notes'] ?? '')) ?: null,
            'status' => 'baru',
        ]);

        $text = "Halo {$cfg->name}, saya {$data['name']}. Konfirmasi booking test drive {$code}: " . car_name($car) . " {$car['year']}, " . tanggal($data['date']) . " jam {$data['time']}.";

        return $this->respondCreated([
            'message'      => 'Booking tersimpan.',
            'data'         => ['code' => $code, 'car' => car_name($car), 'date' => $data['date'], 'time' => $data['time']],
            'whatsapp_url' => wa_url($cfg->whatsapp, $text),
        ]);
    }
}
