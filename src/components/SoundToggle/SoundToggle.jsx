import { useEffect, useRef, useState } from "react";
import "./SoundToggle.css";

export default function SoundToggle() {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  function toggle() {
    if (playing) {
      if (audioRef.current) audioRef.current.pause();
      setPlaying(false);
    } else {
      if (!audioRef.current) {
        const audio = new Audio("https://assets.mixkit.co/music/184/184.mp3");
        audio.loop = true;
        audio.volume = 0.35;
        audioRef.current = audio;
      }
      audioRef.current.play();
      setPlaying(true);
    }
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  return (
    <button type="button" className={`sound-toggle${playing ? " sound-on" : ""}`} onClick={toggle} title={playing ? "Mute ambience" : "Play cinema ambience"} aria-label={playing ? "Mute ambience" : "Play cinema ambience"}>
      <span className="sound-toggle-icon">{playing ? "🔊" : "🔇"}</span>
      <span className="sound-toggle-bars">
        <span /><span /><span />
      </span>
    </button>
  );
}
