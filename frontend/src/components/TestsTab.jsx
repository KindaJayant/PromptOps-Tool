import React, { useState, useEffect } from 'react';
import { Play, Plus, Beaker, CheckCircle, XCircle, Info, ChevronDown } from 'lucide-react';
import { api } from '../api';

const TestsTab = ({ prompt }) => {
  const [testCases, setTestCases] = useState([]);
  const [newTestCase, setNewTestCase] = useState({ input: '', expected_output: '' });
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (prompt) {
      loadTestCases();
      if (prompt.versions && prompt.versions.length > 0) {
        const sorted = [...prompt.versions].sort((a, b) => b.version_number - a.version_number);
        setSelectedVersionId(sorted[0].id);
      }
    }
  }, [prompt]);

  const loadTestCases = async () => {
    const data = await api.listTestCases(prompt.id);
    setTestCases(data);
  };

  const handleAddTestCase = async (e) => {
    e.preventDefault();
    if (!newTestCase.input || !newTestCase.expected_output) return;
    const created = await api.createTestCase(prompt.id, newTestCase);
    setTestCases([...testCases, created]);
    setNewTestCase({ input: '', expected_output: '' });
    setIsAdding(false);
  };

  const handleRunTests = async () => {
    if (!selectedVersionId) return;
    setIsRunning(true);
    try {
      const data = await api.runTests(selectedVersionId);
      setTestResults(data);
    } finally {
      setIsRunning(false);
    }
  };

  if (!prompt) return null;

  return (
    <div className="max-w-5xl mx-auto py-8 px-8 space-y-6 animate-in fade-in transition-all">
      {/* Header & Run Controls */}
      <div className="flex justify-between items-center bg-[#111] p-6 rounded-md border border-[#333]">
        <div className="flex items-center gap-4">
          <div className="bg-[#222] border border-[#333] p-2.5 rounded-md">
            <Beaker className="w-5 h-5 text-[#ededed]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#ededed] mb-1">Test Suite</h2>
            <p className="text-[#a1a1aa] text-sm">Validate your prompt against edge cases</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative group">
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888] pointer-events-none" />
            <select
              value={selectedVersionId}
              onChange={(e) => setSelectedVersionId(e.target.value)}
              className="appearance-none bg-[#000] border border-[#333] rounded-md pl-3 pr-10 py-2 text-sm text-[#ededed] focus:border-[#666] focus:outline-none transition-colors min-w-[140px]"
            >
              {[...prompt.versions].sort((a,b) => b.version_number - a.version_number).map(v => (
                <option key={v.id} value={v.id}>Version v{v.version_number}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleRunTests}
            disabled={isRunning || testCases.length === 0}
            className="vercel-button px-6 py-2 flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {isRunning ? (
              <div className="w-4 h-4 border-2 border-[#000]/30 border-t-[#000] rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isRunning ? 'Running...' : 'Run All Tests'}
          </button>
        </div>
      </div>

      {/* Summary Stat */}
      {testResults && (
        <div className="bg-[#111] border border-[#333] rounded-md p-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <div>
                    <p className="text-[#888] text-xs font-medium uppercase tracking-wider mb-2">Pass Rate</p>
                    <p className={`text-3xl font-bold ${testResults.pass_rate >= 0.7 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {(testResults.pass_rate * 100).toFixed(0)}%
                    </p>
                </div>
                <div className="h-10 w-px bg-[#333]"></div>
                <div>
                    <p className="text-[#888] text-xs font-medium uppercase tracking-wider mb-2">Results</p>
                    <p className="text-xl font-bold text-[#ededed]">
                        {testResults.results.filter(r => r.passed).length} / {testResults.results.length} Passed
                    </p>
                </div>
            </div>
            <div className="flex-1 max-w-xs mx-8">
                <div className="h-1.5 w-full bg-[#000] border border-[#333] rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ${testResults.pass_rate >= 0.7 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${testResults.pass_rate * 100}%` }}
                    />
                </div>
            </div>
        </div>
      )}

      {/* Add Test Case Form */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
            <h3 className="text-[13px] font-semibold text-[#ededed]">Test Cases ({testCases.length})</h3>
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className="text-[13px] font-medium text-[#888] hover:text-[#ededed] flex items-center gap-1.5 transition-colors"
            >
                <Plus className="w-3.5 h-3.5" />
                Add Test Case
            </button>
        </div>

        {isAdding && (
          <div className="bg-[#111] border border-[#333] rounded-md p-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleAddTestCase} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#ededed] mb-1.5">Input Context</label>
                  <textarea
                    required
                    value={newTestCase.input}
                    onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                    className="w-full bg-[#000] border border-[#333] rounded-md p-3 text-[13px] text-[#ededed] h-28 focus:border-[#666] focus:outline-none transition-colors resize-none placeholder-[#444]"
                    placeholder="e.g. Write a summary of a 500-word article about space."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#ededed] mb-1.5">Expected Output</label>
                  <textarea
                    required
                    value={newTestCase.expected_output}
                    onChange={(e) => setNewTestCase({ ...newTestCase, expected_output: e.target.value })}
                    className="w-full bg-[#000] border border-[#333] rounded-md p-3 text-[13px] text-[#ededed] h-28 focus:border-[#666] focus:outline-none transition-colors resize-none placeholder-[#444]"
                    placeholder="e.g. A concise 3-sentence summary highlighting key points."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="vercel-button-outline px-4 py-1.5 text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#ededed] hover:bg-white text-black font-medium rounded-md px-4 py-1.5 text-[13px] transition-colors"
                >
                  Save Test Case
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Test Case List / Results */}
        <div className="space-y-4">
          {testCases.map((tc) => {
            const result = testResults?.results.find(r => r.test_case_id === tc.id);
            return (
              <div key={tc.id} className="bg-[#111] border border-[#333] rounded-md overflow-hidden hover:border-[#444] transition-colors">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-[11px] font-mono text-[#888] bg-[#000] border border-[#333] px-2 py-0.5 rounded-sm">ID: {tc.id}</div>
                      {result && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-[11px] font-semibold uppercase tracking-wider border ${
                          result.passed ? 'bg-emerald-950/30 text-emerald-500 border-emerald-900/50' : 'bg-rose-950/30 text-rose-500 border-rose-900/50'
                        }`}>
                          {result.passed ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {result.passed ? 'PASSED' : 'FAILED'} • Score: {(result.score * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-semibold text-[#888]">Input</h4>
                      <div className="bg-[#000] border border-[#333] p-4 rounded-md text-[13px] text-[#ededed] min-h-[80px]">"{tc.input}"</div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-semibold text-[#888]">Expected Output</h4>
                      <div className="bg-[#000] border border-[#333] p-4 rounded-md text-[13px] text-[#a1a1aa] min-h-[80px] italic">"{tc.expected_output}"</div>
                    </div>
                  </div>

                  {result && (
                    <div className="mt-6 pt-6 border-t border-[#333] space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="space-y-2">
                        <h4 className="text-[10px] uppercase font-semibold text-[#ededed]">Actual Output</h4>
                        <div className="bg-[#000] border border-[#333] p-4 rounded-md text-[13px] text-[#ededed] font-mono leading-relaxed">{result.actual_output}</div>
                      </div>
                      <div className="bg-[#0a0a0a] border border-[#222] rounded-md p-4 flex gap-3">
                        <Info className="w-4 h-4 text-[#888] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[10px] uppercase font-semibold text-[#888] mb-1">Judge Reasoning</h4>
                          <p className="text-[13px] text-[#a1a1aa] leading-relaxed">{result.reasoning}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TestsTab;

