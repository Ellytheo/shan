import { useState } from 'react';
import axios from 'axios';
import {
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { Form, Input, Button, Row, Col, message } from 'antd';

const ContactSection = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('first_name', values.firstName);
    formData.append('last_name', values.lastName);
    formData.append('email', values.email);
    formData.append('phone', values.phone || '');
    formData.append('message', values.message);

    try {
      const res = await axios.post(
        'https://Shanvilla.pythonanywhere.com/submit_contact',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (res.data.status === 'success') {
        message.success('Message sent successfully!');
        form.resetFields();
      } else {
        message.error(res.data.message || 'Something went wrong.');
      }
    } catch (err) {
      console.error(err);
      message.error('Failed to send message. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" style={{ padding: '30px 0', backgroundColor: '#F3F4F6',
          boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.71)", }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              fontFamily: 'Playfair Display, serif',
              borderRadius: "15px",
              padding:"5px",
              boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.42)",
              color: '#0F8F46',
              maxWidth: 1700,
              margin: '0 auto 16px',
            }}
          >
            Contact us
          </h2>
          <div
            style={{
              width: 80,
              height: 4,
              backgroundColor: '#f1eeea',
              margin: '0 auto 24px',
            }}
          />
          <p
            style={{
              color: '#2C3E50',
              fontSize: 'clamp(1rem, 3vw, 1.25rem)',
              maxWidth: 700,
              margin: '0 auto',
              fontFamily: 'Playfair Display, serif',
              lineHeight: 1.5,
            }}
          >
            Planning your getaway or need assistance? We're here 24/7 to make your stay seamless and memorable.
          </p>
        </div>

        <Row gutter={[32, 32]} align="stretch">
          {/* Resort Info */}
          <Col xs={24} md={12}>
            <div
              style={{
                background: '#f9f9f9',
                padding: 'clamp(24px, 5vw, 60px)',
                borderRadius: 12,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.2)",
              }}
            >
              <h3
                style={{
                  fontSize: '1.75rem',
                  fontFamily: 'Playfair Display, serif',
                  marginBottom: 36,
                  color: '#0F8F46',
                  textAlign: 'center',
                }}
              >
                Resort Information
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  {
                    icon: <EnvironmentOutlined style={{ fontSize: 26, color: '#0F8F46' }} />,
                    title: 'Address',
                    content: (
                      <>
                        Shanvilla Resort Ltd<br />
                        Maragua, Murang'a County<br />
                        Kenya
                      </>
                    ),
                  },
                  {
                    icon: <PhoneOutlined style={{ fontSize: 26, color: '#0F8F46' }} />,
                    title: 'Phone',
                    content: <>+254 111427894</>,
                  },
                  {
                    icon: <MailOutlined style={{ fontSize: 26, color: '#0F8F46' }} />,
                    title: 'Email',
                    content: <>reception@shanvillaresortkenya.co.ke</>,
                  },
                  {
                    icon: <ClockCircleOutlined style={{ fontSize: 26, color: '#0F8F46' }} />,
                    title: 'Hours',
                    content: (
                      <>
                        Check-in: 12:01 AM<br />
                        Check-out: 11:59 PM<br />
                        Reception: 24/7
                      </>
                    ),
                  },
                ].map(({ icon, title, content }, idx) => (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }} key={idx}>
                    <div style={{ flexShrink: 0, marginTop: '4px' }}>
                      {icon}
                    </div>
                    <div>
                      <strong style={{ display: 'block', marginBottom: '4px', color: '#2C3E50' }}>{title}</strong>
                      <div style={{ color: '#4A5568', lineHeight: 1.6, fontSize: '0.95rem' }}>{content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Col>

          {/* Contact Form */}
          <Col xs={24} md={12}>
            <div
              style={{
                backgroundColor: '#d0ebff',
                borderRadius: 12,
                padding: 'clamp(20px, 4vw, 40px)',
                height: '100%',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="First Name"
                      name="firstName"
                      rules={[{ required: true, message: 'Please enter your first name' }]}
                    >
                      <Input size="large" placeholder="Enter your first name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Last Name"
                      name="lastName"
                      rules={[{ required: true, message: 'Please enter your last name' }]}
                    >
                      <Input size="large" placeholder="Enter your last name" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter your email address' },
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                >
                  <Input size="large" placeholder="Enter your email address" />
                </Form.Item>

                <Form.Item label="Phone" name="phone">
                  <Input size="large" placeholder="Enter your phone number" />
                </Form.Item>

                <Form.Item
                  label="Message"
                  name="message"
                  rules={[{ required: true, message: 'Please enter your message' }]}
                >
                  <Input.TextArea rows={4} placeholder="How can we assist you?" />
                </Form.Item>

                <Form.Item>
                  <Button className="custom-submit-button" size="large" htmlType="submit" loading={loading}>
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </Col>
        </Row>

        {/* Map */}
        <div
          style={{
            marginTop: 64,
            height: 384,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.29)",
            width: '100%',
          }}
        >
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.4343610196247!2d37.13265537397124!3d-0.7948902352843993!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1828a5002657145f%3A0xbb670eb1d023578!2sShanVilla!5e0!3m2!1sen!2ske!4v1751955495284!5m2!1sen!2ske"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            title="Shanvilla Resort Location"
          />
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
