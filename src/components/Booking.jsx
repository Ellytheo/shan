
import { useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
  Form,
  DatePicker,
  Select,
  Button,
  Row,
  Col,
  Card,
  Modal,
  Input,
  Alert,
  Spin,
  message,
} from "antd";

const { RangePicker } = DatePicker;
const { Option } = Select;

const API_URL =
  "https://Shanvilla.pythonanywhere.com";

const BookingSection = () => {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [searchData, setSearchData] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingReference, setBookingReference] =
    useState("");

  const [bookingForm] = Form.useForm();

  const disabledDate = (current) => {
    return current && current < dayjs().startOf("day");
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const checkin =
        values.dates[0].format("YYYY-MM-DD");

      const checkout =
        values.dates[1].format("YYYY-MM-DD");

      setSearchData({
        checkin,
        checkout,
        guests: values.guests,
      });

      const response = await axios.get(
        `${API_URL}/availability`,
        {
          params: {
            checkin,
            checkout,
          },
        }
      );

      setRooms(response.data.rooms || []);

      message.success(
        "Room availability loaded successfully"
      );
    } catch (error) {
      console.error(error);

      message.error(
        "Unable to load room availability"
      );
    } finally {
      setLoading(false);
    }
  };

  const openBookingModal = (room) => {
    setSelectedRoom(room);
    setModalOpen(true);
  };

  const handleBooking = async (values) => {
    try {
      setBookingLoading(true);

      const payload = {
        guest_name: values.guest_name,
        email: values.email,
        phone: values.phone,
        room_type_id: selectedRoom.id,
        checkin_date: searchData.checkin,
        checkout_date: searchData.checkout,
        guests: searchData.guests,
      };

      const response = await axios.post(
        `${API_URL}/create_booking`,
        payload
      );

      setBookingReference(
        response.data.booking_reference
      );

      message.success(
        "Booking created successfully"
      );

      bookingForm.resetFields();

      setModalOpen(false);
    } catch (error) {
      console.error(error);

      message.error(
        "Booking could not be completed"
      );
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <section id="booking" style={styles.section}>
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.heading}>
            Book Your Stay
          </h2>

          <div style={styles.divider}></div>

          <Form
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Check-in & Check-out Dates"
                  name="dates"
                  rules={[
                    {
                      required: true,
                      message:
                        "Please select your stay dates",
                    },
                  ]}
                >
                  <RangePicker
                    size="large"
                    disabledDate={disabledDate}
                    style={{
                      width: "100%",
                      height: 50,
                    }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="Guests"
                  name="guests"
                  initialValue="2"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                  <Select size="large">
                    <Option value="1">
                      1 Guest
                    </Option>
                    <Option value="2">
                      2 Guests
                    </Option>
                    <Option value="3">
                      3 Guests
                    </Option>
                    <Option value="4">
                      4 Guests
                    </Option>
                    <Option value="5">
                      5+ Guests
                    </Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "end",
                    height: "100%",
                  }}
                >
                  <Button
                    htmlType="submit"
                    type="primary"
                    loading={loading}
                    style={styles.submitButton}
                  >
                    Check Availability
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>

          {bookingReference && (
            <Alert
              style={{
                marginTop: 25,
              }}
              message={`Booking Confirmed - Reference: ${bookingReference}`}
              type="success"
              showIcon
            />
          )}

          {loading && (
            <div
              style={{
                textAlign: "center",
                padding: 40,
              }}
            >
              <Spin size="large" />
            </div>
          )}

          {!loading &&
            rooms.length > 0 && (
              <div
                style={{
                  marginTop: 40,
                }}
              >
                <h3
                  style={{
                    textAlign: "center",
                    marginBottom: 30,
                  }}
                >
                  Available Rooms
                </h3>

                <Row gutter={[24, 24]}>
                  {rooms.map((room) => (
                    <Col
                      xs={24}
                      sm={12}
                      lg={6}
                      key={room.id}
                    >
                      <Card
                        hoverable
                        style={{
                          borderRadius: 12,
                          height: "100%",
                        }}
                      >
                        <h3>{room.name}</h3>

                        <p>
                          <strong>
                            KES {room.price}
                          </strong>
                          {" "}per night
                        </p>

                        <p>
                          Available:
                          <strong>
                            {" "}
                            {room.available}
                          </strong>
                        </p>

                        <Button
                          block
                          type="primary"
                          disabled={
                            room.available <= 0
                          }
                          style={{
                            background:
                              "#C6A355",
                            borderColor:
                              "#C6A355",
                          }}
                          onClick={() =>
                            openBookingModal(room)
                          }
                        >
                          {room.available > 0
                            ? "Reserve Now"
                            : "Sold Out"}
                        </Button>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={`Reserve ${
          selectedRoom?.name || ""
        }`}
        footer={null}
        onCancel={() => setModalOpen(false)}
      >
        <Form
          form={bookingForm}
          layout="vertical"
          onFinish={handleBooking}
        >
          <Form.Item
            label="Full Name"
            name="guest_name"
            rules={[
              {
                required: true,
                message:
                  "Please enter your name",
              },
            ]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              {
                required: true,
                type: "email",
              },
            ]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="phone"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input size="large" />
          </Form.Item>

          <Button
            htmlType="submit"
            block
            type="primary"
            loading={bookingLoading}
            style={{
              height: 50,
              background: "#C6A355",
              borderColor: "#C6A355",
            }}
          >
            Confirm Reservation
          </Button>
        </Form>
      </Modal>
    </section>
  );
};

const styles = {
  section: {
    padding: "5rem 1rem",
    backgroundColor: "#f5f5f5",
  },

  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 1rem",
  },

  card: {
    backgroundColor: "#FAF5EF",
    padding: "2rem",
    margin: "1rem",
    borderRadius: 12,
    border:
      "1px solid rgb(182,171,171)",
    boxShadow:
      "0 0 20px rgba(0,0,0,0.1)",
  },

  heading: {
    textAlign: "center",
    fontSize: "2rem",
    marginBottom: ".5rem",
    fontFamily:
      "Playfair Display, serif",
  },

  divider: {
    width: 80,
    height: 4,
    backgroundColor: "#C6A355",
    margin: "0 auto 1.5rem",
  },

  submitButton: {
    width: "100%",
    height: 50,
    borderRadius: 30,
    backgroundColor: "#C6A355",
    borderColor: "#C6A355",
  },
};

export default BookingSection;
