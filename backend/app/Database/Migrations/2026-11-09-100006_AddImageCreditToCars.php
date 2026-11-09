<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Nama dan link fotografer, untuk foto dari Unsplash atau sumber lain. */
class AddImageCreditToCars extends Migration
{
    public function up()
    {
        $this->forge->addColumn('cars', [
            'image_credit'     => ['type' => 'VARCHAR', 'constraint' => 80, 'null' => true, 'after' => 'image'],
            'image_credit_url' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true, 'after' => 'image_credit'],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('cars', ['image_credit', 'image_credit_url']);
    }
}
