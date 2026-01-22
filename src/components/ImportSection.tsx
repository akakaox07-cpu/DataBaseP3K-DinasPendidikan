import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, FileSpreadsheet, Trash2 } from 'lucide-react';
import { importData, truncateData } from '../services/api';
import * as XLSX from 'xlsx';

interface ImportSectionProps {
  onDataChange?: () => void;
}

export default function ImportSection({ onDataChange }: ImportSectionProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [progress, setProgress] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipe: 'guru' | 'tenaga_teknis') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);
    setProgress('Membaca file...');

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      let data: Record<string, unknown>[];

      if (fileExt === 'csv') {
        data = await readCSVFile(file, tipe);
      } else {
        data = await readExcelFile(file, tipe);
      }

      if (data.length === 0) {
        setMessage({ type: 'error', text: 'File tidak berisi data!' });
        setLoading(false);
        setProgress('');
        return;
      }

      setProgress(`Mengimport ${data.length} data... (cek console untuk detail)`);
      
      const result = await importData(tipe, data);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        // Refresh data setelah import berhasil
        onDataChange?.();
      } else {
        setMessage({ type: 'error', text: result.message || 'Gagal import data!' });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: `Error: ${errorMsg}` });
      console.error('Import error:', error);
    } finally {
      setLoading(false);
      setProgress('');
      e.target.value = '';
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === ',' || char === ';') && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const readCSVFile = (file: File, tipe: 'guru' | 'tenaga_teknis'): Promise<Record<string, unknown>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          
          if (!text || text.trim().length === 0) {
            reject(new Error('File CSV kosong'));
            return;
          }
          
          const lines = text.split(/\r?\n/).filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('File CSV harus memiliki header dan minimal 1 baris data'));
            return;
          }

          // Parse header
          const headers = parseCSVLine(lines[0]);
          console.log('CSV headers:', headers);
          
          // Parse data rows
          const jsonData: Record<string, unknown>[] = [];
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === 0 || values.every(v => !v)) continue;
            
            const row: Record<string, unknown> = {};
            headers.forEach((header, idx) => {
              row[header] = values[idx] || '';
            });
            jsonData.push(row);
          }
          
          console.log('CSV data parsed:', jsonData.length, 'rows');
          console.log('Sample row:', jsonData[0]);

          const mappedData = mapData(jsonData, tipe);
          resolve(mappedData);
        } catch (error) {
          console.error('CSV parse error:', error);
          reject(error);
        }
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error('Gagal membaca file CSV'));
      };
      reader.readAsText(file, 'UTF-8');
    });
  };

  const readExcelFile = (file: File, tipe: 'guru' | 'tenaga_teknis'): Promise<Record<string, unknown>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('File kosong atau tidak terbaca'));
            return;
          }
          
          // Use ArrayBuffer for better compatibility
          const workbook = XLSX.read(data, { type: 'array' });
          
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            reject(new Error('File Excel tidak memiliki sheet'));
            return;
          }
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          if (!worksheet) {
            reject(new Error('Sheet kosong'));
            return;
          }
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
          
          console.log('Excel data parsed:', jsonData.length, 'rows');
          console.log('Sample row:', jsonData[0]);

          const mappedData = mapData(jsonData, tipe);
          resolve(mappedData);
        } catch (error) {
          console.error('Excel parse error:', error);
          reject(error);
        }
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error('Gagal membaca file'));
      };
      // Use ArrayBuffer instead of BinaryString for better compatibility
      reader.readAsArrayBuffer(file);
    });
  };

  const mapData = (jsonData: Record<string, unknown>[], tipe: 'guru' | 'tenaga_teknis'): Record<string, unknown>[] => {
    return jsonData.map((row, index) => {
      if (tipe === 'guru') {
        return {
          no: index + 1,
          nama: row['NAMA'] || row['nama'] || row['Nama'] || '',
          nik: String(row['NIK'] || row['nik'] || row['Nik'] || ''),
          nip: String(row['NIP'] || row['nip'] || row['Nip'] || ''),
          jabatan_sk: row['JABATAN SK'] || row['jabatan_sk'] || row['JABATAN'] || row['Jabatan SK'] || row['Jabatan'] || '',
          jenjang: row['JENJANG'] || row['jenjang'] || row['Jenjang'] || '',
          unit_kerja: row['UNIT KERJA SPMT'] || row['UNIT KERJA'] || row['unit_kerja'] || row['Unit Kerja'] || '',
          nomor_rekening: String(row['Nomor Rekening'] || row['NOMOR REKENING'] || row['nomor_rekening'] || row['No Rekening'] || row['NO REKENING'] || ''),
        };
      } else {
        return {
          no: index + 1,
          nip: String(row['NIP'] || row['nip'] || row['Nip'] || ''),
          nik: String(row['NIK'] || row['nik'] || row['Nik'] || ''),
          nama: row['NAMA'] || row['nama'] || row['Nama'] || '',
          jabatan: row['JABATAN'] || row['jabatan'] || row['Jabatan'] || '',
          pendidikan: row['PENDIDIKAN'] || row['pendidikan'] || row['Pendidikan'] || '',
          unit_kerja: row['UNIT KERJA'] || row['unit_kerja'] || row['Unit Kerja'] || '',
          nomor_rekening: String(row['NOMOR REKENING'] || row['Nomor Rekening'] || row['nomor_rekening'] || row['No Rekening'] || row['NO REKENING'] || ''),
        };
      }
    });
  };

  return (
    <div className="import-section">
      {message && (
        <div className={`alert ${message.type}`} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {message.type === 'success' ? <CheckCircle size={18} strokeWidth={1.5} /> : <AlertCircle size={18} strokeWidth={1.5} />}
          {message.text}
        </div>
      )}

      {loading && (
        <div className="loading" style={{ marginBottom: '20px' }}>
          <div className="spinner"></div>
          <p>{progress || 'Mengimport data...'}</p>
        </div>
      )}

      <div className="import-card">
        <h3><FileSpreadsheet size={18} strokeWidth={1.5} /> Import Data Guru</h3>
        <p>
          Upload file Excel (.xlsx, .xls) atau CSV (.csv) berisi data guru.<br />
          <strong>Format kolom:</strong> NO, NAMA, NIK, NIP, JABATAN SK, JENJANG, UNIT KERJA SPMT, Nomor Rekening
        </p>
        <input 
          type="file" 
          className="file-input" 
          id="importGuru" 
          accept=".xlsx,.xls,.csv" 
          onChange={(e) => handleFileUpload(e, 'guru')}
          disabled={loading}
        />
        <label htmlFor="importGuru" className="btn btn-primary">
          <Upload size={16} strokeWidth={1.5} /> Pilih File Guru
        </label>
      </div>

      <div className="import-card">
        <h3><FileSpreadsheet size={18} strokeWidth={1.5} /> Import Tenaga Teknis</h3>
        <p>
          Upload file Excel (.xlsx, .xls) atau CSV (.csv) berisi data tenaga teknis.<br />
          <strong>Format kolom:</strong> No, NIP, NIK, NAMA, JABATAN, PENDIDIKAN, UNIT KERJA, NOMOR REKENING
        </p>
        <input 
          type="file" 
          className="file-input" 
          id="importTT" 
          accept=".xlsx,.xls,.csv" 
          onChange={(e) => handleFileUpload(e, 'tenaga_teknis')}
          disabled={loading}
        />
        <label htmlFor="importTT" className="btn btn-primary">
          <Upload size={16} strokeWidth={1.5} /> Pilih File Tenaga Teknis
        </label>
      </div>

      <div className="import-info" style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', fontSize: '0.9rem' }}>
        <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} strokeWidth={1.5} /> Panduan Import
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Format yang didukung: <strong>Excel (.xlsx, .xls)</strong> dan <strong>CSV (.csv)</strong></li>
          <li>Pastikan baris pertama berisi nama kolom (header)</li>
          <li>Untuk CSV, gunakan koma (,) atau titik koma (;) sebagai pemisah</li>
          <li>Data yang sudah ada dengan NIP sama akan diperbarui</li>
        </ul>
      </div>

      <div className="import-card" style={{ marginTop: '20px', background: '#fff5f5', borderColor: '#e53e3e' }}>
        <h3 style={{ color: '#c53030' }}><Trash2 size={18} strokeWidth={1.5} /> Hapus Semua Data</h3>
        <p style={{ color: '#742a2a' }}>
          <strong>Peringatan:</strong> Menghapus semua data tidak dapat dibatalkan!
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
          <button 
            className="btn btn-danger"
            onClick={async () => {
              if (window.confirm('Apakah Anda yakin ingin menghapus SEMUA data guru?')) {
                setLoading(true);
                try {
                  const result = await truncateData('guru');
                  setMessage({ type: result.success ? 'success' : 'error', text: result.message });
                  if (result.success) onDataChange?.();
                } catch (e) {
                  setMessage({ type: 'error', text: 'Gagal menghapus data' });
                }
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <Trash2 size={14} strokeWidth={1.5} /> Hapus Data Guru
          </button>
          <button 
            className="btn btn-danger"
            onClick={async () => {
              if (window.confirm('Apakah Anda yakin ingin menghapus SEMUA data tenaga teknis?')) {
                setLoading(true);
                try {
                  const result = await truncateData('tenaga_teknis');
                  setMessage({ type: result.success ? 'success' : 'error', text: result.message });
                  if (result.success) onDataChange?.();
                } catch (e) {
                  setMessage({ type: 'error', text: 'Gagal menghapus data' });
                }
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <Trash2 size={14} strokeWidth={1.5} /> Hapus Data Tenaga Teknis
          </button>
          <button 
            className="btn btn-danger"
            onClick={async () => {
              if (window.confirm('Apakah Anda yakin ingin menghapus SEMUA hasil verifikasi?')) {
                setLoading(true);
                try {
                  const result = await truncateData('verifikasi');
                  setMessage({ type: result.success ? 'success' : 'error', text: result.message });
                  if (result.success) onDataChange?.();
                } catch (e) {
                  setMessage({ type: 'error', text: 'Gagal menghapus data' });
                }
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <Trash2 size={14} strokeWidth={1.5} /> Hapus Hasil Verifikasi
          </button>
        </div>
      </div>
    </div>
  );
}
