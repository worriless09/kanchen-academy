import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Priya Sharma',
      exam: 'UPSC CSE 2023',
      text: 'The HRM-powered spaced repetition helped me retain complex topics effortlessly.',
      avatar: 'PS'
    },
    {
      name: 'Rahul Kumar',
      exam: 'SSC CGL 2023',
      text: 'Mobile-first design made it easy to study during my commute. Scored 95th percentile!',
      avatar: 'RK'
    },
    {
      name: 'Anjali Patel',
      exam: 'Banking PO',
      text: 'The AI insights helped identify my weak areas and improved my performance by 40%.',
      avatar: 'AP'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Success Stories
          </h2>
          <p className="text-gray-600">
            Join thousands who cracked their exams with Kanchen Academy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.exam}</div>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.text}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}