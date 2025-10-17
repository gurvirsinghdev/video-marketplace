import {
  ArrowDownIcon,
  BadgeCheckIcon,
  BadgeDollarSignIcon,
  DollarSignIcon,
  FileDownIcon,
  LockIcon,
  LucideIcon,
  MegaphoneIcon,
  PlayIcon,
  SearchIcon,
  ShieldCheckIcon,
  StarsIcon,
  UploadIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Button } from "@/components/ui/button";
import FeatureCard from "@/components/other/feature-card";
import Link from "next/link";
import SectionHeader from "@/modules/base/section-header";
import StepList from "@/modules/base/step-list";

export default function Home() {
  return (
    <main className="h-auto w-full">
      <Hero />
      <WhyVidId />
      <HowItWorks />
      <BenefitsForContributors />
    </main>
  );
}

const Hero = () => {
  const TrustedBadge = () => (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm">
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      <span>Trusted by creators worldwide</span>
    </div>
  );

  return (
    <section className="relative isolate flex h-[calc(100vh-150px)] w-full items-center justify-center overflow-hidden bg-neutral-950 px-6 text-white">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
        <div className="absolute -top-24 -left-32 h-48 w-48 rounded-full bg-gradient-to-br from-teal-500 to-sky-600 blur-3xl" />
        <div className="absolute -right-32 -bottom-24 h-48 w-48 rounded-full bg-gradient-to-tr from-purple-500 to-teal-500 blur-3xl" />
      </div>

      <div className="relative mx-auto -mt-10 max-w-5xl py-8 sm:text-center">
        <div className="hidden md:block">
          <TrustedBadge />
        </div>
        <h1 className="mx-auto max-w-4xl bg-gradient-to-br from-sky-400 to-teal-100 bg-clip-text font-sans text-5xl leading-tight font-extrabold text-transparent md:text-7xl">
          Stock Marketplace
        </h1>
        <p className="text-md mx-auto mt-4 max-w-3xl text-white/70 md:text-lg">
          VidID is your hub for stunning stock footage and a seamless way to
          host your own clips. Share your work, reach buyers, and grow your
          earnings.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={"/explore"} className="w-full sm:w-auto">
            <Button className="border-background/10 h-11 w-full cursor-pointer border px-6 text-base sm:w-auto">
              Explore Videos
            </Button>
          </Link>
          <Link href={"/uploader"} className="w-full sm:w-auto">
            <Button
              variant="secondary"
              className="h-11 w-full cursor-pointer px-6 text-base sm:w-auto"
            >
              Request Quote
            </Button>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
        <ArrowDownIcon className="text-muted-foreground size-6 animate-bounce" />
      </div>
    </section>
  );
};

const WhyVidId = () => {
  return (
    <section className="w-full bg-white px-6 py-16 text-neutral-900">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          title="Why VidID"
          titleClassName="dark:text-background"
          description="It’s tough finding new content that inspires engagement and gets views. Our dedicated team supports creators with safe licensing, rights management, and access to quality content."
          descriptionClassName="dark:text-muted"
        />

        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={LockIcon}
            accentClassName="text-rose-700 bg-rose-100"
            title="Safe & easy"
            description="Honesty, transparency, and consideration guide our decisions. We act in the best interest of our users to ensure satisfaction."
          />

          <FeatureCard
            icon={StarsIcon}
            accentClassName="text-sky-700 bg-blue-100"
            title="Trusted intermediary"
            description="Our team actively manages your content and protects your rights, providing concierge‑level support and robust rights management services."
          />

          <FeatureCard
            icon={BadgeCheckIcon}
            accentClassName="text-teal-700 bg-teal-100"
            title="High‑quality content"
            description="Access footage of unique moments and current events suitable for limitless creative projects and posts."
          />
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  return (
    <section className="w-full bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <SectionHeader
          title="How It Works"
          description="A minimal, clear flow for both sides."
          className="mb-8 max-w-2xl"
          titleClassName="text-white text-2xl md:text-3xl"
          descriptionClassName="text-white/70 mt-2"
        />

        <Tabs defaultValue="contributors" className="w-full">
          <div className="flex items-center justify-center">
            <TabsList className="bg-white/10 p-1">
              <TabsTrigger
                value="contributors"
                className="text-white/80 data-[state=active]:bg-white data-[state=active]:text-neutral-900"
              >
                Contributors
              </TabsTrigger>
              <TabsTrigger
                value="buyers"
                className="text-white/80 data-[state=active]:bg-white data-[state=active]:text-neutral-900"
              >
                Buyers
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="contributors" className="mt-6">
            <StepList
              items={[
                {
                  title: "Sign up",
                  description: "Create your VidID account in minutes.",
                  icon: BadgeCheckIcon,
                },
                {
                  title: "Upload",
                  description:
                    "Add your clips with titles, tags, and metadata.",
                  icon: UploadIcon,
                },
                {
                  title: "Set price & license",
                  description: "Choose licensing terms and set your price.",
                  icon: BadgeDollarSignIcon,
                },
                {
                  title: "Get paid",
                  description: "Receive payouts as your clips are licensed.",
                  icon: DollarSignIcon,
                },
              ]}
            />
          </TabsContent>

          <TabsContent value="buyers" className="mt-6">
            <StepList
              items={[
                {
                  title: "Search",
                  description:
                    "Find the perfect footage with powerful filters.",
                  icon: SearchIcon,
                },
                {
                  title: "Preview",
                  description:
                    "Watch watermarked previews to evaluate quality.",
                  icon: PlayIcon,
                },
                {
                  title: "License",
                  description: "Select the right license for your use case.",
                  icon: BadgeCheckIcon,
                },
                {
                  title: "Download",
                  description: "Instantly access your licensed files.",
                  icon: FileDownIcon,
                },
              ]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

const BenefitsForContributors = () => {
  const benefits: {
    title: string;
    description: string;
    icon: LucideIcon;
    accent: string;
  }[] = [
    {
      title: "Fair revenue share",
      description: "Earn a competitive share on every licensed download.",
      icon: BadgeDollarSignIcon,
      accent: "text-emerald-700 bg-emerald-100",
    },
    {
      title: "Greater exposure",
      description: "Showcase your work to new audiences and buyers.",
      icon: MegaphoneIcon,
      accent: "text-sky-700 bg-sky-100",
    },
    {
      title: "Protection & licensing",
      description: "Your rights are safeguarded with clear, safe licensing.",
      icon: ShieldCheckIcon,
      accent: "text-indigo-700 bg-indigo-100",
    },
    {
      title: "Easy uploads",
      description: "Streamlined upload flow with helpful metadata tools.",
      icon: UploadIcon,
      accent: "text-teal-700 bg-teal-100",
    },
  ];

  return (
    <section className="w-full bg-white px-6 py-16 text-neutral-900">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          title="Benefits for Contributors"
          titleClassName="dark:text-background"
          description="Everything creators need to monetize safely and grow their audience."
          descriptionClassName="dark:text-muted"
        />

        <div className="grid gap-6 md:grid-cols-2">
          {benefits.map(({ title, description, icon, accent }) => (
            <FeatureCard
              key={title}
              icon={icon}
              title={title}
              description={description}
              accentClassName={accent}
              contentClassName="py-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
};
