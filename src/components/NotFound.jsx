import React from 'react';
import { Link } from 'react-router-dom';
import pic20 from "../images/notfound.jpg";

const NotFound = () => {
  return (
    <div style={styles.container}>
      <img
        src={pic20}
        alt="Page not found"
        style={styles.image}
      />
      <div style={styles.overlay}>
        <Link to="/" style={styles.button}>← Back to Home</Link>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    margin: 0,
    padding: 0,
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
    position: 'relative',
    zIndex: 2,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(161, 161, 161, 0.46)', // optional: dark overlay
  },
  button: {
    backgroundColor: '#e60023',
    color: '#fff',
    marginTop:'90px',
    padding: '12px 24px',
    borderRadius: '30px',
    textDecoration: 'none',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
};

export default NotFound;
