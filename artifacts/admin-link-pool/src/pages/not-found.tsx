import { Link } from "wouter";
import { Terminal, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="glass-card rounded-xl p-8 max-w-md w-full text-center space-y-6">
        <div className="terminal-box rounded-lg p-6 mx-auto max-w-xs">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#0d2e0d]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="terminal-entry"><span className="ts">[sys] </span><span className="label-warn">404 route not found</span></div>
          <div className="terminal-entry"><span className="ts">[sys] </span><span className="label-info">check router config_</span></div>
        </div>

        <div>
          <h1 className="text-4xl font-bold font-mono neon-text">404</h1>
          <p className="text-muted-foreground text-sm mt-2">This page doesn't exist or was moved.</p>
        </div>

        <Link href="/">
          <button className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}
