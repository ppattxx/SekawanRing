import { useState } from "react";
import type { BuyerInfo } from "../../types";

interface BuyerFormProps {
  buyer: BuyerInfo;
  onChange: (field: keyof BuyerInfo, value: string | File | null) => void;
  errors: Partial<Record<keyof BuyerInfo, string>>;
}

const BANK_ACCOUNTS = [
  {
    bank: "BCA",
    accountNumber: "1234567890",
    accountName: "PT Sekawan Ring",
    color: "bg-blue-50 border-blue-200",
  },
  {
    bank: "Mandiri",
    accountNumber: "1370012345678",
    accountName: "PT Sekawan Ring",
    color: "bg-blue-50 border-blue-200",
  },
  {
    bank: "BNI",
    accountNumber: "0987654321",
    accountName: "PT Sekawan Ring",
    color: "bg-blue-50 border-blue-200",
  },
];

export default function BuyerForm({ buyer, onChange, errors }: BuyerFormProps) {
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  const copyToClipboard = (text: string, bank: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(bank);
    setTimeout(() => setCopiedAccount(null), 2000);
  };
  const inputClass = (field: keyof BuyerInfo) =>
    `w-full px-4 py-3 rounded-xl border ${
      errors[field]
        ? "border-red-300 bg-red-50/50 focus:ring-red-400"
        : "border-gray-200 bg-white focus:ring-plant-green"
    } focus:outline-none focus:ring-2 text-sm font-medium text-plant-dark placeholder-gray-400 transition-all`;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-black text-plant-dark flex items-center gap-2">
        Data Pembeli
      </h3>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 space-y-4">
        {/* Nama */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Nama Lengkap <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="Masukkan nama lengkap"
            value={buyer.name}
            onChange={(e) => onChange("name", e.target.value)}
            className={inputClass("name")}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        {/* Phone only (email disembunyikan) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kolom kiri dikosongkan agar layout tetap rapi */}
          <div className="hidden md:block" />
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              No. WhatsApp <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={buyer.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              className={inputClass("phone")}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Alamat */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Alamat Lengkap <span className="text-red-400">*</span>
          </label>
          <textarea
            placeholder="Jalan, RT/RW, Kelurahan, Kecamatan..."
            rows={3}
            value={buyer.address}
            onChange={(e) => onChange("address", e.target.value)}
            className={`${inputClass("address")} resize-none`}
          />
          {errors.address && (
            <p className="text-red-500 text-xs mt-1">{errors.address}</p>
          )}
        </div>

        {/* Kota & Provinsi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Kota <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Nama kota"
              value={buyer.city}
              onChange={(e) => onChange("city", e.target.value)}
              className={inputClass("city")}
            />
            {errors.city && (
              <p className="text-red-500 text-xs mt-1">{errors.city}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Provinsi <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Nama provinsi"
              value={buyer.province}
              onChange={(e) => onChange("province", e.target.value)}
              className={inputClass("province")}
            />
            {errors.province && (
              <p className="text-red-500 text-xs mt-1">{errors.province}</p>
            )}
          </div>
        </div>

        {/* Kode Pos */}
        <div className="w-1/2 md:w-1/3">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Kode Pos
          </label>
          <input
            type="text"
            placeholder="12345"
            value={buyer.postalCode}
            onChange={(e) => onChange("postalCode", e.target.value)}
            className={inputClass("postalCode")}
            maxLength={5}
          />
        </div>

        {/* Catatan */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Catatan (Opsional)
          </label>
          <textarea
            placeholder="Catatan untuk penjual, misal: warna burung yang diinginkan, dsb."
            rows={2}
            value={buyer.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            className={`${inputClass("notes")} resize-none`}
          />
        </div>
      </div>

      {/* Bank Account Information */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-plant-dark">Informasi Pembayaran</h4>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Transfer ke salah satu rekening di bawah, lalu unggah bukti pembayaran.
        </p>
        
        <div className="space-y-2">
          {BANK_ACCOUNTS.map((account) => (
            <div
              key={account.bank}
              className={`${account.color} border rounded-xl p-3 transition-all hover:shadow-sm`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-600 mb-0.5">
                      {account.bank}
                    </p>
                    <p className="text-sm font-bold text-plant-dark mb-0.5 font-mono">
                      {account.accountNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      a.n. {account.accountName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(account.accountNumber, account.bank)}
                  className="flex-shrink-0 px-3 py-1.5 bg-white hover:bg-gray-50 rounded-lg text-xs font-bold text-plant-green border border-plant-green/20 transition-all active:scale-95"
                >
                  {copiedAccount === account.bank ? "✓ Tersalin" : "Salin"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bukti Pembayaran */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Bukti Pembayaran <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                onChange("paymentProof", file || null);
              }}
              className="hidden"
              id="payment-proof"
            />
            <label
              htmlFor="payment-proof"
              className={`block w-full px-4 py-3 rounded-xl border ${
                errors.paymentProof
                  ? "border-red-300 bg-red-50/50"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              } cursor-pointer transition-all`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  {buyer.paymentProof ? (
                    <>
                      <p className="text-sm font-bold text-plant-dark truncate">
                        {buyer.paymentProof.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(buyer.paymentProof.size / 1024).toFixed(1)} KB
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-400">
                        Pilih file bukti pembayaran
                      </p>
                      <p className="text-xs text-gray-400">JPG, PNG, atau PDF (maks 5MB)</p>
                    </>
                  )}
                </div>
                <div className="text-plant-green font-bold text-sm flex-shrink-0">
                  {buyer.paymentProof ? "Ganti" : "Pilih"}
                </div>
              </div>
            </label>
          </div>
          {errors.paymentProof && (
            <p className="text-red-500 text-xs mt-1">{errors.paymentProof}</p>
          )}
        </div>
      </div>
    </div>
  );
}
