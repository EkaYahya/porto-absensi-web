# Sistem Absensi Barcode

Sistem Absensi Barcode adalah aplikasi web untuk mengelola kehadiran menggunakan teknologi barcode/QR code yang terintegrasi dengan Firebase Realtime Database. Aplikasi ini cocok digunakan untuk manajemen absensi di kampus, acara, atau organisasi.

## Fitur Utama

### Aplikasi User
- Pendaftaran pengguna dengan data lengkap (nama, jurusan, kampus)
- Pembuatan barcode unik untuk setiap pengguna
- Scan barcode untuk melakukan absensi
- Penyimpanan data absensi secara realtime

### Panel Admin
- Login admin dengan autentikasi
- Dashboard dengan statistik dan grafik kehadiran
- Manajemen data pengguna
- Melihat dan mengunduh barcode pengguna
- Laporan absensi (harian, mingguan, bulanan, dan kustom)
- Pengaturan aplikasi dan admin

## Teknologi yang Digunakan

- HTML, CSS, dan JavaScript (Frontend)
- Firebase Realtime Database (Backend)
- HTML5 QR Code Scanner (Scan Barcode)
- Chart.js (Visualisasi Data)
- Responsive Design (Mobile Friendly)

## Cara Penggunaan

### Setup Firebase

1. Buat akun di (https://firebase.google.com/)
2. Buat project baru
3. Aktifkan Realtime Database
4. Salin konfigurasi Firebase ke dalam file `admin-script.js` dan `script.js`

### Instalasi

1. Clone repository ini:
   ```bash
   git clone https://github.com/EkaYahya/porto-absensi.git
2. Buka file index.html di browser untuk akses aplikasi utama
3. Buka file admin.html di browser untuk akses panel admin

Username default: admin
Password default: admin123

## Struktur Proyek

index.html - Halaman utama aplikasi
admin.html - Panel admin
style.css - Style untuk aplikasi utama
admin-style.css - Style untuk panel admin
script.js - JavaScript untuk aplikasi utama
admin-script.js - JavaScript untuk panel admin

## Demo
Anda bisa mencoba demo aplikasi di sini.

Proyek ini dilisensikan di bawah MIT License.

Kontributor

Eka Yahya - GitHub

Kontak
Jika Anda memiliki pertanyaan atau umpan balik, silakan hubungi saya melalui email di ekayahya12@gmail.com
