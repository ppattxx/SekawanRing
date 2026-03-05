import { Link } from "react-router-dom";

interface BackButtonProps {
  to: string;
  label: string;
}

export default function BackButton({ to, label }: BackButtonProps) {
  return (
    <div className="fixed top-[4.5rem] left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <Link
          to={to}
          className="pointer-events-auto inline-flex items-center gap-1.5 text-plant-dark/70 hover:text-plant-green text-sm font-semibold transition-colors bg-white/80 backdrop-blur-sm pl-2.5 pr-4 py-1.5 rounded-full shadow-sm border border-gray-100/80"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {label}
        </Link>
      </div>
    </div>
  );
}
