import React from 'react';
import { Shield, Zap, Activity, ChevronRight, GitBranch, Cpu } from 'lucide-react';

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="min-h-full flex flex-col items-center px-6 py-20 bg-transparent selection:bg-indigo-500/30">
      {/* Hero Section */}
      <div className="max-w-4xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wider uppercase">
          <Zap className="w-3 h-3" />
          Powered by OpenRouter & Arcee
        </div>
        
        <h1 className="text-6xl md:text-8xl font-extrabold text-white tracking-tight leading-none">
          Master Your <br />
          <span className="text-gradient">Model's Mind.</span>
        </h1>
        
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The elite version control system for LLM prompts. 
          Stop guessing, start engineering with automated testing, 
          diffing, and AI-powered evaluation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button 
            onClick={onGetStarted}
            className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-all glow-indigo hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            Go to Workspace
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="px-6 py-4 glass-card border-none text-slate-400 text-sm font-medium">
            100% Local Storage • Zero Config
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mt-32 w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
        <FeatureCard 
          icon={<GitBranch className="w-6 h-6 text-indigo-400" />}
          title="Git-Level Versioning"
          desc="Track changes, add commit messages, and rollback to any version with side-by-side diffs."
          index="01"
        />
        <FeatureCard 
          icon={<Activity className="w-6 h-6 text-purple-400" />}
          title="Parallel Testing"
          desc="Run hundreds of test cases concurrently. Speed up your workflow with high-concurrency evaluation."
          index="02"
        />
        <FeatureCard 
          icon={<Cpu className="w-6 h-6 text-pink-400" />}
          title="AI-Powered Judge"
          desc="Automatically score prompt outputs using an LLM judge with structured reasoning."
          index="03"
        />
      </div>

      {/* Decorative Blur Elements */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -z-10" />
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, index }) => (
  <div className="glass-card p-8 group hover:border-indigo-500/30 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
    <div className="mb-6 bg-slate-800 w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-500">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    <span className="absolute top-8 right-8 text-4xl font-black text-white/5 group-hover:text-indigo-500/10 transition-colors uppercase italic font-serif">
        {index}
    </span>
    
    {/* Subtle Inner Glow */}
    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
);

export default LandingPage;
