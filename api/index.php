<?php
require_once 'config.php';

// Get action from request
$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'login':
        handleLogin();
        break;
    case 'changePassword':
        changePassword();
        break;
    case 'getDataGuru':
        getDataGuru();
        break;
    case 'getDataTenagaTeknis':
        getDataTenagaTeknis();
        break;
    case 'cariPegawaiByNIP':
        cariPegawaiByNIP();
        break;
    case 'cekSudahVerifikasi':
        cekSudahVerifikasi();
        break;
    case 'verifikasiPegawai':
        verifikasiPegawai();
        break;
    case 'getHasilVerifikasi':
        getHasilVerifikasi();
        break;
    case 'getStatistik':
        getStatistik();
        break;
    case 'importData':
        importData();
        break;
    case 'hapusData':
        hapusData();
        break;
    case 'truncateData':
        truncateData();
        break;
    case 'setupDatabase':
        setupDatabase();
        break;
    default:
        jsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
}

// ============ HANDLERS ============

function handleLogin() {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? $_POST['username'] ?? '';
    $password = $input['password'] ?? $_POST['password'] ?? '';
    
    $pdo = getConnection();
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE username = ? AND is_active = 1");
        $stmt->execute([$username]);
        $admin = $stmt->fetch();
        
        if ($admin && password_verify($password, $admin['password_hash'])) {
            // Update last login
            $updateStmt = $pdo->prepare("UPDATE admin_users SET last_login = NOW() WHERE id = ?");
            $updateStmt->execute([$admin['id']]);
            
            jsonResponse([
                'success' => true, 
                'message' => 'Login berhasil',
                'user' => [
                    'id' => $admin['id'],
                    'username' => $admin['username'],
                    'nama' => $admin['nama']
                ]
            ]);
        } else {
            jsonResponse(['success' => false, 'error' => 'Username atau password salah'], 401);
        }
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function changePassword() {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? '';
    $oldPassword = $input['oldPassword'] ?? '';
    $newPassword = $input['newPassword'] ?? '';
    
    if (empty($username) || empty($oldPassword) || empty($newPassword)) {
        jsonResponse(['success' => false, 'error' => 'Semua field harus diisi'], 400);
    }
    
    if (strlen($newPassword) < 6) {
        jsonResponse(['success' => false, 'error' => 'Password baru minimal 6 karakter'], 400);
    }
    
    $pdo = getConnection();
    
    try {
        // Verify old password
        $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE username = ? AND is_active = 1");
        $stmt->execute([$username]);
        $admin = $stmt->fetch();
        
        if (!$admin) {
            jsonResponse(['success' => false, 'error' => 'User tidak ditemukan'], 404);
        }
        
        if (!password_verify($oldPassword, $admin['password_hash'])) {
            jsonResponse(['success' => false, 'error' => 'Password lama salah'], 401);
        }
        
        // Update to new password
        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $updateStmt = $pdo->prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?");
        $updateStmt->execute([$newHash, $admin['id']]);
        
        jsonResponse(['success' => true, 'message' => 'Password berhasil diubah']);
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function getDataGuru() {
    $pdo = getConnection();
    $stmt = $pdo->query("SELECT * FROM data_guru ORDER BY no ASC");
    $data = $stmt->fetchAll();
    jsonResponse(['success' => true, 'data' => $data]);
}

function getDataTenagaTeknis() {
    $pdo = getConnection();
    $stmt = $pdo->query("SELECT * FROM data_tenaga_teknis ORDER BY no ASC");
    $data = $stmt->fetchAll();
    jsonResponse(['success' => true, 'data' => $data]);
}

function cekSudahVerifikasi() {
    $nip = $_GET['nip'] ?? $_POST['nip'] ?? '';
    
    if (empty($nip)) {
        jsonResponse(['sudahVerifikasi' => false]);
    }
    
    $pdo = getConnection();
    
    // Check in hasil_verifikasi
    $stmt = $pdo->prepare("SELECT * FROM hasil_verifikasi WHERE nip = ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$nip]);
    $hasil = $stmt->fetch();
    
    if ($hasil) {
        jsonResponse([
            'sudahVerifikasi' => true,
            'data' => $hasil
        ]);
    }
    
    jsonResponse(['sudahVerifikasi' => false]);
}

function cariPegawaiByNIP() {
    $nip = $_GET['nip'] ?? $_POST['nip'] ?? '';
    
    if (empty($nip)) {
        jsonResponse(['found' => false, 'error' => 'NIP tidak boleh kosong']);
    }
    
    $pdo = getConnection();
    
    // Search in data_guru
    $stmt = $pdo->prepare("SELECT * FROM data_guru WHERE nip = ?");
    $stmt->execute([$nip]);
    $guru = $stmt->fetch();
    
    if ($guru) {
        jsonResponse([
            'found' => true,
            'type' => 'guru',
            'data' => $guru,
            'rowIndex' => $guru['id']
        ]);
    }
    
    // Search in data_tenaga_teknis
    $stmt = $pdo->prepare("SELECT * FROM data_tenaga_teknis WHERE nip = ?");
    $stmt->execute([$nip]);
    $tt = $stmt->fetch();
    
    if ($tt) {
        jsonResponse([
            'found' => true,
            'type' => 'tenaga_teknis',
            'data' => $tt,
            'rowIndex' => $tt['id']
        ]);
    }
    
    jsonResponse(['found' => false, 'message' => 'Data tidak ditemukan']);
}

function verifikasiPegawai() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $nip = $input['nip'] ?? '';
    $nama = $input['nama'] ?? '';
    $nik = $input['nik'] ?? '';
    $tipe = $input['tipe'] ?? '';
    $nomor_rekening = $input['nomor_rekening'] ?? '';
    $jabatan = $input['jabatan'] ?? '';
    $unit_kerja = $input['unit_kerja'] ?? '';
    $status_verifikasi = $input['status_verifikasi'] ?? 'Terverifikasi';
    $catatan = $input['catatan'] ?? '';
    $no_telp_pegawai = $input['no_telp_pegawai'] ?? '';
    $npwp = $input['npwp'] ?? '';
    $nama_bank = $input['nama_bank'] ?? '';
    
    if (empty($nip) || empty($nama)) {
        jsonResponse(['success' => false, 'error' => 'Data tidak lengkap'], 400);
    }
    
    $pdo = getConnection();
    
    // Check if already verified
    $stmt = $pdo->prepare("SELECT id FROM hasil_verifikasi WHERE nip = ?");
    $stmt->execute([$nip]);
    $existing = $stmt->fetch();
    
    $tanggal = date('Y-m-d H:i:s');
    
    if ($existing) {
        // Update existing
        $stmt = $pdo->prepare("UPDATE hasil_verifikasi SET 
            nama = ?, nik = ?, tipe = ?, nomor_rekening = ?, jabatan = ?, 
            unit_kerja = ?, status_verifikasi = ?, catatan = ?, tanggal_verifikasi = ?,
            no_telp_pegawai = ?, npwp = ?, nama_bank = ?
            WHERE nip = ?");
        $stmt->execute([$nama, $nik, $tipe, $nomor_rekening, $jabatan, $unit_kerja, $status_verifikasi, $catatan, $tanggal, $no_telp_pegawai, $npwp, $nama_bank, $nip]);
        jsonResponse(['success' => true, 'message' => 'Data verifikasi diperbarui']);
    } else {
        // Insert new - get next no
        $stmtNo = $pdo->query("SELECT COALESCE(MAX(no), 0) + 1 as next_no FROM hasil_verifikasi");
        $nextNo = $stmtNo->fetch()['next_no'];
        
        $stmt = $pdo->prepare("INSERT INTO hasil_verifikasi 
            (no, nip, nama, nik, tipe, nomor_rekening, jabatan, unit_kerja, status_verifikasi, catatan, tanggal_verifikasi, no_telp_pegawai, npwp, nama_bank) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$nextNo, $nip, $nama, $nik, $tipe, $nomor_rekening, $jabatan, $unit_kerja, $status_verifikasi, $catatan, $tanggal, $no_telp_pegawai, $npwp, $nama_bank]);
        jsonResponse(['success' => true, 'message' => 'Verifikasi berhasil disimpan']);
    }
}

function getHasilVerifikasi() {
    $tipe = $_GET['tipe'] ?? '';
    
    $pdo = getConnection();
    
    if ($tipe === 'guru') {
        $stmt = $pdo->query("SELECT * FROM hasil_verifikasi WHERE tipe = 'guru' ORDER BY tanggal_verifikasi DESC");
    } elseif ($tipe === 'tenaga_teknis') {
        $stmt = $pdo->query("SELECT * FROM hasil_verifikasi WHERE tipe = 'tenaga_teknis' ORDER BY tanggal_verifikasi DESC");
    } else {
        $stmt = $pdo->query("SELECT * FROM hasil_verifikasi ORDER BY tanggal_verifikasi DESC");
    }
    
    $data = $stmt->fetchAll();
    jsonResponse(['success' => true, 'data' => $data]);
}

function getStatistik() {
    $pdo = getConnection();
    
    $totalGuru = $pdo->query("SELECT COUNT(*) FROM data_guru")->fetchColumn();
    $totalTT = $pdo->query("SELECT COUNT(*) FROM data_tenaga_teknis")->fetchColumn();
    $totalVerifikasi = $pdo->query("SELECT COUNT(*) FROM hasil_verifikasi")->fetchColumn();
    $verifikasiGuru = $pdo->query("SELECT COUNT(*) FROM hasil_verifikasi WHERE tipe = 'guru'")->fetchColumn();
    $verifikasiTT = $pdo->query("SELECT COUNT(*) FROM hasil_verifikasi WHERE tipe = 'tenaga_teknis'")->fetchColumn();
    
    jsonResponse([
        'success' => true,
        'data' => [
            'total_guru' => (int)$totalGuru,
            'total_tenaga_teknis' => (int)$totalTT,
            'total_verifikasi' => (int)$totalVerifikasi,
            'verifikasi_guru' => (int)$verifikasiGuru,
            'verifikasi_tenaga_teknis' => (int)$verifikasiTT
        ]
    ]);
}

function importData() {
    $rawInput = file_get_contents('php://input');
    
    if (empty($rawInput)) {
        jsonResponse(['success' => false, 'error' => 'No data received'], 400);
    }
    
    $input = json_decode($rawInput, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        jsonResponse(['success' => false, 'error' => 'Invalid JSON: ' . json_last_error_msg()], 400);
    }
    
    $tipe = $input['tipe'] ?? '';
    $data = $input['data'] ?? [];
    
    if (empty($tipe)) {
        jsonResponse(['success' => false, 'error' => 'Tipe tidak boleh kosong'], 400);
    }
    
    if (empty($data) || !is_array($data)) {
        jsonResponse(['success' => false, 'error' => 'Data tidak boleh kosong'], 400);
    }
    
    $pdo = getConnection();
    $imported = 0;
    $errors = [];
    
    try {
        $pdo->beginTransaction();
        
        if ($tipe === 'guru') {
            $stmt = $pdo->prepare("INSERT INTO data_guru (no, nama, nik, nip, jabatan_sk, jenjang, unit_kerja, nomor_rekening) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE nama=VALUES(nama), nik=VALUES(nik), jabatan_sk=VALUES(jabatan_sk), 
                jenjang=VALUES(jenjang), unit_kerja=VALUES(unit_kerja), nomor_rekening=VALUES(nomor_rekening)");
            
            foreach ($data as $index => $row) {
                try {
                    $stmt->execute([
                        $row['no'] ?? null,
                        $row['nama'] ?? '',
                        $row['nik'] ?? '',
                        $row['nip'] ?? '',
                        $row['jabatan_sk'] ?? '',
                        $row['jenjang'] ?? '',
                        $row['unit_kerja'] ?? '',
                        $row['nomor_rekening'] ?? ''
                    ]);
                    $imported++;
                } catch (Exception $e) {
                    $errors[] = "Row " . ($index + 1) . ": " . $e->getMessage();
                }
            }
        } elseif ($tipe === 'tenaga_teknis') {
            $stmt = $pdo->prepare("INSERT INTO data_tenaga_teknis (no, nip, nik, nama, jabatan, pendidikan, unit_kerja, nomor_rekening) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE nama=VALUES(nama), nik=VALUES(nik), jabatan=VALUES(jabatan), 
                pendidikan=VALUES(pendidikan), unit_kerja=VALUES(unit_kerja), nomor_rekening=VALUES(nomor_rekening)");
            
            foreach ($data as $index => $row) {
                try {
                    $stmt->execute([
                        $row['no'] ?? null,
                        $row['nip'] ?? '',
                        $row['nik'] ?? '',
                        $row['nama'] ?? '',
                        $row['jabatan'] ?? '',
                        $row['pendidikan'] ?? '',
                        $row['unit_kerja'] ?? '',
                        $row['nomor_rekening'] ?? ''
                    ]);
                    $imported++;
                } catch (Exception $e) {
                    $errors[] = "Row " . ($index + 1) . ": " . $e->getMessage();
                }
            }
        } else {
            jsonResponse(['success' => false, 'error' => 'Tipe tidak valid: ' . $tipe], 400);
        }
        
        $pdo->commit();
        
        $response = ['success' => true, 'message' => "Berhasil import $imported data", 'imported' => $imported];
        if (!empty($errors)) {
            $response['warnings'] = $errors;
        }
        jsonResponse($response);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'error' => 'Import failed: ' . $e->getMessage()], 500);
    }
}

function hapusData() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $tipe = $input['tipe'] ?? '';
    $id = $input['id'] ?? '';
    
    if (empty($tipe) || empty($id)) {
        jsonResponse(['success' => false, 'error' => 'Data tidak lengkap'], 400);
    }
    
    $pdo = getConnection();
    
    $table = '';
    if ($tipe === 'guru') {
        $table = 'data_guru';
    } elseif ($tipe === 'tenaga_teknis') {
        $table = 'data_tenaga_teknis';
    } elseif ($tipe === 'verifikasi') {
        $table = 'hasil_verifikasi';
    }
    
    if ($table) {
        $stmt = $pdo->prepare("DELETE FROM $table WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['success' => true, 'message' => 'Data berhasil dihapus']);
    }
    
    jsonResponse(['success' => false, 'error' => 'Tipe tidak valid'], 400);
}

function truncateData() {
    $input = json_decode(file_get_contents('php://input'), true);
    $tipe = $input['tipe'] ?? 'all';
    
    $pdo = getConnection();
    
    try {
        if ($tipe === 'guru' || $tipe === 'all') {
            $pdo->exec("DELETE FROM data_guru");
            $pdo->exec("ALTER TABLE data_guru AUTO_INCREMENT = 1");
        }
        if ($tipe === 'tenaga_teknis' || $tipe === 'all') {
            $pdo->exec("DELETE FROM data_tenaga_teknis");
            $pdo->exec("ALTER TABLE data_tenaga_teknis AUTO_INCREMENT = 1");
        }
        if ($tipe === 'verifikasi' || $tipe === 'all') {
            $pdo->exec("DELETE FROM hasil_verifikasi");
            $pdo->exec("ALTER TABLE hasil_verifikasi AUTO_INCREMENT = 1");
        }
        
        jsonResponse(['success' => true, 'message' => "Data $tipe berhasil dihapus"]);
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

function setupDatabase() {
    $pdo = getConnection();
    
    // Create admin_users table for secure login
    $pdo->exec("CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        nama VARCHAR(100),
        email VARCHAR(100),
        is_active TINYINT(1) DEFAULT 1,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    
    // Insert default admin if not exists
    $checkAdmin = $pdo->query("SELECT COUNT(*) FROM admin_users WHERE username = 'admin'");
    if ($checkAdmin->fetchColumn() == 0) {
        $hashedPassword = password_hash(DEFAULT_ADMIN_PASS, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO admin_users (username, password_hash, nama) VALUES (?, ?, ?)");
        $stmt->execute(['admin', $hashedPassword, 'Administrator']);
    }
    
    // Drop and recreate hasil_verifikasi table with new structure
    $pdo->exec("DROP TABLE IF EXISTS hasil_verifikasi");
    
    // Create data_guru table
    $pdo->exec("CREATE TABLE IF NOT EXISTS data_guru (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    
    // Create data_tenaga_teknis table
    $pdo->exec("CREATE TABLE IF NOT EXISTS data_tenaga_teknis (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    
    // Create hasil_verifikasi table with new structure
    $pdo->exec("CREATE TABLE IF NOT EXISTS hasil_verifikasi (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    
    jsonResponse(['success' => true, 'message' => 'Database tables created successfully']);
}
?>
