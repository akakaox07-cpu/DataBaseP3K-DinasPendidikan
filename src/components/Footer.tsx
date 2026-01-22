import { Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        © {currentYear} Dinas Pendidikan Kabupaten Serang
        <Heart size={14} strokeWidth={1.5} style={{ color: 'var(--danger)' }} />
        Sistem Verifikasi Data PPPK Paruh Waktu
      </p>
    </footer>
  );
}
