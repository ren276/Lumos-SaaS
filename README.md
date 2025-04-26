
# Lumos - Full Stack AI GitHub SaaS

Build and Deploy a full-stack AI-powered GitHub SaaS platform using **Next.js 15**, **Google Gemini AI**, **Assembly AI**, **Stripe**, **Clerk**, and **Supabase**.

## ✨ Features

- AI-Powered **Code Summarization** with Google Gemini AI
- **Audio Transcription** using Assembly AI
- **Authentication** with Clerk
- **Subscription Payments** powered by Stripe
- **Credit-Based System** for user operations
- Modern and responsive **UI/UX** with Tailwind CSS and Shadcn UI
- **Database** management via Prisma and Supabase

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS, Shadcn UI
- **Backend**: TypeScript, Prisma, Supabase
- **Authentication**: Clerk
- **Payments**: Stripe
- **AI Integrations**: Google Gemini AI, Assembly AI

## 🛠️ Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn
- Supabase account
- Clerk account
- Stripe account
- Google Gemini AI API Key
- Assembly AI API Key

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/full-stack-ai-github-saas.git
cd full-stack-ai-github-saas
```

2. **Install dependencies:**

```bash
npm install
# or
yarn install
```

3. **Create a `.env` file** and add the following environment variables:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
DATABASE_URL=your_supabase_database_url
GEMINI_API_KEY=your_google_gemini_api_key
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
```

4. **Set up Prisma and the database:**

```bash
npx prisma migrate dev --name init
```

5. **Start the development server:**

```bash
npm run dev
# or
yarn dev
```

Open your browser and navigate to `http://localhost:3000` to view the app.

## 📄 Usage

- **Authentication**: Sign up or log in using Clerk
- **Connect GitHub**: Link your repositories
- **Generate Summaries**: Summarize codebases with Gemini AI
- **Upload Audio**: Transcribe meetings via Assembly AI
- **Manage Plans**: Subscribe to premium plans using Stripe

## ⚡ Deployment

You can easily deploy this app on platforms like **Vercel**, **Netlify**, or **Railway**.

Make sure to correctly set all environment variables on your deployment platform.

## 📜 License

This project is licensed under the **MIT License**.  
See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [Google Gemini AI](https://ai.google.dev/)
- [Assembly AI](https://www.assemblyai.com/)
- [Clerk](https://clerk.dev/)
- [Stripe](https://stripe.com/)
- [Supabase](https://supabase.com/)
- [Prisma ORM](https://www.prisma.io/)

---
