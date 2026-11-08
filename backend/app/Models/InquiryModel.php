<?php

namespace App\Models;

use CodeIgniter\Model;

class InquiryModel extends Model
{
    protected $table         = 'inquiries';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = ['car_id', 'name', 'email', 'phone', 'subject', 'message', 'is_read'];
}
