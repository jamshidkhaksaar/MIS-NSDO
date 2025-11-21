import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About NSDO",
  description:
    "Learn about New Way Social & Development Organization’s mission, governance, and partners across Afghanistan.",
};

const PARTNERS = [
  "USAID",
  "EU",
  "GIZ",
  "WFP",
  "UN-HABITAT",
  "DAI",
  "Counterpart International",
  "Concern Worldwide",
  "Acted",
  "NCA",
  "MC",
  "DRC",
  "KNH",
  "SCI",
  "GFA",
  "ACSONP-OXFAM",
  "Democracy International",
  "Afghanistan Human Rights Independent Commission (AIHRC)",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-soft text-brand-muted">
      <header className="border-b border-brand bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-soft">
              About NSDO
            </p>
            <h1 className="text-3xl font-semibold text-brand-strong">
              New Way Social &amp; Development Organization
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-full px-5 py-2 text-sm font-semibold chip-brand"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <section className="space-y-6 rounded-3xl border border-brand bg-white p-8 shadow-brand-soft">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide text-brand-primary">
              About Us
            </h2>
            <p className="text-brand-muted">
              New Way Social and Development Organization (NSDO) is a non-profit,
              non-governmental, and nonpolitical organization established in 2011 and formally
              registered with the Ministry of Economy of Afghanistan. Our focus spans the
              humanitarian, development, and advocacy sectors.
            </p>
            <p className="text-brand-muted">
              NSDO is based in Kabul with programming hubs in Northern and Northeastern provinces.
              We have deep roots in these regions, with operational capacity and presence across
              various parts of the country. Our team brings strong technical expertise and years of
              experience in implementing inclusive value chain and market development,
              community-driven natural resource management, as well as innovative agricultural
              techniques and technologies.
            </p>
            <p className="text-brand-muted">
              This remarkable transformation has been realised thanks to the steadfast support of
              our partners, enabling us to maximise our impact and serve communities more
              effectively.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-brand bg-brand-soft p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-primary">
              Strategic Partners
            </h3>
            <ul className="grid grid-cols-1 gap-2 text-sm text-brand-muted sm:grid-cols-2 lg:grid-cols-3">
              {PARTNERS.map((partner) => (
                <li key={partner} className="rounded-full bg-white px-4 py-2">
                  {partner}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-primary">
              Governance &amp; Accountability
            </h3>
            <p className="text-brand-muted">
              NSDO is a democratic organization governed by an independent body of elected or
              appointed members who jointly oversee our strategies. We maintain strong accountability
              standards that are embedded in everyday practice. NSDO is certified by USAID and the
              Afghanistan Institute for Civil Society (AICS) as a prominent NGO and potential CSO in
              Afghanistan.
            </p>
            <p className="text-brand-muted">
              We have been engaged in women&apos;s economic empowerment through income generation,
              agriculture development, and value chain development interventions, particularly across
              the north of Afghanistan.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-brand bg-white p-8 shadow-brand-soft">
          <h2 className="text-lg font-semibold uppercase tracking-wide text-brand-primary">
            Connect With NSDO
          </h2>
          <p className="mt-3 text-brand-muted">
            Discover more about our programmes and partnerships on our main website.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://www.nsdo.org.af"
              className="rounded-full px-5 py-2 text-sm font-semibold text-white btn-brand"
            >
              Visit www.nsdo.org.af
            </a>
            <a
              href="https://nsdo.org.af/contact-us/"
              className="rounded-full px-5 py-2 text-sm font-semibold chip-brand"
            >
              Contact NSDO
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
