import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp, FaTimes } from "react-icons/fa";

const WhatsAppWidget = () => {
  const [showTooltip, setShowTooltip] = useState(true);

  // International format for +254 742 682580
  const whatsappUrl = "https://wa.me/254742682580?text=Hi%20Shanvilla%20Resort,%20I'd%20like%20to%20inquire%20about%20a%20booking.";

  const closeTooltip = (e) => {
    e.stopPropagation();
    setShowTooltip(false);
  };

  return (
    <div style={styles.container}>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.3 }}
            style={styles.tooltip}
            onClick={() => window.open(whatsappUrl, "_blank")}
          >
            <div style={styles.tooltipHeader}>
              <span style={styles.tooltipTitle}>Need Assistance?</span>
              <button onClick={closeTooltip} style={styles.closeBtn} aria-label="Close tooltip">
                <FaTimes />
              </button>
            </div>
            <p style={styles.tooltipText}>Chat with us on WhatsApp for instant assistance!</p>
            <div style={styles.tooltipNumber}>0742682580</div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1, boxShadow: "0 8px 24px rgba(37, 211, 102, 0.45)" }}
        whileTap={{ scale: 0.95 }}
        style={styles.floatButton}
        aria-label="Contact us on WhatsApp"
        onMouseEnter={() => setShowTooltip(true)}
      >
        <FaWhatsapp size={28} />
      </motion.a>
    </div>
  );
};

const styles = {
  container: {
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 2000,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 12,
    fontFamily: "'Inter', sans-serif",
  },
  floatButton: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    backgroundColor: "#25D366",
    color: "#FFFFFF",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 4px 16px rgba(37, 211, 102, 0.35)",
    cursor: "pointer",
    textDecoration: "none",
  },
  tooltip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: "14px 18px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0,0,0,0.04)",
    width: 250,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    position: "relative",
  },
  tooltipHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tooltipTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#0F8F46",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#718096",
    cursor: "pointer",
    fontSize: "1.1rem",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s ease",
  },
  tooltipText: {
    margin: 0,
    fontSize: "0.8rem",
    color: "#4A5568",
    lineHeight: 1.4,
  },
  tooltipNumber: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#2D3748",
    display: "inline-block",
  },
};

export default WhatsAppWidget;
