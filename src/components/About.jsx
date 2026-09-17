import { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import logo from '../images/logo2.jpg';

// === Video Data (Shanvilla Overview + 3 WhatsApp Feature Clips matched to Resort Amenities) ===
const ABOUT_VIDEOS = [
  {
    id: 'shanvilla-resort',
    src: '/videos/Shanvilla.mp4',
    badge: 'Resort & Suites',
    title: 'Luxury Accommodation & 24/7 Concierge',
    caption: 'Experience elegantly appointed rooms with high-speed WiFi, smart TVs, private balconies, and dedicated 24-hour room service.',
  },
  {
    id: 'whatsapp-video-1',
    src: '/videos/WhatsApp Video 2026-09-17 at 13.18.04.mp4',
    badge: 'Dining & Events',
    title: 'Gourmet Dining & Luncheon Buffet',
    caption: 'Savor chef-curated culinary buffets and refreshing beverage selections in our serene dining spaces and event gardens.',
  },
  {
    id: 'whatsapp-video-2',
    src: '/videos/WhatsApp Video 2026-09-17 at 13.18.05.mp4',
    badge: 'Nature & Gardens',
    title: 'Lush Tropical Gardens & Family Celebrations',
    caption: 'Relax amidst scenic outdoor walkways, tranquil garden greenery, and dedicated open-air spaces for memorable kids\' birthdays.',
  },
  {
    id: 'whatsapp-video-3',
    src: '/videos/WhatsApp Video 2026-09-17 at 13.18.06.mp4',
    badge: 'Executive & Leisure',
    title: 'Deluxe Conferences & Valet Parking',
    caption: 'Host corporate retreats and private meetings in executive halls complete with complimentary valet parking and attentive hospitality.',
  },
];

// === Styled Components ===

const AboutSection = styled.section`
  padding: 40px 20px;
  background-color: #FFFFFF;

  @media (max-width: 768px) {
    padding: 60px 20px;
  }

  @media (max-width: 480px) {
    padding: 40px 16px;
  }
`;

const SectionTitle = styled.h2`
  font-family: 'Playfair Display', serif;
  text-align: center;
  margin-bottom: 20px;
  color: #0F8F46;
  padding: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.37);
  font-size: clamp(2rem, 3vw, 2.5rem);
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const TextContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;

  p {
    margin-bottom: 20px;
    line-height: 1.7;
    font-size: clamp(1.25rem, 2.5vw, 1.55rem);
    font-family: 'Playfair Display', serif;
  }
`;

const ImageContainer = styled.div`
  border-radius: 10px;
  overflow: hidden;
  width: 100%;

  @media (max-width: 768px) {
    max-height: 400px;
  }
`;

const AboutImage = styled.img`
  width: 100%;
  max-height: 400px;
  border-radius: 14px;
  object-fit: contain;
  display: block;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
`;

const CarouselContainer = styled.div`
  max-width: 1200px;
  margin: 15px auto 50px;
  position: relative;
  padding: 0 10px;

  .swiper {
    padding: 12px 4px 48px;
  }

  .swiper-pagination-bullet {
    background: #cbd5e1;
    opacity: 1;
    width: 9px;
    height: 9px;
    transition: all 0.3s ease;
  }

  .swiper-pagination-bullet-active {
    background: #0F8F46;
    width: 26px;
    border-radius: 6px;
  }
`;

const NavButton = styled.button`
  position: absolute;
  top: 40%;
  transform: translateY(-50%);
  z-index: 10;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1.5px solid rgba(15, 143, 70, 0.25);
  background: #FFFFFF;
  color: #0F8F46;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(15, 143, 70, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  font-size: 1.3rem;

  &.about-nav-prev {
    left: -20px;
  }

  &.about-nav-next {
    right: -20px;
  }

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #0F8F46 0%, #0B6B34 100%);
    color: #FFFFFF;
    border-color: #0F8F46;
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 12px 28px rgba(15, 143, 70, 0.35);
  }

  &:active:not(:disabled) {
    transform: translateY(-50%) scale(0.95);
  }

  &.swiper-button-disabled {
    opacity: 0.3;
    cursor: not-allowed;
    box-shadow: none;
    pointer-events: none;
  }

  @media (max-width: 1280px) {
    &.about-nav-prev { left: 4px; }
    &.about-nav-next { right: 4px; }
  }

  @media (max-width: 640px) {
    width: 42px;
    height: 42px;
    font-size: 1.1rem;
  }
`;

const VideoCard = styled.div`
  background: #FFFFFF;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 100%;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 38px rgba(0, 0, 0, 0.12);
  }
`;

const VideoWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 320px;
  background: #0a0a0a;
  overflow: hidden;
  border-radius: 20px 20px 0 0;

  @media (max-width: 600px) {
    height: 270px;
  }
`;

const VideoElement = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
  user-select: none;
`;

const VideoCardBody = styled.div`
  padding: 20px 22px 24px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  background: #FFFFFF;
`;

const Badge = styled.span`
  align-self: flex-start;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #0F8F46;
  background: rgba(15, 143, 70, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
  margin-bottom: 10px;
`;

const CardTitle = styled.h3`
  font-family: 'Playfair Display', serif;
  font-size: 1.18rem;
  color: #1e293b;
  margin: 0 0 8px;
  line-height: 1.35;
`;

const CardCaption = styled.p`
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.55;
  margin: 0;
  flex-grow: 1;
`;

const StorySection = styled.section`
  background-color: #FFFFFF;
  padding: 50px 30px;
  margin: 1px auto;
  max-width: 960px;
  border-radius: 30px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  color: #131212;
  text-align: center;

  h2 {
    font-family: 'Playfair Display', serif;
    font-weight: 400;
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    margin-bottom: 25px;
    color: #0F8F46;
    letter-spacing: 1px;
  }

  p {
    font-size: clamp(1.25rem, 2.2vw, 1.3rem);
    line-height: 1.75;
    white-space: pre-line;
    margin-bottom: 24px;
    font-family: 'Playfair Display', serif;
  }

  strong {
    color: #F58220;
  }

  @media (max-width: 768px) {
    padding: 30px 20px;
    border-radius: 20px;

    p:not(:last-child) {
      margin-bottom: 5px;
    }
  }
`;

// === Component ===

const About = () => {
  const videoRefs = useRef({});

  // Ensure all videos play automatically on mount
  useEffect(() => {
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        video.play().catch(() => {
          // Handled gracefully if browser blocks unmuted play
        });
      }
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AboutSection id="about">
        <SectionTitle>Our Story</SectionTitle>

        <ContentGrid>
          <TextContent>
            <p>
              Our story is one of heritage, harmony, and homegrown excellence. As a proudly Kenyan
              brand, Shanvilla represents more than just a collection of exquisite properties—it is a
              celebration of family, culture, and the diverse beauty of our land.
            </p>
            <p>
              Every stay with us is a tribute to over 50 years of tradition, personalized care, and
              deep-rooted respect for nature and community.
            </p>
          </TextContent>

          <ImageContainer>
            <AboutImage 
              src={logo} 
              alt="Shanvilla Resort Logo and Grounds"
            />
          </ImageContainer>
        </ContentGrid>

        {/* Video Card Carousel with Autoplay & Resort Amenities */}
        <CarouselContainer>
          <NavButton className="about-nav-prev" aria-label="Previous video">
            <i className="bi bi-chevron-left" />
          </NavButton>

          <Swiper
            modules={[Navigation, Pagination, A11y]}
            spaceBetween={24}
            slidesPerView={1}
            navigation={{
              prevEl: '.about-nav-prev',
              nextEl: '.about-nav-next',
            }}
            pagination={{ clickable: true }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
            }}
          >
            {ABOUT_VIDEOS.map((item, index) => (
              <SwiperSlide key={item.id}>
                <VideoCard>
                  <VideoWrapper>
                    <VideoElement
                      ref={(el) => { videoRefs.current[index] = el; }}
                      src={item.src}
                      autoPlay
                      muted
                      loop
                      playsInline
                      disablePictureInPicture
                      disableRemotePlayback
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </VideoElement>
                  </VideoWrapper>
                  <VideoCardBody>
                    <Badge>{item.badge}</Badge>
                    <CardTitle>{item.title}</CardTitle>
                    <CardCaption>{item.caption}</CardCaption>
                  </VideoCardBody>
                </VideoCard>
              </SwiperSlide>
            ))}
          </Swiper>

          <NavButton className="about-nav-next" aria-label="Next video">
            <i className="bi bi-chevron-right" />
          </NavButton>
        </CarouselContainer>

        <StorySection>
          <p>
            Welcome to Distinctive African Luxury and Warmth. Discover a world of elegance,
            comfort, and authenticity with Shanvilla Hotel and Resorts—your premier destination
            for remarkable stays in Kenya.
          </p>

          <hr />

          <p>
            Nestled in some of the country’s most scenic and culturally rich locations, Shanvilla is
            redefining African hospitality through a seamless blend of luxury, sustainability, and
            heartfelt service.
          </p>

          <hr />

          <p>
            Whether you seek a safari adventure, coastal bliss, or urban sophistication,
            Shanvilla ensures every moment is crafted with authenticity and grace.
          </p>

          <hr />

          <p>
            At Shanvilla, sustainability is not an option—it’s a way of life. Our commitment to the
            environment and our local communities shapes everything we do.
          </p>

          <hr />

          <p>
            <strong>Shanvilla Hotel & Resorts – place for you.</strong>
          </p>
        </StorySection>

      </AboutSection>
    </motion.div>
  );
};

export default About;
