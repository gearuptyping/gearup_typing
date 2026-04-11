// profanityFilter.js - Chat message filter for bad words with leet speak support
// Common English profanity words to filter
const badWords = [
  // F-word variations
  "fuck",
  "fucking",
  "fucked",
  "fucker",
  "fucks",
  "fuk",
  "fuking",
  "fuked",
  // S-word variations
  "shit",
  "shitting",
  "shitted",
  "shits",
  "shite",
  "sh1t",
  "shiit",
  // A-word variations
  "ass",
  "asshole",
  "asses",
  "arse",
  "arses",
  "azz",
  // B-word variations
  "bitch",
  "bitching",
  "bitches",
  "biotch",
  "b1tch",
  "bich",
  // C-word variations
  "cunt",
  "cunts",
  "c0ck",
  "cawk",
  "cuntz",
  // D-word variations
  "dick",
  "dicks",
  "dik",
  "d1ck",
  "dickhead",
  "dickheads",
  // Cock variations
  "cock",
  "cocks",
  "kock",
  "kocks",
  "cockhead",
  // P-word variations
  "pussy",
  "pussies",
  "puss",
  "puzi",
  "p3nis",
  // W-word variations
  "whore",
  "whores",
  "hore",
  "h0re",
  "wh0re",
  // Penis variations
  "penis",
  "penises",
  "dick",
  "dong",
  "wang",
  "weiner",
  "wiener",
  // Vagina variations
  "vagina",
  "pussy",
  "coochie",
  "cooch",
  "cunt",
  // Miscellaneous
  "bastard",
  "bastards",
  "damn",
  "damned",
  "hell",
  "goddamn",
  "motherfucker",
  "motherfucking",
  "mofo",
  "mf",
  "mfing",
  "twat",
  "twats",
  "slag",
  "slags",
  "slut",
  "sluts",
  "slutty",
  "nigger",
  "nigga",
  "n1gger",
  "n1gga",
  "faggot",
  "faggots",
  "fag",
  "fags",
  "f4ggot",
  "retard",
  "retarded",
  "retard",
  "re3ard",
  "rape",
  "raping",
  "raped",
  "kill",
  "killing",
  "killed",
  "murder",
  "murdering",
  "suicide",
  "kill yourself",
  "kys",
  "crap",
  "crapper",
  "crappy",
  "prick",
  "pricks",
  "pr1ck",
  "wanker",
  "wankers",
  "wank",
];

// Leet speak mappings (number/character substitutions)
const leetMap = {
  0: "o",
  1: "i",
  2: "z",
  3: "e",
  4: "a",
  5: "s",
  6: "g",
  7: "t",
  8: "b",
  9: "g",
  "@": "a",
  $: "s",
  "!": "i",
  "+": "t",
  "|": "i",
};

// Convert leet speak to normal text for better filtering
const convertLeetToNormal = (text) => {
  let converted = text.toLowerCase();
  for (const [leet, normal] of Object.entries(leetMap)) {
    converted = converted.split(leet).join(normal);
  }
  return converted;
};

// Filter message - replaces bad words with asterisks (*)
export const filterMessage = (message) => {
  let filteredMessage = message;

  // First, check for leet speak versions
  const normalizedMessage = convertLeetToNormal(message);

  // Check each bad word against both original and normalized versions
  badWords.forEach((word) => {
    // Check original message
    const regexOriginal = new RegExp("\\b" + word + "\\b", "gi");
    filteredMessage = filteredMessage.replace(
      regexOriginal,
      "*".repeat(word.length),
    );

    // Check normalized version for leet speak
    const regexNormalized = new RegExp("\\b" + word + "\\b", "gi");
    if (regexNormalized.test(normalizedMessage)) {
      // If found in normalized, need to find the actual leet version in original
      const leetPattern = word
        .split("")
        .map((char) => {
          // Find possible leet substitutions for each character
          const leetOptions = Object.entries(leetMap)
            .filter(([_, normal]) => normal === char)
            .map(([leet]) => leet);
          if (leetOptions.length > 0) {
            return `[${char}${leetOptions.join("")}]`;
          }
          return char;
        })
        .join("");

      const leetRegex = new RegExp("\\b" + leetPattern + "\\b", "gi");
      filteredMessage = filteredMessage.replace(
        leetRegex,
        "*".repeat(word.length),
      );
    }
  });

  return filteredMessage;
};

// Check if message contains profanity (returns boolean)
export const containsProfanity = (message) => {
  const lowerMessage = message.toLowerCase();
  const normalizedMessage = convertLeetToNormal(message);

  return badWords.some((word) => {
    const regex = new RegExp("\\b" + word + "\\b", "i");
    return regex.test(lowerMessage) || regex.test(normalizedMessage);
  });
};

// Get the list of bad words (for admin reference)
export const getBadWordsList = () => {
  return [...badWords];
};

// Add custom bad word (for admin panel future feature)
export const addBadWord = (word) => {
  if (word && !badWords.includes(word.toLowerCase())) {
    badWords.push(word.toLowerCase());
    return true;
  }
  return false;
};
