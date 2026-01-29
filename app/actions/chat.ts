"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const WISE_CONTEXT = `
You are FinanceGPT, the AI specifically for Wise App.
Wise App is a modern, minimalist personal finance dashboard.
Features of Wise:
- Safe Spend Today: Calculates exactly how much users can spend daily based on their monthly income, fixed expenses, and savings goals.
- Real-time Budgeting: Adjusts automatically as users spend.
- FinanceGPT: That's you. An AI assistant for financial advice.
- Bank-grade Security: Firestore with per-user isolation, encryption.
- Recurring Subscriptions: Tracks monthly bills.
- Tech Stack: Built with Next.js, Firebase, Tailwind.

Rules:
1. You are helpful, polite, and concise.
2. If the user is NOT logged in, you CANNOT provide personal financial insights, balance details, or "Safe Spend" numbers for them personally. You can explain *how* Wise calculates it, but don't make up numbers for the user.
3. If the user IS logged in, you can pretend to have access to their latest 'demo' data for this interaction (e.g., "Safe Spend is ₹27,666 today") or provide general financial advice.
4. Keep answers short (under 3 sentences per buble usually).
`;

export async function getChatResponse(message: string, isLoggedIn: boolean) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return "I'm currently running in demo mode (API Key missing). Please add GEMINI_API_KEY to .env.local to make me real!";
        }

        // Initialize client inside function to ensure it picks up the latest env var
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const authContext = isLoggedIn
            ? "User STATUS: LOGGED IN. You can discuss their mock financial data (Income: ₹1.75L, Safe Spend: ₹27k)."
            : "User STATUS: NOT LOGGED IN. If they ask about their personal data/balance/safe-spend, politely ask them to log in first.";

        const prompt = `${WISE_CONTEXT}\n\n${authContext}\n\nUser: ${message}\nAssistant:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("Gemini API Error details:", error?.message || error);
        return `Sorry, I'm having trouble connecting to the hive mind right now. details: ${error?.message?.slice(0, 50)}`;
    }
}
