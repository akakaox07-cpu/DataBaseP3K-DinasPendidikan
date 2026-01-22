import { useState, useMemo } from 'react';
import { FileSpreadsheet, FileText, Database } from 'lucide-react';
import type { Guru } from '../types';
import { ITEMS_PER_PAGE } from '../config';
import { exportToXLSX, exportToCSV, guruColumns } from '../utils/exportData';

interface DataGuruTableProps {
  data: Guru[];
  loading: boolean;
}

export default function DataGuruTable({ data, loading }: DataGuruTableProps) {
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const unitKerjaList = useMemo(() => {
    const units = [...new Set(data.map((item) => item.unit_kerja).filter(Boolean))];
    return units.sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        !search ||
        item.nama?.toLowerCase().includes(search.toLowerCase()) ||
        item.nip?.includes(search) ||
        item.nik?.includes(search);
      const matchUnit = !filterUnit || item.unit_kerja === filterUnit;
      return matchSearch && matchUnit;
    });
  }, [data, search, filterUnit]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Memuat data guru...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="controls">
        <input
          type="text"
          className="search-box"
          placeholder="🔍 Cari nama, NIP, atau NIK..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          className="filter-select"
          value={filterUnit}
          onChange={(e) => {
            setFilterUnit(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">📍 Semua Unit Kerja</option>
          {unitKerjaList.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
        <div className="export-buttons">
          <button
            className="btn btn-success btn-sm"
            onClick={() => exportToXLSX(filteredData, guruColumns, { filename: 'Data_Guru', sheetName: 'Data Guru' })}
            disabled={filteredData.length === 0}
            title="Export ke Excel"
          >
            <FileSpreadsheet size={16} strokeWidth={1.5} /> XLSX
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => exportToCSV(filteredData, guruColumns, { filename: 'Data_Guru' })}
            disabled={filteredData.length === 0}
            title="Export ke CSV"
          >
            <FileText size={16} strokeWidth={1.5} /> CSV
          </button>
        </div>
      </div>

      {paginatedData.length === 0 ? (
        <div className="empty-state">
          <Database size={48} strokeWidth={1.5} />
          <h4>Tidak Ada Data</h4>
          <p>{search || filterUnit ? 'Coba ubah filter pencarian Anda' : 'Belum ada data guru yang diimport'}</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>No</th>
                  <th>Nama</th>
                  <th style={{ width: '160px' }}>NIP</th>
                  <th style={{ width: '160px' }}>NIK</th>
                  <th>Jabatan</th>
                  <th>Unit Kerja</th>
                  <th style={{ width: '140px' }}>No. Rekening</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => (
                  <tr key={item.nip || index}>
                    <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--gray-400)' }}>
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td style={{ fontWeight: '600' }}>{item.nama || '-'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.nip || '-'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.nik || '-'}</td>
                    <td>{item.jabatan_sk || '-'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{item.unit_kerja || '-'}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: '500' }}>{item.nomor_rekening || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="info-text">
            Menampilkan {paginatedData.length} dari {filteredData.length.toLocaleString()} data
          </p>
        </>
      )}

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
        Menampilkan {paginatedData.length} dari {filteredData.length} data
      </p>
    </div>
  );
}
