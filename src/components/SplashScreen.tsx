"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const SplashScreen = () => {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-background z-50"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="relative">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 0, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity
          }}
          className="absolute inset-0 bg-primary/30 blur-3xl rounded-full"
        />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-40 h-40 md:w-56 md:h-56"
        >
          <Image
            src="/logo.png"
            alt="Logo"
            fill
            className="object-contain drop-shadow-[0_0_25px_rgba(250,204,21,0.5)] rounded-3xl"
            priority
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
