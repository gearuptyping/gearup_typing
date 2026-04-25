// profanityFilter.js - Chat message filter for bad words with leet speak support
// Also includes display name filtering (replaces bad words with "princess")

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
  "dong",
  "wang",
  "weiner",
  "wiener",
  // Vagina variations
  "vagina",
  "coochie",
  "cooch",
  // Violence/Death words
  "kill",
  "killing",
  "killed",
  "killer",
  "murder",
  "murdering",
  "murderer",
  "death",
  "dead",
  "slaughter",
  "massacre",
  "execute",
  "execution",
  "hang",
  "hanging",
  "suicide",
  "fatal",
  "lethal",
  "deadly",
  // Sexual/Predator words
  "pedophile",
  "pedo",
  "rapist",
  "rape",
  "raping",
  "raped",
  "molest",
  "molester",
  "incest",
  "beastiality",
  "porn",
  "xxx",
  // Hate speech/Slurs
  "faggot",
  "faggots",
  "fag",
  "fags",
  "f4ggot",
  "nigger",
  "nigga",
  "n1gger",
  "n1gga",
  "retard",
  "retarded",
  "re3ard",
  "spastic",
  "tranny",
  "chink",
  "kike",
  "gook",
  "cracker",
  "wetback",
  "sandnigger",
  "raghead",
  "towelhead",
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
  "crap",
  "crapper",
  "crappy",
  "prick",
  "pricks",
  "pr1ck",
  "wanker",
  "wankers",
  "wank",
  "kys",
  "kill yourself",
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

// Filter chat message - replaces bad words with asterisks (*)
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

// Generate a random number for default username
const getRandomNumber = () => {
  return Math.floor(Math.random() * 900) + 100; // Returns number between 100-999
};

// Filter display name - replaces bad words with "princess"
export const filterDisplayName = (name, useRandomNumber = true) => {
  if (!name || typeof name !== "string") {
    return useRandomNumber ? `Player${getRandomNumber()}` : "Player";
  }

  let filteredName = name;

  // First, check for leet speak versions
  const normalizedName = convertLeetToNormal(name);

  // Check each bad word
  badWords.forEach((word) => {
    // Check original name
    const regexOriginal = new RegExp("\\b" + word + "\\b", "gi");
    if (regexOriginal.test(filteredName)) {
      filteredName = filteredName.replace(regexOriginal, "princess");
    }

    // Check normalized version for leet speak
    if (normalizedName.toLowerCase().includes(word.toLowerCase())) {
      // Find where the bad word appears and replace that part
      const wordIndex = normalizedName
        .toLowerCase()
        .indexOf(word.toLowerCase());
      if (wordIndex !== -1) {
        const originalWord = filteredName.substring(
          wordIndex,
          wordIndex + word.length,
        );
        filteredName = filteredName.replace(originalWord, "princess");
      }
    }
  });

  // Also check for embedded bad words (within words) for stricter filtering
  const embeddedBadWords = [
    "ass",
    "shit",
    "fuck",
    "cunt",
    "dick",
    "cock",
    "kill",
    "murder",
    "rape",
    "pedo",
  ];
  embeddedBadWords.forEach((word) => {
    const regex = new RegExp(word, "gi");
    if (regex.test(filteredName)) {
      filteredName = filteredName.replace(regex, "princess");
    }
  });

  // Remove special characters (keep letters, numbers, spaces)
  filteredName = filteredName.replace(/[^a-zA-Z0-9\s]/g, "");
  filteredName = filteredName.replace(/\s+/g, " ").trim();

  // Limit length to 20 characters
  if (filteredName.length > 20) {
    filteredName = filteredName.substring(0, 20);
  }

  // Remove any remaining "princess" duplicates and clean up
  filteredName = filteredName.replace(/(princess\s*)+/gi, "princess");

  // If name contains "princess" and nothing else, or is empty, generate default
  if (
    !filteredName ||
    filteredName.toLowerCase() === "princess" ||
    filteredName.length === 0
  ) {
    return useRandomNumber ? `Player${getRandomNumber()}` : "Player";
  }

  // If filtered name still contains bad words (edge cases), replace whole thing
  let stillHasProfanity = false;
  badWords.forEach((word) => {
    const regex = new RegExp(word, "gi");
    if (regex.test(filteredName)) {
      stillHasProfanity = true;
    }
  });

  if (stillHasProfanity) {
    return useRandomNumber ? `Racer${getRandomNumber()}` : "Racer";
  }

  // Capitalize first letter of each word
  filteredName = filteredName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return filteredName;
};

// Check if display name contains profanity (for validation before save)
export const containsDisplayNameProfanity = (name) => {
  if (!name) return false;

  const normalizedName = convertLeetToNormal(name);

  // Check bad words
  const hasBadWord = badWords.some((word) => {
    const regex = new RegExp("\\b" + word + "\\b", "i");
    return regex.test(normalizedName);
  });

  // Check embedded bad words
  const embeddedBadWords = [
    "ass",
    "shit",
    "fuck",
    "cunt",
    "dick",
    "cock",
    "kill",
    "murder",
    "rape",
    "pedo",
  ];
  const hasEmbedded = embeddedBadWords.some((word) => {
    return normalizedName.toLowerCase().includes(word.toLowerCase());
  });

  return hasBadWord || hasEmbedded;
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
