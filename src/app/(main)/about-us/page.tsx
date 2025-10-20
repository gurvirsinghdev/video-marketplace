"use client";

import { BadgeCheckIcon, HeartHandshakeIcon, ShieldCheckIcon, Users2Icon, VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/modules/base/section-header";
import FeatureCard from "@/components/other/feature-card";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="w-full">
      <AboutHero />
      <OurMission />
      <OurValues />
      <ImpactStats />
      <JoinUsCTA />
    </main>
  );
}

const AboutHero = () => {
  return (
    <section className="relative isolate w-full bg-neutral-950 px-6 py-20 text-white sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
        <div className="absolute -top-32 -left-32 h-56 w-56 rounded-full bg-gradient-to-br from-sky-500 to-teal-600 blur-3xl" />
        <div className="absolute -right-32 -bottom-32 h-56 w-56 rounded-full bg-gradient-to-tr from-purple-500 to-teal-500 blur-3xl" />
      </div>
      <div className="mx-auto max-w-5xl">
        <div className="space-y-4 text-left sm:text-center">
          <h1 className="bg-gradient-to-br from-sky-300 to-teal-100 bg-clip-text text-4xl font-extrabold leading-tight text-transparent md:text-6xl">
            About VidID
          </h1>
          <p className="text-white/70 md:text-lg">
            We connect passionate creators with buyers who value authenticity. Host, license, and discover
            exceptional stock footage—safely and transparently.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/explore" className="w-full sm:w-auto">
              <Button className="h-11 w-full cursor-pointer px-6 sm:w-auto">Explore Videos</Button>
            </Link>
            <Link href="/uploader" className="w-full sm:w-auto">
              <Button variant="secondary" className="h-11 w-full cursor-pointer px-6 sm:w-auto">
                Become a Contributor
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const OurMission = () => {
  return (
    <section className="w-full bg-white px-6 py-16 text-neutral-900">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          title="Our Mission"
          titleClassName="dark:text-background"
          description="Empower creators with fair monetization and give buyers frictionless access to high‑quality, rights‑safe footage."
          descriptionClassName="dark:text-muted"
        />

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={VideoIcon}
            accentClassName="text-sky-700 bg-blue-100"
            title="Built for video"
            description="Purpose‑built tools for uploading, previewing, and delivering cinematic clips at scale."
          />
          <FeatureCard
            icon={ShieldCheckIcon}
            accentClassName="text-emerald-700 bg-emerald-100"
            title="Rights & safety"
            description="Clear licensing flows and robust protections, so both parties can transact with confidence."
          />
          <FeatureCard
            icon={BadgeCheckIcon}
            accentClassName="text-indigo-700 bg-indigo-100"
            title="Quality first"
            description="Curated content and transparent pricing ensure buyers get value and creators get paid fairly."
          />
        </div>
      </div>
    </section>
  );
};

const OurValues = () => {
  return (
    <section className="w-full bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          title="What We Stand For"
          className="mb-6"
          titleClassName="text-white"
          description="Principles that shape our product and community."
          descriptionClassName="text-white/70"
        />

        <div className="grid gap-6 md:grid-cols-3">
          <ValueCard
            icon={<HeartHandshakeIcon className="h-5 w-5" />}
            title="Creator‑centric"
            description="We prioritize creators’ livelihoods with fair terms and simple, respectful workflows."
          />
          <ValueCard
            icon={<Users2Icon className="h-5 w-5" />}
            title="Community"
            description="We foster a positive marketplace where buyers and contributors succeed together."
          />
          <ValueCard
            icon={<ShieldCheckIcon className="h-5 w-5" />}
            title="Trust"
            description="From content integrity to payments, we build transparent systems you can rely on."
          />
        </div>
      </div>
    </section>
  );
};

const ValueCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-white/10 px-2 py-1 text-xs">
        {icon}
        <span className="opacity-80">{title}</span>
      </div>
      <p className="text-sm text-white/80">{description}</p>
    </div>
  );
};

const ImpactStats = () => {
  const stats = [
    { label: "Clips hosted", value: "10k+" },
    { label: "Verified creators", value: "1k+" },
    { label: "Avg. payout time", value: "<48h" },
    { label: "Global buyers", value: "100+ countries" },
  ];

  return (
    <section className="w-full bg-white px-6 py-16 text-neutral-900">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          title="Our Impact"
          titleClassName="dark:text-background"
          description="Growing a fair, modern marketplace for stock video."
          descriptionClassName="dark:text-muted"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border p-5">
              <div className="text-2xl font-semibold">{s.value}</div>
              <div className="text-muted-foreground mt-1 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const JoinUsCTA = () => {
  return (
    <section className="w-full bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold md:text-4xl">Join the VidID community</h2>
        <p className="text-white/70 mx-auto mt-3 max-w-2xl">
          Whether you’re sharing your library or searching for the perfect clip, we’re building the
          marketplace where quality, trust, and fair value come first.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/explore" className="w-full sm:w-auto">
            <Button className="h-11 w-full cursor-pointer px-6 sm:w-auto">Start Exploring</Button>
          </Link>
          <Link href="/uploader" className="w-full sm:w-auto">
            <Button variant="secondary" className="h-11 w-full cursor-pointer px-6 sm:w-auto">
              Become a Contributor
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
 
