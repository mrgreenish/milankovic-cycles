/**
 * Page copy for the English site. Translations must keep this exact shape
 * (see `Content`). Short interface text lives in `../ui`.
 *
 * Two small conventions keep the strings plain: `*word*` marks emphasis and
 * `{name}` marks a spot where a link or other element is placed.
 */
export const en = {
  site: {
    name: "Milanković Cycles",
    title: "Milanković Cycles — Why ice ages come and go",
    template: "%s · Milanković Cycles",
    description:
      "Three slow changes in Earth’s orbit shift summer sunlight in the far north and have paced the ice ages. A 3D tour and a lab to try it yourself.",
    ogDescription:
      "Stretch the orbit, lean the axis, wobble it, and watch midsummer sunlight at 65°N change.",
    portraitAlt: "Portrait of Milutin Milanković",
  },
  home: {
    hero: {
      eyebrow: "Milanković cycles",
      title: "Why do ice ages come and go?",
      summary:
        "Three slow changes in Earth’s orbit set the rhythm. They shift how much sunlight reaches the far north each summer, and that has been enough to build ice sheets kilometres thick and melt them again.",
      signatureName: "By Filip van Harreveld",
      signatureNote: "Great-grandson of Milutin Milanković",
    },
    idea: {
      eyebrow: "01 · The idea",
      title: "Summer decides whether ice grows",
      lede: "Snow falls every winter in the far north. Whether it turns into ice depends on how much of it survives the summer.",
      steps: [
        {
          title: "The orbit shifts slowly",
          body: "Earth’s distance, tilt and season timing change over tens of thousands of years.",
        },
        {
          title: "Summer sunlight at 65°N changes",
          body: "That latitude crosses northern Canada, Scandinavia and Siberia, where the big ice sheets grew.",
        },
        {
          title: "Ice and carbon dioxide add to it",
          body: "White ice reflects sunlight and CO₂ levels fall, so a small push becomes a large one.",
        },
      ],
      deeper: [
        "The number in the corner is the daily average sunlight at the top of the atmosphere on the summer solstice at 65°N. Scientists call incoming solar energy *insolation*. It is the usual yardstick for ice because melting in summer is what limits an ice sheet.",
        "The ice on the globe is drawn by hand to follow the measured record. It shows how much ice there was, not its exact outline.",
      ],
    },
    goDeeper: "Go deeper",
    whatItDoes: "What it does",
    cycles: [
      {
        title: "Stretch the orbit",
        intro:
          "Earth’s orbit is almost a circle. Over about 100,000 years it stretches a little, then relaxes. Drag the scene or move the slider.",
        effect: [
          "A stretched orbit puts Earth closer to the Sun at one time of year than at another. Today the gap is 5 million km. At the most stretched it is 17 million km, and the nearest sunlight is 26% stronger than the farthest.",
          "On its own, a stretched orbit hardly changes the sunlight Earth gets over a whole year (under 0.2%). What it does is give the wobble something to work with.",
        ],
        deeper: [
          "The Sun sits at one focus of the ellipse, not at its centre. The scene draws the stretch five times larger than it is, because the real orbit would look like a circle. Choose “True shape” under the scene to see it as it is.",
          "Eccentricity has more than one rhythm. The record shows strong pacing near 100,000 and 405,000 years, so “100,000 years” is a handy label, not an exact clock.",
        ],
      },
      {
        title: "Lean the axis",
        intro:
          "Earth’s axis leans 23.4° from upright. Over 41,000 years it swings between 22.1° and 24.5°. More lean means stronger seasons, most of all near the poles.",
        effect: [
          "At 22.1° the Sun stays up 20.1 hours on a midsummer day at 65°N. At 24.5° it stays up 22.4 hours and climbs higher. That is 457 W/m² against 496 W/m².",
          "Less lean gives cooler northern summers, and cool summers are when snow survives.",
        ],
        deeper: [
          "Tilt, not distance, makes the seasons. Earth is closest to the Sun in early January, when it is winter in the north.",
          "The dashed grey line in the scene is today’s tilt. The angle is measured from the line that stands upright on the orbit’s plane.",
        ],
      },
      {
        title: "Wobble the axis",
        intro:
          "Earth’s axis slowly turns, like the axis of a spinning top. The orbit turns too. Together they move the seasons around the orbit. Drag to turn the axis.",
        effect: [
          "Today northern summer falls on the far side of the orbit. In about 11,000 years it falls on the near side, and midsummer sunlight at 65°N rises from 478 to about 510 W/m².",
          "That swap matters more when the orbit is stretched. At the most stretched orbit it changes midsummer sunlight by 115 W/m².",
        ],
        deeper: [
          "The axis alone takes about 25,800 years to turn once. The ellipse turns as well, so the seasons meet the orbit’s near point again after about 21,000 years on average. The climate record has peaks near 19,000 and 23,000 years.",
          "The two hemispheres pull in opposite directions. When northern summer is near the Sun, southern summer is far from it.",
        ],
      },
    ],
    together: {
      eyebrow: "05 · Putting it together",
      title: "Run the clock",
      lede: "All three motions now run at once, using the orbit calculated by Jacques Laskar’s team (La2004). Press play and 800,000 years pass in about a minute. The measured ice record is the bottom line.",
      lookFor: "What to look for",
      lookForBody:
        "The ice line follows the sunlight line, but later. Ice builds slowly over tens of thousands of years and goes fast, in around ten thousand.",
      note: "Milutin Milanković worked this out by hand over about thirty years and published it in 1941. Nobody could check it until 1976, when seabed sediment showed the same rhythms. He had died 18 years earlier.",
      deeper: [
        "The strongest rhythm in the ice record is 100,000 years, yet the orbit’s direct push at that period is weak. The ice sheets, oceans and carbon dioxide must be amplifying it, and how exactly is still debated.",
        "Past 0 on the clock the orbit keeps going and the ice line stops: nothing here predicts future ice. For the next 50,000 years the orbit is unusually calm, and midsummer sunlight at 65°N stays between 475 and 503 W/m².",
      ],
    },
    recap: {
      eyebrow: "06 · Recap",
      title: "The short version",
      items: [
        {
          lead: "Stretch",
          body: "sets how far apart Earth’s near and far points are, and so how much the wobble can matter.",
        },
        {
          lead: "Lean",
          body: "gives high-latitude summers more sun when it grows and less when it shrinks.",
        },
        {
          lead: "Wobble",
          body: "decides whether northern summer falls near the Sun or far from it.",
        },
      ],
      lede: "Together they swing midsummer sunlight at 65°N between 431 and 552 W/m². Ice answers slowly: it takes tens of thousands of years to build and about ten thousand to melt.",
      warmingTitle: "What about today’s warming?",
      warmingBody:
        "The orbit changes far too slowly to matter in a human lifetime. Today’s warming comes mainly from greenhouse gases released by human activity.",
      warmingLink: "Read the explanation →",
      ctaEyebrow: "Your turn",
      ctaTitle: "Take your settings to the lab",
      ctaButton: "Continue in the lab",
    },
    topics: {
      eyebrow: "Guides",
      title: "Read more",
      body: "One guide for each motion, one on why 65°N is the yardstick, and one on today’s warming.",
      nav: "Milanković cycle topic guides",
    },
  },
  about: {
    meta: {
      title: "Why I built this",
      description:
        "Filip van Harreveld on his great-grandfather Milutin Milanković, and why he built a 3D way to explore his work.",
    },
    portraitCaption: "Milutin Milanković · 1879–1958",
    eyebrow: "My great-grandfather’s work",
    title: "Why I built this",
    lede: "Milutin Milanković was my great-grandfather. I built this site so people can see what he spent decades calculating: how small changes in Earth’s orbit shift the sunlight reaching the far north, and how that paced the ice ages.",
    paragraphs: [
      "He did the work by hand, with pen and paper, working out the sunlight at every latitude through the seasons. He published the full theory in 1941. It stayed disputed for decades. In 1976, seabed sediment showed the same rhythms he had calculated. He had died in 1958.",
      "I work in design and software. This is how I wanted to explain his work: you stretch the orbit, lean the axis and wobble it yourself, and watch what happens to summer sunlight at 65°N.",
    ],
    signatureName: "Filip van Harreveld",
    signatureRole: "Creative developer · Great-grandson of Milutin Milanković",
    projectEyebrow: "About the project",
    projectTitle: "How it works",
    projectParagraphs: [
      "The tour introduces the three motions one at a time and then runs them together over 800,000 years. The lab lets you set them yourself, or jump to dates from the La2004 orbit solution. It calculates sunlight at 65°N and adds a rough estimate of ice and global temperature. The estimate is not a forecast.",
      "The scene draws the orbit’s shape five times too stretched by default, because the real orbit looks like a circle at screen size. Every calculation uses the true values.",
    ],
    startTour: "Start the tour",
    readMethod: "Read the method",
    contactEyebrow: "Corrections",
    contactTitle: "Found a mistake?",
    contactBody:
      "If you spot an error, know a better source, or want to talk about the project, write to me through {link}.",
  },
  faq: {
    meta: {
      title: "Frequently asked questions",
      description:
        "Answers about Milanković cycles, the ice ages, 65°N and modern warming.",
    },
    eyebrow: "FAQ",
    title: "Frequently asked questions",
    lede: "The short version is in the tour. These are the questions people ask next.",
    listLabel: "Milanković cycle questions",
    endText: "Try it yourself.",
    endButton: "Back to the tour",
    questions: [
      {
        id: "what-are-milankovic-cycles",
        question: "What are Milanković cycles?",
        answer:
          "Slow, regular changes in the shape of Earth’s orbit, the tilt of its axis and the direction the axis points. Over tens of thousands of years they change how much sunlight reaches each latitude in each season.",
      },
      {
        id: "why-65-north",
        question: "Why 65° North?",
        answer:
          "Big ice sheets grew at high northern latitudes. If summer there is cool enough, winter snow survives and piles up year after year. Midsummer sunlight at 65°N is the usual yardstick for that.",
      },
      {
        id: "does-eccentricity-cause-ice-ages",
        question: "Does the 100,000-year cycle cause ice ages by itself?",
        answer:
          "No. Eccentricity hardly changes the sunlight Earth gets over a year. Mainly it sets how much the wobble matters. The 100,000-year rhythm in the ice record comes from the whole climate system, with its ice sheets, oceans and carbon dioxide, responding to all three cycles. Exactly how is still debated.",
      },
      {
        id: "precession-period",
        question: "Is precession 26,000 or 23,000 years?",
        answer:
          "The axis alone takes about 25,800 years to turn once. The orbit’s ellipse turns too, so the seasons return to the same place on the orbit about every 21,000 years. The climate record shows peaks near 19,000 and 23,000 years.",
      },
      {
        id: "is-the-orbit-to-scale",
        question: "Is the scene to scale?",
        answer:
          "No. The orbit’s shape is drawn five times too stretched by default, because the real orbit looks like a circle at screen size. Choose “True shape” to see it as it is. Earth, the Sun and their distances are not to scale either. Calculations always use the real values.",
      },
      {
        id: "where-does-the-history-come-from",
        question: "Where does the 800,000-year history come from?",
        answer:
          "The orbit comes from the La2004 solution by Jacques Laskar and colleagues, sampled every 1,000 years. The ice line is the LR04 stack of 57 seabed sediment records (Lisiecki and Raymo, 2005), which tracks ice volume through the oxygen isotopes in tiny fossils.",
      },
      {
        id: "is-the-ice-real",
        question: "Is the ice on the globe real?",
        answer:
          "It is an illustration. The amount of ice follows the measured record, but the outline is drawn by hand to resemble the last ice age. Use it for scale, not for geography.",
      },
      {
        id: "is-this-a-climate-prediction",
        question: "Does the lab predict temperature or future ice sheets?",
        answer:
          "No, but it gives a rough estimate. At a past date it shows the measured ice record and the temperature that goes with it. For an orbit you set by hand it asks what would happen if that orbit lasted about 15,000 years, using the link between sunlight and ice over the last 800,000 years. It leaves out carbon dioxide, oceans and the ice already there, and it is not a forecast.",
      },
      {
        id: "how-is-temperature-estimated",
        question: "How does the lab get a temperature?",
        answer:
          "From ice. In the sea-floor record, ice and global temperature move together, and the last ice age was about 6.1 °C colder than before industry. The lab scales the ice share to that figure. It is the orbit’s share only, and it does not include today’s warming, which is about 1.2 °C above that baseline.",
      },
      {
        id: "modern-warming",
        question: "Do Milanković cycles explain modern climate change?",
        answer:
          "No. The orbit changes over tens of thousands of years and cannot explain the speed or pattern of today’s warming. That comes mainly from greenhouse gases released by human activity.",
      },
    ],
  },
  educators: {
    meta: {
      title: "For educators and publishers",
      description:
        "Classroom experiments, background reading and citation details for teaching Milanković cycles.",
    },
    eyebrow: "For educators",
    title: "Teach the cycles by changing them",
    lede: "Ask learners to predict, move a slider, then explain what happened. The tour and the lab are free to use in lessons on seasons, sunlight and ice ages.",
    startTour: "Start the tour",
    reviewSources: "Review the sources",
    experimentEyebrow: "A first experiment",
    experimentTitle: "Predict, then test",
    experiment: [
      "Start with today’s settings. Ask whether a bigger tilt gives 65°N more or less sunlight in summer, then try both tilt buttons and write down the numbers. Discuss why: longer days and a higher Sun.",
      "Next, keep the tilt fixed and change where summer falls on the orbit, so learners isolate the effect of distance. Copy a link for each setup to share it. Remind them that the number is sunlight, and that ice also depends on oceans and greenhouse gases.",
      "Then press play on the clock in the lab. Ask learners to compare the sunlight curve with the ice line and describe the delay.",
    ],
    useEyebrow: "In the classroom",
    useTitle: "Ways to use it",
    uses: [
      {
        title: "Introduce the topic",
        body: "Run the tour before students compare the three motions.",
        link: "Open the tour →",
      },
      {
        title: "Investigate",
        body: "Let learners change real orbital values, or travel in time, and discuss what the 65°N number does and does not show.",
        link: "Open the lab →",
      },
      {
        title: "Read further",
        body: "Assign one guide: orbit shape, tilt, precession, the 65°N yardstick or modern warming.",
        link: "Browse the guides →",
      },
      {
        title: "Check the method",
        body: "Every figure comes with its equations, data sources and limits.",
        link: "Read the method →",
      },
    ],
    citationEyebrow: "Citation",
    citationTitle: "How to cite",
    citationTitleOfWork: "Milanković Cycles: Why Ice Ages Come and Go.",
    citationNote:
      "Links to a single guide are welcome when it fits your lesson, article, newsletter or reading list better.",
    contactEyebrow: "Contact",
    contactTitle: "Questions or feedback?",
    contactBody:
      "For questions about using the project, corrections or interviews, write to Filip through {link}.",
  },
  learn: {
    meta: {
      title: "Learn the Milanković Cycles",
      description:
        "How orbit shape, tilt and precession change summer sunlight, why that paced the ice ages, and why it does not explain modern warming.",
    },
    eyebrow: "Guides",
    title: "How the cycles work",
    lede: "One guide for each motion, one on why northern summers decide whether ice grows, and one on how the cycles differ from today’s warming.",
    gridEyebrow: "Five guides",
    gridTitle: "What would you like to know?",
    authorLine: "By {link}, great-grandson of Milutin Milanković.",
    authorName: "Filip van Harreveld",
    educatorsLink: "Teaching ideas and how to cite →",
  },
  topicPage: {
    breadcrumb: "Breadcrumb",
    home: "Home",
    learn: "Learn",
    factsLabel: "Key facts",
    actionEyebrow: "Try it yourself",
    actionTitle: "Change the orbit",
    actionBody:
      "Move all three motions and watch midsummer sunlight at 65°N change.",
    actionButton: "Open the lab",
    faqEyebrow: "Questions",
    faqTitle: "Quick answers",
    authorLabel: "About the author",
    sourcesLink: "Sources and method →",
    relatedEyebrow: "Read next",
    relatedTitle: "More guides",
  },
  lab: {
    meta: {
      title: "Orbital lab",
      description:
        "Change Earth’s orbit, tilt and wobble, or travel back 800,000 years, and compare midsummer sunlight at 65°N.",
    },
  },
  sources: {
    meta: {
      title: "Sources and method",
      description:
        "Where the orbit and ice data come from, the equations behind the sunlight number, and what the lab cannot tell you.",
    },
    eyebrow: "Data and calculations",
    title: "Sources and method",
    lede: "The tour and the lab calculate sunlight at 65°N on the summer solstice. This page lists the equations, the data and the limits behind that number.",
    calcEyebrow: "What is calculated",
    calcTitle: "Midsummer sunlight at 65°N",
    calcParagraphs: [
      "The number is the daily mean of incoming solar radiation at 65°N on the northern summer solstice, at the top of the atmosphere. It is not sunlight at the ground, a temperature, or an ice-sheet size. The lab’s temperature and ice estimates are a separate, rougher step, described below.",
      "The calculation uses a total solar irradiance of 1361 W/m² and the standard daily insolation geometry from Berger's astronomical formulation.",
    ],
    equationsEyebrow: "Calculation",
    equationsTitle: "From orbit to daily insolation",
    equationsNote:
      "φ is latitude, ε is obliquity, λ is solar longitude, ρ is the Earth–Sun distance in astronomical units, and H₀ is the half day length, which also covers polar day and night. λₚ is the Sun’s longitude at perihelion, 180° from the perihelion longitude the sliders show.",
    momentsEyebrow: "Four moments",
    momentsTitle: "Orbital values from La2004",
    momentsNote: "Epochs are relative to J2000.",
    tableLabel:
      "Orbital reference values, scroll horizontally to see all columns",
    columns: {
      preset: "Preset",
      time: "Time",
      eccentricity: "Eccentricity",
      obliquity: "Obliquity",
      perihelion: "Perihelion",
      sunlight: "65°N Q",
    },
    kyr: "kyr",
    clockEyebrow: "The clock",
    clockTitle: "800,000 years of orbit and ice",
    clockParagraphs: [
      "The orbit on the clock is the nominal La2004 solution of Laskar and colleagues, read at every 1,000 years from 800,000 years ago to 100,000 years ahead, with linear steps in between. The four moments above are exact nodes of the same data.",
      "The ice line is the LR04 stack of 57 benthic oxygen-isotope records (Lisiecki and Raymo, 2005), which follows global ice volume. The scale runs from 0% at today’s value to 100% at its highest point in the last 30,000 years. Beyond 600,000 years the stack is sampled every 2,000 years and the gaps are filled in linearly. The line stops at today because nothing here predicts future ice.",
      "The ice drawn on the globe is an illustration. Its size follows the ice line, and its outline is drawn by hand after the last glacial maximum. Earth’s surface comes from NASA Earth Observatory imagery: Blue Marble, Black Marble and GEBCO terrain.",
    ],
    tempEyebrow: "Temperature and ice",
    tempTitle: "A rough estimate, in two parts",
    tempParagraphs: [
      "At a date on the clock, ice is the measured LR04 value. Ice and global temperature move together, and the last glacial maximum was about 6.1 °C colder than before industry (Tierney et al., 2020), so temperature is minus 6.1 °C times the ice share. A figure near 14 °C is used for the average temperature before industry.",
      "For an orbit set by hand, the lab asks what would settle if it lasted. Fitted to the last 800,000 years, ice follows 65°N summer sunlight smoothed over about 15,000 years, at 0.018 of the ice-age peak for every W/m² of sunlight lost (correlation about −0.46). On the warm side the response flattens, because there is little ice left to melt. The fit is checked against the data in the project’s tests.",
      "Carbon dioxide, oceans and the ice already in place are left out, so the estimate can differ a lot from a real date: with a hand-set orbit, 21,000 years ago shows far less ice than the record, because the record built up over many earlier summers. Today’s real temperature is about 1.2 °C above the baseline because of greenhouse gases.",
    ],
    limitsEyebrow: "Limits",
    limitsTitle: "Sunlight alone does not predict climate",
    limitsParagraphs: [
      "The lab calls sunlight within ±5 W/m² of the J2000 reference “close to today’s level”. That range is a wording choice, not a physical threshold.",
      "Existing ice, snowfall, oceans, greenhouse gases, vegetation, dust, geography and long response times decide what the climate does. The +50,000-year moment is orbital geometry, not a climate forecast.",
    ],
    referencesEyebrow: "Primary references",
    referencesTitle: "Read the sources",
    endText: "Try the calculation with your own settings.",
    endButton: "Open the lab",
  },
};

export type Content = typeof en;
