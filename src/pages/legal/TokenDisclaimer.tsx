import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function TokenDisclaimer() {
  return (
    <div className="min-h-screen bg-enb-surface">
      {/* Header */}
      <div className="bg-enb-teal text-white px-5 pt-12 pb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Token Disclaimer</h1>
            <p className="text-white/70 text-sm">Eco-Neighbor ($ENB)</p>
          </div>
        </div>
        <p className="text-white/60 text-xs mt-3">Last updated: May 1, 2026 · Version 1.0</p>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">

        {/* Critical notice */}
        <div className="bg-enb-gold-faint border-l-4 border-enb-gold rounded-xl p-4 text-sm text-enb-text-primary leading-relaxed space-y-2">
          <p className="font-bold text-enb-gold-dark">⚠️ Important: Please read before participating</p>
          <p>
            $ENB tokens are community civic reward tokens. They are <strong>not investments</strong>,
            not securities, not legal tender, and not a financial product. Nothing on this Platform
            constitutes financial, investment, or legal advice.
          </p>
        </div>

        <Section title="1. Nature of $ENB Tokens">
          <p>
            $ENB is a dual-layer community reward token issued by Eco-Neighbor ($ENB) on the Solana
            blockchain. It exists in two technical forms:
          </p>
          <SubSection title="ENB.LOCAL (Civic Reward Layer)">
            <p>ENB.LOCAL is earned exclusively through verified civic actions on the Platform — a maximum
            of 3 per day, permanently capped in the smart contract. It is non-transferable between users
            and can only be spent at registered business partners via the SWAP mechanism. ENB.LOCAL has
            no monetary value outside the Platform and cannot be sold, traded, or exchanged for fiat
            currency. It is a closed-ecosystem community reward mechanism, not a tradeable asset.</p>
          </SubSection>
          <SubSection title="ENB.GLOBAL (Market Interface Layer)">
            <p>ENB.GLOBAL is the freely tradeable form of $ENB, listed on the Raydium decentralised
            exchange (DEX) on the Solana network. ENB.GLOBAL enters circulation exclusively through:
            (a) the Maturation Bridge — a strictly controlled conversion from ENB.LOCAL subject to a
            25% lifetime cap, maximum 2 events per lifetime, and a minimum 3-year gap between events;
            and (b) the Business Liquidity Gate — 3.3% of each SWAP transaction earned by business
            partners as compensation for accepting community payments.</p>
            <p className="mt-2">ENB.GLOBAL is <strong>never sold to investors</strong>. There is no
            Initial Virtual Asset Offering (IVO), no token sale, and no investor offering of any kind.</p>
          </SubSection>
        </Section>

        <Section title="2. $ENB Is Not an Investment">
          <p>$ENB tokens are earned through community labour and business service. They are <strong>not
          sold</strong> to participants and should not be purchased for speculative purposes. Eco-Neighbor
          ($ENB) explicitly prohibits the use of price prediction, "moon," or speculative investment
          language in all its communications.</p>
          <p className="mt-3">The value of ENB.GLOBAL on the Raydium DEX is determined by market forces
          entirely outside Eco-Neighbor's control. Eco-Neighbor makes <strong>no representation,
          warranty, or promise</strong> regarding the price, liquidity, or future value of ENB.GLOBAL.
          The value of ENB.GLOBAL may go to zero. You may lose the entire market value of any ENB.GLOBAL
          you hold.</p>
        </Section>

        <Section title="3. No Financial Advice">
          <p>Nothing on this Platform — including the Whitepaper, these pages, community announcements,
          or any communication from Eco-Neighbor staff — constitutes financial, investment, tax, or legal
          advice. You should consult your own qualified professional advisers before making any financial
          decisions in connection with $ENB or any other digital asset.</p>
        </Section>

        <Section title="4. Regulatory Status">
          <p>The regulatory status of digital tokens varies across jurisdictions and is subject to change.
          Eco-Neighbor ($ENB) is actively engaging with the Pakistan Virtual Assets Regulatory Authority
          (PVARA) through the regulatory sandbox process established under the Virtual Assets Act, 2026,
          to seek classification guidance regarding the $ENB token architecture.</p>
          <p className="mt-3">Eco-Neighbor's position, set out in its formal PVARA position paper, is that:
          ENB.LOCAL satisfies the closed-ecosystem digital token exemption under Section 2(2)(a) of the
          Act and is therefore not a Virtual Asset requiring regulation; ENB.GLOBAL may satisfy the
          definition of a Virtual Asset but was never offered through an IVO and is not sold to investors;
          and Eco-Neighbor does not provide any Virtual Asset Services under Schedule I of the Act.</p>
          <p className="mt-3">Regulatory determinations are ongoing. You are responsible for ensuring that
          your participation in the Platform complies with the laws of your own jurisdiction.</p>
        </Section>

        <Section title="5. Smart Contract Risk">
          <p>The $ENB token system operates through smart contracts on the Solana blockchain. Smart
          contracts may contain bugs or vulnerabilities. While Eco-Neighbor takes security seriously
          and is committed to independent smart contract audits, it cannot guarantee that the contracts
          are free of errors. In the event of a smart contract vulnerability, your token balances may
          be at risk.</p>
          <p className="mt-3">The Auto-Tranche System minting mechanism is autonomous — new tranches are
          minted by the smart contract without human intervention when the Community Rewards Pool reaches
          10% of its current tranche size. This is a design feature, not a bug. The total token supply
          is not fixed and will expand over time as the community grows.</p>
        </Section>

        <Section title="6. Blockchain and Technology Risk">
          <p>The Solana blockchain and the Raydium DEX are third-party systems outside Eco-Neighbor's
          control. Network outages, congestion, forks, or changes to the Solana protocol may affect
          your ability to access, transfer, or use $ENB tokens. Eco-Neighbor is not responsible for
          any losses arising from blockchain infrastructure events.</p>
        </Section>

        <Section title="7. The Community Rewards Pool Is Sacred">
          <p>The Community Rewards Pool (CRP) is exclusively for rewarding verified civic actions.
          It will never be used for any other purpose — not for replenishing other pools, not for
          tier bonuses, not for operational costs. This rule is encoded in the smart contract and
          enforced at the architectural level. No governance vote can change this.</p>
        </Section>

        <Section title="8. Founding Contributor Tokens">
          <p>The Founding Contributor Pool consists of 500,000,000 $ENB allocated from the first
          tranche (T1) only. These tokens are subject to a 12-month cliff and a 36-month vesting
          schedule enforced by the Streamflow smart contract. No $ENB from T2 or any subsequent
          tranche is allocated to founders. The founding contributor vesting schedule is
          publicly documented in the Whitepaper v6.0.</p>
        </Section>

        <Section title="9. No Guarantee of Ecosystem Continuity">
          <p>Eco-Neighbor is in its pilot phase. The Platform may be modified, expanded, or in extreme
          circumstances discontinued. In the event of discontinuation, the ENB.LOCAL balances of
          community members would no longer be redeemable. ENB.GLOBAL would continue to exist on
          the Solana blockchain but its utility within the Platform ecosystem would end. Eco-Neighbor
          commits to providing reasonable notice in the event of any material change to Platform
          operations.</p>
        </Section>

        <Section title="10. Contact">
          <p>For questions about the $ENB token architecture, regulatory engagement, or this disclaimer,
          contact us at:{' '}
            <a href="mailto:info@econeighbor.org" className="text-enb-green font-medium underline">
              info@econeighbor.org
            </a>
          </p>

        </Section>

        {/* Footer nav */}
        <div className="pt-4 border-t border-enb-border flex flex-wrap gap-4 text-sm">
          <Link to="/privacy" className="text-enb-green font-medium hover:underline">Privacy Policy</Link>
          <Link to="/terms" className="text-enb-green font-medium hover:underline">Terms & Conditions</Link>
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
