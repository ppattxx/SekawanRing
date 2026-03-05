import { Link } from "react-router-dom";
import type { BirdCategory } from "../../types";

interface CategoryCardProps {
  category: BirdCategory;
  stockCount: number;
  linkTo?: string;
}

export default function CategoryCard({ category, stockCount, linkTo }: CategoryCardProps) {
  return (
    <Link
      to={linkTo || `/kategori/${category.slug}`}
      className="group relative bg-white rounded-2xl p-2.5 sm:p-3.5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden"
    >
      <div
        className="relative h-28 sm:h-36 rounded-xl bg-gradient-to-br from-plant-green/10 to-plant-green/5 border border-plant-green/10 flex items-center justify-center overflow-hidden"
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-plant-green/5 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-plant-green/5 rounded-full" />

        {/* Icon */}
        <span className="text-4xl sm:text-5xl transform group-hover:scale-115 transition-all duration-500 drop-shadow-xl z-10">
          {category.icon}
        </span>

        {/* Age range badge */}
        <div className="absolute bottom-3 left-3 bg-white px-2.5 py-1 rounded-full shadow-sm z-10 border border-gray-100">
          <span className="text-[10px] font-bold text-plant-dark">
            {category.ageRange}
          </span>
        </div>
      </div>

      {/* Content area */}
      <div className="pt-4 pb-1 px-2 flex-1 flex flex-col">
        <h3 className="text-plant-dark font-bold text-sm sm:text-lg mb-0.5 group-hover:text-plant-green transition-colors">
          {category.name}
        </h3>
        <p className="text-gray-400 text-[11px] leading-relaxed mb-3 line-clamp-2">
          {category.description}
        </p>

        {/* Stock display */}
        <div
          className={`rounded-lg px-3 py-2.5 mb-3 ${
            stockCount > 0 ? "bg-plant-light" : "bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-xl sm:text-2xl font-black leading-none ${
                  stockCount > 0 ? "text-plant-green" : "text-gray-300"
                }`}
              >
                {stockCount}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                Total Stok
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {stockCount > 0 ? (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              ) : (
                <span className="w-2 h-2 bg-red-400 rounded-full" />
              )}
              <span
                className={`text-xs font-semibold ${
                  stockCount > 0 ? "text-green-600" : "text-red-400"
                }`}
              >
                {stockCount > 0 ? "Ready" : "Kosong"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-2.5 border-t border-gray-50 flex items-center justify-between">
          <span className="text-plant-green font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
            Lihat Koleksi
            <svg
              className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </span>

          <div className="w-7 h-7 rounded-full bg-plant-light flex items-center justify-center group-hover:bg-plant-green transition-colors duration-300">
            <span className="text-plant-green group-hover:text-white text-xs transition-colors">
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
