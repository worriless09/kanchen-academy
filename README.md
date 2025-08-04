# 🇮🇳 Kanchen Academy - AI-Powered Education Platform for Indian Aspirants

Advanced educational platform with Hermann Ebbinghaus spaced repetition algorithm and HRM (Hierarchical Reasoning Model) integration, specifically designed for UPSC, SSC, and Banking exam preparation.

## 🚀 Features

- **AI-Powered Spaced Repetition**: Hermann Ebbinghaus algorithm with HRM enhancement
- **Indian Exam Focus**: UPSC, SSC, Banking, Railway, Defense preparation
- **Freemium Model**: Free tier + Premium subscriptions (₹299/month)
- **HRM Integration**: 100x faster reasoning analysis than traditional LLMs
- **Mobile-First**: Optimized for Indian smartphone users
- **Hindi Support**: Bilingual interface for broader accessibility

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, TypeScript
- **Backend**: Next.js API Routes, FastAPI (HRM Service)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Razorpay (UPI, NetBanking, Cards)
- **AI**: Custom HRM implementation
- **Caching**: Redis

## 📦 Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables: Copy `.env.example` to `.env.local`
4. Set up Supabase project and run database migrations
5. Start development server: `npm run dev`
6. Start HRM service: `cd hrm-service && python main.py`

## 🏗️ Project Structure

- `/app` - Next.js App Router pages and API routes
- `/components` - Reusable React components
- `/lib` - Utility functions and algorithms
- `/database` - Database schemas and migrations
- `/hrm-service` - Python FastAPI HRM service
- `/types` - TypeScript type definitions

## 🎯 Target Market

Indian exam aspirants preparing for:
- UPSC Civil Services
- SSC (CGL, CHSL, MTS, GD)
- Banking (IBPS, SBI)
- Railway exams
- Defense services
- State PSC exams

## 💰 Business Model

- Free tier with limited features
- Premium subscriptions: ₹299/month or ₹2999/year
- Course sales and mock test series
- Affiliate partnerships

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

This project is licensed under the MIT License.

