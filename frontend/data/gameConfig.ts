export const gameConfig = {
  // Game ticks every second now
  tickDurationMs: 1000,
  planet: { start: 2000, max: 2000 },
  population: { start: 40, max: 100 },
  resourcesStart: 500,
  // Planet baseline damage per second; total planet delta = baseDecay + sum(planetImpact)
  baseDecay: 1,
  // Population consumption: resources consumed every 10 seconds based on alive population
  populationConsumptionPer10sPerCapita: 4,
  // New population dynamics (5s checks instead of 10s deductions)
  // We still DISPLAY the required resources per 10s, but we CHECK every 5s:
  // - If income/sec < required/sec, population decays by this many points per check
  // - If income/sec >= required/sec * 1.4, population heals by this many points per check
  populationCheckIntervalSec: 4,
  populationDecayPerCheck: 4,
  populationHealPerCheck: 2,
  populationHealThresholdMultiplier: 1.2,
  // Minimum income per population point per 10s to sustain (used for 5s checks and 10s deduction)
  minIncomePerPopPer10s: 180,
  // Requirements and economy actions
  minPopulationToBuy: 20,
  maxPopulationToBuy: 90,
  removeBadCost: 350,
  sellRefundPct: 0.3,
  // Heal button (planet cannot be healed by systems)
  heal: { amountPct: 0.1, cooldownSec: 15 },
  // Visual stress thresholds retained for UI cues
  planetStressThresholdPct: 0.3,
  planetStressPenalty: 1,
  badSystems: {
    oil: {
      key: "oil", name: "Oil Plant", resourceIncome: 20, planetImpact: 12, sprite: "/game/oil.png",
      description: "Oil plants burn petroleum to produce large amounts of energy quickly, making them a major global power source. However, they emit greenhouse gases and risk spills that harm ecosystems, creating heavy long-term environmental costs.",
      blurb: "Oil provides lots of energy fast but emits greenhouse gases and risks spills.",
      pros: [
        "Generates a very high amount of energy in a short time",
        "Reliable supply as long as reserves last",
        "Infrastructure already widespread in real-world systems",
        "Supports industrial growth and fast economic development",
      ],
      cons: [
        "Releases large amounts of greenhouse gases",
        "Contributes significantly to global warming",
        "Risk of oil spills that harm marine and land ecosystems",
        "Extraction destroys natural habitats and landscapes",
      ]
    },
    coal: {
      key: "coal", name: "Coal Plant", resourceIncome: 10, planetImpact: 8, sprite: "/game/coal.png",
      description: "Coal plants generate steady and cheap electricity but are the most polluting fossil fuel, releasing massive carbon emissions and particulates. Mining also damages land, making coal highly harmful to health and the environment.",
      blurb: "Coal is reliable baseline energy but very polluting.",
      pros: [
        "Provides consistent and steady energy output",
        "Coal reserves are widely distributed around the world",
        "Low cost compared to cleaner energy sources",
        "Infrastructure and technology are well established",
      ],
      cons: [
        "Most polluting fossil fuel in terms of CO₂ emissions",
        "Produces toxic air pollution and smog",
        "Linked to respiratory and heart diseases in humans",
        "Massive contribution to climate change",
      ]
    },
    logging: {
      key: "logging", name: "Deforestation", resourceIncome: 10, planetImpact: 20, sprite: "/game/logging.png",
      description: "Deforestation clears forests for timber and land use, providing short-term gain but destroying carbon sinks, biodiversity, and water cycles. It accelerates climate change and causes permanent ecological damage.",
      blurb: "Cutting forests yields resources short-term but destroys carbon sinks.",
      pros: [
        "Provides quick access to timber and wood products",
        "Cleared land can be used for agriculture or cities",
        "Short-term economic growth for local communities",
        "Immediate availability of building materials",
      ],
      cons: [
        "Destroys natural carbon sinks that absorb CO₂",
        "Massive habitat loss for countless species",
        "Causes biodiversity decline and extinctions",
        "Increases soil erosion and desertification",
      ]
    },
  },
  // Good systems damage less (cannot heal planet), and produce fewer resources
  goodSystems: {
    solar: {
      key: "solar", name: "Solar Farm", buildCost: 300, resourceIncome: 8, planetImpact: 6, populationRequired: 30, sprite: "/game/solar.png",
      description: "Solar farms use photovoltaic panels to turn sunlight into electricity with almost no emissions. They reduce fossil fuel reliance but need land and sunlight. Despite limits, solar is vital for a sustainable energy future.",
      blurb: "Solar generates electricity with low lifecycle emissions.",
      pros: [
        "Very low greenhouse gas emissions during operation",
        "Renewable and abundant energy source",
        "Scalable from small rooftops to large farms",
        "Low operating costs once installed",
      ],
      cons: [
        "Energy generation depends on sunlight (day/night cycle)",
        "Requires significant land space for large farms",
        "Lower energy output compared to fossil fuels",
        "High initial installation cost",
      ]
    },
    wind: {
      key: "wind", name: "Wind Turbine", buildCost: 450, resourceIncome: 12, planetImpact: 4, populationRequired: 35, sprite: "/game/wind.png",
      description: "Wind turbines transform wind into clean electricity without emissions. They complement solar energy but need steady wind, space, and can affect wildlife. Despite challenges, wind is a key renewable power source.",
      blurb: "Wind energy complements solar; together they reduce reliance on fossil fuels.",
      pros: [
        "Produces clean, renewable electricity",
        "No greenhouse gas emissions during use",
        "Complements solar energy production",
        "Low operating and maintenance costs",
      ],
      cons: [
        "Requires consistent wind to be effective",
        "Energy production varies with weather",
        "High upfront installation cost",
        "Large land area needed for farms",
      ]
    },
    sustainableFarm: {
      key: "sustainableFarm", name: "Sustainable Farm", buildCost: 620, resourceIncome: 10, planetImpact: 3, populationRequired: 40, sprite: "/game/farm.png",
      description: "Sustainable farming uses practices like crop rotation, soil care, and reduced chemicals to balance food production with ecosystem health. Though less profitable short term, it preserves fertile land and food security long term.",
      blurb: "Sustainable farming reduces emissions and keeps soil healthy.",
      pros: [
        "Maintains healthy soil for long-term farming",
        "Reduces greenhouse gas emissions",
        "Promotes biodiversity on farmland",
        "Decreases use of harmful pesticides and chemicals",
      ],
      cons: [
        "More expensive to set up and maintain",
        "Lower short-term profits compared to industrial farming",
        "Requires more labor and careful planning",
        "Transition period can reduce yields at first",
      ]
    },
    reforest: {
      key: "reforest", name: "Reforestation", buildCost: 1000, resourceIncome: 2, planetImpact: 0, populationRequired: 60, sprite: "/game/reforest.png",
      description: "Reforestation restores forests by planting trees, capturing carbon, and reviving ecosystems. While not profitable short term, it supports biodiversity, soil stability, and climate health, making it vital for healing nature.",
      blurb: "Replanting forests stabilizes ecosystems; no direct energy income.",
      pros: [
        "Captures and stores carbon dioxide from the atmosphere",
        "Restores natural ecosystems and wildlife habitats",
        "Protects soil from erosion and degradation",
        "Improves air quality for humans and animals",
      ],
      cons: [
        "Very low immediate resource income",
        "High upfront investment cost",
        "Requires many years for forests to mature",
        "Needs long-term maintenance and protection",
      ]
    },
  },
} as const;

export type GameConfig = typeof gameConfig;
