export default function Footer() {
  return (
    <footer className="bg-slate-100 border-t border-slate-200 mt-8">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">Religious Gurus</h3>
            <p className="text-sm text-slate-600 mb-4">
              An educational AI application providing neutral, comparative insights on religious and non-religious worldviews.
            </p>
            <div className="text-sm">
              <p className="text-slate-500">Licensed under MIT License</p>
              <p className="text-slate-500">© {new Date().getFullYear()} Religious Gurus Project</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Important Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-primary-600 hover:text-primary-800">About the Project</a></li>
              <li><a href="#" className="text-primary-600 hover:text-primary-800">Source Code (GitHub)</a></li>
              <li><a href="#" className="text-primary-600 hover:text-primary-800">Report an Issue</a></li>
              <li><a href="#" className="text-primary-600 hover:text-primary-800">Privacy Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Disclaimer</h3>
            <p className="text-sm text-slate-600">
              Information provided by Religious Gurus is AI-generated and intended for educational purposes only. Always consult authoritative sources for theological guidance. The application aims to present comparative information neutrally without promoting any particular worldview.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
