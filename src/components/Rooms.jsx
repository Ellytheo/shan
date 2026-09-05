import { useState, useRef, useEffect } from 'react';
import { Modal } from 'antd';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useRoomAvailability } from '../context/RoomAvailabilityContext';
import pic5 from '../images/pic5.jpg';
import pic15 from '../images/pic15.jpg';
import room1 from '../images/standard.webp';
import room2 from '../images/vip.webp';
import vipRoom from '../images/vip.jpg';

const IMAGE_MAP = {
  pic5: pic5,
  pic15: pic15,
  room1: room1,
  room2: room2,
  vip: vipRoom,
};

/* ─────────────────────────── DATA ─────────────────────────── */

const ROOMS = [
  {
    id: 1,
    name: 'Standard Room',
    available: 7,
    startingPrice: 4000,
    description:
      'A well-appointed retreat offering modern comforts and elegant simplicity — the ideal base for both leisure and business.',
    image: pic5,
    amenities: [
      { icon: 'bi-thermometer-snow', label: 'Air Conditioning' },
      { icon: 'bi-door-closed', label: 'Private Bathroom' },
      { icon: 'bi-tv', label: 'Flat Screen TV' },
      { icon: 'bi-wifi', label: 'High-Speed WiFi' },
      { icon: 'bi-briefcase', label: 'Work Desk' },
    ],
    pricing: {
      single: { bedBreakfast: 4000, halfBoard: 5500, fullBoard: 6500 },
      double: { bedBreakfast: 4700, halfBoard: 7200, fullBoard: 9500 },
    },
  },
  {
    id: 2,
    name: 'Deluxe Room',
    available: 12,
    startingPrice: 5200,
    description:
      'Elevated living with a private balcony and resort panoramas. Perfect for those who seek a little more indulgence.',
    image: pic15,
    amenities: [
      { icon: 'bi-door-open', label: 'Balcony' },
      { icon: 'bi-thermometer-snow', label: 'Air Conditioning' },
      { icon: 'bi-display', label: 'Smart TV' },
      { icon: 'bi-wifi', label: 'High-Speed WiFi' },
      { icon: 'bi-bell', label: 'Room Service' },
    ],
    pricing: {
      single: { bedBreakfast: 5200, halfBoard: 6200, fullBoard: 7500 },
      double: { bedBreakfast: 6000, halfBoard: 8500, fullBoard: 10500 },
    },
  },
  {
    id: 3,
    name: 'Superior Twin Room',
    available: 1,
    startingPrice: 8500,
    description:
      'Spacious twin-bed luxury with smart amenities — crafted for companions, colleagues, or families seeking shared comfort.',
    image: room1,
    amenities: [
      { icon: 'bi-people', label: 'Twin Beds' },
      { icon: 'bi-display', label: 'Smart TV' },
      { icon: 'bi-wifi', label: 'High-Speed WiFi' },
      { icon: 'bi-snow2', label: 'Mini Fridge' },
      { icon: 'bi-bell', label: 'Room Service' },
    ],
    pricing: {
      double: { bedBreakfast: 8500, halfBoard: 11000, fullBoard: 13000 },
      triple: { bedBreakfast: 9200, halfBoard: 11700, fullBoard: 13700 },
    },
  },
  {
    id: 4,
    name: 'Executive Room',
    available: 2,
    startingPrice: 7000,
    description:
      'An exceptional sanctuary featuring luxury bedding, a premium mini bar, and an array of curated amenities for the discerning traveller.',
    image: room2,
    amenities: [
      { icon: 'bi-stars', label: 'Luxury Bedding' },
      { icon: 'bi-cup-straw', label: 'Mini Bar' },
      { icon: 'bi-display', label: 'Smart TV' },
      { icon: 'bi-reception-4', label: 'Premium WiFi' },
      { icon: 'bi-briefcase', label: 'Work Desk' },
    ],
    pricing: {
      single: { bedBreakfast: 7000, halfBoard: 8500, fullBoard: 9500 },
      double: { bedBreakfast: 7700, halfBoard: 10000, fullBoard: 12000 },
    },
  },
  {
    id: 5,
    name: 'VIP Room',
    available: 1,
    startingPrice: 8000,
    description:
      'The ultimate in luxury and style. Offers an expansive living layout, premium finishes, and top-tier guest privileges.',
    image: vipRoom,
    amenities: [
      { icon: 'bi-stars', label: 'Luxury Bedding' },
      { icon: 'bi-cup-straw', label: 'Mini Bar' },
      { icon: 'bi-display', label: 'Smart TV' },
      { icon: 'bi-reception-4', label: 'Premium WiFi' },
      { icon: 'bi-door-open', label: 'Balcony' },
      { icon: 'bi-bell', label: 'Room Service' },
      { icon: 'bi-thermometer-snow', label: 'Air Conditioning' },
    ],
    pricing: {
      single: { bedBreakfast: 8000, halfBoard: 9500, fullBoard: 10500 },
      double: { bedBreakfast: 8700, halfBoard: 11000, fullBoard: 13500 },
    },
  },
];

const PLAN_LABELS = {
  bedBreakfast: 'Bed & Breakfast',
  halfBoard: 'Half Board',
  fullBoard: 'Full Board',
};

/* ─────────────────────────── ANIMATION VARIANTS ─────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 48 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.88,
    transition: { duration: 0.35, ease: 'easeIn' },
  },
};

/* ─────────────────────────── AVAILABILITY BADGE ─────────────────────────── */

const AvailabilityBadge = ({ count, loading }) => {
  if (loading) {
    return (
      <span style={{ ...styles.badge, background: 'rgba(180,180,180,0.12)', borderColor: 'rgba(180,180,180,0.2)', color: '#aaa', letterSpacing: 0 }}>
        <i className="bi bi-hourglass-split" style={{ marginRight: 5, animation: 'spin 1.2s linear infinite' }} />
        Checking…
      </span>
    );
  }
  if (count <= 0) {
    return (
      <span style={{
        ...styles.badge,
        background: 'linear-gradient(135deg, #FF1744 0%, #D50000 100%)',
        borderColor: '#FF5252',
        color: '#FFFFFF',
        fontWeight: 700,
        boxShadow: '0 4px 14px rgba(213, 0, 0, 0.45)',
      }}>
        <i className="bi bi-x-circle-fill" style={{ marginRight: 5, color: '#FFFFFF' }} />
        No Rooms Available
      </span>
    );
  }
  return (
    <span style={styles.badge}>
      <i className="bi bi-check-circle-fill" style={{ marginRight: 5, color: '#f80808' }} />
      {count} {count === 1 ? 'Room' : 'Rooms'} Available
    </span>
  );
};

/* ─────────────────────────── ROOM CARD ─────────────────────────── */

const RoomCard = ({ room, onViewDetails, liveCount, loading }) => {
  const soldOut = !loading && liveCount <= 0;
  return (
    <motion.div
      style={styles.swiperCard}
      whileHover={{ y: -8, boxShadow: '0 32px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(212,175,55,0.25)' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      role="article"
      aria-label={room.name}
    >
      {/* Image */}
      <div style={{ overflow: 'hidden', borderRadius: '20px 20px 0 0', position: 'relative', height: 220 }}>
        <motion.img
          src={room.image}
          alt={room.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
        <div style={styles.cardImgOverlay} />
        <div style={{ position: 'absolute', top: 14, right: 14 }}>
          <AvailabilityBadge count={liveCount} loading={loading} />
        </div>
      </div>

      {/* Body */}
      <div style={styles.swiperCardBody}>
        <h3 style={styles.cardTitle}>{room.name}</h3>
        <p style={styles.cardDesc}>{room.description}</p>

        <div style={styles.priceRow}>
          <div>
            <span style={styles.fromLabel}>From</span>
            <span style={styles.priceTag}>KES {room.startingPrice.toLocaleString()}</span>
            <span style={styles.perNight}>/night</span>
          </div>
        </div>

        {/* Action button */}
        <div style={{ display: 'flex', marginTop: 8 }}>
          {soldOut ? (
            <div style={{ ...styles.viewDetailsBtn, opacity: 0.45, cursor: 'not-allowed', pointerEvents: 'none', color: '#888', borderColor: 'rgba(150,150,150,0.3)', background: 'rgba(150,150,150,0.04)' }}>
              <span>Fully Booked</span>
              <i className="bi bi-slash-circle" style={{ marginLeft: 8 }} />
            </div>
          ) : (
            <motion.button
              whileHover={{
                scale: 1.02,
                background: 'linear-gradient(135deg, #C6A355 0%, #F58220 100%)',
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(198, 163, 85, 0.35)',
              }}
              whileTap={{ scale: 0.98 }}
              style={styles.viewDetailsBtn}
              onClick={() => onViewDetails(room)}
              aria-label={`View details for ${room.name}`}
            >
              <span>View Details</span>
              <i className="bi bi-arrow-right" style={{ marginLeft: 8 }} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────── ROOM DETAIL MODAL ─────────────────────────── */

const RoomModal = ({ room, visible, onClose, liveCount }) => {
  const [closeHovered, setCloseHovered] = useState(false);
  const [guestCount, setGuestCount] = useState(1);

  // Reset guest count when modal opens with a new room
  useEffect(() => {
    if (visible) setGuestCount(1);
  }, [visible]);

  if (!room) return null;
  const soldOut = liveCount <= 0;
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width="min(90vw, 780px)"
      styles={{
        body: { padding: 0, overflow: 'visible', maxHeight: 'none' },
        content: { background: 'transparent', boxShadow: 'none', padding: 0 },
        mask: { backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.65)' }
      }}
      centered
      className="shanvilla-room-modal"
      closeIcon={
        <span
          style={{
            ...styles.modalCloseIcon,
            background: closeHovered ? 'rgba(224, 59, 59, 0.95)' : 'rgba(14, 93, 158, 0.95)',
            borderColor: closeHovered ? 'rgba(224, 59, 59, 0.4)' : 'rgba(224, 59, 59, 0.2)',
            transform: closeHovered ? 'scale(1.08)' : 'scale(1)',
          }}
          onMouseEnter={() => setCloseHovered(true)}
          onMouseLeave={() => setCloseHovered(false)}
          aria-label="Close modal"
        >
          <i className="bi bi-x-lg" />
        </span>
      }
      aria-modal="true"
      aria-label={`${room.name} details`}
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            key="modal-content"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              borderRadius: 24,
              background: 'linear-gradient(160deg, #f4f7fb 0%, #eef2f7 100%)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.35)',
            }}
            className="shanvilla-room-modal-card"
          >
            {/* Hero Image */}
            <div className="shanvilla-room-modal-hero" style={{ position: 'relative', height: 'clamp(180px, 35vw, 340px)', overflow: 'hidden' }}>
              <img
                src={room.image}
                alt={room.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div style={styles.modalHeroOverlay} />
              <div className="shanvilla-room-hero-text" style={{ position: 'absolute', bottom: 20, left: 24, right: 24 }}>
                <div style={styles.modalRoomBadge}>
                  <AvailabilityBadge count={liveCount} />
                </div>
                <h2 className="shanvilla-room-modal-title" style={styles.modalTitle}>{room.name}</h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ color: '#D4AF37', fontSize: '1.45rem', fontWeight: 700 }}>
                    KES {room.startingPrice.toLocaleString()}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem' }}>/night from</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="shanvilla-room-modal-body" style={{ padding: 'clamp(16px, 4vw, 36px)' }}>
              <p style={styles.modalDesc}>{room.description}</p>

              {/* Amenities */}
              <h4 style={styles.modalSubtitle}>Amenities</h4>
              <div className="shanvilla-amenity-grid" style={styles.modalAmenityGrid}>
                {room.amenities.map((a, i) => (
                  <motion.div
                    key={i}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    style={styles.modalAmenityItem}
                  >
                    <i className={`bi ${a.icon}`} style={{ color: '#fa780e', fontSize: '1.25rem' }} />
                    <span style={{ color: '#1E3A5B', fontSize: '0.88rem' }}>{a.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Pricing */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: 28, marginBottom: 16 }}>
                <h4 style={{ ...styles.modalSubtitle, margin: 0 }}>Pricing Plans</h4>
                {room.pricing?.double && room.pricing?.triple ? (
                  <div style={{ display: 'flex', gap: '8px', background: 'rgba(15,143,70,0.08)', padding: '4px', borderRadius: '8px' }}>
                    <button 
                      onClick={() => setGuestCount(2)}
                      style={{ border: 'none', background: guestCount === 2 ? '#0F8F46' : 'transparent', color: guestCount === 2 ? 'white' : '#0F8F46', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
                    >
                      2 Guests
                    </button>
                    <button 
                      onClick={() => setGuestCount(3)}
                      style={{ border: 'none', background: guestCount === 3 ? '#0F8F46' : 'transparent', color: guestCount === 3 ? 'white' : '#0F8F46', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
                    >
                      3 Guests
                    </button>
                  </div>
                ) : room.pricing?.single ? (
                  <div style={{ display: 'flex', gap: '8px', background: 'rgba(15,143,70,0.08)', padding: '4px', borderRadius: '8px' }}>
                    <button 
                      onClick={() => setGuestCount(1)}
                      style={{ border: 'none', background: guestCount === 1 ? '#0F8F46' : 'transparent', color: guestCount === 1 ? 'white' : '#0F8F46', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
                    >
                      1 Guest
                    </button>
                    <button 
                      onClick={() => setGuestCount(2)}
                      style={{ border: 'none', background: guestCount === 2 ? '#0F8F46' : 'transparent', color: guestCount === 2 ? 'white' : '#0F8F46', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
                    >
                      2 Guests
                    </button>
                  </div>
                ) : null}
              </div>
              
              {(() => {
                const p = room.pricing || {};
                let currentTier = null;
                if (guestCount === 3 && p.triple) currentTier = p.triple;
                else if (guestCount === 1 && p.single) currentTier = p.single;
                else currentTier = p.double || p.single || p.triple || p;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="shanvilla-pricing-grid" style={styles.modalPricingGrid}>
                      {Object.entries(currentTier).map(([plan, price]) => (
                        <div key={plan} style={styles.modalPricingCard}>
                          <span style={styles.modalPricingLabel}>{PLAN_LABELS[plan] || plan}</span>
                          <span style={styles.modalPricingAmount}>KES {typeof price === 'number' ? price.toLocaleString() : price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}


              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32, width: '100%' }}>
                {soldOut ? (
                  <div className="shanvilla-modal-book-btn" style={{ ...styles.modalBookBtn, background: '#ccc', cursor: 'not-allowed', opacity: 0.6, textAlign: 'center' }}>
                    No Rooms Available
                  </div>
                ) : (
                  <motion.button
                    whileHover={{
                      scale: 1.03,
                      background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                      boxShadow: '0 10px 30px rgba(197,48,48,0.45)',
                    }}
                    whileTap={{ scale: 0.97 }}
                    className="shanvilla-modal-book-btn"
                    style={styles.modalBookBtn}
                    onClick={() => {
                      onClose();
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('open-booking', { detail: { room } }));
                      }, 300);
                    }}
                    aria-label="Book this room"
                  >
                    Book Now
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

/* ─────────────────────────── DECORATIVE DIVIDER ─────────────────────────── */

const LuxuryDivider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', margin: '18px 0 28px' }}>
    <div style={{ height: 1, width: 64, background: 'linear-gradient(to right, transparent, #D4AF37)' }} />
    <i className="bi bi-diamond-fill" style={{ color: '#D4AF37', fontSize: '0.65rem' }} />
    <i className="bi bi-diamond" style={{ color: '#8FD3FE', fontSize: '0.75rem' }} />
    <i className="bi bi-diamond-fill" style={{ color: '#D4AF37', fontSize: '0.65rem' }} />
    <div style={{ height: 1, width: 64, background: 'linear-gradient(to left, transparent, #D4AF37)' }} />
  </div>
);

/* ─────────────────────────── MAIN COMPONENT ─────────────────────────── */

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { availability, loading } = useRoomAvailability();

  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, margin: '-60px' });

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const baseUrl = (import.meta.env.VITE_API_URL || 'https://shanvilla.pythonanywhere.com').replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/api/rooms`);
        const data = await res.json();
        if (data.status === 'success' && data.rooms && data.rooms.length > 0) {
          const mapped = data.rooms.map(r => ({
            ...r,
            startingPrice: r.price,
            image: IMAGE_MAP[r.image_url] || (r.image_url?.startsWith('/uploads/') ? import.meta.env.VITE_API_URL + r.image_url : r.image_url),
          }));
          setRooms(mapped);
        } else {
          setRooms(ROOMS);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('[fetchRooms]', err);
        setRooms(ROOMS);
      }
    };
    fetchRooms();
  }, []);

  const showRoomModal = (room) => {
    setSelectedRoom(room);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedRoom(null);
  };

  return (
    <section
      id="rooms"
      aria-label="Rooms and Suites"
      style={styles.section}
    >
      {/* ── Background decoration ── */}
      <div style={styles.bgOrb1} aria-hidden="true" />
      <div style={styles.bgOrb2} aria-hidden="true" />

      <div style={styles.container}>

        {/* ── SECTION HEADING ── */}
        <motion.div
          ref={heroRef}
          variants={fadeUp}
          initial="hidden"
          animate={heroInView ? 'visible' : 'hidden'}
          style={{ textAlign: 'center', marginBottom: 12 }}
        >
          <h2 style={styles.sectionTitle}>Rooms &amp; Suites</h2>
          <LuxuryDivider />
          <motion.p
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
            style={styles.sectionSubtitle}
          >
            Discover meticulously designed rooms from cosy singles to spacious superior suites
            each offering a curated blend of elegance, comfort, and modern luxury.
          </motion.p>
        </motion.div>

        <div style={{ display: 'grid', gap: 32, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginTop: 20 }}>
          {rooms.map((room) => (
            <motion.div
              key={room.id}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', justifyContent: 'center' }}
            >
              <RoomCard
                room={room}
                liveCount={availability[room.id] ?? room.available}
                loading={loading}
                onViewDetails={showRoomModal}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* -- Room Detail Modal -- */}
      <RoomModal
        room={selectedRoom}
        visible={isModalVisible}
        onClose={handleModalClose}
        liveCount={selectedRoom ? (availability[selectedRoom.id] ?? 0) : 0}
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        /* Modal overrides */
        .shanvilla-room-modal .ant-modal-content {
          background: transparent !important;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6);
          border-radius: 24px !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .shanvilla-room-modal-card {
          max-height: 88vh;
          overflow-y: auto !important;
          scrollbar-width: thin;
          scrollbar-color: #C6A355 transparent;
          -webkit-overflow-scrolling: touch;
        }
        .shanvilla-room-modal-card::-webkit-scrollbar {
          width: 6px;
        }
        .shanvilla-room-modal-card::-webkit-scrollbar-track {
          background: transparent;
        }
        .shanvilla-room-modal-card::-webkit-scrollbar-thumb {
          background: #C6A355;
          border-radius: 3px;
        }
        .shanvilla-room-modal .ant-modal-close {
          top: 14px !important;
          right: 14px !important;
          z-index: 10;
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
        }
        .shanvilla-room-modal .ant-modal-close:hover {
          background: transparent !important;
        }

        /* ── Mobile & Small Screen Adaptations ── */
        @media (max-width: 767px) {
          .shanvilla-room-modal .ant-modal-content {
            border-radius: 16px !important;
          }
          .shanvilla-room-modal .ant-modal-close {
            top: 10px !important;
            right: 10px !important;
          }
          .shanvilla-room-modal .ant-modal-body {
            padding: 0 !important;
          }
        }

        @media (max-width: 576px) {
          .shanvilla-room-hero-text {
            bottom: 14px !important;
            left: 16px !important;
            right: 16px !important;
          }
          .shanvilla-room-modal-title {
            font-size: 1.3rem !important;
            margin-bottom: 4px !important;
          }
          .shanvilla-amenity-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .shanvilla-pricing-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .shanvilla-modal-book-btn {
            max-width: 100% !important;
            width: 100% !important;
          }
        }

        /* ── Very small screens ── */
        @media (max-width: 380px) {
          .shanvilla-room-modal .ant-modal-content {
            border-radius: 14px !important;
          }
          .shanvilla-amenity-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};

/* ─────────────────────────── INLINE STYLES ─────────────────────────── */

const styles = {
  section: {
    position: 'relative',
    boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.6)",
    background: 'linear-gradient(180deg, #FAF5EF 0%, #FFFFFF 55%, #F8F9FA 100%)',
    padding: 'clamp(28px, 4vw, 29px) 0',
    overflow: 'hidden',
  },
  container: {
    maxWidth: 1320,
    margin: '0 auto',
    padding: '0 clamp(16px, 4vw, 48px)',
    position: 'relative',
    zIndex: 1,
  },
  bgOrb1: {
    position: 'absolute',
    top: '-120px',
    right: '-80px',
    width: 480,
    height: 480,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(143,211,254,0.18) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgOrb2: {
    position: 'absolute',
    bottom: 0,
    left: '-100px',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 'clamp(2rem, 4.5vw, 3rem)',
    fontWeight: 700,
    color: '#0F8F46',
    letterSpacing: '-0.02em',
    margin: 0,
    lineHeight: 1.2,
  },
  sectionSubtitle: {
    color: '#2C3E50',
    fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
    maxWidth: 640,
    margin: '0 auto',
    lineHeight: 1.75,
  },

  /* ─── Room Card ─── */
  swiperCard: {
    background: 'linear-gradient(160deg, #eef7ff 0%, #f5efe6 100%)',
    borderRadius: 22,
    overflow: 'hidden',
    border: '1px solid rgba(79, 112, 168, 0.16)',
    boxShadow: '0 16px 48px rgba(59,95,140,0.12)',
    width: '100%',
    maxWidth: 360,
    cursor: 'default',
  },
  cardImgOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(14, 93, 158, 0.24) 0%, transparent 55%)',
  },
  swiperCardBody: {
    padding: '20px 22px 24px',
  },
  cardTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#08111b',
    margin: '0 0 8px',
    letterSpacing: '-0.01em',
  },
  cardDesc: {
    color: '#2d4368b9',
    fontSize: '0.85rem',
    lineHeight: 1.65,
    margin: '0 0 16px',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    marginBottom: 18,
  },
  fromLabel: {
    color: '#4A6AA6',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginRight: 6,
  },
  priceTag: {
    color: '#f3a20a',
    fontSize: '1.35rem',
    fontWeight: 700,
  },
  perNight: {
    color: 'rgba(47, 67, 96, 0.85)',
    fontSize: '0.8rem',
    marginLeft: 3,
  },
  viewDetailsBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '12px 0',
    borderRadius: 12,
    background: 'rgba(198, 163, 85, 0.05)',
    border: '1px solid rgba(198, 163, 85, 0.35)',
    color: '#8B5E05',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'all 0.2s ease',
  },

  bookNowBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '11px 0',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #0F8F46 0%, #1ab55a 100%)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '0.9rem',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 14px rgba(15,143,70,0.25)',
  },

  /* ─── Availability Badge ─── */
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(224, 59, 59, 0.1)',
    backdropFilter: 'blur(10px)',
    color: '#f70808',
    fontSize: '0.95rem',
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: 40,
    border: '1px solid rgba(224,59,59,0.3)',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  },

  /* ─── Modal ─── */
  modalCloseIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(14, 93, 158, 0.95)',
    backdropFilter: 'blur(8px)',
    color: '#FFFFFF',
    fontSize: '1rem',
    border: '1px solid rgba(224,59,59,0.3)',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
  },
  modalHeroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(14, 158, 158, 0.68) 0%, rgba(244, 240, 228, 0.12) 55%, transparent 100%)',
  },
  modalRoomBadge: {
    marginBottom: 10,
  },
  modalTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)',
    fontWeight: 700,
    color: '#f3f4f5',
    margin: '0 0 8px',
    lineHeight: 1.2,
  },
  modalDesc: {
    color: '#0d1520',
    lineHeight: 1.75,
    fontSize: '0.95rem',
    marginBottom: 24,
    margin: '0 0 24px',
  },
  modalSubtitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#1C3D6C',
    margin: '0 0 14px',
  },
  modalAmenityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 10,
  },
  modalAmenityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(14, 93, 158, 0.08)',
    borderRadius: 10,
    padding: '10px 14px',
    border: '1px solid rgba(14,93,158,0.15)',
  },
  modalPricingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
    gap: 12,
  },
  modalPricingCard: {
    background: 'rgba(45, 45, 83, 0.06)',
    borderRadius: 12,
    padding: '14px 18px',
    border: '1px solid rgba(17, 9, 1, 0.32)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  modalPricingLabel: {
    color: '#4A6AA6',
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
  },
  modalPricingAmount: {
    color: '#f5910f',
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  modalBookBtn: {
    width: '100%',
    maxWidth: 300,
    padding: '14px 26px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #7FADE0 0%, #5688C3 100%)',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '0.95rem',
    border: 'solid 1px rgba(79, 112, 168, 0.75)',
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'all 0.25s ease',
  },
};

export default Rooms;
