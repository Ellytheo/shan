import React from "react";

const TermsAndPrivacy = () => {
  return (
    <div
      id="terms"
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
        lineHeight: "1.7",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "24px", color: "#A21B23" }}>
        Terms & Conditions and Privacy Policy
      </h2>

      {/* Terms & Conditions */}
      <section>
        <h3>1. Terms & Conditions</h3>
        <p>
          By accessing or using this website, application, or any of our services,
          you agree to be bound by these Terms and Conditions. These terms apply
          to all visitors, users, and others who access or use the service. If you
          disagree with any part of the terms, you may not access the service.
        </p>
        <ul>
          <li>
            You must be at least 18 years of age or have parental/guardian consent
            to use this platform.
          </li>
          <li>
            You agree not to use the platform for any unlawful, harmful, or abusive
            purposes, including spreading misinformation, violating intellectual
            property rights, or engaging in fraudulent activities.
          </li>
          <li>
            We reserve the right to suspend or terminate your access to our
            services at any time, without prior notice or liability, for any reason
            whatsoever, including breach of terms.
          </li>
          <li>
            All content, trademarks, and intellectual property on this platform
            remain the property of their respective owners and may not be used
            without explicit permission.
          </li>
        </ul>
      </section>

      {/* User Agreement */}
      <section>
        <h3>2. User Agreement</h3>
        <p>
          As a registered user of this platform, you are responsible for maintaining
          the confidentiality of your login credentials and for all activities that
          occur under your account. You agree to provide accurate, current, and
          complete information and to update such information as necessary.
        </p>
        <ul>
          <li>
            You are fully responsible for any activity conducted through your
            account, and you must notify us immediately of any unauthorized use.
          </li>
          <li>
            Any attempt to interfere with or compromise the security of the system
            is strictly prohibited.
          </li>
          <li>
            We may monitor and log user activity to ensure compliance with our
            terms and prevent misuse.
          </li>
          <li>
            You agree not to reproduce, duplicate, copy, sell, or exploit any
            portion of the service without express written permission.
          </li>
        </ul>
      </section>

      {/* Privacy Policy */}
      <section>
        <h3>3. Privacy Policy</h3>
        <p>
          Your privacy is important to us. This policy outlines how we collect,
          use, and safeguard your information when you visit or interact with our
          platform. We are committed to handling your data with integrity and
          transparency.
        </p>
        <ul>
          <li>
            We may collect personal data such as your name, email address, contact
            details, and usage behavior to enhance our services.
          </li>
          <li>
            Your data may be used to personalize content, improve performance, and
            communicate important updates or offers.
          </li>
          <li>
            We do not sell, rent, or lease your personal data to third parties
            without your consent, except as required by law.
          </li>
          <li>
            You have the right to access, correct, or request the deletion of your
            personal information by contacting our support team.
          </li>
          <li>
            Our platform uses cookies and similar technologies to improve user
            experience. You can manage your preferences in your browser settings.
          </li>
        </ul>
      </section>

      <p style={{ marginTop: "30px", fontSize: "0.9rem", color: "#555" }}>
        By continuing to access or use this platform, you acknowledge that you have
        read, understood, and agree to be legally bound by the above Terms &
        Conditions and Privacy Policy. If you have any questions or concerns,
        please contact our support team for clarification.
      </p>
    </div>
  );
};

export default TermsAndPrivacy;
