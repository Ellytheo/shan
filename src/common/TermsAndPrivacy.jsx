const TermsAndPrivacy = () => {
  return (
    <main
      id="terms"
      style={{
        maxWidth: '980px',
        margin: '0 auto',
        padding: '48px 24px',
        fontFamily: "'Inter', sans-serif",
        lineHeight: 1.8,
        color: '#24314A',
        background: '#F7F5EF',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 24px 64px rgba(15, 53, 96, 0.08)',
          padding: '36px 34px',
          border: '1px solid rgba(36, 49, 74, 0.08)',
        }}
      >
        <header style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ color: '#F58220', fontWeight: 700, letterSpacing: '0.16em', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '14px' }}>
            Privacy Policy
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.55rem', margin: 0, color: '#0F3B6A', lineHeight: 1.1 }}>
            Terms & Privacy for Shanvilla Resort
          </h1>
          <p style={{ marginTop: '16px', maxWidth: '740px', marginLeft: 'auto', marginRight: 'auto', color: '#4B5A73' }}>
            This page explains how we collect, use, and protect your information when you interact with Shanvilla Resort online.
          </p>
        </header>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.3rem', color: '#0F3B6A', marginBottom: '14px' }}>
            1. Information We Collect
          </h2>
          <p>
            We collect information that helps us deliver an excellent booking and resort experience. This includes:
          </p>
          <ul style={{ marginTop: '14px', paddingLeft: '1.15rem', color: '#4B5A73' }}>
            <li>Personal details like name, email, phone number, and reservation preferences.</li>
            <li>Travel details such as arrival dates, room choices, and special requests.</li>
            <li>Website behavior including pages visited, form submissions, and browsing interactions.</li>
            <li>Communication preferences when you sign up for newsletters or promotional updates.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.3rem', color: '#0F3B6A', marginBottom: '14px' }}>
            2. How We Use Your Data
          </h2>
          <p>
            Your information is used to personalize your stay, process reservations, and improve our service. We may also use data to:
          </p>
          <ul style={{ marginTop: '14px', paddingLeft: '1.15rem', color: '#4B5A73' }}>
            <li>Confirm and manage bookings or inquiries.</li>
            <li>Send updates about promotions, events, and resort news.</li>
            <li>Enhance website performance, design, and user experience.</li>
            <li>Protect against fraud and unauthorized access.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.3rem', color: '#0F3B6A', marginBottom: '14px' }}>
            3. Cookies & Tracking
          </h2>
          <p>
            We use cookies and similar technologies to remember your preferences and deliver a more seamless experience. You can control cookie settings through your browser, but some features may require cookies to function properly.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.3rem', color: '#0F3B6A', marginBottom: '14px' }}>
            4. Data Sharing and Disclosure
          </h2>
          <p>
            We do not sell your personal information. We may share data with trusted partners only when necessary to provide services, such as payment processors, booking platforms, and legal authorities when required by law.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.3rem', color: '#0F3B6A', marginBottom: '14px' }}>
            5. Your Rights
          </h2>
          <p>
            You may request access to the information we hold about you, ask for corrections, or request deletion where applicable. To exercise these rights, please contact our team directly.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.3rem', color: '#0F3B6A', marginBottom: '14px' }}>
            6. Security
          </h2>
          <p>
            We take reasonable steps to protect your data from unauthorized access, loss, or misuse. While no system is completely secure, we continually improve our safeguards.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.3rem', color: '#0F3B6A', marginBottom: '14px' }}>
            7. Contact Us
          </h2>
          <p>
            If you have questions about this policy or your personal data, please reach out to us at:
          </p>
          <p style={{ marginTop: '16px', color: '#4B5A73' }}>
            Email: <a href="mailto:reception@shanvillaresortkenya.co.ke" style={{ color: '#F58220', textDecoration: 'none' }}>reception@shanvillaresortkenya.co.ke</a><br />
            Phone: <strong>+254 111427894</strong>
          </p>
        </section>

        <footer style={{ marginTop: '34px', color: '#556575', fontSize: '0.95rem' }}>
          <p>
            By continuing to use Shanvilla Resort services and this website, you agree to this Privacy Policy and Terms. We may update this policy from time to time, and any changes will be posted here with the latest revision date.
          </p>
        </footer>
      </div>
    </main>
  );
};

export default TermsAndPrivacy;
