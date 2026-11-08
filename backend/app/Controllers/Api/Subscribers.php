<?php

namespace App\Controllers\Api;

use App\Models\SubscriberModel;

/** POST /api/subscribe: daftar newsletter. */
class Subscribers extends BaseApi
{
    public function create()
    {
        if (! $this->allowed('subscribe', 5)) {
            return $this->tooMany();
        }
        $data = $this->payload();
        $data['email'] = strtolower((string) ($data['email'] ?? ''));

        if (! $this->validateData($data, ['email' => 'required|valid_email|max_length[150]'], ['email' => ['required' => 'Email wajib diisi.', 'valid_email' => 'Alamat email tidak valid.']])) {
            return $this->invalid();
        }

        $m = new SubscriberModel();
        if ($m->where('email', $data['email'])->first()) {
            return $this->respond(['message' => 'Email ini sudah terdaftar. Terima kasih!']);
        }
        $m->insert(['email' => $data['email']]);

        return $this->respondCreated(['message' => 'Terima kasih! Kamu sudah terdaftar.']);
    }
}
