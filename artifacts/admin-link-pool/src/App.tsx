import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── Config ──────────────────────────────────────────────────────────────────
const REPO_OWNER = 'mhm070';
const REPO_NAME  = 'i-know-i-sharee';
const FILE_PATH  = 'links.txt';
const TOKEN_KEY  = 'goc-share:gh-token';
const RAW_URL    = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${FILE_PATH}`;

// ─── Types ───────────────────────────────────────────────────────────────────
type Pool    = Record<string, string[]>;
type Preview = { parsed: Pool; fileName: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseTxt(text: string): Pool {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const out: Pool = {};
  let cur = 'Default';
  for (const line of lines) {
    const m = line.match(/^\[(.+)\]$/) || line.match(/^##\s+(.+)$/);
    if (m) { cur = m[1].trim(); continue; }
    if (!out[cur]) out[cur] = [];
    out[cur].push(line);
  }
  return out;
}

function poolToTxt(pool: Pool): string {
  return Object.entries(pool)
    .map(([sec, links]) => `[${sec}]\n${links.join('\n')}`)
    .join('\n\n').trim();
}

// ─── GitHub API ───────────────────────────────────────────────────────────────
const apiUrl = () =>
  `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

function githubHeaders(token: string, accept: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: accept,
  };
}

function encodeBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function githubError(response: Response): Promise<Error> {
  let detail = '';
  try {
    const data = await response.json() as { message?: string };
    detail = data.message ? `: ${data.message}` : '';
  } catch {
    // Keep the HTTP status when GitHub does not return JSON.
  }
  return new Error(`GitHub ${response.status}${detail}`);
}

async function loadPool(token: string): Promise<Pool | null> {
  try {
    // Use the same public raw-file URL as the consumer-facing site. GitHub's
    // raw CDN can cache this URL, so every read gets a unique query string.
    const res = await fetch(RAW_URL + '?t=' + new Date().getTime(), {
      cache: 'no-store',
      headers: githubHeaders(token, 'application/vnd.github.v3.raw'),
    });
    if (!res.ok) return null;
    return parseTxt(await res.text());
  } catch { return null; }
}

async function getLatestFileSha(token: string): Promise<string | null> {
  const res = await fetch(apiUrl(), {
    cache: 'no-store',
    headers: githubHeaders(token, 'application/vnd.github.v3+json'),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw await githubError(res);
  const metadata = await res.json() as { sha?: string };
  if (!metadata.sha) throw new Error('GitHub không trả về sha của file hiện tại.');
  return metadata.sha;
}

async function savePool(pool: Pool | null, token: string): Promise<void> {
  // Always fetch the absolute latest SHA immediately before a mutation.
  // GitHub requires it for updates and rejects stale/missing SHAs.
  const sha = await getLatestFileSha(token);

  if (pool === null) {
    if (!sha) return;
    const res = await fetch(apiUrl(), {
      method: 'DELETE',
      headers: {
        ...githubHeaders(token, 'application/vnd.github.v3+json'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'admin: delete link pool',
        sha,
      }),
    });
    if (!res.ok) throw await githubError(res);
    return;
  }

  const content = encodeBase64Utf8(poolToTxt(pool));
  const body: Record<string, string> = {
    message: 'admin: update link pool',
    content,
  };
  if (sha) body.sha = sha;

  const res = await fetch(apiUrl(), {
    method: 'PUT',
    headers: {
      ...githubHeaders(token, 'application/vnd.github.v3+json'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await githubError(res);
}

// ─── Styles (injected) ───────────────────────────────────────────────────────
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#07090f;--sur:#0d1117;--bdr:#1a2235;--bdr-l:#243050;
  --txt:#d4ddf0;--dim:#4a6080;--fnt:#1e3050;
  --cy:#53d8fb;--em:#1ade8f;--or:#ff6b35;--red:#cc4444;
  --r8:8px;--r14:14px;--r18:18px;
  --gem:0 0 20px #1ade8f28,0 0 6px #1ade8f18;
  --gcy:0 0 20px #53d8fb28,0 0 6px #53d8fb18;
}
html{scroll-behavior:smooth}
body{font-family:'Be Vietnam Pro',system-ui,sans-serif;background:var(--bg);color:var(--txt);
  min-height:100vh;padding:32px 16px 72px;-webkit-font-smoothing:antialiased}
#root{max-width:580px;margin:0 auto}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@keyframes toastOut{from{opacity:1}to{opacity:0;transform:translateX(-50%) translateY(10px)}}
@keyframes termSlide{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
@keyframes glow{0%,100%{box-shadow:var(--gem)}50%{box-shadow:0 0 32px #1ade8f42}}
.fu{animation:fadeUp .45s cubic-bezier(.22,.68,0,1.2) both}
.spinner{width:32px;height:32px;border:2.5px solid var(--bdr-l);border-top-color:var(--em);
  border-radius:50%;animation:spin .7s linear infinite;box-shadow:var(--gem)}
.card{background:linear-gradient(145deg,rgba(13,17,23,.92),rgba(17,24,39,.8));
  backdrop-filter:blur(16px);border:1px solid var(--bdr);border-radius:var(--r18);
  padding:22px 20px;margin-bottom:14px;box-shadow:0 4px 32px rgba(0,0,0,.55);
  position:relative;overflow:hidden;transition:box-shadow .25s,border-color .25s}
.card::before{content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(255,255,255,.025),transparent 60%);pointer-events:none}
.card:hover{border-color:var(--bdr-l)}
.ct{font-size:.66rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;
  color:var(--dim);margin-bottom:18px;display:flex;align-items:center;gap:10px}
.ct::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,var(--bdr-l),transparent)}
.srow{display:flex;gap:10px;margin-bottom:14px}
.sbox{flex:1;background:rgba(7,9,15,.7);border:1px solid var(--bdr);border-radius:var(--r14);
  padding:16px 12px;text-align:center;transition:border-color .2s}
.sbox:hover{border-color:var(--bdr-l)}
.snum{font-size:clamp(30px,9vw,42px);font-weight:900;line-height:1;letter-spacing:-1.5px}
.slbl{font-size:.62rem;color:var(--dim);margin-top:5px;text-transform:uppercase;letter-spacing:.12em;font-weight:600}
.mrow{display:flex;gap:8px;margin-bottom:14px}
.mbtn{flex:1;padding:9px 0;border-radius:var(--r8);font-family:inherit;font-size:.77rem;font-weight:600;
  cursor:pointer;border:1px solid var(--bdr);background:transparent;color:var(--dim);transition:all .18s}
.mbtn:hover{border-color:var(--bdr-l)}
.mbtn.on{border-color:rgba(83,216,251,.35);color:var(--cy);background:rgba(83,216,251,.07);box-shadow:var(--gcy)}
.dz{border:2px dashed var(--bdr-l);border-radius:var(--r14);padding:40px 20px;text-align:center;
  cursor:pointer;transition:all .22s;background:rgba(7,9,15,.5)}
.dz:hover{border-color:var(--em);background:rgba(26,222,143,.04);box-shadow:var(--gem)}
.dz.over{border-color:var(--cy);background:rgba(83,216,251,.06);transform:scale(1.01)}
.dz.ready{border-color:var(--em);background:rgba(26,222,143,.06);animation:glow 2s ease-in-out infinite}
.btn{width:100%;padding:13px 0;border:none;border-radius:var(--r8);font-family:inherit;
  font-size:.84rem;font-weight:700;cursor:pointer;transition:all .18s;margin-top:10px}
.btn:hover:not(:disabled){transform:translateY(-2px) scale(1.015);filter:brightness(1.1)}
.btn:active:not(:disabled){transform:scale(.98)}
.btn:disabled{opacity:.5;cursor:not-allowed}
.bu{background:linear-gradient(135deg,#0f3d28,rgba(26,222,143,.18));
  border:1px solid rgba(26,222,143,.35);color:var(--em);box-shadow:var(--gem)}
.bc{background:transparent;border:1px solid var(--bdr);color:var(--dim)}
.bd{background:transparent;border:1px solid rgba(204,68,68,.3);color:var(--red);
  width:auto;padding:5px 14px;font-size:.73rem;border-radius:var(--r8);transition:all .18s;cursor:pointer}
.bd:hover{background:rgba(204,68,68,.1);border-color:rgba(204,68,68,.6)}
.bd:disabled{opacity:.4;cursor:not-allowed}
.pr{background:#000;border:1px solid #0d2212;border-radius:var(--r8);padding:12px 15px;
  display:flex;align-items:flex-start;gap:12px;margin-bottom:8px;
  font-family:'JetBrains Mono',monospace;animation:termSlide .32s ease both;transition:border-color .2s}
.pr::before{content:'>';color:#1ade8f;font-weight:600;margin-top:1px;flex-shrink:0}
.pr:hover{border-color:rgba(26,222,143,.18)}
.ps{font-size:.72rem;color:#4ade80;text-transform:uppercase;letter-spacing:.1em;font-weight:600}
.pc{font-size:.7rem;color:#166534;margin-left:10px}
.pp{font-size:.68rem;color:#15803d;margin-top:5px;word-break:break-all;line-height:1.6}
.hb{background:#000;border:1px solid #0d2212;border-radius:var(--r14);padding:18px 20px}
.hb::before{content:'$ format guide';display:block;font-family:'JetBrains Mono',monospace;
  font-size:.64rem;color:#166534;letter-spacing:.15em;text-transform:uppercase;
  margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #0d2212}
pre{font-family:'JetBrains Mono',monospace;font-size:.71rem;color:#22c55e;line-height:2}
.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
  background:rgba(13,24,36,.95);backdrop-filter:blur(12px);
  border:1px solid rgba(26,222,143,.25);color:var(--em);
  border-radius:24px;padding:10px 24px;font-size:.82rem;font-weight:600;z-index:999;white-space:nowrap}
.toast.in{animation:toastIn .28s cubic-bezier(.22,.68,0,1.2) both}
.toast.out{animation:toastOut .22s ease forwards}
.ld{width:6px;height:6px;border-radius:50%;background:var(--em);
  display:inline-block;margin-right:6px;animation:pulse 2s ease-in-out infinite}
.ti{background:#000;border:1px solid var(--bdr-l);border-radius:var(--r8);
  padding:12px 14px;color:var(--txt);font-family:'JetBrains Mono',monospace;font-size:.82rem;
  outline:none;transition:border-color .2s;width:100%;margin:16px 0 10px}
.ti:focus{border-color:var(--em);box-shadow:var(--gem)}
`;

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, phase }: { msg: string; phase: string }) {
  if (!msg) return null;
  return <div className={`toast ${phase}`}>{msg}</div>;
}

// ─── useToast ─────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState({ msg: '', phase: '' });
  const tmr = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((msg: string) => {
    if (tmr.current) clearTimeout(tmr.current);
    setToast({ msg, phase: 'in' });
    tmr.current = setTimeout(() => {
      setToast(t => ({ ...t, phase: 'out' }));
      setTimeout(() => setToast({ msg: '', phase: '' }), 300);
    }, 2400);
  }, []);
  return { toast, show };
}

// ─── TokenGate ────────────────────────────────────────────────────────────────
function TokenGate({ onToken }: { onToken: (t: string) => void }) {
  const [val, setVal]   = useState('');
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const t = val.trim();
    if (!t) return;
    setBusy(true); setErr('');
    const pool = await loadPool(t);
    setBusy(false);
    if (pool === null) { setErr('Token không hợp lệ hoặc không có quyền truy cập.'); return; }
    localStorage.setItem(TOKEN_KEY, t);
    onToken(t);
  };

  return (
    <div className="fu" style={{ background: '#000', border: '1px solid #0d2212', borderRadius: 18, padding: '36px 24px', textAlign: 'center', marginTop: 20 }}>
      <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#ff6b35', background: '#ff6b3512', border: '1px solid #ff6b3530', padding: '4px 14px', borderRadius: 20, display: 'inline-block', marginBottom: 16 }}>
        ⚙ Admin Panel
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#eef2ff', marginBottom: 8 }}>Nhập GitHub Token</h2>
      <p style={{ fontSize: '.78rem', color: '#3a6080' }}>
        Token cần quyền <code style={{ color: '#53d8fb' }}>repo</code> · {REPO_OWNER}/{REPO_NAME}
      </p>
      <input
        className="ti"
        type="password"
        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
      />
      {err && <p style={{ fontSize: '.75rem', color: '#cc4444', marginBottom: 10 }}>{err}</p>}
      <button className="btn bu" style={{ margin: 0 }} onClick={submit} disabled={busy}>
        {busy ? 'Đang kiểm tra…' : 'Xác nhận & Tiếp tục →'}
      </button>
      <p style={{ fontSize: '.68rem', color: '#1e3050', marginTop: 12 }}>
        Token lưu trong localStorage, không gửi đi đâu khác.
      </p>
    </div>
  );
}

// ─── AdminPanel ───────────────────────────────────────────────────────────────
function AdminPanel({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [pool, setPool]         = useState<Pool | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [mode, setMode]         = useState<'replace' | 'append'>('replace');
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview]   = useState<Preview | null>(null);
  const { toast, show }         = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const d = await loadPool(token);
    setPool(d); setLoading(false);
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  const processFile = (file: File | undefined) => {
    if (!file?.name.endsWith('.txt')) { show('❌ Chỉ nhận file .txt'); return; }
    const r = new FileReader();
    r.onload = e => setPreview({ parsed: parseTxt(e.target!.result as string), fileName: file.name });
    r.readAsText(file);
  };

  const handleUpload = async () => {
    if (!preview) return;
    setSaving(true);
    let newPool: Pool;
    if (mode === 'replace') {
      newPool = { ...preview.parsed };
    } else {
      newPool = { ...(pool || {}) };
      for (const [sec, links] of Object.entries(preview.parsed)) {
        const s = new Set(newPool[sec] || []);
        links.forEach(l => s.add(l));
        newPool[sec] = [...s];
      }
    }
    try {
      await savePool(newPool, token);
      setPool(newPool); setPreview(null);
      show(`✓ Đã nạp ${Object.values(newPool).reduce((s, a) => s + a.length, 0)} links lên GitHub`);
    } catch (e: unknown) {
      show(`❌ ${e instanceof Error ? e.message : 'Lỗi không xác định'}`);
    } finally { setSaving(false); }
  };

  const delSection = async (sec: string) => {
    const u = { ...pool }; delete u[sec];
    const next = Object.keys(u).length ? u : null;
    setSaving(true);
    try { await savePool(next, token); setPool(next); show(`Đã xoá "${sec}"`); }
    catch { show('❌ Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  const clearAll = async () => {
    setSaving(true);
    try { await savePool(null, token); setPool(null); show('Đã xoá toàn bộ pool'); }
    catch { show('❌ Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  const total  = pool ? Object.values(pool).reduce((s, a) => s + a.length, 0) : 0;
  const secCnt = pool ? Object.keys(pool).length : 0;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <>
      <Toast {...toast} />

      {/* Header */}
      <div className="fu" style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#ff6b35', background: '#ff6b3512', border: '1px solid #ff6b3530', padding: '4px 14px', borderRadius: 20 }}>
            ⚙ Admin Panel
          </div>
          <button onClick={onLogout} style={{ background: 'transparent', border: '1px solid #1a2235', color: '#3a5a8a', borderRadius: 8, padding: '5px 12px', fontSize: '.72rem', cursor: 'pointer' }}>
            Đổi token
          </button>
        </div>
        <h1 style={{ fontSize: 'clamp(22px,6vw,30px)', fontWeight: 900, letterSpacing: '-1px', color: '#eef2ff' }}>
          Quản lý Link Pool
        </h1>
        <p style={{ color: '#2a4060', fontSize: '.82rem', marginTop: 6 }}>
          <span className="ld" />
          {REPO_OWNER}/{REPO_NAME} · {FILE_PATH}
          {saving && <span style={{ color: '#ff6b35', marginLeft: 8 }}>đang lưu…</span>}
        </p>
      </div>

      {/* Stats */}
      <div className="srow fu" style={{ animationDelay: '.05s' }}>
        <div className="sbox">
          <div className="snum" style={{ color: '#ff6b35' }}>{total}</div>
          <div className="slbl">Links còn</div>
        </div>
        <div className="sbox">
          <div className="snum" style={{ color: '#53d8fb' }}>{secCnt}</div>
          <div className="slbl">Sections</div>
        </div>
      </div>

      {/* Upload */}
      <div className="card fu" style={{ animationDelay: '.1s' }}>
        <div className="ct">↑ Nạp file link mới</div>
        <div className="mrow">
          {(['replace', 'append'] as const).map(v => (
            <button key={v} className={`mbtn ${mode === v ? 'on' : ''}`} onClick={() => setMode(v)}>
              {v === 'replace' ? '🔄 Thay thế' : '➕ Gộp thêm'}
            </button>
          ))}
        </div>
        <div
          className={`dz${dragOver ? ' over' : ''}${preview ? ' ready' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <p style={{ fontWeight: 700, color: '#1ade8f', marginBottom: 4 }}>{preview.fileName}</p>
              <p style={{ fontSize: '.72rem', color: '#3a7a5a' }}>
                {Object.entries(preview.parsed).map(([s, l]) => `${s}: ${l.length}`).join(' · ')} links
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
              <p style={{ color: '#3a6080', fontSize: '.85rem' }}>Kéo file .txt vào đây hoặc click để chọn</p>
            </>
          )}
          <input ref={fileRef} type="file" accept=".txt" style={{ display: 'none' }}
            onChange={e => processFile(e.target.files?.[0])} />
        </div>
        {preview && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn bu" style={{ margin: 0 }} onClick={handleUpload} disabled={saving}>
              {saving ? 'Đang lưu…' : `↑ Nạp (${mode === 'replace' ? 'thay thế' : 'gộp thêm'})`}
            </button>
            <button className="btn bc" style={{ margin: 0, width: 'auto', padding: '0 18px' }}
              onClick={() => setPreview(null)}>Huỷ</button>
          </div>
        )}
      </div>

      {/* Pool */}
      {pool && secCnt > 0 && (
        <div className="card fu" style={{ animationDelay: '.15s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="ct" style={{ margin: 0 }}>📋 Pool hiện tại</div>
            <button className="bd" onClick={clearAll} disabled={saving}>Xoá tất cả</button>
          </div>
          {Object.entries(pool).map(([sec, links]) => (
            <div className="pr" key={sec}>
              <div style={{ flex: 1 }}>
                <span className="ps">{sec}</span>
                <span className="pc">{links.length} links</span>
                <div className="pp">
                  {links[0] || '—'}
                  {links.length > 1 && <span style={{ color: '#1c3040' }}> +{links.length - 1} nữa</span>}
                </div>
              </div>
              <button className="bd" onClick={() => delSection(sec)} disabled={saving}>Xoá</button>
            </div>
          ))}
        </div>
      )}

      {/* Hint */}
      <div className="hb fu" style={{ animationDelay: '.2s' }}>
        <pre>{`[Spotify Premium]
https://gist.github.com/user/abc/raw/file.conf
https://gist.github.com/user/xyz/raw/file2.conf

[Locket Gold]
https://gist.github.com/user/lk/raw/locket.conf`}</pre>
        <p style={{ fontSize: '.7rem', color: '#1e3050', marginTop: 10 }}>
          Không có section → vào "Default".
        </p>
      </div>
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  // inject CSS once
  useEffect(() => {
    const id = 'admin-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id; el.textContent = CSS;
      document.head.appendChild(el);
    }
  }, []);

  return token
    ? <AdminPanel token={token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null); }} />
    : <TokenGate onToken={setToken} />;
}
