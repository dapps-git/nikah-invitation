"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface FloatingPetalsProps {
  isOpened?: boolean;
}

interface PetalConfig {
  id: number;
  left: string;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
  swerve: number;
  isBurst?: boolean;
}

// Generate slow ambient petals
const AMBIENT_PETALS: PetalConfig[] = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: `${10 + Math.random() * 80}%`,
  delay: Math.random() * 8,
  duration: 12 + Math.random() * 8,
  size: 16 + Math.random() * 10, // 16px to 26px
  rotation: Math.random() * 360,
  swerve: -30 + Math.random() * 60,
}));

export default function FloatingPetals({ isOpened = false }: FloatingPetalsProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [petals, setPetals] = useState<PetalConfig[]>(AMBIENT_PETALS);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpened && mounted) {
      // Add a lush burst of 28 romantic rose petals falling from all sides
      const burstPetals: PetalConfig[] = Array.from({ length: 28 }, (_, i) => ({
        id: i + 100,
        left: `${Math.random() * 100}%`,
        // Stagger delays so it looks like a cascade starting right on click
        delay: Math.random() * 2.8,
        duration: 4.5 + Math.random() * 5.5,
        size: 18 + Math.random() * 14, // 18px to 32px
        rotation: Math.random() * 360,
        swerve: -60 + Math.random() * 120,
        isBurst: true,
      }));

      // Combine ambient and burst petals
      setPetals((prev) => [...prev, ...burstPetals]);
    }
  }, [isOpened, mounted]);

  if (!mounted || shouldReduceMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute top-0"
          style={{
            left: petal.left,
            width: petal.size,
            height: petal.size,
          }}
          initial={{ y: "-10%", opacity: 0, rotate: petal.rotation }}
          animate={{
            y: "110vh",
            opacity: [0, 0.9, 0.9, 0],
            rotate: [petal.rotation, petal.rotation + 180, petal.rotation + 360],
            x: [0, petal.swerve, petal.swerve * 0.5, petal.swerve * 1.2, petal.swerve * 0.8],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: petal.isBurst ? 0 : Infinity,
            ease: "easeInOut",
          }}
        >
          <img
            src="/decor/falling-rose.png"
            alt=""
            className="w-full h-full object-contain"
            style={{ mixBlendMode: "multiply" }}
          />
        </motion.div>
      ))}
    </div>
  );
}
