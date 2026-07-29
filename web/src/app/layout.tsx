import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "bsnes web",
  description: "A work-in-progress WebAssembly port of the bsnes emulator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
