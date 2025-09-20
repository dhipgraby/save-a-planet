// Central source of educational intro slides for the simulation.
// Keeping messaging concise, urgent, and reflective.
export interface IntroSlide {
  title: string;
  lines: string[];
  fact?: string;
  img?: string;      // single hero image
  imgs?: string[];   // or a small set of images to illustrate a concept
  imgSize?: "sm" | "md" | "lg" | "xl"; // optional visual hint for image sizing
}

export const introSlides: IntroSlide[] = [
  {
    title: "What Are We Simulating?",
    lines: [
      "This is an educational climate survival sim.",
      "Your actions can extend the planet's livable time.",
      "Replace harmful industries and manage resources wisely."
    ],
    fact: "Goal: delay collapse by reducing damage and supporting people.",
    img: "/game/planetIntro.png"
  },
  {
    title: "Planet Health Declines With Damage",
    lines: [
      "Bad (polluting) systems increase ongoing damage.",
      "More damage = faster loss of planetary health.",
      "Letting damage pile up shortens your time dramatically."
    ],
    fact: "Damage growth accelerates collapse risk.",
    imgs: ["/game/oil.png", "/game/coal.png", "/game/planetdying.png"],
    imgSize: "md"
  },
  {
    title: "Good Systems Buy Time",
    lines: [
      "Clean systems provide resources with less damage.",
      "They may ramp slower, but they extend survival time.",
      "Invest early to slow the decline of planet health."
    ],
    fact: "Cleaner energy reduces collapse velocity.",
    imgs: ["/game/solar.png", "/game/wind.png", "/game/reforest.png"],
    imgSize: "md"
  },
  {
    title: "Population Capacity Matters",
    lines: [
      "Population health affects how well you can transition.",
      "Under-supply? capacity declines. Strong surplus? it recovers.",
      "Protect people to keep options open for replacement."
    ],
    fact: "Healthy populations enable sustained transitions.",
    imgs: ["/game/population.png", "/game/lesspopulation.png"],
    // Make these images significantly larger for visibility
    imgSize: "xl" as any
  },
  {
    title: "Resources: Farms and Forests",
    lines: [
      "Food and materials support your population and builds.",
      "Deforestation/logging boosts resources but harms resilience.",
      "Reforestation helps recovery and reduces long-term risk."
    ],
    fact: "Balance immediate needs with ecological stability.",
    imgs: ["/game/farm.png", "/game/logging.png", "/game/reforest.png"],
    imgSize: "md"
  },
  {
    title: "Your Strategy",
    lines: [
      "Phase out bad systems when replacements are ready.",
      "Keep population supplied to avoid negative spirals.",
      "Every replacement that cuts damage effectively buys time."
    ],
    fact: "Act early; sequence upgrades to minimize damage spikes.",
    imgs: ["/game/planet.png", "/game/planetmid.png", "/game/planetdying.png"],
    imgSize: "md"
  },
  {
    title: "Scoring (Educational Focus)",
    lines: [
      "Score = time survived + bonus for population health.",
      "There is no permanent victory — only extension.",
      "Measure success by how long you hold off collapse."
    ],
    fact: "Survival time is the primary metric.",
    img: "/game/coin.svg"
  },
  {
    title: "Ready? Make It Last",
    lines: [
      "Replace harmful industries.",
      "Care for resources and people.",
      "Extend the planet's livable time as long as you can."
    ],
    fact: "Press Start to begin the simulation.",
    img: "/game/planet.png"
  }
];
