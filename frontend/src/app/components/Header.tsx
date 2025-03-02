"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { ModeToggle } from "@/components/ModeToggle"

const Header = () => {

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" className="md:hidden mr-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          <h1 className="text-2xl font-bold">TipMyArt</h1>
        </div>
        <nav className="hidden md:flex space-x-4">
          <a href="/" className="hover:underline">Home</a>
          <a href="/myart" className="hover:underline">My art</a>
          <a href="/art" className="hover:underline">Art</a>
          <a href="/marketplace" className="hover:underline">Marketplace</a>
        </nav>
        <div className="flex items-center space-x-4">
            <ModeToggle />
            <ConnectButton />
          </div>
      </div>
      {mobileMenuOpen && (
        <nav className="md:hidden border-t p-4">
          <ul className="space-y-2">
            <li><a href="/" className="block hover:underline">Home</a></li>
            <li><a href="/myart" className="block hover:underline">My art</a></li>
            <li><a href="/art" className="block hover:underline">Art</a></li>
            <li><a href="/marketplace" className="block hover:underline">Marketplace</a></li>
          </ul>
        </nav>
      )}
      </header>
    </>
  )
}

export default Header