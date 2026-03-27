import { ORDER_CONFIRMATION_MESSAGES } from "./constants";
import { copyToClipboard } from "./utils";

interface TrackingLinkProps {
  url: string;
}

export const TrackingLink = ({ url }: TrackingLinkProps) => {
  const handleCopy = async () => {
    const success = await copyToClipboard(url);
    if (success) {
      alert(ORDER_CONFIRMATION_MESSAGES.COPY_SUCCESS);
    }
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <p className="text-green-900 text-sm mb-3">
        <span className="font-bold">📍 Link Tracking Pesanan:</span>
      </p>
      <div className="bg-white border border-green-300 rounded p-3 flex items-center justify-between gap-3">
        <p className="text-gray-700 text-sm break-all flex-1 font-mono">{url}</p>
        <button
          onClick={handleCopy}
          className="px-3 py-1 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 whitespace-nowrap transition-colors"
        >
          Salin
        </button>
      </div>
      <p className="text-green-800 text-xs mt-3">
        💡 Gunakan link ini untuk melihat status pengiriman paket Anda kapan saja. Anda juga dapat
        membagikan link ini kepada orang lain.
      </p>
    </div>
  );
};

export const ConfirmationInfo = () => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <p className="text-blue-900 text-sm">
      <span className="font-bold">Informasi:</span> Silakan periksa barang yang Anda terima. Jika
      sesuai dengan pesanan, klik tombol "Konfirmasi Pesanan Selesai" di bawah.
    </p>
  </div>
);

interface ActionButtonsProps {
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export const ActionButtons = ({ onCancel, onConfirm, isLoading }: ActionButtonsProps) => (
  <div className="flex gap-3 flex-col sm:flex-row">
    <button
      onClick={onCancel}
      className="flex-1 px-6 py-3 rounded-xl font-bold border-2 border-gray-300 text-plant-dark hover:bg-gray-50 transition-colors"
    >
      Batal
    </button>
    <button
      onClick={onConfirm}
      disabled={isLoading}
      className="flex-1 px-6 py-3 rounded-xl font-bold bg-plant-green text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading ? "Mengkonfirmasi..." : "Konfirmasi Pesanan Selesai"}
    </button>
  </div>
);
