export type TopicSection = {
  heading: string;
  paragraphs: string[];
};

export type LearnTopic = {
  slug: string;
  shortTitle: string;
  eyebrow: string;
  title: string;
  description: string;
  answer: string;
  period: string;
  facts: Array<{ label: string; title: string; copy: string }>;
  sections: TopicSection[];
  questions: Array<{ question: string; answer: string }>;
};

export const LEARN_TOPICS: LearnTopic[] = [
  {
    slug: "eccentricity",
    shortTitle: "Eccentricity",
    eyebrow: "Orbit Shape · The Stretch",
    title: "Earth’s Eccentricity Cycle, Explained",
    description:
      "Learn how Earth’s orbital eccentricity changes orbit shape, modulates precession, and contributes to the pacing of ice ages.",
    answer:
      "Eccentricity describes how much Earth’s orbit departs from a circle. The orbit slowly shifts between nearly circular and slightly more elliptical shapes, changing the contrast between Earth’s closest and farthest distances from the Sun.",
    period: "Dominant pacing near 100,000 years",
    facts: [
      { label: "What changes", title: "Orbit shape", copy: "The ellipse becomes slightly rounder or more stretched." },
      { label: "Direct effect", title: "Distance contrast", copy: "The difference between perihelion and aphelion grows with eccentricity." },
      { label: "Climate role", title: "Precession amplifier", copy: "Eccentricity strengthens or weakens the seasonal effect of precession." },
    ],
    sections: [
      {
        heading: "What eccentricity means",
        paragraphs: [
          "A perfect circle has an eccentricity of 0. Earth’s present orbit is only mildly elliptical, so popular diagrams usually exaggerate its shape. The Sun sits at one focus of the ellipse rather than at its center.",
          "As eccentricity increases, the difference between perihelion—the closest point to the Sun—and aphelion—the farthest point—also increases. Sunlight is more intense at the closer distance because the same solar energy is spread across a smaller area.",
        ],
      },
      {
        heading: "Why the roughly 100,000-year cycle matters",
        paragraphs: [
          "Earth’s eccentricity contains several astronomical rhythms, including prominent pacing near 100,000 years and a longer, stable component near 405,000 years. The familiar 100,000-year label is therefore a useful shorthand, not a single perfect clock.",
          "Eccentricity has only a small effect on total annual sunlight received by the whole planet. Its important seasonal role is to modulate precession: when the orbit is more eccentric, having a season near perihelion or aphelion makes a larger difference.",
        ],
      },
      {
        heading: "Eccentricity is not an ice-age switch",
        paragraphs: [
          "Ice ages do not begin whenever eccentricity reaches one particular value. Orbit shape, axial tilt, and precession combine to redistribute sunlight by latitude and season. Ice sheets, oceans, greenhouse gases, vegetation, dust, and the climate system’s long memory then amplify and reshape that orbital pacing.",
          "Use the Orbital Lab to compare real astronomical states while keeping that distinction clear: orbital geometry changes summer-melt pressure, but it does not by itself calculate temperature or ice-sheet size.",
        ],
      },
    ],
    questions: [
      { question: "Is Earth’s orbit highly elliptical?", answer: "No. Earth’s orbit is close to circular, even when eccentricity is relatively high. Visual explanations often exaggerate the ellipse so the change can be seen." },
      { question: "Does eccentricity change the length of the year?", answer: "The year remains one orbit around the Sun. Eccentricity changes Earth’s speed along that orbit and the distance contrast between perihelion and aphelion." },
    ],
  },
  {
    slug: "obliquity",
    shortTitle: "Obliquity",
    eyebrow: "Axis Tilt · The Lean",
    title: "Earth’s Obliquity Cycle, Explained",
    description:
      "Understand Earth’s 41,000-year obliquity cycle, how axial tilt changes the strength of seasons, and why high latitudes respond strongly.",
    answer:
      "Obliquity is the angle of Earth’s rotational axis relative to its orbital plane. It varies between about 22.1° and 24.5°, mainly over a cycle of roughly 41,000 years.",
    period: "About 41,000 years",
    facts: [
      { label: "What changes", title: "Axis tilt", copy: "Earth leans a little more or less relative to its orbit." },
      { label: "Seasonal effect", title: "Season strength", copy: "Greater tilt intensifies summers and winters, especially toward the poles." },
      { label: "Climate role", title: "Summer melt", copy: "High-latitude summer sunlight influences how much winter snow survives." },
    ],
    sections: [
      {
        heading: "How tilt creates seasons",
        paragraphs: [
          "Earth’s seasons are caused by axial tilt, not by the planet’s distance from the Sun. As Earth travels around its orbit, the hemisphere tilted toward the Sun receives longer days and more direct sunlight, while the other hemisphere receives shorter days and less direct sunlight.",
          "Obliquity changes the size of that tilt. A larger angle increases the seasonal contrast; a smaller angle makes seasons milder. The effect grows with latitude, so polar and subpolar regions respond more strongly than the tropics.",
        ],
      },
      {
        heading: "Why obliquity matters for ice sheets",
        paragraphs: [
          "Large Northern Hemisphere ice sheets grew at high latitudes. When northern summers are cool enough, more winter snow can survive the melt season. Repeated over many years, that surviving snow can contribute to ice-sheet growth if the rest of the climate system also supports it.",
          "Lower obliquity tends to reduce high-latitude summer sunlight, while higher obliquity tends to increase it. The same tilt change also redistributes sunlight between latitudes and seasons rather than simply warming or cooling the entire planet equally.",
        ],
      },
      {
        heading: "A small angle with a large context",
        paragraphs: [
          "The full obliquity range is only about 2.4 degrees, yet it acts persistently over thousands of years. Climate feedbacks involving ice reflectivity, oceans, carbon dioxide, and snowfall can make the eventual response much larger than the original astronomical nudge.",
          "Obliquity must still be read together with eccentricity and precession. The combined orbital state determines where and when sunlight changes most strongly.",
        ],
      },
    ],
    questions: [
      { question: "What is Earth’s current axial tilt?", answer: "The standard J2000 astronomical reference is about 23.44°. The angle changes slowly within the longer obliquity cycle." },
      { question: "Would Earth have seasons without tilt?", answer: "Distance from the Sun would still vary slightly, but the familiar hemispheric seasons are primarily a consequence of axial tilt." },
    ],
  },
  {
    slug: "precession",
    shortTitle: "Precession",
    eyebrow: "Axis Direction · The Wobble",
    title: "Earth’s Precession Cycle, Explained",
    description:
      "Learn how axial and orbital precession shift the timing of seasons relative to perihelion, producing climatic cycles near 19,000 and 23,000 years.",
    answer:
      "Precession changes the direction Earth’s axis points and, together with the slow rotation of the orbital ellipse, changes which season occurs when Earth is closest to or farthest from the Sun.",
    period: "Climate components near 19,000 and 23,000 years",
    facts: [
      { label: "What changes", title: "Axis direction", copy: "The tilted axis slowly traces a circle, like a spinning top." },
      { label: "Orbital partner", title: "The ellipse rotates", copy: "Perihelion also shifts relative to the seasons." },
      { label: "Climate role", title: "Season timing", copy: "A summer near perihelion is more intense than one near aphelion." },
    ],
    sections: [
      {
        heading: "Two motions combine",
        paragraphs: [
          "Axial precession is the slow change in the direction of Earth’s rotational axis. The axis keeps roughly the same tilt over a short interval but points toward different stars as it traces a broad circle over about 25,772 years.",
          "At the same time, the orientation of Earth’s elliptical orbit also rotates. Climate responds to the combination: the changing alignment between the solstices and perihelion. That combined signal contains important components near 19,000 and 23,000 years.",
        ],
      },
      {
        heading: "Why timing changes seasonal intensity",
        paragraphs: [
          "Earth receives more intense sunlight when it is closer to the Sun. If Northern Hemisphere summer occurs near perihelion, northern summers receive a stronger distance boost. Roughly half a precession cycle later, northern summer occurs nearer aphelion and that boost is weaker.",
          "The hemispheres respond in opposite seasonal directions: when precession strengthens summer distance effects in one hemisphere, it weakens them in the other. The outcome also depends on obliquity and on how eccentric the orbit is at the time.",
        ],
      },
      {
        heading: "Why some sources say 26,000 years",
        paragraphs: [
          "The often-quoted 26,000-year figure refers approximately to axial precession by itself. Milanković climate discussions usually focus on climatic precession, which includes the rotating orbital ellipse and therefore has different dominant periods.",
          "Both descriptions can be correct when they name the motion they mean. For climate, the useful question is not only where the axis points, but when each season occurs relative to Earth’s changing distance from the Sun.",
        ],
      },
    ],
    questions: [
      { question: "Is precession the same as obliquity?", answer: "No. Obliquity changes the angle of Earth’s tilt. Precession changes the direction that the tilted axis points." },
      { question: "Does precession change both hemispheres equally?", answer: "It changes the timing for both, but their seasonal effects are opposite because northern and southern summer occur six months apart." },
    ],
  },
  {
    slug: "65-north-insolation",
    shortTitle: "65°N Insolation",
    eyebrow: "The Classic Ice-Sheet Indicator",
    title: "Why Summer Insolation at 65° North Matters",
    description:
      "Discover why scientists use Northern Hemisphere summer insolation near 65°N to study orbital pacing, snow survival, and ice-age cycles.",
    answer:
      "Summer insolation at 65° North is a classic orbital indicator because large Northern Hemisphere ice sheets grew at high latitudes, where cool summers can allow some winter snow to survive instead of melting completely.",
    period: "A seasonal and latitudinal signal—not global temperature",
    facts: [
      { label: "Where", title: "High northern latitudes", copy: "The band crosses regions associated with former continental ice sheets." },
      { label: "When", title: "Northern summer", copy: "Summer energy helps determine how much winter snow melts." },
      { label: "What it measures", title: "Top-of-atmosphere sunlight", copy: "Insolation is incoming solar energy, not surface temperature." },
    ],
    sections: [
      {
        heading: "Why summer can matter more than winter",
        paragraphs: [
          "Ice-sheet growth requires snowfall, but it also requires some of that snow to survive the following summer. A very cold winter can add snow and still be followed by a bright summer that melts it. A cooler summer gives winter snow a better chance to persist.",
          "This is why Milanković’s framework emphasized the summer energy budget at high northern latitudes. It connects orbital geometry to a physically meaningful part of the ice-sheet balance: seasonal melt pressure.",
        ],
      },
      {
        heading: "Why 65° North became the reference latitude",
        paragraphs: [
          "Sixty-five degrees north passes through the high-latitude zone where major Northern Hemisphere ice sheets developed across North America and Eurasia. It is a representative astronomical benchmark, not a magical boundary where climate behaves differently on either side.",
          "Researchers may examine different latitudes, seasons, or integrated summer-energy measures depending on the question. The 65°N summer-solstice value remains especially useful for explanation because it makes the orbital mechanism concrete and comparable.",
        ],
      },
      {
        heading: "What the number cannot tell you",
        paragraphs: [
          "Top-of-atmosphere insolation does not directly predict local air temperature, snowfall, ocean circulation, greenhouse-gas concentration, or ice volume. Those depend on the atmosphere, surface, oceans, geography, and the climate state inherited from earlier centuries and millennia.",
          "The Orbital Lab therefore presents the 65°N calculation as an orbital tendency. It is a transparent way to compare astronomical configurations—not a complete climate or ice-sheet forecast.",
        ],
      },
    ],
    questions: [
      { question: "What does insolation mean?", answer: "Insolation means incoming solar radiation. It can be specified by latitude, season, time of day, and whether it is measured at the top of the atmosphere or at the surface." },
      { question: "Why not use global annual sunlight?", answer: "Ice-sheet melt is strongly seasonal and regional. Global annual averages can hide large redistributions of sunlight between seasons and latitudes." },
    ],
  },
  {
    slug: "modern-climate-change",
    shortTitle: "Modern Warming",
    eyebrow: "A Crucial Distinction",
    title: "Do Milanković Cycles Cause Modern Climate Change?",
    description:
      "No: Milanković cycles unfold over tens of thousands of years and do not explain today’s rapid warming, which is driven primarily by human greenhouse-gas emissions.",
    answer:
      "No. Milanković cycles pace long-term changes in the seasonal and geographic distribution of sunlight, but they cannot explain the speed or pattern of modern global warming. Today’s rapid warming is driven primarily by human greenhouse-gas emissions.",
    period: "Orbital cycles: tens of thousands of years",
    facts: [
      { label: "Timescale", title: "Far too slow", copy: "Orbital geometry changes gradually across many millennia." },
      { label: "Modern driver", title: "Greenhouse gases", copy: "Human emissions strengthen Earth’s heat-trapping greenhouse effect." },
      { label: "Scientific use", title: "Context, not explanation", copy: "Orbital cycles explain ancient pacing, not the present rapid trend." },
    ],
    sections: [
      {
        heading: "The timescales do not match",
        paragraphs: [
          "Eccentricity, obliquity, and precession evolve over periods measured in tens to hundreds of thousands of years. Their climate influence appears as slow changes in where and when sunlight arrives, especially across seasons and latitudes.",
          "Modern warming has developed far too quickly to be caused by a small change in those orbital cycles. A mechanism that changes gradually across millennia cannot account for the observed rapid rise in global temperature over the industrial era.",
        ],
      },
      {
        heading: "Orbital sunlight and greenhouse warming are different mechanisms",
        paragraphs: [
          "Milanković cycles redistribute incoming solar energy. They do not produce a rapid, sustained increase in heat-trapping gases throughout the atmosphere. Human activities—especially burning fossil fuels—raise concentrations of carbon dioxide and other greenhouse gases, reducing the rate at which Earth loses heat to space.",
          "Scientists can distinguish these mechanisms by their timing, physical fingerprints, and measured energy effects. Studying orbital climate change strengthens rather than weakens the case for human-caused modern warming because it shows how carefully different causes can be tested.",
        ],
      },
      {
        heading: "Why ancient climate still matters",
        paragraphs: [
          "Ice-age records reveal that the climate system can amplify a relatively small orbital nudge through ice, ocean, and carbon-cycle feedbacks. That history helps scientists understand climate sensitivity and the long memory of oceans and ice sheets.",
          "But an amplifier is not the same as the initial cause. In glacial cycles, orbital redistribution provides the pacing. In the modern era, the dominant new forcing is the human-driven rise in greenhouse gases.",
        ],
      },
    ],
    questions: [
      { question: "Are Milanković cycles still operating today?", answer: "Yes. The orbital motions continue, but their present slow changes do not explain the rapid modern warming trend." },
      { question: "Can natural climate change and human-caused climate change both be real?", answer: "Yes. Climate has natural drivers on many timescales, and modern warming can be attributed primarily to human greenhouse-gas emissions using multiple independent lines of evidence." },
    ],
  },
];

export const TOPIC_BY_SLUG = Object.fromEntries(
  LEARN_TOPICS.map((topic) => [topic.slug, topic]),
) as Record<string, LearnTopic>;
