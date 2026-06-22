import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
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
        message.success('Login successful!');
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
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#74fdf2ff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
      }}
    >
      <Card
        title="Admin Login"
        style={{ width: '100%', maxWidth: 400 }}
        headStyle={{ textAlign: 'center', fontSize: 20, color: '#A21B23' }}
      >
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input placeholder="Enter admin username" size="large" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password placeholder="Enter admin password" size="large" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              size="large"
              style={{ backgroundColor: '#A21B23', borderColor: '#A21B23' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
