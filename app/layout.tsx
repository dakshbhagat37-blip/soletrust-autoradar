import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoleTrust AutoRadar — Lead Intelligence & Decision-Maker Platform",
  description:
    "Automated B2B lead discovery, verification, decision-maker identification, and lead qualification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-950 text-white font-sans">
        {children}
      </body>
    </html>
  );
}
