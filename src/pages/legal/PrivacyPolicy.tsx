import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-enb-surface">
      {/* Header */}
      <div className="bg-enb-green text-white px-5 pt-12 pb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
            <p className="text-white/70 text-sm">Eco-Neighbor ($ENB)</p>
          </div>
        </div>
        <p className="text-white/60 text-xs mt-3">Last updated: May 1, 2026 · Version 1.0</p>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">

        <Section title="1. Who We Are">
          <p>
            Eco-Neighbor ($ENB) is a Regenerative Finance (ReFi) civic action platform operated by
            Eco-Neighbor, a company in the process of registration under the Companies Act, 2017 (Pakistan).
            Our platform is accessible at <strong>app.econeighbor.org</strong>. We reward informal economy
            workers, community volunteers, and neighbourhood businesses for verified civic actions using the
            $ENB token system.
          </p>
          <p className="mt-3">
            For questions about this Privacy Policy, contact us at{' '}
            <a href="mailto:info@econeighbor.org" className="text-enb-green font-medium underline">
              info@econeighbor.org
            </a>.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <SubSection title="2.1 Account Information">
            <p>When you register, we collect your full name, email address, WhatsApp number (optional),
            neighbourhood, and profession. This information is used solely to operate your account and
            personalise your experience on the Platform.</p>
          </SubSection>
          <SubSection title="2.2 Identity Verification (CNIC)">
            <p>To prevent fraud and maintain community integrity, we collect your Pakistani CNIC (National
            Identity Card) number and a photograph of your CNIC. CNIC photos are stored in a private,
            encrypted cloud storage system (Cloudinary signed preset) and are not publicly accessible.
            They are reviewed only by authorised administrators for verification purposes and are never
            shared with third parties.</p>
          </SubSection>
          <SubSection title="2.3 Civic Action Submissions">
            <p>When you submit a verified civic action, we collect photographs taken through the app
            camera (no uploads from your gallery are permitted), GPS coordinates at the time of
            submission, and a timestamp. This data is used to verify your action and award $ENB tokens.
            Before/After submissions include two geo-locked photographs.</p>
          </SubSection>
          <SubSection title="2.4 Transaction Data">
            <p>We record all SWAP transactions, $ENB balance changes, redemption QR events, and
            referral activity. This data is necessary to operate the token economy and is stored
            securely in our database.</p>
          </SubSection>
          <SubSection title="2.5 Device and Usage Data">
            <p>We collect standard technical information including your device type, browser version,
            and usage patterns within the app. This is used for platform stability and improvement only.</p>
          </SubSection>
        </Section>

        <Section title="3. How We Use Your Information">
          <ul className="space-y-2 text-enb-text-secondary text-sm leading-relaxed">
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>To operate your account and the $ENB reward system</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>To verify civic action submissions and award ENB.LOCAL tokens</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>To verify your identity and prevent fraud</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>To process SWAP transactions between you and business partners</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>To send you platform notifications and announcements</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>To generate anonymised community impact reports</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>To comply with applicable legal obligations in Pakistan</span></li>
          </ul>
          <p className="mt-4 text-sm text-enb-text-secondary">
            We do <strong>not</strong> sell your personal data to any third party. We do not use your data for
            targeted advertising. The Platform contains no advertisements.
          </p>
        </Section>

        <Section title="4. Data Storage and Security">
          <p>Your data is stored on Supabase (a PostgreSQL cloud database with row-level security) and
          Cloudinary (for media files). All data is encrypted in transit (TLS) and at rest. Access to
          your personal data within our systems is restricted to authorised personnel only, governed
          by role-based access controls.</p>
          <p className="mt-3">CNIC photos are stored under a private, signed cloud preset. They cannot be accessed
          via a public URL and require authenticated server-side generation of a signed access link.</p>
        </Section>

        <Section title="5. Data Retention">
          <p>We retain your account data for as long as your account remains active. If you request
          account deletion, all your personal data — including profile information, CNIC records,
          submissions, and transaction history — will be permanently and irreversibly deleted from
          our systems within 30 days of your request. Some anonymised, aggregated impact data
          (e.g., total civic actions completed in a neighbourhood) may be retained for reporting
          purposes without any personally identifiable information.</p>
        </Section>

        <Section title="6. Your Rights">
          <p>You have the right to:</p>
          <ul className="space-y-2 text-enb-text-secondary text-sm leading-relaxed mt-2">
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>Access the personal data we hold about you</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>Request correction of inaccurate data</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>Request deletion of your account and all associated data</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>Object to processing of your data in certain circumstances</span></li>
          </ul>
          <p className="mt-3 text-sm text-enb-text-secondary">
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:info@econeighbor.org" className="text-enb-green font-medium underline">
              info@econeighbor.org
            </a>.
          </p>
        </Section>

        <Section title="7. Cookies and Local Storage">
          <p>The Platform uses browser session storage solely to remember your splash screen preference.
          We do not use tracking cookies or third-party analytics cookies. Our analytics system
          (Umami) is self-hosted, privacy-respecting, and does not collect personally identifiable
          information.</p>
        </Section>

        <Section title="8. Third-Party Services">
          <p>We use the following third-party services to operate the Platform:</p>
          <ul className="space-y-2 text-enb-text-secondary text-sm leading-relaxed mt-2">
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span><strong>Supabase</strong> — database and authentication</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span><strong>Cloudinary</strong> — secure photo storage</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span><strong>Resend</strong> — email delivery (OTP and notifications)</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span><strong>Google Gemini</strong> — AI photo moderation (photos are processed but not stored by Google)</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span><strong>Vercel</strong> — application hosting</span></li>
          </ul>
          <p className="mt-3 text-sm text-enb-text-secondary">
            Each of these services has its own privacy policy. We have selected these providers based
            on their data security standards.
          </p>
        </Section>

        <Section title="9. Children">
          <p>The Platform is not intended for use by persons under the age of 18. We do not knowingly
          collect personal data from minors. If you believe a minor has registered on the Platform,
          please contact us immediately at{' '}
            <a href="mailto:info@econeighbor.org" className="text-enb-green font-medium underline">
              info@econeighbor.org
            </a>.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. Material changes will be communicated
          to registered users via the Platform's announcement system. The "Last updated" date at the
          top of this page will always reflect the current version.</p>
        </Section>

        {/* Footer nav */}
        <div className="pt-4 border-t border-enb-border flex flex-wrap gap-4 text-sm">
          <Link to="/terms" className="text-enb-green font-medium hover:underline">Terms & Conditions</Link>
          <Link to="/token-disclaimer" className="text-enb-green font-medium hover:underline">Token Disclaimer</Link>
          <Link to="/" className="text-enb-text-muted hover:text-enb-green transition-colors">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-enb-text-primary">{title}</h2>
      <div className="text-sm text-enb-text-secondary leading-relaxed">{children}</div>
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 space-y-1">
      <h3 className="text-sm font-semibold text-enb-text-primary">{title}</h3>
      <div className="text-sm text-enb-text-secondary leading-relaxed">{children}</div>
    </div>
  );
}
