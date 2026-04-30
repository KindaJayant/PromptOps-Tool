import React, { useState } from 'react';
import { Calendar, GitCompare, History, RotateCcw, Tag } from 'lucide-react';
import { api } from '../api';

const TAGS = ['production', 'staging', 'experiment'];

const HistoryTab = ({ prompt, analytics, onRollback, onSelectForDiff, selectedForDiff = [] }) => {
  const [isTagging, setIsTagging] = useState(null);

  const handleTag = async (versionId, tagName) => {
    await api.updateTag(versionId, tagName);
    setIsTagging(null);
    onRollback();
  };

  const handleRollback = async (versionId) => {
    if (confirm('Restore this version as the newest draft? This creates a new version.')) {
      await api.rollbackVersion(versionId);
      onRollback();
    }
  };

  if (!prompt?.versions?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-40">
        <History className="mb-4 h-12 w-12 text-[#888]" />
        <p className="text-sm font-medium text-[#888]">No versions saved yet.</p>
      </div>
    );
  }

  const sortedVersions = [...prompt.versions].sort((a, b) => b.version_number - a.version_number);
  const statsByVersion = new Map((analytics?.version_stats || []).map((stat) => [stat.version_id, stat]));

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="space-y-4">
        {sortedVersions.map((version) => {
          const stat = statsByVersion.get(version.id);

          return (
            <article
              key={version.id}
              className="rounded-2xl border border-[#1c2230] bg-[#10141c] p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-3 text-sm text-[#c8cfde]">
                      <input
                        type="checkbox"
                        checked={selectedForDiff.includes(version.id)}
                        onChange={() => onSelectForDiff(version.id)}
                        disabled={selectedForDiff.length >= 2 && !selectedForDiff.includes(version.id)}
                        className="h-4 w-4 rounded border-[#39445a] bg-[#0d1118]"
                      />
                      Compare
                    </label>
                    <span className="rounded-full border border-[#273041] bg-[#141925] px-3 py-1 text-xs text-white">
                      v{version.version_number}
                    </span>
                    {version.tag ? (
                      <span className="rounded-full border border-[#39445a] bg-[#151b27] px-3 py-1 text-xs capitalize text-[#c8cfde]">
                        {version.tag}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-4 text-base font-medium text-white">
                    {version.commit_message || 'No summary provided'}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#8f97ab]">
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(version.created_at).toLocaleString()}
                    </span>
                    {stat?.total_runs ? (
                      <>
                        <span>{Math.round(stat.pass_rate * 100)}% pass rate</span>
                        <span>{Math.round(stat.avg_score * 100)} average score</span>
                        <span>{stat.total_runs} eval results</span>
                      </>
                    ) : (
                      <span>No evals run on this version yet.</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <div className="relative">
                    <button
                      onClick={() => setIsTagging(isTagging === version.id ? null : version.id)}
                      className="inline-flex items-center gap-2 rounded-md border border-[#273041] bg-[#141925] px-3 py-2 text-sm text-[#c8cfde] transition-colors hover:border-[#3b465d] hover:text-white"
                    >
                      <Tag className="h-4 w-4" />
                      Tag
                    </button>
                    {isTagging === version.id && (
                      <div className="absolute right-0 z-20 mt-2 w-40 rounded-xl border border-[#273041] bg-[#0f131b] p-1 shadow-2xl">
                        {TAGS.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => handleTag(version.id, tag)}
                            className="w-full rounded-lg px-3 py-2 text-left text-sm capitalize text-[#c8cfde] transition-colors hover:bg-[#151b27] hover:text-white"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleRollback(version.id)}
                    className="inline-flex items-center gap-2 rounded-md border border-[#273041] bg-[#141925] px-3 py-2 text-sm text-[#c8cfde] transition-colors hover:border-[#3b465d] hover:text-white"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restore
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {selectedForDiff.length === 2 && (
        <div className="mt-6 flex justify-center">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-[#f3f4f6] px-4 py-2.5 text-sm font-medium text-[#0d1016] transition-colors hover:bg-white"
            onClick={() => onSelectForDiff('compare')}
          >
            <GitCompare className="h-4 w-4" />
            Compare versions
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
