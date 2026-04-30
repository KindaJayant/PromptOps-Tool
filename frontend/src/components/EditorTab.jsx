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
    if (!inputData.trim()) return { valid: true, mode: 'empty' };
    try {
      JSON.parse(inputData);
      return { valid: true, mode: 'json' };
    } catch {
      return { valid: false, mode: 'text' };
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <div className="rounded-2xl border border-[#1c2230] bg-[#10141c]">
          <div className="flex items-center justify-between border-b border-[#1d2330] px-5 py-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[#6d768d]">Prompt body</div>
              <h2 className="mt-1 text-lg font-semibold text-white">Edit the working draft</h2>
            </div>
            {latestVersion && (
              <div className="rounded-full border border-[#273041] bg-[#141925] px-3 py-1 text-xs text-[#c8cfde]">
                Drafted from v{latestVersion.version_number}
              </div>
            )}
          </div>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-[540px] w-full resize-none bg-transparent px-5 py-5 font-mono text-[13px] leading-7 text-[#edf1f7] outline-none placeholder:text-[#4e566b]"
            placeholder="Write the prompt you want to evaluate."
          />
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[#1c2230] bg-[#10141c] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-[#6d768d]">Playground</div>
                <h2 className="mt-1 text-lg font-semibold text-white">Run before you save</h2>
              </div>
              {latestStats?.total_runs ? (
                <div className="text-right text-xs text-[#8f97ab]">
                  <div>{Math.round(latestStats.pass_rate * 100)}% pass rate</div>
                  <div>{latestStats.total_runs} eval runs on latest version</div>
                </div>
              ) : null}
            </div>

            {variables.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-[#6d768d]">Detected variables</div>
                <div className="flex flex-wrap gap-2">
                  {variables.map((variable) => (
                    <span
                      key={variable}
                      className="rounded-full border border-[#273041] bg-[#141925] px-3 py-1 text-xs text-[#c8cfde]"
                    >
                      {variable}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-[#c8cfde]">Input data</label>
              <textarea
                value={inputData}
                onChange={(event) => setInputData(event.target.value)}
                className="h-32 w-full resize-none rounded-xl border border-[#273041] bg-[#0d1118] px-3 py-3 font-mono text-sm text-[#f3f4f6] outline-none transition-colors focus:border-[#45506b] placeholder:text-[#546078]"
                placeholder={variables.length ? '{\n  "variable": "value"\n}' : 'Optional JSON or plain text input'}
              />
              {!parsedInputState.valid && (
                <p className="mt-2 text-sm text-[#f6b38a]">
                  This will be treated as plain text input unless you switch it to valid JSON.
                </p>
              )}
            </div>

            <button
              onClick={handleRun}
              disabled={isRunning || !content.trim()}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#f3f4f6] px-4 py-2.5 text-sm font-medium text-[#0d1016] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRunning ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d1016]/20 border-t-[#0d1016]" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunning ? 'Running...' : 'Run prompt'}
            </button>

            {runError && (
              <div className="mt-4 rounded-xl border border-[#4f2a2a] bg-[#1a1010] px-4 py-3 text-sm text-[#ffb3ad]">
                {runError}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <OutputPanel
                label="Rendered prompt"
                value={runResult?.rendered_prompt}
                emptyLabel="Run the prompt to inspect the final rendered text."
              />
              <OutputPanel
                label="Model output"
                value={runResult?.actual_output}
                emptyLabel="The model response will show up here."
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[#1c2230] bg-[#10141c] p-5">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4 text-[#c8cfde]" />
              <h2 className="text-lg font-semibold">Save a real version</h2>
            </div>
            <p className="mt-1 text-sm text-[#8f97ab]">
              Keep the history readable. Describe what actually changed in this revision.
            </p>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-[#c8cfde]">Change summary</label>
              <input
                type="text"
                value={commitMessage}
                onChange={(event) => setCommitMessage(event.target.value)}
                className="w-full rounded-xl border border-[#273041] bg-[#0d1118] px-3 py-3 text-sm text-[#f3f4f6] outline-none transition-colors focus:border-[#45506b] placeholder:text-[#546078]"
                placeholder="Example: tightened output format and clarified fallback behavior"
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-sm text-[#8f97ab]">
                {saveNotice ? (
                  <span className="inline-flex items-center gap-2 text-[#b7f5c9]">
                    <CheckCircle2 className="h-4 w-4" />
                    {saveNotice}
                  </span>
                ) : (
                  'A saved version becomes the baseline for history and eval runs.'
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving || !content.trim() || !commitMessage.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-[#f3f4f6] px-4 py-2.5 text-sm font-medium text-[#0d1016] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d1016]/20 border-t-[#0d1016]" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? 'Saving...' : 'Save version'}
              </button>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
};

function OutputPanel({ label, value, emptyLabel }) {
  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-[#6d768d]">{label}</div>
      <div className="min-h-[148px] rounded-xl border border-[#273041] bg-[#0d1118] px-4 py-3 font-mono text-sm leading-7 text-[#edf1f7]">
        {value ? (
          <pre className="whitespace-pre-wrap break-words font-mono">{value}</pre>
        ) : (
          <p className="font-sans text-sm text-[#6d768d]">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}

export default EditorTab;
