export function initRevealAnimations() {
  const nodes = document.querySelectorAll("[data-reveal]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCompact = window.matchMedia("(max-width: 768px)").matches;
  if (!("IntersectionObserver" in window) || reduceMotion || isCompact) {
    nodes.forEach((n) => { n.style.transitionDelay = "0ms"; n.classList.add("is-visible"); });
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); observer.unobserve(e.target); } }),
    { threshold: 0.16, rootMargin: "0px 0px -40px 0px" },
  );
  nodes.forEach((n, i) => { n.style.transitionDelay = `${i * 90}ms`; observer.observe(n); });
}

export function initScrollScene() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCompact = window.matchMedia("(max-width: 768px)").matches;
  if (reduceMotion || isCompact) {
    document.body.style.setProperty("--scroll-progress", "0");
    document.body.classList.remove("is-scrolled", "is-deep-scrolled");
    return () => {};
  }
  let ticking = false;
  const updateScene = () => {
    const maxDistance = Math.max(window.innerHeight * 0.9, 1);
    const progress = Math.min(window.scrollY / maxDistance, 1);
    document.body.style.setProperty("--scroll-progress", progress.toFixed(3));
    document.body.classList.toggle("is-scrolled", progress > 0.22);
    document.body.classList.toggle("is-deep-scrolled", progress > 0.68);
    ticking = false;
  };
  const onScroll = () => { if (!ticking) { window.requestAnimationFrame(updateScene); ticking = true; } };
  updateScene();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateScene);
  return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", updateScene); };
}

export function initCursorSpotlight(heroRef, spotlightRef) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return () => {};
  const onMove = (e) => {
    const hero = heroRef.current;
    const spot = spotlightRef.current;
    if (!hero || !spot) return;
    const rect = hero.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spot.style.opacity = "1";
    spot.style.transform = `translate(${x}px, ${y}px)`;
  };
  const onLeave = () => { if (spotlightRef.current) spotlightRef.current.style.opacity = "0"; };
  const hero = heroRef.current;
  if (!hero) return () => {};
  hero.addEventListener("mousemove", onMove);
  hero.addEventListener("mouseleave", onLeave);
  return () => { hero.removeEventListener("mousemove", onMove); hero.removeEventListener("mouseleave", onLeave); };
}

export function initTiltCards() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return () => {};
  const selector = ".feature-card, .result-tile";

  const resetCard = (card) => {
    card.style.transition = "transform 0.45s cubic-bezier(0.23, 1, 0.32, 1)";
    card.style.transform = "";
  };

  const onMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transition = "box-shadow 0.18s ease";
    card.style.transform = `perspective(800px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) scale(1.015)`;
  };
  const onLeave = (e) => resetCard(e.currentTarget);
  const onDown = (e) => resetCard(e.currentTarget);

  const attach = () => {
    document.querySelectorAll(selector).forEach((card) => {
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
      card.addEventListener("mousedown", onDown);
    });
  };
  attach();
  const observer = new MutationObserver(attach);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => {
    observer.disconnect();
    document.querySelectorAll(selector).forEach((card) => {
      card.removeEventListener("mousemove", onMove);
      card.removeEventListener("mouseleave", onLeave);
      card.removeEventListener("mousedown", onDown);
    });
  };
}
