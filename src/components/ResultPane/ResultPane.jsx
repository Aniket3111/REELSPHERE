import LoadingDots from "../LoadingDots/LoadingDots";
import "./ResultPane.css";

export default function ResultPane({ state, emptyText, children }) {
  if (state.status === "idle") {
    return (
      <div className="result-pane result-pane-empty">
        <div className="empty-state">
          <div className="empty-icon">◎</div>
          <p>{emptyText}</p>
        </div>
      </div>
    );
  }
  if (state.status === "loading") {
    return (
      <div className="result-pane result-pane-loading">
        <LoadingDots />
        <p className="loading-label">Thinking…</p>
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="result-pane result-pane-error">
        <p><strong>Error:</strong> {state.error}</p>
      </div>
    );
  }
  return <div className="result-pane">{children}</div>;
}
