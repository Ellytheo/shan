import { useState, useRef } from 'react';
import { Modal } from 'antd';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'bootstrap-icons/font/bootstrap-icons.css';

/* ─────────────────────────── DATA ─────────────────────────── */

const ROOMS = [
  {
    id: 1,
    name: 'Standard Single Room',
    available: 6,
    startingPrice: 4000,
    description:
      'A well-appointed retreat offering modern comforts and elegant simplicity — the ideal base for both leisure and business.',
    image:
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80',
    amenities: [
      { icon: 'bi-thermometer-snow', label: 'Air Conditioning' },
      { icon: 'bi-door-closed', label: 'Private Bathroom' },
      { icon: 'bi-tv', label: 'Flat Screen TV' },
      { icon: 'bi-wifi', label: 'High-Speed WiFi' },
      { icon: 'bi-briefcase', label: 'Work Desk' },
    ],
    pricing: {
      bedBreakfast: 4000,
      halfBoard: 5500,
      fullBoard: 6500,
    },
  },
  {
    id: 2,
    name: 'Deluxe Single Room',
    available: 5,
    startingPrice: 5200,
    description:
      'Elevated living with a private balcony and resort panoramas. Perfect for those who seek a little more indulgence.',
    image:
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    amenities: [
      { icon: 'bi-door-open', label: 'Balcony' },
      { icon: 'bi-thermometer-snow', label: 'Air Conditioning' },
      { icon: 'bi-display', label: 'Smart TV' },
      { icon: 'bi-wifi', label: 'High-Speed WiFi' },
      { icon: 'bi-bell', label: 'Room Service' },
    ],
    pricing: {
      bedBreakfast: 5200,
      halfBoard: 6200,
      fullBoard: 7500,
    },
  },
  {
    id: 3,
    name: 'Deluxe Twin Room',
    available: 4,
    startingPrice: 6000,
    description:
      'Spacious twin-bed luxury with smart amenities — crafted for companions, colleagues, or families seeking shared comfort.',
    image:
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=900&q=80',
    amenities: [
      { icon: 'bi-people', label: 'Twin Beds' },
      { icon: 'bi-display', label: 'Smart TV' },
      { icon: 'bi-wifi', label: 'High-Speed WiFi' },
      { icon: 'bi-snow2', label: 'Mini Fridge' },
      { icon: 'bi-bell', label: 'Room Service' },
    ],
    pricing: {
      bedBreakfast: 6000,
      halfBoard: 8500,
      fullBoard: 10500,
    },
  },
  {
    id: 4,
    name: 'Superior Single Room',
    available: 6,
    startingPrice: 6200,
    description:
      'An exceptional sanctuary featuring luxury bedding, a premium mini bar, and an array of curated amenities for the discerning traveller.',
    image:
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=900&q=80',
    amenities: [
      { icon: 'bi-stars', label: 'Luxury Bedding' },
      { icon: 'bi-cup-straw', label: 'Mini Bar' },
      { icon: 'bi-display', label: 'Smart TV' },
      { icon: 'bi-reception-4', label: 'Premium WiFi' },
      { icon: 'bi-briefcase', label: 'Work Desk' },
    ],
    pricing: {
      bedBreakfast: 6200,
      halfBoard: 7500,
      fullBoard: 8500,
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

const AvailabilityBadge = ({ count }) => (
  <span style={styles.badge}>
    <i className="bi bi-check-circle-fill" style={{ marginRight: 5, color: '#D4AF37' }} />
    {count} {count === 1 ? 'Room' : 'Rooms'} Available
  </span>
);

/* ─────────────────────────── AMENITY ICON CHIP ─────────────────────────── */

const AmenityChip = ({ icon, label }) => (
  <div style={styles.amenityChip}>
    <i className={`bi ${icon}`} style={{ color: '#D4AF37', fontSize: '1rem', flexShrink: 0 }} />
    <span style={{ fontSize: '0.82rem', color: '#CBD5E0' }}>{label}</span>
  </div>
);

/* ─────────────────────────── PRICING ROW ─────────────────────────── */

const PricingRow = ({ plan, price }) => (
  <div style={styles.pricingRow}>
    <span style={styles.pricingLabel}>{PLAN_LABELS[plan]}</span>
    <span style={styles.pricingAmount}>
      KES {price.toLocaleString()}
    </span>
  </div>
);

/* ─────────────────────────── GLASSMORPHISM PRICING CARD ─────────────────────────── */

const GlassPricingCard = ({ room, index }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      custom={index}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      style={styles.glassPricingCard}
    >
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0', height: 200 }}>
        <img
          src={room.image}
          alt={room.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.6s ease',
          }}
        />
        <div style={styles.imgOverlay} />
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <AvailabilityBadge count={room.available} />
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
          <span style={styles.roomNameOverlay}>{room.name}</span>
        </div>
      </div>

      <div style={{ padding: '20px 24px 24px' }}>
        {/* Pricing rows */}
        <div style={{ marginBottom: 16 }}>
          {Object.entries(room.pricing).map(([plan, price]) => (
            <PricingRow key={plan} plan={plan} price={price} />
          ))}
        </div>

        {/* Amenities */}
        <div style={styles.amenityGrid}>
          {room.amenities.map((a, i) => (
            <AmenityChip key={i} icon={a.icon} label={a.label} />
          ))}
        </div>

        {/* Book Now */}
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: '0 8px 28px rgba(212,175,55,0.45)' }}
          whileTap={{ scale: 0.97 }}
          style={styles.goldButton}
          onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
          aria-label={`Book ${room.name}`}
        >
          Book Now
        </motion.button>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────── SWIPER ROOM CARD ─────────────────────────── */

const SwiperRoomCard = ({ room, onViewDetails }) => (
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
        <AvailabilityBadge count={room.available} />
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

      <motion.button
        whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(212,175,55,0.4)' }}
        whileTap={{ scale: 0.97 }}
        style={styles.viewDetailsBtn}
        onClick={() => onViewDetails(room)}
        aria-label={`View details for ${room.name}`}
      >
        <span>View Details</span>
        <i className="bi bi-arrow-right" style={{ marginLeft: 8 }} />
      </motion.button>
    </div>
  </motion.div>
);

/* ─────────────────────────── ROOM DETAIL MODAL ─────────────────────────── */

const RoomModal = ({ room, visible, onClose }) => {
  if (!room) return null;
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width="min(90vw, 780px)"
      styles={{ body: { padding: 0, overflow: 'hidden' }, mask: { backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.65)' } }}
      centered
      className="shanvilla-room-modal"
      closeIcon={
        <span style={styles.modalCloseIcon} aria-label="Close modal">
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
            style={{ borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(160deg, #0F2744 0%, #183B63 100%)' }}
          >
            {/* Hero Image */}
            <div style={{ position: 'relative', height: 'clamp(200px, 40vw, 340px)', overflow: 'hidden' }}>
              <img
                src={room.image}
                alt={room.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div style={styles.modalHeroOverlay} />
              <div style={{ position: 'absolute', bottom: 24, left: 28 }}>
                <div style={styles.modalRoomBadge}>
                  <AvailabilityBadge count={room.available} />
                </div>
                <h2 style={styles.modalTitle}>{room.name}</h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ color: '#D4AF37', fontSize: '1.45rem', fontWeight: 700 }}>
                    KES {room.startingPrice.toLocaleString()}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem' }}>/night from</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: 'clamp(20px, 4vw, 36px)' }}>
              <p style={styles.modalDesc}>{room.description}</p>

              {/* Amenities */}
              <h4 style={styles.modalSubtitle}>Amenities</h4>
              <div style={styles.modalAmenityGrid}>
                {room.amenities.map((a, i) => (
                  <motion.div
                    key={i}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    style={styles.modalAmenityItem}
                  >
                    <i className={`bi ${a.icon}`} style={{ color: '#D4AF37', fontSize: '1.25rem' }} />
                    <span style={{ color: '#CBD5E0', fontSize: '0.88rem' }}>{a.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Pricing */}
              <h4 style={{ ...styles.modalSubtitle, marginTop: 28 }}>Pricing Plans</h4>
              <div style={styles.modalPricingGrid}>
                {Object.entries(room.pricing).map(([plan, price]) => (
                  <div key={plan} style={styles.modalPricingCard}>
                    <span style={styles.modalPricingLabel}>{PLAN_LABELS[plan]}</span>
                    <span style={styles.modalPricingAmount}>KES {price.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 14, marginTop: 32, flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={styles.modalBackBtn}
                  onClick={onClose}
                  aria-label="Back to rooms"
                >
                  Back to Rooms
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(212,175,55,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  style={styles.modalBookBtn}
                  onClick={() => {
                    onClose();
                    setTimeout(() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }), 300);
                  }}
                  aria-label="Book this room"
                >
                  Book Now &nbsp;<i className="bi bi-arrow-right" />
                </motion.button>
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
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, margin: '-60px' });

  const allRef = useRef(null);
  const allInView = useInView(allRef, { once: true, margin: '-80px' });

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
          <span style={styles.overlineTag}>
            <i className="bi bi-building" style={{ marginRight: 6, color: '#D4AF37' }} />
            Shanvilla Resort
          </span>
          <h2 style={styles.sectionTitle}>Rooms &amp; Suites</h2>
          <LuxuryDivider />
          <motion.p
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
            style={styles.sectionSubtitle}
          >
            Discover 21 meticulously designed rooms — from cosy singles to spacious superior suites —
            each offering a curated blend of elegance, comfort, and modern luxury.
          </motion.p>
        </motion.div>

        {/* ── SWIPER / ALL ACCOMMODATIONS TOGGLE ── */}
        <AnimatePresence mode="wait">
          {!showAll ? (
            <motion.div
              key="swiper-view"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* ── SWIPER ── */}
              <div style={{ position: 'relative' }}>
                <Swiper
                  slidesPerView={1}
                  spaceBetween={28}
                  centeredSlides
                  pagination={{ clickable: true }}
                  navigation
                  loop
                  autoplay={{ delay: 5500, disableOnInteraction: false }}
                  breakpoints={{
                    480: { slidesPerView: 1.1, centeredSlides: true },
                    640: { slidesPerView: 1.3, centeredSlides: true },
                    768: { slidesPerView: 2, centeredSlides: false },
                    1024: { slidesPerView: 3, centeredSlides: false },
                    1280: { slidesPerView: 3, centeredSlides: false },
                  }}
                  modules={[Pagination, Navigation, Autoplay]}
                  className="shanvilla-swiper"
                  style={{ paddingBottom: 52, paddingTop: 8 }}
                >
                  {ROOMS.map((room) => (
                    <SwiperSlide key={room.id} style={{ display: 'flex', justifyContent: 'center' }}>
                      <SwiperRoomCard room={room} onViewDetails={showRoomModal} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {/* ── View All CTA ── */}
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 12px 36px rgba(143,211,254,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  style={styles.viewAllBtn}
                  onClick={() => setShowAll(true)}
                  aria-label="View all accommodations and pricing"
                >
                  View All Accommodations
                  <i className="bi bi-grid-3x3-gap" style={{ marginLeft: 10 }} />
                </motion.button>
              </div>
            </motion.div>

          ) : (
            <motion.div
              key="all-view"
              ref={allRef}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* ── Back button ── */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  style={styles.backBtn}
                  onClick={() => setShowAll(false)}
                  aria-label="Back to room slider"
                >
                  <i className="bi bi-arrow-left" style={{ marginRight: 8 }} />
                  Back to Slider
                </motion.button>
              </div>

              {/* ── Room Category Sections ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
                {ROOMS.map((room, idx) => (
                  <motion.div
                    key={room.id}
                    variants={fadeUp}
                    custom={idx * 0.5}
                    initial="hidden"
                    animate={allInView ? 'visible' : 'hidden'}
                    style={styles.roomSection}
                  >
                    {/* Room category header */}
                    <div style={styles.roomSectionHeader}>
                      <div>
                        <h3 style={styles.roomSectionTitle}>{room.name}</h3>
                        <p style={styles.roomSectionDesc}>{room.description}</p>
                      </div>
                      <AvailabilityBadge count={room.available} />
                    </div>

                    {/* Pricing grid */}
                    <div style={styles.pricingGrid}>
                      {/* Bed & Breakfast */}
                      <GlassPricingCard
                        key={`${room.id}-bb`}
                        room={{ ...room, pricingHighlight: room.pricing.bedBreakfast }}
                        index={0}
                        planLabel="Bed & Breakfast"
                        planKey="bedBreakfast"
                      />
                      {/* Half Board */}
                      <GlassPricingCard
                        key={`${room.id}-hb`}
                        room={{ ...room, pricingHighlight: room.pricing.halfBoard }}
                        index={1}
                        planLabel="Half Board"
                        planKey="halfBoard"
                      />
                      {/* Full Board */}
                      <GlassPricingCard
                        key={`${room.id}-fb`}
                        room={{ ...room, pricingHighlight: room.pricing.fullBoard }}
                        index={2}
                        planLabel="Full Board"
                        planKey="fullBoard"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Room Detail Modal ── */}
      <RoomModal room={selectedRoom} visible={isModalVisible} onClose={handleModalClose} />

      {/* ── Swiper & Modal Styles ── */}
      <style>{`
        /* Swiper overrides */
        .shanvilla-swiper .swiper-pagination-bullet {
          background: rgba(143, 211, 254, 0.4);
          opacity: 1;
          width: 8px;
          height: 8px;
          transition: all 0.3s ease;
        }
        .shanvilla-swiper .swiper-pagination-bullet-active {
          background: #D4AF37;
          width: 28px;
          border-radius: 4px;
        }
        .shanvilla-swiper .swiper-button-next,
        .shanvilla-swiper .swiper-button-prev {
          color: #D4AF37;
          background: rgba(15, 39, 68, 0.75);
          backdrop-filter: blur(10px);
          border-radius: 50%;
          width: 44px;
          height: 44px;
          border: 1px solid rgba(212, 175, 55, 0.35);
          transition: all 0.3s ease;
        }
        .shanvilla-swiper .swiper-button-next::after,
        .shanvilla-swiper .swiper-button-prev::after {
          font-size: 14px;
          font-weight: 700;
        }
        .shanvilla-swiper .swiper-button-next:hover,
        .shanvilla-swiper .swiper-button-prev:hover {
          background: rgba(212, 175, 55, 0.2);
          border-color: #D4AF37;
        }
        /* Modal overrides */
        .shanvilla-room-modal .ant-modal-content {
          background: transparent !important;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6);
          border-radius: 24px !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .shanvilla-room-modal .ant-modal-close {
          top: 14px !important;
          right: 14px !important;
          z-index: 10;
        }
        /* Responsive: pricing grid */
        @media (max-width: 767px) {
          .shanvilla-pricing-grid {
            grid-template-columns: 1fr !important;
          }
          .shanvilla-room-section-header {
            flex-direction: column !important;
            gap: 12px !important;
          }
        }
        @media (max-width: 480px) {
          .shanvilla-swiper .swiper-button-next,
          .shanvilla-swiper .swiper-button-prev {
            display: none;
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
    background: 'linear-gradient(180deg, #FAF5EF 0%, #FFFFFF 55%, #F8F9FA 100%)',
    padding: 'clamp(48px, 6vw, 80px) 0',
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
  overlineTag: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #0F8F46 0%, #7DC96A 100%)',
    color: '#FFFFFF',
    fontSize: '0.78rem',
    fontWeight: 600,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    padding: '6px 18px',
    borderRadius: 40,
    border: '1px solid rgba(15,143,70,0.2)',
    marginBottom: 18,
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

  /* ─── Swiper Card ─── */
  swiperCard: {
    background: 'linear-gradient(160deg, #0F8F46 0%, #2A7D33 100%)',
    borderRadius: 22,
    overflow: 'hidden',
    border: '1px solid rgba(15,143,70,0.16)',
    boxShadow: '0 16px 48px rgba(15,143,70,0.18)',
    width: '100%',
    maxWidth: 360,
    cursor: 'default',
  },
  cardImgOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(15,143,70,0.75) 0%, transparent 50%)',
  },
  swiperCardBody: {
    padding: '20px 22px 24px',
  },
  cardTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#FFFFFF',
    margin: '0 0 8px',
    letterSpacing: '-0.01em',
  },
  cardDesc: {
    color: '#E9F2EA',
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
    color: '#E9F2EA',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginRight: 6,
  },
  priceTag: {
    color: '#F58220',
    fontSize: '1.35rem',
    fontWeight: 700,
  },
  perNight: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.8rem',
    marginLeft: 3,
  },
  viewDetailsBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '11px 0',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #F58220 0%, #D46B10 100%)',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '0.9rem',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'all 0.25s ease',
  },

  /* ─── Availability Badge ─── */
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(15,143,70,0.12)',
    backdropFilter: 'blur(10px)',
    color: '#0F8F46',
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: 40,
    border: '1px solid rgba(15,143,70,0.2)',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  },

  /* ─── View All / Back buttons ─── */
  viewAllBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '14px 36px',
    borderRadius: 14,
    background: 'linear-gradient(135deg, #0F8F46 0%, #7DC96A 100%)',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '0.95rem',
    border: '1px solid rgba(15,143,70,0.2)',
    cursor: 'pointer',
    letterSpacing: '0.03em',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 28px rgba(15,143,70,0.2)',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 24px',
    borderRadius: 12,
    background: 'rgba(15,143,70,0.08)',
    color: '#0F8F46',
    fontWeight: 600,
    fontSize: '0.88rem',
    border: '1px solid rgba(15,143,70,0.2)',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
  },

  /* ─── All Accommodations ─── */
  roomSection: {
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(12px)',
    borderRadius: 24,
    border: '1px solid rgba(143,211,254,0.25)',
    padding: 'clamp(24px, 4vw, 40px)',
    boxShadow: '0 12px 40px rgba(15,39,68,0.1)',
  },
  roomSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 28,
  },
  roomSectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)',
    fontWeight: 700,
    color: '#0F2744',
    margin: '0 0 8px',
  },
  roomSectionDesc: {
    color: '#4A6080',
    fontSize: '0.92rem',
    lineHeight: 1.65,
    maxWidth: 520,
    margin: 0,
  },
  pricingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 24,
  },
  glassPricingCard: {
    background: 'linear-gradient(160deg, #0F2744 0%, #183B63 100%)',
    borderRadius: 20,
    overflow: 'hidden',
    border: '1px solid rgba(143,211,254,0.14)',
    boxShadow: '0 16px 40px rgba(15,39,68,0.22)',
  },
  imgOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(15,39,68,0.75) 0%, transparent 55%)',
  },
  roomNameOverlay: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1rem',
    fontWeight: 700,
    color: '#FFFFFF',
  },
  pricingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '9px 0',
    borderBottom: '1px solid rgba(143,211,254,0.1)',
  },
  pricingLabel: {
    color: '#8FD3FE',
    fontSize: '0.82rem',
  },
  pricingAmount: {
    color: '#D4AF37',
    fontWeight: 700,
    fontSize: '0.95rem',
  },
  amenityGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    marginBottom: 20,
  },
  amenityChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(143,211,254,0.08)',
    border: '1px solid rgba(143,211,254,0.15)',
    borderRadius: 8,
    padding: '4px 10px',
  },
  goldButton: {
    display: 'block',
    width: '100%',
    padding: '11px 0',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #F58220 0%, #D46B10 100%)',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '0.9rem',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'all 0.25s ease',
  },

  /* ─── Modal ─── */
  modalCloseIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(15,143,70,0.9)',
    backdropFilter: 'blur(8px)',
    color: '#FFFFFF',
    fontSize: '1rem',
    border: '1px solid rgba(15,143,70,0.3)',
    cursor: 'pointer',
  },
  modalHeroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(15,143,70,0.88) 0%, rgba(15,143,70,0.2) 60%, transparent 100%)',
  },
  modalRoomBadge: {
    marginBottom: 10,
  },
  modalTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)',
    fontWeight: 700,
    color: '#FFFFFF',
    margin: '0 0 8px',
    lineHeight: 1.2,
    textShadow: '0 2px 8px rgba(0,0,0,0.4)',
  },
  modalDesc: {
    color: '#E9F2EA',
    lineHeight: 1.75,
    fontSize: '0.95rem',
    marginBottom: 24,
    margin: '0 0 24px',
  },
  modalSubtitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#FFFFFF',
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
    background: 'rgba(15,143,70,0.08)',
    borderRadius: 10,
    padding: '10px 14px',
    border: '1px solid rgba(15,143,70,0.12)',
  },
  modalPricingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
    gap: 12,
  },
  modalPricingCard: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: '14px 18px',
    border: '1px solid rgba(245,130,32,0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  modalPricingLabel: {
    color: '#0F8F46',
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
  },
  modalPricingAmount: {
    color: '#F58220',
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  modalBackBtn: {
    flex: 1,
    minWidth: 130,
    padding: '12px 20px',
    borderRadius: 12,
    background: 'rgba(15,143,70,0.06)',
    color: '#0F8F46',
    fontWeight: 600,
    fontSize: '0.9rem',
    border: '1px solid rgba(15,143,70,0.18)',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
  },
  modalBookBtn: {
    flex: 2,
    minWidth: 140,
    padding: '12px 24px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #F58220 0%, #D46B10 100%)',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '0.95rem',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'all 0.25s ease',
  },
};

export default Rooms;
