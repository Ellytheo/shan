import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import pic20 from "../images/notfound.jpg";

const NotFound = () => {
  return (
    <div style={styles.container}>
      {/* Background Image with overlay */}
      <img
        src={pic20}
        alt="Page not found background"
        style={styles.image}
      />
      <div style={styles.overlay} />

      {/* Glassmorphism Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={styles.card}
      >
        <div style={styles.iconWrap} aria-hidden="true">
          <i className="bi bi-map-fill" style={styles.icon} />
        </div>
        
        <h1 style={styles.errorCode}>404</h1>
        <h2 style={styles.heading}>Looks like you're lost.</h2>
        <p style={styles.body}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <Link to="/" style={styles.button} className="notfound-btn">
          <i className="bi bi-house-door" style={{ marginRight: 8 }} />
          Back to Home
        </Link>
      </motion.div>

      {/* Inline hover styles for the button */}
      <style>{`
        .notfound-btn {
          transition: all 0.3s ease;
        }
        .notfound-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(198, 163, 85, 0.4);
          background: linear-gradient(135deg, #d4af37 0%, #ff9800 100%) !important;
          color: #fff !important;
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
    padding: '24px',
    fontFamily: "'Inter', sans-serif",
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(10, 22, 40, 0.75)', // Darker blue/black overlay for contrast
    zIndex: 2,
  },
  card: {
    position: 'relative',
    zIndex: 3,
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 'clamp(40px, 8vw, 60px) clamp(32px, 6vw, 48px)',
    maxWidth: 500,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(198,163,85,0.2) 0%, rgba(245,130,32,0.1) 100%)',
    border: '1px solid rgba(198,163,85,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  icon: {
    fontSize: '2rem',
    color: '#C6A355',
  },
  errorCode: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 'clamp(4rem, 10vw, 5.5rem)',
    fontWeight: 800,
    color: '#fff',
    margin: '0 0 10px 0',
    lineHeight: 1,
    letterSpacing: '0.05em',
    textShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  heading: {
    fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
    fontWeight: 600,
    color: '#e2e8f0',
    margin: '0 0 16px',
  },
  body: {
    color: 'rgba(220, 230, 245, 0.7)',
    fontSize: '1rem',
    lineHeight: 1.6,
    margin: '0 0 40px',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C6A355',
    background: 'linear-gradient(135deg, #C6A355 0%, #F58220 100%)',
    color: '#fff',
    padding: '14px 32px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '1rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.02em',
    boxShadow: '0 6px 20px rgba(198,163,85,0.25)',
  },
};

export default NotFound;
