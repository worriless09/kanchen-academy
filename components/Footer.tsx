import { BookOpen, Link } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-6 w-6" />
              <span className="text-lg font-bold">Kanchen Academy</span>
            </div>
            <p className="text-gray-400 text-sm">
              AI-powered education platform for Indian competitive exams
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Exams</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/courses?exam=UPSC">UPSC</Link></li>
              <li><Link href="/courses?exam=SSC">SSC</Link></li>
              <li><Link href="/courses?exam=BANKING">Banking</Link></li>
              <li><Link href="/courses?exam=RAILWAY">Railway</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Spaced Repetition</li>
              <li>AI Analytics</li>
              <li>Mock Tests</li>
              <li>Hindi Support</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/help">Help Center</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 Kanchen Academy. Made with ❤️ for Indian aspirants.</p>
        </div>
      </div>
    </footer>
  );
}