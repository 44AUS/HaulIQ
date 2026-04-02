import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const EFFECTIVE_DATE = 'April 1, 2026';
const COMPANY = 'HaulIQ, Inc.';
const EMAIL = 'legal@hauliq.com';

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

export default function TermsOfService() {
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
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#e6edf3', marginBottom: 12 }}>Terms of Service</h1>
          <p style={{ color: '#6e7681', fontSize: 14 }}>
            Effective Date: <span style={{ color: '#8b949e' }}>{EFFECTIVE_DATE}</span>
            &nbsp;·&nbsp;
            Last Updated: <span style={{ color: '#8b949e' }}>{EFFECTIVE_DATE}</span>
          </p>
        </div>

        {/* Intro */}
        <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.18)', borderRadius: 12, padding: '18px 22px', marginBottom: 40, color: '#8b949e', fontSize: 14, lineHeight: 1.7 }}>
          Please read these Terms of Service carefully before using HaulIQ. By accessing or using our platform, you agree to be bound by these terms. If you do not agree, do not use the Service.
        </div>

        <Section title="1. Acceptance of Terms">
          <P>These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and {COMPANY} ("HaulIQ", "we", "us", or "our"), governing your access to and use of the HaulIQ platform, including our website, web application, APIs, and related services (collectively, the "Service").</P>
          <P>By creating an account, accessing, or using any part of the Service, you represent that you are at least 18 years of age, have the legal authority to enter into this agreement, and agree to comply with these Terms and all applicable laws and regulations.</P>
        </Section>

        <Section title="2. Description of Service">
          <P>HaulIQ is a freight technology platform that connects carriers and freight brokers. The Service includes, but is not limited to:</P>
          <UL items={[
            'A load board where brokers post freight loads and carriers search and book them',
            'Profit analysis tools including net profit estimates and rate-per-mile calculations',
            'Broker trust and rating system with review functionality',
            'Instant Book functionality for pre-approved carriers',
            'Freight payment and escrow processing',
            'Load tracking, booking management, and document storage',
            'Analytics dashboards for carriers and brokers',
          ]} />
          <P>HaulIQ is a technology intermediary only. We do not broker freight, act as a motor carrier, or assume liability for the transportation of goods. All freight arrangements are made directly between carriers and brokers.</P>
        </Section>

        <Section title="3. User Accounts">
          <P><strong style={{ color: '#e6edf3' }}>Registration.</strong> To access the Service, you must create an account and provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account.</P>
          <P><strong style={{ color: '#e6edf3' }}>Account Types.</strong> HaulIQ offers two primary account types: Carrier accounts (for motor carriers and owner-operators) and Broker accounts (for licensed freight brokers). You must accurately represent your role and hold any required licenses or operating authority.</P>
          <P><strong style={{ color: '#e6edf3' }}>Prohibited Accounts.</strong> You may not create an account if you have been previously suspended or banned from the Service, or if creating an account would violate any applicable law.</P>
        </Section>

        <Section title="4. Carrier Obligations">
          <P>As a carrier using HaulIQ, you represent and warrant that:</P>
          <UL items={[
            'You hold a valid USDOT number and MC authority (where required) issued by the FMCSA',
            'You maintain all required insurance coverage, including minimum cargo and liability insurance',
            'You will only accept loads you have the capacity and legal authority to haul',
            'You will honor booked loads and communicate promptly regarding any changes',
            'You will not misrepresent your equipment type, capacity, or operating authority',
            'All drivers operating under your account are properly licensed and compliant with Hours of Service regulations',
          ]} />
        </Section>

        <Section title="5. Broker Obligations">
          <P>As a broker using HaulIQ, you represent and warrant that:</P>
          <UL items={[
            'You hold a valid freight broker license (MC authority) issued by the FMCSA',
            'All loads posted are legitimate freight shipments with accurate details',
            'You will pay carriers the agreed-upon rate within the agreed payment terms',
            'You will not post fraudulent, misleading, or duplicate loads',
            'You are authorized to post the freight on behalf of the shipper',
            'You will not use HaulIQ to solicit carriers outside the platform to avoid fees',
          ]} />
        </Section>

        <Section title="6. Payments and Fees">
          <P><strong style={{ color: '#e6edf3' }}>Subscription Plans.</strong> Access to certain features requires a paid subscription. Subscription fees are billed in advance on a monthly basis and are non-refundable except as required by law.</P>
          <P><strong style={{ color: '#e6edf3' }}>Freight Payments.</strong> HaulIQ offers an optional escrow-based freight payment service. When used, HaulIQ collects payment from the broker and releases funds to the carrier upon delivery confirmation, less a platform fee. HaulIQ is not responsible for disputes between carriers and brokers regarding payment outside of this service.</P>
          <P><strong style={{ color: '#e6edf3' }}>Price Changes.</strong> We reserve the right to change subscription pricing with 30 days' notice. Continued use after a price change constitutes acceptance of the new pricing.</P>
        </Section>

        <Section title="7. Reviews and Ratings">
          <P>HaulIQ allows users to post reviews and ratings of brokers and carriers. By posting a review, you represent that it reflects your genuine experience and does not contain false, defamatory, or misleading information. HaulIQ reserves the right to remove reviews that violate these Terms or our community standards.</P>
          <P>You may not offer or accept compensation in exchange for reviews, or post reviews about your own business or a competitor's business.</P>
        </Section>

        <Section title="8. Prohibited Conduct">
          <P>You agree not to:</P>
          <UL items={[
            'Use the Service for any unlawful purpose or in violation of any applicable law',
            'Post false, misleading, or fraudulent load listings',
            'Attempt to circumvent any security features or access controls',
            'Scrape, crawl, or harvest data from the Service without written permission',
            'Impersonate another user, person, or entity',
            'Interfere with or disrupt the integrity or performance of the Service',
            'Use the Service to send spam, unsolicited communications, or phishing attempts',
            'Reverse engineer, decompile, or attempt to extract source code from the Service',
            'Engage in any conduct that could damage HaulIQ\'s reputation or business',
          ]} />
        </Section>

        <Section title="9. Intellectual Property">
          <P>The Service and all content, features, and functionality (including but not limited to text, graphics, logos, software, and data compilations) are owned by HaulIQ or its licensors and are protected by copyright, trademark, and other intellectual property laws.</P>
          <P>We grant you a limited, non-exclusive, non-transferable, revocable license to use the Service for its intended purpose in accordance with these Terms. You may not copy, modify, distribute, sell, or lease any part of the Service.</P>
        </Section>

        <Section title="10. Disclaimers and Limitation of Liability">
          <P><strong style={{ color: '#e6edf3' }}>No Transportation Services.</strong> HaulIQ is a technology platform only. We are not a freight broker, motor carrier, or freight forwarder. We do not assume any liability for the transportation, loss, or damage of freight.</P>
          <P><strong style={{ color: '#e6edf3' }}>Service "As Is".</strong> THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</P>
          <P><strong style={{ color: '#e6edf3' }}>Limitation of Liability.</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, HAULIQ SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE GREATER OF $100 OR THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS.</P>
        </Section>

        <Section title="11. Indemnification">
          <P>You agree to indemnify, defend, and hold harmless HaulIQ and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising from: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any applicable law or third-party rights; or (d) any freight transaction you enter into through the Service.</P>
        </Section>

        <Section title="12. Termination">
          <P>We may suspend or terminate your account at any time, with or without notice, for conduct that violates these Terms, poses a risk to other users or the platform, or for any other reason at our sole discretion.</P>
          <P>You may terminate your account at any time by contacting us at {EMAIL}. Upon termination, your right to use the Service immediately ceases. Provisions that by their nature should survive termination will continue to apply.</P>
        </Section>

        <Section title="13. Governing Law and Dispute Resolution">
          <P>These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to conflict of law principles.</P>
          <P>Any dispute arising from these Terms or the Service shall first be submitted to good-faith mediation. If mediation fails, disputes shall be resolved by binding arbitration under the American Arbitration Association's Commercial Arbitration Rules. Class action and jury trial rights are waived to the extent permitted by law.</P>
        </Section>

        <Section title="14. Changes to Terms">
          <P>We reserve the right to modify these Terms at any time. We will provide notice of material changes by updating the "Effective Date" at the top of this page and, where appropriate, by sending an email notification. Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms.</P>
        </Section>

        <Section title="15. Contact Us">
          <P>If you have any questions about these Terms, please contact us:</P>
          <div style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: 10, padding: '16px 20px', fontSize: 14 }}>
            <p style={{ margin: '0 0 4px' }}><strong style={{ color: '#e6edf3' }}>{COMPANY}</strong></p>
            <p style={{ margin: '0 0 4px', color: '#8b949e' }}>Email: <a href={`mailto:${EMAIL}`} style={{ color: '#0ea5e9', textDecoration: 'none' }}>{EMAIL}</a></p>
          </div>
        </Section>

        {/* Footer nav */}
        <div style={{ borderTop: '1px solid rgba(48,54,61,0.5)', paddingTop: 28, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: '#0ea5e9', fontSize: 14, textDecoration: 'none' }}>← Back to Home</Link>
          <Link to="/privacy" style={{ color: '#6e7681', fontSize: 14, textDecoration: 'none' }}>Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
