import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { BuyerInfo, OrderResult } from "../types";
import { useCartStore } from "../store/useCartStore";
import { orderService } from "../services";
import { saveLocalOrder } from "../services/orderService";
import CartRecap from "../components/checkout/CartRecap";
import BuyerForm from "../components/checkout/BuyerForm";
import OrderSummary from "../components/checkout/OrderSummary";
import InvoiceModal from "../components/checkout/InvoiceModal";

const INITIAL_BUYER: BuyerInfo = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  notes: "",
};

const PAYMENT_DESTINATION = {
  bankName: "BCA",
  accountNumber: "1234567890",
  accountHolder: "SEKAWAN BIRD FARM",
};

export default function Checkout() {
  const navigate = useNavigate();
  const cart = useCartStore((s) => s.cart);
  const selectedIds = useCartStore((s) => s.selectedIds);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const clearSelection = useCartStore((s) => s.clearSelection);

  const checkoutItems = cart.filter((item) => selectedIds.has(item.id));

  const [buyer, setBuyer] = useState<BuyerInfo>(INITIAL_BUYER);
  const [errors, setErrors] = useState<Partial<Record<keyof BuyerInfo, string>>>({});
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofError, setPaymentProofError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  const handleBuyerChange = (field: keyof BuyerInfo, value: string | File | null) => {
    setBuyer((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BuyerInfo, string>> = {};

    if (!buyer.name.trim()) newErrors.name = "Nama lengkap wajib diisi";
    if (!buyer.phone.trim()) {
      newErrors.phone = "Nomor WhatsApp wajib diisi";
    } else if (!/^08\d{8,12}$/.test(buyer.phone.replace(/[\s-]/g, ""))) {
      newErrors.phone = "Format nomor tidak valid (08xxxxxxxxxx)";
    }
    if (!buyer.address.trim()) newErrors.address = "Alamat wajib diisi";
    if (!buyer.city.trim()) newErrors.city = "Kota wajib diisi";
    if (!buyer.province.trim()) newErrors.province = "Provinsi wajib diisi";
    if (!buyer.postalCode.trim()) {
      newErrors.postalCode = "Kode pos wajib diisi";
    } else if (!/^\d{5}$/.test(buyer.postalCode.trim())) {
      newErrors.postalCode = "Kode pos harus 5 digit angka";
    }

    if (!paymentProof) {
      setPaymentProofError("Bukti transfer wajib diunggah");
    } else {
      setPaymentProofError(null);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && Boolean(paymentProof);
  };

  const handleConfirm = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Try real API first
      const order = await orderService.createOrder({
        customer: {
          name: buyer.name,
          email: buyer.email || undefined,
          phone: buyer.phone,
          address: buyer.address,
          city: buyer.city,
          province: buyer.province,
          postal_code: buyer.postalCode.trim(),
          notes: buyer.notes,
        },
        items: checkoutItems.map((item) => ({
          item_id: item.id,
          qty: item.qty,
        })),
        paymentProof,
      });

      // Build result from API response
      const result: OrderResult = {
        id: order.id,
        invoice_number: order.invoice_number,
        total_price: order.total_price,
        status: order.status,
        customer_name: buyer.name,
        customer_email: "",
        customer_phone: buyer.phone,
        shipping_address: `${buyer.address}, ${buyer.city}, ${buyer.province} ${buyer.postalCode}`,
        items: checkoutItems.map((item) => ({
          item: item,
          quantity: item.qty,
        })),
        created_at: new Date().toISOString(),
      };

      saveLocalOrder(result);
      setOrderResult(result);
      // Remove only the checked-out items from cart
      checkoutItems.forEach((item) => removeFromCart(item.id));
      clearSelection();
    } catch (error: any) {
      console.error("Checkout failed:", error);
      setSubmitError(
        error?.response?.data?.message ||
          "Checkout gagal diproses oleh server. Silakan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setOrderResult(null);
    navigate("/");
  };

  // Redirect if no selected items and no order result
  if (checkoutItems.length === 0 && !orderResult) {
    return (
      <div className="min-h-screen bg-[#F8FBF9] pb-20">
        <div className="bg-plant-green pt-6 sm:pt-8 pb-16 sm:pb-20 px-4 sm:px-6 md:px-12 rounded-b-[1.5rem] sm:rounded-b-[2rem]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-white text-2xl sm:text-3xl font-black">Checkout</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 -mt-8 relative z-10">
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-8 sm:p-12 text-center shadow-sm border border-gray-100">
            <span className="text-5xl sm:text-7xl block mb-4">🛍️</span>
            <h2 className="text-xl sm:text-2xl font-black text-plant-dark mb-2">
              Keranjang Kosong
            </h2>
            <p className="text-gray-500 mb-6">
              Tambahkan item ke keranjang untuk melanjutkan checkout.
            </p>
            <Link
              to="/katalog"
              className="inline-block bg-plant-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              Lihat Katalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FBF9] pb-20">
      {/* Hero */}
      <div className="bg-plant-green pt-6 sm:pt-8 pb-16 sm:pb-20 px-4 sm:px-6 md:px-12 rounded-b-[1.5rem] sm:rounded-b-[2rem] relative z-0 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="max-w-5xl mx-auto relative z-10">
          <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-black mb-1">
            Checkout
          </h1>
          <p className="text-green-50 text-xs sm:text-sm opacity-90">
            Lengkapi data lalu lanjut transfer dan unggah bukti pembayaran
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 -mt-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Cart + Form */}
          <div className="lg:col-span-2 space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
                {submitError}
              </div>
            )}
            <CartRecap />
            <BuyerForm
              buyer={buyer}
              onChange={handleBuyerChange}
              errors={errors}
            />

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-200 space-y-2">
              <h3 className="text-lg font-black text-plant-dark">Rekening Tujuan Transfer</h3>
              <p className="text-xs text-gray-500">Silakan transfer ke rekening berikut sebelum upload bukti transfer.</p>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-xs text-amber-700 mb-1">Nomor Rekening</p>
                <p className="text-lg font-black text-plant-dark tracking-wide">{PAYMENT_DESTINATION.accountNumber}</p>
                <p className="text-sm text-amber-800 mt-1">
                  {PAYMENT_DESTINATION.bankName} a.n. {PAYMENT_DESTINATION.accountHolder}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 space-y-3">
              <h3 className="text-lg font-black text-plant-dark">Bukti Transfer</h3>
              <p className="text-xs text-gray-500">
                Upload bukti transfer untuk melanjutkan checkout.
              </p>

              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file && file.size > 5 * 1024 * 1024) {
                    setPaymentProof(null);
                    setPaymentProofError("Ukuran file maksimal 5MB");
                    return;
                  }

                  setPaymentProof(file);
                  setPaymentProofError(null);
                }}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-plant-green file:text-white hover:file:bg-green-700"
              />

              {paymentProof && (
                <p className="text-xs text-green-700">File terpilih: {paymentProof.name}</p>
              )}

              {paymentProofError && (
                <p className="text-xs text-red-600">{paymentProofError}</p>
              )}
            </div>
          </div>

          {/* Right: Order Summary with Confirm */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <OrderSummary
                onConfirm={handleConfirm}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {orderResult && (
        <InvoiceModal order={orderResult} onClose={handleCloseModal} />
      )}
    </div>
  );
}
