import React from 'react';
import { GitBranch, Activity, Cpu } from 'lucide-react';

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-20 bg-black selection:bg-gray-800">
      
      {/* Hero Section */}
      <div className="max-w-4xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <h1 className="text-5xl md:text-7xl font-bold text-[#ededed] tracking-tighter leading-tight">
          Master Your <br className="hidden md:block"/> Model's Mind
        </h1>
        
        <p className="text-lg text-[#a1a1aa] max-w-2xl mx-auto leading-normal">
          The version control system for LLM prompts. 
          Automated testing, side-by-side diffing, and AI evaluation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <button 
            onClick={onGetStarted}
            className="vercel-button px-6 py-2.5 flex items-center justify-center"
          >
            Go to Workspace
          </button>
          
          <button className="vercel-button-outline px-6 py-2.5">
            Documentation
          </button>
        </div>
      </div>

      {/* Features Outline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mt-24 w-full animate-in fade-in duration-1000 delay-300">
        <FeatureOutline 
          icon={<GitBranch className="w-5 h-5" />}
          title="Git-Level Versioning"
        />
        <FeatureOutline 
          icon={<Activity className="w-5 h-5" />}
          title="Parallel Testing"
        />
        <FeatureOutline 
          icon={<Cpu className="w-5 h-5" />}
          title="AI-Powered Judge"
        />
      </div>

    </div>
  );
};

const FeatureOutline = ({ icon, title }) => (
  <div className="vercel-card p-6 flex flex-col items-start gap-4">
    <div className="text-[#ededed]">
      {icon}
    </div>
    <h3 className="text-sm font-semibold text-[#ededed]">{title}</h3>
  </div>
);

export default LandingPage;
