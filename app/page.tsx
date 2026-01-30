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
   <div className="relative w-full min-h-[500px] md:min-h-0 md:aspect-21/9 bg-[#0A0A0A] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row text-[10px] md:text-xs">
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:flex w-48 bg-[#0F0F0F] border-r border-white/5 flex-col p-4 shrink-0">
         <div className="flex items-center gap-2 mb-8">
            <div className="relative w-5 h-5">
               <Image src="/assets/logo.png" alt="logo" fill className="object-contain"/>
            </div>
            <span className="font-bold text-white tracking-widest uppercase text-[10px]">Wise</span>
         </div>
         
         <div className="space-y-1">
            <div className="text-white/30 text-[9px] uppercase tracking-wider mb-2 pl-2">Main</div>
            <div className="flex items-center gap-3 px-3 py-2 bg-white/5 text-white rounded-lg font-medium">
               <MdDashboard size={14} /> Dashboard
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-white/50 hover:text-white rounded-lg transition-colors">
               <MdWallet size={14} /> Transactions
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-white/50 hover:text-white rounded-lg transition-colors">
               <MdAutoAwesome size={14} /> FinanceGPT
            </div>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A] overflow-hidden">
         {/* Top Header */}
         <div className="h-14 md:h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 bg-[#0D0D0D]">
            <div className="flex items-center gap-3">
               <div className="md:hidden relative w-5 h-5">
                  <Image src="/assets/logo.png" alt="logo" fill className="object-contain"/>
               </div>
               <div>
                  <h3 className="text-white font-medium text-xs md:text-sm">Overview</h3>
                  <p className="text-white/30 text-[8px] md:text-[10px] hidden sm:block">Thursday, Jan 29, 2026</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="text-right">
                  <div className="text-[7px] md:text-[9px] text-white/40 uppercase tracking-wider">Safe Spend</div>
                  <div className="text-[11px] md:text-sm font-bold text-emerald-400">₹27,666</div>
               </div>
               {user?.photoURL ? (
                  <div className="relative w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border border-white/10">
                    <Image src={user.photoURL} alt="User" fill className="object-cover" />
                  </div>
               ) : (
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/10 border border-white/10" />
               )}
            </div>
         </div>

         {/* Dashboard Content */}
         <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
               {/* Income Card */}
               <div className="bg-[#141414] border border-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-tight">Monthly Income</p>
                  <p className="text-lg md:text-2xl font-bold text-white mt-1">₹1,75,000</p>
                  <div className="flex gap-2 mt-2 opacity-30">
                     <div className="h-1 w-10 bg-white rounded-full" />
                     <div className="h-1 w-6 bg-white rounded-full" />
                  </div>
               </div>
               
               {/* Spendable Card */}
               <div className="bg-[#141414] border border-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-tight">Spendable Left</p>
                  <p className="text-lg md:text-2xl font-bold text-white mt-1">₹83,000</p>
                  <div className="w-full bg-white/5 h-1 rounded-full mt-3">
                     <div className="w-1/3 h-full bg-white/20 rounded-full" />
                  </div>
               </div>

               {/* Safe Spend Card */}
               <div className="bg-[#141414] border border-white/5 rounded-xl p-4 relative overflow-hidden sm:col-span-2 lg:col-span-1">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 blur-2xl -mr-10 -mt-10" />
                  <p className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-tight">Safe Today</p>
                  <p className="text-lg md:text-2xl font-bold text-emerald-400 mt-1">₹27,666</p>
                  <div className="w-full bg-emerald-500/10 h-1.5 rounded-full mt-3 overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: "94%" }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                     />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
               {/* Projection - Interactive Look */}
               <div className="bg-[#141414] border border-white/5 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-tight">AI Projection</span>
                     <span className="text-emerald-500 text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded">ON TRACK</span>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40"><MdTrendingUp size={16}/></div>
                        <div className="flex-1">
                           <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-white/60">Spending Pace</span>
                              <span className="text-white">Low</span>
                           </div>
                           <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                              <div className="w-1/4 h-full bg-white/40" />
                           </div>
                        </div>
                     </div>
                     <p className="text-[10px] md:text-xs text-white/50 leading-relaxed italic border-l-2 border-emerald-500/50 pl-3 py-1">
                        "Your current spending pace suggests a ₹12,450 surplus by month end."
                     </p>
                  </div>
               </div>

               {/* Quick Actions - Simplified for Mobile */}
               <div className="bg-[#141414] border border-white/5 rounded-xl p-4 flex flex-col justify-between min-h-[120px]">
                  <p className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-tight mb-3">Quick Spend Check</p>
                  <div className="flex flex-wrap gap-2">
                     {[100, 500, 1000].map(amt => (
                        <div key={amt} className="flex-1 min-w-[60px] py-3 rounded-lg border border-white/5 bg-white/5 text-white/80 font-bold text-center text-xs">
                           ₹{amt}
                        </div>
                     ))}
                  </div>
                  <p className="text-[8px] text-white/20 mt-3 text-center uppercase tracking-widest">Instant Approval Engine</p>
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

      
      {/* Background with Interactive Bubble Grid */}
      <div className="fixed inset-0 z-0">
         <InteractiveGridBackground />
         <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 md:pt-48 md:pb-32 px-4 flex flex-col items-center justify-center min-h-[85vh] z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center relative z-10 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[9px] md:text-xs font-medium text-white/70 mb-6 md:mb-8 uppercase tracking-wide shadow-lg">
            <span className="w-1 min-w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            WISE 2.0 Now Available
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter mb-4 md:mb-6 leading-tight md:leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
            Control your wealth <br className="hidden sm:block" />
            with precise insights.
          </h1>
          
          <p className="text-xs md:text-md text-white/50 max-w-[280px] sm:max-w-xl mx-auto mb-8 md:mb-10 leading-relaxed md:leading-relaxed">
            The minimal finance dashboard designed for the modern era. 
            Real-time tracking, AI predictions, and bank-grade security.
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
          className="mt-12 md:mt-24 w-full max-w-5xl mx-auto relative"
          style={{ perspective: "1000px" }}
        >
            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] -z-10 rounded-full opacity-50" />
            <div style={{ transform: "rotateX(5deg) translateY(-2%)" }} className="w-full">
              <EnhancedDashboardMockup user={user} />
            </div>
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
