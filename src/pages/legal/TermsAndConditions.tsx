import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-enb-surface">
      {/* Header */}
      <div className="bg-enb-dark text-white px-5 pt-12 pb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Terms & Conditions</h1>
            <p className="text-white/70 text-sm">Eco-Neighbor ($ENB)</p>
          </div>
        </div>
        <p className="text-white/60 text-xs mt-3">Last updated: May 1, 2026 · Version 1.0</p>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">

        <div className="bg-enb-gold-faint border border-enb-gold/20 rounded-xl p-4 text-sm text-enb-text-primary leading-relaxed">
          <strong>Please read these Terms carefully.</strong> By accessing or using the Eco-Neighbor ($ENB)
          platform at app.econeighbor.org, you agree to be bound by these Terms and Conditions. If you do
          not agree, you must not use the Platform.
        </div>

        <Section title="1. The Platform">
          <p>
            Eco-Neighbor ($ENB) (the "Platform") is a Regenerative Finance (ReFi) civic action platform
            operated by Eco-Neighbor, a company in the process of registration under the Companies Act,
            2017 (Pakistan). The Platform rewards verified civic actions with $ENB community tokens and
            connects community members with local business partners.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>You may use the Platform only if you are:</p>
          <ul className="space-y-2 text-enb-text-secondary text-sm leading-relaxed mt-2">
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>18 years of age or older</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>Capable of forming a legally binding agreement under the laws of Pakistan</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>Not prohibited from using the Platform under any applicable law</span></li>
          </ul>
          <p className="mt-3">By registering, you represent and warrant that you meet all eligibility requirements.</p>
        </Section>

        <Section title="3. Account Registration and Security">
          <p>You must provide accurate, complete, and current information when registering. You are
          responsible for maintaining the confidentiality of your account credentials and for all
          activities that occur under your account. You must notify us immediately at{' '}
          <a href="mailto:info@econeighbor.org" className="text-enb-green font-medium underline">info@econeighbor.org</a>{' '}
          of any unauthorised use of your account.</p>
          <p className="mt-3">Each person may hold only one account. Creating multiple accounts to circumvent
          the daily action cap (3 verified actions per user per day) or any other Platform limitation
          is strictly prohibited and will result in permanent removal from the Platform.</p>
        </Section>

        <Section title="4. Civic Action Submissions">
          <p>To earn $ENB tokens, you must submit genuine, verified civic actions. By submitting an action,
          you confirm that:</p>
          <ul className="space-y-2 text-enb-text-secondary text-sm leading-relaxed mt-2">
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>The action was performed by you personally at the location shown</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>The photograph was taken at the time of the action, not pre-recorded</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>The GPS coordinates accurately reflect where the action took place</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>You have not fabricated, staged, or falsified any element of the submission</span></li>
          </ul>
          <p className="mt-3">Fraudulent submissions will result in forfeiture of earned tokens, immediate account
          suspension, and permanent removal from the Platform. Moderators who approve fraudulent submissions
          forfeit their entire month's earnings.</p>
        </Section>

        <Section title="5. $ENB Tokens — Nature and Limitations">
          <p>$ENB tokens, in both their ENB.LOCAL and ENB.GLOBAL forms, are community reward tokens.
          They are <strong>not legal tender</strong>, not a currency, not a security, and not an investment
          instrument. Please read the full Token Disclaimer at{' '}
          <Link to="/token-disclaimer" className="text-enb-green font-medium underline">app.econeighbor.org/token-disclaimer</Link>{' '}
          before using the Platform.</p>
          <p className="mt-3">ENB.LOCAL is non-transferable between users and can only be spent via the SWAP
          mechanism at registered Platform business partners. It has no monetary value outside the Platform.</p>
          <p className="mt-3">ENB.GLOBAL may be accessible to eligible members through the Maturation Bridge,
          subject to strict conditions including a 25% lifetime cap, a maximum of two conversion events
          per lifetime, and a minimum three-year gap between events.</p>
        </Section>

        <Section title="6. SWAP Transactions">
          <p>When you conduct a SWAP at a registered business partner, you agree that:</p>
          <ul className="space-y-2 text-enb-text-secondary text-sm leading-relaxed mt-2">
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>The SWAP is irreversible once confirmed on the blockchain</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>90% of your SWAP amount returns to the Community Rewards Pool</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>10% is distributed as the Community Treasury Contribution per the published v6.0 mechanism</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>No SWAP amount flows to founders or private individuals</span></li>
          </ul>
        </Section>

        <Section title="7. Prohibited Conduct">
          <p>You must not:</p>
          <ul className="space-y-2 text-enb-text-secondary text-sm leading-relaxed mt-2">
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>Submit fraudulent, staged, or falsified civic action evidence</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>Create multiple accounts or use automated bots to earn tokens</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>Attempt to manipulate, hack, or exploit the Platform or its smart contracts</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>Use the Platform to facilitate money laundering or any illegal activity</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>Harass, abuse, or threaten other community members or Platform staff</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>Share your account credentials with any other person</span></li>
            <li className="flex gap-2"><span className="text-enb-green font-bold mt-0.5">·</span><span>Circumvent the daily 3-action cap or any other Platform limitation</span></li>
          </ul>
          <p className="mt-3">Violation of these prohibitions may result in token forfeiture, account suspension,
          permanent removal, and where applicable, reporting to relevant authorities.</p>
        </Section>

        <Section title="8. Identity Verification">
          <p>You consent to the collection and secure storage of your CNIC number and photograph for
          the purpose of identity verification. You confirm that the CNIC you submit belongs to you
          and that the information is accurate. Submission of false identity documents is a criminal
          offence under Pakistani law.</p>
        </Section>

        <Section title="9. Intellectual Property">
          <p>All content on the Platform — including the Eco-Neighbor name, $ENB ticker, logo, design
          system, and software — is the intellectual property of Eco-Neighbor or its licensors. You may
          not reproduce, distribute, or create derivative works from any Platform content without our
          written permission.</p>
          <p className="mt-3">The Platform's source code is published under an MIT open-source licence on
          GitHub (github.com/agrorian/eco-neighbor). The licence applies to the code only, not to the
          Eco-Neighbor brand, logo, or token name.</p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>To the maximum extent permitted by applicable law, Eco-Neighbor shall not be liable for
          any indirect, incidental, special, or consequential loss arising from your use of the Platform,
          including but not limited to: loss of $ENB token value, missed civic action rewards, technical
          outages, or smart contract events outside our control.</p>
          <p className="mt-3">The Platform is provided on an "as is" basis during its pilot phase. We make no
          warranty that the Platform will be uninterrupted, error-free, or free of security vulnerabilities.</p>
        </Section>

        <Section title="11. Governing Law">
          <p>These Terms are governed by the laws of the Islamic Republic of Pakistan. Any dispute
          arising under these Terms shall be subject to the exclusive jurisdiction of the courts of
          Rawalpindi/Islamabad, Pakistan.</p>
        </Section>

        <Section title="12. Changes to These Terms">
          <p>We may update these Terms from time to time. Material changes will be communicated to
          registered users via the Platform's announcement system with at least 14 days' notice before
          the changes take effect. Your continued use of the Platform after the effective date constitutes
          acceptance of the updated Terms.</p>
        </Section>

        <Section title="13. Contact">
          <p>For any questions about these Terms, contact us at:{' '}
            <a href="mailto:info@econeighbor.org" className="text-enb-green font-medium underline">
              info@econeighbor.org
            </a>
          </p>
        </Section>

        {/* Footer nav */}
        <div className="pt-4 border-t border-enb-border flex flex-wrap gap-4 text-sm">
          <Link to="/privacy" className="text-enb-green font-medium hover:underline">Privacy Policy</Link>
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
