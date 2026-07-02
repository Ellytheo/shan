import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactGA from "react-ga4";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("analyticsConsent");
    if (consent === null) {
      // Show banner after a short delay for smooth entry
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    } else if (consent === "true") {
      initGA();
    }
  }, []);

  const initGA = () => {
    try {
      ReactGA.initialize("G-XXXXXXXXXX"); // ✅ Replace with your GA4 ID
      ReactGA.send("pageview");
    } catch (e) {
      console.warn("GA initialization failed", e);
    }
  };

  const handleAccept = () => {
    localStorage.setItem("analyticsConsent", "true");
    initGA();
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("analyticsConsent", "false");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={styles.bannerContainer}
        >
          <div style={styles.content}>
            <div style={styles.iconContainer}>🍪</div>
            <div style={styles.textContainer}>
              <h4 style={styles.title}>Cookie Consent</h4>
              <p style={styles.description}>
                We use cookies to improve your experience and analyze traffic.
              </p>
            </div>
          </div>
          <div style={styles.buttonGroup}>
            <button onClick={handleDecline} style={styles.declineBtn}>
              Decline
            </button>
            <button onClick={handleAccept} style={styles.acceptBtn}>
              I Agree
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const styles = {
  bannerContainer: {
    position: "fixed",
    bottom: 24,
    right: 24,
    width: "min(calc(100vw - 48px), 340px)",
    background: "rgba(255, 255, 255, 0.88)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    borderRadius: 20,
    boxShadow: "0 20px 40px rgba(15, 25, 45, 0.12), 0 1px 2px rgba(255, 255, 255, 0.5) inset",
    padding: 20,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    fontFamily: "'Inter', sans-serif",
  },
  content: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
  },
  iconContainer: {
    fontSize: "1.75rem",
    lineHeight: 1,
  },
  textContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  title: {
    margin: 0,
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#1A2530",
  },
  description: {
    margin: 0,
    fontSize: "0.82rem",
    lineHeight: 1.45,
    color: "#5C6A79",
  },
  buttonGroup: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  declineBtn: {
    background: "transparent",
    border: "1px solid rgba(0, 0, 0, 0.12)",
    borderRadius: 10,
    padding: "8px 16px",
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "#5C6A79",
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: "none",
  },
  acceptBtn: {
    background: "linear-gradient(135deg, #0F8F46 0%, #1ab55a 100%)",
    border: "none",
    borderRadius: 10,
    padding: "9px 18px",
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "#FFFFFF",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(15, 143, 70, 0.25)",
    transition: "all 0.2s ease",
    outline: "none",
  },
};

export default CookieBanner;
