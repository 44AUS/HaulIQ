import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const EFFECTIVE_DATE = 'April 1, 2026';
const COMPANY = 'Urload, Inc.';
const EMAIL = 'privacy@hauliq.com';

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ color: '#e6edf3', fontSize: 20, fontWeight: 700, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid rgba(48,54,61,0.5)' }}>
        {title}
      </h2>
      <div style={{ color: '#8b949e', fontSize: 15, lineHeight: 1.85 }}>
        {children}
      </div>
    </section>
  );
}

function P({ children }) {
  return <p style={{ marginBottom: 12 }}>{children}</p>;
}

function UL({ items }) {
  return (
    <ul style={{ paddingLeft: 20, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <li key={i} style={{ listStyleType: 'disc' }}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPolicy() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3' }}>
      <Navbar />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 100px' }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-block', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#0ea5e9', letterSpacing: '0.06em', marginBottom: 16 }}>
            LEGAL
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#e6edf3', marginBottom: 12 }}>Privacy Policy</h1>
          <p style={{ color: '#6e7681', fontSize: 14 }}>
            Effective Date: <span style={{ color: '#8b949e' }}>{EFFECTIVE_DATE}</span>
            &nbsp;·&nbsp;
            Last Updated: <span style={{ color: '#8b949e' }}>{EFFECTIVE_DATE}</span>
          </p>
        </div>

        {/* Intro */}
        <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.18)', borderRadius: 12, padding: '18px 22px', marginBottom: 40, color: '#8b949e', fontSize: 14, lineHeight: 1.7 }}>
          Your privacy matters to us. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information when you use the Urload platform.
        </div>

        <Section title="1. Who We Are">
          <P>{COMPANY} ("Urload", "we", "us", or "our") operates the Urload freight technology platform. This Privacy Policy applies to all users of our website and web application (collectively, the "Service").</P>
          <P>For questions about this policy or to exercise your privacy rights, contact our privacy team at <a href={`mailto:${EMAIL}`} style={{ color: '#0ea5e9', textDecoration: 'none' }}>{EMAIL}</a>.</P>
        </Section>

        <Section title="2. Information We Collect">
          <P><strong style={{ color: '#e6edf3' }}>Information You Provide Directly</strong></P>
          <UL items={[
            'Account information: name, email address, phone number, company name',
            'Professional details: MC number, USDOT number, operating authority, insurance information',
            'Business address and location information',
            'Payment information (processed securely by our payment processor; we do not store full card numbers)',
            'Load postings including origin, destination, rate, commodity, and other freight details',
            'Reviews, ratings, and feedback you submit about other users',
            'Communications with our support team',
            'Profile information and preferences you set within the platform',
          ]} />
          <P><strong style={{ color: '#e6edf3' }}>Information Collected Automatically</strong></P>
          <UL items={[
            'Log data: IP address, browser type, pages visited, timestamps, referring URLs',
            'Device information: hardware model, operating system, unique device identifiers',
            'Usage data: features used, search queries, load views, booking activity',
            'Location data: approximate location inferred from IP address (we do not collect precise GPS location)',
            'Cookies and similar tracking technologies (see Section 7)',
          ]} />
          <P><strong style={{ color: '#e6edf3' }}>Information from Third Parties</strong></P>
          <UL items={[
            'FMCSA public records for MC number and USDOT verification',
            'Fuel price data from the U.S. Energy Information Administration (EIA)',
            'Address and routing data from Google Maps APIs',
            'Payment processing data from our payment processor',
          ]} />
        </Section>

        <Section title="3. How We Use Your Information">
          <P>We use the information we collect to:</P>
          <UL items={[
            'Create and manage your account and authenticate your identity',
            'Provide, operate, and improve the Service',
            'Match carriers with available loads and facilitate bookings',
            'Process payments and manage escrow transactions',
            'Calculate profit estimates, rate-per-mile, fuel costs, and other analytics',
            'Verify your operating authority and compliance information',
            'Display broker trust scores and reviews to carriers',
            'Send transactional notifications (booking confirmations, payment updates, load status)',
            'Send service communications and product updates (you may opt out of marketing emails)',
            'Detect, prevent, and investigate fraud, abuse, and security incidents',
            'Comply with legal obligations and enforce our Terms of Service',
            'Respond to support requests and improve customer service',
          ]} />
        </Section>

        <Section title="4. How We Share Your Information">
          <P><strong style={{ color: '#e6edf3' }}>With Other Users.</strong> Certain information is visible to other users as part of the Service's core functionality. Broker names, ratings, and company information are visible to carriers browsing loads. Carrier information (name, MC number, ratings) may be visible to brokers. Full pickup/delivery addresses are only shared after a load is booked.</P>
          <P><strong style={{ color: '#e6edf3' }}>With Service Providers.</strong> We share information with trusted third-party vendors who help us operate the Service, including cloud hosting providers, payment processors, email delivery services, analytics providers, and customer support tools. These providers are contractually obligated to protect your information.</P>
          <P><strong style={{ color: '#e6edf3' }}>For Legal Reasons.</strong> We may disclose information if required by law, court order, or government authority, or when we believe disclosure is necessary to protect the rights, property, or safety of Urload, our users, or the public.</P>
          <P><strong style={{ color: '#e6edf3' }}>Business Transfers.</strong> In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of that transaction. We will notify you of any such change.</P>
          <P><strong style={{ color: '#e6edf3' }}>We Do Not Sell Your Data.</strong> Urload does not sell, rent, or trade your personal information to third parties for their marketing purposes.</P>
        </Section>

        <Section title="5. Data Retention">
          <P>We retain your account information for as long as your account is active or as needed to provide you the Service. If you delete your account, we will delete or anonymize your personal information within 90 days, except where retention is required by law (e.g., payment records, tax documentation) or to resolve disputes.</P>
          <P>Load history, transaction records, and review data may be retained longer to maintain the integrity of the platform's trust and rating system.</P>
        </Section>

        <Section title="6. Data Security">
          <P>We implement industry-standard security measures to protect your information, including:</P>
          <UL items={[
            'TLS/HTTPS encryption for all data in transit',
            'Encrypted storage for sensitive data at rest',
            'JWT-based authentication with short-lived tokens',
            'Access controls limiting employee access to personal data',
            'Regular security reviews and monitoring',
          ]} />
          <P>No method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security. If you suspect unauthorized access to your account, contact us immediately at {EMAIL}.</P>
        </Section>

        <Section title="7. Cookies and Tracking">
          <P>We use cookies and similar technologies to:</P>
          <UL items={[
            'Keep you logged in and maintain session state',
            'Remember your preferences and settings',
            'Analyze platform usage and improve features',
            'Detect security threats and prevent fraud',
          ]} />
          <P>We use essential cookies (required for the Service to function) and analytics cookies. We do not use advertising or third-party tracking cookies. You can manage cookie preferences through your browser settings, though disabling essential cookies may affect Service functionality.</P>
        </Section>

        <Section title="8. Your Privacy Rights">
          <P>Depending on your location, you may have the following rights regarding your personal information:</P>
          <UL items={[
            'Access: request a copy of the personal information we hold about you',
            'Correction: request that inaccurate or incomplete information be corrected',
            'Deletion: request that we delete your personal information (subject to legal retention requirements)',
            'Portability: request a machine-readable copy of your data',
            'Opt-out: unsubscribe from marketing emails at any time via the unsubscribe link',
            'Restriction: request that we limit how we process your information in certain circumstances',
          ]} />
          <P>To exercise any of these rights, contact us at <a href={`mailto:${EMAIL}`} style={{ color: '#0ea5e9', textDecoration: 'none' }}>{EMAIL}</a>. We will respond within 30 days.</P>
          <P><strong style={{ color: '#e6edf3' }}>California Residents (CCPA).</strong> California residents have additional rights under the California Consumer Privacy Act, including the right to know what personal information is collected, the right to delete, and the right to opt out of the sale of personal information. We do not sell personal information. To submit a CCPA request, contact us at the email above.</P>
        </Section>

        <Section title="9. Children's Privacy">
          <P>The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a minor has created an account, we will delete their information promptly. If you believe a minor has provided us information, contact us at {EMAIL}.</P>
        </Section>

        <Section title="10. Third-Party Links">
          <P>The Service may contain links to third-party websites or services. This Privacy Policy does not apply to those third parties, and we are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party sites you visit.</P>
        </Section>

        <Section title="11. Changes to This Policy">
          <P>We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the "Effective Date" above and, where required, by sending an email to the address associated with your account. Your continued use of the Service after changes take effect constitutes acceptance of the revised policy.</P>
        </Section>

        <Section title="12. Contact Us">
          <P>For privacy-related questions, requests, or concerns, please reach out:</P>
          <div style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: 10, padding: '16px 20px', fontSize: 14 }}>
            <p style={{ margin: '0 0 4px' }}><strong style={{ color: '#e6edf3' }}>{COMPANY}</strong></p>
            <p style={{ margin: '0 0 4px', color: '#8b949e' }}>Privacy inquiries: <a href={`mailto:${EMAIL}`} style={{ color: '#0ea5e9', textDecoration: 'none' }}>{EMAIL}</a></p>
            <p style={{ margin: 0, color: '#8b949e' }}>Legal matters: <a href="mailto:legal@hauliq.com" style={{ color: '#0ea5e9', textDecoration: 'none' }}>legal@hauliq.com</a></p>
          </div>
        </Section>

        {/* Footer nav */}
        <div style={{ borderTop: '1px solid rgba(48,54,61,0.5)', paddingTop: 28, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: '#0ea5e9', fontSize: 14, textDecoration: 'none' }}>← Back to Home</Link>
          <Link to="/terms" style={{ color: '#6e7681', fontSize: 14, textDecoration: 'none' }}>Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
