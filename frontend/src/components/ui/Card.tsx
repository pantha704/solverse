"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = true, children, ...props }, ref) => {
    const baseStyles = "brutal-border brutal-shadow-md bg-white p-6 rounded-none";
    const hoverStyles = hover ? "brutal-transition" : "";

    return (
      <div
        ref={ref}
        className={cn(baseStyles, hoverStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;
