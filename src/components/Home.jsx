import { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { FaArrowRight } from "react-icons/fa";

import dis1 from '../images/shan1.jpg';
import dis2 from '../images/shan3.jpg';
import dis3 from '../images/shan2.jpg';
import dis4 from '../images/shan4.jpg';
import dis5 from '../images/logo.png';

const zoom = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const HeroSector = styled.section`
  min-height: 80vh;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  flex-direction: column;
  text-align: center;
`;

const HeroSection = styled.section`
  min-height: 80vh;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  flex-direction: column;
  text-align: center;

 &::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("../images/heroimgg.jpeg");
  background-size: cover;
  background-position: center;
  filter: brightness(1) contrast(1) saturate(1.05);
  background-color: rgba(200, 238, 238, 0); /* strong navy blue */
  background-blend-mode: multiply;
  animation: ${zoom} 30s ease-in-out infinite;
  z-index: 0;
  border-radius: 40px;
}
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  max-width: 900px;
  background: rgba(250, 245, 239, 0.34);
  border-radius: 30px;
  box-shadow: 0 10px 30px rgba(255, 201, 150, 0.45);
  padding: 30px 40px;
  width: 100%;

  @media (max-width: 768px) {
    padding: 30px;
  }
`;

const HeroParagraph = styled.p`
  font-family: 'Playfair Display', serif;
  font-weight: 400;
  font-size: 1.3rem;
  color: rgb(226, 57, 57);
  line-height: 1.85;
  max-width: 650px;
  margin: 0 auto 20px;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }

  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

const Button = styled.button`
  background: linear-gradient(45deg, #ff6f61, #ffd166);
  box-shadow: 0 4px 15px rgba(255, 209, 134, 0.4);
  font-weight: 700;
  padding: 16px 48px;
  border-radius: 50px;
  border: none;
  color: #4a4a4a;
  font-size: 1.1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  transition: all 0.35s ease;

  svg {
    transition: transform 0.35s ease;
  }

  &:hover {
    background: linear-gradient(45deg, #ffd166, #4ecdc4);
    box-shadow: 0 8px 30px rgba(78, 205, 196, 0.7);
    transform: scale(1.1);

    svg {
      transform: translateX(6px);
      color: #ffd166;
    }
  }

  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
    padding: 18px 0;
  }
`;

const SectionTitle = styled.h2`
  font-family: 'Playfair Display', serif;
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 20px;
  color: rgba(245, 9, 9, 1);

  @media (max-width: 576px) {
    font-size: 0.8rem;
  }
`;

const SectionDescription = styled.p`
  color: #000;
  font-size: 1.75rem;
  max-width: 700px;
  margin: 0 auto 40px;
  font-family: "Playfair Display", serif;

  @media (max-width: 576px) {
    font-size: 1.1rem;
  }
`;

const HighlightText = styled.div`
  padding: 20px;

  h3 {
    font-family: 'Playfair Display', serif;
    font-size: 1.8rem;
    color: rgba(245, 9, 9, 1);

    @media (max-width: 768px) {
      font-size: 1.5rem;
    }
  }

  p {
    font-family: "Playfair Display", serif;
    font-size: 1.75rem;
    color: #050505;

    @media (max-width: 768px) {
      font-size: 1.4rem;
    }
  }

  a {
    font-family: 'Playfair Display', serif;
    text-decoration: none;
    color: #d97706;
    font-weight: bold;
    font-size: 2rem;
    display: inline-flex;
    align-items: center;
    gap: 5px;

    &:hover {
      color: rgb(74, 228, 233);
    }

    @media (max-width: 768px) {
      font-size:1.3rem;
    }
  }
`;

const ImageCard = styled.div`
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  position: relative;
  transform: translateZ(0);

  @media (min-width: 768px) {
    margin-bottom: 0;
  }
`;

const AnimatedImage = styled.img`
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
  border-radius: 12px;
  will-change: transform, opacity;
  
  /* Slide from the hidden side based on the direction prop, stopping at the boundary (translateX(0)) */
  transform: ${props => 
    props.$isInView 
      ? 'translateX(0)' 
      : (props.$direction === 'left' ? 'translateX(-100%)' : 'translateX(100%)')
  };
  opacity: ${props => props.$isInView ? 1 : 0};
  
  transition: transform 0.9s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.9s ease-out;
  transition-delay: ${props => props.$isInView ? props.$delay || '0s' : '0s'};
`;

const ScrollHighlightImage = ({ src, alt, delay, direction }) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        } else {
          setIsInView(false); // reset so it triggers every time the user scrolls back into it
        }
      },
      {
        threshold: 0.1, // trigger when 10% of the image is visible
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <ImageCard ref={ref}>
      <AnimatedImage
        src={src}
        alt={alt}
        loading="lazy"
        $isInView={isInView}
        $delay={delay}
        $direction={direction}
      />
    </ImageCard>
  );
};

const HeroOverlay = styled.div`
  position: relative;
  width: 100%;
  z-index: 2;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;


const Home = () => {
  return (
    <>
      <HeroSector id="home">
        <video autoPlay loop muted playsInline className="hero-video">
          <source src="/videos/shanvilla2.mp4" type="video/mp4" />
        </video>
        <HeroContent>
          <HeroSection>
            <HeroContent>

             <HeroOverlay>
  <img
    src={dis5}
    alt="Shanvilla Resort"
    style={{
      width: '100%',
      maxWidth: '400px', // Optional: controls the max size
      height: 'auto',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      objectFit: 'cover',
      display: 'block',
      margin: '0 auto'
    }}
  />
</HeroOverlay>



              <HeroParagraph>
                Your luxury peaceful destination
              </HeroParagraph>

              <a href="#about">
                <Button>
                  Learn More About Us <FaArrowRight />
                </Button>
              </a>
            </HeroContent>
          </HeroSection>

          <HeroParagraph>
            Discover distinctive African luxury at Shanvilla — where elegance, culture, and
            nature come together for unforgettable stays across Kenya.
          </HeroParagraph>
        </HeroContent>
      </HeroSector>

      <section className="py-5" style={{ backgroundColor: '#FAF2E7' }}>
        <div className="container text-center mb-5">
          <SectionTitle>Discover Shanvilla</SectionTitle>
          <div style={{ width: '90px', height: '4px', backgroundColor: '#d97706', margin: '0 auto 10px' }}></div>
          <SectionDescription>
            Experience the perfect blend of luxury, comfort, and natural beauty at our exclusive resort. Every detail has been carefully curated to ensure an unforgettable stay.
          </SectionDescription>
        </div>

        <div className="container">
          {[
            {
              title: "Luxury Accommodation",
              desc: "Indulge in our meticulously designed suites and villas with breathtaking views.",
              linkText: "Explore Rooms",
              linkHref: "#rooms",
              img: dis1
            },
            {
              title: "Outdoor Gardens",
              desc: "Rejuvenate your body and mind with fresh peace and freshness in our annah gardens.",
              linkText: "View Our Gallery",
              linkHref: "#gallery",
              img: dis2
            },
            {
              title: "Fine Dining",
              desc: "Savor exquisite cuisine prepared by our world-class chefs using local ingredients.",
              linkText: "View Restaurants",
              linkHref: "#gallery",
              img: dis3
            },
            {
              title: "Exclusive Experiences",
              desc: "Create unforgettable memories with our curated collection of activities.",
              linkText: "Explore Amenities",
              linkHref: "#amenities",
              img: dis4
            }
          ].map((item, index) => (
            <div className="row align-items-center mb-5" key={item.title}>
              <div className={`col-12 col-md-6 ${index % 2 !== 0 ? 'order-md-2' : ''}`}>
                <ScrollHighlightImage
                  src={item.img}
                  alt={item.title}
                  delay={`${index * 0.13}s`}
                  direction={index % 2 === 0 ? 'right' : 'left'}
                />
              </div>
              <div className={`col-12 col-md-6 ${index % 2 !== 0 ? 'order-md-1' : ''}`}>
                <HighlightText>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <a href={item.linkHref}>
                    {item.linkText} <i className="bi bi-arrow-right"></i>
                  </a>
                </HighlightText>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Home;
