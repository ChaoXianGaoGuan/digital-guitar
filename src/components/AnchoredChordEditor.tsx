import { useLayoutEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import { CHROMATIC_NAMES } from '../utils/note';
import { QUALITY_LABELS } from '../utils/harmony';
import type { TriadQuality } from '../utils/harmony';

interface Props {
  root: number | null;
  quality: TriadQuality | null;
  locked: boolean;
  canSubmit: boolean;
  onRoot: (root: number) => void;
  onQuality: (quality: TriadQuality) => void;
  onSubmit: () => void;
}

/** Keeps the follow-up actions close to the selected root, inside a reserved row. */
export function AnchoredChordEditor({ root, quality, locked, canSubmit, onRoot, onQuality, onSubmit }: Props) {
  const rootsRef = useRef<HTMLDivElement>(null);
  const reserveRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstQualityRef = useRef<HTMLButtonElement>(null);
  const keyboardSelectionRef = useRef(false);

  useLayoutEffect(() => {
    const roots = rootsRef.current;
    const reserve = reserveRef.current;
    const panel = panelRef.current;
    if (root === null || !roots || !reserve || !panel) return;
    const align = () => {
      const selected = roots.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
      if (!selected) return;
      const bounds = reserve.getBoundingClientRect();
      const button = selected.getBoundingClientRect();
      const center = button.left + button.width / 2 - bounds.left;
      const width = panel.getBoundingClientRect().width;
      const left = Math.max(0, Math.min(center - width / 2, bounds.width - width));
      panel.style.left = `${left}px`;
      panel.style.setProperty('--harmony-anchor-arrow', `${Math.max(12, Math.min(width - 24, center - left - 5))}px`);
    };
    align();
    if (keyboardSelectionRef.current) {
      firstQualityRef.current?.focus();
      keyboardSelectionRef.current = false;
    }
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(align);
    observer.observe(roots);
    observer.observe(reserve);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [root]);

  const selectRoot = (event: MouseEvent<HTMLButtonElement>, selected: number) => {
    keyboardSelectionRef.current = event.detail === 0;
    onRoot(selected);
    if (selected === root && keyboardSelectionRef.current) {
      firstQualityRef.current?.focus();
      keyboardSelectionRef.current = false;
    }
  };

  return <div className="harmony-nearby-editor">
    <div className="harmony-root-label">根音</div>
    <div ref={rootsRef} className="harmony-roots" role="group" aria-label="根音">
      {CHROMATIC_NAMES.map((name, value) => <button
        type="button" key={name} aria-label={`根音 ${name}`} aria-pressed={root === value}
        className={name.includes('♯') ? 'is-sharp' : ''} disabled={locked}
        onClick={event => selectRoot(event, value)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' && value === root && firstQualityRef.current) {
            event.preventDefault();
            firstQualityRef.current.focus();
          }
        }}
      >{name}</button>)}
    </div>
    <div ref={reserveRef} className="harmony-anchor-reserve">
      {root === null ? <p className="harmony-anchor-hint">选一个根音，在下方选择性质并提交。</p> : <div
        ref={panelRef} className="harmony-anchor-panel" role="group" aria-label={`${CHROMATIC_NAMES[root]} 的性质与提交`}
      >
        <div className="harmony-anchor-label">{CHROMATIC_NAMES[root]} · {locked ? '已提交' : '选择性质'}</div>
        <div className="harmony-anchor-actions">
          {(['major', 'minor', 'dim'] as const).map((value, index) => <button
            type="button" key={value} ref={index === 0 ? firstQualityRef : undefined}
            aria-pressed={quality === value} disabled={locked} onClick={() => onQuality(value)}
          >{QUALITY_LABELS[value]}{value !== 'major' && <small>{value === 'minor' ? 'm' : 'dim'}</small>}</button>)}
          <button type="button" className="harmony-primary" disabled={locked || !canSubmit} onClick={onSubmit}>
            {locked ? '已提交' : '提交答案'}
          </button>
        </div>
      </div>}
    </div>
  </div>;
}
