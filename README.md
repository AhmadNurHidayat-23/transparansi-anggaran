# Transparansi Anggaran

Informasi anggaran dan realisasi desa. Prototipe independen untuk demonstrasi portofolio.

## Fitur utama

- Pengelolaan tahun, kategori pendapatan/belanja dan CRUD alokasi oleh Admin.
- Pencatatan serta perubahan realisasi, pemeriksaan sisa, tanggal tahun anggaran, dan pencegahan realisasi melebihi alokasi.
- Grafik dan laporan berdasarkan data SQLite nyata, filter tahun/kategori dan ekspor CSV.
- Halaman publik hanya menampilkan tahun yang dipublikasikan; Petugas mencatat serta mengubah transaksi sendiri.

## Teknologi

Next.js App Router, TypeScript, React, SQLite server-side, CSS3, Node.js 22.18+.

## Cara instalasi

~~~powershell
cd C:\laragon\www\transparansi-anggaran
npm install
npm run user
~~~

Buat Admin, lalu ulangi untuk Petugas. Kata sandi 12–200 karakter dimasukkan melalui prompt dan disimpan sebagai hash. Tidak ada akun bawaan.

## Cara menjalankan

~~~powershell
npm run dev
~~~

Publik: http://127.0.0.1:5421. Pengelola: /kelola. Semua nilai menggunakan rupiah bulat, bukan pecahan floating point. Publikasikan tahun melalui data induk untuk menampilkannya di publik. SQLite dibuat otomatis di data/app.sqlite. APP_DB dapat mengubah lokasi; SECURE_COOKIE=1 untuk HTTPS.

Tes: npm test. Produksi lokal: npm run build, lalu npm start.
