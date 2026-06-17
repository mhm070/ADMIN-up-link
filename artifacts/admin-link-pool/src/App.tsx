import { useState, useEffect, useCallback, useRef } from "react";

/* ── CẤU HÌNH GITHUB ── */
const REPO_OWNER = "mhm070";
const REPO_NAME = "i-know-i-sharee";
const FILE_PATH = "links.txt";

type PoolData = Record<string, string[]>;

function getToken(): string | null {
  let token = localStorage.getItem("my_github_token");
  if (!token) {
    token = prompt("Vui lòng nhập GitHub Token của bạn để truy cập Admin:");
    if (token) localStorage.setItem("my_github_token", token);
  }
  return token;
}

/* parse .txt */
function parseTxt(text: string): PoolData {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const sections: PoolData = {};
  let cur = "Default";
  for (const line of lines) {
    const m = line.match(/^\[(.+)\]$/) || line.match(/^##\s+(.+)$/);
    if (m) { cur = m[1].trim(); continue; }
    if (!sections[cur]) sections[cur] = [];
    sections[cur].push(line);
  }
  return sections;
}

function convertPoolToTxt(poolData: PoolData | null): string {
  if (!poolData) return "";
  let out = "";
  for (const [section, links] of Object.entries(poolData)) {
    out += `[${section}]\n`;
    links.forEach((link) => { out += `${link}\n`; });
    out += "\n";
  }
  return out.trim();
}

async function loadPool(token: string): Promise<PoolData | null> {
  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
  try {
    const response = await fetch(apiUrl, {
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3.raw" },
    });
    if (!response.ok) return null;
    return parseTxt(await response.text());
  } catch (err) {
    console.error("Lỗi khi kéo dữ liệu từ GitHub:", err);
    return null;
  }
}

async function savePool(token: string, data: PoolData | null): Promise<void> {
  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
  const rawText = data ? convertPoolToTxt(data) : "";
  const base64Content = btoa(unescape(encodeURIComponent(rawText)));
  let currentSha: string | null = null;

  const getRes = await fetch(apiUrl, {
    headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" },
  });
  if (getRes.ok) {
    const fileMeta = await getRes.json();
    currentSha = fileMeta.sha;
  }

  const body: Record<string, string> = { message: "Admin update link pool", content: base64Content };
  if (currentSha) body.sha = currentSha;

  const putRes = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify(body),
  });
  if (!putRes.ok) throw new Error("GitHub API từ chối cập nhật.");
}

/* ── Toast ── */
function Toast({ msg, phase }: { msg: string; phase: string }) {
  if (!msg) return null;
  return <div className={`toast ${phase}`}>{msg}</div>;
}

/* ── Main Admin ── */
export default function App() {
  const [pool, setPool] = useState<PoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<{ parsed: PoolData; fileName: string } | null>(null);
  const [toast, setToast] = useState({ msg: "", phase: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef<string | null>(null);

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, phase: "in" });
    toastTimer.current = setTimeout(() => {
      setToast((t) => ({ ...t, phase: "out" }));
      setTimeout(() => setToast({ msg: "", phase: "" }), 300);
    }, 2200);
  };

  const refresh = useCallback(async () => {
    if (!tokenRef.current) tokenRef.current = getToken();
    if (!tokenRef.current) { setLoading(false); return; }
    const d = await loadPool(tokenRef.current);
    setPool(d);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const processFile = (file: File | undefined) => {
    if (!file?.name.endsWith(".txt")) { showToast("❌ Chỉ nhận file .txt"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview({ parsed: parseTxt(e.target?.result as string), fileName: file.name });
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!preview || !tokenRef.current) return;
    let newPool: PoolData;
    if (mode === "replace") {
      newPool = { ...preview.parsed };
    } else {
      const cur = pool || {};
      newPool = { ...cur };
      for (const [sec, links] of Object.entries(preview.parsed)) {
        const set = new Set(newPool[sec] || []);
        links.forEach((l) => set.add(l));
        newPool[sec] = [...set];
      }
    }
    await savePool(tokenRef.current, newPool);
    setPool(newPool);
    setPreview(null);
    const total = Object.values(newPool).reduce((s, a) => s + a.length, 0);
    showToast(`✓ Đã nạp ${total} links vào pool`);
  };

  const delSection = async (sec: string) => {
    if (!tokenRef.current) return;
    const updated = { ...pool };
    delete updated[sec];
    const next = Object.keys(updated).length ? updated : null;
    await savePool(tokenRef.current, next);
    setPool(next);
    showToast(`Đã xoá section "${sec}"`);
  };

  const clearAll = async () => {
    if (!tokenRef.current) return;
    await savePool(tokenRef.current, null);
    setPool(null);
    showToast("Đã xoá toàn bộ pool");
  };

  const total = pool ? Object.values(pool).reduce((s, a) => s + a.length, 0) : 0;
  const secCnt = pool ? Object.keys(pool).length : 0;

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" />
    </div>
  );

  return (
    <>
      <Toast msg={toast.msg} phase={toast.phase} />

      {/* Header */}
      <div className="fade-up" style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", fontSize: ".68rem", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "#ff6b35", background: "#ff6b3512", border: "1px solid #ff6b3530", padding: "4px 14px", borderRadius: 20, marginBottom: 12 }}>
          ⚙ Admin Panel
        </div>
        <h1 style={{ fontSize: "clamp(22px,6vw,30px)", fontWeight: 900, letterSpacing: "-1px", color: "#eef2ff" }}>Quản lý Link Pool</h1>
        <p style={{ color: "#2a4060", fontSize: ".82rem", marginTop: 6 }}>
          <span className="live-dot" />Kết nối trực tiếp GitHub API
        </p>
      </div>

      {/* Stats */}
      <div className="stat-row fade-up" style={{ animationDelay: ".05s" }}>
        <div className="stat-box">
          <div className="stat-num" style={{ color: "#ff6b35" }}>{total}</div>
          <div className="stat-lbl">Links còn</div>
        </div>
        <div className="stat-box">
          <div className="stat-num" style={{ color: "#53d8fb" }}>{secCnt}</div>
          <div className="stat-lbl">Sections</div>
        </div>
      </div>

      {/* Upload card */}
      <div className="card fade-up" style={{ animationDelay: ".1s" }}>
        <div className="card-title">↑ Nạp file link mới</div>
        <div className="mode-row">
          {(["replace", "append"] as const).map((v) => (
            <button key={v} className={`mode-btn ${mode === v ? "on" : ""}`} onClick={() => setMode(v)}>
              {v === "replace" ? "🔄 Thay thế" : "➕ Gộp thêm"}
            </button>
          ))}
        </div>

        <div
          className={`dropzone${dragOver ? " over" : ""}${preview ? " ready" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <p style={{ fontWeight: 700, color: "#1ade8f", marginBottom: 4 }}>{preview.fileName}</p>
              <p style={{ fontSize: ".72rem", color: "#3a7a5a" }}>
                {Object.entries(preview.parsed).map(([s, l]) => `${s}: ${l.length}`).join(" · ")} links
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
              <p style={{ color: "#3a6080", fontSize: ".85rem" }}>Kéo file .txt vào đây hoặc click để chọn</p>
            </>
          )}
          <input ref={fileRef} type="file" accept=".txt" style={{ display: "none" }} onChange={(e) => processFile(e.target.files?.[0])} />
        </div>

        {preview && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn btn-upload" style={{ margin: 0 }} onClick={handleUpload}>
              ↑ Nạp vào pool ({mode === "replace" ? "thay thế" : "gộp thêm"})
            </button>
            <button className="btn btn-cancel" style={{ margin: 0, width: "auto", padding: "0 18px" }} onClick={() => setPreview(null)}>Huỷ</button>
          </div>
        )}
      </div>

      {/* Current pool */}
      {pool && secCnt > 0 && (
        <div className="card fade-up" style={{ animationDelay: ".15s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div className="card-title" style={{ margin: 0 }}>📋 Pool hiện tại</div>
            <button className="btn-danger" onClick={clearAll}>Xoá tất cả</button>
          </div>
          {Object.entries(pool).map(([sec, links]) => (
            <div className="pool-row" key={sec}>
              <div style={{ flex: 1 }}>
                <span className="pool-sec">{sec}</span>
                <span className="pool-cnt">{links.length} links</span>
                <div className="pool-preview">
                  {links[0] || "—"}
                  {links.length > 1 && <span style={{ color: "#1c3040" }}> +{links.length - 1} nữa</span>}
                </div>
              </div>
              <button className="btn-danger" onClick={() => delSection(sec)}>Xoá</button>
            </div>
          ))}
        </div>
      )}

      {/* Format hint */}
      <div className="hint-box fade-up" style={{ animationDelay: ".2s" }}>
        <p style={{ fontSize: ".68rem", color: "#1e3050", textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 10, fontWeight: 700 }}>Format file .txt</p>
        <pre>{`[Spotify Premium]
https://gist.github.com/user/abc123/raw/spotify.conf
https://gist.github.com/user/xyz456/raw/spotify2.conf

[Locket Gold]
https://gist.github.com/user/locket1/raw/locket.conf`}</pre>
        <p style={{ fontSize: ".7rem", color: "#1e3050", marginTop: 10 }}>
          Plain list (không có section) cũng được — tất cả sẽ vào section "Default".
        </p>
      </div>
    </>
  );
}
