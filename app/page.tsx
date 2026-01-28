"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MdDashboard, MdTrendingUp, MdLightbulb, MdSecurity, MdSpeed, MdInsights } from "react-icons/md";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/components/FirebaseAuthProvider";

export default function LandingPage() {
  const { user, loading: authLoading, signInWithGoogle, logout } = useAuth();
  const router = useRouter();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <div className="text-[rgb(var(--foreground))] text-lg animate-pulse font-medium">Loading Wise...</div>
      </div>
    );
  }

  const features = [
    {
      icon: <MdDashboard size={32} />,
      title: "Safe Spend Today",
      description: "Know exactly how much you can safely spend today without compromising your monthly goals.",
    },
    {
      icon: <MdTrendingUp size={32} />,
      title: "Budget Tracking",
      description: "Set category budgets and get real-time insights on your spending patterns.",
    },
    {
      icon: <MdLightbulb size={32} />,
      title: "FinanceGPT Assistant",
      description: "AI-powered financial advisor that understands your spending habits and goals.",
    },
    {
      icon: <MdInsights size={32} />,
      title: "Smart Insights",
      description: "Predictive analytics to help you stay on track and make informed decisions.",
    },
    {
      icon: <MdSpeed size={32} />,
      title: "Quick Decisions",
      description: "Make micro-spending decisions in the moment with confidence.",
    },
    {
      icon: <MdSecurity size={32} />,
      title: "Secure & Private",
      description: "Your financial data is encrypted and isolated. Only you have access.",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Set Your Goals",
      description: "Enter your income, fixed expenses, and savings goals.",
    },
    {
      step: "2",
      title: "Track Spending",
      description: "Log expenses quickly with categories and notes.",
    },
    {
      step: "3",
      title: "Get Insights",
      description: "See your safe spend today and make better decisions.",
    },
  ];

  const faqs = [
    {
      question: "How does 'Safe Spend Today' work?",
      answer: "We calculate your remaining spendable budget for the month, divide it by days left, and show you a daily safe amount. It adjusts automatically based on your actual spending.",
    },
    {
      question: "Is my financial data secure?",
      answer: "Absolutely. We use Firestore with strict security rules ensuring only you can access your data. All data is encrypted in transit and at rest.",
    },
    {
      question: "What is FinanceGPT?",
      answer: "FinanceGPT is an AI assistant trained on your spending patterns. It provides personalized advice, answers questions, and helps you make informed financial decisions.",
    },
    {
      question: "Can I track multiple accounts?",
      answer: "Currently, Wise focuses on your overall spending behavior. You can categorize transactions and track different types of expenses.",
    },
  ];

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--foreground))]">
      {/* Header */}
      <header className="border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href={`/`} className="flex items-center gap-3">
            <Image
              src="/assets/logo.png"
              alt="Wise"
              width={40}
              height={40}
            />
            <span className="text-2xl font-bold">Wise</span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-4 py-2 text-sm font-medium text-[rgb(var(--foreground))] hover:text-[rgb(var(--muted-foreground))] transition-colors"
                >
                  Dashboard
                </button>
                <div className="flex items-center gap-2">
                  {user.photoURL && (
                    <Image 
                      src={user.photoURL} 
                      alt="Profile" 
                      width={32} 
                      height={32} 
                      className="rounded-full border border-[rgb(var(--border))]" 
                    />
                  )}
                  <button 
                    onClick={logout}
                    className="text-xs text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={signInWithGoogle}
                  className="px-4 py-2 text-sm font-medium text-[rgb(var(--foreground))] hover:text-[rgb(var(--muted-foreground))] transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={signInWithGoogle}
                  className="px-4 py-2 text-sm font-medium bg-[rgb(var(--foreground))] text-[rgb(var(--background))] rounded-lg hover:opacity-90 transition-opacity"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--accent))] via-[rgb(var(--background))] to-[rgb(var(--background))] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[rgb(var(--foreground))] to-[rgb(var(--muted-foreground))] bg-clip-text text-transparent">
              Make Better
              <br />
              Spending Decisions
            </h1>
            <p className="text-xl md:text-2xl text-[rgb(var(--muted-foreground))] mb-8 max-w-3xl mx-auto">
              Know your <span className="text-[rgb(var(--success))] font-semibold">safe spend today</span>, track budgets, and get AI-powered insights for smarter financial choices.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="px-8 py-4 text-lg font-medium bg-[rgb(var(--foreground))] text-[rgb(var(--background))] rounded-lg hover:opacity-90 transition-opacity shadow-lg"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={signInWithGoogle}
                    className="px-8 py-4 text-lg font-medium bg-[rgb(var(--foreground))] text-[rgb(var(--background))] rounded-lg hover:opacity-90 transition-opacity shadow-lg"
                  >
                    Get Started Free
                  </button>
                  <button
                    onClick={signInWithGoogle}
                    className="px-8 py-4 text-lg font-medium border border-[rgb(var(--border))] rounded-lg hover:bg-[rgb(var(--muted))] transition-colors"
                  >
                    Sign In with Google
                  </button>
                </>
              )}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { label: "Daily Safe Spend", value: "Real-time", icon: "💰" },
              { label: "Budget Categories", value: "Unlimited", icon: "📊" },
              { label: "AI Insights", value: "Powered", icon: "🤖" },
            ].map((stat, idx) => (
              <div
                key={stat.label}
                className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg p-6 text-center"
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-[rgb(var(--muted-foreground))]">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[rgb(var(--card))] border-y border-[rgb(var(--border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-[rgb(var(--muted-foreground))]">
              Powerful features to help you take control of your finances
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg p-6 hover:border-[rgb(var(--foreground))] transition-colors"
              >
                <div className="text-[rgb(var(--success))] mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-[rgb(var(--muted-foreground))]">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-[rgb(var(--muted-foreground))]">
              Get started in three simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-[rgb(var(--foreground))] text-[rgb(var(--background))] flex items-center justify-center text-2xl font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-[rgb(var(--muted-foreground))]">{item.description}</p>
                </div>
                {idx < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-[rgb(var(--border))]" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 bg-[rgb(var(--card))] border-y border-[rgb(var(--border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Your Data, Your Privacy
              </h2>
              <p className="text-xl text-[rgb(var(--muted-foreground))] mb-6">
                We take security seriously. Your financial data is encrypted, isolated, and accessible only by you.
              </p>
              <ul className="space-y-4">
                {[
                  "End-to-end encryption",
                  "Per-user data isolation with Firestore security rules",
                  "No data sharing with third parties",
                  "Secure authentication with Firebase",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-[rgb(var(--success))] text-xl">✓</span>
                    <span className="text-[rgb(var(--muted-foreground))]">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg p-8"
            >
              <div className="text-6xl mb-4 text-center">🔒</div>
              <h3 className="text-2xl font-semibold mb-4 text-center">Bank-Level Security</h3>
              <p className="text-[rgb(var(--muted-foreground))] text-center">
                Your data is protected with the same security standards used by financial institutions.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg p-6"
              >
                <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
                <p className="text-[rgb(var(--muted-foreground))]">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[rgb(var(--accent))] to-[rgb(var(--background))]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Take Control?
            </h2>
            <p className="text-xl text-[rgb(var(--muted-foreground))] mb-8">
              Join Wise today and start making smarter financial decisions.
            </p>
            <button
              onClick={signInWithGoogle}
              className="px-8 py-4 text-lg font-medium bg-[rgb(var(--foreground))] text-[rgb(var(--background))] rounded-lg hover:opacity-90 transition-opacity shadow-lg"
            >
              Get Started Free
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgb(var(--border))] bg-[rgb(var(--card))] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/assets/white-logo.png"
                  alt="Wise"
                  width={32}
                  height={32}
                  className="bg-[#4d4d4d7c] rounded-md p-1"
                />
                <span className="text-xl font-bold">Wise</span>
              </div>
              <p className="text-[rgb(var(--muted-foreground))]">
                Make better spending decisions in the moment.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-[rgb(var(--muted-foreground))]">
                <li><a href="#" className="hover:text-[rgb(var(--foreground))]">Features</a></li>
                <li><a href="#" className="hover:text-[rgb(var(--foreground))]">Security</a></li>
                <li><a href="#" className="hover:text-[rgb(var(--foreground))]">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-[rgb(var(--muted-foreground))]">
                <li><a href="#" className="hover:text-[rgb(var(--foreground))]">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[rgb(var(--foreground))]">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[rgb(var(--border))] text-center text-[rgb(var(--muted-foreground))]">
            <p>&copy; {new Date().getFullYear()} Wise. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
