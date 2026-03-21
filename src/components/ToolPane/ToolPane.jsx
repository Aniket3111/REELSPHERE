import "./ToolPane.css";

export default function ToolPane({ image, index, title, description, tall = false, children }) {
  return (
    <div className="tool-pane">
      <div className={`panel-media${tall ? " panel-media-tall" : ""}`}>
        <img src={image} alt={title} />
        <div className="panel-media-overlay" />
      </div>
      <div className="panel-header">
        <div>
          <span className="panel-kicker">{index}</span>
          <h2>{title}</h2>
        </div>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
