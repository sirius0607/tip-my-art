"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";
import { usePathname } from "next/navigation";
import Link from "next/link";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentPath = usePathname();

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="md:hidden mr-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <h1 className="text-2xl font-bold">TipMyArt</h1>
          </div>
          <nav className="hidden md:flex space-x-4">
            <Link href="/" className={`hover:underline ${currentPath === "/" ? "text-blue-500" : ""}`}>
              Home
            </Link>
            <Link href="/myart" className={`hover:underline ${currentPath === "/myart" ? "text-blue-500" : ""}`}>
              My Art
            </Link>
            <Link href="/airdrop" className={`hover:underline ${currentPath === "/airdrop" ? "text-blue-500" : ""}`}>
              Airdrop
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <ModeToggle />
            <ConnectButton />
          </div>
        </div>
        {mobileMenuOpen && (
          <nav className="md:hidden border-t p-4">
            <ul className="space-y-2">
              <li>
                <Link href="/" className={`block hover:underline ${currentPath === "/" ? "text-blue-500" : ""}`}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/myart" className={`block hover:underline ${currentPath === "/myart" ? "text-blue-500" : ""}`}>
                  My Art
                </Link>
              </li>
              <li>
                <Link href="/airdrop" className={`block hover:underline ${currentPath === "/airdrop" ? "text-blue-500" : ""}`}>
                  Airdrop
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </header>
    </>
  );
};

export default Header;