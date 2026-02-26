import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isCatalogDetailPage = location.pathname.startsWith("/catalog/");

  return (
    <div className={isCatalogDetailPage ? "" : "md:ml-64"}>
      <main className="pb-16 md:pb-0">{children}</main>
    </div>
  );
}
