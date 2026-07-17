import { useEffect, useState } from 'react';

/** Custom window chrome — rendered only inside the Electron app (frame: false). */
export default function TitleBar() {
  const desktop = window.desktop;
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!desktop) return;
    return desktop.onMaximizeChange(setMaximized);
  }, [desktop]);

  if (!desktop) return null;

  return (
    <header className="titlebar" onDoubleClick={() => desktop.toggleMaximize()}>
      <svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="#1c2333" />
        <path d="M4 10h7m10 0h7M4 22h7m10 0h7" stroke="#4f6ef7" strokeWidth="3" strokeLinecap="round" />
        <path d="M11 10c5 0 5 12 10 12M11 22c5 0 5-12 10-12" stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
      <span className="titlebar-title">Wiring Viz</span>
      <div className="titlebar-buttons" onDoubleClick={(e) => e.stopPropagation()}>
        <button type="button" title="Minimize" onClick={() => desktop.minimize()}>
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 5h10" stroke="currentColor" strokeWidth="1.2" /></svg>
        </button>
        <button type="button" title={maximized ? 'Restore' : 'Maximize'} onClick={() => desktop.toggleMaximize()}>
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M2.5 2.5V.5h7v7h-2" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <rect x="0.5" y="2.5" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          )}
        </button>
        <button type="button" className="titlebar-close" title="Close" onClick={() => desktop.close()}>
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1.2" /></svg>
        </button>
      </div>
    </header>
  );
}
