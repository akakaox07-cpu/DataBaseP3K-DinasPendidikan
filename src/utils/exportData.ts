import * as XLSX from 'xlsx';

interface ExportOptions {
  filename: string;
  sheetName?: string;
}

// Columns that should be formatted as text (long numbers)
const TEXT_COLUMNS = ['nik', 'nip', 'nomor_rekening', 'no_telp_pegawai', 'npwp'];

// Format value - ensure long numbers are strings with leading apostrophe for Excel
function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  const strValue = String(value);
  // For columns that contain long numbers, prefix with apostrophe to force text in Excel
  if (TEXT_COLUMNS.includes(key.toLowerCase())) {
    return strValue;
  }
  return strValue;
}

// Export to XLSX - accepts any array of objects
export function exportToXLSX<T extends object>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  options: ExportOptions
): void {
  const { filename, sheetName = 'Data' } = options;
  
  // Transform data to array of arrays with headers
  const headers = columns.map(col => col.header);
  const rows = data.map(item => 
    columns.map(col => {
      const value = item[col.key];
      return formatValue(String(col.key), value);
    })
  );
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  // Set column widths - minimum 15 for number columns
  const colWidths = columns.map(col => {
    const isNumberCol = TEXT_COLUMNS.includes(String(col.key).toLowerCase());
    const maxDataLen = Math.max(
      ...data.map(item => String(item[col.key] || '').length)
    );
    return {
      wch: Math.max(
        col.header.length,
        maxDataLen,
        isNumberCol ? 20 : 10
      ) + 2
    };
  });
  ws['!cols'] = colWidths;

  // Format cells in TEXT_COLUMNS as text to prevent scientific notation
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = range.s.r + 1; R <= range.e.r; ++R) { // Skip header row
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const colKey = String(columns[C]?.key || '').toLowerCase();
      if (TEXT_COLUMNS.includes(colKey)) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];
        if (cell) {
          // Force cell to be text
          cell.t = 's'; // Set type to string
          cell.z = '@'; // Set number format to text
        }
      }
    }
  }
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Save file
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Export to CSV - accepts any array of objects
export function exportToCSV<T extends object>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  options: ExportOptions
): void {
  const { filename } = options;
  
  // Create CSV content
  const headers = columns.map(col => `"${col.header}"`).join(',');
  const rows = data.map(item =>
    columns.map(col => {
      const value = item[col.key];
      const strValue = formatValue(String(col.key), value);
      // Escape quotes and wrap in quotes
      // For long number columns, add = prefix to force Excel to treat as text
      const colKey = String(col.key).toLowerCase();
      if (TEXT_COLUMNS.includes(colKey) && strValue !== '-') {
        return `"'${strValue.replace(/"/g, '""')}"`;
      }
      return `"${strValue.replace(/"/g, '""')}"`;
    }).join(',')
  );
  
  const csvContent = [headers, ...rows].join('\n');
  
  // Create blob and download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// Column definitions for each data type
export const guruColumns = [
  { key: 'no' as const, header: 'NO' },
  { key: 'nama' as const, header: 'NAMA' },
  { key: 'nik' as const, header: 'NIK' },
  { key: 'nip' as const, header: 'NIP' },
  { key: 'jabatan_sk' as const, header: 'JABATAN SK' },
  { key: 'jenjang' as const, header: 'JENJANG' },
  { key: 'unit_kerja' as const, header: 'UNIT KERJA' },
  { key: 'nomor_rekening' as const, header: 'NOMOR REKENING' },
];

export const tenagaTeknisColumns = [
  { key: 'no' as const, header: 'NO' },
  { key: 'nip' as const, header: 'NIP' },
  { key: 'nik' as const, header: 'NIK' },
  { key: 'nama' as const, header: 'NAMA' },
  { key: 'jabatan' as const, header: 'JABATAN' },
  { key: 'pendidikan' as const, header: 'PENDIDIKAN' },
  { key: 'unit_kerja' as const, header: 'UNIT KERJA' },
  { key: 'nomor_rekening' as const, header: 'NOMOR REKENING' },
];

export const hasilVerifikasiColumns = [
  { key: 'no' as const, header: 'NO' },
  { key: 'nama' as const, header: 'NAMA' },
  { key: 'jabatan' as const, header: 'JABATAN' },
  { key: 'nip' as const, header: 'NIP' },
  { key: 'nik' as const, header: 'NIK' },
  { key: 'no_telp_pegawai' as const, header: 'NO TELP PEGAWAI' },
  { key: 'npwp' as const, header: 'NPWP' },
  { key: 'nomor_rekening' as const, header: 'NOMOR REKENING' },
  { key: 'nama_bank' as const, header: 'NAMA BANK' },
];
