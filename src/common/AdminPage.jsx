import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table, Button, message, Badge, Card, Popconfirm,
  Dropdown, Input, Select, DatePicker, Drawer,
  Timeline, Form, Modal, Tag, Spin,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import BookingModal from '../components/Booking';
import './AdminPage.css';

import pic5 from '../images/pic5.jpg';
import pic15 from '../images/pic15.jpg';
import room1 from '../images/standard.webp';
import room2 from '../images/vip.webp';

const IMAGE_MAP = {
  pic5: pic5,
  pic15: pic15,
  room1: room1,
  room2: room2,
};

dayjs.extend(isBetween);

const API_BASE = 'https://shanvilla.pythonanywhere.com';

const COMMON_AMENITIES = [
  { value: 'bi-thermometer-snow|Air Conditioning', label: 'Air Conditioning' },
  { value: 'bi-door-closed|Private Bathroom', label: 'Private Bathroom' },
  { value: 'bi-tv|Flat Screen TV', label: 'Flat Screen TV' },
  { value: 'bi-wifi|High-Speed WiFi', label: 'High-Speed WiFi' },
  { value: 'bi-briefcase|Work Desk', label: 'Work Desk' },
  { value: 'bi-door-open|Balcony', label: 'Balcony' },
  { value: 'bi-display|Smart TV', label: 'Smart TV' },
  { value: 'bi-bell|Room Service', label: 'Room Service' },
  { value: 'bi-people|Twin Beds', label: 'Twin Beds' },
  { value: 'bi-snow2|Mini Fridge', label: 'Mini Fridge' },
  { value: 'bi-stars|Luxury Bedding', label: 'Luxury Bedding' },
  { value: 'bi-cup-straw|Mini Bar', label: 'Mini Bar' },
  { value: 'bi-reception-4|Premium WiFi', label: 'Premium WiFi' },
];

/* ── helpers ── */
const STATUS_MAP = {
  pending:    { label: 'Pending',     badge: 'warning', color: '#F59E0B' },
  confirmed:  { label: 'Confirmed',   badge: 'success', color: '#10B981' },
  checked_in: { label: 'Checked In',  badge: 'processing', color: '#0F8F46' },
  checked_out:{ label: 'Checked Out', badge: 'default', color: '#64748B' },
  cancelled:  { label: 'Cancelled',   badge: 'error',   color: '#EF4444' },
  no_show:    { label: 'No Show',     badge: 'error',   color: '#F97316' },
};

const fmt = (s) => STATUS_MAP[s?.toLowerCase()]?.label ?? 'Pending';
const badgeFor = (s) => STATUS_MAP[s?.toLowerCase()]?.badge ?? 'warning';

const STATUS_ACTIONS = {
  pending:    [{ key:'confirmed', label:'Confirm Booking' }, { key:'cancelled', label:'Cancel', danger:true }],
  confirmed:  [{ key:'checked_in', label:'Check In' }, { key:'no_show', label:'No Show', danger:true }, { key:'cancelled', label:'Cancel', danger:true }],
  checked_in: [{ key:'checked_out', label:'Check Out' }],
};

/* ─────────────────────────────────────── */
const AdminPage = () => {
  const [view, setView]           = useState('dashboard');
  const [contacts, setContacts]   = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [stats, setStats]         = useState({});
  const [loading, setLoading]     = useState(false);
  const [actLoading, setActLoading] = useState(null);
  const [connStatus, setConnStatus] = useState('checking'); // 'ok' | 'error' | 'checking'

  /* filters */
  const [search, setSearch]           = useState('');
  const [statusF, setStatusF]         = useState('all');
  const [dateF, setDateF]             = useState('all');
  const [customRange, setCustomRange] = useState(null);
  const [inqSearch, setInqSearch]     = useState('');
  const [readSet, setReadSet]         = useState(new Set());
  const [repliedSet, setRepliedSet]   = useState(new Set());

  /* detail drawer */
  const [selected, setSelected]       = useState(null);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [history, setHistory]         = useState([]);

  /* modals */
  const [bookingOpen, setBookingOpen] = useState(false);
  const [editOpen, setEditOpen]       = useState(false);
  const [editForm] = Form.useForm();

  /* room mgmt */
  const [rooms, setRooms] = useState([]);
  const [editRoom, setEditRoom]   = useState(null);
  const [roomForm] = Form.useForm();
  const [maintenance, setMaintenance] = useState(new Set());

  /* users */
  const [users, setUsers]           = useState([
    { id:1, username:'admin', role:'Administrator', status:'active' },
    { id:2, username:'reception', role:'Reception', status:'active' },
  ]);
  const [userOpen, setUserOpen]     = useState(false);
  const [userForm] = Form.useForm();

  /* reply */
  const [replyOpen, setReplyOpen]   = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText]   = useState('');

  /* settings */
  const [settingsForm] = Form.useForm();

  const navigate = useNavigate();
  const adminName = localStorage.getItem('adminUsername') || 'admin';

  /* ── fetch ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, bRes, dRes, rRes, dbRoomsRes] = await Promise.all([
        axios.get(`${API_BASE}/get_contacts`),
        axios.get(`${API_BASE}/bookings?limit=200`),
        axios.get(`${API_BASE}/dashboard`),
        axios.get(`${API_BASE}/availability?checkin=${dayjs().format('YYYY-MM-DD')}&checkout=${dayjs().add(1, 'day').format('YYYY-MM-DD')}`),
        axios.get(`${API_BASE}/api/rooms`),
      ]);

      if (cRes.data.status === 'success') setContacts(cRes.data.data || []);
      else message.error('Failed to load inquiries.');

      if (bRes.data.status === 'success') setBookings(bRes.data.bookings || []);
      else message.error('Failed to load bookings.');

      if (dRes.data.status === 'success') setStats(dRes.data);

      if (dbRoomsRes.data.status === 'success' && rRes.data.status === 'success') {
        const liveAvailability = rRes.data.rooms || [];
        const dbRooms = dbRoomsRes.data.rooms || [];
        
        const mergedRooms = dbRooms.map(dbR => {
          const avail = liveAvailability.find(a => a.id === dbR.id);
          return {
            ...dbR,
            booked: avail ? avail.booked : 0,
            available: avail ? avail.available : dbR.total_rooms
          };
        });
        setRooms(mergedRooms);
      }
      setConnStatus('ok');
    } catch (err) {
      console.error(err);
      setConnStatus('error');
      message.error('Cannot reach backend. Check server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { navigate('/sponge'); return; }
    fetchData();
  }, [fetchData, navigate]);

  /* ── actions ── */
  const changeStatus = async (id, newStatus) => {
    setActLoading(id);
    try {
      const res = await axios.put(`${API_BASE}/booking/${id}/status`, {
        status: newStatus,
        changed_by: adminName,
      });
      if (res.data.status === 'success') {
        message.success('Status updated.');
        fetchData();
        if (drawerOpen && selected?.id === id) {
          setSelected(p => ({ ...p, status: newStatus }));
          loadHistory(id);
        }
      } else { message.error(res.data.message || 'Update failed.'); }
    } catch (err) { message.error(err.response?.data?.message || 'Error updating status.'); }
    finally { setActLoading(null); }
  };

  const deleteContact = async (id) => {
    try {
      const res = await axios.delete(`${API_BASE}/delete_contact/${id}`);
      if (res.data.status === 'success') { message.success('Inquiry removed.'); fetchData(); }
      else message.error(res.data.message || 'Delete failed.');
    } catch { message.error('Error deleting inquiry.'); }
  };

  const loadHistory = async (bookingId) => {
    try {
      const res = await axios.get(`${API_BASE}/booking/${bookingId}/history`);
      if (res.data.status === 'success') setHistory(res.data.history || []);
    } catch { setHistory([]); }
  };

  const openDetail = (booking) => {
    setSelected(booking); setHistory([]);
    loadHistory(booking.id); setDrawerOpen(true);
  };

  const openEdit = (booking) => {
    setSelected(booking);
    editForm.setFieldsValue({
      guest_name: booking.guest_name, email: booking.email, phone: booking.phone,
      guests: booking.guests, room_type_id: booking.room_type_id,
      dates: [dayjs(booking.checkin_date), dayjs(booking.checkout_date)],
      admin_notes: booking.admin_notes,
    });
    setEditOpen(true);
  };

  const submitEdit = async (vals) => {
    try {
      const payload = {
        guest_name: vals.guest_name, email: vals.email, phone: vals.phone,
        room_type_id: vals.room_type_id,
        checkin_date: vals.dates[0].format('YYYY-MM-DD'),
        checkout_date: vals.dates[1].format('YYYY-MM-DD'),
        guests: vals.guests, admin_notes: vals.admin_notes,
      };
      const res = await axios.put(`${API_BASE}/booking/${selected.id}`, payload);
      if (res.data.status === 'success') {
        message.success('Booking updated.'); setEditOpen(false); fetchData();
        const roomName = rooms.find(r => r.id === vals.room_type_id)?.name;
        setSelected(p => ({ ...p, ...payload, room_name: roomName }));
      } else message.error(res.data.message || 'Failed.');
    } catch (err) { message.error(err.response?.data?.message || 'Error updating.'); }
  };

  const handleOpenRoomEdit = (room) => {
    setEditRoom(room);
    const selected = (room.amenities || []).map(a => `${a.icon}|${a.label}`);
    roomForm.setFieldsValue({
      name: room.name,
      image_url: room.image_url,
      price: room.price,
      description: room.description,
      price_bb: room.pricing?.bedBreakfast || room.price,
      price_hb: room.pricing?.halfBoard || room.price,
      price_fb: room.pricing?.fullBoard || room.price,
      selected_amenities: selected,
    });
  };

  const handleSaveRoomEdit = async (vals) => {
    try {
      const amenities = (vals.selected_amenities || []).map(str => {
        const [icon, label] = str.split('|');
        return { icon, label };
      });
      const payload = {
        name: vals.name,
        price: Number(vals.price),
        description: vals.description,
        image_url: vals.image_url,
        amenities: amenities,
        pricing: {
          bedBreakfast: Number(vals.price_bb),
          halfBoard: Number(vals.price_hb),
          fullBoard: Number(vals.price_fb),
        }
      };
      const res = await axios.put(`${API_BASE}/api/rooms/${editRoom.id}`, payload);
      if (res.data.status === 'success') {
        message.success('Room updated.');
        setEditRoom(null);
        fetchData();
      } else {
        message.error(res.data.message || 'Failed to update.');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Error updating room.');
    }
  };

  const saveNote = async (note) => {
    if (!selected) return;
    const newNote = selected.admin_notes ? `${selected.admin_notes}, ${note}` : note;
    try {
      const res = await axios.put(`${API_BASE}/booking/${selected.id}`, { ...selected, admin_notes: newNote });
      if (res.data.status === 'success') { setSelected(p => ({ ...p, admin_notes: newNote })); message.success('Note saved.'); fetchData(); }
    } catch { message.error('Failed to save note.'); }
  };

  const createUser = async (vals) => {
    try {
      const res = await axios.post(`${API_BASE}/signup`, { username: vals.username, password: vals.password });
      if (res.data.status === 'success') {
        message.success('User created.');
        setUsers(p => [...p, { id: Date.now(), username: vals.username, role: vals.role, status: 'active' }]);
        setUserOpen(false); userForm.resetFields();
      } else message.error(res.data.message || 'Failed to create user.');
    } catch (err) { message.error(err.response?.data?.message || 'Error creating user.'); }
  };

  const logout = () => {
    localStorage.removeItem('adminToken'); localStorage.removeItem('adminUsername');
    navigate('/');
  };

  /* ── derived counts ── */
  const cnt = (s) => bookings.filter(b => (b.status || 'pending').toLowerCase() === s).length;
  const pendingCnt    = cnt('pending');
  const confirmedCnt  = cnt('confirmed');
  const checkedInCnt  = cnt('checked_in');
  const checkedOutCnt = cnt('checked_out');
  const cancelledCnt  = cnt('cancelled');

  /* ── filtered bookings ── */
  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const matchQ = !q || [b.guest_name,b.phone,b.email,b.booking_reference,b.room_name]
      .some(f => f?.toLowerCase().includes(q));
    const matchS = statusF === 'all' || (b.status||'pending').toLowerCase() === statusF;
    let matchD = true;
    const ci = dayjs(b.checkin_date);
    if (dateF === 'today')     matchD = ci.isSame(dayjs(), 'day');
    else if (dateF === 'tomorrow') matchD = ci.isSame(dayjs().add(1,'day'), 'day');
    else if (dateF === 'week') matchD = ci.isBetween(dayjs().startOf('week'), dayjs().endOf('week'), 'day', '[]');
    else if (dateF === 'custom' && customRange) matchD = ci.isBetween(customRange[0], customRange[1], 'day', '[]');
    return matchQ && matchS && matchD;
  });

  /* ── booking columns ── */
  const bookingCols = [
    { title:'Ref', dataIndex:'booking_reference', key:'ref',
      render: t => <span style={{fontWeight:700,color:'#C6A355',fontSize:'0.82rem'}}>{t}</span>, width:110 },
    { title:'Guest', dataIndex:'guest_name', key:'guest',
      render: (t,r) => <span onClick={() => openDetail(r)} style={{fontWeight:600,color:'#1E3A5B',cursor:'pointer'}}>{t}</span> },
    { title:'Room', dataIndex:'room_name', key:'room' },
    { title:'Phone', dataIndex:'phone', key:'phone', width:120 },
    { title:'Check-in', dataIndex:'checkin_date', key:'ci', width:100,
      render: d => d?.split('T')[0] },
    { title:'Check-out', dataIndex:'checkout_date', key:'co', width:100,
      render: d => d?.split('T')[0] },
    { title:'Guests', dataIndex:'guests', key:'guests', width:70 },
    { title:'Status', dataIndex:'status', key:'status', width:120,
      render: s => <Badge status={badgeFor(s)} text={fmt(s)} /> },
    { title:'Source', dataIndex:'created_by', key:'src', width:105,
      render: v => <Tag color={!v||v==='website'?'blue':'green'}>{!v||v==='website'?'🌐 Website':`👤 ${v}`}</Tag> },
    { title:'Actions', key:'act', width:100,
      render: (_,r) => {
        const acts = STATUS_ACTIONS[r.status?.toLowerCase()] || [];
        const items = [
          ...acts.map(a => ({ key:a.key, label:a.label, danger:a.danger })),
          { key:'edit', label:'Edit' },
          { key:'view', label:'View Details' },
        ];
        return (
          <Dropdown menu={{ items, onClick:({key}) => {
            if (key==='edit') openEdit(r);
            else if (key==='view') openDetail(r);
            else changeStatus(r.id, key);
          }}} trigger={['click']}>
            <Button size="small" loading={actLoading===r.id}>
              Actions <i className="bi bi-chevron-down" style={{fontSize:'0.65rem',marginLeft:3}} />
            </Button>
          </Dropdown>
        );
      }
    },
  ];

  /* ── inquiry columns ── */
  const inqCols = [
    { title:'Guest', key:'g',
      render:(_,r) => <span style={{fontWeight:readSet.has(r.id)?500:700,color:'#1E3A5B'}}>{r.first_name} {r.last_name} {!readSet.has(r.id)&&<Badge status="processing"/>}</span> },
    { title:'Email', dataIndex:'email', key:'email' },
    { title:'Phone', dataIndex:'phone', key:'phone' },
    { title:'Message', dataIndex:'message', key:'msg', ellipsis:true },
    { title:'Status', key:'s', width:110,
      render:(_,r) => <Tag color={repliedSet.has(r.id)?'success':'warning'}>{repliedSet.has(r.id)?'Replied':'Pending'}</Tag> },
    { title:'Actions', key:'act', width:180,
      render:(_,r) => (
        <div style={{display:'flex',gap:6}}>
          <Button size="small" type="link" onClick={() => setReadSet(p=>new Set([...p,r.id]))}>Mark Read</Button>
          <Button size="small" type="link" onClick={() => { setReplyTarget(r); setReplyOpen(true); }}>Reply</Button>
          <Popconfirm title="Delete this inquiry?" onConfirm={()=>deleteContact(r.id)} okText="Yes" cancelText="No">
            <Button size="small" type="link" danger>Delete</Button>
          </Popconfirm>
        </div>
      )
    },
  ];

  /* ── sidebar nav items ── */
  const navItems = [
    { id:'dashboard', icon:'bi-speedometer2', label:'Dashboard' },
    { id:'bookings',  icon:'bi-calendar-range', label:'Bookings' },
    { id:'rooms',     icon:'bi-house-door',     label:'Rooms' },
    { id:'inquiries', icon:'bi-envelope',        label:'Inquiries' },
    { id:'reports',   icon:'bi-graph-up-arrow',  label:'Reports' },
    { id:'users',     icon:'bi-people',           label:'Users' },
    { id:'settings',  icon:'bi-gear',             label:'Settings' },
  ];

  /* ─────────── RENDER ─────────── */
  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <h2 className="sidebar-title">Shanvilla</h2>
          <div className="conn-indicator">
            <span className={`conn-dot ${connStatus}`} />
            <span className="conn-label">
              {connStatus === 'ok' ? 'Connected' : connStatus === 'error' ? 'Offline' : 'Connecting...'}
            </span>
          </div>
        </div>

        <nav className="sidebar-menu">
          {navItems.map(n => (
            <button key={n.id} className={`menu-item ${view===n.id?'active':''}`} onClick={()=>setView(n.id)}>
              <i className={`bi ${n.icon}`} />
              <span>{n.label}</span>
            </button>
          ))}

          <div style={{flex:1}} />

          <button className="menu-item create-btn" onClick={()=>setBookingOpen(true)}>
            <i className="bi bi-plus-circle" />
            <span>Create Booking</span>
          </button>
          <button className="menu-item logout" onClick={logout}>
            <i className="bi bi-box-arrow-right" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="admin-main-content">
        <AnimatePresence mode="wait">

          {/* ── DASHBOARD ── */}
          {view === 'dashboard' && (
            <motion.div key="dash" className="view-wrap" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3}}>
              <div className="view-header">
                <div>
                  <h1 className="view-title">Dashboard</h1>
                  <p className="view-subtitle">Good {dayjs().hour()<12?'morning':'afternoon'}, {adminName}. Here's today at a glance.</p>
                </div>
                <Button onClick={fetchData} loading={loading} icon={<i className="bi bi-arrow-clockwise" />}>Refresh</Button>
              </div>

              {loading ? <div className="center-spin"><Spin size="large" /></div> : (
                <>
                  <div className="stats-grid">
                    {[
                      { label:'Available Rooms', val: stats.available_rooms??0, icon:'bi-door-closed',   cls:'rooms' },
                      { label:'Occupancy',        val:`${stats.occupancy??0}%`,  icon:'bi-percent',       cls:'occupancy' },
                      { label:"Today's Bookings", val: stats.today_bookings??0,  icon:'bi-calendar-check',cls:'total' },
                      { label:'Pending',          val: pendingCnt,               icon:'bi-clock-history', cls:'pending' },
                      { label:'Confirmed',        val: confirmedCnt,             icon:'bi-check-circle',  cls:'confirmed' },
                      { label:'Checked In',       val: checkedInCnt,             icon:'bi-door-open',     cls:'checkedin' },
                      { label:'Checked Out',      val: checkedOutCnt,            icon:'bi-box-arrow-left',cls:'checkedout' },
                      { label:'Cancelled',        val: cancelledCnt,             icon:'bi-x-circle',      cls:'cancelled' },
                    ].map(s => (
                      <div className="stat-card" key={s.label}>
                        <div className={`stat-icon stat-icon-${s.cls}`}><i className={`bi ${s.icon}`}/></div>
                        <div className="stat-info">
                          <span className="stat-label">{s.label}</span>
                          <span className="stat-val">{s.val}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recent Bookings Quick View */}
                  <Card title="Latest Reservations" className="admin-card-style" style={{marginTop:20}}
                    extra={<Button type="link" onClick={()=>setView('bookings')}>View All →</Button>}>
                    <Table
                      size="small"
                      columns={bookingCols.slice(0,7)}
                      dataSource={bookings.slice(0,5)}
                      rowKey="id" pagination={false}
                      loading={loading} className="sv-admin-table"
                      rowClassName={r => {
                        const s = r.status?.toLowerCase();
                        if (s==='pending') return 'pending-row';
                        if (s==='checked_in') return 'checkedin-row';
                        if (s==='cancelled') return 'cancelled-row';
                        return '';
                      }}
                    />
                  </Card>
                </>
              )}
            </motion.div>
          )}

          {/* ── BOOKINGS ── */}
          {view === 'bookings' && (
            <motion.div key="bk" className="view-wrap" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3}}>
              <div className="view-header">
                <div>
                  <h1 className="view-title">Bookings</h1>
                  <p className="view-subtitle">{filtered.length} reservation{filtered.length!==1?'s':''} shown</p>
                </div>
                <Button type="primary" onClick={()=>setBookingOpen(true)} style={{background:'#0F8F46',border:'none'}}>
                  <i className="bi bi-plus-lg" style={{marginRight:6}} /> Create Booking
                </Button>
              </div>

              <Card className="admin-card-style">
                <div className="filter-row">
                  <div className="filter-group">
                    <Input.Search placeholder="Name, phone, email, ref..." value={search}
                      onChange={e=>setSearch(e.target.value)} style={{width:220}} />
                    <Select value={statusF} onChange={setStatusF} style={{width:135}}>
                      <Select.Option value="all">All Statuses</Select.Option>
                      {Object.entries(STATUS_MAP).map(([k,v])=>(
                        <Select.Option key={k} value={k}>{v.label}</Select.Option>
                      ))}
                    </Select>
                    <Select value={dateF} onChange={setDateF} style={{width:130}}>
                      <Select.Option value="all">All Dates</Select.Option>
                      <Select.Option value="today">Today</Select.Option>
                      <Select.Option value="tomorrow">Tomorrow</Select.Option>
                      <Select.Option value="week">This Week</Select.Option>
                      <Select.Option value="custom">Custom Range</Select.Option>
                    </Select>
                    {dateF==='custom' && (
                      <DatePicker.RangePicker value={customRange} onChange={setCustomRange} style={{width:220}}/>
                    )}
                  </div>
                  <Button onClick={fetchData} loading={loading} icon={<i className="bi bi-arrow-clockwise"/>}>Refresh</Button>
                </div>

                <Table columns={bookingCols} dataSource={filtered} rowKey="id"
                  loading={loading} pagination={{pageSize:10,showSizeChanger:false}}
                  className="sv-admin-table" size="middle"
                  rowClassName={r => {
                    const s = r.status?.toLowerCase();
                    if (s==='pending') return 'pending-row';
                    if (s==='checked_in') return 'checkedin-row';
                    if (s==='cancelled') return 'cancelled-row';
                    return '';
                  }}
                />
              </Card>
            </motion.div>
          )}

          {/* ── ROOMS ── */}
          {view === 'rooms' && (
            <motion.div key="rm" className="view-wrap" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3}}>
              <div className="view-header">
                <div><h1 className="view-title">Room Management</h1>
                <p className="view-subtitle">Live occupancy, pricing, and maintenance controls.</p></div>
                <Button onClick={fetchData} loading={loading} icon={<i className="bi bi-arrow-clockwise"/>}>Refresh</Button>
              </div>
              <div className="room-grid">
                {rooms.map(room => {
                  const inMaint = maintenance.has(room.id);
                  const avail   = inMaint ? 0 : Math.max(room.total_rooms - room.booked, 0);
                  const resolvedImage = IMAGE_MAP[room.image_url] || room.image_url;
                  
                  return (
                    <div className="room-card" key={room.id} style={{ padding: 0, overflow: 'hidden' }}>
                      {/* Image header matching guest view */}
                      <div style={{ overflow: 'hidden', height: 180, position: 'relative' }}>
                        <img
                          src={resolvedImage}
                          alt={room.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{ position: 'absolute', top: 12, right: 12 }}>
                          <span style={{ 
                            background: 'rgba(255, 255, 255, 0.9)', 
                            color: avail > 0 ? '#10B981' : '#EF4444', 
                            fontSize: '0.8rem', 
                            fontWeight: 'bold', 
                            padding: '4px 8px', 
                            borderRadius: '20px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}>
                            {inMaint ? 'Blocked' : `${avail} Available`}
                          </span>
                        </div>
                      </div>
                      
                      {/* Body matching guest view */}
                      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h3 className="room-name" style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: '#1E293B', fontWeight: 800 }}>
                            {room.name}
                          </h3>
                        </div>
                        
                        <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, margin: 0, height: 60, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                          {room.description}
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Total</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B' }}>{room.total_rooms}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Booked</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B' }}>{room.booked}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Avail</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: avail > 0 ? '#10B981' : '#EF4444' }}>{avail}</span>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>From </span>
                            <strong style={{ color: '#10B981', fontSize: '1.25rem', fontWeight: 700 }}>KES {room.price.toLocaleString()}</strong>
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>/nt</span>
                          </div>
                          {inMaint && <Tag color="error">Maintenance</Tag>}
                        </div>
                        
                        <div style={{ display: 'flex', gap: 8, marginTop: 12, borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 12 }}>
                          <Button style={{ flex: 1 }} type="primary" onClick={() => handleOpenRoomEdit(room)}>
                            Edit details
                          </Button>
                          <Button style={{ flex: 1 }} danger={!inMaint} onClick={() => {
                            setMaintenance(p => { const n = new Set(p); n.has(room.id) ? n.delete(room.id) : n.add(room.id); return n; });
                            message.info(inMaint ? 'Room activated' : 'Blocked for maintenance.');
                          }}>
                            {inMaint ? 'Activate' : 'Block'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── INQUIRIES ── */}
          {view === 'inquiries' && (
            <motion.div key="inq" className="view-wrap" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3}}>
              <div className="view-header">
                <div><h1 className="view-title">Guest Inquiries</h1>
                <p className="view-subtitle">{contacts.length} message{contacts.length!==1?'s':''} received</p></div>
                <Button onClick={fetchData} loading={loading} icon={<i className="bi bi-arrow-clockwise"/>}>Refresh</Button>
              </div>
              <Card className="admin-card-style">
                <div style={{marginBottom:14}}>
                  <Input.Search placeholder="Search inquiries..." value={inqSearch} onChange={e=>setInqSearch(e.target.value)} style={{maxWidth:280}}/>
                </div>
                <Table
                  columns={inqCols}
                  dataSource={contacts.filter(c=>{
                    const q=inqSearch.toLowerCase();
                    return !q||[c.first_name,c.last_name,c.email,c.phone,c.message].some(f=>f?.toLowerCase().includes(q));
                  })}
                  rowKey="id" loading={loading} pagination={{pageSize:10}} className="sv-admin-table" size="middle"
                />
              </Card>
            </motion.div>
          )}

          {/* ── REPORTS ── */}
          {view === 'reports' && (
            <motion.div key="rep" className="view-wrap" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3}}>
              <div className="view-header">
                <div><h1 className="view-title">Reports</h1>
                <p className="view-subtitle">Operational summaries and performance indicators.</p></div>
              </div>
              <div className="report-section">
                <Card title="Today's Operations" className="admin-card-style">
                  {[
                    ['New Bookings Today', stats.today_bookings??0],
                    ['Active Check-ins',   checkedInCnt],
                    ['Pending Confirmations', pendingCnt],
                    ['Occupancy Rate',     `${stats.occupancy??0}%`],
                    ['Available Rooms',    stats.available_rooms??0],
                  ].map(([label,val])=>(
                    <div key={label} className="report-row"><span>{label}</span><strong>{val}</strong></div>
                  ))}
                </Card>
                <Card title="Monthly Summary" className="admin-card-style">
                  {[
                    ['Total Reservations',   bookings.length],
                    ['Confirmed',            confirmedCnt],
                    ['Checked Out',          checkedOutCnt],
                    ['Cancelled',            cancelledCnt],
                    ['Cancellation Rate',    bookings.length ? `${Math.round(cancelledCnt/bookings.length*100)}%` : '0%'],
                    ['Guest Inquiries',      contacts.length],
                  ].map(([label,val])=>(
                    <div key={label} className="report-row"><span>{label}</span><strong>{val}</strong></div>
                  ))}
                </Card>
              </div>
            </motion.div>
          )}

          {/* ── USERS ── */}
          {view === 'users' && (
            <motion.div key="usr" className="view-wrap" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3}}>
              <div className="view-header">
                <div><h1 className="view-title">Users</h1>
                <p className="view-subtitle">Manage staff accounts and access permissions.</p></div>
                <Button type="primary" onClick={()=>setUserOpen(true)} style={{background:'#0F8F46',border:'none'}}>
                  <i className="bi bi-person-plus" style={{marginRight:6}} /> Add User
                </Button>
              </div>
              <Card className="admin-card-style">
                <Table dataSource={users} rowKey="id" pagination={false} size="middle"
                  columns={[
                    { title:'Username', dataIndex:'username', key:'u' },
                    { title:'Role',     dataIndex:'role',     key:'r' },
                    { title:'Status',   dataIndex:'status',   key:'s', render:s=><Tag color={s==='active'?'success':'error'}>{s}</Tag> },
                    { title:'Actions',  key:'act', render:(_,r)=>(
                      <div style={{display:'flex',gap:8}}>
                        {r.username!=='admin' && (
                          <Button size="small" danger={r.status==='active'} onClick={()=>{
                            setUsers(p=>p.map(u=>u.id===r.id?{...u,status:u.status==='active'?'disabled':'active'}:u));
                            message.info('Status updated.');
                          }}>{r.status==='active'?'Disable':'Enable'}</Button>
                        )}
                      </div>
                    )}
                  ]}
                />
              </Card>
            </motion.div>
          )}

          {/* ── SETTINGS ── */}
          {view === 'settings' && (
            <motion.div key="set" className="view-wrap" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3}}>
              <div className="view-header">
                <div><h1 className="view-title">Settings</h1>
                <p className="view-subtitle">Resort configuration and operating parameters.</p></div>
              </div>
              <Card className="admin-card-style" style={{maxWidth:560}}>
                <Form layout="vertical" form={settingsForm}
                  initialValues={{ resortName:'Shanvilla Resort', phone:'0742682580', email:'info@shanvilla.com', checkinTime:'14:00', checkoutTime:'10:00', cancellationPolicy:'Free cancellation up to 24 hours before check-in.' }}
                  onFinish={()=>message.success('Settings saved.')}>
                  <Form.Item label="Resort Name" name="resortName"><Input /></Form.Item>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <Form.Item label="Email" name="email"><Input /></Form.Item>
                    <Form.Item label="Phone" name="phone"><Input /></Form.Item>
                    <Form.Item label="Check-in Time" name="checkinTime"><Input /></Form.Item>
                    <Form.Item label="Check-out Time" name="checkoutTime"><Input /></Form.Item>
                  </div>
                  <Form.Item label="Cancellation Policy" name="cancellationPolicy">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" style={{background:'#0F8F46',border:'none'}}>Save Settings</Button>
                </Form>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── CREATE BOOKING ── */}
      <BookingModal open={bookingOpen} onClose={()=>{ setBookingOpen(false); fetchData(); }} createdBy={adminName} />

      {/* ── DETAIL DRAWER ── */}
      <Drawer title="Booking Details" placement="right" width={520}
        onClose={()=>setDrawerOpen(false)} open={drawerOpen}
        extra={selected && (
          <div style={{display:'flex',gap:6}}>
            <Button size="small" onClick={()=>openEdit(selected)}>Edit</Button>
            {(STATUS_ACTIONS[selected.status?.toLowerCase()]||[]).map(a=>(
              <Button key={a.key} size="small" type="primary" danger={a.danger}
                style={!a.danger?{background:'#0F8F46',border:'none'}:{}}
                onClick={()=>changeStatus(selected.id,a.key)}>{a.label}</Button>
            ))}
          </div>
        )}>
        {selected && (
          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            <div>
              <h3 style={{margin:0,fontFamily:'Playfair Display,serif',color:'#1E3A5B',fontSize:'1.2rem'}}>{selected.guest_name}</h3>
              <span style={{fontSize:'0.82rem',color:'#94A3B8'}}>Ref: <strong style={{color:'#C6A355'}}>{selected.booking_reference}</strong></span>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[
                ['Email',      selected.email],
                ['Phone',      selected.phone],
                ['Room',       selected.room_name],
                ['Guests',     `${selected.guests} pax`],
                ['Check-in',   selected.checkin_date?.split('T')[0]],
                ['Check-out',  selected.checkout_date?.split('T')[0]],
                ['Status',     fmt(selected.status)],
                ['Source',     selected.created_by||'website'],
                ['Booked At',  dayjs(selected.created_at).format('YYYY-MM-DD HH:mm')],
              ].map(([lbl,val])=>(
                <div key={lbl}>
                  <span style={{fontSize:'0.73rem',color:'#94A3B8',textTransform:'uppercase',fontWeight:600}}>{lbl}</span>
                  <p style={{margin:'3px 0 0',fontSize:'0.92rem',color:'#1E3A5B'}}>{val}</p>
                </div>
              ))}
            </div>

            <div>
              <span style={{fontSize:'0.73rem',color:'#94A3B8',textTransform:'uppercase',fontWeight:600}}>Admin Notes</span>
              <Input.TextArea style={{marginTop:6}} rows={2} value={selected.admin_notes||''}
                onChange={e=>setSelected(p=>({...p,admin_notes:e.target.value}))}
                placeholder="VIP requests, special arrangements..." />
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
                {['VIP Guest','Airport pickup','Late arrival','Birthday deco','Extra towels','Honeymoon'].map(p=>(
                  <Tag key={p} style={{cursor:'pointer'}} onClick={()=>saveNote(p)}>+ {p}</Tag>
                ))}
              </div>
            </div>

            {history.length > 0 && (
              <div>
                <span style={{fontSize:'0.73rem',color:'#94A3B8',textTransform:'uppercase',fontWeight:600,display:'block',marginBottom:10}}>
                  Audit Trail
                </span>
                <Timeline items={history.map(h=>({
                  color: STATUS_MAP[h.new_status?.toLowerCase()]?.color||'#64748B',
                  children: (
                    <div>
                      <span>→ <strong>{fmt(h.new_status)}</strong></span>
                      <div style={{fontSize:'0.76rem',color:'#94A3B8',marginTop:2}}>
                        by {h.changed_by||'system'} · {dayjs(h.changed_at).format('YYYY-MM-DD HH:mm')}
                      </div>
                    </div>
                  )
                }))} />
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ── EDIT MODAL ── */}
      <Modal title="Edit Booking" open={editOpen} onCancel={()=>setEditOpen(false)} footer={null} destroyOnClose width={540}>
        <Form layout="vertical" form={editForm} onFinish={submitEdit}>
          <Form.Item label="Guest Name" name="guest_name" rules={[{required:true}]}><Input /></Form.Item>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Form.Item label="Email" name="email" rules={[{required:true,type:'email'}]}><Input /></Form.Item>
            <Form.Item label="Phone" name="phone" rules={[{required:true}]}><Input /></Form.Item>
            <Form.Item label="Guests" name="guests" rules={[{required:true}]}><Input type="number" /></Form.Item>
            <Form.Item label="Room" name="room_type_id" rules={[{required:true}]}>
              <Select>{rooms.map(r=><Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>)}</Select>
            </Form.Item>
          </div>
          <Form.Item label="Dates" name="dates" rules={[{required:true}]}>
            <DatePicker.RangePicker style={{width:'100%'}} />
          </Form.Item>
          <Form.Item label="Notes" name="admin_notes"><Input.TextArea rows={2} /></Form.Item>
          <Button type="primary" htmlType="submit" block style={{background:'#0F8F46',border:'none'}}>Save Changes</Button>
        </Form>
      </Modal>

      {/* ── ROOM EDIT MODAL ── */}
      <Modal title="Edit Room Details" open={!!editRoom} onCancel={()=>setEditRoom(null)} footer={null} destroyOnClose width={560}>
        {editRoom && (
          <Form layout="vertical" form={roomForm} onFinish={handleSaveRoomEdit}>
            <Form.Item label="Room Type Name" name="name" rules={[{required:true, message: 'Please enter the room name'}]}><Input /></Form.Item>
            <Form.Item label="Image URL / Key (e.g. pic5, room1, or external http link)" name="image_url" rules={[{required:true, message: 'Please enter the image URL or key'}]}><Input /></Form.Item>
            <Form.Item label="Starting Price (KES)" name="price" rules={[{required:true, message: 'Please enter the starting price'}]}><Input type="number" /></Form.Item>
            <Form.Item label="Description" name="description" rules={[{required:true, message: 'Please enter the description'}]}><Input.TextArea rows={3} /></Form.Item>
            
            <h4 style={{ margin: '18px 0 10px', fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>Pricing Plans (KES)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <Form.Item label="Bed & Breakfast" name="price_bb" rules={[{required:true}]}><Input type="number" /></Form.Item>
              <Form.Item label="Half Board" name="price_hb" rules={[{required:true}]}><Input type="number" /></Form.Item>
              <Form.Item label="Full Board" name="price_fb" rules={[{required:true}]}><Input type="number" /></Form.Item>
            </div>
            
            <Form.Item label="Room Amenities" name="selected_amenities">
              <Select mode="multiple" placeholder="Select amenities" style={{ width: '100%' }} maxTagCount="responsive">
                {COMMON_AMENITIES.map(a => (
                  <Select.Option key={a.value} value={a.value}>{a.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            
            <Button type="primary" htmlType="submit" block style={{ height: 44, marginTop: 12 }}>Update Room Details</Button>
          </Form>
        )}
      </Modal>

      {/* ── REPLY MODAL ── */}
      <Modal title={`Reply to ${replyTarget?.first_name}`} open={replyOpen}
        onCancel={()=>{ setReplyOpen(false); setReplyText(''); }}
        onOk={()=>{ message.success(`Reply sent to ${replyTarget?.email}`); setRepliedSet(p=>new Set([...p,replyTarget.id])); setReplyOpen(false); setReplyText(''); }}
        okText="Send Reply" okButtonProps={{style:{background:'#0F8F46',border:'none'}}} destroyOnClose>
        {replyTarget && (
          <div>
            <div style={{background:'#F8FAFC',padding:12,borderRadius:8,marginBottom:12,fontSize:'0.88rem',color:'#475569'}}>
              <strong>Original:</strong> {replyTarget.message}
            </div>
            <Input.TextArea value={replyText} onChange={e=>setReplyText(e.target.value)} rows={5} placeholder="Type your reply..." />
          </div>
        )}
      </Modal>

      {/* ── CREATE USER MODAL ── */}
      <Modal title="Add Staff Account" open={userOpen} onCancel={()=>{ setUserOpen(false); userForm.resetFields(); }} footer={null} destroyOnClose width={420}>
        <Form layout="vertical" form={userForm} onFinish={createUser}>
          <Form.Item label="Username" name="username" rules={[{required:true}]}><Input /></Form.Item>
          <Form.Item label="Password" name="password" rules={[{required:true}]}><Input.Password /></Form.Item>
          <Form.Item label="Role" name="role" rules={[{required:true}]}>
            <Select>
              <Select.Option value="Reception">Reception</Select.Option>
              <Select.Option value="Manager">Manager</Select.Option>
              <Select.Option value="Administrator">Administrator</Select.Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block style={{background:'#0F8F46',border:'none'}}>Register Account</Button>
        </Form>
      </Modal>

    </div>
  );
};

export default AdminPage;
