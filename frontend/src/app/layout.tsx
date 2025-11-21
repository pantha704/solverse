import type { Metadata } from "next";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletContextProvider";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Solverse",
  description: "Create, accept, and complete tasks on Solana blockchain",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <WalletContextProvider>
          <Navbar />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast: 'brutal-border brutal-shadow-md bg-white',
                title: 'font-bold text-black',
                description: 'text-gray-dark',
                success: 'bg-leaf-pale border-leaf-primary',
                error: 'bg-accent-red/10 border-accent-red',
                warning: 'bg-accent-yellow/20 border-black',
              },
            }}
          />
        </WalletContextProvider>
      </body>
    </html>
  );
}
