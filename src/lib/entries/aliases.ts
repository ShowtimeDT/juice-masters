// Name aliases: entry name -> ESPN's athlete.fullName.
// Shared across tournaments — accented or differently-formatted golfer names
// only need to be listed once.
export const NAME_ALIASES: Record<string, string> = {
  "Ludvig Aberg": "Ludvig Åberg",
  "Nicolai Hojgaard": "Nicolai Højgaard",
  "Rasmus Hojgaard": "Rasmus Højgaard",
  "Sami Valimaki": "Sami Välimäki",
  "Sung-Jae Im": "Sungjae Im",
  "JJ Spaun": "J.J. Spaun",
  "John Keefer": "Johnny Keefer",
  "Rasmus Neergaard": "Rasmus Neergaard-Petersen",
  "Tyrell Hatton": "Tyrrell Hatton",
};

export function resolveGolferName(name: string): string {
  return NAME_ALIASES[name] || name;
}
