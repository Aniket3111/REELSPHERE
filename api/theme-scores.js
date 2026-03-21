const SEEDS = [
  { film: "Interstellar", track: "Cornfield Chase", composer: "Hans Zimmer" },
  { film: "Inception", track: "Time", composer: "Hans Zimmer" },
  { film: "Blade Runner 2049", track: "2049", composer: "Hans Zimmer" },
  { film: "The Dark Knight", track: "Why So Serious?", composer: "Hans Zimmer" },
  { film: "Dune", track: "Paul's Dream", composer: "Hans Zimmer" },
  { film: "La La Land", track: "Mia & Sebastian's Theme", composer: "Justin Hurwitz" },
];

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const scores = await Promise.all(
      SEEDS.map(async (seed) => {
        const term = `${seed.film} ${seed.track} ${seed.composer}`;
        const params = new URLSearchParams({ term, media: "music", entity: "song", limit: "5" });
        const response = await fetch(`https://itunes.apple.com/search?${params.toString()}`);
        const body = await response.json();
        const songs = Array.isArray(body.results) ? body.results : [];
        const best = songs[0] || {};

        return {
          ...seed,
          previewUrl: best.previewUrl || "",
          artworkUrl: best.artworkUrl100
            ? String(best.artworkUrl100).replace("100x100bb", "600x600bb")
            : "",
          storeUrl: best.trackViewUrl || "",
          artist: best.artistName || seed.composer,
        };
      }),
    );

    return res.status(200).json({ data: { scores } });
  } catch (error) {
    return res.status(200).json({ data: { scores: [] }, fallback: true, error: error.message });
  }
};
