import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Table, Button, message, Badge, Card, Popconfirm,
  Dropdown, Input, Select, DatePicker, Drawer,
  Timeline, Form, Modal, Tag, Spin, Upload, Progress,
} from 'antd';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import BookingModal from '../components/Booking';
import './AdminPage.css';
import { BookingCard, UserCard, InquiryCard } from './MobileCards';

/* ── responsive breakpoint hook ── */
function useWindowWidth() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setW(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return w;
}

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

// API_BASE kept only for image URL resolution (not for api.get/post calls which already use baseURL)
const API_BASE = (api.defaults.baseURL || '').replace(/\/$/, '');

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

const STATUS_ACTIONS = {
  pending:    [{ key:'confirmed', label:'Confirm Booking' }, { key:'cancelled', label:'Cancel', danger:true }],
  confirmed:  [{ key:'checked_in', label:'Check In' }, { key:'no_show', label:'No Show', danger:true }, { key:'cancelled', label:'Cancel', danger:true }],
  checked_in: [{ key:'checked_out', label:'Check Out' }],
};

/* ─────────────────────────────────────── */
const AdminPage = () => {
  const [view, setView]           = useState(() => localStorage.getItem('adminActiveView') || 'dashboard');
  const [contacts, setContacts]   = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [stats, setStats]         = useState({});
  const [loading, setLoading]     = useState(true);
  const [actLoading, setActLoading] = useState(null);
  const [connStatus, setConnStatus] = useState('checking'); // 'ok' | 'error' | 'checking'

  /* sidebar collapse */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
  const [users, setUsers]           = useState([]);

  const [userOpen, setUserOpen]         = useState(false);
  const [userForm] = Form.useForm();
  const typedPassword = Form.useWatch('password', userForm) || '';

  /* edit user */
  const [editUserTarget, setEditUserTarget] = useState(null);
  const [editUserOpen, setEditUserOpen]     = useState(false);
  const [editUserForm] = Form.useForm();

  /* reset password */
  const [resetPwdTarget, setResetPwdTarget] = useState(null);
  const [resetPwdOpen, setResetPwdOpen]     = useState(false);
  const [resetPwdForm] = Form.useForm();

  /* reply / read inquiry */
  const [replyOpen, setReplyOpen]   = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText]   = useState('');
  const [viewInquiry, setViewInquiry] = useState(null);

  const handleReadInquiry = async (inquiry) => {
    setReadSet(p => new Set([...p, inquiry.id]));
    setViewInquiry(inquiry);
    try {
      await api.put(`/update_contact_status/${inquiry.id}`, { status: 'read' });
      setContacts(prev => prev.map(c => c.id === inquiry.id ? { ...c, status: 'read' } : c));
    } catch (err) {
      console.error('Failed to update inquiry status', err);
    }
  };

  /* settings */
  const [settingsForm] = Form.useForm();

  /* upload & gallery state */
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [roomImagePreview, setRoomImagePreview] = useState(null);
  const [galleryList, setGalleryList] = useState([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const { user, logout: authLogout } = useAuth();
  const adminName = user?.username || 'admin';
  const isAdmin = user?.role === 'Admin';

  /* ── responsive: show cards on ≤768px ── */
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth <= 768;

  /* ── auto-collapse on small screens ── */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 992) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ── sync active view to localstorage & guard restricted views ── */
  useEffect(() => {
    const adminOnlyViews = ['reports', 'users', 'settings'];
    if (!isAdmin && adminOnlyViews.includes(view)) {
      setTimeout(() => setView('dashboard'), 0);
      return;
    }
    localStorage.setItem('adminActiveView', view);
  }, [view, isAdmin]);

  /* ── fetch ── */
  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial !== true) setLoading(true);
    try {
      const [cRes, bRes, dRes, rRes, dbRoomsRes, galRes, setRes, usersRes] =
      await Promise.all([
        api.get('/get_contacts').catch(err => ({ error: err })),
        api.get('/bookings?limit=200').catch(err => ({ error: err })),
        api.get('/dashboard').catch(err => ({ error: err })),
        api.get(`/availability?checkin=${dayjs().format('YYYY-MM-DD')}&checkout=${dayjs().add(1, 'day').format('YYYY-MM-DD')}`).catch(err => ({ error: err })),
        api.get('/api/rooms').catch(err => ({ error: err })),
        api.get('/api/gallery').catch(err => ({ error: err })),
        api.get('/api/settings').catch(() => null),
        api.get('/api/users').catch(() => null),
      ]);

      const hasFatalNetworkError = [cRes, bRes, dRes].every(res => res?.error && !res?.error?.response);
      if (hasFatalNetworkError) {
        throw new Error('Network error: server unreachable');
      }

      if (cRes?.data?.status === 'success') {
        const data = cRes.data.data || [];
        setContacts(data);
        const readIds = data.filter(c => c.status === 'read').map(c => c.id);
        setReadSet(new Set(readIds));
      } else if (cRes?.data) message.error('Failed to load inquiries.');

      if (bRes?.data?.status === 'success') setBookings(bRes.data.bookings || []);
      else if (bRes?.data) message.error('Failed to load bookings.');

      if (dRes?.data?.status === 'success') setStats(dRes.data);

      if (dbRoomsRes?.data?.status === 'success' || rRes?.data?.status === 'success') {
        const liveAvailability = rRes?.data?.rooms || [];
        const dbRooms = dbRoomsRes?.data?.rooms || liveAvailability || [];
        
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

      if (galRes?.data?.status === 'success') {
        setGalleryList(galRes.data.images || []);
      }

      if (setRes?.data?.status === 'success') {
        settingsForm.setFieldsValue(setRes.data.settings);
      }

      if (usersRes?.data) {
        const uList = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.users || [];
        setUsers(uList);
      }

      setConnStatus('ok');
    } catch (err) {
      if (import.meta.env.DEV) console.error('[fetchData]', err);
      setConnStatus('error');
      message.error('Cannot reach backend. Check server.');
    } finally {
      setLoading(false);
    }
  }, [settingsForm]);

    // ProtectedRoute already guards this page; just fetch data on mount
  useEffect(() => {
    setTimeout(() => fetchData(true), 0);
  }, [fetchData]);

  /* ── actions ── */
  const changeStatus = async (id, newStatus) => {
    setActLoading(id);
    try {
      const res = await api.put(`/booking/${id}/status`, {
        status: newStatus,
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
      const res = await api.delete(`/delete_contact/${id}`);
      if (res.data.status === 'success') { message.success('Inquiry removed.'); fetchData(); }
      else message.error(res.data.message || 'Delete failed.');
    } catch { message.error('Error deleting inquiry.'); }
  };

  const loadHistory = async (bookingId) => {
    try {
      const res = await api.get(`/booking/${bookingId}/history`);
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
      const res = await api.put(`/booking/${selected.id}`, payload);
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
    const previewUrl = IMAGE_MAP[room.image_url] || (room.image_url?.startsWith('/uploads/') ? `${API_BASE}${room.image_url}` : room.image_url);
    setRoomImagePreview(previewUrl);
    setUploadProgress(0);

    const p = room.pricing || {};
    const singleP = p.single || (p.bedBreakfast ? p : {});
    const doubleP = p.double || (p.single ? p.double : p);
    const tripleP = p.triple || {};

    roomForm.setFieldsValue({
      name: room.name,
      image_url: room.image_url,
      price: room.price,
      description: room.description,
      
      // Single occupancy (1 guest)
      single_bb: singleP.bedBreakfast ?? room.price,
      single_hb: singleP.halfBoard ?? room.price,
      single_fb: singleP.fullBoard ?? room.price,

      // Double occupancy (2 guests)
      double_bb: doubleP.bedBreakfast ?? room.price,
      double_hb: doubleP.halfBoard ?? room.price,
      double_fb: doubleP.fullBoard ?? room.price,

      // Triple occupancy (3 guests)
      triple_bb: tripleP.bedBreakfast ?? (doubleP.bedBreakfast ? doubleP.bedBreakfast + 700 : room.price),
      triple_hb: tripleP.halfBoard ?? (doubleP.halfBoard ? doubleP.halfBoard + 700 : room.price),
      triple_fb: tripleP.fullBoard ?? (doubleP.fullBoard ? doubleP.fullBoard + 700 : room.price),

      selected_amenities: selected,
    });
  };

  const handleSaveRoomEdit = async (vals) => {
    try {
      const amenities = (vals.selected_amenities || []).map(str => {
        const [icon, label] = str.split('|');
        return { icon, label };
      });

      const isSuperior = editRoom?.id === 3 || editRoom?.name?.toLowerCase().includes('superior');

      let pricingPayload = {};
      if (isSuperior) {
        // Superior Twin Room: 2 Guests (double) & 3 Guests (triple)
        pricingPayload = {
          double: {
            bedBreakfast: Number(vals.double_bb),
            halfBoard: Number(vals.double_hb),
            fullBoard: Number(vals.double_fb),
          },
          triple: {
            bedBreakfast: Number(vals.triple_bb),
            halfBoard: Number(vals.triple_hb),
            fullBoard: Number(vals.triple_fb),
          }
        };
      } else {
        // Standard, Deluxe, Executive, VIP: 1 Guest (single) & 2 Guests (double)
        pricingPayload = {
          single: {
            bedBreakfast: Number(vals.single_bb),
            halfBoard: Number(vals.single_hb),
            fullBoard: Number(vals.single_fb),
          },
          double: {
            bedBreakfast: Number(vals.double_bb),
            halfBoard: Number(vals.double_hb),
            fullBoard: Number(vals.double_fb),
          }
        };
      }

      const payload = {
        name: vals.name,
        price: Number(vals.price),
        description: vals.description,
        image_url: vals.image_url,
        amenities: amenities,
        pricing: pricingPayload,
      };

      const res = await api.put(`/api/rooms/${editRoom.id}`, payload);
      if (res.data.status === 'success') {
        message.success('Room details updated.');
        setEditRoom(null);
        fetchData();
      } else {
        message.error(res.data.message || 'Failed to update room.');
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('[saveRoomEdit]', err);
      message.error(err.response?.data?.message || 'Error updating room.');
    }
  };

  const handleImageUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    const isValidFormat = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!isValidFormat) {
      message.error('You can only upload JPG/JPEG/PNG/WEBP files!');
      onError(new Error('Invalid format'));
      return;
    }
    const isLt3M = file.size / 1024 / 1024 < 3;
    if (!isLt3M) {
      message.error('Image must be smaller than 3MB!');
      onError(new Error('File too large'));
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setUploadingImage(true);
    setUploadProgress(0);
    try {
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(pct);
        },
      });
      if (res.data.status === 'success') {
        const uploadedUrl = res.data.url;
        const cacheBustedUrl = `${uploadedUrl}?t=${Date.now()}`;
        roomForm.setFieldsValue({ image_url: uploadedUrl });
        setRoomImagePreview(uploadedUrl.startsWith('/uploads/') ? `${API_BASE}${cacheBustedUrl}` : cacheBustedUrl);
        message.success('Image uploaded successfully!');
        onSuccess(res.data);
      } else {
        message.error(res.data.message || 'Upload failed');
        onError(new Error(res.data.message || 'Upload failed'));
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('[uploadImage]', err);
      message.error(err.response?.data?.message || 'Error uploading image.');
      onError(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGalleryUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    const isValidFormat = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!isValidFormat) {
      message.error('You can only upload JPG/JPEG/PNG/WEBP files!');
      onError(new Error('Invalid format'));
      return;
    }
    const isLt3M = file.size / 1024 / 1024 < 3;
    if (!isLt3M) {
      message.error('Image must be smaller than 3MB!');
      onError(new Error('File too large'));
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setUploadingGallery(true);
    try {
      const uploadRes = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (uploadRes.data.status === 'success') {
        const imageUrl = uploadRes.data.url;
        const galRes = await api.post('/api/gallery', { image_url: imageUrl });
        if (galRes.data.status === 'success') {
          message.success('Image added to gallery!');
          fetchData();
          onSuccess(galRes.data);
        } else {
          message.error(galRes.data.message || 'Failed to add image to gallery.');
          onError(new Error(galRes.data.message || 'Failed to add image to gallery.'));
        }
      } else {
        message.error(uploadRes.data.message || 'Upload failed');
        onError(new Error(uploadRes.data.message || 'Upload failed'));
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('[addGallery]', err);
      message.error(err.response?.data?.message || 'Error uploading gallery image.');
      onError(err);
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleDeleteGallery = async (id) => {
    try {
      const res = await api.delete(`/api/gallery/${id}`);
      if (res.data.status === 'success') {
        message.success('Image deleted from gallery.');
        fetchData();
      } else {
        message.error(res.data.message || 'Failed to delete image.');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('[deleteGallery]', error);
      message.error('Error deleting image.');
    }
  };

  const saveNote = async (note) => {
    if (!selected) return;
    const newNote = selected.admin_notes ? `${selected.admin_notes}, ${note}` : note;
    try {
      const res = await api.put(`/booking/${selected.id}`, { ...selected, admin_notes: newNote });
      if (res.data.status === 'success') { setSelected(p => ({ ...p, admin_notes: newNote })); message.success('Note saved.'); fetchData(); }
    } catch { message.error('Failed to save note.'); }
  };

  const createUser = async (vals) => {
    try {
      const res = await api.post('/signup', { 
        username: vals.username, 
        password: vals.password,
        role: vals.role
      });
      // Backend returns 201 on success
      if (res.data.status === 'success') {
        message.success('User created successfully.');
        setUserOpen(false);
        userForm.resetFields();
        fetchData();
      } else {
        message.error(res.data.message || 'Failed to create user.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error creating user.';
      message.error(msg);
    }
  };

  const logout = async () => {
    const key = 'logout_msg';
    message.loading({ content: 'Signing you out…', key, duration: 0 });
    try {
      await authLogout();
      message.success({ content: 'Logged out successfully. See you next time!', key, duration: 2.5 });
    } catch {
      message.error({ content: 'Logout failed. Please try again.', key, duration: 3 });
    }
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

  /* ── header content helpers ── */
  const getHeaderTitle = () => {
    switch (view) {
      case 'dashboard': return 'Dashboard';
      case 'bookings': return 'Bookings';
      case 'rooms': return 'Room Management';
      case 'gallery': return 'Resort Gallery';
      case 'inquiries': return 'Guest Inquiries';
      case 'reports': return 'Reports';
      case 'users': return 'Users';
      case 'settings': return 'Settings';
      default: return 'Admin Console';
    }
  };

  const getHeaderSubtitle = () => {
    switch (view) {
      case 'dashboard': {
        const timeOfDay = dayjs().hour() < 12 ? 'morning' : 'afternoon';
        return `Good ${timeOfDay}, ${adminName}. Here's today at a glance.`;
      }
      case 'bookings':
        return `${filtered.length} reservation${filtered.length !== 1 ? 's' : ''} shown`;
      case 'rooms':
        return 'Live occupancy, pricing, and maintenance controls.';
      case 'gallery':
        return 'Upload, view, and manage images displayed on the main guest-facing gallery section.';
      case 'inquiries':
        return `${contacts.length} message${contacts.length !== 1 ? 's' : ''} received`;
      case 'reports':
        return 'Operational summaries and performance indicators.';
      case 'users':
        return 'Manage staff accounts and access permissions.';
      case 'settings':
        return 'Resort configuration and operating parameters.';
      default:
        return '';
    }
  };

  const getHeaderAction = () => {
    const refreshBtn = (
      <Button onClick={() => fetchData(false)} loading={loading} icon={<i className="bi bi-arrow-clockwise" />}>
        Refresh
      </Button>
    );

    switch (view) {
      case 'dashboard':
      case 'rooms':
      case 'inquiries':
        return refreshBtn;
      case 'bookings':
        return (
          <div style={{ display: 'flex', gap: 10 }}>
            {refreshBtn}
            <Button type="primary" onClick={() => setBookingOpen(true)} className="btn-blue">
              <i className="bi bi-plus-lg" style={{ marginRight: 6 }} /> Create Booking
            </Button>
          </div>
        );
      case 'users':
        return isAdmin ? (
          <Button type="primary" onClick={() => setUserOpen(true)} className="btn-blue">
            <i className="bi bi-person-plus" style={{ marginRight: 6 }} /> Add User
          </Button>
        ) : null;
      default:
        return null;
    }
  };

  const colorForBooking = s => {
    const sl = s?.toLowerCase();
    if (sl==='pending') return '#D4AF37';
    if (sl==='confirmed') return '#8B7355';
    if (sl==='checked_in') return '#1C1917';
    if (sl==='checked_out') return '#A8A29E';
    if (sl==='cancelled' || sl==='no_show') return '#3E2723';
    return '#78716C';
  };

  /* ── booking columns ── */
  const bookingCols = [
    { title:'Ref', dataIndex:'booking_reference', key:'ref',
      render: t => <span style={{fontWeight:700,color:'#C5A880',fontSize:'0.82rem'}}>{t}</span>, width:110 },
    { title:'Guest', dataIndex:'guest_name', key:'guest',
      render: (t,r) => <span onClick={() => openDetail(r)} style={{fontWeight:600,color:'var(--text-main)',cursor:'pointer'}}>{t}</span> },
    { title:'Room', dataIndex:'room_name', key:'room' },
    { title:'Phone', dataIndex:'phone', key:'phone', width:120 },
    { title:'Check-in', dataIndex:'checkin_date', key:'ci', width:100,
      render: d => d?.split('T')[0] },
    { title:'Check-out', dataIndex:'checkout_date', key:'co', width:100,
      render: d => d?.split('T')[0] },
    { title:'Guests', dataIndex:'guests', key:'guests', width:70 },
    { title:'Status', dataIndex:'status', key:'status', width:120,
      render: s => <Badge color={colorForBooking(s)} text={fmt(s)} /> },
    { title:'Source', dataIndex:'created_by', key:'src', width:105,
      render: v => <Tag color={!v||v==='website'?'#C5A880':'#8B7355'}>{!v||v==='website'?'🌐 Website':`👤 ${v}`}</Tag> },
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
      render:(_,r) => <span style={{fontWeight:readSet.has(r.id)?500:700,color:'var(--text-main)'}}>{r.first_name} {r.last_name} {!readSet.has(r.id)&&<Badge status="processing"/>}</span> },
    { title:'Email', dataIndex:'email', key:'email' },
    { title:'Phone', dataIndex:'phone', key:'phone', responsive:['md'] },
    { title:'Message', dataIndex:'message', key:'msg', ellipsis:true },
    { title:'Status', key:'s', width:100,
      render:(_,r) => <Tag color={readSet.has(r.id)?'#10B981':'#D4AF37'}>{readSet.has(r.id)?'Read':'Unread'}</Tag> },
    { title:'Actions', key:'act', width:160, fixed:'right',
      render:(_,r) => (
        <div className="inq-actions">
          <button className="inq-btn inq-btn--muted" onClick={() => handleReadInquiry(r)}>
            <i className="bi bi-eye" /> Read
          </button>
          <Popconfirm title="Delete this inquiry?" onConfirm={()=>deleteContact(r.id)} okText="Yes" cancelText="No" placement="topRight">
            <button className="inq-btn inq-btn--danger">
              <i className="bi bi-trash" /> Delete
            </button>
          </Popconfirm>
        </div>
      )
    },
  ];

  /* ── sidebar nav items (admin-only items hidden for non-Admin roles) ── */
  const ALL_NAV_ITEMS = [
    { id:'dashboard',  icon:'bi-speedometer2',    label:'Dashboard',  adminOnly: false },
    { id:'bookings',   icon:'bi-calendar-range',  label:'Bookings',   adminOnly: false },
    { id:'rooms',      icon:'bi-house-door',      label:'Rooms',      adminOnly: false },
    { id:'gallery',    icon:'bi-images',          label:'Gallery',    adminOnly: false },
    { id:'inquiries',  icon:'bi-envelope',        label:'Inquiries',  adminOnly: false },
    { id:'reports',    icon:'bi-graph-up-arrow',  label:'Reports',    adminOnly: true  },
    { id:'users',      icon:'bi-people',          label:'Users',      adminOnly: true  },
    { id:'settings',   icon:'bi-gear',            label:'Settings',   adminOnly: true  },
  ];
  const navItems = ALL_NAV_ITEMS.filter(n => !n.adminOnly || isAdmin);

  /* ─────────── RENDER ─────────── */
  return (
    <div className="admin-layout">

      {/* MOBILE SIDEBAR BACKDROP */}
      {!sidebarCollapsed && (
        <div className="sidebar-backdrop" onClick={() => setSidebarCollapsed(true)} />
      )}

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
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
            <button key={n.id} className={`menu-item ${view===n.id?'active':''}`} onClick={()=>{
              setView(n.id);
              if (window.innerWidth <= 992) {
                setSidebarCollapsed(true);
              }
            }}>
              <i className={`bi ${n.icon}`} />
              <span>{n.label}</span>
            </button>
          ))}

          <div style={{flex:1}} />

          <button className="menu-item create-btn" onClick={()=>{
            setBookingOpen(true);
            if (window.innerWidth <= 992) setSidebarCollapsed(true);
          }}>
            <i className="bi bi-plus-circle" />
            <span>Create Booking</span>
          </button>
          <button className="menu-item logout" onClick={logout}>
            <i className="bi bi-box-arrow-right" />
            <span>Logout</span>
          </button>
        </nav>

        {/* Sidebar collapse toggle */}
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed(prev => !prev)}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`} />
        </button>
      </aside>

      {/* MAIN */}
      <main className={`admin-main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        
        {/* UNIFIED STICKY HEADER */}
        <div className="view-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Sidebar toggle hamburger menu */}
            <button
              className={`menu-toggle-btn ${sidebarCollapsed ? 'menu-toggle-btn--closed' : 'menu-toggle-btn--open'}`}
              onClick={() => setSidebarCollapsed(prev => !prev)}
              title={sidebarCollapsed ? 'Open sidebar' : 'Hide sidebar'}
            >
              <i className={sidebarCollapsed ? 'bi bi-list' : 'bi bi-chevron-left'} />
            </button>
            <div>
              <h1 className="view-title">{getHeaderTitle()}</h1>
              <p className="view-subtitle">{getHeaderSubtitle()}</p>
            </div>
          </div>
          <div className="view-header-right">
            {sidebarCollapsed && (
              <div className={`conn-pill ${connStatus}`}>
                <span className={`conn-dot ${connStatus}`} />
                <span className="conn-label">
                  {connStatus === 'ok' ? 'Connected' : connStatus === 'error' ? 'Offline' : 'Connecting...'}
                </span>
              </div>
            )}
            {getHeaderAction()}
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── DASHBOARD ── */}
          {view === 'dashboard' && (
            <motion.div key="dash" className="view-wrap" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3}}>
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
              {/* Filters — always visible */}
              <Card className="admin-card-style" style={{ marginBottom: 16 }}>
                <div className="filter-row">
                  <div className="filter-group" style={{ width: '100%' }}>
                    <div className="search-input-group" style={{ display: 'flex', gap: 8, flex: '1 1 auto' }}>
                      <Input className="custom-search-input" placeholder="Name, phone, email, ref..." value={search}
                        onChange={e=>setSearch(e.target.value)} style={{ flex: 1, minWidth: 150, maxWidth: 250 }} />
                      <Button type="primary" className="btn-blue" icon={<i className="bi bi-search" />} />
                    </div>
                    <Select className="responsive-filter" value={statusF} onChange={setStatusF} style={{ flex: '1 1 auto', minWidth: 130, maxWidth: 160 }}>
                      <Select.Option value="all">All Statuses</Select.Option>
                      {Object.entries(STATUS_MAP).map(([k,v])=>(
                        <Select.Option key={k} value={k}>{v.label}</Select.Option>
                      ))}
                    </Select>
                    <Select className="responsive-filter" value={dateF} onChange={setDateF} style={{ flex: '1 1 auto', minWidth: 130, maxWidth: 160 }}>
                      <Select.Option value="all">All Dates</Select.Option>
                      <Select.Option value="today">Today</Select.Option>
                      <Select.Option value="tomorrow">Tomorrow</Select.Option>
                      <Select.Option value="week">This Week</Select.Option>
                      <Select.Option value="custom">Custom Range</Select.Option>
                    </Select>
                    {dateF==='custom' && (
                      <DatePicker.RangePicker className="responsive-filter" value={customRange} onChange={setCustomRange} style={{ flex: '1 1 auto', minWidth: 200, maxWidth: 250 }}/>
                    )}
                  </div>
                </div>
              </Card>

              {/* Desktop table */}
              {!isMobile && (
                <Card className="admin-card-style sv-table-only">
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
              )}

              {/* Mobile cards */}
              {isMobile && (
                <div className="mc-card-list mc-mobile-only">
                  {loading && <div className="center-spin"><Spin /></div>}
                  {!loading && filtered.length === 0 && (
                    <div className="mc-empty">
                      <i className="bi bi-calendar-x" />
                      <div className="mc-empty-text">No bookings match your filters.</div>
                    </div>
                  )}
                  {!loading && filtered.map(b => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      onView={openDetail}
                      onEdit={openEdit}
                      onStatusChange={changeStatus}
                      actLoading={actLoading}
                      statusActions={STATUS_ACTIONS}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── ROOMS ── */}
          {view === 'rooms' && (
            <motion.div key="rm" className="view-wrap" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3}}>
              <div className="room-grid">
                {rooms.map(room => {
                  const inMaint = maintenance.has(room.id);
                  const activeStatuses = ['confirmed','checked_in','pending'];
                  const bookedCount = bookings.filter(b =>
                    b.room_type_id === room.id &&
                    activeStatuses.includes((b.status||'pending').toLowerCase())
                  ).length;
                  const totalRooms = room.total_rooms || 1;
                  const availCount = inMaint ? 0 : Math.max(totalRooms - bookedCount, 0);
                  const resolvedImage = IMAGE_MAP[room.image_url] || (room.image_url?.startsWith('/uploads/') ? `${API_BASE}${room.image_url}` : room.image_url);
                  const occupancyPct = Math.round((bookedCount / totalRooms) * 100);
                  
                  return (
                    <div className="room-card" key={room.id}>
                      {/* Image header */}
                      <div className="room-card-image">
                        <img
                          src={resolvedImage}
                          alt={room.name}
                        />
                        {/* Occupancy bar overlay */}
                        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:4, background:'rgba(0,0,0,0.2)' }}>
                          <div style={{ height:'100%', width:`${occupancyPct}%`, background: occupancyPct > 80 ? '#EF4444' : occupancyPct > 50 ? '#F59E0B' : '#10B981', transition:'width 0.6s ease' }} />
                        </div>
                        <div style={{ position: 'absolute', top: 12, right: 12 }}>
                          <span className={`room-avail-badge ${availCount > 0 ? 'room-avail-badge--green' : 'room-avail-badge--red'}`}>
                            {inMaint ? '🔧 Blocked' : `${availCount} Available`}
                          </span>
                        </div>
                        {inMaint && (
                          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <span style={{ color:'#FFF', fontWeight:700, fontSize:'1rem', letterSpacing:'0.05em', textShadow:'0 2px 6px rgba(0,0,0,0.5)' }}>MAINTENANCE</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Body */}
                      <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h3 className="room-name" style={{ margin: 0, fontSize: '1.15rem' }}>{room.name}</h3>
                          <span className="room-price">KES {(room.price||0).toLocaleString()}</span>
                        </div>
                        
                        <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow:'hidden' }}>
                          {room.description}
                        </p>
                        
                        {/* Stats row */}
                        <div className="room-stats">
                          <div className="room-stat-box">
                            <span className="room-stat-lbl">Total</span>
                            <span className="room-stat-val">{totalRooms}</span>
                          </div>
                          <div className="room-stat-box" style={{ borderLeft:'1px solid rgba(0,0,0,0.06)', borderRight:'1px solid rgba(0,0,0,0.06)' }}>
                            <span className="room-stat-lbl">Booked</span>
                            <span className="room-stat-val" style={{ color: bookedCount > 0 ? '#F59E0B' : '#10B981' }}>{bookedCount}</span>
                          </div>
                          <div className="room-stat-box">
                            <span className="room-stat-lbl">Free</span>
                            <span className="room-stat-val" style={{ color: availCount > 0 ? '#10B981' : '#EF4444' }}>{availCount}</span>
                          </div>
                        </div>

                        {/* Occupancy indicator */}
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:6, borderRadius:99, background:'#F1F5F9', overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${occupancyPct}%`, borderRadius:99, background: occupancyPct > 80 ? '#EF4444' : occupancyPct > 50 ? '#F59E0B' : '#10B981', transition:'width 0.6s ease' }} />
                          </div>
                          <span style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', minWidth:32 }}>{occupancyPct}%</span>
                        </div>
                        
                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 4, borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 12 }}>
                          <button className="room-action-btn room-action-btn--primary" onClick={() => handleOpenRoomEdit(room)}>
                            <i className="bi bi-pencil-square" /> Edit
                          </button>
                          <button
                            className={`room-action-btn ${inMaint ? 'room-action-btn--activate' : 'room-action-btn--block'}`}
                            onClick={() => {
                              setMaintenance(p => { const n = new Set(p); n.has(room.id) ? n.delete(room.id) : n.add(room.id); return n; });
                              message.info(inMaint ? 'Room activated' : 'Blocked for maintenance.');
                            }}
                          >
                            <i className={`bi ${inMaint ? 'bi-check-circle' : 'bi-tools'}`} /> {inMaint ? 'Activate' : 'Block'}
                          </button>
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
              <Card className="admin-card-style" style={{ marginBottom: 16 }}>
                <div style={{marginBottom:14, display: 'flex', gap: 8}}>
                  <Input className="custom-search-input" placeholder="Search inquiries..." value={inqSearch}
                    onChange={e=>setInqSearch(e.target.value)}
                    style={{maxWidth:280}}
                  />
                  <Button type="primary" className="btn-blue" icon={<i className="bi bi-search" />} />
                </div>

                {/* Desktop table */}
                {!isMobile && (
                  <Table
                    columns={inqCols}
                    dataSource={contacts.filter(c=>{
                      const q=inqSearch.toLowerCase();
                      return !q||[c.first_name,c.last_name,c.email,c.phone,c.message].some(f=>f?.toLowerCase().includes(q));
                    })}
                    rowKey="id" loading={loading} pagination={{pageSize:10}} className="sv-admin-table sv-table-only" size="middle"
                  />
                )}
              </Card>

              {/* Mobile cards */}
              {isMobile && (
                <div className="mc-card-list mc-mobile-only">
                  {loading && <div className="center-spin"><Spin /></div>}
                  {!loading && contacts.filter(c=>{
                    const q=inqSearch.toLowerCase();
                    return !q||[c.first_name,c.last_name,c.email,c.phone,c.message].some(f=>f?.toLowerCase().includes(q));
                  }).length === 0 && (
                    <div className="mc-empty">
                      <i className="bi bi-envelope" />
                      <div className="mc-empty-text">No inquiries found.</div>
                    </div>
                  )}
                  {!loading && contacts.filter(c=>{
                    const q=inqSearch.toLowerCase();
                    return !q||[c.first_name,c.last_name,c.email,c.phone,c.message].some(f=>f?.toLowerCase().includes(q));
                  }).map(c => (
                    <InquiryCard
                      key={c.id}
                      contact={c}
                      isRead={readSet.has(c.id)}
                      onRead={handleReadInquiry}
                      onDelete={deleteContact}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── REPORTS ── */}
          {isAdmin && view === 'reports' && (
            <motion.div key="rep" className="view-wrap" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3}}>
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

          {/* ── GALLERY ── */}
          {view === 'gallery' && (
            <motion.div key="gal" className="view-wrap" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3}}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 32 }}>
                <Card className="admin-card-style" title="Upload New Image">
                  <div style={{ padding: '8px 0' }}>
                    <Upload.Dragger
                      customRequest={handleGalleryUpload}
                      showUploadList={false}
                      accept="image/*"
                      disabled={uploadingGallery}
                    >
                      <p className="ant-upload-drag-icon" style={{ fontSize: '2.5rem', color: 'var(--primary-blue)', marginBottom: 8 }}>
                        {uploadingGallery ? <Spin /> : <i className="bi bi-cloud-arrow-up" />}
                      </p>
                      <p className="ant-upload-text" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {uploadingGallery ? 'Uploading and compressing image...' : 'Click or drag image to this area to upload'}
                      </p>
                      <p className="ant-upload-hint" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Supports JPG, JPEG, PNG and WEBP. Maximum file size: 3 MB. Large images are automatically optimized.
                      </p>
                    </Upload.Dragger>
                  </div>
                </Card>

                <Card className="admin-card-style" title={`Gallery Images (${galleryList.length})`}>
                  {galleryList.length === 0 ? (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <i className="bi bi-images" style={{ fontSize: '3rem', display: 'block', marginBottom: 12, opacity: 0.3 }} />
                      No uploaded gallery images found. Default asset images are being displayed to guests.
                    </div>
                  ) : (
                    <div className="gallery-grid">
                      {galleryList.map(img => {
                        const url = img.image_url;
                        const resolvedUrl = url.startsWith('/uploads/') ? `${API_BASE}${url}` : url;
                        return (
                          <div key={img.id} className="gallery-item">
                            <img src={resolvedUrl} alt="Gallery Item" />
                            {/* Floating delete icon — appears on hover */}
                            <Popconfirm
                              title="Delete this image?"
                              description="This will permanently remove it from the guest gallery."
                              onConfirm={() => handleDeleteGallery(img.id)}
                              okText="Yes, Delete"
                              cancelText="Cancel"
                              okButtonProps={{ danger: true }}
                            >
                              <button className="gallery-delete-btn" title="Delete image">
                                <i className="bi bi-trash" />
                              </button>
                            </Popconfirm>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
            </motion.div>
          )}

          {/* ── USERS ── */}
          {isAdmin && view === 'users' && (
            <motion.div key="usr" className="view-wrap" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.3}}>
              {/* Desktop table */}
              {!isMobile && (
                <Card className="admin-card-style sv-table-only">
                  <Table dataSource={users} rowKey="id" pagination={false} size="middle"
                    className="sv-admin-table"
                    columns={[
                      { title:'ID',       dataIndex:'id',       key:'id', width:60 },
                      { title:'Username', dataIndex:'username', key:'u' },
                      { title:'Role',     dataIndex:'role',     key:'r' },
                      { title:'Status',   dataIndex:'status',   key:'s',
                        render: s => {
                          const isActive = s?.toLowerCase() === 'active';
                          return <Tag color={isActive ? '#1C1917' : '#A8A29E'}>{s}</Tag>;
                        }
                      },
                      { title:'Last Login', dataIndex:'last_login', key:'ll',
                        render: v => v ? dayjs(v).format('DD MMM YYYY HH:mm') : '—'
                      },
                      { title:'Actions',  key:'act', render:(_,r)=>(
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          <Button size="small" className="user-action-btn" onClick={() => {
                            setEditUserTarget(r);
                            editUserForm.setFieldsValue({ username: r.username, role: r.role });
                            setEditUserOpen(true);
                          }}><i className="bi bi-pencil" /></Button>
                          <Button size="small" className="user-action-btn" onClick={() => {
                            setResetPwdTarget(r);
                            resetPwdForm.resetFields();
                            setResetPwdOpen(true);
                          }}><i className="bi bi-key" /></Button>
                          <Button
                            size="small"
                            className="user-action-btn"
                            danger={r.status?.toLowerCase() === 'active'}
                            onClick={() => {
                              setLoading(true);
                              const nextStatus = r.status?.toLowerCase() === 'active' ? 'Disabled' : 'Active';
                              api.put(`/api/users/${r.id}/status`, { status: nextStatus })
                                .then(res => {
                                  if (res.data.status === 'success') { message.success('Status updated.'); fetchData(); }
                                  else message.error(res.data.message || 'Failed.');
                                })
                                .catch(err => message.error(err.response?.data?.message || 'Error.'))
                                .finally(() => setLoading(false));
                            }}
                          >{r.status?.toLowerCase() === 'active' ? 'Disable' : 'Enable'}</Button>
                          <Popconfirm
                            title="Delete this user?"
                            description="This action cannot be undone."
                            okText="Yes, Delete" cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => {
                              setLoading(true);
                              api.delete(`/api/users/${r.id}`)
                                .then(res => {
                                  if (res.data.status === 'success') { message.success('User deleted.'); fetchData(); }
                                  else message.error(res.data.message || 'Failed to delete.');
                                })
                                .catch(err => message.error(err.response?.data?.message || 'Error deleting.'))
                                .finally(() => setLoading(false));
                            }}
                          >
                            <Button size="small" danger className="user-action-btn"><i className="bi bi-trash" /></Button>
                          </Popconfirm>
                        </div>
                      )}
                    ]}
                  />
                </Card>
              )}

              {/* Mobile cards */}
              {isMobile && (
                <div className="mc-card-list mc-mobile-only">
                  {loading && <div className="center-spin"><Spin /></div>}
                  {!loading && users.length === 0 && (
                    <div className="mc-empty">
                      <i className="bi bi-people" />
                      <div className="mc-empty-text">No users found.</div>
                    </div>
                  )}
                  {!loading && users.map(u => (
                    <UserCard
                      key={u.id}
                      user={u}
                      loading={loading}
                      onEdit={r => {
                        setEditUserTarget(r);
                        editUserForm.setFieldsValue({ username: r.username, role: r.role });
                        setEditUserOpen(true);
                      }}
                      onResetPwd={r => {
                        setResetPwdTarget(r);
                        resetPwdForm.resetFields();
                        setResetPwdOpen(true);
                      }}
                      onToggleStatus={r => {
                        setLoading(true);
                        const nextStatus = r.status?.toLowerCase() === 'active' ? 'Disabled' : 'Active';
                        api.put(`/api/users/${r.id}/status`, { status: nextStatus })
                          .then(res => {
                            if (res.data.status === 'success') { message.success('Status updated.'); fetchData(); }
                            else message.error(res.data.message || 'Failed.');
                          })
                          .catch(err => message.error(err.response?.data?.message || 'Error.'))
                          .finally(() => setLoading(false));
                      }}
                      onDelete={id => {
                        setLoading(true);
                        api.delete(`/api/users/${id}`)
                          .then(res => {
                            if (res.data.status === 'success') { message.success('User deleted.'); fetchData(); }
                            else message.error(res.data.message || 'Failed to delete.');
                          })
                          .catch(err => message.error(err.response?.data?.message || 'Error deleting.'))
                          .finally(() => setLoading(false));
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── SETTINGS ── */}
          {isAdmin && view === 'settings' && (
            <motion.div 
            key="set"
            className="view-wrap"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{
              y: -6,
              scale: 1.01,
            }}>
              <Card className="admin-card-style" style={{maxWidth:560}}>
                <Form layout="vertical" form={settingsForm}
                  initialValues={{ resortName:'Shanvilla Resort', phone:'0742682580', email:'info@shanvilla.com', checkinTime:'14:00', checkoutTime:'10:00', cancellationPolicy:'Free cancellation up to 24 hours before check-in.' }}
                  onFinish={async (values) => {
                    try {
                      setLoading(true);
                      const res = await api.post('/api/settings', values);
                      if (res.data.status === 'success') {
                        message.success('Settings saved successfully.');
                      } else {
                        message.error(res.data.message || 'Failed to save settings.');
                      }
                    } catch (err) {
                      if (import.meta.env.DEV) console.error('[saveSettings]', err);
                      message.error('An error occurred while saving settings.');
                    } finally {
                      setLoading(false);
                    }
                  }}>
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
                  <Button type="primary" htmlType="submit" className="btn-danger" style={{height:44}}>Save Settings</Button>
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
                className={!a.danger ? 'btn-blue' : ''}
                onClick={()=>changeStatus(selected.id,a.key)}>{a.label}</Button>
            ))}
          </div>
        )}>
        {selected && (
          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            <div>
              <h3 style={{margin:0,fontFamily:'Playfair Display,serif',color:'var(--text-main)',fontSize:'1.2rem'}}>{selected.guest_name}</h3>
              <span style={{fontSize:'0.82rem',color:'var(--text-muted)'}}>Ref: <strong style={{color:'var(--primary-blue)'}}>{selected.booking_reference}</strong></span>
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
                  <span style={{fontSize:'0.73rem',color:'var(--text-muted)',textTransform:'uppercase',fontWeight:600}}>{lbl}</span>
                  <p style={{margin:'3px 0 0',fontSize:'0.92rem',color:'var(--text-main)'}}>{val}</p>
                </div>
              ))}
            </div>

            <div>
              <span style={{fontSize:'0.73rem',color:'var(--text-muted)',textTransform:'uppercase',fontWeight:600}}>Admin Notes</span>
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
                <span style={{fontSize:'0.73rem',color:'var(--text-muted)',textTransform:'uppercase',fontWeight:600,display:'block',marginBottom:10}}>
                  Audit Trail
                </span>
                <Timeline items={history.map(h=>({
                  color: STATUS_MAP[h.new_status?.toLowerCase()]?.color||'#64748B',
                  children: (
                    <div>
                      <span>→ <strong>{fmt(h.new_status)}</strong></span>
                      <div style={{fontSize:'0.76rem',color:'var(--text-muted)',marginTop:2}}>
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

      {/* ── EDIT BOOKING MODAL ── */}
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
          <Button type="primary" htmlType="submit" block className="btn-blue" style={{height:44}}>Save Changes</Button>
        </Form>
      </Modal>

      {/* ── ROOM EDIT MODAL ── */}
      <Modal
        title="Edit Room Details"
        open={!!editRoom}
        onCancel={()=>setEditRoom(null)}
        footer={null}
        destroyOnClose
        width={640}
        className="room-edit-modal"
      >
        {editRoom && (
          <div className="room-edit-modal-body">
            <Form layout="vertical" form={roomForm} onFinish={handleSaveRoomEdit}>
              <Form.Item label="Room Type Name" name="name" rules={[{required:true, message: 'Please enter the room name'}]}><Input /></Form.Item>

              {/* Image preview — compact thumbnail */}
              {roomImagePreview && (
                <div className="room-image-preview-container">
                  <img src={roomImagePreview} alt="Room Preview" className="room-image-preview" />
                  <div className="room-image-preview-label">
                    <i className="bi bi-image" style={{ marginRight: 6, color: 'var(--primary-blue)' }} />
                    Current image preview
                  </div>
                </div>
              )}

              {/* Upload area */}
              <div className="room-upload-section">
                <Upload.Dragger
                  customRequest={handleImageUpload}
                  showUploadList={false}
                  accept="image/*"
                  disabled={uploadingImage}
                  style={{ marginBottom: 12 }}
                >
                  <div style={{ padding: '12px 0' }}>
                    {uploadingImage ? (
                      <div>
                        <Spin style={{ marginBottom: 8 }} />
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>Uploading... {uploadProgress}%</p>
                        <Progress percent={uploadProgress} size="small" showInfo={false} strokeColor="var(--primary-blue)" style={{ padding: '0 32px', marginTop: 4 }} />
                      </div>
                    ) : (
                      <>
                        <i className="bi bi-cloud-arrow-up" style={{ fontSize: '1.8rem', color: 'var(--primary-blue)' }} />
                        <p style={{ margin: '4px 0 0', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          Click or drag image here to upload
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          JPG, PNG, WEBP · Max 3 MB · Mobile camera supported
                        </p>
                      </>
                    )}
                  </div>
                </Upload.Dragger>

                <Form.Item label="Or enter image key / URL manually" name="image_url" rules={[{required:true, message: 'Please provide an image'}]} style={{ margin: 0 }}>
                  <Input placeholder="e.g. pic5, room1, or https://..." onChange={(e) => {
                    const val = e.target.value;
                    const previewUrl = IMAGE_MAP[val] || (val?.startsWith('/uploads/') ? `${API_BASE}${val}` : val);
                    setRoomImagePreview(previewUrl);
                  }} />
                </Form.Item>
              </div>

              <Form.Item label="Starting Price (KES)" name="price" rules={[{required:true, message: 'Please enter the starting price'}]}><Input type="number" /></Form.Item>
              <Form.Item label="Description" name="description" rules={[{required:true, message: 'Please enter the description'}]}><Input.TextArea rows={3} /></Form.Item>
              
              <h4 style={{ margin: '20px 0 12px', fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>
                Occupancy Pricing Plans (KES)
              </h4>

              {editRoom?.id === 3 || editRoom?.name?.toLowerCase().includes('superior') ? (
                <>
                  <div style={{ background: 'rgba(15,143,70,0.04)', border: '1px solid rgba(15,143,70,0.2)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-green)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="bi bi-people-fill" /> Double Occupancy (2 Guests)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <Form.Item label="B&B (2 Guests)" name="double_bb" rules={[{required:true}]}><Input type="number" /></Form.Item>
                      <Form.Item label="Half Board (2 Guests)" name="double_hb" rules={[{required:true}]}><Input type="number" /></Form.Item>
                      <Form.Item label="Full Board (2 Guests)" name="double_fb" rules={[{required:true}]}><Input type="number" /></Form.Item>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(235,123,19,0.04)', border: '1px solid rgba(235,123,19,0.2)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#D97706', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="bi bi-person-fill-add" /> Triple Occupancy (3 Guests)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <Form.Item label="B&B (3 Guests)" name="triple_bb" rules={[{required:true}]}><Input type="number" /></Form.Item>
                      <Form.Item label="Half Board (3 Guests)" name="triple_hb" rules={[{required:true}]}><Input type="number" /></Form.Item>
                      <Form.Item label="Full Board (3 Guests)" name="triple_fb" rules={[{required:true}]}><Input type="number" /></Form.Item>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ background: 'rgba(14,93,158,0.04)', border: '1px solid rgba(14,93,158,0.2)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-blue)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="bi bi-person-fill" /> Single Occupancy (1 Guest)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <Form.Item label="B&B (1 Guest)" name="single_bb" rules={[{required:true}]}><Input type="number" /></Form.Item>
                      <Form.Item label="Half Board (1 Guest)" name="single_hb" rules={[{required:true}]}><Input type="number" /></Form.Item>
                      <Form.Item label="Full Board (1 Guest)" name="single_fb" rules={[{required:true}]}><Input type="number" /></Form.Item>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(15,143,70,0.04)', border: '1px solid rgba(15,143,70,0.2)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-green)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="bi bi-people-fill" /> Double Occupancy (2 Guests)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <Form.Item label="B&B (2 Guests)" name="double_bb" rules={[{required:true}]}><Input type="number" /></Form.Item>
                      <Form.Item label="Half Board (2 Guests)" name="double_hb" rules={[{required:true}]}><Input type="number" /></Form.Item>
                      <Form.Item label="Full Board (2 Guests)" name="double_fb" rules={[{required:true}]}><Input type="number" /></Form.Item>
                    </div>
                  </div>
                </>
              )}
              
              <Form.Item label="Room Amenities" name="selected_amenities">
                <Select mode="multiple" placeholder="Select amenities" style={{ width: '100%' }} maxTagCount="responsive">
                  {COMMON_AMENITIES.map(a => (
                    <Select.Option key={a.value} value={a.value}>{a.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <div className="room-edit-modal-footer">
                <Button onClick={() => setEditRoom(null)} style={{ flex: 1, height: 44 }}>Cancel</Button>
                <Button type="primary" htmlType="submit" className="btn-blue" style={{ flex: 2, height: 44 }}>Update Room Details</Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* ── INQUIRY DETAIL MODAL ── */}
      <Modal 
        title="Inquiry Details" 
        open={Boolean(viewInquiry)} 
        onCancel={() => setViewInquiry(null)}
        footer={[
          <Button key="close" type="primary" className="btn-blue" onClick={() => setViewInquiry(null)}>
            Close
          </Button>
        ]} 
        destroyOnClose
        width={500}
      >
        {viewInquiry && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 6 }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>GUEST NAME</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1E293B' }}>
                {viewInquiry.first_name} {viewInquiry.last_name}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>EMAIL</div>
                <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                  <a href={`mailto:${viewInquiry.email}`} style={{ color: '#2563EB' }}>{viewInquiry.email}</a>
                </div>
              </div>
              {viewInquiry.phone && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>PHONE</div>
                  <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                    <a href={`tel:${viewInquiry.phone}`} style={{ color: '#2563EB' }}>{viewInquiry.phone}</a>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginBottom: 4 }}>FULL MESSAGE</div>
              <div style={{ 
                background: '#F8FAFC', 
                border: '1px solid #E2E8F0', 
                padding: '12px 14px', 
                borderRadius: 8, 
                fontSize: '0.92rem', 
                color: '#334155',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5
              }}>
                {viewInquiry.message || <em>No message content.</em>}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── CREATE USER MODAL ── */}
      <Modal title="Add Staff Account" open={userOpen} onCancel={()=>{ setUserOpen(false); userForm.resetFields(); }} footer={null} destroyOnClose width={440}>
        <Form layout="vertical" form={userForm} onFinish={createUser}>
          <Form.Item label="Username" name="username" rules={[{required:true, message:'Username is required'}]}><Input size="large" placeholder="Enter username" /></Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Password is required' },
              {
                validator(_, value) {
                  if (!value) return Promise.resolve();
                  const minLen = value.length >= 12;
                  const upper = /[A-Z]/.test(value);
                  const lower = /[a-z]/.test(value);
                  const num = /[0-9]/.test(value);
                  const spec = /[^A-Za-z0-9]/.test(value);
                  if (minLen && upper && lower && num && spec) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Password does not satisfy all policy requirements below'));
                }
              }
            ]}
          >
            <Input.Password className="better-pwd-input" size="large" placeholder="Enter a secure password" />
          </Form.Item>

          {/* Live Password Policy Requirements Checklist */}
          <div className="pwd-policy-container">
            <div className="pwd-policy-title">Password Requirements</div>
            <div className="pwd-policy-list">
              <div className={`pwd-policy-item ${typedPassword.length >= 12 ? 'pwd-policy-item--met' : ''}`}>
                <i className={`bi ${typedPassword.length >= 12 ? 'bi-check-circle-fill' : 'bi-circle'}`} />
                <span>At least 12 characters ({typedPassword.length}/12)</span>
              </div>
              <div className={`pwd-policy-item ${/[A-Z]/.test(typedPassword) && /[a-z]/.test(typedPassword) ? 'pwd-policy-item--met' : ''}`}>
                <i className={`bi ${/[A-Z]/.test(typedPassword) && /[a-z]/.test(typedPassword) ? 'bi-check-circle-fill' : 'bi-circle'}`} />
                <span>Uppercase &amp; lowercase letters (A-Z, a-z)</span>
              </div>
              <div className={`pwd-policy-item ${/[0-9]/.test(typedPassword) ? 'pwd-policy-item--met' : ''}`}>
                <i className={`bi ${/[0-9]/.test(typedPassword) ? 'bi-check-circle-fill' : 'bi-circle'}`} />
                <span>At least one number (0-9)</span>
              </div>
              <div className={`pwd-policy-item ${/[^A-Za-z0-9]/.test(typedPassword) ? 'pwd-policy-item--met' : ''}`}>
                <i className={`bi ${/[^A-Za-z0-9]/.test(typedPassword) ? 'bi-check-circle-fill' : 'bi-circle'}`} />
                <span>At least one special character (!@#$%^&*)</span>
              </div>
            </div>
          </div>

          <Form.Item label="Role" name="role" rules={[{required:true, message:'Please select a role'}]}>
            <Select size="large" placeholder="Select role">
              <Select.Option value="Admin">Admin</Select.Option>
              <Select.Option value="Receptionist">Receptionist</Select.Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block className="btn-blue" style={{height:44, marginTop: 8}}>Register Account</Button>
        </Form>
      </Modal>

      {/* ── EDIT USER MODAL ── */}
      <Modal
        title={`Edit User — ${editUserTarget?.username}`}
        open={editUserOpen}
        onCancel={() => { setEditUserOpen(false); setEditUserTarget(null); editUserForm.resetFields(); }}
        footer={null}
        destroyOnClose
        width={420}
      >
        <Form layout="vertical" form={editUserForm} onFinish={async (vals) => {
          try {
            setLoading(true);
            const res = await api.put(`/api/users/${editUserTarget.id}`, {
              username: vals.username,
              role: vals.role,
            });
            if (res.data.status === 'success') {
              message.success('User updated.');
              setEditUserOpen(false);
              setEditUserTarget(null);
              editUserForm.resetFields();
              fetchData();
            } else {
              message.error(res.data.message || 'Failed to update user.');
            }
          } catch (err) {
            message.error(err.response?.data?.message || 'Error updating user.');
          } finally {
            setLoading(false);
          }
        }}>
          <Form.Item label="Username" name="username" rules={[{required:true, message:'Username is required'}]}>
            <Input />
          </Form.Item>
          <Form.Item label="Role" name="role" rules={[{required:true}]}>
            <Select>
              <Select.Option value="Admin">Admin</Select.Option>
              <Select.Option value="Receptionist">Receptionist</Select.Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block className="btn-blue" style={{height:44}}>Save Changes</Button>
        </Form>
      </Modal>

      {/* ── RESET PASSWORD MODAL ── */}
      <Modal
        title={`Reset Password — ${resetPwdTarget?.username}`}
        open={resetPwdOpen}
        onCancel={() => { setResetPwdOpen(false); setResetPwdTarget(null); resetPwdForm.resetFields(); }}
        footer={null}
        destroyOnClose
        width={400}
      >
        <Form layout="vertical" form={resetPwdForm} onFinish={async (vals) => {
          try {
            setLoading(true);
            const res = await api.put(`/api/users/${resetPwdTarget.id}/password`, {
              password: vals.password,
            });
            if (res.data.status === 'success') {
              message.success('Password reset successfully.');
              setResetPwdOpen(false);
              setResetPwdTarget(null);
              resetPwdForm.resetFields();
            } else {
              message.error(res.data.message || 'Failed to reset password.');
            }
          } catch (err) {
            message.error(err.response?.data?.message || 'Error resetting password.');
          } finally {
            setLoading(false);
          }
        }}>
          <Form.Item label="New Password" name="password" rules={[{required:true, min:6, message:'Minimum 6 characters'}]}>
            <Input.Password className="better-pwd-input" size="large" placeholder="Enter new password" />
          </Form.Item>
          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={['password']}
            rules={[{required:true}, ({getFieldValue}) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve();
                return Promise.reject(new Error('Passwords do not match!'));
              }
            })]}
          >
            <Input.Password className="better-pwd-input" size="large" placeholder="Confirm new password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block className="btn-blue" style={{height:44}}>Reset Password</Button>
        </Form>
      </Modal>

    </div>
  );
};

export default AdminPage;
