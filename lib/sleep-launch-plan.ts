import type { SleepPreset, SleepReleasePreset } from "@/lib/sleep-audio";

export interface SleepVideoConcept {
  id: string;
  themeLabel: string;
  title: string;
  preset: SleepPreset;
  releasePreset: SleepReleasePreset;
  minutes: number;
  seed: string;
  hook: string;
  angle: string;
  audioDirection: string;
  visualDirection: string;
  tags: string[];
}

export const sleepChannelIdentity = {
  channelName: "Midnight Tide Sleep",
  channelSlug: "midnight-tide-sleep",
  niche: "natural healing ambience built around forests, rain, ocean, waterfalls, wind, and other scenic long-form sleep visuals",
  tagline: "Nature-led sleep ambience with calm motion, real scenery, and gentle long-form healing visuals."
};

export const firstSleepVideoConcepts: SleepVideoConcept[] = [
  {
    id: "nature-01",
    themeLabel: "Forest",
    title: "Forest Calm Sleep | Morning Woodland Breeze | 1시간 반복듣기",
    preset: "deep-drone",
    releasePreset: "ocean-drift",
    minutes: 60,
    seed: "woodland-breeze-dawn",
    hook: "A soft forest-led healing upload built around gentle tree motion, birds at a distance, and calm early-morning air.",
    angle: "Good series opener because it broadens the channel beyond ocean and rain without becoming visually busy.",
    audioDirection: "light forest breeze, distant birds, soft low drone bed",
    visualDirection: "slow canopy motion, green woodland light, shaded walking-path or pine clearing footage",
    tags: ["forest sleep", "woodland ambience", "nature healing", "morning calm"]
  },
  {
    id: "nature-02",
    themeLabel: "Day Ocean",
    title: "Day Ocean Ambient Sleep | Sunlit Wave Drift | 1시간 반복듣기",
    preset: "ocean",
    releasePreset: "ocean-drift",
    minutes: 60,
    seed: "sunlit-wave-drift",
    hook: "A brighter daytime sea upload for viewers who want healing coast visuals without a dark overnight look.",
    angle: "Good broad-reach concept because waves are familiar, non-distracting, and easy to package attractively.",
    audioDirection: "coastal surf, light shore wash, clean open-air ambience",
    visualDirection: "blue horizon, sunlit waves, soft sea foam, slow shoreline footage",
    tags: ["ocean sleep", "day sea", "wave ambience", "healing music"]
  },
  {
    id: "nature-03",
    themeLabel: "Mountain Wind",
    title: "Mountain Wind Sleep | Ridge Breeze Ambience | 1시간 반복듣기",
    preset: "brown-noise",
    releasePreset: "ocean-drift",
    minutes: 60,
    seed: "ridge-breeze-wide",
    hook: "A cooler, airier upload that leans on highland wind and wide open nature visuals instead of water-heavy ambience.",
    angle: "Useful for diversifying the channel and seeing whether wind-led healing scenery holds attention.",
    audioDirection: "mountain breeze, distant air movement, soft masking bed",
    visualDirection: "ridge lines, slow clouds, grass movement, elevated lookout footage",
    tags: ["mountain wind", "nature ambience", "healing sleep", "ridge calm"]
  },
  {
    id: "nature-04",
    themeLabel: "Valley Stream",
    title: "Valley Stream Sleep | Gentle Creek Drift | 1시간 반복듣기",
    preset: "ocean",
    releasePreset: "ocean-drift",
    minutes: 60,
    seed: "valley-creek-stones",
    hook: "A quieter water-led concept focused on shallow stream movement, small rocks, and a softer valley feel than ocean surf.",
    angle: "Strong bridge between forest and water themes, with very natural loop potential.",
    audioDirection: "small creek flow, light water trickle, low natural bed",
    visualDirection: "stream over stones, green valley edges, close-to-water motion",
    tags: ["creek ambience", "valley stream", "nature sleep", "gentle water"]
  },
  {
    id: "nature-05",
    themeLabel: "Night Sea",
    title: "Night Sea Sleep | Moonlit Tide Calm | 1시간 반복듣기",
    preset: "ocean",
    releasePreset: "ocean-drift",
    minutes: 60,
    seed: "moonlit-tide-night",
    hook: "A darker coastal concept for viewers who want sea ambience with a more night-time, reflective mood.",
    angle: "Useful for testing whether a nighttime sea palette outperforms the brighter day-ocean version.",
    audioDirection: "deeper surf, softer shoreline rhythm, darker night sea texture",
    visualDirection: "moonlit coast, dark blue tide, slow reflective water, low-light sea footage",
    tags: ["night sea", "ocean at night", "moonlight sleep", "coastal calm"]
  },
  {
    id: "nature-06",
    themeLabel: "Rain",
    title: "Rain Window Sleep | Soft Night Rain | 1시간 반복듣기",
    preset: "rain",
    releasePreset: "rain-window",
    minutes: 60,
    seed: "soft-night-rain-window",
    hook: "A dedicated rain-led healing upload that keeps the focus on cozy night rain rather than ocean or wind.",
    angle: "Rain should stay in the core lineup because it is one of the most intuitive sleep-channel themes.",
    audioDirection: "steady rainfall, window-side patter, soft low masking texture",
    visualDirection: "rain on glass, wet lights, low-contrast night window motion",
    tags: ["rain sleep", "rain asmr", "night rain", "healing sound"]
  },
  {
    id: "nature-07",
    themeLabel: "Waterfall",
    title: "Waterfall Ambient Sleep | Cascading Nature Drift | 1시간 반복듣기",
    preset: "ocean",
    releasePreset: "ocean-drift",
    minutes: 60,
    seed: "cascading-waterfall-drift",
    hook: "A stronger moving-nature concept with visible falling water, cooler mist, and a more immersive natural texture.",
    angle: "Best near-term publish-ready target because we already have working waterfall footage and matching ambience.",
    audioDirection: "waterfall roar softened for sleep, wet air ambience, smooth low-end bed",
    visualDirection: "falling water, rocky cliff face, mist, medium-motion scenic loop",
    tags: ["waterfall sleep", "nature asmr", "healing waterfall", "ambient water"]
  },
  {
    id: "nature-08",
    themeLabel: "Snow Forest",
    title: "Snow Forest Sleep | Winter Pine Calm | 1시간 반복듣기",
    preset: "brown-noise",
    releasePreset: "ocean-drift",
    minutes: 60,
    seed: "winter-pine-silent",
    hook: "A colder, quieter concept that leans on stillness, snow texture, and low visual stimulation.",
    angle: "Useful seasonal variant and a strong contrast against the wetter, louder water-based uploads.",
    audioDirection: "soft winter air, muted hush, brown-noise bed for warmth and masking",
    visualDirection: "snow on pines, slow falling snow, winter trail or forest clearing",
    tags: ["snow forest", "winter sleep", "pine calm", "quiet ambience"]
  },
  {
    id: "nature-09",
    themeLabel: "Meadow Breeze",
    title: "Meadow Breeze Sleep | Grassland Wind Drift | 1시간 반복듣기",
    preset: "deep-drone",
    releasePreset: "ocean-drift",
    minutes: 60,
    seed: "grassland-breeze-soft",
    hook: "A lighter daytime healing upload built around open fields, soft movement, and warm wind instead of water.",
    angle: "Good for keeping the series from becoming too blue-toned or water-only.",
    audioDirection: "soft meadow wind, low airy bed, sparse natural motion",
    visualDirection: "grass movement, open field, flowers or reeds, warm light scenic loops",
    tags: ["meadow sleep", "grass wind", "field ambience", "healing breeze"]
  },
  {
    id: "nature-10",
    themeLabel: "Lakeside Dusk",
    title: "Lakeside Dusk Sleep | Evening Water Calm | 1시간 반복듣기",
    preset: "ocean",
    releasePreset: "ocean-drift",
    minutes: 60,
    seed: "lakeside-evening-calm",
    hook: "A sunset-to-dusk concept for viewers who want a calmer water theme than full surf or waterfall motion.",
    angle: "Strong closer for a 10-video batch because it sits between ocean, forest, and evening healing moods.",
    audioDirection: "still water edge, soft evening air, gentle ambient wash",
    visualDirection: "lake at dusk, orange-blue reflections, tree silhouettes, very slow water motion",
    tags: ["lakeside sleep", "dusk ambience", "evening calm", "water healing"]
  }
];

export const firstPublishReadyConceptId = "nature-07";

export function getFirstPublishReadyConcept() {
  return firstSleepVideoConcepts.find((concept) => concept.id === firstPublishReadyConceptId)!;
}

export function getQuickPrivateTestConcept(): SleepVideoConcept {
  return {
    id: "nature-quick-private",
    themeLabel: "Quick Scenic Test",
    title: "[Private Test] Waterfall Ambient Sleep | 1 Minute Scenic Check",
    preset: "ocean",
    releasePreset: "ocean-drift",
    minutes: 1,
    seed: "waterfall-quick-private-check",
    hook: "A fast private scenic render used to validate YouTube uploads before we ship a full natural-healing release.",
    angle: "Keeps upload validation aligned with the current moving-scenic channel direction.",
    audioDirection: "quick waterfall-themed ambient bed",
    visualDirection: "short moving scenic clip for upload validation",
    tags: ["private test", "scenic sleep", "waterfall ambience", "upload check"]
  };
}
