<?php

use App\Filters\AdminAuth;
use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */

// Halaman utama = frontend (folder frontend/ disalin ke public/ oleh installer)
$routes->get('/', 'Home::index');

// ---------- API JSON untuk frontend ----------
$routes->group('api', ['namespace' => 'App\Controllers\Api', 'filter' => 'cors'], static function ($routes) {
    $routes->get('health', 'Health::index');
    $routes->get('cars', 'Cars::index');
    $routes->get('cars/(:segment)', 'Cars::show/$1');
    $routes->get('reviews', 'Reviews::index');
    $routes->post('reviews', 'Reviews::create');
    $routes->post('bookings', 'Bookings::create');
    $routes->post('inquiries', 'Inquiries::create');
    $routes->post('subscribe', 'Subscribers::create');
    // preflight CORS
    $routes->options('(:any)', static fn () => service('response')->setStatusCode(204));
});

// ---------- Login admin ----------
$routes->get('admin/login', 'Auth::login');
$routes->post('admin/login', 'Auth::attempt', ['filter' => 'csrf']);
$routes->get('admin/logout', 'Auth::logout');

// ---------- Panel admin (wajib login, semua POST dicek CSRF) ----------
$routes->group('admin', ['namespace' => 'App\Controllers\Admin', 'filter' => AdminAuth::class], static function ($routes) {
    $routes->get('/', 'Dashboard::index');

    $routes->get('mobil', 'Cars::index');
    $routes->get('mobil/tambah', 'Cars::new');
    $routes->post('mobil', 'Cars::create');
    $routes->get('mobil/(:num)/edit', 'Cars::edit/$1');
    $routes->post('mobil/(:num)', 'Cars::update/$1');
    $routes->post('mobil/(:num)/unggulan', 'Cars::toggleFeatured/$1');
    $routes->post('mobil/(:num)/status', 'Cars::setStatus/$1');
    $routes->post('mobil/(:num)/hapus', 'Cars::delete/$1');

    $routes->get('booking', 'Bookings::index');
    $routes->post('booking/(:num)/status', 'Bookings::updateStatus/$1');
    $routes->post('booking/(:num)/hapus', 'Bookings::delete/$1');

    $routes->get('pesan', 'Inquiries::index');
    $routes->post('pesan/(:num)/dibaca', 'Inquiries::markRead/$1');
    $routes->post('pesan/(:num)/hapus', 'Inquiries::delete/$1');

    $routes->get('ulasan', 'Reviews::index');
    $routes->post('ulasan/(:num)/setujui', 'Reviews::approve/$1');
    $routes->post('ulasan/(:num)/sembunyikan', 'Reviews::hide/$1');
    $routes->post('ulasan/(:num)/hapus', 'Reviews::delete/$1');

    $routes->get('pelanggan', 'Subscribers::index');
    $routes->get('pelanggan/csv', 'Subscribers::export');
    $routes->post('pelanggan/(:num)/hapus', 'Subscribers::delete/$1');
});
