export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const generateExcelFilename = (year: number, month?: number): string => {
  const date = new Date();
  const timestamp = date.toISOString().split('T')[0];

  if (month) {
    return `Rekap_Penjualan_${year}-${String(month).padStart(2, '0')}_${timestamp}.xlsx`;
  }

  return `Rekap_Penjualan_${year}_${timestamp}.xlsx`;
};

export const formatCurrencyForExcel = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};
