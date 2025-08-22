import React from "react";
import { motion } from "framer-motion";

const Navbar = () => {
  const navItems = ["Home", "About", "Services", "Contact"];

  return (
    <motion.nav
      className="fixed top-0 left-0 w-full bg-black/60 text-white flex justify-center gap-8 py-4 z-50"
      initial={{ 
        top: "50%",          // start from page center
        left: "50%",         // horizontally center
        x: "-50%",           // adjust for centering
        y: "-50%", 
        scale: 0.5,          // slightly smaller at start
        opacity: 0 
      }}
      animate={{ 
        top: "0%",           // move to top of screen
        left: "0%",          // align normally
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1 
      }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      {navItems.map((item, i) => (
        <motion.a
          key={i}
          href={`#${item.toLowerCase()}`}
          className="hover:text-yellow-400 transition"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + i * 0.2 }}
        >
          {item}
        </motion.a>
      ))}
    </motion.nav>
  );
};

export default Navbar;
