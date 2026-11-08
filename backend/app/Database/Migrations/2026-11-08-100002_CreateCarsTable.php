<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateCarsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id'           => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'slug'         => ['type' => 'VARCHAR', 'constraint' => 120],
            'brand'        => ['type' => 'VARCHAR', 'constraint' => 60],
            'model'        => ['type' => 'VARCHAR', 'constraint' => 60],
            'variant'      => ['type' => 'VARCHAR', 'constraint' => 80, 'null' => true],
            'year'         => ['type' => 'SMALLINT', 'unsigned' => true],
            'price'        => ['type' => 'BIGINT', 'unsigned' => true],
            'condition'    => ['type' => 'VARCHAR', 'constraint' => 10, 'default' => 'bekas'],      // baru | bekas
            'mileage_km'   => ['type' => 'INT', 'unsigned' => true, 'default' => 0],
            'body_type'    => ['type' => 'VARCHAR', 'constraint' => 20],                              // suv, sedan, coupe, ...
            'transmission' => ['type' => 'VARCHAR', 'constraint' => 10],                              // otomatis | manual
            'fuel'         => ['type' => 'VARCHAR', 'constraint' => 10],                              // bensin | diesel | listrik | hybrid
            'engine'       => ['type' => 'VARCHAR', 'constraint' => 80, 'null' => true],
            'power_hp'     => ['type' => 'SMALLINT', 'unsigned' => true, 'null' => true],
            'seats'        => ['type' => 'TINYINT', 'unsigned' => true, 'default' => 5],
            'color'        => ['type' => 'VARCHAR', 'constraint' => 40],
            'description'  => ['type' => 'TEXT', 'null' => true],
            'image'        => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'is_featured'  => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 0],
            'status'       => ['type' => 'VARCHAR', 'constraint' => 12, 'default' => 'tersedia'],   // tersedia | dipesan | terjual
            'created_at'   => ['type' => 'DATETIME', 'null' => true],
            'updated_at'   => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('slug');
        $this->forge->addKey(['status', 'price']);
        $this->forge->createTable('cars');
    }

    public function down()
    {
        $this->forge->dropTable('cars');
    }
}
