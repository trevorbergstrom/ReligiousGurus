import { InfoIcon, Settings, Github, MessageCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

export default function Header() {
  const [location] = useLocation();
  const isHomePage = location === "/";
  const isAboutPage = location === "/about";
  const isChatPage = location === "/chat";
  
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3" onClick={() => window.location.href = "/"} style={{cursor: "pointer"}}>
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white text-xl font-bold">RG</span>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-slate-900">
              Religious Gurus
            </h1>
            <p className="text-xs text-slate-500 hidden md:block">Exploring worldviews through AI</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link href="/">
            <Button
              variant={isHomePage ? "default" : "ghost"}
              className="hidden md:inline-flex items-center space-x-1 text-slate-600 hover:text-primary-600"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </Link>
          
          <Link href="/about">
            <Button
              variant={isAboutPage ? "default" : "ghost"}
              className="hidden md:inline-flex items-center space-x-1 text-slate-600 hover:text-primary-600"
            >
              <InfoIcon className="h-4 w-4" />
              <span>About</span>
            </Button>
          </Link>
          
          <Link href="/chat">
            <Button
              variant={isChatPage ? "default" : "ghost"}
              className="hidden md:inline-flex items-center space-x-1 text-slate-600 hover:text-primary-600"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat</span>
            </Button>
          </Link>
          
          <a href="https://github.com/hhanspal/ReligiousGurus" target="_blank" rel="noopener noreferrer">
            <Button
              variant="ghost"
              className="hidden md:inline-flex items-center space-x-1 text-slate-600 hover:text-primary-600"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </Button>
          </a>
          
          <Button
            variant="outline" 
            size="icon"
            className="rounded-full text-slate-600 hover:bg-slate-100 hover:text-primary-600 border-slate-200"
          >
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
