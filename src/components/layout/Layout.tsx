interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="pt-14 pb-16 md:pb-0">
      <main>{children}</main>
    </div>
  );
}
