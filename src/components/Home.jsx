"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useScroll, useTransform } from "framer-motion";
import { Code2, Users, Sparkles, Terminal, Command, ChevronRight, Zap, CheckCircle2 } from "lucide-react";
import { useRef } from "react";
import Link from "next/link";

// Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

export default function CodeAndCollab() {
  const targetRef = useRef(null);
  
  // UPDATED SCROLL LOGIC
  const { scrollYProgress } = useScroll({ 
    target: targetRef,
    // "start start" = when top of target meets top of viewport
    // "end start" = when bottom of target meets top of viewport
    offset: ["start start", "end start"] 
  });

  // Range extended to 0.85 for a much slower fade (stays visible longer)
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  // Slower scale reduction
  const scale = useTransform(scrollYProgress, [0, 0.85], [1, 0.9]);
  // Added slight Parallax: moves down slightly as you scroll, creating a "heavy" feel
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-violet-500/30 selection:text-violet-200 font-sans overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="fixed inset-0 z-0 bg-gradient-to-tr from-violet-950/10 via-transparent to-zinc-950/50 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/70 backdrop-blur-xl supports-[backdrop-filter]:bg-[#050505]/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-1.5 rounded-lg group-hover:shadow-[0_0_15px_-3px_rgba(124,58,237,0.4)] transition-all duration-300">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-zinc-100">Code & Collab</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                Sign In
              </Button>
            </Link>
            
            <Link href="/register">
              <Button className="bg-white text-black hover:bg-zinc-200 font-medium rounded-full px-5 h-9 text-sm transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20">
        
        {/* Hero Section */}
        <section className="px-6 max-w-7xl mx-auto text-center mb-24 lg:mb-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="group relative inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium mb-8 hover:border-violet-500/50 hover:bg-zinc-900/80 transition-colors cursor-pointer">
              <span className="flex h-2 w-2 rounded-full bg-violet-500 animate-pulse"></span>
              <span className="group-hover:text-violet-300 transition-colors">v2.0 is now live</span>
              <ChevronRight size={12} className="text-zinc-600 group-hover:text-violet-400" />
            </motion.div>

            {/* Main Title */}
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500 drop-shadow-sm">
              Code together, <br />
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">ship faster.</span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed tracking-tight">
              The next-generation IDE designed for extreme collaboration. 
              Integrated AI, real-time cursors, and zero-latency syncing.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button className="h-12 px-8 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-base font-medium shadow-[0_0_50px_-12px_rgba(124,58,237,0.5)] transition-all hover:scale-105 active:scale-95">
                Start Coding for Free
              </Button>
              <Button variant="outline" className="h-12 px-8 rounded-full border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-all backdrop-blur-sm">
                <Terminal size={16} className="mr-2" />
                npm install code-collab
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* IDE Preview / Hero Image */}
        <section className="px-4 sm:px-6 mb-32 relative min-h-[600px]" ref={targetRef}>
          <motion.div 
            style={{ opacity, scale, y }} 
            className="max-w-5xl mx-auto sticky top-32" 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }}
          >
            {/* Glow Behind */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-violet-500/20 blur-[120px] rounded-full -z-10" />

            <div className="relative rounded-xl border border-white/10 bg-[#0c0c0c] shadow-2xl shadow-violet-900/10 overflow-hidden ring-1 ring-white/5">
              
              {/* Window Controls & Tabs */}
              <div className="flex items-center justify-between px-4 h-12 border-b border-white/5 bg-[#111]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-2 mr-4">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]/80 hover:bg-[#FF5F56] transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]/80 hover:bg-[#FFBD2E] transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-[#27C93F]/80 hover:bg-[#27C93F] transition-colors" />
                  </div>
                </div>
                
                {/* File Tab */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-t-lg bg-[#0c0c0c] border-t border-x border-white/5 text-xs text-zinc-300 font-mono top-3">
                  <span className="text-blue-400">⚛</span>
                  App.tsx
                </div>
                
                <div className="flex items-center gap-3 text-zinc-600">
                  <div className="h-2 w-16 bg-zinc-800/50 rounded-full" />
                </div>
              </div>
              
              {/* Code Content */}
              <div className="p-0 font-mono text-sm md:text-[15px] leading-7 bg-[#0c0c0c] grid grid-cols-[3rem_1fr]">
                {/* Line Numbers */}
                <div className="flex flex-col text-right pr-4 pt-6 pb-6 text-zinc-700 bg-[#0a0a0a] select-none border-r border-white/5">
                  <span className="hover:text-zinc-500 transition-colors">1</span>
                  <span className="hover:text-zinc-500 transition-colors">2</span>
                  <span className="hover:text-zinc-500 transition-colors">3</span>
                  <span className="hover:text-zinc-500 transition-colors">4</span>
                  <span className="hover:text-zinc-500 transition-colors">5</span>
                  <span className="hover:text-zinc-500 transition-colors">6</span>
                  <span className="hover:text-zinc-500 transition-colors">7</span>
                  <span className="hover:text-zinc-500 transition-colors">8</span>
                </div>

                {/* Code Area */}
                <div className="p-6 pt-6 overflow-x-auto text-zinc-300">
                   <p><span className="text-pink-400">import</span> <span className="text-zinc-100">{`{ AnimatePresence }`}</span> <span className="text-pink-400">from</span> <span className="text-green-400">"framer-motion"</span>;</p>
                   <p>&nbsp;</p>
                   <p><span className="text-pink-400">export default function</span> <span className="text-blue-400">Hero</span>() {`{`}</p>
                   <p className="pl-6 text-zinc-500 flex items-center gap-2">
                      <Sparkles size={12} className="text-violet-500" />
                      {/* AI Suggestion */}
                      <span className="italic">AI: Analyzing component structure...</span>
                   </p>
                   <div className="pl-6 flex items-start flex-wrap">
                     <span className="text-pink-400 mr-2">return</span>
                     <span className="mr-2 text-zinc-500">{`(`}</span>
                     <span className="text-blue-300">{`<h1>`}</span>
                     <span className="relative mx-1 text-white">
                        Hello World
                        {/* Cursor */}
                        <motion.span 
                          className="absolute -right-[2px] -top-0.5 h-6 w-[2px] bg-violet-500"
                          animate={{ opacity: [1, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                        />
                        {/* User Badge */}
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute -top-8 left-0 flex items-center gap-1.5 bg-violet-600/90 backdrop-blur-md text-[10px] text-white px-2 py-1 rounded-md shadow-lg border border-violet-400/30 whitespace-nowrap z-20"
                        >
                           <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                           Sarah is typing...
                        </motion.div>
                     </span>
                     <span className="text-blue-300">{`</h1>`}</span>
                     <span className="ml-2 text-zinc-500">{`)`}</span>;
                   </div>
                   <p>{`}`}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="px-6 max-w-7xl mx-auto mb-32 z-20 relative bg-[#050505]">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">Everything you need to ship.</h2>
              <p className="text-zinc-400 text-lg">Powerful features wrapped in a minimal interface, designed for flow state.</p>
            </div>
            <Link href="/features" className="text-violet-400 hover:text-violet-300 flex items-center gap-1 text-sm font-medium transition-colors">
              View all features <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Users className="text-blue-400" />, title: "Live Collaboration", desc: "Multiplayer editing with 0ms latency synchronization." },
              { icon: <Sparkles className="text-violet-400" />, title: "AI Copilot", desc: "Predictive text, smart refactoring, and context awareness." },
              { icon: <Terminal className="text-orange-400" />, title: "Cloud Terminal", desc: "Full root access to instant backend containers." },
              { icon: <Command className="text-zinc-100" />, title: "Command Bar", desc: "Navigate your entire codebase keyboard-first." },
            ].map((feature, i) => (
              <FeatureCard key={i} {...feature} index={i} />
            ))}
          </div>
        </section>

        {/* Minimal Testimonials */}
        <section className="px-6 border-y border-white/5 bg-zinc-900/10">
          <div className="max-w-5xl mx-auto py-24">
             <div className="flex flex-col items-center text-center mb-16">
                <h3 className="text-2xl font-semibold tracking-tight text-white">Trusted by engineers at</h3>
                <div className="flex gap-8 mt-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="h-6 w-20 bg-zinc-700 rounded" />
                    <div className="h-6 w-20 bg-zinc-700 rounded" />
                    <div className="h-6 w-20 bg-zinc-700 rounded" />
                    <div className="h-6 w-20 bg-zinc-700 rounded" />
                </div>
             </div>
             
             <div className="grid md:grid-cols-2 gap-6">
                <TestimonialCard 
                  quote="The latency is basically non-existent. It feels like we're sharing a single keyboard, even across continents."
                  author="Abhay Bansal"
                  role="Senior Engineer @ Bansal Tiles limited"
                />
                <TestimonialCard 
                  quote="Finally, an editor that doesn't feel like a spaceship cockpit. Clean, fast, and the AI actually helps."
                  author="Yash Dhiman"
                  role="Frontend Lead @ red hat"
                />
             </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-white/10 bg-[#020202] py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
            <div className="mb-8 p-3 rounded-2xl bg-zinc-900/50 border border-white/5">
                <Code2 className="text-zinc-500" />
            </div>
            <div className="flex gap-8 mb-8 text-sm text-zinc-400">
                <Link href="#" className="hover:text-white transition-colors">Changelog</Link>
                <Link href="#" className="hover:text-white transition-colors">Pricing</Link>
                <Link href="#" className="hover:text-white transition-colors">About</Link>
                <Link href="#" className="hover:text-white transition-colors">Legal</Link>
            </div>
            <p className="text-zinc-600 text-xs">© 2025 Code & Collab Inc. Built for builders.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Card className="h-full bg-zinc-900/20 border-white/5 hover:border-violet-500/20 hover:bg-zinc-900/40 transition-all duration-500 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-8 flex flex-col items-start h-full relative z-10">
          <div className="p-3 bg-zinc-900 rounded-xl mb-5 border border-white/5 group-hover:border-violet-500/20 group-hover:scale-110 transition-all duration-300">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-zinc-200 mb-3 group-hover:text-white transition-colors">{title}</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TestimonialCard({ quote, author, role }) {
  return (
    <div className="bg-gradient-to-b from-zinc-900/30 to-transparent border border-white/5 p-8 rounded-2xl hover:border-white/10 transition-colors">
      <div className="flex gap-1 mb-4">
        {[1,2,3,4,5].map((_, i) => (
            <Zap key={i} size={12} className="text-violet-500 fill-violet-500" />
        ))}
      </div>
      <p className="text-lg text-zinc-300 leading-relaxed mb-8 font-light">"{quote}"</p>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
            {author.charAt(0)}
        </div>
        <div>
          <div className="text-sm font-medium text-white flex items-center gap-1">
              {author}
              <CheckCircle2 size={12} className="text-blue-500" />
          </div>
          <div className="text-xs text-zinc-500">{role}</div>
        </div>
      </div>
    </div>
  );
}