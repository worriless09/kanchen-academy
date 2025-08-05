import { Button } from '@/components/ui/button';
import { Link, BookOpen } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">Kanchen Academy</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/courses" className="text-gray-600 hover:text-gray-900">Courses</Link>
            <Link href="/flashcards" className="text-gray-600 hover:text-gray-900">Flashcards</Link>
            <Link href="/quiz" className="text-gray-600 hover:text-gray-900">Quizzes</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
