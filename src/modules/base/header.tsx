"use client";
import Link from "next/link";
import AppLogo from "./app-logo";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Header() {
  const pathname = usePathname();
  const appRoutes: Map<string, string> = new Map([
    ["home", "/"],
    ["about", "/about"],
    ["explore", "/explore"],
    ["contact us", "/contact-us"],
  ]);

  return (
    <section className="bg-background w-full border-b">
      <header className="relative mx-auto flex w-full flex-row items-center justify-between p-8 lg:p-0 lg:pl-8">
        <div suppressHydrationWarning>
          <AppLogo />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:block">
          <nav className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-row items-center justify-center gap-2">
            {Array.from(appRoutes.entries()).map(([label, href], idx) => (
              <Link
                key={idx}
                href={href}
                data-state={href === pathname ? "active" : "inactive"}
                className="data-[state=active]:bg-primary data-[state=active]:text-background focus:bg-primary focus:text-background hover:bg-primary hover:text-background rounded-full p-2 px-4 capitalize transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-row items-center justify-center divide-x">
            {/* TODO: Change Action Buttons based off Auth */}
            <Link href={"/signin"}>
              <button className="bg-accent dark:bg-card hover:bg-background focus:bg-background cursor-pointer border-l p-8 transition-colors">
                Sign In
              </button>
            </Link>
            <Link href={"/signup"}>
              <button className="bg-accent dark:bg-card hover:bg-background focus:bg-background cursor-pointer border-l p-8 transition-colors">
                Start Selling
              </button>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="block lg:hidden">
            <Button variant={"ghost"} size={"icon"}>
              <MenuIcon className="size-8" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                <AppLogo />
              </SheetTitle>
            </SheetHeader>

            <nav className="mx-4 flex flex-col items-start justify-center divide-y border">
              {Array.from(appRoutes.entries()).map(([label, href], idx) => (
                <Link
                  key={idx}
                  href={href}
                  className="hover:bg-primary hover:text-secondary w-full p-4 capitalize transition-colors duration-75"
                >
                  {label}
                </Link>
              ))}
            </nav>

            <SheetFooter />
          </SheetContent>
        </Sheet>
      </header>
    </section>
  );
}
