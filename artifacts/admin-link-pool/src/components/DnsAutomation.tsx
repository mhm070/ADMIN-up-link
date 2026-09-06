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

  const handleExport = async (content: string, filename: string) => {
    // 1. Dùng tính năng Share bảng điều khiển của iOS
    if (navigator.share) {
      try {
        await navigator.share({ title: filename, text: content });
        return;
      } catch (e) {
        console.log('Share canceled', e);
      }
    }
    
    // 2. Dự phòng: Copy thẳng vào Clipboard nếu Share bị lỗi
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(content);
        alert('Đã copy dữ liệu! Bạn có thể dán vào ứng dụng Ghi chú.');
        return;
      }
    } catch (e) {}

    // 3. Dự phòng: Tải file thông thường cho Web/Máy tính
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAccounts = () => {
    let content = '[Accounts Data]\n';
    accounts.forEach((acc) => {
        if (acc.email && acc.password) content += `${acc.email} | ${acc.password}\n`;
    });
    handleExport(content, 'Accounts_And_Passwords.txt');
  };

  const downloadLinks = () => {
    let content = '[Locket Gold]\n';
    accounts.forEach((acc) => {
        if (acc.link && acc.link !== 'Link Not Found') content += `${acc.link}\n`;
    });
    handleExport(content, 'links.txt');
  };

  return (
    <section className="dns-panel">
      <header className="dns-header">
        <span className="dns-badge">Automation Suite</span>
        <h1>Locket Gold <span>DNS</span></h1>
        <p>Professional NextDNS account automation tool</p>
      </header>
      <div className="dns-card">
        <label className="dns-label"><span />Password (Min 8 chars)</label>
        <input className="dns-input" value={password} onChange={(event) => setPassword(event.target.value)} />
        
        <label className="dns-label"><span />Number of Accounts</label>
        <input className="dns-input" type="number" min="1" max="10" value={count} onChange={(event) => setCount(event.target.value)} />
        
        <label className="dns-label"><span />Denylist (1 per line)</label>
        <textarea className="dns-input dns-textarea" rows={3} value={domains} onChange={(event) => setDomains(event.target.value)} />
        
        {error && <p className="dns-error">{error}</p>}
        
        <button className="dns-start" type="button" onClick={start} disabled={running}>
          {running ? 'Running automation...' : '⚡ Start Automation'}
        </button>
        
        <div className="dns-terminal">
          <div className="dns-terminal-header"><i /><i /><i /><span>automation - log</span></div>
          <div ref={logRef} className="dns-log-box" aria-live="polite">
            {logs.map((log, index) => <div key={`${index}-${log}`}>{log}</div>)}
          </div>
        </div>
        
        {accounts.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <p style={{ color: '#10d98a', fontWeight: 'bold', marginBottom: '16px' }}>
              {accounts.length} account(s) generated successfully.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button type="button" onClick={downloadAccounts} className="btn-success">
                ⬇ Export Accounts & Passwords
              </button>
              <button type="button" onClick={downloadLinks} className="btn-success">
                ⬇ Export Links Only
              </button>
              <button type="button" onClick={() => setShowPreview(!showPreview)} className="btn-preview">
                👁 {showPreview ? 'Hide Preview' : 'Preview Accounts'}
              </button>
            </div>
            
            {showPreview && (
              <div style={{ marginTop: '18px', background: 'rgba(5, 12, 26, 0.9)', padding: '18px', borderRadius: '10px', color: '#e8f0ff', fontFamily: 'monospace', whiteSpace: 'pre-wrap', border: '1px solid rgba(56, 120, 255, 0.18)', lineHeight: '1.7' }}>
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