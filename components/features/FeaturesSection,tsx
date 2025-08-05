'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Zap, Target, Globe, Smartphone, Award } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Spaced Repetition',
    description: 'Hermann Ebbinghaus algorithm enhanced with HRM for optimal learning'
  },
  {
    icon: Zap,
    title: '100x Faster Reasoning',
    description: 'Revolutionary HRM technology for superior analytical thinking'
  },
  {
    icon: Target,
    title: 'Indian Exam Focus',
    description: 'Specialized content for UPSC, SSC, Banking & competitive exams'
  },
  {
    icon: Globe,
    title: 'Hindi Language Support',
    description: 'Bilingual interface for broader accessibility across India'
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Design',
    description: 'Optimized for smartphones with offline study capabilities'
  },
  {
    icon: Award,
    title: 'Freemium Model',
    description: 'Start free, upgrade to premium for advanced features'
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Choose Kanchen Academy?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Advanced AI technology meets proven learning science to accelerate your exam preparation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}