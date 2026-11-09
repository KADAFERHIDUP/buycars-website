<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\CarModel;

class Cars extends BaseController
{
    private CarModel $cars;

    /** Link foto dari form (dipakai kalau tidak ada file yang diunggah). */
    private ?string $imageUrl = null;

    public function __construct()
    {
        $this->cars = new CarModel();
    }

    public function index()
    {
        $status = (string) $this->request->getGet('status');
        $q      = trim((string) $this->request->getGet('q'));
        $m      = $this->cars;

        if (isset(config('Showroom')->carStatuses[$status])) {
            $m->where('status', $status);
        }
        if ($q !== '') {
            $m->groupStart()->like('brand', $q)->orLike('model', $q)->orLike('variant', $q)->groupEnd();
        }

        return view('admin/cars/index', [
            'title'  => 'Mobil',
            'cars'   => $m->orderBy('created_at', 'DESC')->orderBy('id', 'DESC')->findAll(),
            'status' => $status,
            'q'      => $q,
        ]);
    }

    public function new()
    {
        return view('admin/cars/form', ['title' => 'Tambah mobil', 'car' => null]);
    }

    public function create()
    {
        $data = $this->collect();
        if ($data === null) {
            return redirect()->back()->withInput()->with('errors', $this->validator->getErrors());
        }

        $image = $this->storeImage();
        if ($image === false) {
            return redirect()->back()->withInput()->with('error', 'Foto harus JPG, PNG, atau WEBP, maksimal 3 MB.');
        }
        $data['image'] = $image ?? $this->imageUrl;
        $data['slug']  = $this->cars->makeSlug($data);
        $this->cars->insert($data);

        return redirect()->to(site_url('admin/mobil'))->with('success', esc(car_name($data)) . ' ditambahkan.');
    }

    public function edit(int $id)
    {
        $car = $this->cars->find($id) ?? throw new \CodeIgniter\Exceptions\PageNotFoundException();

        return view('admin/cars/form', ['title' => 'Edit ' . car_name($car), 'car' => $car]);
    }

    public function update(int $id)
    {
        $car = $this->cars->find($id) ?? throw new \CodeIgniter\Exceptions\PageNotFoundException();

        $data = $this->collect();
        if ($data === null) {
            return redirect()->back()->withInput()->with('errors', $this->validator->getErrors());
        }

        $image = $this->storeImage();
        if ($image === false) {
            return redirect()->back()->withInput()->with('error', 'Foto harus JPG, PNG, atau WEBP, maksimal 3 MB.');
        }
        $image ??= $this->imageUrl;
        if ($image !== null && $image !== $car['image']) {
            $this->removeUpload($car['image']);
            $data['image'] = $image;
        }
        $data['slug'] = $this->cars->makeSlug($data, $id);
        $this->cars->update($id, $data);

        return redirect()->to(site_url('admin/mobil'))->with('success', esc(car_name($data)) . ' diperbarui.');
    }

    public function toggleFeatured(int $id)
    {
        $car = $this->cars->find($id) ?? throw new \CodeIgniter\Exceptions\PageNotFoundException();
        $this->cars->update($id, ['is_featured' => $car['is_featured'] ? 0 : 1]);

        return redirect()->back()->with('success', esc(car_name($car)) . ($car['is_featured'] ? ' tidak lagi unggulan.' : ' jadi unggulan.'));
    }

    public function setStatus(int $id)
    {
        $car    = $this->cars->find($id) ?? throw new \CodeIgniter\Exceptions\PageNotFoundException();
        $status = (string) $this->request->getPost('status');
        if (! isset(config('Showroom')->carStatuses[$status])) {
            return redirect()->back()->with('error', 'Status tidak dikenal.');
        }
        $this->cars->update($id, ['status' => $status]);

        return redirect()->back()->with('success', esc(car_name($car)) . ' sekarang ' . config('Showroom')->carStatuses[$status] . '.');
    }

    public function delete(int $id)
    {
        $car = $this->cars->find($id) ?? throw new \CodeIgniter\Exceptions\PageNotFoundException();
        $this->cars->delete($id);
        $this->removeUpload($car['image']);

        return redirect()->to(site_url('admin/mobil'))->with('success', esc(car_name($car)) . ' dihapus.');
    }

    /** Validasi form mobil. null kalau tidak valid. */
    private function collect(): ?array
    {
        $cfg = config('Showroom');
        $in  = fn (array $a) => 'in_list[' . implode(',', array_keys($a)) . ']';
        $rules = [
            'brand'        => 'required|max_length[60]',
            'model'        => 'required|max_length[60]',
            'variant'      => 'permit_empty|max_length[80]',
            'year'         => 'required|integer|greater_than[1949]|less_than_equal_to[' . (date('Y') + 1) . ']',
            'price'        => 'required|integer|greater_than[0]',
            'condition'    => 'required|' . $in($cfg->conditions),
            'mileage_km'   => 'permit_empty|integer|greater_than_equal_to[0]',
            'body_type'    => 'required|' . $in($cfg->bodyTypes),
            'transmission' => 'required|' . $in($cfg->transmissions),
            'fuel'         => 'required|' . $in($cfg->fuels),
            'engine'       => 'permit_empty|max_length[80]',
            'power_hp'     => 'permit_empty|integer|greater_than[0]',
            'seats'        => 'required|integer|greater_than[0]|less_than[20]',
            'color'        => 'required|max_length[40]',
            'description'  => 'permit_empty|max_length[2000]',
            'status'       => 'required|' . $in($cfg->carStatuses),
            'image_url'        => 'permit_empty|valid_url_strict[https]|max_length[255]',
            'image_credit'     => 'permit_empty|max_length[80]',
            'image_credit_url' => 'permit_empty|valid_url_strict[https]|max_length[255]',
        ];

        $post          = $this->request->getPost();
        $post['price'] = preg_replace('/\D/', '', (string) ($post['price'] ?? ''));
        $post['mileage_km'] = preg_replace('/\D/', '', (string) ($post['mileage_km'] ?? ''));

        if (! $this->validateData($post, $rules)) {
            return null;
        }

        $data = array_intersect_key($post, $rules);
        $data['mileage_km']  = (int) ($data['mileage_km'] ?: 0);
        $data['power_hp']    = $data['power_hp'] !== '' ? (int) $data['power_hp'] : null;
        $data['is_featured'] = $this->request->getPost('is_featured') ? 1 : 0;
        foreach (['brand', 'model', 'variant', 'engine', 'color', 'description', 'image_credit'] as $k) {
            $data[$k] = trim(strip_tags((string) $data[$k]));
        }
        $data['image_credit']     = $data['image_credit'] ?: null;
        $data['image_credit_url'] = $data['image_credit_url'] ?: null;
        $this->imageUrl           = trim((string) $data['image_url']) ?: null;
        unset($data['image_url']);

        return $data;
    }

    /** null = tidak ada foto baru, false = foto tidak valid, string = path foto tersimpan. */
    private function storeImage(): string|false|null
    {
        $file = $this->request->getFile('image');
        if (! $file || $file->getError() === UPLOAD_ERR_NO_FILE) {
            return null;
        }
        if (! $file->isValid() || $file->getSize() > 3 * 1024 * 1024 || ! in_array($file->getMimeType(), ['image/jpeg', 'image/png', 'image/webp'], true)) {
            return false;
        }
        $name = $file->getRandomName();
        $file->move(FCPATH . 'uploads/cars', $name);

        return 'uploads/cars/' . $name;
    }

    private function removeUpload(?string $path): void
    {
        if ($path && str_starts_with($path, 'uploads/cars/') && is_file(FCPATH . $path)) {
            unlink(FCPATH . $path);
        }
    }
}
