const THEME_SCORE_LIBRARY = [
  { film: "Interstellar", track: "Cornfield Chase", composer: "Hans Zimmer" },
  { film: "Inception", track: "Time", composer: "Hans Zimmer" },
  { film: "Blade Runner 2049", track: "2049", composer: "Hans Zimmer" },
  { film: "The Dark Knight", track: "Why So Serious?", composer: "Hans Zimmer" },
  { film: "Dune", track: "Paul's Dream", composer: "Hans Zimmer" },
  { film: "La La Land", track: "Mia & Sebastian's Theme", composer: "Justin Hurwitz" },
  { film: "The Godfather", track: "Main Title (The Godfather Waltz)", composer: "Nino Rota" },
  { film: "Schindler's List", track: "Theme from Schindler's List", composer: "John Williams" },
  { film: "Star Wars", track: "Main Title", composer: "John Williams" },
  { film: "Jurassic Park", track: "Theme from Jurassic Park", composer: "John Williams" },
  { film: "Pirates of the Caribbean", track: "He's a Pirate", composer: "Hans Zimmer" },
  { film: "Gladiator", track: "Now We Are Free", composer: "Hans Zimmer" },
  { film: "The Lord of the Rings", track: "Concerning Hobbits", composer: "Howard Shore" },
  { film: "Harry Potter", track: "Hedwig's Theme", composer: "John Williams" },
  { film: "Up", track: "Married Life", composer: "Michael Giacchino" },
  { film: "The Lion King", track: "Circle of Life", composer: "Elton John" },
  { film: "Spirited Away", track: "One Summer's Day", composer: "Joe Hisaishi" },
  { film: "Amelie", track: "Comptine d'un autre ete", composer: "Yann Tiersen" },
  { film: "Cinema Paradiso", track: "Love Theme", composer: "Ennio Morricone" },
  { film: "The Good, the Bad and the Ugly", track: "The Ecstasy of Gold", composer: "Ennio Morricone" },
  { film: "Requiem for a Dream", track: "Lux Aeterna", composer: "Clint Mansell" },
  { film: "Tenet", track: "Posterity", composer: "Ludwig Goransson" },
  { film: "Black Panther", track: "Wakanda", composer: "Ludwig Goransson" },
  { film: "The Social Network", track: "Hand Covers Bruise", composer: "Trent Reznor" },
  { film: "Soul", track: "Epiphany", composer: "Jon Batiste" },
  { film: "Spider-Man: Into the Spider-Verse", track: "What's Up Danger", composer: "Blackway" },
  { film: "Moonlight", track: "The Middle of the World", composer: "Nicholas Britell" },
  { film: "Arrival", track: "On the Nature of Daylight", composer: "Max Richter" },
  { film: "Everything Everywhere All at Once", track: "This Is a Life", composer: "Son Lux" },
  { film: "Oppenheimer", track: "Can You Hear the Music", composer: "Ludwig Goransson" },
];

function getDailySeeds() {
  const timezone = process.env.DAILY_TIMEZONE || "Asia/Kolkata";
  const dayBucket = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const daySeed = Number(dayBucket.replace(/-/g, ""));
  const offset = daySeed % THEME_SCORE_LIBRARY.length;
  const rotated = THEME_SCORE_LIBRARY.slice(offset).concat(THEME_SCORE_LIBRARY.slice(0, offset));
  return rotated.slice(0, 6);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const seeds = getDailySeeds();
    const scores = await Promise.all(
      seeds.map(async (seed) => {
        const term = `${seed.film} ${seed.track} ${seed.composer}`;
        const params = new URLSearchParams({ term, media: "music", entity: "song", limit: "5" });
        const response = await fetch(`https://itunes.apple.com/search?${params.toString()}`);
        const body = await response.json();
        const songs = Array.isArray(body.results) ? body.results : [];
        const best = songs.find((song) => {
          const name = String(song.trackName || "").toLowerCase();
          const artist = String(song.artistName || "").toLowerCase();
          return name.includes(String(seed.track).toLowerCase().slice(0, 6)) || artist.includes(String(seed.composer).toLowerCase().split(" ")[0]);
        }) || songs[0] || {};

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
