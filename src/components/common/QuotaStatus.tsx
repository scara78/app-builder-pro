import { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, Activity } from 'lucide-react';
import { quotaManager } from '../../services/ai/AIQuotaManager';
import { useSettings } from '../../contexts/SettingsContext';

export function QuotaStatus() {
  const { getEffectiveApiKey } = useSettings();

  const updateStats = useCallback(() => {
    // Only show if user has API key configured
    if (!getEffectiveApiKey()) {
      return null;
    }
    return quotaManager.getStats();
  }, [getEffectiveApiKey]);

  const [stats, setStats] = useState<ReturnType<typeof quotaManager.getStats> | null>(null);

  useEffect(() => {
    // Initial fetch
    setStats(updateStats());

    // Update every second for real-time feedback
    const interval = setInterval(() => {
      setStats(updateStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [updateStats]);

  if (!stats) {
    return null; // Don't show if no API key
  }

  if (stats.circuitOpen) {
    return (
      <div
        className="quota-status error"
        data-testid="quota-status"
        data-level="error"
        title={`${stats.errorCount} errors - circuit breaker active`}
      >
        <AlertTriangle size={14} />
        <span>Circuit Break</span>
      </div>
    );
  }

  if (stats.requestCount > 10) {
    return (
      <div
        className="quota-status warning"
        data-testid="quota-status"
        data-level="warning"
        title={`${stats.requestCount}/15 requests used`}
      >
        <Activity size={14} />
        <span>{stats.requestsRemaining}</span>
      </div>
    );
  }

  return (
    <div
      className="quota-status ok"
      data-testid="quota-status"
      data-level="ok"
      title={`${stats.requestCount}/15 requests used`}
    >
      <Shield size={14} />
      <span>{stats.requestsRemaining}</span>
    </div>
  );
}
