import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/sponge');
    } else {
      fetchContacts();
    }
  }, [navigate]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://Shanvilla.pythonanywhere.com/get_contacts');
      if (response.data.status === 'success') {
        setContacts(response.data.data);
      } else {
        message.error('Failed to load contacts.');
      }
    } catch (err) {
      message.error('An error occurred while fetching contacts.');
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id) => {
    try {
      const res = await axios.delete(`https://Shanvilla.pythonanywhere.com/delete_contact/${id}`);
      if (res.data.status === 'success') {
        message.success('Contact deleted successfully!');
        fetchContacts();
      } else {
        message.error('Failed to delete contact.');
      }
    } catch (err) {
      message.error('An error occurred while deleting the contact.');
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    message.info('Logged out successfully');
    navigate('/');
  };

  const columns = [
    {
      title: 'No.',
      key: 'index',
      render: (text, record, index) => index + 1,
      width: 60,
    },
    {
      title: 'First Name',
      dataIndex: 'first_name',
      key: 'first_name',
    },
    {
      title: 'Last Name',
      dataIndex: 'last_name',
      key: 'last_name',
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
      responsive: ['md'], // Hide on extra small screens
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button className="btn-bg-danger" size="small" onClick={() => deleteContact(record.id)}>
          Delete
        </Button>
      ),
      width: 100,
    },
  ];

  return (
    <div className='adman' style={{ padding: '20px' }}>
      {/* Header with Logout */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1
            className="text-danger"
            style={{
              fontFamily: "'Splash', cursive",
              margin: 0,
            }}
          >
            Admin Page
          </h1>
        </div>

        <div style={{ textAlign: 'right', marginTop: 10 }}>
          <Button type="primary" danger onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div style={{ overflowX: 'auto' }}>
        <Table
          className="admin-table"
          columns={columns}
          dataSource={contacts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered
          size="small"
          rowClassName={(_, index) => (index % 2 === 0 ? 'even-row' : 'odd-row')}
        />
      </div>
    </div>
  );
};

export default AdminPage;
