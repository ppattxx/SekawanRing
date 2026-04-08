import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToastStore } from "../../store/useToastStore";

export default function CartToast() {
  const { toasts, dismissToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-[999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          itemName={toast.itemName}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  );
}

function ToastItem({
  id,
  itemName,
  onDismiss,
}: {
  id: number;
  itemName: string;
  onDismiss: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setVisible(true), 10);
    // Start exit animation before auto-dismiss (3000ms total - 400ms animation = 2600ms)
    const exitTimer = setTimeout(() => setVisible(false), 2600);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] min-w-[260px] max-w-[320px] transition-all duration-400 ${
        visible
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-8"
      }`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 bg-plant-light rounded-xl flex items-center justify-center">
        <svg
          className="w-5 h-5 text-plant-green"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 mb-0.5">
          Ditambahkan ke keranjang
        </p>
        <p className="text-sm font-black text-plant-dark truncate">{itemName}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <button
          onClick={() => onDismiss(id)}
          className="text-gray-300 hover:text-gray-500 transition-colors"
          aria-label="Tutup"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <Link
          to="/cart"
          onClick={() => onDismiss(id)}
          className="text-[10px] font-bold text-plant-green hover:text-plant-dark transition-colors whitespace-nowrap"
        >
          Lihat Keranjang →
        </Link>
      </div>
    </div>
  );
}
