import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaFacebookF, FaInstagram, FaSpinner, FaTiktok } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { FiSend } from 'react-icons/fi';

const FooterContainer = styled.footer`
  background: #b7d3d1c5;
  color: #1f2937;
  padding: 2.2rem 1.5rem 1.75rem;
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.8rem;
  max-width: 1200px;
  margin: 0 auto 1.8rem;
`;

const FooterTitle = styled.h3`
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  margin-bottom: 1.1rem;
  font-weight: bold;
  color: #0f172a;
`;

const FooterLink = styled.a`
  color: #334155;
  text-decoration: none;
  display: block;
  margin-bottom: 0.65rem;
  transition: color 0.3s ease;

  &:hover {
    color: #F7B75E;
  }
`;

const ContactText = styled.p`
  color: #334155;
  margin-bottom: 1rem;
  font-size: 14px;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 0.85rem;
  font-size: 1.15rem;
  margin-top: 1rem;

  a {
    color: #1f2937;
    transition: color 0.3s ease;

    &:hover {
      color:rgb(221, 189, 8);
    }
  }
`;

const NewsletterSection = styled(motion.div)`
  background: #50a5f5;
  padding: 1.15rem 1.2rem;
  border-radius: 10px;
  text-align: center;
`;

const NewsletterInputWrapper = styled.form`
  display: flex;
  background: #FAF5EF;
  border-radius: 50px;
  overflow: hidden;
  margin-top: 1rem;

  @media (max-width: 500px) {
    flex-direction: column;
    border-radius: 8px;
  }
`;

const NewsletterInput = styled.input`
  flex: 4;
  padding: 10px 4px;
  border: none;
  font-size: 14px;
  outline: none;
`;

const NewsletterButton = styled.button`
  background: #e5eef1;
  color: #489aec;
  padding: 10px 10px;
  border: none;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    background: #93e0eb;
  }
`;

const StatusMessage = styled.p`
  color: ${({ error }) => (error ? '#ff6b6b' : '#dee7de')};
  font-size: 0.9rem;
  margin-top: 10px;
`;

const Divider = styled.hr`
  border: none;
  height: 1px;
  background-color: #1d3b5c;
  margin: 2rem auto 1.4rem;
  max-width: 1200px;
`;

const BottomRow = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #334155;
  font-size: 14px;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
  }

  a {
    color: #334155;
    margin: 0 0.75rem;
    text-decoration: none;
    transition: color 0.3s;

    &:hover {
      color: #085dfc;
    }
  }
`;

const fadeIn = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.2, duration: 0.6 },
  }),
};

const Footer = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const statusTimerRef = useRef(null);

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
      statusTimerRef.current = window.setTimeout(() => {
        setStatus(null);
        setErrorMsg('');
      }, 120000);
    }

    return () => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
        statusTimerRef.current = null;
      }
    };
  }, [status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('https://render-abct.onrender.com/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Subscription failed');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error, please try again.');
      setStatus('error');
    }
  };

  return (
    <FooterContainer>
      <FooterGrid>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeIn}>
          <FooterTitle>SHANVILLA RESORT LTD</FooterTitle>
          <ContactText>
            Experience unparalleled comfort and authentic Kenyan warmth in Maragua, Murang’a County.
          </ContactText>
          <SocialLinks>
            <a href="https://www.facebook.com/search/top/?q=Shanvilla%20Resort%20KE"><FaFacebookF /></a>
            <a href="https://www.instagram.com/shanvillaresort/"><FaInstagram /></a>
            <a href="https://www.tiktok.com/discover/shanvilla-resort-in-maragua"><FaTiktok /></a>
          </SocialLinks>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} variants={fadeIn}>
          <FooterTitle>Quick Links</FooterTitle>
          <FooterLink href="/#rooms">Rooms & Suites</FooterLink>
          <FooterLink href="/#about">about</FooterLink>
          <FooterLink href="/#amenities">Amenities</FooterLink>
          <FooterLink href="/#reviews">Booking</FooterLink>
          <FooterLink href="/#contact">Contact Us</FooterLink>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3} variants={fadeIn}>
          <FooterTitle>Contact</FooterTitle>
          <ContactText>Maragua, Murang’a County, Kenya</ContactText>
          <ContactText>Phone: +254 111427894</ContactText>
          <ContactText>Email: reception@shanvillaresortkenya.co.ke</ContactText>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={4} variants={fadeIn}>
          <NewsletterSection>
            <FooterTitle>Newsletter</FooterTitle>
            <ContactText>Subscribe for exclusive updates and offers.</ContactText>
            <NewsletterInputWrapper onSubmit={handleSubmit}>
              <NewsletterInput
                type="email"
                placeholder="Your email address"
                required
                value={email}
                disabled={status === 'loading'}
                onChange={(e) => setEmail(e.target.value)}
              />
              <NewsletterButton type="submit" disabled={status === 'loading'}>
                 {status === 'loading' ? <FaSpinner className="spin" /> : <FiSend size={20} />}
              </NewsletterButton>
            </NewsletterInputWrapper>
            {status === 'success' && <StatusMessage>Subscribed successfully!</StatusMessage>}
            {status === 'error' && <StatusMessage error>{errorMsg}</StatusMessage>}
          </NewsletterSection>
        </motion.div>
      </FooterGrid>

      <Divider />

      <BottomRow>
        <div>© {new Date().getFullYear()} Shanvilla Resort Ltd. All rights reserved.</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <FooterLink href="/terms">Privacy</FooterLink>
          <FooterLink href="/terms">Terms</FooterLink>
          <FooterLink href="/#home">Sitemap</FooterLink>
        </div>
      </BottomRow>
    </FooterContainer>
  );
};

export default Footer;
