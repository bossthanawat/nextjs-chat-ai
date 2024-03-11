export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="container mt-20">
      <h3 className="text-xl md:text-3xl font-medium">Question</h3>
      {children}
    </div>
  );
}
