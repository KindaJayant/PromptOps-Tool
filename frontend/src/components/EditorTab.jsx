import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Play, Save, Sparkles } from 'lucide-react';
import { api } from '../api';

const VARIABLE_PATTERN = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g;

const EditorTab = ({ prompt, analytics, onVersionSaved }) => {
  const [content, setContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [latestVersion, setLatestVersion] = useState(null);
  const [inputData, setInputData] = useState('');
  const [runResult, setRunResult] = useState(null);
  const [runError, setRunError] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (prompt?.versions?.length) {
      const sorted = [...prompt.versions].sort((a, b) => b.version_number - a.version_number);
      setLatestVersion(sorted[0]);
      setContent(sorted[0].content);
    } else {
      setLatestVersion(null);
      setContent('');
    }

    setCommitMessage('');
    setInputData('');
    setRunResult(null);
    setRunError('');
    setSaveNotice('');
  }, [prompt]);

  const variables = useMemo(() => {
    const matches = [...content.matchAll(VARIABLE_PATTERN)].map((match) => match[1]);
    return [...new Set(matches)];
  }, [content]);

  const parsedInputState = useMemo(() => {
    if (!inputData.trim()) return { valid: true };
    try {
      JSON.parse(inputData);
      return { valid: true };
    } catch {
      return { valid: false };
    }
  }, [inputData]);

  const latestStats = analytics?.version_stats?.find((stat) => stat.version_id === latestVersion?.id);

  const handleRun = async () => {
    if (!content.trim()) return;

    setIsRunning(true);
    setRunError('');

    try {
      const data = await api.runPlayground(prompt.id, {
        content,
        input_data: inputData,
      });
      setRunResult(data);
    } catch (error) {
      setRunError(error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim() || !commitMessage.trim()) return;

    setIsSaving(true);
    setSaveNotice('');

    try {
      await api.createVersion(prompt.id, {
        content,
        commit_message: commitMessage.trim(),
      });
      setCommitMessage('');
      onVersionSaved();
      setSaveNotice('Version saved.');
      window.setTimeout(() => setSaveNotice(''), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!prompt) return null;

  return (
    <div className="mx-auto flex w-full max-w-[1380px] flex-col px-6 py-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
        <section className="panel-shell overflow-hidden bg-[#10131b]">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
            <div>
              <div className="label-micro accent-label">Prompt editor</div>
              <h2 className="mt-2 font-[var(--sans)] text-[28px] font-medium tracking-[-0.04em] text-[var(--text-main)]">
                Working draft
              </h2>
            </div>
            {latestVersion && (
              <span className="inline-flex items-center border border-[rgba(255,140,50,0.24)] bg-[var(--accent-soft)] px-3 py-1 mono-ui text-[9px] uppercase tracking-[0.14em] text-[var(--accent)]">
                Drafted from v{latestVersion.version_number}
              </span>
            )}
          </div>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-[640px] w-full resize-none border-none bg-[#0f1219] px-4 py-4 mono-ui text-[11px] leading-8 text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]"
            placeholder="Write the prompt you want to evaluate."
          />

          <div className="border-t border-[var(--line)] bg-[var(--bg-panel)] px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="label-micro">Change summary</div>
                <p className="mono-ui mt-2 text-[10px] leading-6 text-[var(--text-dim)]">
                  Keep history readable. Say what changed, not just that something changed.
                </p>
              </div>
              <div className="mono-ui text-[10px] leading-6 text-[var(--text-dim)]">
                {latestStats?.total_runs
                  ? `${Math.round(latestStats.pass_rate * 100)}% pass rate on latest saved version`
                  : 'No eval signal on the latest saved version yet'}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row">
              <input
                type="text"
                value={commitMessage}
                onChange={(event) => setCommitMessage(event.target.value)}
                className="flex-1 border border-[var(--line-strong)] bg-[#0d1118] px-3 py-3 mono-ui text-[10px] text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)] focus:border-[rgba(255,140,50,0.4)]"
                placeholder="Example: tightened output format and clarified fallback behavior"
              />
              <button
                onClick={handleSave}
                disabled={isSaving || !content.trim() || !commitMessage.trim()}
                className="solid-button inline-flex items-center justify-center gap-2 px-4 py-3 mono-ui text-[10px] uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d1016]/20 border-t-[#0d1016]" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? 'Saving...' : 'Save version'}
              </button>
            </div>

            <div className="mt-3 mono-ui text-[10px] text-[var(--text-dim)]">
              {saveNotice ? (
                <span className="inline-flex items-center gap-2 text-[#b7f5c9]">
                  <CheckCircle2 className="h-4 w-4" />
                  {saveNotice}
                </span>
              ) : (
                'Saved versions become the baseline for diffs and eval runs.'
              )}
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section className="panel-shell overflow-hidden bg-[#10131b]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-4 py-3">
              <div>
                <div className="label-micro accent-label">Playground</div>
                <h2 className="mt-2 font-[var(--sans)] text-[28px] font-medium tracking-[-0.04em] text-[var(--text-main)]">
                  Run before deploy
                </h2>
              </div>
              {latestStats?.total_runs ? (
                <div className="mono-ui text-right text-[9px] uppercase tracking-[0.12em] text-[var(--text-dim)]">
                  <div>Pass {Math.round(latestStats.pass_rate * 100)}%</div>
                  <div className="mt-2 text-[var(--text-muted)]">{latestStats.total_runs} eval records</div>
                </div>
              ) : null}
            </div>

            <div className="space-y-5 px-4 py-4">
              {variables.length > 0 && (
                <div>
                  <div className="label-micro mb-3">Detected variables</div>
                  <div className="flex flex-wrap gap-2">
                    {variables.map((variable) => (
                      <span
                        key={variable}
                        className="inline-flex border border-[var(--line-strong)] bg-[#111621] px-3 py-1 mono-ui text-[9px] uppercase tracking-[0.12em] text-[var(--text-dim)]"
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="label-micro mb-3 block">Input data</label>
                <textarea
                  value={inputData}
                  onChange={(event) => setInputData(event.target.value)}
                  className="h-36 w-full resize-none border border-[var(--line-strong)] bg-[#0f1219] px-3 py-3 mono-ui text-[10px] leading-7 text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)] focus:border-[rgba(255,140,50,0.4)]"
                  placeholder={variables.length ? '{\n  "variable": "value"\n}' : 'Optional JSON or plain text input'}
                />
                {!parsedInputState.valid && (
                  <p className="mono-ui mt-2 text-[10px] leading-6 text-[#ffb37a]">
                    Invalid JSON is still allowed, but it will be treated as plain text input.
                  </p>
                )}
              </div>

              <button
                onClick={handleRun}
                disabled={isRunning || !content.trim()}
                className="outline-button inline-flex items-center gap-2 px-4 py-3 mono-ui text-[10px] uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRunning ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--text-main)]/25 border-t-[var(--accent)]" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isRunning ? 'Running...' : 'Run prompt'}
              </button>

              {runError && (
                <div className="border border-[rgba(255,111,97,0.24)] bg-[rgba(255,111,97,0.08)] px-4 py-3 mono-ui text-[10px] leading-6 text-[#ffb3ad]">
                  {runError}
                </div>
              )}

              <OutputPanel
                label="Rendered prompt"
                value={runResult?.rendered_prompt}
                emptyLabel="Run the prompt to inspect the fully rendered text."
              />
              <OutputPanel
                label="Model output"
                value={runResult?.actual_output}
                emptyLabel="The model response will show up here."
              />
            </div>
          </section>

          <section className="panel-shell-soft grid grid-cols-2 gap-px overflow-hidden bg-[var(--line)]">
            <SignalCard
              icon={<Sparkles className="h-4 w-4" />}
              label="Save loop"
              value={latestVersion ? `v${latestVersion.version_number}` : 'Draft only'}
              detail="Every saved version feeds history and evals."
            />
            <SignalCard
              icon={<Play className="h-4 w-4" />}
              label="Playground"
              value={runResult ? 'Live output' : 'Ready'}
              detail="Draft execution stays separate from saved history."
            />
          </section>
        </div>
      </div>
    </div>
  );
};

function OutputPanel({ label, value, emptyLabel }) {
  return (
    <div>
      <div className="label-micro mb-3">{label}</div>
      <div className="min-h-[150px] border border-[var(--line)] bg-[#0f1219] px-4 py-3">
        {value ? (
          <pre className="mono-ui whitespace-pre-wrap break-words text-[10px] leading-7 text-[var(--text-main)]">
            {value}
          </pre>
        ) : (
          <p className="mono-ui text-[10px] leading-7 text-[var(--text-muted)]">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}

function SignalCard({ icon, label, value, detail }) {
  return (
    <div className="bg-[rgba(21,24,33,0.74)] px-4 py-4">
      <div className="mb-3 inline-flex border border-[var(--line-strong)] bg-[#121622] p-2 text-[var(--text-dim)]">
        {icon}
      </div>
      <div className="label-micro">{label}</div>
      <div className="mt-3 font-[var(--sans)] text-[24px] font-medium tracking-[-0.04em] text-[var(--text-main)]">
        {value}
      </div>
      <div className="mono-ui mt-2 text-[10px] leading-6 text-[var(--text-dim)]">{detail}</div>
    </div>
  );
}

export default EditorTab;
