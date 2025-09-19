// Central source of educational intro slides for the simulation.
// Keeping messaging concise, urgent, and reflective.
export interface IntroSlide {
  title: string;
  lines: string[];
  fact?: string;
  img?: string;
}

export const introSlides: IntroSlide[] = [
  {
    title: "2030 Is Not Far",
    lines: [
      "We have already warmed the planet about 1.1°C.",
      "On our current path we blow past 1.5°C in YOUR lifetime.",
      "Every tenth of a degree locks in more irreversible loss."
    ],
    fact: "Source: IPCC AR6 Synthesis Report",
    img: "/game/planet.png"
  },
  {
    title: "Delay ≠ Defeat",
    lines: [
      "We are not 'saving' the planet here.",
      "We're buying time for people, forests, species to adapt.",
      "Time is the most valuable resource now."
    ],
    fact: "Stabilizing emissions slows feedback cascades."
  },
  {
    title: "Systems Drive Outcomes",
    lines: [
      "Fossil systems drain future health for short-term gain.",
      "Cleaner systems lower damage but need social stability.",
      "Population health enables transition capacity."
    ],
    fact: "Real transitions hinge on governance + public resilience."
  },
  {
    title: "Tipping Risk",
    lines: [
      "Ice loss, forest dieback, permafrost thaw—chain reactions.",
      "Crossing thresholds accelerates decline.",
      "Slowing damage reduces probability of cascades."
    ],
    fact: "Compound tipping could amplify warming >2×."
  },
  {
    title: "Your Objective",
    lines: [
      "Mitigate damage.",
      "Stabilize population capacity.",
      "Stretch the remaining habitable time as long as possible."
    ],
    fact: "There is no win screen—only survival extension."
  },
  {
    title: "How This Works",
    lines: [
      "Polluting systems: fast resources, rising damage.",
      "Sustainable systems: slower ramp, less damage.",
      "Population checks every 10s: under-supply? decline; strong surplus? recover."
    ],
    fact: "Balance short-term gain vs long-term collapse velocity."
  },
  {
    title: "Mindset",
    lines: [
      "Act early. Replace aggressively when you can.",
      "Preserve resilience — a collapsed population cannot transition.",
      "Every second you delay damage is a life support extension."
    ],
    fact: "Strategic sequencing > random reaction."
  },
  {
    title: "Ready?",
    lines: [
      "You will lose eventually.",
      "Measure success by how long you delay collapse.",
      "Let that discomfort stay with you."
    ],
    fact: "Press Start to begin the simulation."
  }
];
