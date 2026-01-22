import { API_URL } from '../config';
import type { Guru, TenagaTeknis, HasilVerifikasi, SearchResult, Statistics } from '../types';

async function fetchAPI<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

async function postAPI<T>(action: string, data: Record<string, unknown>): Promise<T> {
  const response = await fetch(API_URL + '?action=' + action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  const text = await response.text();
  
  if (!response.ok) {
    console.error('API Error Response:', text);
    throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`);
  }
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('JSON Parse Error:', text);
    throw new Error('Invalid JSON response: ' + text.substring(0, 200));
  }
}

export async function getDataGuru(): Promise<Guru[]> {
  const result = await fetchAPI<{ success: boolean; data: Guru[] }>('getDataGuru');
  return result.data || [];
}

export async function getDataTenagaTeknis(): Promise<TenagaTeknis[]> {
  const result = await fetchAPI<{ success: boolean; data: TenagaTeknis[] }>('getDataTenagaTeknis');
  return result.data || [];
}

export async function getHasilVerifikasi(tipe?: string): Promise<HasilVerifikasi[]> {
  const params: Record<string, string> = tipe ? { tipe } : {};
  const result = await fetchAPI<{ success: boolean; data: HasilVerifikasi[] }>('getHasilVerifikasi', params);
  return result.data || [];
}

export async function getStatistics(): Promise<Statistics> {
  const result = await fetchAPI<{ success: boolean; data: Statistics }>('getStatistik');
  return result.data;
}

export async function cariPegawaiByNIP(nip: string): Promise<SearchResult> {
  return fetchAPI<SearchResult>('cariPegawaiByNIP', { nip });
}

export async function verifikasiPegawai(data: {
  nip: string;
  nama: string;
  nik: string;
  tipe: string;
  nomor_rekening: string;
  jabatan: string;
  unit_kerja: string;
  status_verifikasi?: string;
  catatan?: string;
  no_telp_pegawai?: string;
  npwp?: string;
  nama_bank?: string;
}): Promise<{ success: boolean; message: string }> {
  return postAPI('verifikasiPegawai', data);
}

export async function importData(tipe: string, data: unknown[]): Promise<{ success: boolean; message: string }> {
  const BATCH_SIZE = 100; // Send 100 rows at a time
  let totalImported = 0;
  let errors: string[] = [];
  
  // Split data into batches
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(data.length / BATCH_SIZE);
    
    console.log(`Importing batch ${batchNum}/${totalBatches} (${batch.length} rows)...`);
    
    try {
      const result = await postAPI<{ success: boolean; message: string; imported?: number }>('importData', { tipe, data: batch });
      if (result.success) {
        totalImported += result.imported || batch.length;
      } else {
        errors.push(`Batch ${batchNum}: ${result.message}`);
      }
    } catch (e) {
      errors.push(`Batch ${batchNum}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }
  
  if (errors.length > 0) {
    return {
      success: totalImported > 0,
      message: `Berhasil import ${totalImported} dari ${data.length} data. Errors: ${errors.slice(0, 3).join('; ')}`
    };
  }
  
  return {
    success: true,
    message: `Berhasil import ${totalImported} data`
  };
}

export async function hapusData(tipe: string, id: number): Promise<{ success: boolean; message: string }> {
  return postAPI('hapusData', { tipe, id });
}

export async function login(username: string, password: string): Promise<{ success: boolean; message?: string; error?: string }> {
  return postAPI('login', { username, password });
}

export async function changePassword(
  username: string, 
  oldPassword: string, 
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  return postAPI('changePassword', { username, oldPassword, newPassword });
}

export async function truncateData(tipe: 'guru' | 'tenaga_teknis' | 'verifikasi' | 'all'): Promise<{ success: boolean; message: string }> {
  return postAPI('truncateData', { tipe });
}

export async function cekSudahVerifikasi(nip: string): Promise<{ sudahVerifikasi: boolean; data?: HasilVerifikasi }> {
  return fetchAPI<{ sudahVerifikasi: boolean; data?: HasilVerifikasi }>('cekSudahVerifikasi', { nip });
}

export async function hapusVerifikasi(id: number): Promise<{ success: boolean; message: string }> {
  return postAPI('hapusData', { tipe: 'verifikasi', id });
}