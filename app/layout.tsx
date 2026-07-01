import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATTANOS",
  description: "A private AI command room for real estate marketers."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
