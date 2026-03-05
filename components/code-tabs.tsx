'use client';

import { useMemo, useState } from 'react';

type TabKey = 'curl' | 'javascript' | 'python';

interface CodeTabsProps {
  curl: string;
  javascript: string;
  python: string;
}

const TAB_LABELS: Record<TabKey, string> = {
  curl: 'cURL',
  javascript: 'JavaScript',
  python: 'Python'
};

export function CodeTabs({ curl, javascript, python }: CodeTabsProps) {
  const [tab, setTab] = useState<TabKey>('curl');
  const [copied, setCopied] = useState(false);

  const currentCode = useMemo(() => {
    if (tab === 'javascript') return javascript;
    if (tab === 'python') return python;
    return curl;
  }, [curl, javascript, python, tab]);

  async function copyCode() {
    await navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/90">
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-3 py-2">
        <div className="flex gap-2">
          {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                tab === key
                  ? 'bg-cyan-500/30 text-cyan-100'
                  : 'text-slate-300 hover:bg-white/10 hover:text-slate-100'
              }`}
              onClick={() => setTab(key)}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={copyCode}
          className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <pre className="overflow-x-auto p-4 text-xs leading-6 text-cyan-100">
        <code>{currentCode}</code>
      </pre>
    </div>
  );
}
