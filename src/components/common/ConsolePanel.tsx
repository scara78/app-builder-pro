import React from 'react';
import { Terminal, Trash2, X } from 'lucide-react';
import './ConsolePanel.css';

interface ConsoleLog {
  type: 'info' | 'success' | 'warn' | 'error';
  text: string;
  timestamp: string;
}

interface ConsolePanelProps {
  logs?: ConsoleLog[];
}

const defaultLogs: ConsoleLog[] = [
  { type: 'info', text: 'Initializing WebContainer core...', timestamp: '09:42:01' },
  { type: 'info', text: 'Mounting virtual file system...', timestamp: '09:42:02' },
  { type: 'success', text: 'WebContainer process ready.', timestamp: '09:42:03' },
  { type: 'info', text: 'Running npm install...', timestamp: '09:42:05' },
  { type: 'warn', text: 'Found 2 vulnerabilities in dependencies.', timestamp: '09:42:08' },
  {
    type: 'success',
    text: 'Vite dev server started at http://localhost:5173',
    timestamp: '09:42:10',
  },
];

const ConsolePanel: React.FC<ConsolePanelProps> = ({ logs = defaultLogs }) => {
  return (
    <div className="console-panel" data-testid="console-panel">
      <div className="console-header" data-testid="console-header">
        <div className="header-title">
          <Terminal size={14} className="icon-terminal" />
          <span>Output Console</span>
        </div>
        <div className="console-actions" data-testid="console-actions">
          <button title="Clear Logs">
            <Trash2 size={14} />
          </button>
          <div className="divider-v" data-testid="divider-v"></div>
          <button title="Close Console">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="console-content">
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
