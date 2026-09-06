import React, { useEffect, useRef, useState } from 'react';

type Account = { email?: string; password?: string; link?: string };

export function DnsAutomation() {
  const [password, setPassword] = useState('helloae123');
  const [count, setCount] = useState('1');
  const [domains, setDomains] = useState('api.revenuecat.com\nfirebaseremoteconfig.googleapis.com');
  const [logs, setLogs] = useState(['Awaiting configuration...']);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const start = () => {
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError(''); setLogs([]); setAccounts([]); setRunning(true);
    const params = new URLSearchParams({ password, count, domains });
    const source = new EventSource(`/automation/run?${params}`);
    source.onmessage = (event) => {
      const data = JSON.parse(event.data) as { type: string; message?: string; data?: Account };
      if (data.type === 'log' && data.message) setLogs((current) => [...current, data.message!]);
      if (data.type === 'account' && data.data) setAccounts((current) => [...current, data.data!]);
      if (data.type === 'done' || data.type === 'failed') {
        setLogs((current) => [...current, data.type === 'done' ? '=== AUTOMATION COMPLETED ===' : `Automation failed: ${data.message || 'Unknown error'}`]);
        setRunning(false); source.close();
      }
    };
    source.onerror = () => { setLogs((current) => [...current, 'Connection to server lost.']); setRunning(false); source.close(); };
  };

  return (
    <section className="dns-panel">
      <header className="dns-header"><span className="dns-badge">Automation Suite</span><h1>Locket Gold <span>DNS</span></h1><p>Professional NextDNS account automation tool</p></header>
      <div className="dns-card">
        <label className="dns-label"><span />Password (Min 8 chars)</label>
        <input className="dns-input" value={password} onChange={(event) => setPassword(event.target.value)} />
        <label className="dns-label"><span />Number of Accounts</label>
        <input className="dns-input" type="number" min="1" max="10" value={count} onChange={(event) => setCount(event.target.value)} />
        <label className="dns-label"><span />Denylist (1 per line)</label>
        <textarea className="dns-input dns-textarea" rows={3} value={domains} onChange={(event) => setDomains(event.target.value)} />
        {error && <p className="dns-error">{error}</p>}
        <button className="dns-start" type="button" onClick={start} disabled={running}>{running ? 'Running automation...' : 'Start Automation'}</button>
        <div className="dns-terminal"><div className="dns-terminal-header"><i /><i /><i /><span>automation - log</span></div><div ref={logRef} className="dns-log-box" aria-live="polite">{logs.map((log, index) => <div key={`${index}-${log}`}>{log}</div>)}</div></div>
        {accounts.length > 0 && <p className="dns-result">{accounts.length} account(s) generated successfully.</p>}
      </div>
    </section>
  );
}