import { useState, useMemo } from 'react';
import { GraduationCap, Wrench, FileSpreadsheet, FileText, Trash2, AlertTriangle, X } from 'lucide-react';
import type { HasilVerifikasi } from '../types';
import { ITEMS_PER_PAGE } from '../config';
import { exportToXLSX, exportToCSV, hasilVerifikasiColumns } from '../utils/exportData';
import { hapusVerifikasi } from '../services/api';

interface HasilVerifikasiTableProps {
  data: HasilVerifikasi[];
  loading: boolean;
  onDataChange?: () => void;
}

export default function HasilVerifikasiTable({ data, loading, onDataChange }: HasilVerifikasiTableProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'guru' | 'tt'>('guru');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<HasilVerifikasi | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (item: HasilVerifikasi) => {
    if (!item.id) return;
    setIsDeleting(true);
    try {
      const result = await hapusVerifikasi(item.id);
      if (result.success) {
        setDeleteConfirm(null);
        onDataChange?.();
      } else {
        alert('Gagal menghapus: ' + result.message);
      }
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Pisahkan data berdasarkan tipe
  const dataGuru = useMemo(() => {
    return data.filter((item) => item.tipe === 'guru');
  }, [data]);

  const dataTT = useMemo(() => {
    return data.filter((item) => item.tipe === 'tenaga_teknis');
  }, [data]);

  // Data yang aktif berdasarkan tab
  const activeData = activeTab === 'guru' ? dataGuru : dataTT;

  const filteredData = useMemo(() => {
    return activeData.filter((item) => {
      const matchSearch =
        !search ||
        item.nama?.toLowerCase().includes(search.toLowerCase()) ||
        item.nip?.includes(search);
      const matchStatus = !filterStatus || item.status_verifikasi === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [activeData, search, filterStatus]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTabChange = (tab: 'guru' | 'tt') => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearch('');
    setFilterStatus('');
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Memuat hasil verifikasi...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sub Tabs untuk Guru dan Tenaga Teknis */}
      <div className="sub-tabs">
        <button
          className={`sub-tab-btn ${activeTab === 'guru' ? 'active' : ''}`}
          onClick={() => handleTabChange('guru')}
        >
          <GraduationCap size={16} strokeWidth={1.5} /> Guru ({dataGuru.length})
        </button>
        <button
          className={`sub-tab-btn ${activeTab === 'tt' ? 'active' : ''}`}
          onClick={() => handleTabChange('tt')}
        >
          <Wrench size={16} strokeWidth={1.5} /> Tenaga Teknis ({dataTT.length})
        </button>
      </div>

      <div className="controls">
        <input
          type="text"
          className="search-box"
          placeholder="Cari nama atau NIP..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Semua Status</option>
          <option value="Terverifikasi">Terverifikasi</option>
          <option value="Belum Verifikasi">Belum Verifikasi</option>
        </select>
        <div className="export-buttons">
          <button
            className="btn btn-success btn-sm"
            onClick={() => exportToXLSX(filteredData, hasilVerifikasiColumns, { 
              filename: `Hasil_Verifikasi_${activeTab === 'guru' ? 'Guru' : 'Tenaga_Teknis'}`, 
              sheetName: `Verifikasi ${activeTab === 'guru' ? 'Guru' : 'Tenaga Teknis'}` 
            })}
            disabled={filteredData.length === 0}
            title="Export ke Excel"
          >
            <FileSpreadsheet size={16} strokeWidth={1.5} /> XLSX
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => exportToCSV(filteredData, hasilVerifikasiColumns, { 
              filename: `Hasil_Verifikasi_${activeTab === 'guru' ? 'Guru' : 'Tenaga_Teknis'}` 
            })}
            disabled={filteredData.length === 0}
            title="Export ke CSV"
          >
            <FileText size={16} strokeWidth={1.5} /> CSV
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama</th>
              <th>Jabatan</th>
              <th>NIP</th>
              <th>No Telp Pegawai</th>
              <th>NPWP</th>
              <th>Nomor Rekening</th>
              <th>Nama Bank</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                  Belum ada hasil verifikasi {activeTab === 'guru' ? 'Guru' : 'Tenaga Teknis'}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr key={item.nip || index}>
                  <td>{item.no || (currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                  <td>{item.nama || '-'}</td>
                  <td>{item.jabatan || '-'}</td>
                  <td>{item.nip || '-'}</td>
                  <td>{item.no_telp_pegawai || '-'}</td>
                  <td>{item.npwp || '-'}</td>
                  <td>{item.nomor_rekening || '-'}</td>
                  <td>{item.nama_bank || '-'}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleteConfirm(item)}
                      title="Hapus data verifikasi"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
            «
          </button>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            ‹
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let page: number;
            if (totalPages <= 5) {
              page = i + 1;
            } else if (currentPage <= 3) {
              page = i + 1;
            } else if (currentPage >= totalPages - 2) {
              page = totalPages - 4 + i;
            } else {
              page = currentPage - 2 + i;
            }
            return (
              <button
                key={page}
                className={currentPage === page ? 'active' : ''}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            );
          })}
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            ›
          </button>
          <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>
            »
          </button>
        </div>
      )}

      <p className="info-text">
        Menampilkan {paginatedData.length} dari {filteredData.length} data {activeTab === 'guru' ? 'Guru' : 'Tenaga Teknis'}
      </p>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !isDeleting && setDeleteConfirm(null)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => !isDeleting && setDeleteConfirm(null)}
              disabled={isDeleting}
            >
              <X size={20} strokeWidth={1.5} />
            </button>
            <div className="delete-modal-header">
              <AlertTriangle size={48} strokeWidth={1.5} className="delete-icon" />
              <h3>Hapus Data Verifikasi</h3>
            </div>
            <div className="delete-modal-body">
              <p>Apakah Anda yakin ingin menghapus data verifikasi berikut?</p>
              <div className="delete-info">
                <div className="delete-info-row">
                  <span className="label">Nama:</span>
                  <span className="value">{deleteConfirm.nama}</span>
                </div>
                <div className="delete-info-row">
                  <span className="label">NIP:</span>
                  <span className="value">{deleteConfirm.nip}</span>
                </div>
                <div className="delete-info-row">
                  <span className="label">Unit Kerja:</span>
                  <span className="value">{deleteConfirm.unit_kerja || '-'}</span>
                </div>
              </div>
              <p className="delete-warning">
                <strong>Peringatan:</strong> Data yang dihapus tidak dapat dikembalikan. 
                Pegawai terkait akan dapat mengisi ulang form verifikasi.
              </p>
            </div>
            <div className="delete-modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
              >
                Batal
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting}
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
