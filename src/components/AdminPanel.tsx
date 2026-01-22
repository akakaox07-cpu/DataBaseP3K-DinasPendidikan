import { useState, useEffect, useCallback } from 'react';
import { 
  GraduationCap, Wrench, CheckCircle, Upload, Lock, Key, 
  RefreshCw, TrendingUp, AlertTriangle, BarChart3, Users,
  Download, Calendar, FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import DataGuruTable from './DataGuruTable';
import DataTTTable from './DataTTTable';
import HasilVerifikasiTable from './HasilVerifikasiTable';
import ImportSection from './ImportSection';
import ChangePasswordModal from './ChangePasswordModal';
import { getStatistics, getDataGuru, getDataTenagaTeknis, getHasilVerifikasi } from '../services/api';
import type { Statistics, Guru, TenagaTeknis, HasilVerifikasi, TabType } from '../types';

export default function AdminPanel() {
  const { isLoggedIn, username } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('guru');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [stats, setStats] = useState<Statistics>({
    total_guru: 0,
    total_tenaga_teknis: 0,
    total_verifikasi: 0,
    verifikasi_guru: 0,
    verifikasi_tenaga_teknis: 0,
  });
  const [dataGuru, setDataGuru] = useState<Guru[]>([]);
  const [dataTT, setDataTT] = useState<TenagaTeknis[]>([]);
  const [dataHasil, setDataHasil] = useState<HasilVerifikasi[]>([]);
  const [loading, setLoading] = useState({
    stats: true,
    guru: false,
    tt: false,
    hasil: false,
  });

  // Countdown timer
  useEffect(() => {
    const targetDate = new Date('2026-03-13T23:59:59').getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      
      if (difference > 0) {
        setCountdown({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      if (activeTab === 'guru' && dataGuru.length === 0) {
        loadDataGuru();
      } else if (activeTab === 'tt' && dataTT.length === 0) {
        loadDataTT();
      } else if (activeTab === 'hasil' && dataHasil.length === 0) {
        loadDataHasil();
      }
    }
  }, [activeTab, isLoggedIn]);

  const loadStats = async () => {
    try {
      const result = await getStatistics();
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading((prev) => ({ ...prev, stats: false }));
    }
  };

  const loadDataGuru = async () => {
    setLoading((prev) => ({ ...prev, guru: true }));
    try {
      const result = await getDataGuru();
      setDataGuru(result);
    } catch (error) {
      console.error('Failed to load guru data:', error);
    } finally {
      setLoading((prev) => ({ ...prev, guru: false }));
    }
  };

  const loadDataTT = async () => {
    setLoading((prev) => ({ ...prev, tt: true }));
    try {
      const result = await getDataTenagaTeknis();
      setDataTT(result);
    } catch (error) {
      console.error('Failed to load TT data:', error);
    } finally {
      setLoading((prev) => ({ ...prev, tt: false }));
    }
  };

  const loadDataHasil = async () => {
    setLoading((prev) => ({ ...prev, hasil: true }));
    try {
      const result = await getHasilVerifikasi();
      setDataHasil(result);
    } catch (error) {
      console.error('Failed to load hasil verifikasi:', error);
    } finally {
      setLoading((prev) => ({ ...prev, hasil: false }));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await handleDataChange();
    setIsRefreshing(false);
  };

  const handleDataChange = useCallback(async () => {
    await loadStats();
    setDataGuru([]);
    setDataTT([]);
    setDataHasil([]);
    if (activeTab === 'guru') {
      await loadDataGuru();
    } else if (activeTab === 'tt') {
      await loadDataTT();
    } else if (activeTab === 'hasil') {
      await loadDataHasil();
    }
  }, [activeTab]);

  // Helper to format values
  const formatValue = (value: string | number | undefined | null): string => {
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  };

  // Export to PDF functions
  const exportToPDF = async (type: 'guru' | 'tt' | 'hasil' | 'all') => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const timestamp = new Date().toISOString().split('T')[0];
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 15;

    // Helper function to add header
    const addHeader = (title: string) => {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('DINAS PENDIDIKAN DAN KEBUDAYAAN', pageWidth / 2, currentY, { align: 'center' });
      currentY += 7;
      doc.setFontSize(12);
      doc.text('KABUPATEN SERANG', pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;
      doc.setFontSize(14);
      doc.text(title, pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;
    };

    // Helper function to add new page
    const addNewPage = (title: string) => {
      doc.addPage();
      currentY = 15;
      addHeader(title);
    };

    if (type === 'guru' || type === 'all') {
      let guruData = dataGuru;
      if (guruData.length === 0) {
        guruData = await getDataGuru();
      }
      
      addHeader('LAPORAN DATA GURU PPPK');
      
      const guruTableData = guruData.map((g, idx) => [
        idx + 1,
        g.nama,
        formatValue(g.nip),
        formatValue(g.nik),
        g.jabatan_sk || '-',
        g.unit_kerja || '-'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['No', 'Nama', 'NIP', 'NIK', 'Jabatan SK', 'Unit Kerja']],
        body: guruTableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 45 },
          2: { cellWidth: 35 },
          3: { cellWidth: 35 },
          4: { cellWidth: 40 },
          5: { cellWidth: 60 }
        }
      });

      // Add footer with total
      const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || currentY;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Data Guru: ${guruData.length}`, 14, finalY + 10);
    }
    
    if (type === 'tt' || type === 'all') {
      let ttData = dataTT;
      if (ttData.length === 0) {
        ttData = await getDataTenagaTeknis();
      }
      
      if (type === 'all') {
        addNewPage('LAPORAN DATA TENAGA TEKNIS PPPK');
      } else {
        addHeader('LAPORAN DATA TENAGA TEKNIS PPPK');
      }
      
      const ttTableData = ttData.map((t, idx) => [
        idx + 1,
        t.nama,
        formatValue(t.nip),
        formatValue(t.nik),
        t.jabatan || '-',
        t.pendidikan || '-',
        t.unit_kerja || '-'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['No', 'Nama', 'NIP', 'NIK', 'Jabatan', 'Pendidikan', 'Unit Kerja']],
        body: ttTableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 35 },
          5: { cellWidth: 25 },
          6: { cellWidth: 55 }
        }
      });

      const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || currentY;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Tenaga Teknis: ${ttData.length}`, 14, finalY + 10);
    }
    
    if (type === 'hasil' || type === 'all') {
      let hasilData = dataHasil;
      if (hasilData.length === 0) {
        hasilData = await getHasilVerifikasi();
      }
      
      if (type === 'all') {
        addNewPage('LAPORAN HASIL VERIFIKASI PPPK');
      } else {
        addHeader('LAPORAN HASIL VERIFIKASI PPPK');
      }
      
      const hasilTableData = hasilData.map((h, idx) => [
        idx + 1,
        h.nama,
        formatValue(h.nip),
        h.tipe === 'guru' ? 'Guru' : 'Tenaga Teknis',
        h.unit_kerja || '-',
        formatValue(h.nomor_rekening),
        h.nama_bank || '-',
        h.tanggal_verifikasi
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['No', 'Nama', 'NIP', 'Tipe', 'Unit Kerja', 'No. Rekening', 'Bank', 'Tgl Verifikasi']],
        body: hasilTableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { cellWidth: 25 },
          4: { cellWidth: 50 },
          5: { cellWidth: 30 },
          6: { cellWidth: 25 },
          7: { cellWidth: 30 }
        }
      });

      const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || currentY;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Terverifikasi: ${hasilData.length}`, 14, finalY + 10);
    }
    
    // Add summary page for 'all' type
    if (type === 'all') {
      addNewPage('RINGKASAN LAPORAN PPPK');
      
      const summaryData = [
        ['Total Data Guru', stats.total_guru.toLocaleString()],
        ['Guru Terverifikasi', stats.verifikasi_guru.toLocaleString()],
        ['Total Tenaga Teknis', stats.total_tenaga_teknis.toLocaleString()],
        ['Tenaga Teknis Terverifikasi', stats.verifikasi_tenaga_teknis.toLocaleString()],
        ['Total Pegawai', totalData.toLocaleString()],
        ['Total Terverifikasi', stats.total_verifikasi.toLocaleString()],
        ['Persentase Verifikasi', `${verifikasiPercentage}%`]
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Keterangan', 'Jumlah']],
        body: summaryData,
        styles: { fontSize: 11, cellPadding: 4 },
        headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 50, halign: 'center' }
        }
      });
    }
    
    const filename = type === 'all' 
      ? `Laporan_Lengkap_PPPK_${timestamp}.pdf`
      : type === 'guru'
      ? `Laporan_Guru_PPPK_${timestamp}.pdf`
      : type === 'tt'
      ? `Laporan_Tenaga_Teknis_${timestamp}.pdf`
      : `Laporan_Verifikasi_${timestamp}.pdf`;
    
    doc.save(filename);
  };

  // Calculate progress
  const totalData = (stats.total_guru || 0) + (stats.total_tenaga_teknis || 0);
  const verifikasiPercentage = totalData > 0 
    ? Math.round(((stats.total_verifikasi || 0) / totalData) * 100) 
    : 0;
  const guruPercentage = stats.total_guru > 0 
    ? Math.round(((stats.verifikasi_guru || 0) / stats.total_guru) * 100) 
    : 0;
  const ttPercentage = stats.total_tenaga_teknis > 0 
    ? Math.round(((stats.verifikasi_tenaga_teknis || 0) / stats.total_tenaga_teknis) * 100) 
    : 0;

  if (!isLoggedIn) {
    return (
      <div className="admin-panel">
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon purple"><GraduationCap size={20} strokeWidth={1.5} /></div>
            <div className="stat-info">
              <div className="stat-number">{(stats.total_guru || 0).toLocaleString()}</div>
              <div className="stat-label">Data Guru</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><Wrench size={20} strokeWidth={1.5} /></div>
            <div className="stat-info">
              <div className="stat-number">{(stats.total_tenaga_teknis || 0).toLocaleString()}</div>
              <div className="stat-label">Tenaga Teknis</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><CheckCircle size={20} strokeWidth={1.5} /></div>
            <div className="stat-info">
              <div className="stat-number">{(stats.total_verifikasi || 0).toLocaleString()}</div>
              <div className="stat-label">Terverifikasi</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><Users size={20} strokeWidth={1.5} /></div>
            <div className="stat-info">
              <div className="stat-number">{totalData.toLocaleString()}</div>
              <div className="stat-label">Total Pegawai</div>
            </div>
          </div>
        </div>
        <div className="locked-panel">
          <Lock size={32} strokeWidth={1.5} />
          <h3>Akses Terbatas</h3>
          <p>Login sebagai administrator untuk mengakses data pegawai dan hasil verifikasi.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
        username={username || 'admin'} 
      />

      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <BarChart3 size={20} strokeWidth={1.5} />
          <span>Dashboard Admin</span>
        </div>
        <div className="dashboard-actions">
          <button 
            className="btn-action" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh Data"
          >
            <RefreshCw size={16} strokeWidth={1.5} className={isRefreshing ? 'spin' : ''} />
          </button>
          <button 
            className="btn-action" 
            onClick={() => setShowPasswordModal(true)}
            title="Ganti Password"
          >
            <Key size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card clickable" onClick={() => setActiveTab('guru')}>
          <div className="stat-icon purple"><GraduationCap size={20} strokeWidth={1.5} /></div>
          <div className="stat-info">
            <div className="stat-number">{(stats.total_guru || 0).toLocaleString()}</div>
            <div className="stat-label">Data Guru</div>
          </div>
          <div className="stat-badge">{guruPercentage}%</div>
        </div>
        <div className="stat-card clickable" onClick={() => setActiveTab('tt')}>
          <div className="stat-icon green"><Wrench size={20} strokeWidth={1.5} /></div>
          <div className="stat-info">
            <div className="stat-number">{(stats.total_tenaga_teknis || 0).toLocaleString()}</div>
            <div className="stat-label">Tenaga Teknis</div>
          </div>
          <div className="stat-badge">{ttPercentage}%</div>
        </div>
        <div className="stat-card clickable" onClick={() => setActiveTab('hasil')}>
          <div className="stat-icon orange"><CheckCircle size={20} strokeWidth={1.5} /></div>
          <div className="stat-info">
            <div className="stat-number">{(stats.total_verifikasi || 0).toLocaleString()}</div>
            <div className="stat-label">Terverifikasi</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={20} strokeWidth={1.5} /></div>
          <div className="stat-info">
            <div className="stat-number">{totalData.toLocaleString()}</div>
            <div className="stat-label">Total Pegawai</div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="progress-section">
        <div className="progress-card">
          <div className="progress-header">
            <TrendingUp size={16} strokeWidth={1.5} />
            <span>Progress Verifikasi</span>
            <span className="progress-percent">{verifikasiPercentage}%</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${verifikasiPercentage}%` }}></div>
          </div>
          <div className="progress-details">
            <span>{(stats.total_verifikasi || 0).toLocaleString()} dari {totalData.toLocaleString()} pegawai terverifikasi</span>
          </div>
        </div>
        <div className="deadline-card">
          <div className="deadline-badge">
            <AlertTriangle size={14} strokeWidth={1.5} />
            <span>PERINGATAN</span>
          </div>
          <div className="deadline-title">Web Akan Dinonaktifkan</div>
          <div className="deadline-date-row">
            <Calendar size={14} strokeWidth={1.5} />
            <span>13 Maret 2026</span>
          </div>
          <div className="countdown-grid">
            <div className="countdown-item">
              <span className="countdown-value">{countdown.days}</span>
              <span className="countdown-label">Hari</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-value">{countdown.hours}</span>
              <span className="countdown-label">Jam</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-value">{countdown.minutes}</span>
              <span className="countdown-label">Menit</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-value">{countdown.seconds}</span>
              <span className="countdown-label">Detik</span>
            </div>
          </div>
          <div className="deadline-action">
            <Download size={14} strokeWidth={1.5} />
            <span>Export data sebelum layanan ditutup permanen</span>
          </div>
        </div>
      </div>

      {/* Download Reports Section */}
      <div className="reports-section">
        <div className="reports-header">
          <FileText size={16} strokeWidth={1.5} />
          <span>Unduh Laporan</span>
        </div>
        <div className="reports-grid">
          <button className="report-btn purple" onClick={() => exportToPDF('guru')}>
            <GraduationCap size={18} strokeWidth={1.5} />
            <div className="report-btn-info">
              <span className="report-btn-title">Data Guru</span>
              <span className="report-btn-desc">{stats.total_guru} data</span>
            </div>
            <FileText size={16} strokeWidth={1.5} />
          </button>
          <button className="report-btn green" onClick={() => exportToPDF('tt')}>
            <Wrench size={18} strokeWidth={1.5} />
            <div className="report-btn-info">
              <span className="report-btn-title">Tenaga Teknis</span>
              <span className="report-btn-desc">{stats.total_tenaga_teknis} data</span>
            </div>
            <FileText size={16} strokeWidth={1.5} />
          </button>
          <button className="report-btn orange" onClick={() => exportToPDF('hasil')}>
            <CheckCircle size={18} strokeWidth={1.5} />
            <div className="report-btn-info">
              <span className="report-btn-title">Hasil Verifikasi</span>
              <span className="report-btn-desc">{stats.total_verifikasi} data</span>
            </div>
            <FileText size={16} strokeWidth={1.5} />
          </button>
          <button className="report-btn blue" onClick={() => exportToPDF('all')}>
            <BarChart3 size={18} strokeWidth={1.5} />
            <div className="report-btn-info">
              <span className="report-btn-title">Laporan Lengkap</span>
              <span className="report-btn-desc">Semua data + ringkasan</span>
            </div>
            <FileText size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'guru' ? 'active' : ''}`}
          onClick={() => setActiveTab('guru')}
        >
          <GraduationCap size={16} strokeWidth={1.5} />
          <span>Data Guru</span>
          <span className="nav-count">{(stats.total_guru || 0).toLocaleString()}</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'tt' ? 'active' : ''}`}
          onClick={() => setActiveTab('tt')}
        >
          <Wrench size={16} strokeWidth={1.5} />
          <span>Tenaga Teknis</span>
          <span className="nav-count">{(stats.total_tenaga_teknis || 0).toLocaleString()}</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'hasil' ? 'active' : ''}`}
          onClick={() => setActiveTab('hasil')}
        >
          <CheckCircle size={16} strokeWidth={1.5} />
          <span>Hasil Verifikasi</span>
          <span className="nav-count">{(stats.total_verifikasi || 0).toLocaleString()}</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          <Upload size={16} strokeWidth={1.5} />
          <span>Import Data</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {activeTab === 'guru' && <DataGuruTable data={dataGuru} loading={loading.guru} />}
        {activeTab === 'tt' && <DataTTTable data={dataTT} loading={loading.tt} />}
        {activeTab === 'hasil' && <HasilVerifikasiTable data={dataHasil} loading={loading.hasil} onDataChange={handleDataChange} />}
        {activeTab === 'import' && <ImportSection onDataChange={handleDataChange} />}
      </div>
    </div>
  );
}
