
import { Carousel } from "antd";
import {
  FaWifi,
  FaConciergeBell,
  FaUtensils,
  FaParking,
  FaQuoteLeft,
  FaStar,
  FaStarHalfAlt,
  FaSeedling,
  FaBirthdayCake,
  FaBriefcase,
} from "react-icons/fa";
import { MdSupportAgent } from 'react-icons/md';

// Make sure to import your custom CSS (amenity-card, testimonial-section, etc.)

const Amenities = () => {
  return (
    <>
      {/* Amenities Section */}
      <section id="amenities" className="py-5" style={{ backgroundColor: '#F0F4F8' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2
              className="fw-bold mb-4"
              style={{ color:"#0F8F46", fontFamily: "Playfair Display, serif", fontSize: "2.25rem" ,boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.59)",padding:"8px"}}
            >
              Premium Amenities
            </h2>
            <div
              className="mx-auto mb-4"
              style={{ width: "80px", height: "4px", backgroundColor: "#f7f4f2" }}
            />
            <p className="text-dark mx-auto" style={{ maxWidth: "768px" }}>
              Every detail of your stay has been considered. Enjoy our
              comprehensive range of world-class amenities designed for your
              comfort and convenience.
            </p>
          </div>

          <div className="row g-4">
            {[
        {
    Icon: FaWifi,
    title: "High-Speed WiFi",
    desc: "Enjoy seamless connectivity with high-speed internet available throughout your stay.",
    color: "#3B82F6", // Sky blue
  },
  {
  Icon: MdSupportAgent,
  title: "24/7 Concierge",
  desc: "Experience personalized service anytime—our concierge is available day and night to assist.",
  color: "#8B5CF6", // Violet
},

  {
    Icon: FaUtensils,
    title: "Luncheon Buffet",
    desc: "Delight in a variety of gourmet options at our chef-curated anyday to anytime buffet.",
    color: "#10B981", // Green
  },
  {
    Icon: FaBriefcase,
    title: "Conference deluxe",
    desc: "Host your meetings in style with modern conference rooms and professional support.",
    color: "#F97316", // Orange
  },
  {
    Icon: FaConciergeBell,
    title: "Room Service",
    desc: "Dine in the comfort of your room with our 24-hour room service offering international cuisine.",
    color: "#EF4444", // Red
  },
  {
    Icon: FaBirthdayCake,
    title: "Kid's Birthdays",
    desc: "Celebrate memorable moments with themed parties and entertainment for children.",
    color: "#F59E0B", // Amber
  },
  {
    Icon: FaParking,
    title: "Valet Parking",
    desc: "Enjoy the convenience of complimentary valet parking available for all guests with ample parking.",
    color: "#6B7280", // Gray
  },
  {
    Icon: FaSeedling,
    title: "Indoor Garden",
    desc: "Relax in our tranquil indoor garden space with lush greenery and natural ambiance.",
    color: "#22C55E", // Emerald green
  },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="col-12 col-md-6 col-lg-3">
                <div className="amenity-card">
                  <div className="amenity-icon">
                    <Icon />
                  </div>
                  <h3 className="amenity-title">{title}</h3>
                  <p className="amenity-description">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonial-section py-1 m-0">
        <div className="container">
          <div className="text-center mb-2 mt-3">
            <h2
              className="fw-bold mb-2"
              style={{ color:"#0F8F46", fontFamily: "Playfair Display, serif", fontSize: "3rem" }}
            >
              Guest Experiences
            </h2>
            <div
              className="mx-auto mb-4"
              style={{ width: "80px", height: "4px", backgroundColor: "#F58220" }}
            />
            <p className="text-secondary mx-auto text text-dark fs-4" style={{ maxWidth: "768px" }}>
              <i>"Hear what our guests have to say about their unforgettable
              experiences at Shanvilla."</i>
            </p>
          </div>

          <Carousel autoplay className="max-w-4xl mx-auto" style={{ maxWidth: "768px" }}>
            {[
              {
                text: "Our stay at Shanvilla exceeded all expectations. The attention to detail, impeccable service, and breathtaking views created an experience we'll never forget. The staff went above and beyond to make our anniversary truly special.",
                author: "Robert & Sarah Johnson",
                rating: 5,
              },
                 {
      text: "Our stay at Shanvilla was truly refreshing. The peaceful surroundings and attentive staff made our getaway special. The rooms were clean and comfortable with stunning views of the nearby hills.",
      author: "Emily R.",
      rating: 4.5,
    },
    {
      text: "We loved the warm hospitality and the beautiful gardens around the resort. The breakfast spread was delightful, and the quiet atmosphere helped us unwind completely.",
      author: "David Musa.",
      rating: 4,
    },
    {
      text: "Shanvilla offers a perfect blend of comfort and nature. The on-site amenities were well-maintained, and the staff was always eager to help with any requests. We especially enjoyed the guided nature walks nearby.",
      author: "Sarah Karanja.",
      rating: 5,
    },
    {
      text: "A great place for families or couples looking for some peace away from the city. The kids enjoyed the open spaces, and we appreciated the cozy rooms and friendly service.",
      author: "The Mwangi Family",
      rating: 4.5,
    },
    {
      text: "The resort exceeded our expectations in terms of tranquility and service. The local cuisine offered at their restaurant was a delicious treat, and the views from the balcony were breathtaking.",
      author: "James & Linda P.",
      rating: 5,
    },
    {
      text: "Quiet, comfortable, and beautifully landscaped – Shanvilla made our trip memorable. The staff's attention to detail and genuine friendliness made us feel right at home.",
      author: "Grace Wanjiku.",
      rating: 4.5,
    },
              {
                text: "From the moment we arrived, we were treated like royalty. The staff treatments were exceptional, and the ambience is even more beautiful than the pictures. We've already booked our return visit for next year.",
                author: "Michael & Jennifer Chen",
                rating: 5,
              },
              {
                text: "The staff's warmth and professionalism made us feel right at home. Every meal was a delight, and the serene gardens provided a perfect escape. Shanvilla is truly a paradise retreat.",
                author: "Linda & Mark Thompson",
                rating: 4.5,
              },
              {
                text: "A breathtaking location combined with impeccable service. We loved every moment at Shanvilla, especially the sunset yoga sessions on the terrace. Can't wait to return next season.",
                author: "Anita & Raj Patel",
                rating: 5,
              },
              {
                text: "Our family loved the spacious suites and kid-friendly amenities. The activities organized for children kept them entertained while we relaxed. Shanvilla is the perfect family getaway.",
                author: "The Garcia Family",
                rating: 5,
              },
            ].map(({ text, author, rating }, i) => (
              <div key={i} className="px-3 pb-4 text-center">
                <div className="testimonial-quote">
                  <FaQuoteLeft />
                </div>
                <p className="testimonial-text">{text}</p>
                <div className="testimonial-author">{author}</div>
                <div className="testimonial-stars d-flex justify-content-center gap-2">
                  {[...Array(5)].map((_, idx) => {
                    if (rating >= idx + 1) return <FaStar key={idx} />;
                    else if (rating > idx && rating < idx + 1)
                      return <FaStarHalfAlt key={idx} />;
                    else return <FaStar key={idx} style={{ opacity: 0.3 }} />;
                  })}
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      </section>
    </>
  );
};

export default Amenities;
