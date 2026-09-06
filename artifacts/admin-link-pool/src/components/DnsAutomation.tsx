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
    <section className="dns-panel p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
      <header className="dns-header flex flex-col gap-3 text-center mb-8">
        <span className="dns-badge text-sm sm:text-base font-semibold px-4 py-2 inline-block mx-auto rounded-full">Automation Suite</span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mt-2">Locket Gold <span>DNS</span></h1>
        <p className="text-base sm:text-lg opacity-80 mt-2">Professional NextDNS account automation tool</p>
      </header>
      <div className="dns-card p-5 sm:p-8 rounded-3xl shadow-lg">
        <label className="dns-label text-base sm:text-lg font-semibold mb-3 block"><span />Password (Min 8 chars)</label>
        <input className="dns-input w-full p-4 text-base sm:text-lg rounded-xl min-h-[56px] mb-6" value={password} onChange={(event) => setPassword(event.target.value)} />
        
        <label className="dns-label text-base sm:text-lg font-semibold mb-3 block"><span />Number of Accounts</label>
        <input className="dns-input w-full p-4 text-base sm:text-lg rounded-xl min-h-[56px] mb-6" type="number" min="1" max="10" value={count} onChange={(event) => setCount(event.target.value)} />
        
        <label className="dns-label text-base sm:text-lg font-semibold mb-3 block"><span />Denylist (1 per line)</label>
        <textarea className="dns-input dns-textarea w-full p-4 text-base sm:text-lg rounded-xl min-h-[120px] mb-6" rows={3} value={domains} onChange={(event) => setDomains(event.target.value)} />
        
        {error && <p className="dns-error text-red-500 font-medium text-sm sm:text-base mb-4">{error}</p>}
        
        <button className="dns-start w-full py-4 px-6 text-lg sm:text-xl font-bold rounded-xl min-h-[60px] active:scale-95 transition-transform mb-8" type="button" onClick={start} disabled={running}>
          {running ? 'Running automation...' : '⚡ Start Automation'}
        </button>
        
        <div className="dns-terminal rounded-2xl overflow-hidden shadow-inner">
          <div className="dns-terminal-header p-4 text-sm sm:text-base flex items-center gap-2"><i /><i /><i /><span className="ml-2 font-mono">automation - log</span></div>
          <div ref={logRef} className="dns-log-box p-4 sm:p-6 text-sm sm:text-base min-h-[160px] overflow-y-auto" aria-live="polite">
            {logs.map((log, index) => <div key={`${index}-${log}`} className="mb-2 last:mb-0 leading-relaxed font-mono">{log}</div>)}
          </div>
        </div>
        
        {accounts.length > 0 && (
          <div className="mt-8 flex flex-col gap-6">
            <p className="text-[#10d98a] font-bold text-center text-lg sm:text-xl">
              {accounts.length} account(s) generated successfully.
            </p>
            
            <div className="flex flex-col gap-4">
              <button type="button" onClick={downloadAccounts} className="btn-success w-full py-4 px-6 text-lg font-bold rounded-xl min-h-[60px] active:scale-95 transition-transform shadow-md">
                ⬇ Export Accounts & Passwords
              </button>
              <button type="button" onClick={downloadLinks} className="btn-success w-full py-4 px-6 text-lg font-bold rounded-xl min-h-[60px] active:scale-95 transition-transform shadow-md">
                ⬇ Export Links Only
              </button>
              <button type="button" onClick={() => setShowPreview(!showPreview)} className="btn-preview w-full py-4 px-6 text-lg font-bold rounded-xl min-h-[60px] active:scale-95 transition-transform border-2">
                👁 {showPreview ? 'Hide Preview' : 'Preview Accounts'}
              </button>
            </div>
            
            {showPreview && (
              <div className="mt-2 p-5 sm:p-6 rounded-2xl text-sm sm:text-base overflow-x-auto whitespace-pre-wrap leading-relaxed border" style={{ background: 'rgba(5, 12, 26, 0.9)', color: '#e8f0ff', fontFamily: 'monospace', borderColor: 'rgba(56, 120, 255, 0.18)' }}>
                <span className="font-bold opacity-80 text-blue-300">=== Generated Accounts ===</span>{'\n\n'}
                {accounts.map((acc, index) => (
                  <React.Fragment key={index}>
                    <span className="font-bold text-yellow-300">[Account {index + 1}]</span>{'\n'}
                    <span className="opacity-70">Email:</span> {acc.email}{'\n'}
                    <span className="opacity-70">Password:</span> {acc.password}{'\n'}
                    <span className="opacity-70">Link:</span> {acc.link}{'\n\n'}
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