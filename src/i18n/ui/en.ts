/**
 * Interface text for the English site. The other languages must follow this
 * shape exactly (see `Ui`). Longer page copy lives in `../content`.
 */
export const en = {
  decimal: ".",
  nav: {
    tour: "Tour",
    learn: "Learn",
    lab: "Lab",
    about: "About",
    educators: "Educators",
    menu: "Menu",
    skip: "Skip to content",
    primary: "Primary navigation",
    mobile: "Mobile navigation",
  },
  language: {
    label: "Language",
    change: "Change language",
  },
  footer: {
    title: "Milanković Cycles",
    copy: "A 3D tour of the orbital cycles behind the ice ages.",
    nav: "Footer navigation",
    guides: "Guides",
    openLab: "Open the lab",
    sources: "Sources and method",
    about: "About",
    educators: "For educators",
    faq: "FAQ",
    meta: "By Filip van Harreveld · Great-grandson of Milutin Milanković",
  },
  chapters: {
    "big-idea": "Ice and sun",
    "orbit-shape": "Stretch",
    "axis-tilt": "Lean",
    "axis-direction": "Wobble",
    together: "Run the clock",
    recap: "Short version",
  },
  tour: {
    start: "Start the tour",
    openLab: "Open the lab",
    chapterNav: "Chapter navigation",
    progress: "Tour progress",
    step: "Step {n} of {total}",
    jump: "Jump to chapter",
    exploreCycle: "Explore a cycle",
    every: "every {period}",
    cycles: {
      "orbit-shape": {
        label: "Stretch",
        detail: "The orbit changes shape",
        period: "100,000 years",
      },
      "axis-tilt": {
        label: "Lean",
        detail: "The axis tilts more or less",
        period: "41,000 years",
      },
      "axis-direction": {
        label: "Wobble",
        detail: "The axis turns like a top",
        period: "23,000 years",
      },
    },
  },
  idea: {
    group: "Choose a time",
    today: "Today",
    ago21: "21,000 years ago",
    iceAgeWeaker:
      "Ice sheets covered Canada and northern Europe. Midsummer sunlight at 65°N was {delta} W/m² weaker than today, and had been weak for thousands of years.",
    iceAgeStronger:
      "Ice sheets covered Canada and northern Europe. Midsummer sunlight at 65°N was {delta} W/m² stronger than today, and had been weak for thousands of years.",
    own: "Your own orbit, with the ice sheets of the last visit.",
    todayText:
      "Ice covers Greenland and Antarctica. Northern Canada and Europe are free of it.",
  },
  controls: {
    eccentricity: {
      label: "Orbit shape",
      term: "Eccentricity",
      period: "100,000 years",
      minLabel: "Circle",
      maxLabel: "Stretched",
      experiments: ["Perfect circle", "Most stretched"],
    },
    obliquityDeg: {
      label: "Axis tilt",
      term: "Obliquity",
      period: "41,000 years",
      minLabel: "Less tilt",
      maxLabel: "More tilt",
      experiments: ["Least tilt · 22.1°", "Most tilt · 24.5°"],
    },
    earthPerihelionLongitudeDeg: {
      label: "Axis direction",
      term: "Precession",
      period: "23,000 years",
      minLabel: "0°",
      maxLabel: "360°",
      experiments: ["Summer nearest the Sun", "Summer farthest from the Sun"],
    },
    every: "{term} · every {period}",
    today: "Today",
    playCycle: "Play the cycle",
    stop: "Stop",
    backToToday: "Back to today",
    experimentsLabel: "{label} experiments",
  },
  describe: {
    circle:
      "A circle. Earth stays 149.6 million km from the Sun all year, so every season gets the same boost.",
    shape:
      "Earth swings between {near} and {far} million km from the Sun. Sunlight is {percent}% stronger at the near end.",
    tilt: "At midsummer the Sun stays up for {hours} hours at 65°N and climbs {elevation}° above the horizon.",
    directionCircle:
      "The orbit is a circle, so it makes no difference where summer falls.",
    direction:
      "Northern summer falls {place}, {distance} million km from the Sun.",
    placeNear: "near the closest point of the orbit",
    placeFar: "near the farthest point of the orbit",
    placeBetween: "between the closest and farthest points",
  },
  sunlight: {
    same: "Same as today",
    more: "{n} W/m² more than today",
    less: "{n} W/m² less than today",
    announce: "{value} watts per square metre. {delta}. {melt}",
  },
  melt: {
    less: "Weaker summer sunlight can help winter snow survive.",
    more: "Stronger summer sunlight can melt more winter snow.",
    near: "Summer sunlight is close to today’s level.",
  },
  seasons: {
    spring: "Northern spring",
    summer: "Northern summer",
    autumn: "Northern autumn",
    winter: "Northern winter",
  },
  stage: {
    hudLabel: "Midsummer sun · 65°N",
    weaker: "Weaker",
    stronger: "Stronger",
    viewShape:
      "Orbit shape. Eccentricity {value}; the grey dashed outline is today's orbit.",
    viewTilt:
      "Earth's axis tilted {value} degrees; the grey dashed line is today's 23.44 degrees.",
    viewDirection:
      "Earth at northern midsummer. Closest approach to the Sun falls in {season}; the grey line marks where summer falls today.",
    viewIdea:
      "Earth seen from above the north pole with the 65 degree north line marked.",
    viewCombined:
      "Earth and Sun producing {value} watts per square metre at 65 degrees north in midsummer.",
    iceLess: "less ice than today",
    iceNone: "no ice beyond today’s",
    icePercent: "ice at {percent}% of its peak",
    orbitDrawing: "Orbit drawing",
    stretched: "Stretched ×5",
    trueShape: "True shape",
    reducedMotion: "Reduced motion",
    staticDiagram: "Static diagram",
    resume: "Resume motion",
    pause: "Pause motion",
    dragShape: "Drag to stretch the orbit",
    dragTilt: "Drag to lean the axis",
    dragDirection: "Drag to turn the axis",
    dragTime: "Drag to move through time",
  },
  scene: {
    decimal: ".",
    closest: "Closest",
    farthest: "Farthest",
    summerToday: "Summer today",
    northernSummer: "Northern summer",
    spring: "Spring",
    summer: "Summer",
    autumn: "Autumn",
    winter: "Winter",
  },
  timeline: {
    rows: {
      eccentricity: "Orbit shape",
      tilt: "Axis tilt",
      summer: "Summer distance",
      sunlight: "Sunlight, 65°N",
      ice: "Ice on land",
    },
    near: "near",
    far: "far",
    middle: "middle",
    notRecorded: "not recorded",
    ownOrbit: "Your own orbit",
    play: "Play the clock",
    pause: "Pause",
    reading: "{value} W/m² at 65°N",
    iceAt: "ice at {percent}%",
    jump: "Jump to a moment",
    moments: [
      "Last warm period",
      "Peak of the last ice age",
      "Strongest recent summers",
      "Today",
      "50,000 years ahead",
    ],
    orbitOnly: "Orbit only",
    slider: "Time, in thousands of years from today",
    valueText: "{when}, {value} watts per square metre",
    today: "Today",
    ago: "{n} years ago",
    ahead: "{n} years from now",
    thousand: "{n}k",
    groupSeparator: ",",
  },
  milestones: {
    lgm21k: {
      label: "Last glacial maximum",
      shortLabel: "21,000 years ago",
      description:
        "An orbital state during the last glacial maximum. Existing ice, low greenhouse gases, and climate history also mattered.",
    },
    midHolocene6k: {
      label: "Mid-Holocene",
      shortLabel: "6,000 years ago",
      description:
        "A configuration with much stronger northern summer sunlight than the present reference.",
    },
    presentJ2000: {
      label: "Today’s reference",
      shortLabel: "J2000",
      description:
        "The J2000 astronomical reference used as the comparison baseline.",
    },
    future50k: {
      label: "50,000 years from now",
      shortLabel: "Orbital geometry",
      description:
        "A calculated future orbital geometry, not a prediction of future climate or ice sheets.",
    },
  },
  climate: {
    warmthEven: "about as warm as before industry",
    warmthColder: "about {n} °C colder than before industry",
    warmthWarmer: "about {n} °C warmer than before industry",
    recordLess: "slightly less ice than today",
    recordNone: "no more ice than today",
    recordPercent: "ice sheets at {percent}% of their ice-age peak",
    record: "Measured in sea-floor sediment: {ice}, in a world {warmth}.",
    estimateLess: "some of today’s ice would melt",
    estimateNone: "ice would stay about where it is",
    estimatePercent:
      "ice sheets would grow to about {percent}% of their ice-age peak",
    leadPast: "If this orbit lasted about 15,000 years: ",
    leadFuture:
      "Orbit only, no record exists yet. If this orbit lasted about 15,000 years: ",
    estimate: "{lead}{ice}, in a world {warmth}.",
  },
  lab: {
    loading: "Loading the lab…",
    eyebrow: "Try it yourself",
    title: "Orbital lab",
    intro: "Change the orbit and watch midsummer sunlight at 65°N respond.",
    stageLabel: "Orbital visualization",
    sunlightTitle: "Midsummer sunlight",
    at65: "at 65°N",
    j2000: "· J2000",
    tempTitle: "Global temperature",
    estimate: "estimate",
    average: "about {n} °C average",
    invalid: "Some shared values were invalid and reset to today’s reference.",
    dismiss: "Dismiss",
    controlsHeading: "The three motions",
    resetAll: "Reset all",
    resetAnnounce: "All settings reset to today.",
    climateHeading: "What it does to the climate",
    gaugeIceAge: "Last ice age −{n} °C",
    gaugePreindustrial: "Before industry, about {n} °C",
    caveat:
      "A rough, orbit-only estimate, not a forecast. Ice and temperature move together in the sea-floor record, and a world at the last ice age was about {lgm} °C colder (Tierney et al., 2020). For a hand-set orbit it assumes the orbit lasts about 15,000 years. Real ice also depends on carbon dioxide, oceans and the ice already there, and today’s actual temperature is about 1.2 °C above this baseline because of greenhouse gases.",
    timeHeading: "Travel in time",
    dataLink: "La2004 data ↗",
    presetReading: "{value} W/m² at 65°N",
    presetOwn:
      "Your own combination. Pick a date, or drag the clock, to load all three orbital values for that time.",
    methodSummary: "How to read the numbers",
    methodIntro:
      "The result is the daily average of sunlight at the top of the atmosphere, at 65°N on the northern summer solstice. “Today” is the J2000 astronomical reference, for the year 2000.",
    daylight: "Daylight",
    hours: "{n} hours",
    distance: "Earth–Sun distance",
    closestApproach: "Closest approach",
    methodOutro:
      "One astronomical unit (AU) is Earth’s average distance from the Sun. The drawing stretches orbit shape five times by default; the calculation always uses the real value. The dashed grey outlines show today’s value for the part you are changing.",
    methodLink: "Equations, data and limits →",
    actions: "Lab actions",
    share: "Share",
    copyLink: "Copy link to this setup",
    shareCopied: "Link copied. It includes your current settings.",
    shareManual: "Select and copy the link below.",
    manualLabel: "Link to your settings",
  },
  errors: {
    notFoundTitle: "Page not found",
    notFoundText:
      "This address doesn’t match a page. You can start again from the tour.",
    notFoundBack: "Return to the tour",
    errorEyebrow: "Loading error",
    errorTitle: "This page couldn’t load",
    errorText:
      "Try loading the page again. If the problem continues, refresh your browser.",
    retry: "Try again",
  },
};

export type Ui = typeof en;
