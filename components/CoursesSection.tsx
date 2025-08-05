import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CoursesSection({ courses }: { courses: any[] }) {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Featured Courses
          </h2>
          <p className="text-gray-600">
            Expert-designed courses for Indian competitive exams
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.slice(0, 4).map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-indigo-600 rounded-t-lg flex items-center justify-center">
                <span className="text-white font-semibold">{course.exam_type}</span>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">{course.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{course.short_description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{course.estimated_hours}h</span>
                  <span className="font-semibold text-blue-600">
                    {course.is_free ? 'Free' : `₹${course.fee}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
