import { useNavigate } from "react-router-dom";
import { CSS_CLASSES, ORDER_CONFIRMATION_MESSAGES } from "./constants";

export const LoadingState = () => (
  <div className={`${CSS_CLASSES.pageContainer} flex items-center justify-center`}>
    <div className={`${CSS_CLASSES.card} text-center`}>
      <div className="animate-spin w-12 h-12 border-4 border-plant-green border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-gray-600">{ORDER_CONFIRMATION_MESSAGES.LOADING}</p>
    </div>
  </div>
);

export const ErrorState = ({ error }: { error: string | null }) => {
  const navigate = useNavigate();

  return (
    <div className={CSS_CLASSES.pageContainer}>
      <div className={CSS_CLASSES.headerBase}>
        <div className={CSS_CLASSES.headerContent}>
          <h1 className="text-white text-2xl sm:text-3xl font-black">Konfirmasi Pesanan</h1>
        </div>
      </div>

      <div className={CSS_CLASSES.mainContent}>
        <div className={CSS_CLASSES.card}>
          <h2 className="text-xl sm:text-2xl font-black text-red-600 mb-2">
            {ORDER_CONFIRMATION_MESSAGES.NOT_FOUND}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || ORDER_CONFIRMATION_MESSAGES.NOT_FOUND_DESCRIPTION}
          </p>
          <button
            onClick={() => navigate("/")}
            className={`inline-block px-8 py-3 rounded-xl font-bold text-white bg-plant-dark hover:bg-gray-800 transition-colors`}
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
};

export const SuccessState = ({ invoiceNumber }: { invoiceNumber: string }) => {
  const navigate = useNavigate();

  return (
    <div className={CSS_CLASSES.pageContainer}>
      <div className={CSS_CLASSES.headerBase}>
        <div className={CSS_CLASSES.headerContent}>
          <h1 className="text-white text-2xl sm:text-3xl font-black">Konfirmasi Pesanan</h1>
        </div>
      </div>

      <div className={CSS_CLASSES.mainContent}>
        <div className={CSS_CLASSES.card}>
          <h2 className="text-xl sm:text-2xl font-black text-plant-green mb-2">
            {ORDER_CONFIRMATION_MESSAGES.CONFIRM_SUCCESS}
          </h2>
          <p className="text-gray-600 mb-2">
            {ORDER_CONFIRMATION_MESSAGES.CONFIRM_SUCCESS_SUBTITLE}
          </p>
          <p className="text-gray-500 mb-6">
            Kami akan segera memproses pesanan dengan nomor invoice{" "}
            <span className="font-bold text-plant-dark">{invoiceNumber}</span>
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-block bg-plant-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
};
