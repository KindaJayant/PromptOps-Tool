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
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-8 pb-20">
      {/* Header & Run Controls */}
      <div className="flex justify-between items-center bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500/20 p-3 rounded-xl">
            <Beaker className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Test Suite</h2>
            <p className="text-slate-400 text-sm">Validate your prompt against edge cases</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors pointer-events-none" />
            <select
              value={selectedVersionId}
              onChange={(e) => setSelectedVersionId(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-700 rounded-lg pl-4 pr-10 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all min-w-[140px]"
            >
              {[...prompt.versions].sort((a,b) => b.version_number - a.version_number).map(v => (
                <option key={v.id} value={v.id}>Version v{v.version_number}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleRunTests}
            disabled={isRunning || testCases.length === 0}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-500/20 font-bold"
          >
            <Play className={`w-4 h-4 ${isRunning ? 'animate-pulse' : ''}`} />
            {isRunning ? 'Running...' : 'Run All Tests'}
          </button>
        </div>
      </div>

      {/* Summary Stat */}
      {testResults && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <div>
                    <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-1">Pass Rate</p>
                    <p className={`text-4xl font-black ${testResults.pass_rate >= 0.7 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {(testResults.pass_rate * 100).toFixed(0)}%
                    </p>
                </div>
                <div className="h-12 w-px bg-slate-700"></div>
                <div>
                    <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-1">Results</p>
                    <p className="text-xl font-bold text-white">
                        {testResults.results.filter(r => r.passed).length} / {testResults.results.length} Passed
                    </p>
                </div>
            </div>
            <div className="flex-1 max-w-xs mx-12">
                <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
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
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white px-2">Test Cases ({testCases.length})</h3>
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
                <Plus className="w-4 h-4" />
                Add Test Case
            </button>
        </div>

        {isAdding && (
          <div className="bg-slate-800 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl shadow-indigo-500/5 animate-in fade-in slide-in-from-top-4 duration-300">
            <form onSubmit={handleAddTestCase} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Input (User Message)</label>
                  <textarea
                    required
                    value={newTestCase.input}
                    onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm h-32 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none"
                    placeholder="e.g. Write a summary of a 500-word article about space."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Expected Output</label>
                  <textarea
                    required
                    value={newTestCase.expected_output}
                    onChange={(e) => setNewTestCase({ ...newTestCase, expected_output: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm h-32 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none"
                    placeholder="e.g. A concise 3-sentence summary highlighting key points."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
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
              <div key={tc.id} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden group hover:border-slate-600 transition-all">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded">ID: {tc.id}</div>
                      {result && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          result.passed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {result.passed ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {result.passed ? 'PASSED' : 'FAILED'} — Score: {(result.score * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-600">Input</h4>
                      <div className="bg-slate-900/50 p-4 rounded-xl text-sm text-slate-300 min-h-[80px] border border-slate-800/50 italic">"{tc.input}"</div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-600">Expected Output</h4>
                      <div className="bg-slate-900/50 p-4 rounded-xl text-sm text-slate-300 min-h-[80px] border border-slate-800/50 italic">"{tc.expected_output}"</div>
                    </div>
                  </div>

                  {result && (
                    <div className="mt-6 pt-6 border-t border-slate-700/50 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="space-y-2">
                        <h4 className="text-[10px] uppercase tracking-widest font-black text-indigo-400">Actual Output</h4>
                        <div className="bg-slate-900 p-4 rounded-xl text-sm text-white font-mono leading-relaxed border border-slate-700/30">{result.actual_output}</div>
                      </div>
                      <div className="bg-slate-900/80 rounded-xl p-4 flex gap-3 border border-slate-700/50">
                        <Info className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div>
                          <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Judge Reasoning</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{result.reasoning}</p>
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
