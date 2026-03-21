import { useEffect, useState } from "react";
import "./CinemaIntro.css";

export default function CinemaIntro() {
  const [count, setCount] = useState(3);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) { setDone(true); return; }

    document.body.style.overflow = "hidden";

    const t1 = setTimeout(() => setCount(2), 850);
    const t2 = setTimeout(() => setCount(1), 1700);
    const t3 = setTimeout(() => setOpen(true), 2550);
    const t4 = setTimeout(() => {
      setDone(true);
      document.body.style.overflow = "";
    }, 3900);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      document.body.style.overflow = "";
    };
  }, []);

  if (done) return null;

  return (
    <div className={`cinema-intro${open ? " cinema-open" : ""}`}>
      <div className="cinema-scanlines" />
      <div className="cinema-filmstrip cinema-filmstrip-left" />
      <div className="cinema-filmstrip cinema-filmstrip-right" />
      <div className="cinema-bar cinema-bar-top" />
      <div className="cinema-center">
        <div className="cinema-dust" />
        <span className="cinema-brand-label">ReelSphere</span>
        <span className="cinema-countdown" key={count}>{count}</span>
        <span className="cinema-tagline">
          {count === 3 ? "Lights dimming…" : count === 2 ? "Screen awakening…" : "Your story begins."}
        </span>
      </div>
      <div className="cinema-bar cinema-bar-bottom" />
    </div>
  );
}
