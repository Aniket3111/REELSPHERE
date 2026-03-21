export const initialChatMessages = [
  { role: "assistant", content: "Ask about films, directors, genres, watch orders, or what to watch based on your mood." },
];

export const TOOLS = [
  { id: "search", index: "01", label: "Natural Search", description: "Mood-led discovery", icon: "🔍" },
  { id: "recommend", index: "02", label: "Recommendations", description: "Pattern-based picks", icon: "⭐" },
  { id: "chat", index: "03", label: "Film Brain", description: "Conversation mode", icon: "💬" },
  { id: "taste", index: "04", label: "Taste Decoder", description: "Profile your taste", icon: "🎭" },
];

export const MARQUEE_PLATFORMS = [
  { id: "netflix", name: "Netflix", src: "/logos/netflix.svg" },
  { id: "disney", name: "Disney+", src: "/logos/disneyplus.svg" },
  { id: "prime", name: "Prime Video", src: "/logos/primevideo.svg" },
  { id: "apple", name: "Apple TV+", src: "/logos/appletv.svg" },
  { id: "max", name: "Max", src: "/logos/max.svg" },
  { id: "imdb", name: "IMDb", src: "/logos/imdb.svg" },
  { id: "rotten", name: "Rotten Tomatoes", src: "/logos/rottentomatoes.svg" },
  { id: "letterboxd", name: "Letterboxd", src: "/logos/letterboxd.svg" },
  { id: "youtube", name: "YouTube", src: "/logos/youtube.svg" },
];

export const HERO_WORDS = ["obsession", "escape", "marathon", "masterpiece"];

export const TRENDING_TITLES = [
  { title: "Oppenheimer", year: "2023", tag: "Drama", desc: "The story of J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II." },
  { title: "The Bear", year: "2022", tag: "Series", desc: "A young chef from the fine dining world returns home to run his family's sandwich shop in Chicago." },
  { title: "Past Lives", year: "2023", tag: "Romance", desc: "Two childhood sweethearts are reunited after 20 years apart, forced to reckon with love, choices, and destiny." },
  { title: "Dune: Part Two", year: "2024", tag: "Sci-Fi", desc: "Paul Atreides unites with the Fremen while on a warpath of revenge against the conspirators who destroyed his family." },
  { title: "Shōgun", year: "2024", tag: "Series", desc: "A powerful lord of feudal Japan and an English navigator form an unlikely alliance to shift the balance of power." },
  { title: "Poor Things", year: "2023", tag: "Dark Comedy", desc: "The fantastical story of Bella Baxter, brought back to life by a brilliant surgeon and eager to learn about the world." },
];

export const MOVIE_QUOTES = [
  { quote: "May the Force be with you.", film: "Star Wars", year: "1977" },
  { quote: "Here's looking at you, kid.", film: "Casablanca", year: "1942" },
  { quote: "You can't handle the truth!", film: "A Few Good Men", year: "1992" },
  { quote: "I'll be back.", film: "The Terminator", year: "1984" },
  { quote: "Why so serious?", film: "The Dark Knight", year: "2008" },
  { quote: "Life is like a box of chocolates.", film: "Forrest Gump", year: "1994" },
  { quote: "I see dead people.", film: "The Sixth Sense", year: "1999" },
  { quote: "To infinity and beyond!", film: "Toy Story", year: "1995" },
  { quote: "You is kind, you is smart, you is important.", film: "The Help", year: "2011" },
  { quote: "Just keep swimming.", film: "Finding Nemo", year: "2003" },
  { quote: "With great power comes great responsibility.", film: "Spider-Man", year: "2002" },
  { quote: "Hope is a good thing, maybe the best of things.", film: "The Shawshank Redemption", year: "1994" },
];

export const MOOD_BUTTONS = [
  { label: "Dark & Moody", query: "Dark, moody films with heavy atmosphere and moral ambiguity", icon: "🌑" },
  { label: "Feel-good", query: "Feel-good uplifting movies that leave you smiling", icon: "☀️" },
  { label: "Mind-bending", query: "Mind-bending cerebral films with twists and layered narratives", icon: "🌀" },
  { label: "Edge of my seat", query: "Intense edge-of-your-seat thrillers with relentless pacing", icon: "⚡" },
  { label: "Visually stunning", query: "Visually stunning films with breathtaking cinematography", icon: "🎨" },
  { label: "Cry my eyes out", query: "Emotionally devastating films that will make you cry", icon: "💧" },
];
