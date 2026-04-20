import React, { useState } from 'react';
import { X, Key, Cpu, ShieldCheck, AlertCircle } from 'lucide-react';
import { useSettings, AVAILABLE_MODELS } from '../../contexts/SettingsContext';
import { sanitizeInput } from '../../utils/sanitize';
import './SettingsModal.css';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { apiKey, modelId, setApiKey, setModelId, getEffectiveApiKey } = useSettings();
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localModelId, setLocalModelId] = useState(modelId);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSave = () => {
    // SEC-03: Apply sanitization to API key input
    const sanitizedApiKey = sanitizeInput(localApiKey);
    setApiKey(sanitizedApiKey);
    setModelId(localModelId);
    onClose();
  };

  const handleTest = async () => {
    setTestStatus('loading');
    const ai = (await import('../../services/ai/AIOrchestrator')).AIOrchestrator.getInstance();
    try {
      // Temporarily update config to test the local values
      ai.updateConfig(localApiKey || getEffectiveApiKey(), localModelId);
      await ai.testConnection();
      setTestStatus('success');
    } catch (err) {
      console.error(err);
      setTestStatus('error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <ShieldCheck className="icon-accent" size={20} />
            <h2>AI Configuration</h2>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <section className="settings-section">
            <div className="section-header">
              <Key size={16} />
              <h3>Gemini API Key</h3>
            </div>
            <div className="input-group">
              <input
                type="password"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="Paste your API key here..."
                className="setting-input"
              />
              {!localApiKey && (
                <div className="input-hint">
                  <AlertCircle size={12} />
                  <span>Using default system key from .env</span>
                </div>
              )}
            </div>
            <p className="field-description">
              Get your free API key from the{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
                Google AI Studio
              </a>
              .
            </p>
          </section>

          <section className="settings-section">
            <div className="section-header">
              <Cpu size={16} />
              <h3>AI Model</h3>
            </div>
            <div className="model-selector">
              {AVAILABLE_MODELS.map((model) => (
                <div
                  key={model.id}
                  className={`model-option ${localModelId === model.id ? 'active' : ''}`}
                  onClick={() => setLocalModelId(model.id)}
                >
                  <div className="model-info">
                    <span className="model-name">{model.name}</span>
                    <span className="model-desc">{model.description}</span>
                  </div>
                  {model.isHighAvailability && <span className="badge-ha">High Availability</span>}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <div className="test-status-area">
            {testStatus === 'loading' && <span className="status-loading">Testing...</span>}
            {testStatus === 'success' && <span className="status-success">✓ Connection OK!</span>}
            {testStatus === 'error' && <span className="status-error">✗ Connection Failed</span>}
          </div>
          <button className="btn-test" onClick={handleTest} disabled={testStatus === 'loading'}>
            Test Connection
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-accent" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
