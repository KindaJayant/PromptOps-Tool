import React, { useState } from 'react';
import { Calendar, GitCompare, History, RotateCcw, Tag } from 'lucide-react';
import { api } from '../api';

const TAGS = ['production', 'staging', 'experiment'];

const HistoryTab = ({ prompt, analytics, onRollback, onSelectForDiff, selectedForDiff = [] }) => {
  const [isTagging, setIsTagging] = useState(null);

  const handleTag = async (versionId, tagName) => {
    try {
      await api.updateTag(versionId, tagName);
      setIsTagging(null);
      onRollback();
    } catch (error) {
      const detail = error.detail || {};

      if (detail.code === 'production_eval_required') {
        alert(detail.message || 'Run evals on this version before promoting it to production.');
        return;
      }

      if (detail.code === 'promotion_guardrail_failed') {
        const candidate = Math.round((detail.candidate_pass_rate || 0) * 100);
        const baseline = Math.round((detail.baseline_pass_rate || 0) * 100);
        const threshold = Math.round((detail.threshold || 0) * 100);
        const shouldForce = confirm(
          `${detail.message || 'This version is underperforming the current production tag.'}\n\n` +
            `Candidate pass rate: ${candidate}%\n` +
            `Current production: ${baseline}%\n` +
            `Guard rail threshold: ${threshold} points\n\n` +
            'Promote anyway?'
        );

        if (shouldForce) {
          await api.updateTag(versionId, tagName, true);
          setIsTagging(null);
          onRollback();
        }
        return;
      }

      alert(error.message || 'Failed to update tag.');
    }
  };

  const handleRollback = async (versionId) => {
    if (confirm('Restore this version as the newest draft? This creates a new version.')) {
      await api.rollbackVersion(versionId);
      onRollback();
    }
  };

  if (!prompt?.versions?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 opacity-50">
        <History className="mb-4 h-12 w-12 text-[var(--text-muted)]" />
        <p className="mono-ui text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
          No versions saved yet
        </p>
      </div>
    );
  }

  const sortedVersions = [...prompt.versions].sort((a, b) => b.version_number - a.version_number);
  const statsByVersion = new Map((analytics?.version_stats || []).map((stat) => [stat.version_id, stat]));

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6">
      <div className="mb-6 panel-shell bg-[#10131b] px-5 py-5">
        <div className="label-micro accent-label">Version history</div>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-[var(--sans)] text-[38px] font-medium tracking-[-0.05em] text-[var(--text-main)]">
              Changelog with signal
            </h2>
            <p className="mono-ui mt-3 max-w-[720px] text-[10px] leading-7 text-[var(--text-dim)]">
              Compare versions, restore safely, and keep score movement tied to the actual prompt changes.
            </p>
          </div>
          {selectedForDiff.length === 2 && (
            <button
              className="solid-button inline-flex items-center gap-2 px-4 py-3 mono-ui text-[10px] uppercase tracking-[0.14em]"
              onClick={() => onSelectForDiff('compare')}
            >
              <GitCompare className="h-4 w-4" />
              Compare selected versions
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {sortedVersions.map((version) => {
          const stat = statsByVersion.get(version.id);

          return (
            <article key={version.id} className="panel-shell overflow-visible bg-[#10131b] px-5 py-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="mono-ui inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.12em] text-[var(--text-dim)]">
                      <input
                        type="checkbox"
                        checked={selectedForDiff.includes(version.id)}
                        onChange={() => onSelectForDiff(version.id)}
                        disabled={selectedForDiff.length >= 2 && !selectedForDiff.includes(version.id)}
                        className="h-4 w-4 rounded border-[var(--line-strong)] bg-[#0d1118]"
                      />
                      Compare
                    </label>
                    <span className="inline-flex border border-[var(--line-strong)] bg-[#111621] px-3 py-1 mono-ui text-[9px] uppercase tracking-[0.12em] text-[var(--text-main)]">
                      v{version.version_number}
                    </span>
                    {version.tag ? (
                      <span className="inline-flex border border-[rgba(255,140,50,0.24)] bg-[var(--accent-soft)] px-3 py-1 mono-ui text-[9px] uppercase tracking-[0.12em] text-[var(--accent)]">
                        {version.tag}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-4 font-[var(--sans)] text-[30px] font-medium tracking-[-0.04em] text-[var(--text-main)]">
                    {version.commit_message || 'No summary provided'}
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-5 mono-ui text-[10px] uppercase tracking-[0.12em] text-[var(--text-dim)]">
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[var(--text-muted)]" />
                      {new Date(version.created_at).toLocaleString()}
                    </span>
                    {stat?.total_runs ? (
                      <>
                        <span>{Math.round(stat.pass_rate * 100)}% pass rate</span>
                        <span>{Math.round(stat.avg_score * 100)} score</span>
                        <span>{stat.total_runs} eval records</span>
                      </>
                    ) : (
                      <span>No evals run on this version yet</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <div className="relative">
                    <button
                      onClick={() => setIsTagging(isTagging === version.id ? null : version.id)}
                      className="outline-button inline-flex items-center gap-2 px-3 py-2 mono-ui text-[10px] uppercase tracking-[0.12em]"
                    >
                      <Tag className="h-4 w-4" />
                      Tag
                    </button>
                    {isTagging === version.id && (
                      <div className="absolute right-0 z-20 mt-2 w-44 border border-[var(--line-strong)] bg-[#10131b] p-1 shadow-2xl">
                        {TAGS.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => handleTag(version.id, tag)}
                            className="w-full px-3 py-2 text-left mono-ui text-[10px] uppercase tracking-[0.12em] text-[var(--text-dim)] transition-colors hover:bg-[#151b27] hover:text-[var(--text-main)]"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleRollback(version.id)}
                    className="outline-button inline-flex items-center gap-2 px-3 py-2 mono-ui text-[10px] uppercase tracking-[0.12em]"
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
    </div>
  );
};

export default HistoryTab;
