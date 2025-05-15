import { InfoIcon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl font-bold">R</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Religious Gurus</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            className="hidden md:inline-flex items-center space-x-1 text-slate-600 hover:text-primary-600"
          >
            <InfoIcon className="h-4 w-4" />
            <span>About</span>
          </Button>
          <Button
            variant="ghost" 
            size="icon"
            className="bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200"
          >
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
