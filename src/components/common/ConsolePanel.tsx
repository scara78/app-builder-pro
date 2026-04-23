import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Terminal, Trash2, X } from 'lucide-react';
import './ConsolePanel.css';
import type { ConsoleLog } from '../../types';

interface ConsolePanelProps {
  logs: ConsoleLog[];
  onClear?: () => void;
  onClose?: () => void;
}

const ConsolePanel: React.FC<ConsolePanelProps> = ({ logs, onClear, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  const isNearBottom = useCallback(() => {
    const el = contentRef.current;
    if (!el) return true;
    const threshold = 30;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  const handleScroll = useCallback(() => {
    autoScrollRef.current = isNearBottom();
  }, [isNearBottom]);

  useEffect(() => {
    if (autoScrollRef.current && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [logs]);

  const handleClose = useCallback(() => {
    setIsCollapsed(true);
    onClose?.();
  }, [onClose]);

  const handleExpand = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  const lastLogText = logs.length > 0 ? logs[logs.length - 1].text : 'No output yet';

  if (isCollapsed) {
    return (
      <div
        className="console-collapsed"
        data-testid="console-collapsed"
        onClick={handleExpand}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleExpand();
        }}
      >
        <Terminal size={12} className="icon-terminal" />
        <span className="collapsed-preview" data-testid="collapsed-preview">
          {lastLogText}
        </span>
      </div>
    );
  }

  return (
    <div className="console-panel" data-testid="console-panel">
      <div className="console-header" data-testid="console-header">
        <div className="header-title">
          <Terminal size={14} className="icon-terminal" />
          <span>Output Console</span>
        </div>
        <div className="console-actions" data-testid="console-actions">
          <button title="Clear Logs" onClick={onClear} data-testid="clear-button">
            <Trash2 size={14} />
          </button>
          <div className="divider-v" data-testid="divider-v"></div>
          <button title="Close Console" onClick={handleClose} data-testid="close-button">
            <X size={14} />
          </button>
        </div>
      </div>

      <div
        className="console-content"
        ref={contentRef}
        onScroll={handleScroll}
        data-testid="console-content"
      >
        {logs.map((log, i) => (
          <div
            key={i}
            className={`log-entry ${log.type}`}
            data-testid="log-entry"
            data-type={log.type}
          >
            <span className="log-time" data-testid="log-time">
              [{log.timestamp}]
            </span>
            <span className="log-text" data-testid="log-text">
              {log.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConsolePanel;
