import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InnKeeper — Mobile Check-In",
  description: "Contactless mobile check-in and digital room key for InnKeeper guests.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
