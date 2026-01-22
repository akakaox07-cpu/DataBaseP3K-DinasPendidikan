import { useState } from 'react';
import { Search, CheckCircle, CreditCard, Save, FileText, Loader2, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { cariPegawaiByNIP, verifikasiPegawai, cekSudahVerifikasi } from '../services/api';
import type { Guru, TenagaTeknis, HasilVerifikasi } from '../types';

export default function VerificationForm() {
  const [nip, setNip] = useState('');
  const [loading, setLoading] = useState(false);
  const [pegawaiData, setPegawaiData] = useState<(Guru | TenagaTeknis) | null>(null);
  const [kategori, setKategori] = useState<'guru' | 'tenaga_teknis' | ''>('');
  const [nomorRekening, setNomorRekening] = useState('');
  const [catatan, setCatatan] = useState('');
  const [noTelpPegawai, setNoTelpPegawai] = useState('');
  const [npwp, setNpwp] = useState('');
  const [namaBank, setNamaBank] = useState('');
  const [namaBankLainnya, setNamaBankLainnya] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; text: string } | null>(null);
  const [sudahVerifikasi, setSudahVerifikasi] = useState(false);
  const [dataVerifikasi, setDataVerifikasi] = useState<HasilVerifikasi | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDataConfirmed, setIsDataConfirmed] = useState(false);

  const handleCariNIP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nip.trim()) {
      setMessage({ type: 'error', text: 'Masukkan NIP terlebih dahulu!' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setPegawaiData(null);
    setNomorRekening('');
    setNoTelpPegawai('');
    setNpwp('');
    setNamaBank('');
    setNamaBankLainnya('');
    setSudahVerifikasi(false);
    setDataVerifikasi(null);
    setShowConfirmation(false);
    setIsDataConfirmed(false);

    try {
      // Cek apakah sudah terverifikasi
      const cekResult = await cekSudahVerifikasi(nip.trim());
      
      if (cekResult.sudahVerifikasi && cekResult.data) {
        setSudahVerifikasi(true);
        setDataVerifikasi(cekResult.data);
        setMessage({ type: 'warning', text: 'Data dengan NIP ini sudah terverifikasi sebelumnya!' });
        setLoading(false);
        return;
      }

      // Jika belum terverifikasi, cari data pegawai
      const result = await cariPegawaiByNIP(nip.trim());
      if (result.found && result.data) {
        setPegawaiData(result.data);
        setKategori(result.type || '');
        setNomorRekening(String(result.data.nomor_rekening || ''));
        setMessage({ type: 'success', text: 'Data ditemukan!' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Data tidak ditemukan!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal mengambil data. Coba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Jika belum konfirmasi, tampilkan dialog konfirmasi
    if (!showConfirmation) {
      if (!pegawaiData) {
        setMessage({ type: 'error', text: 'Data pegawai tidak ditemukan!' });
        return;
      }

      if (!nomorRekening.trim()) {
        setMessage({ type: 'error', text: 'Masukkan nomor rekening!' });
        return;
      }

      if (!namaBank) {
        setMessage({ type: 'error', text: 'Pilih nama bank!' });
        return;
      }

      if (namaBank === 'Lainnya' && !namaBankLainnya.trim()) {
        setMessage({ type: 'error', text: 'Masukkan nama bank!' });
        return;
      }
      
      setShowConfirmation(true);
      return;
    }

    // Jika sudah konfirmasi tapi belum centang, tampilkan pesan
    if (!isDataConfirmed) {
      setMessage({ type: 'error', text: 'Centang kotak konfirmasi untuk melanjutkan!' });
      return;
    }

    setLoading(true);
    try {
      const jabatan = kategori === 'guru' 
        ? (pegawaiData as Guru).jabatan_sk 
        : (pegawaiData as TenagaTeknis).jabatan;

      const result = await verifikasiPegawai({
        nip: pegawaiData!.nip,
        nama: pegawaiData!.nama,
        nik: pegawaiData!.nik,
        tipe: kategori,
        nomor_rekening: nomorRekening,
        jabatan: jabatan || '',
        unit_kerja: pegawaiData!.unit_kerja,
        status_verifikasi: 'Terverifikasi',
        catatan: catatan,
        no_telp_pegawai: noTelpPegawai,
        npwp: npwp,
        nama_bank: namaBank === 'Lainnya' ? namaBankLainnya : namaBank,
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Verifikasi berhasil disimpan!' });
        // Reset form
        setNip('');
        setPegawaiData(null);
        setKategori('');
        setNomorRekening('');
        setCatatan('');
        setNoTelpPegawai('');
        setNpwp('');
        setNamaBank('');
        setNamaBankLainnya('');
        setShowConfirmation(false);
        setIsDataConfirmed(false);
      } else {
        setMessage({ type: 'error', text: result.message || 'Gagal menyimpan!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan. Coba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setIsDataConfirmed(false);
  };

  const getJabatan = () => {
    if (!pegawaiData) return '-';
    if (kategori === 'guru') {
      return (pegawaiData as Guru).jabatan_sk || '-';
    }
    return (pegawaiData as TenagaTeknis).jabatan || '-';
  };

  return (
    <div className="landing-section">
      <div className="form-section">
        {message && (
          <div className={`alert ${message.type}`}>
            {message.type === 'success' && <CheckCircle size={18} strokeWidth={1.5} />}
            {message.type === 'error' && <AlertTriangle size={18} strokeWidth={1.5} />}
            {message.type === 'info' && <Info size={18} strokeWidth={1.5} />}
            {message.type === 'warning' && <AlertTriangle size={18} strokeWidth={1.5} />}
            {message.text}
          </div>
        )}

        <div className="form-card">
          <h3><FileText size={20} strokeWidth={1.5} /> Form Verifikasi Data Pegawai</h3>
          <p style={{ color: 'var(--gray-500)', marginBottom: '24px', marginTop: '-12px' }}>
            Masukkan NIP untuk mencari dan memverifikasi data pegawai PPPK
          </p>
          <form onSubmit={handleCariNIP}>
            <div className="form-group">
              <label>NIP (Nomor Induk Pegawai) <span className="required">*</span></label>
              <div className="input-with-button">
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="Masukkan NIP 18 digit"
                  maxLength={18}
                  disabled={loading}
                />
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '140px' }}>
                  {loading ? <><Loader2 size={18} strokeWidth={1.5} className="icon-spin" /> Mencari...</> : <><Search size={18} strokeWidth={1.5} /> Cari</>}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Tampilan jika data sudah terverifikasi */}
        {sudahVerifikasi && dataVerifikasi && (
          <div className="verified-display">
            <div className="verified-header">
              <ShieldCheck size={24} strokeWidth={1.5} />
              <div>
                <h4>Data Sudah Terverifikasi</h4>
                <p>Data dengan NIP ini sudah diverifikasi pada {dataVerifikasi.tanggal_verifikasi}</p>
              </div>
            </div>
            <div className="verified-info">
              <div className="verified-item">
                <span className="label">Nama</span>
                <span className="value">{dataVerifikasi.nama}</span>
              </div>
              <div className="verified-item">
                <span className="label">NIP</span>
                <span className="value">{dataVerifikasi.nip}</span>
              </div>
              <div className="verified-item">
                <span className="label">NIK</span>
                <span className="value">{dataVerifikasi.nik}</span>
              </div>
              <div className="verified-item">
                <span className="label">Jabatan</span>
                <span className="value">{dataVerifikasi.jabatan}</span>
              </div>
              <div className="verified-item">
                <span className="label">Unit Kerja</span>
                <span className="value">{dataVerifikasi.unit_kerja}</span>
              </div>
              <div className="verified-item">
                <span className="label">No. Rekening</span>
                <span className="value">{dataVerifikasi.nomor_rekening}</span>
              </div>
              <div className="verified-item">
                <span className="label">Bank</span>
                <span className="value">{dataVerifikasi.nama_bank || '-'}</span>
              </div>
              <div className="verified-item">
                <span className="label">Status</span>
                <span className="value status-badge">{dataVerifikasi.status_verifikasi}</span>
              </div>
            </div>
            <div className="verified-note">
              <AlertTriangle size={16} strokeWidth={1.5} />
              <span>Data yang sudah terverifikasi tidak dapat diubah. Hubungi admin jika ada kesalahan data.</span>
            </div>
          </div>
        )}

        {pegawaiData && !sudahVerifikasi && (
          <>
            <div className="data-display">
              <h4><CheckCircle size={18} strokeWidth={1.5} /> Data Pegawai Ditemukan</h4>
              <div className="data-grid">
                <div className="data-item">
                  <span className="label">Nama</span>
                  <span className="value">{pegawaiData.nama}</span>
                </div>
                <div className="data-item">
                  <span className="label">NIP</span>
                  <span className="value">{pegawaiData.nip}</span>
                </div>
                <div className="data-item">
                  <span className="label">NIK</span>
                  <span className="value">{pegawaiData.nik}</span>
                </div>
                <div className="data-item">
                  <span className="label">Kategori</span>
                  <span className="value" style={{ color: kategori === 'guru' ? 'var(--primary)' : 'var(--success)' }}>
                    {kategori === 'guru' ? '👨‍🏫 Guru' : '🔧 Tenaga Teknis'}
                  </span>
                </div>
                <div className="data-item">
                  <span className="label">Jabatan</span>
                  <span className="value">{getJabatan()}</span>
                </div>
                <div className="data-item">
                  <span className="label">Unit Kerja</span>
                  <span className="value">{pegawaiData.unit_kerja}</span>
                </div>
              </div>
            </div>

            <div className="form-card">
              <h3><CreditCard size={20} strokeWidth={1.5} /> Form Verifikasi Data</h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label>No. Telp Pegawai</label>
                    <input
                      type="text"
                      value={noTelpPegawai}
                      onChange={(e) => setNoTelpPegawai(e.target.value)}
                      placeholder="081234567890"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label>NPWP</label>
                    <input
                      type="text"
                      value={npwp}
                      onChange={(e) => setNpwp(e.target.value)}
                      placeholder="12.345.678.9-012.345"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label>Nomor Rekening <span className="required">*</span></label>
                  <input
                    type="text"
                    value={nomorRekening}
                    onChange={(e) => setNomorRekening(e.target.value)}
                    placeholder="Masukkan nomor rekening"
                    style={{ fontWeight: '600', letterSpacing: '1px' }}
                  />
                  <small style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>Edit jika nomor rekening tidak sesuai</small>
                </div>

                <div className="form-group">
                  <label>Nama Bank <span className="required">*</span></label>
                  <select
                    value={namaBank}
                    onChange={(e) => {
                      setNamaBank(e.target.value);
                      if (e.target.value !== 'Lainnya') {
                        setNamaBankLainnya('');
                      }
                    }}
                  >
                    <option value="">-- Pilih Bank --</option>
                    <option value="BRI">🏦 BRI</option>
                    <option value="BNI">🏦 BNI</option>
                    <option value="Mandiri">🏦 Mandiri</option>
                    <option value="BTN">🏦 BTN</option>
                    <option value="Bank Banten">🏦 Bank Banten</option>
                    <option value="BJB">🏦 BJB</option>
                    <option value="Lainnya">📝 Lainnya</option>
                  </select>
                </div>

                {namaBank === 'Lainnya' && (
                  <div className="form-group">
                    <label>Nama Bank Lainnya</label>
                    <input
                      type="text"
                      value={namaBankLainnya}
                      onChange={(e) => setNamaBankLainnya(e.target.value)}
                      placeholder="Masukkan nama bank"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Catatan (Opsional)</label>
                  <textarea
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Tambahkan catatan jika diperlukan"
                    rows={2}
                  />
                </div>

                {/* Warning Note sebelum submit */}
                <div className="form-note warning">
                  <AlertTriangle size={16} strokeWidth={1.5} />
                  <div>
                    <strong>Perhatian!</strong>
                    <ul>
                      <li>Pastikan semua data yang Anda masukkan sudah benar</li>
                      <li>Data yang sudah diverifikasi <strong>tidak dapat diubah</strong></li>
                      <li>Hubungi admin jika ada kesalahan setelah verifikasi</li>
                    </ul>
                  </div>
                </div>

                {/* Confirmation Modal */}
                {showConfirmation && (
                  <div className="confirmation-box">
                    <div className="confirmation-header">
                      <Info size={18} strokeWidth={1.5} />
                      <span>Konfirmasi Data Verifikasi</span>
                    </div>
                    <div className="confirmation-summary">
                      <div className="summary-row">
                        <span>Nama:</span>
                        <strong>{pegawaiData?.nama}</strong>
                      </div>
                      <div className="summary-row">
                        <span>NIP:</span>
                        <strong>{pegawaiData?.nip}</strong>
                      </div>
                      <div className="summary-row">
                        <span>No. Rekening:</span>
                        <strong>{nomorRekening}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Bank:</span>
                        <strong>{namaBank === 'Lainnya' ? namaBankLainnya : namaBank}</strong>
                      </div>
                    </div>
                    <label className="confirmation-checkbox">
                      <input
                        type="checkbox"
                        checked={isDataConfirmed}
                        onChange={(e) => setIsDataConfirmed(e.target.checked)}
                      />
                      <span>Saya menyatakan bahwa ini adalah data saya dan data yang saya masukkan sudah benar</span>
                    </label>
                    <div className="confirmation-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCancelConfirmation}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="btn btn-success"
                        disabled={loading || !isDataConfirmed}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="icon-spin" size={18} strokeWidth={1.5} />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save size={18} strokeWidth={1.5} />
                            Ya, Simpan Data
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {!showConfirmation && (
                  <button
                    type="submit"
                    className="btn btn-success btn-lg"
                    style={{ width: '100%' }}
                    disabled={loading}
                  >
                    <Save size={18} strokeWidth={1.5} />
                    Lanjutkan Verifikasi
                  </button>
                )}
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
