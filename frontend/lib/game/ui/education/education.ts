
export interface EducationInfo {
  pros: string[];
  cons: string[];
  tagline?: string;
  image: string;
}

// Central educational bullets for systems.
// Kept intentionally concise; can be localized or expanded later.
const EDUCATION_DATA: Record<string, { pros: string[]; cons: string[]; tagline?: string }> = {
  oil: {
    tagline: "High energy density, but emits CO₂ and pollutants.",
    pros: ["Reliable energy source", "Established infrastructure"],
    cons: ["Greenhouse gas emissions", "Air and water pollution"]
  },
  coal: {
    tagline: "Abundant and cheap, yet the dirtiest fossil fuel.",
    pros: ["Low upfront cost", "Stable baseload power"],
    cons: ["Very high CO₂ and particulates", "Mining and habitat damage"]
  },
  logging: {
    tagline: "Removes trees that store carbon; unsustainable practice harms ecosystems.",
    pros: ["Provides timber and jobs"],
    cons: ["Loss of carbon sinks", "Habitat fragmentation"]
  },
  solar: {
    tagline: "Clean electricity from sunlight with near-zero operating emissions.",
    pros: ["No fuel cost", "Scales from rooftops to utility"],
    cons: ["Intermittent (needs storage)", "Upfront installation cost"]
  },
  wind: {
    tagline: "Wind turns turbines into clean power.",
    pros: ["Low emissions", "Mature technology"],
    cons: ["Intermittency", "Siting and visual/noise concerns"]
  },
  reforest: {
    tagline: "Planting trees pulls CO₂ from the atmosphere and restores habitats.",
    pros: ["Carbon sequestration", "Biodiversity benefits"],
    cons: ["Takes time to mature", "Needs land and stewardship"]
  },
  sustainableFarm: {
    tagline: "Soil-friendly practices improve yields and resilience.",
    pros: ["Healthier soils", "Reduced runoff and inputs"],
    cons: ["Transition effort", "May need training and support"]
  }
};

const ICON_KEY_MAP: Record<string, string> = { sustainableFarm: "farm" };

function iconSrc(key: string) {
  return `/game/${ICON_KEY_MAP[key] ?? key}.svg`;
}

export function getEducationFor(key: string, type: "good" | "bad") {
  const info = EDUCATION_DATA[key] ?? { pros: [], cons: [] };
  return {
    image: iconSrc(key),
    pros: info.pros,
    cons: info.cons,
    tagline: info.tagline ?? (type === "good" ? "Cleaner alternative with trade-offs." : "Polluting system with external costs.")
  };
}
