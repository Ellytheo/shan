import { Popconfirm } from 'antd';
import dayjs from 'dayjs';
import './MobileCards.css';

/* ───────────────────────────────────────────────────────────
   Status badge colours
   ─────────────────────────────────────────────────────────── */
const STATUS_COLORS = {
  pending:      { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  confirmed:    { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
  checked_in:   { bg: '#DCFCE7', color: '#14532D', border: '#86EFAC' },
  checked_out:  { bg: '#F1F5F9', color: '#334155', border: '#CBD5E1' },
  cancelled:    { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
  no_show:      { bg: '#FFF7ED', color: '#9A3412', border: '#FDBA74' },
};
const STATUS_LABELS = {
  pending: 'Pending', confirmed: 'Confirmed', checked_in: 'Checked In',
  checked_out: 'Checked Out', cancelled: 'Cancelled', no_show: 'No Show',
};
const ACTION_COLORS = {
  LOGIN:         { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  LOGOUT:        { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
  CREATE:        { bg: '#F0FDF4', color: '#15803D', border: '#86EFAC' },
  UPDATE:        { bg: '#FFF7ED', color: '#C2410C', border: '#FDBA74' },
  DELETE:        { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
  STATUS_CHANGE: { bg: '#FDF4FF', color: '#7E22CE', border: '#D8B4FE' },
};

/* ───── tiny reusable atoms ───── */
function StatusBadge({ status }) {
  const key = status?.toLowerCase() || 'pending';
  const s = STATUS_COLORS[key] || STATUS_COLORS.pending;
  return (
    <span className="mc-status-badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <span className="mc-status-dot" style={{ background: s.color }} />
      {STATUS_LABELS[key] || status}
    </span>
  );
}

function ActionBadge({ action }) {
  const key = action?.toUpperCase() || '';
  const s = ACTION_COLORS[key] || { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' };
  return (
    <span className="mc-action-badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {action || '—'}
    </span>
  );
}

function CardField({ label, value, accent }) {
  return (
    <div className="mc-field">
      <span className="mc-field-label">{label}</span>
      <span className="mc-field-value" style={accent ? { color: 'var(--primary-blue)' } : {}}>
        {value || '—'}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BOOKING CARD
   ═══════════════════════════════════════════════════ */
export function BookingCard({ booking, onView, onEdit, onStatusChange, actLoading, statusActions }) {
  const acts = statusActions[booking.status?.toLowerCase()] || [];
  return (
    <div className="mc-card" data-status={booking.status?.toLowerCase()}>
      <div className="mc-card-stripe" data-status={booking.status?.toLowerCase()} />
      <div className="mc-card-head">
        <div>
          <div className="mc-card-ref">{booking.booking_reference || `#${booking.id}`}</div>
          <div className="mc-card-name">{booking.guest_name}</div>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <div className="mc-card-grid">
        <CardField label="Room"      value={booking.room_name} />
        <CardField label="Guests"    value={booking.guests ? `${booking.guests} pax` : '—'} />
        <CardField label="Check-in"  value={booking.checkin_date?.split('T')[0]} accent />
        <CardField label="Check-out" value={booking.checkout_date?.split('T')[0]} accent />
        <CardField label="Phone"     value={booking.phone} />
        <CardField label="Source"    value={booking.created_by || 'Website'} />
      </div>
      <div className="mc-card-actions">
        <button className="mc-btn mc-btn--muted"    onClick={() => onView(booking)}>
          <i className="bi bi-eye" /> Details
        </button>
        <button className="mc-btn mc-btn--primary"  onClick={() => onEdit(booking)}>
          <i className="bi bi-pencil" /> Edit
        </button>
        {acts.map(a => (
          <button
            key={a.key}
            className={`mc-btn ${a.danger ? 'mc-btn--danger' : 'mc-btn--success'}`}
            disabled={actLoading === booking.id}
            onClick={() => onStatusChange(booking.id, a.key)}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   USER CARD
   ═══════════════════════════════════════════════════ */
export function UserCard({ user, onEdit, onResetPwd, onToggleStatus, onDelete, loading }) {
  const isActive = user.status?.toLowerCase() === 'active';
  const initials = (user.username || '?').slice(0, 2).toUpperCase();
  return (
    <div className="mc-card">
      <div className="mc-card-stripe" style={{ background: isActive ? '#10B981' : '#EF4444' }} />
      <div className="mc-card-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="mc-avatar" style={{ background: isActive ? 'linear-gradient(135deg,#4D8B6D,#2C5E43)' : 'linear-gradient(135deg,#94A3B8,#64748B)' }}>
            {initials}
          </div>
          <div>
            <div className="mc-card-name" style={{ marginBottom: 2 }}>{user.username}</div>
            <div style={{ fontSize: '0.75rem', color: '#78716C' }}>ID: {user.id} · {user.role}</div>
          </div>
        </div>
        <span className="mc-status-badge" style={{
          background: isActive ? '#D1FAE5' : '#FEE2E2',
          color: isActive ? '#065F46' : '#991B1B',
          border: `1px solid ${isActive ? '#6EE7B7' : '#FCA5A5'}`,
        }}>
          <span className="mc-status-dot" style={{ background: isActive ? '#10B981' : '#EF4444' }} />
          {user.status || 'Active'}
        </span>
      </div>
      <div className="mc-card-grid" style={{ gridTemplateColumns: '1fr' }}>
        <CardField label="Last Login" value={user.last_login ? dayjs(user.last_login).format('DD MMM YYYY HH:mm') : 'Never'} />
      </div>
      <div className="mc-card-actions">
        <button className="mc-btn mc-btn--muted"    onClick={() => onEdit(user)}>
          <i className="bi bi-pencil" /> Edit
        </button>
        <button className="mc-btn mc-btn--primary"  onClick={() => onResetPwd(user)}>
          <i className="bi bi-key" /> Pwd
        </button>
        <button
          className={`mc-btn ${isActive ? 'mc-btn--danger' : 'mc-btn--success'}`}
          disabled={loading}
          onClick={() => onToggleStatus(user)}
        >
          {isActive ? 'Disable' : 'Enable'}
        </button>
        <Popconfirm
          title="Delete this user?"
          description="This action cannot be undone."
          okText="Yes, Delete" cancelText="Cancel"
          okButtonProps={{ danger: true }}
          onConfirm={() => onDelete(user.id)}
        >
          <button className="mc-btn mc-btn--danger" disabled={loading}>
            <i className="bi bi-trash" />
          </button>
        </Popconfirm>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   AUDIT LOG CARD
   ═══════════════════════════════════════════════════ */
export function AuditLogCard({ log }) {
  return (
    <div className="mc-card mc-card--compact">
      <div className="mc-card-head" style={{ alignItems: 'flex-start' }}>
        <div>
          <ActionBadge action={log.action} />
          <div className="mc-card-name" style={{ marginTop: 6, fontSize: '0.9rem' }}>
            {log.target_name || log.target_type || '—'}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '0.75rem', color: '#1C1917', fontWeight: 700 }}>
            {log.admin_username || '—'}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#A8A29E', marginTop: 2 }}>
            {log.created_at ? dayjs(log.created_at).format('DD MMM YY HH:mm') : '—'}
          </div>
        </div>
      </div>
      <div className="mc-card-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 8 }}>
        <CardField label="Target" value={log.target_type} />
      </div>
      {log.description && (
        <div className="mc-log-desc">{log.description}</div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   INQUIRY CARD
   ═══════════════════════════════════════════════════ */
export function InquiryCard({ contact, isRead, onRead, onDelete }) {
  return (
    <div className={`mc-card ${!isRead ? 'mc-card--unread' : ''}`}>
      {!isRead && <div className="mc-card-stripe" style={{ background: '#F59E0B' }} />}
      <div className="mc-card-head">
        <div>
          <div className="mc-card-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {contact.first_name} {contact.last_name}
            {!isRead && <span className="mc-unread-dot" />}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#78716C', marginTop: 2 }}>{contact.email}</div>
        </div>
        <span className="mc-status-badge" style={{
          background: isRead ? '#D1FAE5' : '#FEF3C7',
          color:      isRead ? '#065F46' : '#92400E',
          border:     `1px solid ${isRead ? '#6EE7B7' : '#FDE68A'}`,
          whiteSpace: 'nowrap',
        }}>
          {isRead ? 'Read' : 'Unread'}
        </span>
      </div>
      {contact.phone && (
        <div style={{ fontSize: '0.82rem', color: '#64748B', margin: '6px 0 0' }}>
          <i className="bi bi-telephone" style={{ marginRight: 5 }} />{contact.phone}
        </div>
      )}
      {contact.message && (
        <div className="mc-message-preview">{contact.message}</div>
      )}
      <div className="mc-card-actions">
        <button className="mc-btn mc-btn--muted" onClick={() => onRead(contact)}>
          <i className="bi bi-eye" /> Read
        </button>
        <Popconfirm title="Delete this inquiry?" onConfirm={() => onDelete(contact.id)} okText="Yes" cancelText="No" placement="top">
          <button className="mc-btn mc-btn--danger">
            <i className="bi bi-trash" /> Delete
          </button>
        </Popconfirm>
      </div>
    </div>
  );
}
