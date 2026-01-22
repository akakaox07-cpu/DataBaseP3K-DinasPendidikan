export interface Guru {
  id?: number;
  no: number;
  nama: string;
  nik: string;
  nip: string;
  jabatan_sk: string;
  jenjang: string;
  unit_kerja: string;
  nomor_rekening: string | number;
  created_at?: string;
}

export interface TenagaTeknis {
  id?: number;
  no: number;
  nip: string;
  nik: string;
  nama: string;
  jabatan: string;
  pendidikan: string;
  unit_kerja: string;
  nomor_rekening: string | number;
  created_at?: string;
}

export interface HasilVerifikasi {
  id?: number;
  no?: number;
  nama: string;
  jabatan: string;
  nip: string;
  no_telp_pegawai?: string;
  npwp?: string;
  nomor_rekening: string;
  nama_bank?: string;
  nik: string;
  tipe: 'guru' | 'tenaga_teknis';
  unit_kerja: string;
  status_verifikasi: string;
  catatan?: string;
  tanggal_verifikasi: string;
  created_at?: string;
}

export interface SearchResult {
  found: boolean;
  type?: 'guru' | 'tenaga_teknis';
  data?: Guru | TenagaTeknis;
  rowIndex?: number;
  message?: string;
}

export interface Statistics {
  total_guru: number;
  total_tenaga_teknis: number;
  total_verifikasi: number;
  verifikasi_guru: number;
  verifikasi_tenaga_teknis: number;
}

export type TabType = 'guru' | 'tt' | 'hasil' | 'import';
