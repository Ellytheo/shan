import { Component } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   ErrorBoundary + ErrorFallback
   Catches any unhandled render error in the React tree and shows a polished
   "Something went wrong" page instead of a blank/crashed screen.
───────────────────────────────────────────────────────────────────────────── */

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Only log in development — never expose stack traces in production
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

/* ── Fallback UI ── */
const ErrorFallback = ({ onRetry }) => (
  <div style={s.page}>
    {/* Background orbs */}
    <div style={s.orb1} aria-hidden="true" />
    <div style={s.orb2} aria-hidden="true" />

    <div style={s.card}>
      {/* Icon */}
      <div style={s.iconWrap} aria-hidden="true">
        <i className="bi bi-exclamation-triangle-fill" style={s.icon} />
      </div>

      {/* Heading */}
      <h1 style={s.heading}>Oops! Something went wrong.</h1>
      <p style={s.body}>
        An unexpected error occurred. Our team has been notified.
        <br />
        You can try refreshing the page or go back to the home page.
      </p>

      {/* Actions */}
      <div style={s.actions}>
        <button style={s.retryBtn} onClick={onRetry}>
          <i className="bi bi-arrow-clockwise" style={{ marginRight: 8 }} />
          Retry
        </button>
        <a href="/" style={s.homeBtn}>
          <i className="bi bi-house-door" style={{ marginRight: 8 }} />
          Go Home
        </a>
      </div>
    </div>
  </div>
);

/* ── Inline styles ── */
const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a1628 0%, #0d2140 40%, #0f2a52 100%)',
    fontFamily: "'Inter', sans-serif",
    position: 'relative',
    overflow: 'hidden',
    padding: '24px',
  },
  orb1: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(198,163,85,0.18) 0%, transparent 70%)',
    top: '-160px',
    right: '-160px',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(79,112,168,0.22) 0%, transparent 70%)',
    bottom: '-120px',
    left: '-120px',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 28,
    boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
    padding: 'clamp(32px, 6vw, 64px)',
    maxWidth: 560,
    width: '100%',
    textAlign: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(198,163,85,0.25) 0%, rgba(245,130,32,0.15) 100%)',
    border: '1px solid rgba(198,163,85,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  icon: {
    fontSize: '2.2rem',
    color: '#C6A355',
  },
  heading: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 'clamp(1.4rem, 3vw, 2rem)',
    fontWeight: 700,
    color: '#f0f4f8',
    margin: '0 0 16px',
    lineHeight: 1.25,
  },
  body: {
    color: 'rgba(220,230,245,0.75)',
    fontSize: '0.97rem',
    lineHeight: 1.75,
    margin: '0 0 36px',
  },
  actions: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  retryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 28px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #C6A355 0%, #F58220 100%)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.95rem',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.02em',
    boxShadow: '0 6px 20px rgba(198,163,85,0.35)',
    transition: 'opacity 0.2s',
  },
  homeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 28px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.18)',
    color: '#d0e0f5',
    fontWeight: 600,
    fontSize: '0.95rem',
    textDecoration: 'none',
    letterSpacing: '0.02em',
    transition: 'background 0.2s',
  },
};

export default ErrorBoundary;
