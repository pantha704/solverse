"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles = "brutal-border brutal-shadow-md brutal-transition font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-leaf-medium text-black hover:bg-leaf-light",
      secondary: "bg-accent-yellow text-black hover:bg-yellow-300",
      danger: "bg-accent-red text-white hover:bg-red-400",
      outline: "bg-white text-black hover:bg-gray-light"
    };

    const sizes = {
      xs: "px-2 py-1 text-xs",
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg"
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
