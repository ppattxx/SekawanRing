interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="pt-14">
      <main>{children}</main>
    </div>
  );
}
