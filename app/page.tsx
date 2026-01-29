/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  motion, 
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence
} from "framer-motion";
import { 
  MdDashboard, 
  MdTrendingUp, 
  MdLightbulb, 
  MdSecurity, 
  MdSpeed, 
  MdInsights,
  MdArrowForward,
  MdSend,
  MdAutoAwesome,
  MdCheckCircle,
  MdWallet,
  MdPieChart,
  MdSettings,
  MdClose,
  MdStar
} from "react-icons/md";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/components/FirebaseAuthProvider";

// --- Components ---

const InteractiveGridBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const [smoothMouse, setSmoothMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mousePosition.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    
    // Smooth animation loop
    let animationFrameId: number;
    const animate = () => {
      setSmoothMouse(prev => ({
        x: prev.x + (mousePosition.current.x - prev.x) * 0.1, // Lerp factor for delay
        y: prev.y + (mousePosition.current.y - prev.y) * 0.1
      }));
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const gap = 30;
  
  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-black -z-10">
      <div 
        className="absolute inset-0 z-0 bg-transparent opacity-20"
        style={{
          backgroundImage: `radial-gradient(#333 1px, transparent 1px)`,
          backgroundSize: `${gap}px ${gap}px`,
        }}
      />
      
      {/* The glowing spotlight mask with trail delay */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-500"
        style={{
           background: `radial-gradient(600px circle at ${smoothMouse.x}px ${smoothMouse.y}px, rgba(255,255,255,0.08), transparent 40%)`,
        }}
      />

       {/* The "turning white" effect with a slightly larger radius for the 'active' dots */}
       <div 
        className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `radial-gradient(#fff 2px, transparent 2px)`,
          backgroundSize: `${gap}px ${gap}px`,
          maskImage: `radial-gradient(350px circle at ${smoothMouse.x}px ${smoothMouse.y}px, black, transparent)`,
          WebkitMaskImage: `radial-gradient(350px circle at ${smoothMouse.x}px ${smoothMouse.y}px, black, transparent)`,
        }}
      />
    </div>
  );
};

const EnhancedDashboardMockup = ({ user }: { user: any }) => {
  return (
   <div className="relative w-full aspect-video md:aspect-21/9 bg-[#0A0A0A] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex text-[10px] md:text-xs">
      {/* Sidebar */}
      <div className="w-48 bg-[#0F0F0F] border-r border-white/5 flex flex-col p-4 md:flex">
         <div className="flex items-center gap-1 mb-8">
            <Image src={`/assets/logo.png`} className="h-6 w-6" alt="logo" width={2000000} height={2000000}/>
            <span className="font-bold text-white tracking-widest uppercase text-[10px]">Wise</span>
         </div>
         
         <div className="space-y-1">
            <div className="text-white/30 text-[9px] uppercase tracking-wider mb-2 pl-2">Main</div>
            <div className="flex items-center gap-3 px-3 py-2 bg-white/5 text-white rounded-lg font-medium">
               <MdDashboard /> Dashboard
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
               <MdWallet /> Transactions
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
               <MdPieChart /> Recurring
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
               <MdTrendingUp /> Goals
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
               <MdAutoAwesome /> FinanceGPT
            </div>
         </div>
         
         <div className="mt-auto pt-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-3 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
               <MdSettings /> Settings
            </div>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A]">
         {/* Header */}
         <div className="h-14 border-b border-white/5 flex items-center justify-between px-6">
            <div>
               <h3 className="text-white font-medium">Dashboard</h3>
               <p className="text-white/30 text-[10px]">Thursday, Jan 29, 2026</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="text-right hidden sm:block">
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Safe spend today</div>
                  <div className="text-sm font-bold text-white">₹27,666</div>
               </div>
               {user?.photoURL ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10">
                    <Image src={user.photoURL} alt="User" fill className="object-cover" />
                  </div>
               ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10" />
               )}
            </div>
         </div>

         {/* Dashboard Content */}
         <div className="p-6 overflow-hidden flex flex-col gap-4">
            {/* Top Cards Row */}
            <div className="grid grid-cols-3 gap-4">
               {/* Monthly Income Card */}
               <div className="bg-[#111] border border-white/5 rounded-lg p-4 flex flex-col justify-between">
                  <span className="text-white/40 text-[10px]">Monthly Income</span>
                  <div className="text-lg font-bold text-white mt-1">₹1,75,000</div>
                  <div className="text-[9px] text-white/30 mt-2 truncate">Fixed+Subs: ₹62,000 • Savings goal: ₹30,000</div>
               </div>
               
               {/* Spendable Card */}
               <div className="bg-[#111] border border-white/5 rounded-lg p-4 flex flex-col justify-between">
                  <span className="text-white/40 text-[10px]">Spendable This Month</span>
                  <div className="text-lg font-bold text-white mt-1">₹83,000</div>
                  <div className="text-[9px] text-white/30 mt-2 truncate">Spent: ₹0 • Remaining: ₹83,000</div>
               </div>

               {/* Safe Spend Card */}
               <div className="bg-[#111] border border-white/5 rounded-lg p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4" />
                  <span className="text-white/40 text-[10px]">Safe Spend Today</span>
                  <div className="text-lg font-bold text-white mt-1">₹27,666</div>
                  <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                     <div className="w-[94%] h-full bg-emerald-500" />
                  </div>
               </div>
            </div>

            {/* Middle Row */}
            <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
               {/* Projection */}
               <div className="bg-[#111] border border-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-white/40 text-[10px]">Projection (at current pace)</span>
                     <span className="text-emerald-500 text-[10px]">+0%</span>
                  </div>
                  <div className="space-y-3">
                     <div>
                        <div className="text-[10px] text-white/50">Spend: ₹0</div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full mt-1"></div>
                     </div>
                     <div>
                        <div className="text-[10px] text-emerald-500">Projected leftover: ₹83,000</div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full mt-1 overflow-hidden">
                           <div className="w-full h-full bg-emerald-500/50" />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Budget Insight */}
               <div className="bg-[#111] border border-white/5 rounded-lg p-4 relative">
                   <span className="text-white/40 text-[10px]">Budget Insight</span>
                   <div className="font-bold text-white mt-1">Expected vs Actual</div>
                   <p className="text-[10px] text-emerald-400 mt-2">You're under the expected spend by ₹77,645.</p>
                   
                   <div className="mt-4 p-2 bg-white/5 rounded border border-white/5 flex justify-between items-center">
                      <div>
                         <div className="text-[9px] text-white/40">Safe spend for rest of week</div>
                         <div className="font-bold text-white">₹20,750</div>
                      </div>
                      <div className="text-[9px] text-white/30">Days left: 4</div>
                   </div>
               </div>
            </div>

            {/* Bottom Row - Quick Add */}
            <div className="bg-[#111] border border-white/5 rounded-lg p-4 h-24 flex flex-col justify-center gap-3">
               <div className="text-white/40 text-[10px]">Real-time Spend Check</div>
               <div className="flex gap-2">
                  {[50, 100, 200, 500, 1000].map(amt => (
                     <div key={amt} className="px-3 py-1 rounded border border-white/10 text-white/50 text-[10px] bg-white/5">₹{amt}</div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   </div>
  );
}


const FloatingNavbar = ({ user, signInWithGoogle, logout }: any) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        isScrolled ? "w-[90%] md:w-150" : "w-[95%] md:w-200"
      }`}
    >
      <div className={`
        backdrop-blur-md border border-white/10 rounded-full px-6 py-3
        flex items-center justify-between
        bg-black/50 shadow-[0_8px_32px_rgba(0,0,0,0.5)]
      `}>
        <Link href="/" className="flex items-center gap-1">
          <div className="relative w-8 h-8">
            <Image src="/assets/logo.png" alt="Wise" fill className="object-contain" />
          </div>
          <span className="font-semibold text-md tracking-wide text-white/90">Wise</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-white/60">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="hover:text-white transition-colors">Reviews</button>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <motion.button 
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-1.5 bg-white text-black hover:translate-x-0.5 transition-transform text-xs font-bold rounded-full shadow-lg shadow-white/10"
            >
              Dashboard
            </motion.button>
          ) : (
            <motion.button 
              onClick={signInWithGoogle}
              className="px-4 py-1.5 bg-white text-black text-xs font-bold rounded-full shadow-lg shadow-white/10"
            >
              Get Started
            </motion.button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

// ... imports ...
// ... imports
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ...

const FixedFinanceGPT = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([
    { role: 'assistant', text: "I'm connected to Wise. Ask me how I can help you save today." }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!isOpen) {
      setIsOpen(true);
    }

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
        // We instruct the AI to act as a product guide since we are on the landing page
        const landingContextMessages = [
           { 
             role: "user", 
             content: `I am a visitor on the Wise App landing page. 
             Status: ${isLoggedIn ? 'Logged In' : 'Guest'}.
             
             Your Goal: Explain the features of Wise (Safe Spend, Recurring Subscriptions, AI Audit, Bank-grade Security).
             Do NOT give me specific financial advice or mock insights like "You spent $50 on coffee".
             Instead, explain HOW Wise works.
             
             If I ask "What is Safe Spend?", explain: "Safe Spend calculates your daily available cash based on income minus fixed bills and savings goals."` 
           },
           { role: "assistant", content: "Understood. I will answer as a product expert about Wise features." }
        ];

        const history = messages.map(m => ({ role: m.role, content: m.text }));
        
        // Combine: Context -> Chat History -> New Message
        const apiMessages = [
            ...landingContextMessages,
            ...history, 
            { role: "user", content: userMsg }
        ];

        const response = await fetch('/api/financegpt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: apiMessages,
                context: {}, // Empty context to prevent dashboard logic
                options: {
                    model: "gemini-2.5-flash", 
                    sessionId: "landing-page-visitor"
                }
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || "Failed to get response");
        }

        setIsTyping(false);
        setMessages(prev => [...prev, { role: 'assistant', text: data.message }]);
    } catch (error) {
        console.error("Chat Error:", error);
        setIsTyping(false);
        setMessages(prev => [...prev, { role: 'assistant', text: "I'm having trouble connecting to the server. Please try again." }]);
    }
  };

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] w-full max-w-lg px-4 pointer-events-none">
       {/* Chat Window */}
       <AnimatePresence>
         {isOpen && (
           <motion.div
             initial={{ opacity: 0, y: 20, height: 0 }}
             animate={{ opacity: 1, y: 0, height: "400px" }}
             exit={{ opacity: 0, y: 20, height: 0 }}
             className="pointer-events-auto bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-2xl mb-4 overflow-hidden shadow-2xl flex flex-col origin-bottom"
           >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                 <div className="flex items-center gap-2">
                    <MdAutoAwesome className="text-white" />
                    <span className="font-bold text-sm">Wise AI</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full">Product Guide</span>
                 </div>
                 <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
                    <MdClose />
                 </button>
              </div>
              <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                 {messages.map((m, i) => (
                    <motion.div 
                       key={i} 
                       initial={{ opacity: 0, y: 10 }} 
                       animate={{ opacity: 1, y: 0 }}
                       className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                       <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                          m.role === 'user' ? 'bg-white text-black' : 'bg-white/10 text-white border border-white/5'
                       }`}>
                          {m.role === 'assistant' ? (
                              <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                     p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                     ul: ({children}) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                                     li: ({children}) => <li className="mb-1">{children}</li>,
                                     strong: ({children}) => <span className="font-bold text-yellow-500">{children}</span>
                                  }}
                                >
                                  {m.text}
                                </ReactMarkdown>
                              </div>
                          ) : (
                              m.text
                          )}
                       </div>
                    </motion.div>
                 ))}
                 {isTyping && (
                    <div className="flex justify-start">
                       <div className="bg-white/10 px-3 py-2 rounded-xl flex gap-1 items-center h-8">
                          <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-100" />
                          <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-200" />
                       </div>
                    </div>
                 )}
              </div>
           </motion.div>
         )}
       </AnimatePresence>

       {/* Input Bar */}
       <div className="pointer-events-auto">
          <motion.form 
            layout
            onSubmit={handleSubmit}
            className={`
               relative flex items-center gap-2 
               bg-black/80 backdrop-blur-xl border border-white/40 
               rounded-full p-1 pl-5 shadow-2xl shadow-purple-500/10
               transition-all duration-300
               ${isOpen ? 'ring-1 ring-white/20' : 'hover:border-white/60'}
            `}
          >
             <MdAutoAwesome className={`text-white text-xl transition-all ${isOpen ? 'opacity-100' : 'opacity-70'}`} />
             <input 
               ref={inputRef}
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Ask Wise AI..."
               className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/40 text-sm h-10"
             />
             <button 
               type="submit"
               className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-colors"
             >
                <MdArrowForward size={20} />
             </button>
          </motion.form>
       </div>
    </div>
  );
};

const ReviewCard = ({ name, role, text, rating }: any) => (
  <div className="min-w-[300px] md:min-w-[400px] bg-[#111] border border-white/10 p-6 rounded-2xl mx-4 flex flex-col gap-4">
    <div className="flex gap-1 text-yellow-500 text-sm">
       {[...Array(5)].map((_, i) => <MdStar key={i} className={i < rating ? "opacity-100" : "opacity-20"} />)}
    </div>
    <p className="text-white/70 text-sm leading-relaxed">"{text}"</p>
    <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5">
       <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">
          {name[0]}
       </div>
       <div>
          <div className="text-sm font-bold">{name}</div>
          <div className="text-xs text-white/30">{role}</div>
       </div>
    </div>
  </div>
);

const DynamicReviews = () => {
   const reviews1 = [
      { name: "Sarah J.", role: "Product Designer", text: "The cleanest finance app I've ever used. The 'Safe Spend' feature actually changed how I view my daily budget.", rating: 5 },
      { name: "Mike T.", role: "Software Engineer", text: "Finally, a dashboard that doesn't feel cluttered. FinanceGPT is surprisingly helpful for quick forecasts.", rating: 5 },
      { name: "Elena R.", role: "Freelancer", text: "I love that it tracks my subscriptions automatically. Saved me $40/month just by cancelling old stuff.", rating: 4 },
      { name: "David K.", role: "Founder", text: "Bank-grade security with a UI that feels like it's from the future. Highly recommend.", rating: 5 },
   ];
   
   const reviews2 = [
      { name: "Jessica L.", role: "Marketing Director", text: "The real-time insights are a game changer. I know exactly where my money is going every single day.", rating: 5 },
      { name: "Tom H.", role: "Student", text: "Best app for keeping my spending in check. The dark mode is also gorgeous.", rating: 5 },
      { name: "Amanda B.", role: "Accountant", text: "As an accountant, I appreciate the accuracy and the clean data visualization. Very impressive.", rating: 4 },
      { name: "Chris P.", role: "Small Business Owner", text: "Helps me separate my business and personal expenses effortlessly. Love it!", rating: 5 },
   ];

   return (
      <section className="py-24 overflow-hidden relative z-10 bg-black">
         <div className="text-center mb-16 px-4">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Loved by thousands</h2>
            <p className="text-white/50">Don't just take our word for it.</p>
         </div>

         {/* Marquee Row 1 */}
         <div className="flex mb-8 overflow-hidden mask-linear-fade">
            <motion.div 
               animate={{ x: ["0%", "-50%"] }}
               transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
               className="flex"
            >
               {[...reviews1, ...reviews1, ...reviews1].map((r, i) => (
                  <ReviewCard key={i} {...r} />
               ))}
            </motion.div>
         </div>

         {/* Marquee Row 2 */}
         <div className="flex overflow-hidden mask-linear-fade">
            <motion.div 
               animate={{ x: ["-50%", "0%"] }}
               transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
               className="flex"
            >
               {[...reviews2, ...reviews2, ...reviews2].map((r, i) => (
                  <ReviewCard key={i} {...r} />
               ))}
            </motion.div>
         </div>
      </section>
   );
}

const BentoItem = ({ children, className = "", delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay }}
    className={`bg-[#0F0F0F] border border-white/5 rounded-3xl p-6 md:p-8 hover:border-white/10 transition-all group relative overflow-hidden ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10 h-full flex flex-col">
      {children}
    </div>
  </motion.div>
);

// --- Main Page ---

export default function LandingPage() {
  const { user, loading: authLoading, signInWithGoogle, logout } = useAuth();
  const router = useRouter();

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans overflow-x-hidden pb-32">
      <FloatingNavbar user={user} signInWithGoogle={signInWithGoogle} logout={logout} />
      <FixedFinanceGPT isLoggedIn={!!user} />
      
      {/* Background with Interactive Bubble Grid */}
      <div className="fixed inset-0 z-0">
         <InteractiveGridBackground />
         <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 md:pt-48 md:pb-32 px-4 flex flex-col items-center justify-center min-h-[90vh] z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center relative z-10 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[10px] md:text-xs font-medium text-white/70 mb-8 uppercase tracking-wide shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            WISE 2.0 Now Available
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tighter mb-6 leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
            Control your wealth <br />
            with precise insights.
          </h1>
          
          <p className="text-sm md:text-md text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
            The minimal finance dashboard designed for the modern era. 
            Real-time tracking, AI-powered predictions, and bank-grade security.
          </p>

          <div className="flex items-center justify-center gap-4">
             <motion.button
               className="group relative px-8 py-3 bg-white hover:bg-white/80 transition text-black rounded-full font-semibold text-sm overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.2)]"
             >
               <span className="relative z-10 flex items-center gap-2">
                 Explore <MdArrowForward />
               </span>
             </motion.button>
          </div>
        </motion.div>

        {/* Realistic Dashboard Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-24 w-full max-w-5xl mx-auto relative perspective"
        >
            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] -z-10 rounded-full opacity-50" />
            <EnhancedDashboardMockup user={user} />
        </motion.div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="py-24 px-4 max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Everything you need</h2>
          <p className="text-white/50 text-lg">Powerful features wrapped in a stunning interface.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto">
          {/* Large Card - Dashboard */}
          <BentoItem className="md:col-span-2 md:row-span-2 min-h-[400px]">
            <div className="relative z-10 mb-8">
              <span className="p-3 bg-white/5 rounded-xl text-white inline-block mb-4"><MdDashboard size={24} /></span>
              <h3 className="text-2xl font-bold mb-2">Centralized Command</h3>
              <p className="text-sm text-white/50 max-w-sm">
                 All your accounts, subscriptions, and budgets in one unified view. 
                 Visualize cash flow like never before.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 w-[60%] h-[70%] bg-[#0A0A0A] border-t border-l border-white/10 rounded-tl-2xl overflow-hidden shadow-2xl">
               {/* Mini Dashboard Abstract */}
               <div className="p-4 space-y-3">
                  <div className="h-2 w-1/3 bg-white/10 rounded" />
                  <div className="h-8 w-2/3 bg-white/10 rounded" />
                  <div className="grid grid-cols-3 gap-2 mt-4">
                     <div className="h-16 bg-white/5 rounded" />
                     <div className="h-16 bg-white/5 rounded" />
                     <div className="h-16 bg-white/5 rounded" />
                  </div>
               </div>
            </div>
          </BentoItem>

          {/* Top Right Card - AI */}
          <BentoItem className="bg-gradient-to-b from-[#111] to-[#0a0a0a]">
            <div className="flex justify-between items-start">
              <div>
                <span className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg inline-block mb-3"><MdLightbulb size={20} /></span>
                <h3 className="text-lg font-bold">AI Insights</h3>
                <p className="text-xs text-white/40 mt-2">Personalized financial advice.</p>
              </div>
              <MdAutoAwesome className="text-white/10" size={40} />
            </div>
          </BentoItem>

          {/* Middle Right - Security */}
          <BentoItem>
           <div className="flex justify-between items-start">
              <div>
                <span className="p-2 bg-purple-500/10 text-purple-500 rounded-lg inline-block mb-3"><MdSecurity size={20} /></span>
                <h3 className="text-lg font-bold">Encrypted</h3>
                <p className="text-xs text-white/40 mt-2">AES-256 encryption for all data.</p>
              </div>
              <MdWallet className="text-white/10" size={40} />
            </div>
          </BentoItem>
        </div>
      </section>

      {/* Dynamic Reviews */}
      <DynamicReviews /> 

      {/* Footer */}
      <footer className="py-5 border-t border-white/5 text-center relative z-10 bg-black">
        <div className="flex flex-col items-center gap-5">
          <p className="text-white/50 text-xs">
            Copyright Claim © 2026 Wise Application.
          </p>
        </div>
      </footer>
    </div>
  );
}
