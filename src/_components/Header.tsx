"use client";

import Link from "next/link";
import { Camera, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { app_routes } from "@/lib/constants";
import Logo from "./icons/Logo";

const baseNavLinks: { href: string; label: string; merchOnly?: boolean }[] = [
  { href: app_routes.about, label: "About" },
  { href: app_routes.gallery, label: "Gallery" },
  { href: app_routes.wines, label: "Wines" },
  { href: app_routes.merch, label: "Merch", merchOnly: true },
  { href: app_routes.past_conclaves, label: "Past Conclaves" },
  { href: app_routes.contact, label: "Contact" },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type HeaderProps = {
  showMerch?: boolean;
};

export default function Header({ showMerch = false }: HeaderProps) {
  const pathname = usePathname() ?? "/";
  const navLinks = baseNavLinks.filter((link) => !link.merchOnly || showMerch);

  return (
    <header className="fixed top-0 z-40 w-full border-b border-white/5 bg-cork-plum/80 backdrop-blur-md">
      <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-12">
        <Logo />

        <nav className="hidden items-center gap-8 text-sm font-normal tracking-wide text-cork-blush md:flex">
          {navLinks.map(({ href, label }) => {
            const active = isNavActive(pathname, href);

            return (
              <Link
                href={href}
                key={label}
                className={`${active ? "text-cork-coral" : ""} transition-colors hover:text-cork-coral`}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <details className="group relative md:hidden">
          <summary className="list-none cursor-pointer text-cork-cream [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Open menu</span>
            <Menu className="size-7" strokeWidth={1.5} aria-hidden />
          </summary>

          <div className="absolute top-full right-0 mt-3 w-52 rounded-lg border border-white/10 bg-cork-plum-light/95 p-4 shadow-xl backdrop-blur-md">
            <nav className="flex flex-col gap-3 text-sm text-cork-blush">
              <Link href={app_routes.about} className="hover:text-cork-cream">
                About
              </Link>
              <Link href="/#curate" className="hover:text-cork-cream">
                Experience
              </Link>
              <Link href={app_routes.past_conclaves} className="hover:text-cork-cream">
                Past Conclaves
              </Link>
              <Link href={app_routes.gallery} className="hover:text-cork-cream">
                Gallery
              </Link>
              <Link href={app_routes.wines} className="hover:text-cork-cream">
                Wines
              </Link>
              {showMerch ? (
                <Link href={app_routes.merch} className="hover:text-cork-cream">
                  Merch
                </Link>
              ) : null}
              <Link href={app_routes.contact} className="hover:text-cork-cream">
                Contact
              </Link>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-cork-cream hover:text-cork-coral"
              >
                <Camera className="size-4" strokeWidth={1.5} />
                Instagram
              </a>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
