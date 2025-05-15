import { Heart, Github, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-slate-50 to-slate-100 border-t border-slate-200 mt-8">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">RG</span>
              </div>
              <h3 className="font-bold text-lg text-slate-800">Religious Gurus</h3>
            </div>
            
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              An educational AI application providing neutral, comparative insights on religious and non-religious worldviews across various topics.
            </p>
            
            <div className="flex items-center space-x-4 mb-4">
              <a href="#" className="text-slate-500 hover:text-primary-600 transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="#" className="text-slate-500 hover:text-primary-600 transition-colors">
                <ExternalLink className="h-5 w-5" />
                <span className="sr-only">Website</span>
              </a>
            </div>
            
            <div className="text-sm">
              <p className="text-slate-500">
                <span className="font-medium">MIT License</span> • Open Source
              </p>
              <p className="text-slate-500">© {new Date().getFullYear()} Religious Gurus Project</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-5 text-slate-800">Important Links</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-slate-600 hover:text-primary-600 transition-colors inline-flex items-center">
                  <span className="mr-2">→</span>
                  About the Project
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-600 hover:text-primary-600 transition-colors inline-flex items-center">
                  <span className="mr-2">→</span>
                  Source Code (GitHub)
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-600 hover:text-primary-600 transition-colors inline-flex items-center">
                  <span className="mr-2">→</span>
                  Report an Issue
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-600 hover:text-primary-600 transition-colors inline-flex items-center">
                  <span className="mr-2">→</span>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-600 hover:text-primary-600 transition-colors inline-flex items-center">
                  <span className="mr-2">→</span>
                  Contributor Guidelines
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-5 text-slate-800">Disclaimer</h3>
            <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-600 leading-relaxed">
                Information provided by Religious Gurus is AI-generated and intended for educational purposes only. Always consult authoritative sources for theological guidance. 
              </p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                The application aims to present comparative information neutrally without promoting any particular worldview.
              </p>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500 inline-flex items-center justify-center">
                Made with <Heart className="h-3 w-3 text-red-500 mx-1" /> for educational purposes
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
