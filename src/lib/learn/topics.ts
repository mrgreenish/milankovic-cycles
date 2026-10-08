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
    eyebrow: "Orbit shape · Stretch",
    title: "How orbit shape changes",
    description:
      "How the shape of Earth’s orbit changes over 100,000 years, why that barely changes yearly sunlight, and why it still matters for the ice ages.",
    answer:
      "Eccentricity measures how far Earth’s orbit is from a circle. It drifts between almost circular and slightly oval, which changes the gap between Earth’s closest and farthest distances from the Sun.",
    period: "Main rhythms near 100,000 and 405,000 years",
    facts: [
      {
        label: "What changes",
        title: "Orbit shape",
        copy: "The ellipse gets a little rounder or a little more stretched.",
      },
      {
        label: "Direct effect",
        title: "The near–far gap",
        copy: "Today Earth is 147.1 million km from the Sun at its closest and 152.1 million km at its farthest. At the most stretched, the gap is 17 million km.",
      },
      {
        label: "Climate role",
        title: "Wobble amplifier",
        copy: "It sets how much the wobble can change seasonal sunlight.",
      },
    ],
    sections: [
      {
        heading: "What eccentricity is",
        paragraphs: [
          "A circle has an eccentricity of 0. Earth’s orbit today is 0.0167, close enough to a circle that a true-to-scale drawing looks round. Over the last 800,000 years it has stayed between about 0.004 and 0.05. The Sun sits at one focus of the ellipse, not at its centre.",
          "As eccentricity grows, Earth’s closest point (perihelion) gets closer and its farthest point (aphelion) gets farther. Sunlight is stronger when Earth is closer, because the same energy spreads over a smaller area. With today’s shape the nearest sunlight is 7% stronger than the farthest. At the most stretched it is 26% stronger.",
        ],
      },
      {
        heading: "A small change with a large side effect",
        paragraphs: [
          "Over a whole year, a more stretched orbit changes the sunlight Earth receives by less than 0.2%. What it changes is the seasonal balance. When the orbit is almost a circle, the wobble hardly matters, because every point is the same distance away. When the orbit is stretched, the wobble can swing midsummer sunlight at 65°N by more than 100 W/m².",
          "The ice record has its strongest rhythm at 100,000 years, which is odd, because the orbit’s direct push at that period is weak. Ice sheets, oceans and carbon dioxide must amplify it. Exactly how is still debated.",
        ],
      },
      {
        heading: "It is not an ice-age switch",
        paragraphs: [
          "No particular eccentricity starts an ice age. The three orbital cycles combine, and then ice, oceans and greenhouse gases amplify or damp the result.",
          "The lab calculates sunlight for a given orbit and adds a rough estimate of ice and temperature. Predicting ice properly needs a climate model on top of that.",
        ],
      },
    ],
    questions: [
      {
        question: "Is Earth’s orbit very elliptical?",
        answer:
          "No. Even at its most stretched it is close to a circle. Drawings exaggerate it so the change can be seen.",
      },
      {
        question: "Does it change the length of the year?",
        answer:
          "No. A year is still one trip around the Sun. Eccentricity changes the near–far gap and Earth’s speed along the orbit, which is higher when Earth is closer.",
      },
    ],
  },
  {
    slug: "obliquity",
    shortTitle: "Obliquity",
    eyebrow: "Axis tilt · Lean",
    title: "How Earth’s tilt changes",
    description:
      "Why Earth’s tilt swings between 22.1° and 24.5° every 41,000 years, and what that does to the strength of the seasons.",
    answer:
      "Obliquity is the tilt of Earth’s axis, measured from the line that stands upright on the orbit’s plane. It swings between about 22.1° and 24.5° in a cycle of 41,000 years. Today it is 23.44° and falling, and the next low comes in about 10,000 years.",
    period: "About 41,000 years",
    facts: [
      {
        label: "What changes",
        title: "Axis tilt",
        copy: "The axis leans between 22.1° and 24.5° from upright.",
      },
      {
        label: "At 65°N",
        title: "Midsummer daylight",
        copy: "The Sun is up 20.1 hours at 22.1° of tilt and 22.4 hours at 24.5°.",
      },
      {
        label: "Climate role",
        title: "Summer melt",
        copy: "Cooler high-latitude summers let more winter snow survive.",
      },
    ],
    sections: [
      {
        heading: "How tilt makes seasons",
        paragraphs: [
          "Seasons come from tilt, not from distance. Earth is closest to the Sun in early January, when it is winter in the north. As Earth goes around, the hemisphere tipped toward the Sun gets longer days and a higher Sun. The other hemisphere gets shorter days and a lower Sun.",
          "A bigger tilt widens that difference. The effect grows with latitude, so the poles feel it most and the tropics hardly at all.",
        ],
      },
      {
        heading: "Why it matters for ice",
        paragraphs: [
          "On a midsummer day at 65°N, the daily average sunlight is 457 W/m² at 22.1° of tilt and 496 W/m² at 24.5°. That is a difference of 39 W/m². With less tilt, northern summers are cooler and more winter snow survives. Repeated for thousands of years, that can build an ice sheet, if the rest of the climate allows it.",
          "The same change also moves sunlight between latitudes. It does not simply warm or cool the whole planet.",
        ],
      },
      {
        heading: "A small angle with a long reach",
        paragraphs: [
          "The whole range is 2.4 degrees. It works the same way for thousands of years, and feedbacks from ice, oceans and carbon dioxide amplify it.",
          "Tilt always has to be read together with the stretch and the wobble. Together they decide where and when sunlight changes most.",
        ],
      },
    ],
    questions: [
      {
        question: "What is Earth’s tilt today?",
        answer:
          "23.44°, the standard J2000 reference value. It is slowly decreasing.",
      },
      {
        question: "Would Earth have seasons without tilt?",
        answer:
          "Only weak ones. Distance would still change the sunlight a little, but both hemispheres would warm and cool together.",
      },
    ],
  },
  {
    slug: "precession",
    shortTitle: "Precession",
    eyebrow: "Axis direction · Wobble",
    title: "How precession shifts the seasons",
    description:
      "How the turning of Earth’s axis and of its orbit moves the seasons around the orbit every 23,000 years or so.",
    answer:
      "Precession changes where on the orbit each season falls. Earth’s axis slowly turns like the axis of a spinning top, and the orbit’s long axis turns too. Together they shift the seasons relative to Earth’s closest and farthest points.",
    period: "Climate rhythms near 19,000 and 23,000 years",
    facts: [
      {
        label: "First turn",
        title: "The axis",
        copy: "It traces a circle in space, like a top’s axis.",
      },
      {
        label: "Second turn",
        title: "The ellipse",
        copy: "Its near point creeps around relative to the stars.",
      },
      {
        label: "Climate role",
        title: "Summer timing",
        copy: "A summer near the Sun is stronger than one far from it.",
      },
    ],
    sections: [
      {
        heading: "Two turns that combine",
        paragraphs: [
          "The axis alone takes about 25,800 years to go once around. The ellipse turns as well, and the two together bring the seasons back to the same place on the orbit about every 21,000 years. The climate record shows peaks near 19,000 and 23,000 years.",
        ],
      },
      {
        heading: "Why timing changes the sunlight",
        paragraphs: [
          "Earth gets more sunlight when it is closer to the Sun. If northern summer falls at the near end of the orbit, midsummer sunlight gets a boost. Half a cycle later it falls at the far end and the boost becomes a penalty.",
          "At today’s orbit, that swap moves midsummer sunlight at 65°N from 478 to about 510 W/m². At the most stretched orbit it moves it by 115 W/m². The two hemispheres swap in opposite directions: when northern summer is near the Sun, southern summer is far from it.",
        ],
      },
      {
        heading: "Why you hear 26,000 and 23,000",
        paragraphs: [
          "About 26,000 years is the axis turning on its own. For climate, what counts is when each season falls relative to the near and far points, and that gives the shorter rhythms.",
          "Both numbers are right once you say which turn you mean.",
        ],
      },
    ],
    questions: [
      {
        question: "Is precession the same as tilt?",
        answer:
          "No. Tilt is the angle of the axis. Precession is the direction the tilted axis points.",
      },
      {
        question: "Does it affect both hemispheres the same way?",
        answer:
          "It affects them in opposite ways. Northern and southern summer fall six months apart, on opposite sides of the orbit.",
      },
    ],
  },
  {
    slug: "65-north-insolation",
    shortTitle: "Sunlight at 65°N",
    eyebrow: "Summer sunlight",
    title: "Why summer sunlight at 65°N matters",
    description:
      "Why scientists use midsummer sunlight at 65°N to study the ice ages, and what the number does and does not tell you.",
    answer:
      "Big ice sheets grew at high northern latitudes, and whether they grew depended on how much winter snow survived the summer. Midsummer sunlight at 65°N is the standard yardstick for that.",
    period: "Daily average at the top of the atmosphere, on the summer solstice",
    facts: [
      {
        label: "Where",
        title: "High northern latitudes",
        copy: "65°N crosses northern Canada, Scandinavia and Siberia, close to the old ice sheets.",
      },
      {
        label: "When",
        title: "Midsummer",
        copy: "Summer sets how much winter snow melts.",
      },
      {
        label: "What it measures",
        title: "Incoming sunlight",
        copy: "Insolation is energy arriving at the top of the atmosphere. It is not a temperature.",
      },
    ],
    sections: [
      {
        heading: "Summer matters more than winter",
        paragraphs: [
          "An ice sheet needs snow, and it needs that snow to last through the summer. A snowy winter followed by a bright summer leaves nothing behind. A cool summer lets snow pile up year after year.",
          "That is why Milanković’s theory looks at the summer energy budget at high northern latitudes. It links the orbit to something that decides whether ice grows: how much snow melts.",
        ],
      },
      {
        heading: "Why 65°N",
        paragraphs: [
          "The 65°N line runs through the zone where the large northern ice sheets grew. It gives one number that is easy to compare across times.",
          "Researchers also use other latitudes, other seasons and sums over the whole summer. The solstice value at 65°N is simple to explain and follows the same rhythms.",
        ],
      },
      {
        heading: "What the number can’t tell you",
        paragraphs: [
          "It is sunlight at the top of the atmosphere. It does not give air temperature, snowfall, ocean currents, greenhouse gases or ice volume. Those depend on the atmosphere, the oceans, the land, and the climate that came before.",
          "A higher number can encourage melting. How much melts depends on all of that.",
        ],
      },
    ],
    questions: [
      {
        question: "What does insolation mean?",
        answer:
          "Incoming solar radiation. It can be given for any latitude and day, at the top of the atmosphere or at the ground. Here it is the daily average at the top of the atmosphere.",
      },
      {
        question: "Why not use the global yearly average?",
        answer:
          "Melting is seasonal and local. The global yearly average hardly changes with the orbit. What changes is how sunlight is shared between seasons and latitudes.",
      },
    ],
  },
  {
    slug: "modern-climate-change",
    shortTitle: "Modern warming",
    eyebrow: "Orbital cycles and today’s climate",
    title: "Do orbital cycles explain modern warming?",
    description:
      "No. The orbit changes over tens of thousands of years. Today’s warming comes mainly from greenhouse gases released by human activity.",
    answer:
      "No. Orbital cycles change sunlight over tens of thousands of years. They cannot explain the speed or the pattern of today’s warming, which comes mainly from greenhouse gases released by human activity.",
    period: "Orbital cycles: tens of thousands of years",
    facts: [
      {
        label: "Timescale",
        title: "Far too slow",
        copy: "The orbit changes noticeably only over thousands of years.",
      },
      {
        label: "Modern cause",
        title: "Greenhouse gases",
        copy: "Burning fossil fuels raises carbon dioxide and other gases that trap heat.",
      },
      {
        label: "Use today",
        title: "Context",
        copy: "The cycles explain the timing of ancient ice ages, not the present trend.",
      },
    ],
    sections: [
      {
        heading: "The timescales don’t match",
        paragraphs: [
          "Eccentricity, tilt and precession change over tens to hundreds of thousands of years. Warming since the 1800s is far too fast to come from them.",
        ],
      },
      {
        heading: "Two different mechanisms",
        paragraphs: [
          "Orbital cycles move sunlight between seasons and latitudes. They do not make a quick, lasting rise in heat-trapping gases. Burning fossil fuels does, and it slows how fast Earth sheds heat to space.",
          "Scientists tell the two apart by timing, by where and when the warming happens, and by direct measurements of Earth’s energy balance.",
        ],
      },
      {
        heading: "Why the old climate still matters",
        paragraphs: [
          "Ice-age records show how ice, oceans and carbon dioxide can amplify a small change in sunlight. That helps scientists work out how sensitive the climate is.",
          "The orbit helped set the timing of the ice ages. The main driver of today’s warming is human-made greenhouse gas.",
        ],
      },
    ],
    questions: [
      {
        question: "Are the cycles still running?",
        answer:
          "Yes. The orbit keeps changing, but its slow changes today do not explain the rapid warming.",
      },
      {
        question: "Can natural and human causes both exist?",
        answer:
          "Yes. Climate has natural drivers on many timescales. Several independent lines of evidence attribute today’s warming mainly to human greenhouse-gas emissions.",
      },
    ],
  },
];

export const TOPIC_BY_SLUG = Object.fromEntries(
  LEARN_TOPICS.map((topic) => [topic.slug, topic]),
) as Record<string, LearnTopic>;
