import React, { useEffect, useState } from 'react';
import { Activity, Beaker, FileCode2, Home, RotateCcw, Settings2 } from 'lucide-react';

import { api } from './api';
import Sidebar from './components/Sidebar';
import EditorTab from './components/EditorTab';
import HistoryTab from './components/HistoryTab';
import TestsTab from './components/TestsTab';
import DiffView from './components/DiffView';
import LandingPage from './components/LandingPage';

function App() {
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [diffSelection, setDiffSelection] = useState([]);
  const [showDiff, setShowDiff] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPromptData, setEditPromptData] = useState({ name: '', description: '' });
  const [sidebarRefresh, setSidebarRefresh] = useState(0);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!selectedPrompt) {
        setAnalytics(null);
        return;
      }
      const data = await api.getAnalytics(selectedPrompt.id);
      setAnalytics(data);
    };
    loadAnalytics();
  }, [selectedPrompt]);

  const refreshPrompt = async () => {
    if (!selectedPrompt) return;
    const [updatedPrompt, updatedAnalytics] = await Promise.all([
      api.getPrompt(selectedPrompt.id),
      api.getAnalytics(selectedPrompt.id),
    ]);
    setSelectedPrompt(updatedPrompt);
    setAnalytics(updatedAnalytics);
  };

  const handleEditOpen = () => {
    setEditPromptData({
      name: selectedPrompt.name,
      description: selectedPrompt.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editPromptData.name) return;
    const updated = await api.updatePrompt(selectedPrompt.id, editPromptData);
    setSelectedPrompt(updated);
    setIsEditModalOpen(false);
    setSidebarRefresh((value) => value + 1);
    const updatedAnalytics = await api.getAnalytics(updated.id);
    setAnalytics(updatedAnalytics);
  };

  const handleDeletePrompt = async () => {
    if (!window.confirm(`Delete "${selectedPrompt.name}"? This cannot be undone.`)) return;
    await api.deletePrompt(selectedPrompt.id);
    setSelectedPrompt(null);
    setAnalytics(null);
    setSidebarRefresh((value) => value + 1);
  };

  const handleSelectForDiff = (id) => {
    if (id === 'compare') {
      setShowDiff(true);
      return;
    }

    setDiffSelection((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length < 2) return [...current, id];
      return [current[1], id];
    });
  };

  const latestStats = analytics?.version_stats?.length
    ? [...analytics.version_stats].sort((a, b) => b.version_number - a.version_number)[0]
    : null;

  const promptVersionCount = selectedPrompt?.versions?.length || 0;
  const promptTestCount = selectedPrompt?.test_cases?.length || 0;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0d12] text-[#f3f4f6] font-sans selection:bg-[#25304a]">
      <Sidebar
        onSelectPrompt={(prompt) => {
          setSelectedPrompt(prompt);
          setActiveTab('editor');
          setDiffSelection([]);
        }}
        selectedPromptId={selectedPrompt?.id}
        refreshTrigger={sidebarRefresh}
      />

      <main className="flex flex-1 flex-col overflow-hidden bg-[#0f1218]">
        {selectedPrompt ? (
          <>
            <header className="border-b border-[#1d2330] bg-[#0f1218]/95 px-6 py-5 backdrop-blur">
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPrompt(null)}
                        className="rounded-md border border-[#232838] bg-[#121722] p-1.5 text-[#8f97ab] transition-colors hover:border-[#30384d] hover:text-[#f3f4f6]"
                      >
                        <Home className="h-4 w-4" />
                      </button>
                      <span className="rounded-full border border-[#2d3344] bg-[#171c28] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[#8f97ab]">
                        Prompt Workspace
                      </span>
                    </div>
                    <h1 className="truncate text-2xl font-semibold tracking-tight text-white">
                      {selectedPrompt.name}
                    </h1>
                    <p className="mt-1 max-w-3xl text-sm text-[#8f97ab]">
                      {selectedPrompt.description || 'Version your prompt, run it live, and watch regressions before you ship.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={refreshPrompt}
                      className="rounded-md border border-[#232838] bg-[#121722] px-3 py-2 text-sm text-[#c8cfde] transition-colors hover:border-[#30384d] hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Refresh
                      </span>
                    </button>
                    <button
                      onClick={handleEditOpen}
                      className="rounded-md border border-[#232838] bg-[#121722] p-2 text-[#8f97ab] transition-colors hover:border-[#30384d] hover:text-white"
                    >
                      <Settings2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleDeletePrompt}
                      className="rounded-md border border-[#3a2323] bg-[#1a1111] px-3 py-2 text-sm text-[#ff8f87] transition-colors hover:border-[#5c2b2b] hover:text-[#ffb3ad]"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatPill
                    icon={<FileCode2 className="h-3.5 w-3.5" />}
                    label={`${promptVersionCount} version${promptVersionCount === 1 ? '' : 's'}`}
                  />
                  <StatPill
                    icon={<Beaker className="h-3.5 w-3.5" />}
                    label={`${promptTestCount} test case${promptTestCount === 1 ? '' : 's'}`}
                  />
                  <StatPill
                    icon={<Activity className="h-3.5 w-3.5" />}
                    label={
                      latestStats && latestStats.total_runs
                        ? `${Math.round(latestStats.pass_rate * 100)}% pass rate`
                        : 'No runs yet'
                    }
                  />
                </div>

                <nav className="flex gap-2">
                  {[
                    { id: 'editor', label: 'Playground' },
                    { id: 'history', label: 'History' },
                    { id: 'tests', label: 'Evals' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-md px-3 py-2 text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'bg-[#f3f4f6] text-[#0d1016]'
                          : 'bg-[#141925] text-[#8f97ab] hover:bg-[#181e2b] hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </header>

            <div className="custom-scrollbar flex-1 overflow-y-auto">
              {activeTab === 'editor' && (
                <EditorTab
                  prompt={selectedPrompt}
                  analytics={analytics}
                  onVersionSaved={refreshPrompt}
                />
              )}
              {activeTab === 'history' && (
                <HistoryTab
                  prompt={selectedPrompt}
                  analytics={analytics}
                  onRollback={refreshPrompt}
                  onSelectForDiff={handleSelectForDiff}
                  selectedForDiff={diffSelection}
                />
              )}
              {activeTab === 'tests' && (
                <TestsTab
                  prompt={selectedPrompt}
                  analytics={analytics}
                />
              )}
            </div>
          </>
        ) : (
          <LandingPage onGetStarted={() => setSidebarRefresh((value) => value + 1)} />
        )}
      </main>

      {showDiff && diffSelection.length === 2 && (
        <DiffView
          v1Id={diffSelection[0]}
          v2Id={diffSelection[1]}
          onClose={() => {
            setShowDiff(false);
            setDiffSelection([]);
          }}
        />
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#242b3a] bg-[#11151d] p-6 shadow-2xl">
            <h2 className="mb-1 text-xl font-semibold text-white">Edit prompt details</h2>
            <p className="mb-6 text-sm text-[#8f97ab]">
              Keep metadata tidy so the workspace reads cleanly.
            </p>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#c8cfde]">Name</label>
                <input
                  type="text"
                  required
                  value={editPromptData.name}
                  onChange={(event) => setEditPromptData({ ...editPromptData, name: event.target.value })}
                  className="w-full rounded-md border border-[#273041] bg-[#0d1118] px-3 py-2 text-[#f3f4f6] outline-none transition-colors focus:border-[#45506b]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#c8cfde]">Description</label>
                <textarea
                  value={editPromptData.description}
                  onChange={(event) => setEditPromptData({ ...editPromptData, description: event.target.value })}
                  className="h-24 w-full resize-none rounded-md border border-[#273041] bg-[#0d1118] px-3 py-2 text-[#f3f4f6] outline-none transition-colors focus:border-[#45506b]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-md border border-[#273041] bg-transparent px-4 py-2 text-sm text-[#c8cfde] transition-colors hover:border-[#3b465d] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#f3f4f6] px-4 py-2 text-sm font-medium text-[#0d1016] transition-colors hover:bg-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#273041] bg-[#141925] px-3 py-1.5 text-xs text-[#c8cfde]">
      <span className="text-[#8f97ab]">{icon}</span>
      {label}
    </span>
  );
}

export default App;
