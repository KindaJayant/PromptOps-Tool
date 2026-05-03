import React, { useState } from 'react';
import { FileText, Plus, Search } from 'lucide-react';

import { api } from '../api';

const Sidebar = ({
  prompts,
  isLoading,
  onSelectPrompt,
  onPromptCreated,
  selectedPromptId,
  isCreateModalOpen,
  onOpenCreateModal,
  onCloseCreateModal,
}) => {
  const [newPrompt, setNewPrompt] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreatePrompt = async (event) => {
    event.preventDefault();
    if (!newPrompt.name.trim()) return;

    const created = await api.createPrompt(newPrompt);
    setNewPrompt({ name: '', description: '' });
    onPromptCreated(created);
  };

  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <aside className="mono-ui flex h-screen w-[232px] min-w-[232px] flex-col border-r border-[var(--line)] bg-[linear-gradient(180deg,#0c0d12_0%,#10131a_100%)] text-[var(--text-main)]">
      <div className="border-b border-[var(--line)] px-4 py-4">
        <div className="label-micro mb-2">PromptOps</div>
        <div className="font-[var(--sans)] text-[28px] font-medium tracking-[-0.04em]">Registry</div>
      </div>

      <div className="px-3 py-3">
        <button
          onClick={onOpenCreateModal}
          className="solid-button flex w-full items-center justify-center gap-2 px-4 py-3 font-[var(--mono)] text-[10px] uppercase tracking-[0.14em]"
        >
          <Plus className="h-4 w-4" />
          New prompt
        </button>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search prompts"
            className="w-full border border-[var(--line)] bg-[rgba(255,255,255,0.04)] py-2.5 pl-9 pr-3 font-[var(--mono)] text-[10px] text-[var(--text-dim)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--line-strong)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-0 pb-4">
        <div className="label-micro px-4 py-3">Prompts</div>

        {isLoading ? (
          <div className="mx-3 border border-dashed border-[var(--line)] px-4 py-5 text-[10px] leading-6 text-[var(--text-muted)]">
            Loading workspace...
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="mx-3 border border-dashed border-[var(--line)] px-4 py-5 text-[10px] leading-6 text-[var(--text-muted)]">
            No prompts yet.
          </div>
        ) : (
          <div>
            {filteredPrompts.map((prompt) => {
              const latestVersion = prompt.versions?.length
                ? [...prompt.versions].sort((a, b) => b.version_number - a.version_number)[0]
                : null;

              return (
                <button
                  key={prompt.id}
                  onClick={() => onSelectPrompt(prompt)}
                  className={`flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left transition-colors ${
                    selectedPromptId === prompt.id
                      ? 'border-l-[var(--accent)] bg-[rgba(255,255,255,0.06)] text-[var(--text-main)]'
                      : 'border-l-transparent text-[rgba(255,255,255,0.48)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-dim)]'
                  }`}
                >
                  <div className="mt-[2px] rounded-none border border-[var(--line)] bg-[rgba(255,255,255,0.03)] p-2 text-[var(--text-muted)]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-[var(--sans)] text-[16px] font-medium tracking-[-0.03em]">
                      {prompt.name}
                    </div>
                    <div className="mt-1 truncate text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      {latestVersion ? `Version ${latestVersion.version_number}` : 'No versions'}
                    </div>
                    <div className="mt-2 text-[10px] leading-6 text-[var(--text-muted)]">
                      {prompt.description || 'No description yet.'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/72 p-4">
          <div className="modal-shell w-full max-w-sm p-6">
            <div className="label-micro accent-label mb-3">Create prompt</div>
            <h2 className="font-[var(--sans)] text-[28px] font-medium tracking-[-0.04em] text-[var(--text-main)]">
              Start a new workspace
            </h2>
            <p className="mt-2 font-[var(--mono)] text-[10px] leading-6 text-[var(--text-dim)]">
              Keep it simple. Name the prompt, give it a short description, and start iterating.
            </p>

            <form onSubmit={handleCreatePrompt} className="mt-6 space-y-4">
              <div>
                <label className="label-micro mb-2 block">Name</label>
                <input
                  type="text"
                  required
                  value={newPrompt.name}
                  onChange={(event) => setNewPrompt({ ...newPrompt, name: event.target.value })}
                  className="w-full border border-[var(--line-strong)] bg-[#0d1118] px-3 py-2.5 font-[var(--mono)] text-[11px] text-[var(--text-main)] outline-none focus:border-[rgba(255,140,50,0.4)]"
                />
              </div>
              <div>
                <label className="label-micro mb-2 block">Description</label>
                <textarea
                  value={newPrompt.description}
                  onChange={(event) => setNewPrompt({ ...newPrompt, description: event.target.value })}
                  className="h-24 w-full resize-none border border-[var(--line-strong)] bg-[#0d1118] px-3 py-2.5 font-[var(--mono)] text-[11px] text-[var(--text-main)] outline-none focus:border-[rgba(255,140,50,0.4)]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCloseCreateModal}
                  className="outline-button px-4 py-2 font-[var(--mono)] text-[10px] uppercase tracking-[0.12em]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="solid-button px-4 py-2 font-[var(--mono)] text-[10px] uppercase tracking-[0.12em]"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
