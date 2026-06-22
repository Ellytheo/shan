import styled from 'styled-components';
import { motion } from 'framer-motion';

import logo from '../images/logo2.jpg';
// === Styled Components ===

const AboutSection = styled.section`
  padding: 40px 20px;
  background-color: #FFFFFF;

  @media (max-width: 768px) {
    padding: 60px 30px;
  }

  @media (max-width: 480px) {
    padding: 40px 30px;
  }
`;

const SectionTitle = styled.h2`
  font-family: 'Kings', cursive;
  text-align: center;
  margin-bottom: 20px;
  color: #0F8F46;
  padding:10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.59);
  font-size: clamp(2rem, 3vw, 2.5rem);
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;

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
    line-height: 1.6;
    font-size: clamp(1rem, 1.5vw, 1.25rem);
    font-family: 'My Soul', cursive;
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
  margin-bottom:20px;
`;

const VideoElement = styled.video`
  width: 100%;
  max-height: 600px;
  border-radius: 14px;
  object-fit: cover;
  display: block;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.33);
`;


const StorySection = styled.section`
  background-color: #FFFFFF;
  padding: 50px 30px;
  margin: 1px auto;
  max-width: 960px;
  border-radius: 30px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  color: #0c0c0c;
  text-align: center;

  h2 {
    font-family: "Kaushan Script", cursive;
    font-weight: 700;
    font-size: clamp(2rem, 4vw, 3rem);
    margin-bottom: 25px;
    color: #0F8F46;
    letter-spacing: 1px;
  }

  p {
    font-size: clamp(0.95rem, 1.5vw, 1.1rem);
    line-height: 1.85;
    white-space: pre-line;
    margin-bottom: 24px;
    font-family: "Kaushan Script", cursive;
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
              alt="Aerial view of Shanvilla Resort showing luxury bungalows on the beach"
            />
          </ImageContainer>
        </ContentGrid>
        <ImageContainer>
  <VideoElement
    src="/videos/Shanvilla.mp4"
    muted
    autoPlay
    loop
    playsInline
    controls
    preload="auto"
  >
    Your browser does not support the video tag.
  </VideoElement>
</ImageContainer>

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
