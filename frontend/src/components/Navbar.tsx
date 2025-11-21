"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Navbar() {
  const { publicKey } = useWallet();

  return (
    <nav className="bg-leaf-primary brutal-border brutal-shadow-md sticky top-0 z-30">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3"
            >
              <Image
                src="/logo.png"
                alt="Solverse Logo"
                width={48}
                height={48}
                className="brutal-border brutal-shadow-sm"
              />
              <span className="text-3xl font-bold text-white uppercase tracking-tight">
                Solverse
              </span>
            </motion.div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-6">
            <Link href="/">
              <motion.span
                whileHover={{ scale: 1.1 }}
                className="text-white font-bold hover:text-accent-yellow transition-colors"
              >
                TASKS
              </motion.span>
            </Link>
            {publicKey && (
              <Link href="/dashboard">
                <motion.span
                  whileHover={{ scale: 1.1 }}
                  className="text-white font-bold hover:text-accent-yellow transition-colors"
                >
                  DASHBOARD
                </motion.span>
              </Link>
            )}
            <WalletMultiButton className="!brutal-border !brutal-shadow-md !bg-accent-yellow !text-black !font-bold !uppercase !px-6 !py-3 hover:!bg-yellow-300 !transition-all" />
          </div>
        </div>
      </div>
    </nav>
  );
}
