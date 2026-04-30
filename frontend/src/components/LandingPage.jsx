import React from 'react';
import { ArrowRight, Beaker, GitBranch, PlayCircle } from 'lucide-react';

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-[#1c2230] bg-[#10141c] p-10 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="mb-5 inline-flex rounded-full border border-[#273041] bg-[#151b27] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#8f97ab]">
            PromptOps
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
            Ship prompts with less noise and better feedback.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#8f97ab]">
            Version prompts, run them live, compare changes, and keep eval regressions from slipping into production.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 rounded-md bg-[#f3f4f6] px-5 py-3 text-sm font-medium text-[#0d1016] transition-colors hover:bg-white"
            >
              Open workspace
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="https://github.com/KindaJayant/PromptOps-Tool"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-[#273041] bg-transparent px-5 py-3 text-sm text-[#c8cfde] transition-colors hover:border-[#39445a] hover:text-white"
            >
              Documentation
            </a>
          </div>
        </section>

        <section className="grid gap-4">
          <FeatureCard
            icon={<PlayCircle className="h-5 w-5" />}
            title="Playground first"
            description="Run the exact prompt you are editing, with real template input, before you create a version."
          />
          <FeatureCard
            icon={<GitBranch className="h-5 w-5" />}
            title="Readable history"
            description="Compare versions, restore safely, and keep commit messages focused on actual prompt changes."
          />
          <FeatureCard
            icon={<Beaker className="h-5 w-5" />}
            title="Eval signal"
            description="Track pass rate and score against the versions that matter instead of guessing from raw output."
          />
        </section>
      </div>
    </div>
  );
};

function FeatureCard({ icon, title, description }) {
  return (
    <div className="rounded-2xl border border-[#1c2230] bg-[#10141c] p-6">
      <div className="mb-4 inline-flex rounded-md border border-[#273041] bg-[#151b27] p-2 text-[#c8cfde]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#8f97ab]">{description}</p>
    </div>
  );
}

export default LandingPage;
