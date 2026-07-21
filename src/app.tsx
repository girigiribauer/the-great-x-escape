import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { ErrorBoundary, Suspense } from "solid-js";
import "./app.css";

// 予期しないエラー(多くは間欠的な DB 通信失敗)で真っ黒な "Uncaught Client Exception" を
// 出さず、再読み込みで復帰できる案内に置き換える。ほとんどが一時的なので reload で直る。
function ErrorFallback() {
  return (
    <main
      style={{
        "min-height": "100dvh",
        display: "flex",
        "flex-direction": "column",
        "align-items": "center",
        "justify-content": "center",
        gap: "1.1rem",
        padding: "2rem",
        "text-align": "center",
        "font-family": "serif",
        color: "var(--ink)",
      }}
    >
      <p style={{ margin: 0, "font-size": "1.05rem" }}>通信が少し乱れたようです。</p>
      <p style={{ margin: 0, color: "var(--ink-dim)", "font-size": "0.9rem" }}>
        もう一度読み込むと直ることがほとんどです。
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          "margin-top": "0.4rem",
          padding: "0.55rem 1.4rem",
          background: "var(--accent)",
          color: "#000",
          border: "none",
          "border-radius": "4px",
          "font-weight": "bold",
          "font-family": "inherit",
          "font-size": "1rem",
          cursor: "pointer",
        }}
      >
        再読み込み
      </button>
    </main>
  );
}

export default function App() {
  return (
    <Router
      root={(props) => (
        <ErrorBoundary fallback={() => <ErrorFallback />}>
          <Suspense>{props.children}</Suspense>
        </ErrorBoundary>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
