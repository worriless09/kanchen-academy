import { Button } from '@/components/ui/button';
import { Link } from "lucide-react";

export default function ContactSection() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Start Your Journey?
        </h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Join Kanchen Academy today and experience the future of exam preparation
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/auth/register">Start Free Trial</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}