import React, { useEffect, useMemo, useState } from 'react';
import { Beaker, CheckCircle, ChevronDown, Play, Plus, Upload, XCircle } from 'lucide-react';
import { api } from '../api';

const VERSION_WINDOW = 5;

const TestsTab = ({ prompt, analytics, onPromptChanged }) => {
  const [testCases, setTestCases] = useState([]);
  const [matrixRows, setMatrixRows] = useState([]);
  const [newTestCase, setNewTestCase] = useState({ input: '', expected_output: '' });
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [importText, setImportText] = useState('');

  useEffect(() => {
    if (!prompt) return;

    const load = async () => {
      const [cases, matrix] = await Promise.all([
        api.listTestCases(prompt.id),
        api.getTestCaseMatrix(prompt.id),
      ]);
      setTestCases(cases);
      setMatrixRows(matrix.rows || []);
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
    await onPromptChanged?.();
  };

  const handleRunTests = async () => {
    if (!selectedVersionId) return;

    setIsRunning(true);
    setError('');

    try {
      const data = await api.runTests(selectedVersionId);
      setTestResults(data);
      await onPromptChanged?.();
    } catch (runError) {
      setError(runError.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleImportText = async () => {
    try {
      const parsed = parseImportText(importText);
      if (!parsed.length) {
        setError('No valid test cases found in import data.');
        return;
      }
      const response = await api.importTestCases(prompt.id, parsed);
      setTestCases((current) => [...current, ...response.test_cases]);
      setImportText('');
      setIsImporting(false);
      setError('');
      await onPromptChanged?.();
    } catch (importError) {
      setError(importError.message);
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setImportText(text);
      setIsImporting(true);
      setError('');
    } catch {
      setError('Could not read the selected file.');
    } finally {
      event.target.value = '';
    }
  };

  const selectedStats = analytics?.version_stats?.find(
    (stat) => String(stat.version_id) === String(selectedVersionId),
  );

  const resultMap = useMemo(
    () => new Map((testResults?.results || []).map((result) => [result.test_case_id, result])),
    [testResults],
  );

  const matrixVersions = useMemo(() => {
    const versions = [...(prompt?.versions || [])]
      .sort((a, b) => b.version_number - a.version_number)
      .slice(0, VERSION_WINDOW)
      .sort((a, b) => a.version_number - b.version_number);

    return versions;
  }, [prompt]);

  const matrixGridStyle = useMemo(
    () => ({
      gridTemplateColumns: `minmax(280px,1.2fr) repeat(${Math.max(matrixVersions.length, 1)}, minmax(112px,1fr))`,
    }),
    [matrixVersions.length],
  );

  if (!prompt) return null;

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 px-6 py-6">
      <section className="panel-shell bg-[#10131b] px-5 py-5">
        <div className="label-micro accent-label">Eval suite</div>
        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-[var(--sans)] text-[38px] font-medium tracking-[-0.05em] text-[var(--text-main)]">
              Regression signal
            </h2>
            <p className="mono-ui mt-3 max-w-[720px] text-[10px] leading-7 text-[var(--text-dim)]">
              Run real cases against a selected version and keep the score attached to the history you actually ship.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <select
                value={selectedVersionId}
                onChange={(event) => setSelectedVersionId(event.target.value)}
                className="border border-[var(--line-strong)] bg-[#0d1118] py-3 pl-3 pr-10 mono-ui text-[10px] uppercase tracking-[0.12em] text-[var(--text-main)] outline-none focus:border-[rgba(255,140,50,0.4)]"
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
              className="solid-button inline-flex items-center gap-2 px-4 py-3 mono-ui text-[10px] uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-50"
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
              className="outline-button inline-flex items-center gap-2 px-4 py-3 mono-ui text-[10px] uppercase tracking-[0.14em]"
            >
              <Plus className="h-4 w-4" />
              Add test case
            </button>
            <label className="outline-button inline-flex cursor-pointer items-center gap-2 px-4 py-3 mono-ui text-[10px] uppercase tracking-[0.14em]">
              <Upload className="h-4 w-4" />
              Import CSV / JSON
              <input type="file" accept=".csv,.json,.txt" className="hidden" onChange={handleImportFile} />
            </label>
          </div>
        </div>

        <div className="mt-6 panel-shell-soft grid grid-cols-1 gap-px overflow-hidden bg-[var(--line)] md:grid-cols-3">
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
          <div className="mt-4 border border-[rgba(255,111,97,0.24)] bg-[rgba(255,111,97,0.08)] px-4 py-3 mono-ui text-[10px] leading-6 text-[#ffb3ad]">
            {error}
          </div>
        )}
      </section>

      {isAdding && (
        <section className="panel-shell bg-[#10131b] px-5 py-5">
          <div className="label-micro accent-label">Create case</div>
          <h3 className="mt-3 font-[var(--sans)] text-[30px] font-medium tracking-[-0.04em] text-[var(--text-main)]">
            Add a regression test
          </h3>
          <p className="mono-ui mt-3 text-[10px] leading-7 text-[var(--text-dim)]">
            Use real inputs and the exact output behavior you want the prompt to preserve.
          </p>

          <form onSubmit={handleAddTestCase} className="mt-5 grid gap-4 lg:grid-cols-2">
            <Field
              label="Input"
              value={newTestCase.input}
              onChange={(event) => setNewTestCase({ ...newTestCase, input: event.target.value })}
            />
            <Field
              label="Expected output"
              value={newTestCase.expected_output}
              onChange={(event) => setNewTestCase({ ...newTestCase, expected_output: event.target.value })}
            />

            <div className="flex justify-end gap-3 lg:col-span-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="outline-button px-4 py-3 mono-ui text-[10px] uppercase tracking-[0.12em]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="solid-button px-4 py-3 mono-ui text-[10px] uppercase tracking-[0.12em]"
              >
                Save test case
              </button>
            </div>
          </form>
        </section>
      )}

      {isImporting && (
        <section className="panel-shell bg-[#10131b] px-5 py-5">
          <div className="label-micro accent-label">Bulk import</div>
          <h3 className="mt-3 font-[var(--sans)] text-[30px] font-medium tracking-[-0.04em] text-[var(--text-main)]">
            Import regression cases
          </h3>
          <p className="mono-ui mt-3 text-[10px] leading-7 text-[var(--text-dim)]">
            Paste a JSON array of objects with <span className="text-[var(--text-main)]">input</span> and <span className="text-[var(--text-main)]">expected_output</span>,
            or CSV with those same column headers.
          </p>

          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            className="mt-5 h-52 w-full resize-none border border-[var(--line-strong)] bg-[#0f1219] px-3 py-3 mono-ui text-[10px] leading-7 text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)] focus:border-[rgba(255,140,50,0.4)]"
            placeholder='[{"input":"...","expected_output":"..."}]'
          />

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsImporting(false);
                setImportText('');
              }}
              className="outline-button px-4 py-3 mono-ui text-[10px] uppercase tracking-[0.12em]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImportText}
              className="solid-button px-4 py-3 mono-ui text-[10px] uppercase tracking-[0.12em]"
            >
              Import cases
            </button>
          </div>
        </section>
      )}

      <section className="panel-shell overflow-hidden bg-[#10131b]">
        <div className="border-b border-[var(--line)] px-5 py-5">
          <div className="label-micro accent-label">Case drift</div>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="font-[var(--sans)] text-[30px] font-medium tracking-[-0.04em] text-[var(--text-main)]">
                How each case moves across versions
              </h3>
              <p className="mono-ui mt-3 max-w-[720px] text-[10px] leading-7 text-[var(--text-dim)]">
                Read the last few saved versions side by side so regressions show up before they hit production.
              </p>
            </div>
            <div className="mono-ui text-[10px] uppercase tracking-[0.12em] text-[var(--text-dim)]">
              Showing the latest {matrixVersions.length} version{matrixVersions.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        {matrixRows.length === 0 || matrixVersions.length === 0 ? (
          <div className="px-5 py-14 text-center mono-ui text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Add tests and save versions to unlock comparison signal
          </div>
        ) : (
          <div className="custom-scrollbar overflow-x-auto">
            <div className="min-w-[860px]">
              <div
                className="grid border-b border-[var(--line)] bg-[#151821] px-5 py-3 mono-ui text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
                style={matrixGridStyle}
              >
                <div>Test case</div>
                {matrixVersions.map((version) => (
                  <div key={version.id} className="text-center">
                    v{version.version_number}
                  </div>
                ))}
              </div>

              {matrixRows.map((row) => {
                const byVersionId = new Map(row.versions.map((version) => [version.version_id, version]));

                return (
                  <div
                    key={row.test_case_id}
                    className="grid items-stretch border-b border-[var(--line)] px-5 py-4"
                    style={matrixGridStyle}
                  >
                    <div className="pr-4">
                      <div className="label-micro">Case {row.test_case_id}</div>
                      <div className="mono-ui mt-3 line-clamp-3 text-[10px] leading-7 text-[var(--text-main)]">
                        {row.input}
                      </div>
                    </div>

                    {matrixVersions.map((version) => {
                      const cell = byVersionId.get(version.id);
                      return (
                        <div key={version.id} className="flex items-center justify-center px-2">
                          {cell ? (
                            <div
                              className={`w-full border px-3 py-3 text-center ${
                                cell.passed
                                  ? 'border-[rgba(69,195,127,0.2)] bg-[rgba(69,195,127,0.12)]'
                                  : 'border-[rgba(255,111,97,0.24)] bg-[rgba(255,111,97,0.08)]'
                              }`}
                            >
                              <div
                                className={`mono-ui text-[9px] uppercase tracking-[0.12em] ${
                                  cell.passed ? 'text-[#b7f5c9]' : 'text-[#ffb3ad]'
                                }`}
                              >
                                {cell.passed ? 'Pass' : 'Fail'}
                              </div>
                              <div className="mt-2 font-[var(--sans)] text-[24px] font-medium tracking-[-0.04em] text-[var(--text-main)]">
                                {Math.round((cell.score || 0) * 100)}%
                              </div>
                            </div>
                          ) : (
                            <div className="w-full border border-dashed border-[var(--line)] px-3 py-5 text-center mono-ui text-[9px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                              No run
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        {testCases.length === 0 ? (
          <div className="border border-dashed border-[var(--line)] bg-[#10131b] px-5 py-14 text-center mono-ui text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            No test cases yet
          </div>
        ) : (
          testCases.map((testCase) => {
            const result = resultMap.get(testCase.id);

            return (
              <article key={testCase.id} className="panel-shell bg-[#10131b] px-5 py-5">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex border border-[var(--line-strong)] bg-[#111621] px-3 py-1 mono-ui text-[9px] uppercase tracking-[0.12em] text-[var(--text-dim)]">
                      Case {testCase.id}
                    </span>
                    {result ? (
                      <span
                        className={`inline-flex items-center gap-2 border px-3 py-1 mono-ui text-[9px] uppercase tracking-[0.12em] ${
                          result.passed
                            ? 'border-[rgba(69,195,127,0.2)] bg-[rgba(69,195,127,0.12)] text-[#b7f5c9]'
                            : 'border-[rgba(255,111,97,0.24)] bg-[rgba(255,111,97,0.08)] text-[#ffb3ad]'
                        }`}
                      >
                        {result.passed ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        {result.passed ? 'Passed' : 'Failed'}
                      </span>
                    ) : (
                      <span className="mono-ui text-[9px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                        No result for this version yet
                      </span>
                    )}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <TextBlock label="Input" value={testCase.input} />
                    <TextBlock label="Expected output" value={testCase.expected_output} />
                  </div>

                  {result && (
                    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                      <TextBlock label="Actual output" value={result.actual_output} />
                      <div className="border border-[var(--line)] bg-[#0f1219] px-4 py-4">
                        <div className="label-micro">Judge result</div>
                        <div className="mt-3 font-[var(--sans)] text-[34px] font-medium tracking-[-0.04em] text-[var(--text-main)]">
                          {Math.round(result.score * 100)}%
                        </div>
                        <p className="mono-ui mt-3 text-[10px] leading-7 text-[var(--text-dim)]">
                          {result.reasoning}
                        </p>
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

function parseImportText(rawText) {
  const text = rawText.trim();
  if (!text) return [];

  if (text.startsWith('[')) {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new Error('JSON import must be an array of test case objects.');
    }
    return parsed
      .map((item) => ({
        input: String(item.input ?? '').trim(),
        expected_output: String(item.expected_output ?? item.expected ?? '').trim(),
      }))
      .filter((item) => item.input && item.expected_output);
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV import needs a header row and at least one test case row.');
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  const inputIndex = headers.indexOf('input');
  const expectedIndex = headers.indexOf('expected_output');

  if (inputIndex === -1 || expectedIndex === -1) {
    throw new Error('CSV import must include input and expected_output headers.');
  }

  return lines
    .slice(1)
    .map((line) => {
      const columns = splitCsvLine(line);
      return {
        input: String(columns[inputIndex] ?? '').trim(),
        expected_output: String(columns[expectedIndex] ?? '').trim(),
      };
    })
    .filter((item) => item.input && item.expected_output);
}

function splitCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function MetricCard({ label, value, helper }) {
  return (
    <div className="bg-[rgba(21,24,33,0.74)] px-4 py-4">
      <div className="label-micro">{label}</div>
      <div className="mt-3 font-[var(--sans)] text-[34px] font-medium tracking-[-0.05em] text-[var(--text-main)]">
        {value}
      </div>
      <div className="mono-ui mt-2 text-[10px] leading-6 text-[var(--text-dim)]">{helper}</div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="label-micro mb-3 block">{label}</label>
      <textarea
        required
        value={value}
        onChange={onChange}
        className="h-36 w-full resize-none border border-[var(--line-strong)] bg-[#0f1219] px-3 py-3 mono-ui text-[10px] leading-7 text-[var(--text-main)] outline-none focus:border-[rgba(255,140,50,0.4)]"
      />
    </div>
  );
}

function TextBlock({ label, value }) {
  return (
    <div>
      <div className="label-micro mb-3">{label}</div>
      <div className="border border-[var(--line)] bg-[#0f1219] px-4 py-3">
        <pre className="whitespace-pre-wrap break-words mono-ui text-[10px] leading-7 text-[var(--text-main)]">
          {value}
        </pre>
      </div>
    </div>
  );
}

export default TestsTab;
