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
  const [prompts, setPrompts] = useState([]);
  const [isPromptsLoading, setIsPromptsLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [diffSelection, setDiffSelection] = useState([]);
  const [showDiff, setShowDiff] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editPromptData, setEditPromptData] = useState({ name: '', description: '' });
  const [analytics, setAnalytics] = useState(null);

  const loadPrompts = async () => {
    setIsPromptsLoading(true);
    try {
      const data = await api.listPrompts();
      const sortedPrompts = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPrompts(sortedPrompts);
      return sortedPrompts;
    } finally {
      setIsPromptsLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

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

  const handleSelectPrompt = async (prompt) => {
    const hydratedPrompt = await api.getPrompt(prompt.id);
    setSelectedPrompt(hydratedPrompt);
    setPrompts((current) =>
      current.map((item) => (item.id === hydratedPrompt.id ? hydratedPrompt : item)),
    );
    setActiveTab('editor');
    setDiffSelection([]);
  };

  const refreshPrompt = async () => {
    if (!selectedPrompt) return;
    const [updatedPrompt, updatedAnalytics] = await Promise.all([
      api.getPrompt(selectedPrompt.id),
      api.getAnalytics(selectedPrompt.id),
    ]);
    setSelectedPrompt(updatedPrompt);
    setPrompts((current) =>
      current.map((prompt) => (prompt.id === updatedPrompt.id ? updatedPrompt : prompt)),
    );
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
    setPrompts((current) =>
      current.map((prompt) => (prompt.id === updated.id ? updated : prompt)),
    );
    setIsEditModalOpen(false);
    const updatedAnalytics = await api.getAnalytics(updated.id);
    setAnalytics(updatedAnalytics);
  };

  const handleDeletePrompt = async () => {
    if (!window.confirm(`Delete "${selectedPrompt.name}"? This cannot be undone.`)) return;
    await api.deletePrompt(selectedPrompt.id);
    setPrompts((current) => current.filter((prompt) => prompt.id !== selectedPrompt.id));
    setSelectedPrompt(null);
    setAnalytics(null);
  };

  const handlePromptCreated = (createdPrompt) => {
    setPrompts((current) => [createdPrompt, ...current]);
    setIsCreateModalOpen(false);
    handleSelectPrompt(createdPrompt);
  };

  const handleOpenWorkspace = async () => {
    if (prompts.length > 0) {
      const latestPrompt = prompts[0];
      const hydratedPrompt = await api.getPrompt(latestPrompt.id);
      handleSelectPrompt(hydratedPrompt);
      return;
    }

    setIsCreateModalOpen(true);
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
    <div className="flex h-screen overflow-hidden bg-[var(--bg-deep)] text-[var(--text-main)] selection:bg-[rgba(255,140,50,0.2)]">
      <Sidebar
        prompts={prompts}
        isLoading={isPromptsLoading}
        onSelectPrompt={handleSelectPrompt}
        onPromptCreated={handlePromptCreated}
        selectedPromptId={selectedPrompt?.id}
        isCreateModalOpen={isCreateModalOpen}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onCloseCreateModal={() => setIsCreateModalOpen(false)}
      />

      <main className="flex flex-1 flex-col overflow-hidden bg-[var(--bg-deep)]">
        {selectedPrompt ? (
          <>
            <header className="border-b border-[var(--line)] bg-[rgba(15,16,20,0.96)] backdrop-blur">
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-6 px-6 py-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2 mono-ui">
                      <button
                        onClick={() => setSelectedPrompt(null)}
                        className="outline-button p-1.5 text-[var(--text-muted)]"
                      >
                        <Home className="h-4 w-4" />
                      </button>
                      <span className="label-micro">
                        Prompt Workspace
                      </span>
                    </div>
                    <h1 className="thin-display truncate text-[42px] leading-none text-[var(--text-main)]">
                      {selectedPrompt.name}
                    </h1>
                    <p className="mono-ui mt-3 max-w-3xl text-[11px] leading-7 text-[var(--text-dim)]">
                      {selectedPrompt.description || 'Version your prompt, run it live, and watch regressions before you ship.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={refreshPrompt}
                      className="outline-button mono-ui px-3 py-2 text-[10px] uppercase tracking-[0.12em]"
                    >
                      <span className="flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Refresh
                      </span>
                    </button>
                    <button
                      onClick={handleEditOpen}
                      className="outline-button p-2 text-[var(--text-muted)]"
                    >
                      <Settings2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleDeletePrompt}
                      className="border border-[rgba(255,111,97,0.24)] bg-[rgba(255,111,97,0.08)] px-3 py-2 mono-ui text-[10px] uppercase tracking-[0.12em] text-[#ffb3ad] transition-colors hover:bg-[rgba(255,111,97,0.14)]"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 px-6">
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

                <nav className="flex gap-1 px-6">
                  {[
                    { id: 'editor', label: 'Playground' },
                    { id: 'history', label: 'History' },
                    { id: 'tests', label: 'Evals' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`mono-ui border-b-2 px-3 py-3 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                        activeTab === tab.id
                          ? 'border-b-[var(--accent)] text-[var(--text-main)]'
                          : 'border-b-transparent text-[var(--text-muted)] hover:text-[var(--text-dim)]'
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
                  onPromptChanged={refreshPrompt}
                />
              )}
            </div>
          </>
        ) : (
          <LandingPage
            prompts={prompts}
            isLoading={isPromptsLoading}
            onOpenWorkspace={handleOpenWorkspace}
            onCreatePrompt={() => setIsCreateModalOpen(true)}
            onSelectPrompt={handleSelectPrompt}
          />
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
          <div className="modal-shell w-full max-w-md p-6">
            <div className="label-micro accent-label mb-3">Edit prompt</div>
            <h2 className="font-[var(--sans)] text-[30px] font-medium tracking-[-0.04em] text-[var(--text-main)]">Edit prompt details</h2>
            <p className="mono-ui mb-6 mt-2 text-[10px] leading-6 text-[var(--text-dim)]">
              Keep metadata tidy so the workspace reads cleanly.
            </p>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="label-micro mb-2 block">Name</label>
                <input
                  type="text"
                  required
                  value={editPromptData.name}
                  onChange={(event) => setEditPromptData({ ...editPromptData, name: event.target.value })}
                  className="w-full border border-[var(--line-strong)] bg-[#0d1118] px-3 py-2.5 mono-ui text-[11px] text-[var(--text-main)] outline-none focus:border-[rgba(255,140,50,0.4)]"
                />
              </div>
              <div>
                <label className="label-micro mb-2 block">Description</label>
                <textarea
                  value={editPromptData.description}
                  onChange={(event) => setEditPromptData({ ...editPromptData, description: event.target.value })}
                  className="h-24 w-full resize-none border border-[var(--line-strong)] bg-[#0d1118] px-3 py-2.5 mono-ui text-[11px] text-[var(--text-main)] outline-none focus:border-[rgba(255,140,50,0.4)]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="outline-button px-4 py-2 mono-ui text-[10px] uppercase tracking-[0.12em]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="solid-button px-4 py-2 mono-ui text-[10px] uppercase tracking-[0.12em]"
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
    <span className="mono-ui inline-flex items-center gap-2 border border-[var(--line)] bg-[var(--bg-panel)] px-3 py-1.5 text-[9px] uppercase tracking-[0.12em] text-[var(--text-dim)]">
      <span className="text-[var(--text-muted)]">{icon}</span>
      {label}
    </span>
  );
}

export default App;
