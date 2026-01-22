-- ============================================
-- DATABASE SCHEMA: PPPK DISDIK VERIFICATION SYSTEM
-- Version: 2.0
-- Last Updated: January 2026
-- ============================================

-- Admin Users Table (untuk login dengan password ter-hash)
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nama VARCHAR(100),
    email VARCHAR(100),
    is_active TINYINT(1) DEFAULT 1,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data Guru Table
CREATE TABLE IF NOT EXISTS data_guru (
    id INT AUTO_INCREMENT PRIMARY KEY,
    no INT,
    nama VARCHAR(255) NOT NULL,
    nik VARCHAR(50),
    nip VARCHAR(50) UNIQUE,
    jabatan_sk VARCHAR(255),
    jenjang VARCHAR(50),
    unit_kerja VARCHAR(255),
    nomor_rekening VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data Tenaga Teknis Table
CREATE TABLE IF NOT EXISTS data_tenaga_teknis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    no INT,
    nip VARCHAR(50) UNIQUE,
    nik VARCHAR(50),
    nama VARCHAR(255) NOT NULL,
    jabatan VARCHAR(255),
    pendidikan VARCHAR(100),
    unit_kerja VARCHAR(255),
    nomor_rekening VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hasil Verifikasi Table
CREATE TABLE IF NOT EXISTS hasil_verifikasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    no INT,
    nama VARCHAR(255) NOT NULL,
    jabatan VARCHAR(255),
    nip VARCHAR(50) UNIQUE,
    no_telp_pegawai VARCHAR(20),
    npwp VARCHAR(30),
    nomor_rekening VARCHAR(50),
    nama_bank VARCHAR(100),
    nik VARCHAR(50),
    tipe ENUM('guru', 'tenaga_teknis') NOT NULL,
    unit_kerja VARCHAR(255),
    status_verifikasi VARCHAR(50) DEFAULT 'Terverifikasi',
    catatan TEXT,
    tanggal_verifikasi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- INDEXES for better performance
-- ============================================
CREATE INDEX idx_guru_nama ON data_guru(nama);
CREATE INDEX idx_guru_unit_kerja ON data_guru(unit_kerja);
CREATE INDEX idx_tt_nama ON data_tenaga_teknis(nama);
CREATE INDEX idx_tt_unit_kerja ON data_tenaga_teknis(unit_kerja);
CREATE INDEX idx_verifikasi_tipe ON hasil_verifikasi(tipe);
CREATE INDEX idx_verifikasi_tanggal ON hasil_verifikasi(tanggal_verifikasi);

-- ============================================
-- NOTE: Default admin will be created via API setupDatabase
-- Default credentials: admin / disdik2024
-- Password is stored as bcrypt hash for security
-- ============================================
