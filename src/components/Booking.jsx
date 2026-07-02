import { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
  Form,
  DatePicker,
  Select,
  Button,
  Input,
  Alert,
  Spin,
  message,
} from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { useRoomAvailability } from "../context/RoomAvailabilityContext";

/* ─── local room data (mirrors Rooms.jsx) ─── */
import pic5 from "../images/pic5.jpg";
import pic15 from "../images/pic15.jpg";
import room1 from "../images/standard.webp";
import room2 from "../images/vip.webp";

const LOCAL_ROOMS = [
  {
    id: 1,
    name: "Standard Single Room",
    available: 6,
    startingPrice: 5000,
    description:
      "A well-appointed retreat offering modern comforts and elegant simplicity.",
    image: pic5,
  },
  {
    id: 2,
    name: "Deluxe Single Room",
    available: 5,
    startingPrice: 5000,
    description:
      "Elevated living with a private balcony and resort panoramas.",
    image: pic15,
  },
  {
    id: 3,
    name: "Deluxe Twin Room",
    available: 4,
    startingPrice: 6000,
    description:
      "Spacious twin-bed luxury crafted for companions seeking shared comfort.",
    image: room1,
  },
  {
    id: 4,
    name: "Superior Single Room",
    available: 6,
    startingPrice: 8000,
    description:
      "An exceptional sanctuary with luxury bedding and a premium mini bar.",
    image: room2,
  },
];

const { RangePicker } = DatePicker;
const { Option } = Select;

const API_URL = "https://Shanvilla.pythonanywhere.com";

/* ─── overlay / modal CSS injected once ─── */
const MODAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap');

  .sv-bk-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    pointer-events: auto;
  }

  .sv-bk-modal {
    position: relative;
    width: min(92vw, 760px);
    max-height: 90vh;
    overflow-y: auto;
    background: linear-gradient(160deg, #FFF8EE 0%, #FAF5EF 100%);
    border-radius: 24px;
    box-shadow: 0 40px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(212,175,55,0.2);
    scrollbar-width: thin;
    scrollbar-color: #C6A355 transparent;
  }

  .sv-bk-modal::-webkit-scrollbar { width: 6px; }
  .sv-bk-modal::-webkit-scrollbar-track { background: transparent; }
  .sv-bk-modal::-webkit-scrollbar-thumb { background: #C6A355; border-radius: 4px; }

  .sv-bk-close {
    position: absolute;
    top: 14px;
    right: 16px;
    z-index: 10;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(198,163,85,0.35);
    background: rgba(255,255,255,0.85);
    color: #8B5E05;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    transition: background 0.2s, color 0.2s;
    backdrop-filter: blur(8px);
  }
  .sv-bk-close:hover { background: #C6A355; color: #fff; }

  .sv-bk-body { padding: clamp(24px, 4vw, 40px); }

  .sv-bk-heading {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.5rem, 3.5vw, 2rem);
    font-weight: 700;
    color: #0F8F46;
    text-align: center;
    margin: 0 0 4px;
  }

  .sv-bk-divider {
    width: 72px;
    height: 3px;
    background: linear-gradient(90deg, #C6A355, #F58220);
    border-radius: 2px;
    margin: 0 auto 24px;
  }

  .sv-bk-room-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(15,143,70,0.08);
    border: 1px solid rgba(15,143,70,0.2);
    border-radius: 40px;
    padding: 6px 16px;
    margin: 0 auto 24px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #0F8F46;
    display: flex;
    justify-content: center;
  }

  /* ── Available room cards ── */
  .sv-bk-avail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    margin-top: 28px;
  }

  .sv-bk-avail-card {
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid rgba(198,163,85,0.25);
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    background: #fff;
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: pointer;
  }
  .sv-bk-avail-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 36px rgba(0,0,0,0.18);
  }
  .sv-bk-avail-card img { width: 100%; height: 130px; object-fit: cover; display: block; }
  .sv-bk-avail-card-body { padding: 12px 14px 16px; }
  .sv-bk-avail-card h4 {
    font-family: 'Playfair Display', serif;
    font-size: 0.95rem;
    font-weight: 700;
    color: #1C2A3A;
    margin: 0 0 4px;
  }
  .sv-bk-avail-card p { color: #4A6AA6; font-size: 0.82rem; margin: 0 0 10px; }
  .sv-bk-avail-card-price {
    color: #F5910F;
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 10px;
  }
  .sv-bk-avail-card-avail {
    display: inline-block;
    background: rgba(15,143,70,0.08);
    color: #0F8F46;
    border-radius: 20px;
    padding: 2px 10px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 10px;
  }
  .sv-bk-avail-reserve-btn {
    width: 100%;
    padding: 9px 0;
    border-radius: 10px;
    background: linear-gradient(135deg, #C6A355 0%, #F58220 100%);
    color: #fff;
    font-weight: 700;
    font-size: 0.85rem;
    border: none;
    cursor: pointer;
    transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
  }
  .sv-bk-avail-reserve-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  .sv-bk-avail-reserve-btn:not(:disabled):hover {
    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
    box-shadow: 0 6px 18px rgba(197,48,48,0.38);
    transform: translateY(-1px);
  }

  /* ── Ant Design form overrides inside modal ── */
  .sv-bk-modal .ant-form-item-label > label {
    font-family: 'Inter', sans-serif;
    font-size: 0.88rem;
    font-weight: 600;
    color: #2C3E50;
  }
  .sv-bk-modal .ant-input,
  .sv-bk-modal .ant-picker,
  .sv-bk-modal .ant-select-selector {
    border-radius: 10px !important;
    border-color: rgba(198,163,85,0.4) !important;
    background: #FFFDF8 !important;
  }
  .sv-bk-modal .ant-input:focus,
  .sv-bk-modal .ant-picker-focused,
  .sv-bk-modal .ant-select-focused .ant-select-selector {
    border-color: #C6A355 !important;
    box-shadow: 0 0 0 2px rgba(198,163,85,0.18) !important;
  }

  /* Ensure datepicker and select dropdown overlays sit in front of modal z-index: 2000 */
  .ant-picker-dropdown,
  .ant-select-dropdown {
    z-index: 2500 !important;
  }

  .sv-bk-submit-btn {
    width: 100%;
    height: 50px;
    border-radius: 30px !important;
    background: linear-gradient(135deg, #C6A355 0%, #F58220 100%) !important;
    border: none !important;
    font-size: 1rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.02em;
    box-shadow: 0 6px 20px rgba(198,163,85,0.35) !important;
    transition: background 0.2s, box-shadow 0.2s, transform 0.15s !important;
  }
  .sv-bk-submit-btn:hover {
    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%) !important;
    box-shadow: 0 8px 24px rgba(197,48,48,0.42) !important;
    transform: translateY(-1px);
  }

  .sv-bk-section-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: #0F8F46;
    margin: 0 0 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sv-bk-room-hero {
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 20px;
    position: relative;
    height: 160px;
  }
  .sv-bk-room-hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .sv-bk-room-hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(14,20,34,0.6) 0%, transparent 60%);
  }
  .sv-bk-room-hero-info {
    position: absolute;
    bottom: 14px;
    left: 18px;
    color: #fff;
  }
  .sv-bk-room-hero-name {
    font-family: 'Playfair Display', serif;
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0 0 2px;
  }
  .sv-bk-room-hero-price { font-size: 0.85rem; color: #D4AF37; font-weight: 600; }

  /* Stay Summary Panel */
  .sv-bk-summary-card {
    background: rgba(198, 163, 85, 0.05);
    border: 1px dashed rgba(198, 163, 85, 0.35);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
  }
  .sv-bk-summary-header {
    font-size: 0.95rem;
    font-weight: 700;
    color: #8B5E05;
    margin: 0 0 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .sv-bk-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  @media (max-width: 480px) {
    .sv-bk-summary-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }
  }
  .sv-bk-summary-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .sv-bk-summary-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: #7A8B9E;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .sv-bk-summary-val {
    font-size: 0.9rem;
    color: #1C2A3A;
    font-weight: 600;
  }
  .sv-bk-summary-divider {
    border: 0;
    border-top: 1px dashed rgba(198, 163, 85, 0.35);
    margin: 14px 0;
  }
  .sv-bk-summary-price {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
  }
  .sv-bk-summary-price-label {
    color: #4A6AA6;
    font-weight: 500;
  }
  .sv-bk-summary-price-total {
    font-size: 1.15rem;
    font-weight: 700;
    color: #0F8F46;
  }

  @media (max-width: 480px) {
    .sv-bk-overlay { padding: 10px; }
    .sv-bk-body { padding: 20px 18px 28px; }
  }
`;

/* ─── inject styles once ─── */
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected) return;
  const tag = document.createElement("style");
  tag.id = "sv-booking-modal-styles";
  tag.textContent = MODAL_CSS;
  document.head.appendChild(tag);
  stylesInjected = true;
};

/* ─── fade/scale variants ─── */
const overlayVar = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};
const modalVar = {
  hidden: { opacity: 0, scale: 0.9, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 0.92, y: 16, transition: { duration: 0.22, ease: "easeIn" } },
};

/* ═══════════════════════════════════════════════════════════════════════════
   BookingModal – exported component
   Props:
     open        {boolean}  – controls visibility
     onClose     {function} – called when user closes modal
     preRoom     {object|null} – if set, skips availability → direct booking
   ═══════════════════════════════════════════════════════════════════════════ */
const BookingModal = ({ open, onClose, preRoom = null }) => {
  /* inject styles on first render */
  useEffect(() => { injectStyles(); }, []);

  const { decrementRoom, refreshAvailability } = useRoomAvailability();

  /* ── state ── */
  const [availLoading, setAvailLoading]   = useState(false);
  const [availRooms,   setAvailRooms]     = useState([]);
  const [searchData,   setSearchData]     = useState(null);   // dates + guests from step-1
  const [selectedRoom, setSelectedRoom]   = useState(null);   // room picked from availability grid
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingRef,   setBookingRef]     = useState("");

  /* ── derive active room synchronously (no useEffect race) ── */
  // In direct mode preRoom is always the room; in general mode it's whatever
  // the user picked from the availability grid.
  const bookingRoom = preRoom || selectedRoom;

  const [availForm] = Form.useForm();
  const [bookForm]  = Form.useForm();

  /* ── watch form fields for live summary ── */
  const selectedDates  = Form.useWatch("dates",  bookForm);
  const selectedGuests = Form.useWatch("guests", bookForm);

  /* ── derive mode ── */
  const directMode = Boolean(preRoom);

  /* ── reset when modal closes ── */
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setAvailRooms([]);
        setSearchData(null);
        setSelectedRoom(null);
        setBookingRef("");
        availForm.resetFields();
        bookForm.resetFields();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open, availForm, bookForm]);

  /* ── derive stay dates & guests ── */
  const checkinVal = directMode
    ? (selectedDates?.[0] ? selectedDates[0].format("YYYY-MM-DD") : null)
    : searchData?.checkin;
  const checkoutVal = directMode
    ? (selectedDates?.[1] ? selectedDates[1].format("YYYY-MM-DD") : null)
    : searchData?.checkout;
  const guestsVal = directMode
    ? selectedGuests
    : searchData?.guests;

  // calculate nights
  const nights = (checkinVal && checkoutVal)
    ? dayjs(checkoutVal).diff(dayjs(checkinVal), "day")
    : 0;

  // calculate total price
  const roomPricePerNight = bookingRoom
    ? (bookingRoom.price || bookingRoom.startingPrice || 0)
    : 0;
  const totalPrice = nights * roomPricePerNight;

  /* ── step-1: check availability ── */
  const handleCheckAvailability = async (values) => {
    try {
      setAvailLoading(true);
      const checkin = values.dates[0].format("YYYY-MM-DD");
      const checkout = values.dates[1].format("YYYY-MM-DD");
      setSearchData({ checkin, checkout, guests: values.guests });

      const resp = await axios.get(`${API_URL}/availability`, {
        params: { checkin, checkout },
      });

      // Merge API response with local room data for images / descriptions
      const apiRooms = resp.data.rooms || [];
      const merged = apiRooms.map((apiRoom) => {
        const local = LOCAL_ROOMS.find(
          (r) => r.name.toLowerCase() === apiRoom.name?.toLowerCase() || r.id === apiRoom.id
        );
        return { ...apiRoom, image: local?.image || null, description: local?.description || "" };
      });

      if (merged.length === 0) {
        message.info("No rooms available for the selected dates.");
      } else {
        message.success("Rooms loaded successfully!");
      }
      setAvailRooms(merged);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || "Unable to check availability. Please try again.";
      message.error(errMsg);
    } finally {
      setAvailLoading(false);
    }
  };

  /* ── step-2: confirm booking ── */
  const handleBooking = async (values) => {
    const room = bookingRoom;
    if (!room) {
      message.error("No room selected. Please try again.");
      return;
    }
    try {
      setBookingLoading(true);
      // For direct mode, collect dates from the direct form
      const checkin = directMode
        ? values.dates[0].format("YYYY-MM-DD")
        : searchData.checkin;
      const checkout = directMode
        ? values.dates[1].format("YYYY-MM-DD")
        : searchData.checkout;
      const guests = directMode ? values.guests : searchData.guests;

      const payload = {
        guest_name: values.guest_name,
        email: values.email,
        phone: values.phone,
        room_type_id: room.id,
        checkin_date: checkin,
        checkout_date: checkout,
        guests,
      };

      const resp = await axios.post(`${API_URL}/create_booking`, payload);
      setBookingRef(resp.data.booking_reference || "CONF-" + Date.now());
      // Optimistic local decrement + re-fetch from DB so badges survive a refresh
      decrementRoom(room.id);
      refreshAvailability();
      message.success("Booking confirmed!");
      bookForm.resetFields();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || "Booking could not be completed. Please try again.";
      message.error(errMsg);
    } finally {
      setBookingLoading(false);
    }
  };

  const disabledDate = (current) => current && current < dayjs().startOf("day");

  /* ── which "page" are we showing? ── */
  const showAvailPage = !directMode && !selectedRoom;
  const showBookPage  = Boolean(bookingRoom);

  const handleClose = () => {
    onClose?.();
  };

  /* ─────────────────────────────── RENDER ─────────────────────────────── */
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="sv-bk-overlay"
          variants={overlayVar}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
          role="dialog"
          aria-modal="true"
          aria-label="Booking modal"
        >
          <motion.div
            className="sv-bk-modal"
            variants={modalVar}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="sv-bk-close"
              onClick={handleClose}
              aria-label="Close booking modal"
            >
              <i className="bi bi-x-lg" />
            </button>

            <div className="sv-bk-body">
              {/* ──────────── HEADING ──────────── */}
              <h2 className="sv-bk-heading">
                {directMode ? "Reserve Your Room" : "Book Your Stay"}
              </h2>
              <div className="sv-bk-divider" />

              {/* ──────────── SUCCESS STATE ──────────── */}
              {bookingRef && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ textAlign: "center", padding: "32px 0" }}
                >
                  <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>🎉</div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#0F8F46", marginBottom: 8 }}>
                    Booking Confirmed!
                  </h3>
                  <Alert
                    message={`Booking Reference: ${bookingRef}`}
                    type="success"
                    showIcon
                    style={{ borderRadius: 12, marginBottom: 20 }}
                  />
                  <p style={{ color: "#4A6AA6", fontSize: "0.9rem" }}>
                    Thank you for choosing Shanvilla. We look forward to welcoming you!
                  </p>
                  <button
                    className="sv-bk-avail-reserve-btn"
                    style={{ width: "auto", padding: "10px 32px", borderRadius: 30, marginTop: 12 }}
                    onClick={handleClose}
                  >
                    Close
                  </button>
                </motion.div>
              )}

              {/* ──────────── AVAILABILITY FORM (General Mode) ──────────── */}
              {!bookingRef && showAvailPage && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Form layout="vertical" form={availForm} onFinish={handleCheckAvailability}>
                    <Form.Item
                      label="Check-in & Check-out Dates"
                      name="dates"
                      rules={[{ required: true, message: "Please select your stay dates" }]}
                    >
                      <RangePicker
                        size="large"
                        disabledDate={disabledDate}
                        style={{ width: "100%", borderRadius: 10 }}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Number of Guests"
                      name="guests"
                      initialValue="2"
                      rules={[{ required: true }]}
                    >
                      <Select size="large">
                        {["1","2","3","4","5"].map((n) => (
                          <Option key={n} value={n}>
                            {n} Guest{n !== "1" ? "s" : ""}{n === "5" ? " (max)" : ""}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Button
                      htmlType="submit"
                      loading={availLoading}
                      className="sv-bk-submit-btn"
                    >
                      {availLoading ? "Checking…" : "Check Availability"}
                    </Button>
                  </Form>

                  {/* ── Results grid ── */}
                  {availLoading && (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                      <Spin size="large" />
                    </div>
                  )}

                  {!availLoading && availRooms.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                      <p className="sv-bk-section-title" style={{ marginTop: 32 }}>
                        <i className="bi bi-door-open" /> Available Rooms
                      </p>
                      <div className="sv-bk-avail-grid">
                        {availRooms.map((room) => (
                          <div key={room.id} className="sv-bk-avail-card">
                            {room.image && <img src={room.image} alt={room.name} />}
                            <div className="sv-bk-avail-card-body">
                              <h4>{room.name}</h4>
                              {room.description && <p>{room.description}</p>}
                              <div className="sv-bk-avail-card-price">KES {(room.price || room.startingPrice || 0).toLocaleString()} / night</div>
                              <div className="sv-bk-avail-card-avail">
                                <i className="bi bi-check-circle-fill" style={{ marginRight: 4 }} />
                                {room.available} {room.available === 1 ? "Room" : "Rooms"} Available
                              </div>
                              <button
                                className="sv-bk-avail-reserve-btn"
                                disabled={room.available <= 0}
                                onClick={() => setSelectedRoom(room)}
                              >
                                {room.available > 0 ? "Reserve Now" : "Sold Out"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ──────────── BOOKING FORM ──────────── */}
              {!bookingRef && showBookPage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Back button (only in general flow) */}
                  {!directMode && (
                    <button
                      onClick={() => setSelectedRoom(null)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#4A6AA6",
                        cursor: "pointer",
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 20,
                        padding: 0,
                      }}
                    >
                      <i className="bi bi-arrow-left" /> Back to available rooms
                    </button>
                  )}

                  {/* Room hero banner */}
                  {bookingRoom && (
                    <div className="sv-bk-room-hero">
                      {bookingRoom.image && (
                        <img src={bookingRoom.image} alt={bookingRoom.name} />
                      )}
                      <div className="sv-bk-room-hero-overlay" />
                      <div className="sv-bk-room-hero-info">
                        <p className="sv-bk-room-hero-name">{bookingRoom.name}</p>
                        <p className="sv-bk-room-hero-price">
                          From KES {(bookingRoom.startingPrice || bookingRoom.price || 0).toLocaleString()} / night
                        </p>
                      </div>
                    </div>
                  )}

                  <Form layout="vertical" form={bookForm} onFinish={handleBooking}>
                    {/* Direct mode: include date + guests fields */}
                    {directMode && (
                      <>
                        <Form.Item
                          label="Check-in & Check-out Dates"
                          name="dates"
                          rules={[{ required: true, message: "Please select your stay dates" }]}
                        >
                          <RangePicker
                            size="large"
                            disabledDate={disabledDate}
                            style={{ width: "100%", borderRadius: 10 }}
                          />
                        </Form.Item>

                        <Form.Item
                          label="Number of Guests"
                          name="guests"
                          initialValue="2"
                          rules={[{ required: true }]}
                        >
                          <Select size="large">
                            {["1","2","3","4","5"].map((n) => (
                              <Option key={n} value={n}>{n}{n === "5" ? "+" : ""} Guest{n !== "1" ? "s" : ""}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </>
                    )}

                    {/* Stay Summary Panel */}
                    {checkinVal && checkoutVal && nights > 0 && (
                      <div className="sv-bk-summary-card">
                        <h4 className="sv-bk-summary-header">
                          <i className="bi bi-receipt" /> Stay Summary
                        </h4>
                        <div className="sv-bk-summary-grid">
                          <div className="sv-bk-summary-item">
                            <span className="sv-bk-summary-label">Check-in</span>
                            <span className="sv-bk-summary-val">
                              {dayjs(checkinVal).format("ddd, MMM D, YYYY")}
                            </span>
                          </div>
                          <div className="sv-bk-summary-item">
                            <span className="sv-bk-summary-label">Check-out</span>
                            <span className="sv-bk-summary-val">
                              {dayjs(checkoutVal).format("ddd, MMM D, YYYY")}
                            </span>
                          </div>
                          <div className="sv-bk-summary-item">
                            <span className="sv-bk-summary-label">Guests</span>
                            <span className="sv-bk-summary-val">
                              {guestsVal} Guest{guestsVal !== "1" ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        <div className="sv-bk-summary-item">
                          <span className="sv-bk-summary-label">Duration</span>
                          <span className="sv-bk-summary-val">
                            {nights} Night{nights !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <hr className="sv-bk-summary-divider" />
                        <div className="sv-bk-summary-price">
                          <span className="sv-bk-summary-price-label">
                            KES {roomPricePerNight.toLocaleString()} × {nights} night{nights !== 1 ? "s" : ""}
                          </span>
                          <span className="sv-bk-summary-price-total">
                            Total: KES {totalPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    <p className="sv-bk-section-title">
                      <i className="bi bi-person-fill" /> Guest Details
                    </p>

                    <Form.Item
                      label="Full Name"
                      name="guest_name"
                      rules={[{ required: true, message: "Please enter your name" }]}
                    >
                      <Input size="large" placeholder="e.g. elius magin" />
                    </Form.Item>

                    <Form.Item
                      label="Email Address"
                      name="email"
                      rules={[{ required: true, type: "email", message: "Please enter a valid email" }]}
                    >
                      <Input size="large" placeholder="e.g. elius@email.com" />
                    </Form.Item>

                    <Form.Item
                      label="Phone Number"
                      name="phone"
                      rules={[
                        { required: true, message: "Please enter your phone number" },
                        {
                          pattern: /^\+?[0-9\s-]{9,15}$/,
                          message: "Please enter a valid phone number (9-15 digits)",
                        },
                      ]}
                    >
                      <Input size="large" placeholder="e.g. +254 700 000 000" />
                    </Form.Item>

                    <Button
                      htmlType="submit"
                      loading={bookingLoading}
                      className="sv-bk-submit-btn"
                    >
                      {bookingLoading ? "Confirming…" : "Confirm Reservation"}
                    </Button>
                  </Form>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingModal;
