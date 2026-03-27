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

export const ActionButtons = ({ onCancel, onConfirm, isLoading, disabled }: ActionButtonsProps & { disabled?: boolean }) => {
  const isDisabled = isLoading || disabled;

  return (
    <div className="flex gap-3 flex-col sm:flex-row">
      <button
        onClick={onCancel}
        className="flex-1 px-6 py-3 rounded-xl font-bold border-2 border-gray-300 text-plant-dark hover:bg-gray-50 transition-colors"
      >
        Batal
      </button>
      <button
        onClick={onConfirm}
        disabled={isDisabled}
        className={`flex-1 px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${
          isDisabled
            ? "bg-gray-300 text-gray-500 hover:bg-gray-300"
            : "bg-plant-green text-white hover:bg-green-700"
        }`}
      >
        {isLoading ? "Mengkonfirmasi..." : "Konfirmasi Pesanan Selesai"}
      </button>
    </div>
  );
};
