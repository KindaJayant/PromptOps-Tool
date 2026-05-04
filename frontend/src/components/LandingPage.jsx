import React from 'react';
import { ArrowRight, Beaker, Clock3, GitBranch, PlayCircle } from 'lucide-react';

const features = [
  {
    icon: <PlayCircle className="h-4 w-4" />,
    title: 'Inline playground',
    description: 'Run the exact draft you are editing with real template input before you save the next version.',
  },
  {
    icon: <GitBranch className="h-4 w-4" />,
    title: 'Readable history',
    description: 'Restore safely, compare versions clearly, and keep change notes tied to actual prompt edits.',
  },
  {
    icon: <Beaker className="h-4 w-4" />,
    title: 'Eval signal',
    description: 'Watch pass rate and judge scores move with the versions that matter instead of guessing from raw output.',
  },
];

const LandingPage = ({ prompts, isLoading, onOpenWorkspace, onCreatePrompt, onSelectPrompt }) => {
  const latestPrompt = prompts[0] || null;
  const recentPrompts = prompts.slice(0, 3);
  const ctaLabel = latestPrompt ? 'Open latest workspace' : 'Create workspace';

  return (
    <div className="flex min-h-full items-center justify-center p-6 lg:p-8">
      <div className="panel-shell flex w-full max-w-[1360px] overflow-hidden bg-[#0f1014]">
        <section className="editorial-grid flex min-h-[820px] flex-1 flex-col justify-center border-r border-[var(--line)] px-10 py-12 lg:px-14">
          <div className="label-micro accent-label mb-4">PromptOps</div>
          <h1 className="thin-display max-w-[620px] text-[58px] leading-[0.94] text-[var(--text-main)] lg:text-[72px]">
            Ship prompts with less noise and better feedback.
          </h1>
          <p className="mt-6 max-w-[560px] font-[var(--mono)] text-[12px] leading-8 text-[var(--text-dim)]">
            Version prompts, run them live, compare changes, and keep eval regressions from
            slipping into production.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={latestPrompt ? onOpenWorkspace : onCreatePrompt}
              className="solid-button inline-flex items-center gap-2 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.12em]"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="https://github.com/KindaJayant/PromptOps-Tool"
              target="_blank"
              rel="noopener noreferrer"
              className="outline-button inline-flex items-center px-5 py-3 font-[var(--mono)] text-[10px] uppercase tracking-[0.12em]"
            >
              Documentation
            </a>
          </div>

          <div className="panel-shell-soft mt-10 grid max-w-[820px] grid-cols-2 gap-px overflow-hidden lg:grid-cols-4">
            <StatusCard value={isLoading ? 'Syncing' : String(prompts.length).padStart(2, '0')} label="Registry" detail="Tracked prompt workspaces" />
            <StatusCard value={latestPrompt ? 'Live' : 'Empty'} label="Workflow" detail="Real API-backed workspace" />
            <StatusCard value={latestPrompt?.versions?.length ? `v${latestPrompt.versions.length}` : 'Draft'} label="Editor" detail="Playground and save loop" />
            <StatusCard value={latestPrompt?.test_cases?.length ? String(latestPrompt.test_cases.length) : 'Eval'} label="Signal" detail="Regression-aware versions" />
          </div>

          <div className="mt-8 grid max-w-[820px] gap-3 lg:grid-cols-3">
            {recentPrompts.length > 0 ? (
              recentPrompts.map((prompt) => {
                const versionCount = prompt.versions?.length || 0;
                const testCount = prompt.test_cases?.length || 0;
                const lastUpdated = prompt.versions?.length
                  ? prompt.versions
                      .map((version) => new Date(version.created_at))
                      .sort((a, b) => b - a)[0]
                  : new Date(prompt.created_at);

                return (
                  <button
                    key={prompt.id}
                    onClick={() => onSelectPrompt(prompt)}
                    className="panel-shell text-left transition-colors hover:bg-[#141926]"
                  >
                    <div className="px-5 py-5">
                      <div className="label-micro accent-label">Workspace</div>
                      <h2 className="mt-3 font-[var(--sans)] text-[28px] font-medium tracking-[-0.04em] text-[var(--text-main)]">
                        {prompt.name}
                      </h2>
                      <p className="mono-ui mt-3 text-[10px] leading-7 text-[var(--text-dim)]">
                        {prompt.description || 'No description yet.'}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-3 mono-ui text-[9px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                        <span>{versionCount} version{versionCount === 1 ? '' : 's'}</span>
                        <span>{testCount} test{testCount === 1 ? '' : 's'}</span>
                      </div>
                      <div className="mt-5 inline-flex items-center gap-2 mono-ui text-[9px] uppercase tracking-[0.12em] text-[var(--text-dim)]">
                        <Clock3 className="h-3.5 w-3.5" />
                        {lastUpdated.toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="panel-shell lg:col-span-3">
                <div className="px-5 py-6">
                  <div className="label-micro accent-label">Workspace</div>
                  <h2 className="mt-3 font-[var(--sans)] text-[28px] font-medium tracking-[-0.04em] text-[var(--text-main)]">
                    {isLoading ? 'Loading registry' : 'Start the first prompt workspace'}
                  </h2>
                  <p className="mono-ui mt-3 max-w-[620px] text-[10px] leading-7 text-[var(--text-dim)]">
                    {isLoading
                      ? 'Pulling live prompt metadata from the API.'
                      : 'Create a prompt, save versions, and start building a clean prompt history that recruiters can inspect end to end.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="flex w-[360px] flex-col gap-4 bg-[#151821] px-7 py-8 lg:w-[390px]">
          {features.map((feature) => (
            <article key={feature.title} className="panel-shell rounded-none p-6">
              <div className="mb-5 inline-flex border border-[var(--line-strong)] bg-[#121622] p-3 text-[var(--text-dim)]">
                {feature.icon}
              </div>
              <h2 className="font-[var(--sans)] text-[26px] font-medium tracking-[-0.03em] text-[var(--text-main)]">
                {feature.title}
              </h2>
              <p className="mt-4 font-[var(--mono)] text-[11px] leading-8 text-[var(--text-dim)]">
                {feature.description}
              </p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};

function StatusCard({ value, label, detail }) {
  return (
    <div className="border-r border-[var(--line)] px-5 py-5 last:border-r-0">
      <div className="label-micro">{label}</div>
      <div className="mt-3 font-[var(--sans)] text-[30px] font-medium tracking-[-0.04em] text-[var(--text-main)]">
        {value}
      </div>
      <div className="mt-2 font-[var(--mono)] text-[10px] leading-6 text-[var(--text-dim)]">
        {detail}
      </div>
    </div>
  );
}

export default LandingPage;
