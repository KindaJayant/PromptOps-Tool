import React, { useEffect, useMemo, useState } from 'react';
import { Beaker, CheckCircle, ChevronDown, Play, Plus, XCircle } from 'lucide-react';
import { api } from '../api';

const TestsTab = ({ prompt, analytics }) => {
  const [testCases, setTestCases] = useState([]);
  const [newTestCase, setNewTestCase] = useState({ input: '', expected_output: '' });
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!prompt) return;

    const load = async () => {
      const data = await api.listTestCases(prompt.id);
      setTestCases(data);
    };

    load();

    if (prompt.versions?.length) {
      const sorted = [...prompt.versions].sort((a, b) => b.version_number - a.version_number);
      setSelectedVersionId(String(sorted[0].id));
    } else {
      setSelectedVersionId('');
    }
  }, [prompt]);

  useEffect(() => {
    if (!selectedVersionId) {
      setTestResults(null);
      return;
    }

    const loadRuns = async () => {
      try {
        const runs = await api.listTestRuns(selectedVersionId);
        if (!runs.length) {
          setTestResults(null);
          return;
        }

        const latestByCase = new Map();
        [...runs]
          .sort((a, b) => new Date(b.ran_at) - new Date(a.ran_at))
          .forEach((run) => {
            if (!latestByCase.has(run.test_case_id)) {
              latestByCase.set(run.test_case_id, run);
            }
          });

        const dedupedResults = Array.from(latestByCase.values());
        const passRate = dedupedResults.length
          ? dedupedResults.filter((run) => run.passed).length / dedupedResults.length
          : 0;

        setTestResults({ results: dedupedResults, pass_rate: passRate });
      } catch (runError) {
        setError(runError.message);
      }
    };

    loadRuns();
  }, [selectedVersionId]);

  const handleAddTestCase = async (event) => {
    event.preventDefault();
    if (!newTestCase.input || !newTestCase.expected_output) return;

    const created = await api.createTestCase(prompt.id, newTestCase);
    setTestCases((current) => [...current, created]);
    setNewTestCase({ input: '', expected_output: '' });
    setIsAdding(false);
  };

  const handleRunTests = async () => {
    if (!selectedVersionId) return;

    setIsRunning(true);
    setError('');

    try {
      const data = await api.runTests(selectedVersionId);
      setTestResults(data);
    } catch (runError) {
      setError(runError.message);
    } finally {
      setIsRunning(false);
    }
  };

  const selectedStats = analytics?.version_stats?.find(
    (stat) => String(stat.version_id) === String(selectedVersionId),
  );

  const resultMap = useMemo(
    () => new Map((testResults?.results || []).map((result) => [result.test_case_id, result])),
    [testResults],
  );

  if (!prompt) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
      <section className="rounded-2xl border border-[#1c2230] bg-[#10141c] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-md border border-[#232838] bg-[#141925] p-2.5 text-[#c8cfde]">
              <Beaker className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Eval suite</h2>
              <p className="text-sm text-[#8f97ab]">Run real test cases against a specific version.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f97ab]" />
              <select
                value={selectedVersionId}
                onChange={(event) => setSelectedVersionId(event.target.value)}
                className="appearance-none rounded-md border border-[#273041] bg-[#0d1118] py-2 pl-3 pr-10 text-sm text-[#f3f4f6] outline-none transition-colors focus:border-[#45506b]"
              >
                {[...prompt.versions].sort((a, b) => b.version_number - a.version_number).map((version) => (
                  <option key={version.id} value={version.id}>
                    Version v{version.version_number}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRunTests}
              disabled={isRunning || testCases.length === 0}
              className="inline-flex items-center gap-2 rounded-md bg-[#f3f4f6] px-4 py-2.5 text-sm font-medium text-[#0d1016] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRunning ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d1016]/20 border-t-[#0d1016]" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunning ? 'Running...' : 'Run all tests'}
            </button>

            <button
              onClick={() => setIsAdding((current) => !current)}
              className="inline-flex items-center gap-2 rounded-md border border-[#273041] bg-[#141925] px-4 py-2.5 text-sm text-[#c8cfde] transition-colors hover:border-[#3b465d] hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Add test case
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Test cases"
            value={String(testCases.length)}
            helper="Stored against this prompt"
          />
          <MetricCard
            label="Latest pass rate"
            value={selectedStats?.total_runs ? `${Math.round(selectedStats.pass_rate * 100)}%` : 'No runs'}
            helper={selectedStats?.total_runs ? `${selectedStats.total_runs} recorded results` : 'Run the suite to capture signal'}
          />
          <MetricCard
            label="Average score"
            value={selectedStats?.total_runs ? `${Math.round(selectedStats.avg_score * 100)}%` : 'No score'}
            helper="Based on judge scoring"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[#4f2a2a] bg-[#1a1010] px-4 py-3 text-sm text-[#ffb3ad]">
            {error}
          </div>
        )}
      </section>

      {isAdding && (
        <section className="rounded-2xl border border-[#1c2230] bg-[#10141c] p-5">
          <h3 className="text-lg font-semibold text-white">Add a test case</h3>
          <p className="mt-1 text-sm text-[#8f97ab]">Use real inputs and the output you want the prompt to match.</p>

          <form onSubmit={handleAddTestCase} className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#c8cfde]">Input</label>
              <textarea
                required
                value={newTestCase.input}
                onChange={(event) => setNewTestCase({ ...newTestCase, input: event.target.value })}
                className="h-36 w-full resize-none rounded-xl border border-[#273041] bg-[#0d1118] px-3 py-3 text-sm text-[#f3f4f6] outline-none transition-colors focus:border-[#45506b]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#c8cfde]">Expected output</label>
              <textarea
                required
                value={newTestCase.expected_output}
                onChange={(event) => setNewTestCase({ ...newTestCase, expected_output: event.target.value })}
                className="h-36 w-full resize-none rounded-xl border border-[#273041] bg-[#0d1118] px-3 py-3 text-sm text-[#f3f4f6] outline-none transition-colors focus:border-[#45506b]"
              />
            </div>

            <div className="flex justify-end gap-3 lg:col-span-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="rounded-md border border-[#273041] px-4 py-2 text-sm text-[#c8cfde] transition-colors hover:border-[#3b465d] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-[#f3f4f6] px-4 py-2 text-sm font-medium text-[#0d1016] transition-colors hover:bg-white"
              >
                Save test case
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="space-y-4">
        {testCases.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#273041] bg-[#10141c] px-5 py-12 text-center text-sm text-[#8f97ab]">
            No test cases yet. Add the first one and then run the suite against a saved version.
          </div>
        ) : (
          testCases.map((testCase) => {
            const result = resultMap.get(testCase.id);

            return (
              <article
                key={testCase.id}
                className="rounded-2xl border border-[#1c2230] bg-[#10141c] p-5"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-[#273041] bg-[#141925] px-3 py-1 text-xs text-[#c8cfde]">
                      Case #{testCase.id}
                    </span>
                    {result ? (
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                          result.passed
                            ? 'border-[#23503a] bg-[#112219] text-[#b7f5c9]'
                            : 'border-[#5c2b2b] bg-[#211111] text-[#ffb3ad]'
                        }`}
                      >
                        {result.passed ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        {result.passed ? 'Passed' : 'Failed'}
                      </span>
                    ) : (
                      <span className="text-xs text-[#8f97ab]">No result for this version yet</span>
                    )}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <TextBlock label="Input" value={testCase.input} />
                    <TextBlock label="Expected output" value={testCase.expected_output} />
                  </div>

                  {result && (
                    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                      <TextBlock label="Actual output" value={result.actual_output} />
                      <div className="rounded-xl border border-[#273041] bg-[#0d1118] p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[#6d768d]">Judge result</div>
                        <div className="mt-3 text-2xl font-semibold text-white">
                          {Math.round(result.score * 100)}%
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[#8f97ab]">{result.reasoning}</p>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

function MetricCard({ label, value, helper }) {
  return (
    <div className="rounded-xl border border-[#273041] bg-[#0d1118] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-[#6d768d]">{label}</div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-[#8f97ab]">{helper}</div>
    </div>
  );
}

function TextBlock({ label, value }) {
  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-[#6d768d]">{label}</div>
      <div className="rounded-xl border border-[#273041] bg-[#0d1118] px-4 py-3 text-sm leading-7 text-[#edf1f7]">
        <pre className="whitespace-pre-wrap break-words font-sans">{value}</pre>
      </div>
    </div>
  );
}

export default TestsTab;
