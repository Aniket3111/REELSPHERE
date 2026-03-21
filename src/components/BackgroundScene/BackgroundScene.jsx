import "./BackgroundScene.css";

export default function BackgroundScene() {
  return (
    <div className="bg-video-shell" aria-hidden="true">
      <video className="bg-video" autoPlay muted loop playsInline preload="metadata">
        <source src="/bg_video.mp4" type="video/mp4" />
      </video>
      <div className="bg-video-overlay" />
      <div className="bg-video-vignette" />
      <div className="bg-film-grain" />
    </div>
  );
}
