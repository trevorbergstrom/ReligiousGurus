import { useState } from "react";
import { InfoIcon, Github, MessageCircle, Home, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import GuruLogo from "./GuruLogo";

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isHomePage = location === "/";
  const isAboutPage = location === "/about";
  const isChatPage = location === "/chat";
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <header className="gradient-teal shadow-lg text-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo - same on mobile and desktop */}
        <div className="flex items-center space-x-3 transition-all-smooth" onClick={() => window.location.href = "/"} style={{cursor: "pointer"}}>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-card overflow-hidden hover-scale">
            <GuruLogo className="w-full h-full" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-white">
              Religious Gurus
            </h1>
            <p className="text-xs text-teal-50 hidden md:block">Exploring worldviews through AI</p>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-2">
          <Link href="/">
            <Button
              variant={isHomePage ? "default" : "ghost"}
              className="items-center space-x-1 text-white hover:bg-teal-600 transition-all-smooth"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </Link>
          
          <Link href="/about">
            <Button
              variant={isAboutPage ? "default" : "ghost"}
              className="items-center space-x-1 text-white hover:bg-teal-600 transition-all-smooth"
            >
              <InfoIcon className="h-4 w-4" />
              <span>About</span>
            </Button>
          </Link>
          
          <Link href="/chat">
            <Button
              variant={isChatPage ? "default" : "ghost"}
              className="items-center space-x-1 text-white hover:bg-teal-600 transition-all-smooth"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat</span>
            </Button>
          </Link>
          
          <a href="https://github.com/hhanspal/ReligiousGurus" target="_blank" rel="noopener noreferrer">
            <Button
              variant="ghost"
              className="items-center space-x-1 text-white hover:bg-teal-600 transition-all-smooth"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </Button>
          </a>
        </div>
        
        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden">
          <Button
            variant="ghost" 
            size="icon"
            className="rounded-full text-white hover:bg-teal-600"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-teal-800 pb-2">
          <div className="flex flex-col space-y-1 px-4">
            <Link href="/">
              <Button
                variant={isHomePage ? "secondary" : "ghost"}
                className="w-full justify-start text-white hover:bg-teal-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="h-4 w-4 mr-2" />
                <span>Home</span>
              </Button>
            </Link>
            
            <Link href="/about">
              <Button
                variant={isAboutPage ? "secondary" : "ghost"}
                className="w-full justify-start text-white hover:bg-teal-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                <InfoIcon className="h-4 w-4 mr-2" />
                <span>About</span>
              </Button>
            </Link>
            
            <Link href="/chat">
              <Button
                variant={isChatPage ? "secondary" : "ghost"}
                className="w-full justify-start text-white hover:bg-teal-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                <span>Chat</span>
              </Button>
            </Link>
            
            <a href="https://github.com/hhanspal/ReligiousGurus" target="_blank" rel="noopener noreferrer">
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-teal-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Github className="h-4 w-4 mr-2" />
                <span>GitHub</span>
              </Button>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
