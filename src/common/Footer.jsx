import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaFacebookF, FaInstagram, FaSpinner, FaTiktok } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { FiSend } from 'react-icons/fi';

const FooterContainer = styled.footer`
  background: #b7d3d1c5;
  color: #0B1C1A;
  padding: 4rem 1.5rem 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 3rem;
  max-width: 1200px;
  margin: 0 auto 3rem;
  text-align: center;
`;

const FooterTitle = styled.h3`
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  margin-bottom: 1.5rem;
  font-weight: 700;
  color: #0B1C1A;
  position: relative;
  display: inline-block;
  
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: -8px;
    width: 40px;
    height: 2px;
    background: #0F8F46;
  }
`;

const FooterLink = styled.a`
  color: #16b616;
  text-decoration: none;
  display: block;
  margin-bottom: 0.8rem;
  transition: all 0.3s ease;
  font-size: 15px;

  &:hover {
    color: #e0b908;
    transform: translateY(-2px);
  }
`;

const ContactText = styled.p`
  color: #334155;
  margin-bottom: 1.2rem;
  font-size: 15px;
  line-height: 1.6;
`;

const SocialLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  font-size: 1.25rem;
  margin-top: 1.5rem;

  a {
    color: #0B1C1A;
    background: rgba(0, 0, 0, 0.05);
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;

    &:hover {
      color: #FFF;
      transform: translateY(-3px);
    }
  }

  a.social-fb:hover {
    background: #1877F2;
  }
  
  a.social-ig:hover {
    background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%);
  }

  a.social-tk:hover {
    background: #000000;
  }
`;

const NewsletterSection = styled(motion.div)`
  background: rgb(224, 218, 218);
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  text-align: center;
`;

const NewsletterInputWrapper = styled.form`
  display: flex;
  background: #FFF;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 1.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:focus-within {
    border-color: #0F8F46;
    box-shadow: 0 0 0 3px rgba(15, 143, 70, 0.15);
  }

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const NewsletterInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: #0B1C1A;
  font-size: 13px;
  outline: none;

  &::placeholder {
    color: #64748B;
  }
`;

const NewsletterButton = styled.button`
  background: #0F8F46 !important;
  color: #FFFFFF !important;
  padding: 0 0.65rem !important;
  border: none !important;
  font-weight: 800 !important;
  min-height: 48px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto !important;

  &:hover:not(:disabled) {
    background: #0a6b33 !important;
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: #94A3B8 !important;
    cursor: not-allowed;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const StatusMessage = styled.p`
  color: ${({ error }) => (error ? '#ef4444' : '#0F8F46')};
  font-size: 0.9rem;
  margin-top: 12px;
`;

const Divider = styled.hr`
  border: none;
  height: 1px;
  background: rgba(0, 0, 0, 0.2);
  margin: 0 auto 2rem;
  max-width: 1200px;
  width: 100%;
`;

const BottomRow = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #475569;
  font-size: 14px;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
  }

  div:last-child {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  a {
    color: #475569;
    text-decoration: none;
    transition: color 0.3s;

    &:hover {
      color: #0F8F46;
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
      }, 5000);
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
            <a className="social-fb" href="https://www.facebook.com/search/top/?q=Shanvilla%20Resort%20KE"><FaFacebookF /></a>
            <a className="social-ig" href="https://www.instagram.com/shanvillaresort/"><FaInstagram /></a>
            <a className="social-tk" href="https://www.tiktok.com/discover/shanvilla-resort-in-maragua"><FaTiktok /></a>
          </SocialLinks>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} variants={fadeIn}>
          <FooterTitle>Quick Links</FooterTitle>
          <FooterLink href="/#rooms">Rooms & Suites</FooterLink>
          <FooterLink href="/#about">About</FooterLink>
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
                onFocus={() => {
                  // Ping the server to wake it up from sleep early!
                  fetch('https://render-abct.onrender.com/subscribe', { method: 'HEAD' }).catch(() => {});
                }}
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
