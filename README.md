# 🏛️ PPPK DISDIK - Sistem Verifikasi Data Pegawai

Sistem verifikasi data PPPK (Pegawai Pemerintah dengan Perjanjian Kerja) untuk Dinas Pendidikan.

## ✨ Fitur Utama

- ✅ **Form Verifikasi Publik** - Pegawai dapat memverifikasi data berdasarkan NIP
- ✅ **Admin Panel** - Kelola data guru dan tenaga teknis
- ✅ **Import Data** - Support Excel (.xlsx) dan CSV dengan batch processing
- ✅ **Export Data** - Export ke Excel atau CSV
- ✅ **Manajemen Password** - Password admin tersimpan ter-hash di database
- ✅ **Countdown Timer** - Pemberitahuan batas waktu layanan
- ✅ **Responsive Design** - Support desktop dan mobile

## 📁 Struktur Proyek

```
pppk-disdik/
├── api/                    # Backend PHP API
│   ├── config.php          # Konfigurasi database & CORS
│   ├── index.php           # Endpoint API utama
│   ├── test.php            # Test koneksi database
│   └── .htaccess           # Apache config
├── src/                    # Frontend React
│   ├── components/         # React components
│   │   ├── AdminPanel.tsx
│   │   ├── VerificationForm.tsx
│   │   ├── ChangePasswordModal.tsx
│   │   ├── CountdownTimer.tsx
│   │   └── ...
│   ├── services/           # API services
│   ├── types/              # TypeScript types
│   ├── utils/              # Utility functions (export)
│   ├── context/            # React context (Auth)
│   └── config/             # Frontend config
├── database.sql            # Schema database
└── package.json
```

## 🔧 Teknologi

- **Frontend**: Vite + React 19 + TypeScript
- **Backend**: PHP 8.x
- **Database**: MySQL
- **Library**: xlsx, lucide-react

## 🚀 Development

### Prerequisites
- Node.js 18+
- PHP 8.0+
- MySQL

### Installation

```bash
# Clone/download project
cd pppk-disdik

# Install dependencies
npm install

# Start frontend dev server
npm run dev

# Start PHP server (terminal terpisah)
cd api
php -S 127.0.0.1:8888
```

### Setup Database

Akses URL berikut untuk membuat tabel:
```
http://127.0.0.1:8888/index.php?action=setupDatabase
```

## 🔐 Kredensial Default

- **Username**: `admin`
- **Password**: `disdik2024`

> Password disimpan sebagai bcrypt hash di database untuk keamanan.

## 📋 API Endpoints

| Action | Method | Description |
|--------|--------|-------------|
| `login` | POST | Login admin |
| `changePassword` | POST | Ubah password |
| `getDataGuru` | GET | Ambil data guru |
| `getDataTenagaTeknis` | GET | Ambil data tenaga teknis |
| `cariPegawaiByNIP` | GET | Cari pegawai berdasarkan NIP |
| `verifikasiPegawai` | POST | Simpan verifikasi |
| `getHasilVerifikasi` | GET | Ambil hasil verifikasi |
| `getStatistik` | GET | Ambil statistik |
| `importData` | POST | Import data (batch) |
| `truncateData` | POST | Hapus semua data |
| `setupDatabase` | GET | Setup/reset database |

## 📦 Deployment ke Hosting

### 1. Build Frontend

```bash
npm run build
```

### 2. Update API URL

Edit `src/config/index.ts`:
```typescript
export const API_URL = 'https://yourdomain.com/api/index.php';
```

### 3. Upload ke Hosting

```
public_html/
├── api/
│   ├── config.php
│   ├── index.php
│   └── .htaccess
├── assets/           # dari dist/
├── index.html        # dari dist/
└── ...
```

### 4. Setup Database

Akses: `https://yourdomain.com/api/index.php?action=setupDatabase`

## ⚠️ Catatan Penting

1. **Batas Waktu**: Sistem akan berakhir pada **13 Maret 2026**
2. **Export Data**: Pastikan export semua data sebelum batas waktu
3. **Keamanan**: Jangan expose `config.php` credentials di frontend

## 📄 License

© 2024-2026 Dinas Pendidikan
