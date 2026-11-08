<?php

namespace App\Controllers\Api;

use App\Models\InquiryModel;

/** POST /api/inquiries: pesan dari form kontak. */
class Inquiries extends BaseApi
{
    public function create()
    {
        if (! $this->allowed('inquiry', 5)) {
            return $this->tooMany();
        }
        $data = $this->payload();
        if ($this->isBot($data)) {
            return $this->respondCreated(['message' => 'Pesan terkirim.']);
        }

        $data += ['name' => '', 'email' => '', 'subject' => '', 'message' => ''];
        $phone = $data['phone'] ?? '';
        $data['phone'] = $phone === '' ? '' : (normalize_phone($phone) ?? 'x');

        $rules = [
            'name'    => 'required|min_length[3]|max_length[80]',
            'email'   => 'required|valid_email|max_length[150]',
            'phone'   => 'permit_empty|regex_match[/^08\d{7,12}$/]',
            'subject' => 'required|in_list[' . implode(',', config('Showroom')->subjects) . ']',
            'message' => 'required|min_length[10]|max_length[2000]',
            'car_id'  => 'permit_empty|is_natural_no_zero',
        ];
        $messages = [
            'name'    => ['required' => 'Nama wajib diisi.', 'min_length' => 'Nama minimal 3 huruf.'],
            'email'   => ['required' => 'Email wajib diisi.', 'valid_email' => 'Alamat email tidak valid.'],
            'phone'   => ['regex_match' => 'Nomor WhatsApp tidak valid.'],
            'subject' => ['in_list' => 'Pilih topik yang tersedia.'],
            'message' => ['required' => 'Pesan wajib diisi.', 'min_length' => 'Pesan minimal 10 huruf.', 'max_length' => 'Pesan maksimal 2000 huruf.'],
        ];
        if (! $this->validateData($data, $rules, $messages)) {
            return $this->invalid();
        }

        (new InquiryModel())->insert([
            'car_id'  => ($data['car_id'] ?? '') !== '' ? (int) $data['car_id'] : null,
            'name'    => strip_tags($data['name']),
            'email'   => $data['email'],
            'phone'   => $data['phone'] ?: null,
            'subject' => $data['subject'],
            'message' => strip_tags($data['message']),
            'is_read' => 0,
        ]);

        return $this->respondCreated(['message' => 'Pesan terkirim.']);
    }
}
