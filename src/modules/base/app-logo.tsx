import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface Props {
  className?: string;
}

export default function AppLogo(props: Props) {
  return (
    <>
      {[
        { theme: "dark", src: "/images/logo-light.png" },
        { theme: "light", src: "/images/logo-dark.png" },
      ].map((icon, idx) => (
        <Link href={"/"} key={idx}>
          <Image
            width={1024}
            height={271}
            src={icon.src}
            alt="VidID Pro Logo"
            className={cn(
              "h-auto w-32",
              {
                "block dark:hidden": icon.theme === "light",
                "hidden dark:block": icon.theme === "dark",
              },
              props.className,
            )}
          />
        </Link>
      ))}
    </>
  );
}
