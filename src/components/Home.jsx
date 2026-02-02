"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useScroll, useTransform } from "framer-motion";
import { Code2, Users, Sparkles, Terminal, ChevronRight, Command } from "lucide-react";
import { useRef } from "react";
import Link from "next/link";

// Animation Variants for cleaner reuse
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
  }
};

export default function CodeAndCollab() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: targetRef });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 selection:bg-violet-500/30 selection:text-violet-200 font-sans overflow-x-hidden">
      
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="fixed inset-0 z-0 bg-gradient-to-tr from-violet-950/20 via-transparent to-transparent pointer-events-none" />

      {/* Navigation */}
     <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
            <div className="bg-violet-600 p-1.5 rounded-lg">
              <Code2 size={18} className="text-white" />
            </div>
            <span>Code & Collab</span>
          </Link>

        
        
          {/* Auth Buttons */}
          <div className="flex gap-4">
            <Link href="/register">
              <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5">
                Sign In
              </Button>
            </Link>
            
            <Link href="/register">
              <Button className="bg-white text-black hover:bg-zinc-200 font-medium rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20">
        
        {/* Hero Section */}
        <section className="px-6 max-w-7xl mx-auto text-center mb-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
              <Sparkles size={12} />
              <span>v1 is now live</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500">
              Code together, <br />
              build faster.
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
              The next-generation IDE designed for extreme collaboration. 
              Integrated AI, real-time cursors, and zero-latency syncing.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button className="h-12 px-8 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-base shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)] transition-all">
                Start Coding for Free
              </Button>
             
            </motion.div>
          </motion.div>
        </section>

        {/* IDE Preview / Hero Image */}
        <section className="px-6 mb-32" ref={targetRef}>
          <motion.div 
            style={{ opacity }}
            className="max-w-5xl mx-auto"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: "circOut" }}
          >
            <div className="relative rounded-xl border border-white/10 bg-[#111] shadow-2xl shadow-violet-900/20 overflow-hidden">
              {/* Window Controls */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#161616]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                </div>
                <div className="text-xs text-zinc-500 font-mono">main.tsx — Code & Collab</div>
                <div className="w-10"></div>
              </div>
              
              {/* Code Content */}
              <div className="p-6 font-mono text-sm md:text-base leading-7 overflow-x-auto">
                <div className="text-zinc-500 select-none mb-4">
                  <span>1</span> <br/> <span>2</span> <br/> <span>3</span> <br/> <span>4</span> <br/> <span>5</span>
                </div>
                <div className="absolute top-6 left-12 right-0 bottom-0 text-zinc-300">
                   <p><span className="text-violet-400">import</span> <span className="text-yellow-200">{`{ AnimatePresence }`}</span> <span className="text-violet-400">from</span> <span className="text-green-400">"framer-motion"</span>;</p>
                   <p>&nbsp;</p>
                   <p><span className="text-violet-400">export default function</span> <span className="text-blue-400">App</span>() {`{`}</p>
                   <p className="pl-4"><span className="text-zinc-500">// AI Intelligence active</span></p>
                   <div className="pl-4 flex items-center">
                     <span className="text-violet-400">return</span>
                     <span className="mx-2 text-yellow-200">{`<h1>`}</span>
                     <span className="relative">
                        Hello World
                        <motion.span 
                          className="absolute -right-3 top-0 h-5 w-0.5 bg-violet-500"
                          animate={{ opacity: [1, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                        />
                        <span className="absolute -top-6 left-full ml-2 bg-violet-600 text-[10px] text-white px-2 py-0.5 rounded-full whitespace-nowrap opacity-60">
                           Sarah is typing...
                        </span>
                     </span>
                     <span className="mx-2 text-yellow-200">{`</h1>`}</span>;
                   </div>
                   <p>{`}`}</p>
                </div>
              </div>
            </div>
            {/* Glow Effect under the IDE */}
            <div className="absolute -inset-4 bg-violet-500/20 blur-3xl -z-10 rounded-[50%]" />
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="px-6 max-w-7xl mx-auto mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to ship.</h2>
            <p className="text-zinc-400">Powerful features wrapped in a minimal interface.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Users />, title: "Live Collaboration", desc: "Multiplayer editing with 0ms latency." },
              { icon: <Sparkles />, title: "AI Copilot", desc: "Predictive text and smart refactoring." },
              { icon: <Terminal />, title: "Cloud Terminal", desc: "Full root access to backend containers." },
              { icon: <Command />, title: "Command Bar", desc: "Navigate your entire codebase keyboard-first." },
            ].map((feature, i) => (
              <FeatureCard key={i} {...feature} index={i} />
            ))}
          </div>
        </section>

        {/* Minimal Testimonials */}
        <section className="px-6 border-t border-white/5 bg-zinc-900/20">
          <div className="max-w-5xl mx-auto py-24">
             <h3 className="text-2xl font-semibold text-center mb-12 tracking-tight">Trusted by engineers at</h3>
             <div className="grid md:grid-cols-2 gap-8">
                <TestimonialCard 
                  quote="The latency is basically non-existent. It feels like we're sharing a single keyboard."
                  author="Alex C."
                  role="Senior Engineer"
                />
                <TestimonialCard 
                  quote="Finally, an editor that doesn't feel like a spaceship cockpit. Clean, fast, effective."
                  author="Sarah J."
                  role="Frontend Lead"
                />
             </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-white/10 bg-[#050505] py-12 text-center text-zinc-500 text-sm">
        <div className="flex justify-center gap-6 mb-8">
            <Code2 className="text-zinc-700" />
        </div>
        <p>© 2025 Code & Collab Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="h-full bg-zinc-900/50 border-white/5 hover:border-violet-500/30 transition-colors duration-300 backdrop-blur-sm group">
        <CardContent className="p-6 flex flex-col items-start h-full">
          <div className="p-3 bg-zinc-800 rounded-lg mb-4 text-zinc-300 group-hover:text-violet-400 group-hover:bg-violet-500/10 transition-colors">
            {icon}
          </div>
          <h3 className="text-lg font-medium text-zinc-200 mb-2">{title}</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TestimonialCard({ quote, author, role }) {
  return (
    <div className="bg-transparent border border-white/5 p-8 rounded-2xl">
      <p className="text-lg text-zinc-300 leading-relaxed mb-6">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600" />
        <div>
          <div className="text-sm font-medium text-white">{author}</div>
          <div className="text-xs text-zinc-500">{role}</div>
        </div>
      </div>
    </div>
  );
}