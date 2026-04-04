import type { Category } from "./types";

export interface MetadataSuggestion {
  title: string;
  description: string;
  hook: string;
  thumbnailCopy: string;
  shortsScript: string;
  recommendedCategory: Category;
  recommendedTags: string[];
  categoryReason: string;
}

const categoryKeywords: Record<Category, string[]> = {
  finance: ["stock", "money", "budget", "invest", "savings", "market", "portfolio", "dividend"],
  ai: ["ai", "prompt", "automation", "gpt", "agent", "model", "workflow", "llm"],
  vision: ["inspection", "defect", "camera", "vision", "factory", "quality", "sensor", "anomaly"],
  baseball: ["baseball", "rotation", "pitch", "bullpen", "homer", "mlb", "batting", "inning"],
  football: ["football", "soccer", "match", "title race", "pressing", "striker", "midfield", "league"],
  creator: ["youtube", "creator", "script", "thumbnail", "upload", "editing", "audience", "content"],
  sleep: ["sleep", "ambient", "rain", "ocean", "brown noise", "meditation", "calm", "relax"]
};

export function suggestMetadata(input: {
  idea: string;
  category?: Category;
  channelName?: string;
}): MetadataSuggestion {
  const idea = cleanIdea(input.idea);
  const channel = input.channelName?.trim() || "this channel";
  const recommendation = recommendCategory(idea, input.category);
  const category = recommendation.category;

  const titleTemplates: Record<Category, string[]> = {
    finance: [
      `3 money lessons from ${idea}`,
      `The finance habit behind ${idea}`,
      `What ${idea} taught me about better money decisions`
    ],
    ai: [
      `How I use AI for ${idea}`,
      `The AI workflow that makes ${idea} faster`,
      `${idea} with AI: what actually works`
    ],
    vision: [
      `Fixing ${idea} in vision inspection`,
      `What ${idea} reveals about defect review`,
      `A practical look at ${idea} for inspection teams`
    ],
    baseball: [
      `Why ${idea} could change this baseball season`,
      `The baseball story behind ${idea}`,
      `${idea}: the stat that matters most`
    ],
    football: [
      `Why ${idea} changes the football conversation`,
      `The football lesson hidden inside ${idea}`,
      `${idea}: what it means for the next match`
    ],
    creator: [
      `How creators can use ${idea} better`,
      `The content system behind ${idea}`,
      `${idea}: a creator workflow worth stealing`
    ],
    sleep: [
      `${idea}: calm sleep audio for a longer night routine`,
      `Ambient sleep mix built around ${idea}`,
      `${idea} for deeper sleep and slower breathing`
    ]
  };

  const hookTemplates: Record<Category, string[]> = {
    finance: [
      `${idea} looks simple, but it changes how you handle money every week.`,
      `If your finances feel messy, ${idea} is the part worth fixing first.`
    ],
    ai: [
      `${idea} is where AI starts saving real time instead of just making noise.`,
      `Most people overcomplicate AI. ${idea} is the part that actually matters.`
    ],
    vision: [
      `${idea} is usually where inspection teams lose time and trust.`,
      `If your inspection pipeline keeps drifting, start with ${idea}.`
    ],
    baseball: [
      `${idea} might look small, but it changes the whole baseball story.`,
      `The interesting part of ${idea} is what it says about the next stretch.`
    ],
    football: [
      `${idea} is the kind of detail that shifts an entire match narrative.`,
      `If you only watch the scoreline, you miss what ${idea} really means.`
    ],
    creator: [
      `${idea} is the kind of workflow tweak that makes creators more consistent.`,
      `If publishing feels chaotic, ${idea} is a better place to start than motivation.`
    ],
    sleep: [
      `${idea} is the kind of sound bed people use when they want the room to slow down.`,
      `If you need a calmer sleep routine, start with the texture inside ${idea}.`
    ]
  };

  const title = pick(titleTemplates[category], idea);
  const hook = pick(hookTemplates[category], idea);
  const thumbnailCopy = buildThumbnailCopy(category, idea);
  const description = [
    hook,
    `In this video, ${channel} breaks down ${idea} and turns it into a clear, repeatable takeaway.`,
    `You will get the key point, the practical angle, and what to try next.`
  ].join(" ");

  return {
    title,
    description,
    hook,
    thumbnailCopy,
    shortsScript: buildShortsScript(category, idea),
    recommendedCategory: category,
    recommendedTags: buildRecommendedTags(category, idea),
    categoryReason: recommendation.reason
  };
}

export function recommendCategory(idea: string, currentCategory?: Category) {
  const normalizedIdea = cleanIdea(idea).toLowerCase();
  const scores = new Map<Category, number>();

  for (const category of Object.keys(categoryKeywords) as Category[]) {
    const score = categoryKeywords[category].reduce(
      (sum, keyword) => sum + Number(normalizedIdea.includes(keyword)),
      0
    );
    scores.set(category, score);
  }

  const best = [...scores.entries()].sort((left, right) => right[1] - left[1])[0];
  if (!best || best[1] === 0) {
    return {
      category: currentCategory ?? "creator",
      reason: "No strong keyword match was found, so the current creator-style category stays in place."
    };
  }

  return {
    category: best[0],
    reason: `The idea matches ${best[0]} keywords like ${findMatchedKeyword(best[0], normalizedIdea)}.`
  };
}

function buildShortsScript(category: Category, idea: string) {
  const opener = {
    finance: `If your money system still feels messy, start with ${idea}.`,
    ai: `If AI still feels noisy instead of useful, start with ${idea}.`,
    vision: `If inspection keeps missing the obvious problem, look at ${idea}.`,
    baseball: `This one baseball angle changes how you read ${idea}.`,
    football: `This football talking point matters more than the scoreline: ${idea}.`,
    creator: `If your channel workflow feels inconsistent, this is the fix: ${idea}.`,
    sleep: `If you need the room to settle down fast, start with this: ${idea}.`
  }[category];

  return [
    opener,
    `First, set up the situation in one sentence.`,
    `Then explain the one detail that changes the story around ${idea}.`,
    `Close with one clear takeaway viewers can remember and react to.`
  ].join(" ");
}

function buildRecommendedTags(category: Category, idea: string) {
  const tokens = cleanIdea(idea)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4)
    .slice(0, 4);

  return [...new Set([category, ...tokens])].slice(0, 6);
}

function cleanIdea(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function pick(values: string[], seed: string) {
  const index = seed.length % values.length;
  return values[index];
}

function buildThumbnailCopy(category: Category, idea: string) {
  const shortIdea = idea.length > 28 ? `${idea.slice(0, 25)}...` : idea;

  const prefix: Record<Category, string> = {
    finance: "Money fix",
    ai: "AI shortcut",
    vision: "QC fix",
    baseball: "Baseball edge",
    football: "Match swing",
    creator: "Creator fix",
    sleep: "Sleep drift"
  };

  return `${prefix[category]}: ${shortIdea}`;
}

function findMatchedKeyword(category: Category, idea: string) {
  return categoryKeywords[category].find((keyword) => idea.includes(keyword)) ?? categoryKeywords[category][0];
}
