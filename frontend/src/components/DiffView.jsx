import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, X } from 'lucide-react';
import { api } from '../api';

const DiffView = ({ v1Id, v2Id, onClose }) => {
  const [diff, setDiff] = useState([]);
  const [v1, setV1] = useState(null);
  const [v2, setV2] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const [diffData, ver1, ver2] = await Promise.all([
        api.getDiff(v1Id, v2Id),
        api.getVersion(v1Id),
        api.getVersion(v2Id),
      ]);
      setDiff(diffData);
      setV1(ver1);
      setV2(ver2);
    };
    loadData();
  }, [v1Id, v2Id]);

  const added = diff.filter((line) => line.type === 'added').length;
  const removed = diff.filter((line) => line.type === 'removed').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(8,9,12,0.92)] backdrop-blur-md">
      <div className="mx-auto max-w-[1280px] px-6 py-10">
        <div className="panel-shell bg-[#10131b]">
          <div className="flex items-start justify-between gap-6 border-b border-[var(--line)] px-5 py-5">
            <div className="flex items-start gap-4">
              <div className="border border-[rgba(255,140,50,0.24)] bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div>
                <div className="label-micro accent-label">Diff workbench</div>
                <h2 className="mt-3 font-[var(--sans)] text-[38px] font-medium tracking-[-0.05em] text-[var(--text-main)]">
                  Version comparison
                </h2>
                <div className="mono-ui mt-3 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.12em] text-[var(--text-dim)]">
                  <span className="border border-[var(--line)] bg-[#111621] px-3 py-1">
                    v{v1?.version_number}
                  </span>
                  <span>to</span>
                  <span className="border border-[var(--line)] bg-[#111621] px-3 py-1">
                    v{v2?.version_number}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="outline-button p-3 text-[var(--text-muted)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="panel-shell-soft grid grid-cols-1 gap-px overflow-hidden bg-[var(--line)] md:grid-cols-3">
            <DiffStat label="Added lines" value={String(added)} />
            <DiffStat label="Removed lines" value={String(removed)} />
            <DiffStat label="Version span" value={`v${v1?.version_number || '?'} -> v${v2?.version_number || '?'}`} />
          </div>

          <div className="overflow-hidden">
            <div className="grid grid-cols-[56px_minmax(0,1fr)] border-b border-[var(--line)] bg-[#151821] px-4 py-3 mono-ui text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              <div>Type</div>
              <div>Content</div>
            </div>

            <div className="divide-y divide-[var(--line)]">
              {diff.map((line, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-[56px_minmax(0,1fr)] px-4 py-3 mono-ui text-[10px] leading-7 ${
                    line.type === 'added'
                      ? 'bg-[rgba(69,195,127,0.08)] text-[#b7f5c9]'
                      : line.type === 'removed'
                        ? 'bg-[rgba(255,111,97,0.08)] text-[#ffb3ad]'
                        : 'bg-[#0f1219] text-[var(--text-dim)]'
                  }`}
                >
                  <div className="text-center text-[var(--text-muted)]">
                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : '='}
                  </div>
                  <div className="whitespace-pre-wrap break-all">{line.content || ' '}</div>
                </div>
              ))}

              {diff.length === 0 && (
                <div className="px-5 py-16 text-center mono-ui text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  No changes detected between these versions
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function DiffStat({ label, value }) {
  return (
    <div className="bg-[rgba(21,24,33,0.74)] px-4 py-4">
      <div className="label-micro">{label}</div>
      <div className="mt-3 font-[var(--sans)] text-[30px] font-medium tracking-[-0.04em] text-[var(--text-main)]">
        {value}
      </div>
    </div>
  );
}

export default DiffView;
