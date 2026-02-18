import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Star Tracker ⭐ - Theo dõi hoạt động của bé",
  description: "Ứng dụng đánh giá và theo dõi hoạt động hàng ngày của bé với hệ thống sao thưởng.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
