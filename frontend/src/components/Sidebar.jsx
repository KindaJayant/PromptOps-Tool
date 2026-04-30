import React, { useEffect, useState } from 'react';
import { FileText, Plus, Search } from 'lucide-react';

import { api } from '../api';

const Sidebar = ({ onSelectPrompt, selectedPromptId, refreshTrigger }) => {
  const [prompts, setPrompts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.listPrompts().then(setPrompts);
  }, [refreshTrigger]);

  const handleCreatePrompt = async (event) => {
    event.preventDefault();
    if (!newPrompt.name.trim()) return;
    const created = await api.createPrompt(newPrompt);
    setPrompts((current) => [...current, created]);
    setNewPrompt({ name: '', description: '' });
    setIsModalOpen(false);
    onSelectPrompt(created);
  };

  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-[#1d2330] bg-[#0c0f15]">
      <div className="border-b border-[#1d2330] px-5 py-5">
        <div className="mb-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#6d768d]">PromptOps</div>
          <div className="mt-1 text-lg font-semibold text-white">Prompt Registry</div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#f3f4f6] px-4 py-2.5 text-sm font-medium text-[#0d1016] transition-colors hover:bg-white"
        >
          <Plus className="h-4 w-4" />
          New prompt
        </button>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5e677d]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search prompts"
            className="w-full rounded-md border border-[#232838] bg-[#111621] py-2 pl-9 pr-3 text-sm text-[#f3f4f6] outline-none transition-colors placeholder:text-[#5e677d] focus:border-[#3c4760]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-3 px-2 text-[11px] uppercase tracking-[0.18em] text-[#5e677d]">
          Prompts
        </div>

        <div className="space-y-1">
          {filteredPrompts.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#232838] px-3 py-4 text-sm text-[#6d768d]">
              No prompts yet.
            </div>
          ) : (
            filteredPrompts.map((prompt) => {
              const latestVersion = prompt.versions?.length
                ? [...prompt.versions].sort((a, b) => b.version_number - a.version_number)[0]
                : null;

              return (
                <button
                  key={prompt.id}
                  onClick={() => onSelectPrompt(prompt)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                    selectedPromptId === prompt.id
                      ? 'border-[#39445a] bg-[#151b27]'
                      : 'border-transparent bg-transparent hover:border-[#1d2330] hover:bg-[#111621]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md border border-[#232838] bg-[#10141d] p-2 text-[#9da6ba]">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">{prompt.name}</div>
                      <div className="mt-1 truncate text-xs text-[#6d768d]">
                        {prompt.description || 'No description yet.'}
                      </div>
                      <div className="mt-2 text-[11px] text-[#8790a5]">
                        {latestVersion ? `v${latestVersion.version_number}` : 'No versions'}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#242b3a] bg-[#11151d] p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">Create prompt</h2>
            <p className="mt-1 text-sm text-[#8f97ab]">Start with a clean prompt record.</p>

            <form onSubmit={handleCreatePrompt} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#c8cfde]">Name</label>
                <input
                  type="text"
                  required
                  value={newPrompt.name}
                  onChange={(event) => setNewPrompt({ ...newPrompt, name: event.target.value })}
                  className="w-full rounded-md border border-[#273041] bg-[#0d1118] px-3 py-2 text-[#f3f4f6] outline-none transition-colors focus:border-[#45506b]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#c8cfde]">Description</label>
                <textarea
                  value={newPrompt.description}
                  onChange={(event) => setNewPrompt({ ...newPrompt, description: event.target.value })}
                  className="h-24 w-full resize-none rounded-md border border-[#273041] bg-[#0d1118] px-3 py-2 text-[#f3f4f6] outline-none transition-colors focus:border-[#45506b]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-[#273041] px-4 py-2 text-sm text-[#c8cfde] transition-colors hover:border-[#3b465d] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#f3f4f6] px-4 py-2 text-sm font-medium text-[#0d1016] transition-colors hover:bg-white"
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
