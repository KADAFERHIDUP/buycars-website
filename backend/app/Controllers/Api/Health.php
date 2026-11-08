<?php

namespace App\Controllers\Api;

class Health extends BaseApi
{
    public function index()
    {
        $db = db_connect();

        return $this->respond([
            'ok'   => true,
            'name' => config('Showroom')->name,
            'cars' => $db->table('cars')->where('status !=', 'terjual')->countAllResults(),
            'time' => date('c'),
        ]);
    }
}
