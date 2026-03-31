import type { BuyerInfo } from "../../types";

interface BuyerFormProps {
  buyer: BuyerInfo;
  onChange: (field: keyof BuyerInfo, value: string | File | null) => void;
  errors: Partial<Record<keyof BuyerInfo, string>>;
}

export default function BuyerForm({ buyer, onChange, errors }: BuyerFormProps) {
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

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-blue-900 text-xs sm:text-sm">
          <span className="font-bold">Info:</span> Setelah booking dibuat, admin akan menginput
          ongkir dan mengirim tagihan. Anda akan diminta membayar dan mengunggah bukti bayar
          melalui link konfirmasi invoice.
        </p>
      </div>
    </div>
  );
}
