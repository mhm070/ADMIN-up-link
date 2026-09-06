import React, { useEffect, useRef, useState } from 'react';

type Account = { email?: string; password?: string; link?: string };
const API_BASE = (import.meta.env.VITE_API_URL?.trim() || 'http://localhost:8080').replace(/\/$/, '');

export function DnsAutomation() {
  const [password, setPassword] = useState('helloae123');
  const [count, setCount] = useState('1');
  const [domains, setDomains] = useState('api.revenuecat.com\nfirebaseremoteconfig.googleapis.com');
  const [logs, setLogs] = useState<string[]>(['Awaiting configuration...']);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const start = () => {
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError(''); setLogs([]); setAccounts([]); setRunning(true); setShowPreview(false);
    const params = new URLSearchParams({ password, count, domains });
    const source = new EventSource(`${API_BASE}/automation/run?${params.toString()}`);
    
    source.onmessage = (event) => {
      const data = JSON.parse(event.data) as { type: string; message?: string; data?: Account };
      if (data.type === 'log' && data.message) setLogs((current) => [...current, data.message!]);
      if (data.type === 'account' && data.data) setAccounts((current) => [...current, data.data!]);
      if (data.type === 'done' || data.type === 'failed') {
        setLogs((current) => [...current, data.type === 'done' ? '=== AUTOMATION COMPLETED ===' : `Automation failed: ${data.message || 'Unknown error'}`]);
        setRunning(false); source.close();
      }
    };
    source.onerror = () => { 
      setLogs((current) => [...current, 'Connection to server lost. But your processed accounts are saved!']); 
      setRunning(false); source.close(); 
    };
  };

  const downloadAccounts = () => {
    let content = '[Accounts Data]\n';
    accounts.forEach((acc) => {
        if (acc.email && acc.password) content += `${acc.email} | ${acc.password}\n`;
    });
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Accounts_And_Passwords.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadLinks = () => {
    let content = '[Locket Gold]\n';
    accounts.forEach((acc) => {
        if (acc.link && acc.link !== 'Link Not Found') content += `${acc.link}\n`;
    });
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'links.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        
        <div className="dns-terminal">
          <div className="dns-terminal-header"><i /><i /><i /><span>automation - log</span></div>
          <div ref={logRef} className="dns-log-box" aria-live="polite">
            {logs.map((log, index) => <div key={`${index}-${log}`}>{log}</div>)}
          </div>
        </div>
        
        {accounts.length > 0 && (
          <div className="mt-6 flex flex-col gap-3">
            <p className="text-emerald-400 font-bold mb-2 text-sm">{accounts.length} account(s) generated successfully.</p>
            <button type="button" onClick={downloadAccounts} className="w-full py-3 rounded-lg font-bold text-white shadow-lg bg-gradient-to-br from-emerald-600 to-emerald-400 hover:scale-[1.01] transition-transform">
              ⬇ Download Accounts & Passwords
            </button>
            <button type="button" onClick={downloadLinks} className="w-full py-3 rounded-lg font-bold text-white shadow-lg bg-gradient-to-br from-emerald-600 to-emerald-400 hover:scale-[1.01] transition-transform">
              ⬇ Download Links Only
            </button>
            <button type="button" onClick={() => setShowPreview(!showPreview)} className="w-full py-3 rounded-lg font-bold text-white shadow-lg bg-gradient-to-br from-violet-700 to-indigo-500 hover:scale-[1.01] transition-transform">
              👁 {showPreview ? 'Hide Preview' : 'Preview Accounts'}
            </button>
            
            {showPreview && (
              <div className="mt-2 p-4 rounded-lg bg-gray-900/90 border border-blue-500/20 text-gray-200 font-mono text-sm whitespace-pre-wrap">
                === Generated Accounts ==={'\n\n'}
                {accounts.map((acc, index) => (
                  <React.Fragment key={index}>
                    [Account {index + 1}]{'\n'}
                    Email: {acc.email}{'\n'}
                    Password: {acc.password}{'\n'}
                    Link: {acc.link}{'\n\n'}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}