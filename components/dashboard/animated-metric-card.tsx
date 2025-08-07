"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";

interface AnimatedMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "green" | "gold" | "blue" | "amber" | "purple" | "cyan";
  progress?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
}

const colorVariants = {
  green: {
    bg: "from-rush-green to-rush-green-dark",
    icon: "text-rush-green bg-rush-green/10 dark:text-rush-green-light dark:bg-rush-green-light/20",
    progress: "bg-rush-green dark:bg-rush-green-light",
    glow: "shadow-rush-green/25",
  },
  gold: {
    bg: "from-rush-gold to-rush-gold-dark",
    icon: "text-rush-gold-dark bg-rush-gold/20 dark:text-rush-gold-light dark:bg-rush-gold-light/20",
    progress: "bg-rush-gold dark:bg-rush-gold-light",
    glow: "shadow-rush-gold/25",
  },
  blue: {
    bg: "from-rush-blue to-rush-blue-dark",
    icon: "text-rush-blue bg-rush-blue/10 dark:text-rush-blue-light dark:bg-rush-blue-light/20",
    progress: "bg-rush-blue dark:bg-rush-blue-light",
    glow: "shadow-rush-blue/25",
  },
  amber: {
    bg: "from-amber-600 to-amber-700",
    icon: "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20",
    progress: "bg-amber-600",
    glow: "shadow-amber-600/25",
  },
  purple: {
    bg: "from-purple-600 to-purple-700",
    icon: "text-purple-700 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20",
    progress: "bg-purple-600",
    glow: "shadow-purple-600/25",
  },
  cyan: {
    bg: "from-cyan-600 to-cyan-700",
    icon: "text-cyan-700 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-900/20",
    progress: "bg-cyan-600",
    glow: "shadow-cyan-600/25",
  },
};

export function AnimatedMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  progress,
  trend,
  delay = 0,
}: AnimatedMetricCardProps) {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const [animatedValue, setAnimatedValue] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const colors = colorVariants[color];

  // Animate number counting
  useEffect(() => {
    if (inView && typeof value === "number") {
      const timer = setTimeout(() => {
        const duration = 2000;
        const steps = 60;
        const stepValue = value / steps;
        let current = 0;

        const interval = setInterval(() => {
          current += stepValue;
          if (current >= value) {
            setAnimatedValue(value);
            clearInterval(interval);
          } else {
            setAnimatedValue(Math.floor(current));
          }
        }, duration / steps);

        return () => clearInterval(interval);
      }, delay);

      return () => clearTimeout(timer);
    } else if (typeof value === "string") {
      setAnimatedValue(value as any);
    }
  }, [inView, value, delay]);

  // Animate progress bar
  useEffect(() => {
    if (inView && progress !== undefined) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress);
      }, delay + 300);

      return () => clearTimeout(timer);
    }
  }, [inView, progress, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.5,
        delay: delay / 1000,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl blur-xl -z-10 ${colors.bg}" />
      
      <div className={cn(
        "relative overflow-hidden rounded-xl border bg-card/50 backdrop-blur-sm p-6",
        "transition-all duration-300 hover:shadow-xl hover:border-primary/20",
        `hover:${colors.glow}`
      )}>
        {/* Animated gradient background */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500">
          <div className={cn("absolute inset-0 bg-gradient-to-br", colors.bg)} />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={inView ? { scale: 1 } : { scale: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: (delay + 200) / 1000,
              }}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                colors.icon
              )}
            >
              <Icon className="h-6 w-6" />
            </motion.div>

            {trend && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                transition={{ delay: (delay + 400) / 1000 }}
                className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}
              >
                <span>{trend.isPositive ? "↑" : "↓"}</span>
                <span>{Math.abs(trend.value)}%</span>
              </motion.div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: (delay + 300) / 1000 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <motion.span
                key={animatedValue}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold tracking-tight"
              >
                {typeof value === "number" ? animatedValue : value}
              </motion.span>
              {subtitle && (
                <span className="text-sm text-muted-foreground">{subtitle}</span>
              )}
            </div>
          </motion.div>

          {progress !== undefined && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs font-medium">{animatedProgress}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${animatedProgress}%` }}
                  transition={{
                    duration: 1,
                    delay: (delay + 300) / 1000,
                    ease: "easeOut",
                  }}
                  className={cn("h-full rounded-full relative", colors.progress)}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </motion.div>
              </div>
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <motion.div
          className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br opacity-10"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className={cn("h-full w-full rounded-full bg-gradient-to-br", colors.bg)} />
        </motion.div>
      </div>
    </motion.div>
  );
}

// Add shimmer animation to global CSS
const shimmerStyle = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;