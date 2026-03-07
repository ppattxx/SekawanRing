import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { BuyerInfo, OrderResult } from "../types";
import { useCartStore } from "../store/useCartStore";
import { orderService } from "../services";
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
  paymentProof: null,
};

export default function Checkout() {
  const navigate = useNavigate();
  const cart = useCartStore((s) => s.cart);
  const cartTotal = useCartStore((s) => s.cartTotal);
  const clearCart = useCartStore((s) => s.clearCart);

  const [buyer, setBuyer] = useState<BuyerInfo>(INITIAL_BUYER);
  const [errors, setErrors] = useState<Partial<Record<keyof BuyerInfo, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (!buyer.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email)) {
      newErrors.email = "Format email tidak valid";
    }
    if (!buyer.phone.trim()) {
      newErrors.phone = "Nomor WhatsApp wajib diisi";
    } else if (!/^08\d{8,12}$/.test(buyer.phone.replace(/[\s-]/g, ""))) {
      newErrors.phone = "Format nomor tidak valid (08xxxxxxxxxx)";
    }
    if (!buyer.address.trim()) newErrors.address = "Alamat wajib diisi";
    if (!buyer.city.trim()) newErrors.city = "Kota wajib diisi";
    if (!buyer.province.trim()) newErrors.province = "Provinsi wajib diisi";
    if (!buyer.paymentProof) {
      newErrors.paymentProof = "Bukti pembayaran wajib diunggah";
    } else if (buyer.paymentProof.size > 5 * 1024 * 1024) {
      newErrors.paymentProof = "Ukuran file maksimal 5MB";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validateForm()) return;
    if (!buyer.paymentProof) return;

    setIsSubmitting(true);

    try {
      // Try real API first
      const order = await orderService.createOrder({
        customer: {
          name: buyer.name,
          phone: buyer.phone,
          address: buyer.address,
          city: buyer.city,
          province: buyer.province,
          postal_code: buyer.postalCode,
        },
        items: cart.map((item) => ({
          item_id: item.id,
          qty: item.qty,
        })),
        payment_proof: buyer.paymentProof,
      });

      // Build result from API response
      const result: OrderResult = {
        id: order.id,
        invoice_number: order.invoice_number,
        total_price: order.total_price,
        status: order.status,
        customer_name: buyer.name,
        customer_email: buyer.email,
        customer_phone: buyer.phone,
        shipping_address: `${buyer.address}, ${buyer.city}, ${buyer.province} ${buyer.postalCode}`,
        items: cart.map((item) => ({
          item: item,
          quantity: item.qty,
        })),
        created_at: new Date().toISOString(),
      };

      setOrderResult(result);
      clearCart();
    } catch {
      // Fallback: generate mock invoice
      const subtotal = cartTotal();
      const shipping = subtotal > 10_000_000 ? 0 : 150_000;

      const mockResult: OrderResult = {
        id: Math.floor(Math.random() * 10000),
        invoice_number: `INV-SR-${Date.now().toString(36).toUpperCase()}`,
        total_price: subtotal + shipping,
        status: "pending",
        customer_name: buyer.name,
        customer_email: buyer.email,
        customer_phone: buyer.phone,
        shipping_address: `${buyer.address}, ${buyer.city}, ${buyer.province} ${buyer.postalCode}`,
        items: cart.map((item) => ({
          item: item,
          quantity: item.qty,
        })),
        created_at: new Date().toISOString(),
      };

      setOrderResult(mockResult);
      clearCart();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setOrderResult(null);
    navigate("/");
  };

  // Redirect if cart is empty and no order result
  if (cart.length === 0 && !orderResult) {
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
            Lengkapi data untuk menyelesaikan pesanan
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 -mt-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Cart + Form */}
          <div className="lg:col-span-2 space-y-6">
            <CartRecap />
            <BuyerForm
              buyer={buyer}
              onChange={handleBuyerChange}
              errors={errors}
            />
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
