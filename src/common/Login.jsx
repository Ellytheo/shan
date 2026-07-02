import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { motion } from 'framer-motion';
import axios from 'axios';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async ({ username, password }) => {
    setLoading(true);

    try {
      const res = await axios.post('https://Shanvilla.pythonanywhere.com/login', {
        username,
        password,
      });

      if (res.data.status === 'success') {
        localStorage.setItem('adminToken', 'logged-in');
        message.success('Welcome back, Admin!');
        navigate('/wp-adman'); // 🔁 redirect to admin page
      } else {
        message.error(res.data.message || 'Invalid username or password');
      }
    } catch (err) {
      console.error(err);
      message.error('Server error. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.loginContainer}>
      {/* ── Background decoration ── */}
      <div style={styles.bgOrb1} aria-hidden="true" />
      <div style={styles.bgOrb2} aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 420, zIndex: 1 }}
      >
        <Card style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.title}>Shanvilla Portal</h2>
            <p style={styles.subtitle}>Log in to access the administrator panel</p>
          </div>

          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              label={<span style={styles.label}>Username</span>}
              name="username"
              rules={[{ required: true, message: 'Please enter your username' }]}
            >
              <Input placeholder="Enter username" size="large" style={styles.input} />
            </Form.Item>

            <Form.Item
              label={<span style={styles.label}>Password</span>}
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password placeholder="Enter password" size="large" style={styles.input} />
            </Form.Item>

            <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                size="large"
                style={styles.submitBtn}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </motion.div>
    </div>
  );
};

const styles = {
  loginContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FAF5EF 0%, #F5EFEB 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  bgOrb1: {
    position: 'absolute',
    top: '-150px',
    right: '-100px',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(15, 143, 70, 0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgOrb2: {
    position: 'absolute',
    bottom: '-150px',
    left: '-100px',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245, 130, 32, 0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.88)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    borderRadius: 24,
    boxShadow: '0 30px 70px rgba(15, 25, 45, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.4) inset, 0 4px 16px rgba(15, 25, 45, 0.05)',
    padding: '24px 16px',
  },
  cardHeader: {
    textAlign: 'center',
    marginBottom: 28,
  },
  title: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '2rem',
    fontWeight: 700,
    color: '#0F8F46',
    margin: 0,
  },
  subtitle: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.85rem',
    color: '#718096',
    margin: '6px 0 0 0',
  },
  label: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#4A5568',
  },
  input: {
    borderRadius: 12,
    border: '1px solid rgba(198, 163, 85, 0.3)',
    background: '#FFFDF9',
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #0F8F46 0%, #1ab55a 100%)',
    border: 'none',
    borderRadius: 12,
    height: 48,
    fontWeight: 700,
    fontSize: '0.95rem',
    letterSpacing: '0.02em',
    color: '#FFFFFF',
    boxShadow: '0 8px 20px rgba(15, 143, 70, 0.25)',
    cursor: 'pointer',
  },
};

export default Login;
