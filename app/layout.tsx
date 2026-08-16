import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Investment Property Analyzer",
  description:
    "Drop in a Zillow URL or address and run the numbers: cap rate, cash-on-cash return, DSCR, cash flow, and a buy/pass verdict.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
