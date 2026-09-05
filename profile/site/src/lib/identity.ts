// Real, hand-authored content — same category as the tagline/avatar already
// hardcoded on the current profile homepage. Not "data" in the API sense, so it
// doesn't go through the empty-state machinery; it's just copy to edit here
// directly when it changes.

export const identity = {
  name: "Žiga Hvalec",
  tagline: "Mobile dev by day, dog dad and recipe hoarder by night.",
  location: "Maribor, Slovenia",
  avatar: "/profile/assets/images/avatar.jpg",
};

export interface ElsewhereLink {
  category: string;
  site: string;
  handle: string;
  url: string;
}

// Every handle below is pulled from the current profile homepage's existing
// "elsewhere" links (footer/header partials) — real accounts, not
// placeholders. Add a row here the day a new one becomes real.
export const elsewhereLinks: ElsewhereLink[] = [
  { category: "CODE", site: "GitHub", handle: "@hvalec427", url: "https://github.com/hvalec427" },
  { category: "WORK", site: "LinkedIn", handle: "@hvalec", url: "https://www.linkedin.com/in/hvalec/" },
  { category: "MUSIC", site: "Spotify", handle: "@hviga59", url: "https://open.spotify.com/user/hviga59" },
  { category: "FILM", site: "Trakt", handle: "@kekec", url: "https://app.trakt.tv/profile/kekec" },
  { category: "GAMES", site: "Steam", handle: "hviga59", url: "https://steamcommunity.com/profiles/76561198068507235" },
  { category: "GAMES", site: "Xbox", handle: "II427II", url: "https://account.xbox.com/en-us/profile?gamertag=II427II" },
  { category: "GAMES", site: "PSN", handle: "Il427lI", url: "https://psnprofiles.com/Il427lI" },
];

// The design's "Now" page (MAKING / LEARNING / AVOIDING) is hand-written
// copy, not something an API can back — there's no source for it yet, so it
// starts empty. Fill it in here when there's something worth saying.
export interface NowCard {
  heading: string;
  text: string;
}
export const nowCards: NowCard[] = [];
