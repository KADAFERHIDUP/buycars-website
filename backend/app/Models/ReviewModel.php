<?php

namespace App\Models;

use CodeIgniter\Model;

class ReviewModel extends Model
{
    protected $table         = 'reviews';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = ['car_id', 'name', 'rating', 'comment', 'is_approved'];
}
