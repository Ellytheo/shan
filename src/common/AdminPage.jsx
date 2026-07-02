import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, message, Tabs, Badge, Card, Popconfirm } from 'antd';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BookingModal from '../components/Booking';

const AdminPage = () => {
  const [contacts, setContacts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookingOpen, setBookingOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/sponge');
    } else {
      fetchData();
    }
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contactsRes, bookingsRes] = await Promise.all([
        axios.get('https://Shanvilla.pythonanywhere.com/get_contacts'),
        axios.get('https://Shanvilla.pythonanywhere.com/bookings')
      ]);

      if (contactsRes.data.status === 'success') {
        setContacts(contactsRes.data.data);
      } else {
        message.error('Failed to load contacts.');
      }

      if (Array.isArray(bookingsRes.data)) {
        setBookings(bookingsRes.data);
      } else {
        message.error('Failed to load bookings.');
      }
    } catch (err) {
      message.error('An error occurred while fetching dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id) => {
    try {
      const res = await axios.delete(`https://Shanvilla.pythonanywhere.com/delete_contact/${id}`);
      if (res.data.status === 'success') {
        message.success('Contact inquiry removed.');
        fetchData();
      } else {
        message.error('Failed to delete contact.');
      }
    } catch (err) {
      message.error('Error occurred while deleting contact.');
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    message.info('Logged out successfully');
    navigate('/');
  };

  // ─── Columns for Bookings ───
  const bookingColumns = [
    {
      title: 'Ref.',
      dataIndex: 'booking_reference',
      key: 'booking_reference',
      render: (text) => <span style={{ fontWeight: 700, color: '#C6A355' }}>{text}</span>,
      width: 120,
    },
    {
      title: 'Guest Name',
      dataIndex: 'guest_name',
      key: 'guest_name',
      render: (text) => <span style={{ fontWeight: 600, color: '#1E3A5B' }}>{text}</span>,
    },
    {
      title: 'Room Type',
      dataIndex: 'room_name',
      key: 'room_name',
    },
    {
      title: 'Check-in',
      dataIndex: 'checkin_date',
      key: 'checkin_date',
      render: (text) => text ? text.split('T')[0] : '',
    },
    {
      title: 'Check-out',
      dataIndex: 'checkout_date',
      key: 'checkout_date',
      render: (text) => text ? text.split('T')[0] : '',
    },
    {
      title: 'Guests',
      dataIndex: 'guests',
      key: 'guests',
      width: 80,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const isCancelled = status?.toLowerCase() === 'cancelled';
        return (
          <Badge
            status={isCancelled ? 'error' : 'success'}
            text={status || 'active'}
            style={{ textTransform: 'capitalize' }}
          />
        );
      },
      width: 110,
    }
  ];

  // ─── Columns for Contact Requests ───
  const contactColumns = [
    {
      title: 'Guest',
      key: 'name',
      render: (_, r) => <span style={{ fontWeight: 600, color: '#1E3A5B' }}>{r.first_name} {r.last_name}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      className: 'message-wrap',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title="Delete Inquiry"
          description="Are you sure you want to remove this message?"
          onConfirm={() => deleteContact(record.id)}
          okText="Yes"
          cancelText="No"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="primary"
            danger
            size="small"
            style={{ borderRadius: 6 }}
          >
            Delete
          </Button>
        </Popconfirm>
      ),
      width: 100,
    },
  ];

  const items = [
    {
      key: 'bookings',
      label: (
        <span>
          Room Bookings <Badge count={bookings.length} showZero style={{ marginLeft: 6, backgroundColor: '#0F8F46' }} />
        </span>
      ),
      children: (
        <Table
          columns={bookingColumns}
          dataSource={bookings}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          bordered={false}
          className="sv-admin-table"
        />
      ),
    },
    {
      key: 'contacts',
      label: (
        <span>
          Inquiries <Badge count={contacts.length} showZero style={{ marginLeft: 6, backgroundColor: '#F58220' }} />
        </span>
      ),
      children: (
        <Table
          columns={contactColumns}
          dataSource={contacts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          bordered={false}
          className="sv-admin-table"
        />
      ),
    },
  ];

  return (
    <div style={styles.adminPageContainer}>
      {/* ── Background decoration ── */}
      <div style={styles.bgOrb1} aria-hidden="true" />
      <div style={styles.bgOrb2} aria-hidden="true" />

      <div style={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={styles.header}
        >
          <div>
            <h1 style={styles.title}>Shanvilla Portal</h1>
            <p style={styles.subtitle}>Welcome to the administration & reservation control dashboard.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Button
              type="primary"
              onClick={() => setBookingOpen(true)}
              style={styles.bookRoomBtn}
            >
              <i className="bi bi-calendar-check" style={{ marginRight: 8 }} />
              Create Booking
            </Button>
            <Button
              type="primary"
              onClick={logout}
              style={styles.logoutBtn}
            >
              Logout Portal
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card style={styles.card}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={items}
              size="large"
              tabBarStyle={{ marginBottom: 24, borderBottom: '1px solid rgba(198,163,85,0.15)' }}
            />
          </Card>
        </motion.div>
      </div>

      {/* ── Admin Direct Booking Modal ── */}
      <BookingModal
        open={bookingOpen}
        onClose={() => {
          setBookingOpen(false);
          fetchData(); // Automatically updates the bookings table with new bookings
        }}
      />

      <style>{`
        .sv-admin-table .ant-table {
          background: transparent !important;
        }
        .sv-admin-table .ant-table-thead > tr > th {
          background: rgba(15, 143, 70, 0.08) !important;
          color: #0F8F46 !important;
          font-weight: 700 !important;
          border-bottom: 2px solid rgba(15, 143, 70, 0.15) !important;
          font-family: 'Inter', sans-serif;
        }
        .sv-admin-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid rgba(198, 163, 85, 0.1) !important;
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          color: #2D3748;
          padding: 14px 16px !important;
        }
        .sv-admin-table .ant-table-tbody > tr:hover > td {
          background: rgba(198, 163, 85, 0.05) !important;
        }
        .ant-tabs-tab-btn {
          font-family: 'Playfair Display', serif !important;
          font-weight: 600 !important;
          font-size: 1.1rem !important;
        }
        .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #0F8F46 !important;
        }
        .ant-tabs-ink-bar {
          background: #0F8F46 !important;
        }
      `}</style>
    </div>
  );
};

const styles = {
  adminPageContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #FAF5EF 0%, #FFFFFF 55%, #F8F9FA 100%)',
    padding: '40px 0',
    position: 'relative',
    overflow: 'hidden',
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    position: 'relative',
    zIndex: 1,
  },
  bgOrb1: {
    position: 'absolute',
    top: '-150px',
    right: '-100px',
    width: 600,
    height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(143,211,254,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgOrb2: {
    position: 'absolute',
    bottom: '-150px',
    left: '-100px',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 36,
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '2.4rem',
    fontWeight: 700,
    color: '#0F8F46',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontFamily: "'Inter', sans-serif",
    color: '#5C6A79',
    fontSize: '0.95rem',
    margin: '6px 0 0 0',
  },
  bookRoomBtn: {
    background: 'linear-gradient(135deg, #0F8F46 0%, #1ab55a 100%)',
    border: 'none',
    color: '#FFFFFF',
    fontWeight: 600,
    borderRadius: 12,
    height: 42,
    padding: '0 20px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(15,143,70,0.25)',
    transition: 'all 0.2s ease',
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid rgba(224, 59, 59, 0.4)',
    color: '#E03B3B',
    fontWeight: 600,
    borderRadius: 12,
    height: 42,
    padding: '0 20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.88)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    borderRadius: 24,
    boxShadow: '0 30px 70px rgba(15, 25, 45, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.4) inset, 0 4px 16px rgba(15, 25, 45, 0.05)',
    padding: '12px 12px',
  },
};

export default AdminPage;
