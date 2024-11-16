import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { NetworkProvider } from "@/context/NetworkContext";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "LedgerSuite",
  description: "Tools for your Ledger",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NetworkProvider>
          <Navbar />
          {children}
          <Toaster richColors closeButton position="top-right" />
        </NetworkProvider>
      </body>
    </html>
  );
}
