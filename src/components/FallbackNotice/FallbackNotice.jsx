import "./FallbackNotice.css";

export default function FallbackNotice({ message }) {
  return <p className="fallback-note">{message}</p>;
}
