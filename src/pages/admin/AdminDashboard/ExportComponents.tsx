import { useState } from 'react';
import { dashboardService } from '../../../services';
import { downloadFile, generateExcelFilename } from './exportUtils';
import { showAlert } from '../../../utils/appDialog';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExporting: (isLoading: boolean) => void;
}

export const ExportModal = ({ isOpen, onClose, onExporting }: ExportModalProps) => {
  const [exportType, setExportType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isLoading, setIsLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      onExporting(true);

      let blob: Blob;
      try {
        const { generateSalesReportExcel } = await import('./salesReportExcel');
        blob = await generateSalesReportExcel({
          type: exportType,
          year: selectedYear,
          month: exportType === 'monthly' ? selectedMonth : undefined,
        });
      } catch (e) {
        console.warn('Client-side Excel generation failed; falling back to API export.', e);
        blob = await dashboardService.exportSalesData(
          selectedYear,
          exportType === 'monthly' ? selectedMonth : undefined
        );
      }

      const filename = generateExcelFilename(
        selectedYear,
        exportType === 'monthly' ? selectedMonth : undefined
      );

      downloadFile(blob, filename);

      await showAlert('File berhasil diunduh!', {
        title: 'Export Berhasil',
        tone: 'success',
      });
      onClose();
    } catch (error) {
      console.error('Error exporting sales data:', error);
      await showAlert('Gagal mengunduh file. Silakan coba lagi.', {
        title: 'Export Gagal',
        tone: 'danger',
      });
    } finally {
      setIsLoading(false);
      onExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Export Rekap Penjualan</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Tipe Laporan</label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors"
              style={{ borderColor: exportType === 'monthly' ? '#10b981' : '#e5e7eb' }}>
              <input
                type="radio"
                value="monthly"
                checked={exportType === 'monthly'}
                onChange={(e) => setExportType(e.target.value as 'monthly' | 'yearly')}
                className="w-4 h-4"
              />
              <span className="ml-3 text-gray-700 font-medium">Laporan Bulanan</span>
            </label>
            <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors"
              style={{ borderColor: exportType === 'yearly' ? '#10b981' : '#e5e7eb' }}>
              <input
                type="radio"
                value="yearly"
                checked={exportType === 'yearly'}
                onChange={(e) => setExportType(e.target.value as 'monthly' | 'yearly')}
                className="w-4 h-4"
              />
              <span className="ml-3 text-gray-700 font-medium">Laporan Tahunan</span>
            </label>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {exportType === 'monthly' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Bulan</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {new Date(2024, month - 1).toLocaleDateString('id-ID', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleExport}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Mengunduh...
              </>
            ) : (
              <>
                Export
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          File akan diunduh dalam format Excel (.xlsx) dengan data lengkap penjualan.
        </p>
      </div>
    </div>
  );
};

export const ExportButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
  >
    Export Penjualan
  </button>
);
