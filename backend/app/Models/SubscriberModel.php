<?php

namespace App\Models;

use CodeIgniter\Model;

class SubscriberModel extends Model
{
    protected $table         = 'subscribers';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = ['email'];
}
