import type { LearnTopic } from "@/lib/learn/topics";

export const topicsNl: LearnTopic[] = [
  {
    slug: "eccentricity",
    shortTitle: "Excentriciteit",
    eyebrow: "Baanvorm · Rekken",
    title: "Hoe de vorm van de baan verandert",
    description:
      "Hoe de vorm van de baan van de aarde over 100.000 jaar verandert, waarom dat het jaarlijkse zonlicht nauwelijks verandert, en waarom het toch uitmaakt voor de ijstijden.",
    answer:
      "Excentriciteit meet hoe ver de baan van de aarde van een cirkel afwijkt. Ze schommelt tussen bijna cirkelvormig en licht ovaal, wat het verschil tussen de kleinste en de grootste afstand van de aarde tot de zon verandert.",
    period: "Belangrijkste ritmes rond 100.000 en 405.000 jaar",
    facts: [
      {
        label: "Wat verandert",
        title: "Baanvorm",
        copy: "De ellips wordt iets ronder of iets meer uitgerekt.",
      },
      {
        label: "Direct effect",
        title: "Het verschil tussen dichtbij en veraf",
        copy: "Nu staat de aarde op het dichtste punt 147,1 miljoen km van de zon en op het verste punt 152,1 miljoen km. Bij de sterkste uitrekking is het verschil 17 miljoen km.",
      },
      {
        label: "Rol in het klimaat",
        title: "Versterker van de wiebeling",
        copy: "Ze bepaalt hoeveel de wiebeling het seizoensgebonden zonlicht kan veranderen.",
      },
    ],
    sections: [
      {
        heading: "Wat excentriciteit is",
        paragraphs: [
          "Een cirkel heeft een excentriciteit van 0. De baan van de aarde heeft nu 0,0167, dicht genoeg bij een cirkel dat een tekening op ware schaal rond lijkt. In de afgelopen 800.000 jaar bleef ze tussen ongeveer 0,004 en 0,05. De zon staat in één brandpunt van de ellips, niet in het midden.",
          "Naarmate de excentriciteit groeit, komt het dichtste punt van de aarde (perihelium) dichterbij en het verste punt (aphelium) verder weg. Zonlicht is sterker als de aarde dichterbij is, omdat dezelfde energie over een kleiner oppervlak wordt verdeeld. Bij de vorm van nu is het zonlicht op het dichtste punt 7% sterker dan op het verste. Bij de sterkste uitrekking is het 26% sterker.",
        ],
      },
      {
        heading: "Een kleine verandering met een groot neveneffect",
        paragraphs: [
          "Over een heel jaar verandert een meer uitgerekte baan het zonlicht dat de aarde ontvangt met minder dan 0,2%. Wat ze wel verandert, is de seizoensbalans. Als de baan bijna een cirkel is, doet de wiebeling er nauwelijks toe, omdat elk punt even ver weg ligt. Is de baan uitgerekt, dan kan de wiebeling het zonlicht in hoogzomer op 65°N met meer dan 100 W/m² laten schommelen.",
          "De ijsgegevens hebben hun sterkste ritme bij 100.000 jaar, wat vreemd is, omdat de directe duw van de baan bij die periode zwak is. IJskappen, oceanen en koolstofdioxide moeten het versterken. Hoe precies wordt nog bediscussieerd.",
        ],
      },
      {
        heading: "Het is geen schakelaar voor ijstijden",
        paragraphs: [
          "Geen enkele excentriciteit start een ijstijd. De drie baancycli werken samen, en daarna versterken of dempen ijs, oceanen en broeikasgassen het resultaat.",
          "Het lab berekent het zonlicht voor een gegeven baan en voegt een ruwe schatting van ijs en temperatuur toe. Om ijs goed te voorspellen is daarbovenop een klimaatmodel nodig.",
        ],
      },
    ],
    questions: [
      {
        question: "Is de baan van de aarde sterk elliptisch?",
        answer:
          "Nee. Zelfs op haar sterkst uitgerekt ligt ze dicht bij een cirkel. Tekeningen overdrijven het, zodat de verandering te zien is.",
      },
      {
        question: "Verandert ze de lengte van het jaar?",
        answer:
          "Nee. Een jaar blijft één rondje om de zon. Excentriciteit verandert het verschil tussen dichtbij en veraf en de snelheid van de aarde langs de baan, die hoger is als de aarde dichterbij staat.",
      },
    ],
  },
  {
    slug: "obliquity",
    shortTitle: "Obliquiteit",
    eyebrow: "Askanteling · Kantelen",
    title: "Hoe de kanteling van de aarde verandert",
    description:
      "Waarom de kanteling van de aarde elke 41.000 jaar tussen 22,1° en 24,5° schommelt, en wat dat doet met de kracht van de seizoenen.",
    answer:
      "Obliquiteit is de kanteling van de aardas, gemeten vanaf de lijn die rechtop op het vlak van de baan staat. Ze schommelt tussen ongeveer 22,1° en 24,5° in een cyclus van 41.000 jaar. Nu is ze 23,44° en dalend, en het volgende dieptepunt komt over ongeveer 10.000 jaar.",
    period: "Ongeveer 41.000 jaar",
    facts: [
      {
        label: "Wat verandert",
        title: "Askanteling",
        copy: "De as helt tussen 22,1° en 24,5° ten opzichte van rechtop.",
      },
      {
        label: "Op 65°N",
        title: "Daglicht in hoogzomer",
        copy: "De zon staat 20,1 uur op bij 22,1° kanteling en 22,4 uur bij 24,5°.",
      },
      {
        label: "Rol in het klimaat",
        title: "Zomersmelt",
        copy: "Koelere zomers op hoge breedtegraden laten meer winterse sneeuw overleven.",
      },
    ],
    sections: [
      {
        heading: "Hoe kanteling seizoenen maakt",
        paragraphs: [
          "Seizoenen komen van kanteling, niet van afstand. De aarde staat begin januari het dichtst bij de zon, als het winter is in het noorden. Terwijl de aarde rondgaat, krijgt het halfrond dat naar de zon is gekanteld langere dagen en een hogere zon. Het andere halfrond krijgt kortere dagen en een lagere zon.",
          "Een grotere kanteling vergroot dat verschil. Het effect groeit met de breedtegraad, dus de polen voelen het het sterkst en de tropen nauwelijks.",
        ],
      },
      {
        heading: "Waarom het uitmaakt voor ijs",
        paragraphs: [
          "Op een dag in hoogzomer op 65°N is het daggemiddelde zonlicht 457 W/m² bij 22,1° kanteling en 496 W/m² bij 24,5°. Dat is een verschil van 39 W/m². Bij minder kanteling zijn de zomers in het noorden koeler en blijft meer winterse sneeuw liggen. Duizenden jaren herhaald kan dat een ijskap opbouwen, als de rest van het klimaat het toelaat.",
          "Dezelfde verandering verplaatst ook zonlicht tussen breedtegraden. Ze maakt niet simpelweg de hele planeet warmer of kouder.",
        ],
      },
      {
        heading: "Een kleine hoek met een grote reikwijdte",
        paragraphs: [
          "Het hele bereik is 2,4 graden. Het werkt duizenden jaren op dezelfde manier, en terugkoppelingen van ijs, oceanen en koolstofdioxide versterken het.",
          "Kanteling moet altijd samen met de uitrekking en de wiebeling worden gelezen. Samen bepalen ze waar en wanneer het zonlicht het sterkst verandert.",
        ],
      },
    ],
    questions: [
      {
        question: "Hoe sterk is de aarde nu gekanteld?",
        answer:
          "23,44°, de standaardreferentiewaarde J2000. Ze neemt langzaam af.",
      },
      {
        question: "Zou de aarde seizoenen hebben zonder kanteling?",
        answer:
          "Alleen zwakke. De afstand zou het zonlicht nog een beetje veranderen, maar beide halfronden zouden samen opwarmen en afkoelen.",
      },
    ],
  },
  {
    slug: "precession",
    shortTitle: "Precessie",
    eyebrow: "Asrichting · Wiebelen",
    title: "Hoe precessie de seizoenen verschuift",
    description:
      "Hoe het draaien van de aardas en van haar baan de seizoenen ongeveer elke 23.000 jaar langs de baan verplaatst.",
    answer:
      "Precessie verandert waar op de baan elk seizoen valt. De aardas draait langzaam rond, zoals de as van een tol, en de lange as van de baan draait ook. Samen verschuiven ze de seizoenen ten opzichte van het dichtste en het verste punt van de aarde.",
    period: "Klimaatritmes rond 19.000 en 23.000 jaar",
    facts: [
      {
        label: "Eerste draai",
        title: "De as",
        copy: "Ze beschrijft een cirkel in de ruimte, zoals de as van een tol.",
      },
      {
        label: "Tweede draai",
        title: "De ellips",
        copy: "Het dichtste punt kruipt ten opzichte van de sterren rond.",
      },
      {
        label: "Rol in het klimaat",
        title: "Timing van de zomer",
        copy: "Een zomer dicht bij de zon is sterker dan een zomer ver ervan.",
      },
    ],
    sections: [
      {
        heading: "Twee draaiingen die samenkomen",
        paragraphs: [
          "De as alleen doet er ongeveer 25.800 jaar over om één keer rond te gaan. De ellips draait ook, en samen brengen de twee de seizoenen ongeveer elke 21.000 jaar terug op dezelfde plek van de baan. De klimaatgegevens laten pieken zien rond 19.000 en 23.000 jaar.",
        ],
      },
      {
        heading: "Waarom timing het zonlicht verandert",
        paragraphs: [
          "De aarde krijgt meer zonlicht als ze dichter bij de zon staat. Valt de zomer op het noordelijk halfrond aan het nabije einde van de baan, dan krijgt het zonlicht in hoogzomer een boost. Een halve cyclus later valt hij aan het verre einde en wordt de boost een straf.",
          "Bij de baan van nu verschuift die omwisseling het zonlicht in hoogzomer op 65°N van 478 naar ongeveer 510 W/m². Bij de sterkst uitgerekte baan verschuift ze het met 115 W/m². De twee halfronden wisselen in tegengestelde richting: als de zomer in het noorden dicht bij de zon valt, is de zomer in het zuiden ver weg.",
        ],
      },
      {
        heading: "Waarom je 26.000 en 23.000 hoort",
        paragraphs: [
          "Ongeveer 26.000 jaar is het draaien van de as op zichzelf. Voor het klimaat telt wanneer elk seizoen valt ten opzichte van het nabije en het verre punt, en dat geeft de kortere ritmes.",
          "Beide getallen kloppen zodra je zegt welke draaiing je bedoelt.",
        ],
      },
    ],
    questions: [
      {
        question: "Is precessie hetzelfde als kanteling?",
        answer:
          "Nee. Kanteling is de hoek van de as. Precessie is de richting waarin de gekantelde as wijst.",
      },
      {
        question: "Werkt het op beide halfronden hetzelfde?",
        answer:
          "Het werkt tegengesteld. De zomers in het noorden en het zuiden vallen een half jaar uit elkaar, aan tegenovergestelde kanten van de baan.",
      },
    ],
  },
  {
    slug: "65-north-insolation",
    shortTitle: "Zonlicht op 65°N",
    eyebrow: "Zomerzonlicht",
    title: "Waarom het zomerzonlicht op 65°N ertoe doet",
    description:
      "Waarom wetenschappers het zonlicht in hoogzomer op 65°N gebruiken om de ijstijden te bestuderen, en wat het getal wel en niet vertelt.",
    answer:
      "Grote ijskappen groeiden op hoge noordelijke breedtegraden, en of ze groeiden hing af van hoeveel winterse sneeuw de zomer overleefde. Het zonlicht in hoogzomer op 65°N is daar de standaardmaatstaf voor.",
    period: "Daggemiddelde aan de bovenkant van de atmosfeer, op de zomerzonnewende",
    facts: [
      {
        label: "Waar",
        title: "Hoge noordelijke breedtegraden",
        copy: "65°N loopt door Noord-Canada, Scandinavië en Siberië, dicht bij de oude ijskappen.",
      },
      {
        label: "Wanneer",
        title: "Hoogzomer",
        copy: "De zomer bepaalt hoeveel winterse sneeuw smelt.",
      },
      {
        label: "Wat het meet",
        title: "Binnenkomend zonlicht",
        copy: "Instraling is energie die aan de bovenkant van de atmosfeer aankomt. Het is geen temperatuur.",
      },
    ],
    sections: [
      {
        heading: "De zomer telt zwaarder dan de winter",
        paragraphs: [
          "Een ijskap heeft sneeuw nodig, en die sneeuw moet de zomer overleven. Een sneeuwrijke winter gevolgd door een heldere zomer laat niets achter. Een koele zomer laat sneeuw jaar na jaar oplopen.",
          "Daarom kijkt de theorie van Milanković naar de energiebalans van de zomer op hoge noordelijke breedtegraden. Ze verbindt de baan met iets dat bepaalt of ijs groeit: hoeveel sneeuw smelt.",
        ],
      },
      {
        heading: "Waarom 65°N",
        paragraphs: [
          "De lijn van 65°N loopt door de zone waar de grote noordelijke ijskappen groeiden. Ze geeft één getal dat gemakkelijk over verschillende tijden te vergelijken is.",
          "Onderzoekers gebruiken ook andere breedtegraden, andere seizoenen en sommen over de hele zomer. De waarde op de zonnewende op 65°N is eenvoudig uit te leggen en volgt dezelfde ritmes.",
        ],
      },
      {
        heading: "Wat het getal je niet kan vertellen",
        paragraphs: [
          "Het is zonlicht aan de bovenkant van de atmosfeer. Het geeft geen luchttemperatuur, sneeuwval, zeestromingen, broeikasgassen of ijsvolume. Die hangen af van de atmosfeer, de oceanen, het land en het klimaat dat eraan voorafging.",
          "Een hoger getal kan het smelten stimuleren. Hoeveel er smelt, hangt van dat alles af.",
        ],
      },
    ],
    questions: [
      {
        question: "Wat betekent instraling?",
        answer:
          "Binnenkomende zonnestraling. Ze kan worden opgegeven voor elke breedtegraad en dag, aan de bovenkant van de atmosfeer of op de grond. Hier is het het daggemiddelde aan de bovenkant van de atmosfeer.",
      },
      {
        question: "Waarom niet het wereldwijde jaargemiddelde?",
        answer:
          "Smelten is seizoensgebonden en lokaal. Het wereldwijde jaargemiddelde verandert nauwelijks met de baan. Wat verandert, is hoe het zonlicht over seizoenen en breedtegraden wordt verdeeld.",
      },
    ],
  },
  {
    slug: "modern-climate-change",
    shortTitle: "Opwarming van nu",
    eyebrow: "Baancycli en het klimaat van nu",
    title: "Verklaren baancycli de opwarming van nu?",
    description:
      "Nee. De baan verandert over tienduizenden jaren. De opwarming van nu komt vooral door broeikasgassen die door menselijke activiteit vrijkomen.",
    answer:
      "Nee. Baancycli veranderen het zonlicht over tienduizenden jaren. Ze kunnen de snelheid of het patroon van de opwarming van nu niet verklaren, die vooral komt door broeikasgassen die door menselijke activiteit vrijkomen.",
    period: "Baancycli: tienduizenden jaren",
    facts: [
      {
        label: "Tijdschaal",
        title: "Veel te langzaam",
        copy: "De baan verandert merkbaar pas over duizenden jaren.",
      },
      {
        label: "Oorzaak van nu",
        title: "Broeikasgassen",
        copy: "Het verbranden van fossiele brandstoffen verhoogt koolstofdioxide en andere gassen die warmte vasthouden.",
      },
      {
        label: "Gebruik nu",
        title: "Context",
        copy: "De cycli verklaren de timing van de oude ijstijden, niet de trend van nu.",
      },
    ],
    sections: [
      {
        heading: "De tijdschalen komen niet overeen",
        paragraphs: [
          "Excentriciteit, kanteling en precessie veranderen over tienduizenden tot honderdduizenden jaren. De opwarming sinds de 19e eeuw gaat veel te snel om daardoor te komen.",
        ],
      },
      {
        heading: "Twee verschillende mechanismen",
        paragraphs: [
          "Baancycli verplaatsen zonlicht tussen seizoenen en breedtegraden. Ze veroorzaken geen snelle, blijvende stijging van gassen die warmte vasthouden. Het verbranden van fossiele brandstoffen wel, en het vertraagt hoe snel de aarde warmte aan de ruimte kwijtraakt.",
          "Wetenschappers onderscheiden de twee aan de hand van de timing, van waar en wanneer de opwarming plaatsvindt, en van directe metingen van de energiebalans van de aarde.",
        ],
      },
      {
        heading: "Waarom het oude klimaat nog steeds telt",
        paragraphs: [
          "IJstijdgegevens laten zien hoe ijs, oceanen en koolstofdioxide een kleine verandering in zonlicht kunnen versterken. Dat helpt wetenschappers uitrekenen hoe gevoelig het klimaat is.",
          "De baan hielp de timing van de ijstijden te bepalen. De belangrijkste drijfveer van de opwarming van nu zijn door mensen gemaakte broeikasgassen.",
        ],
      },
    ],
    questions: [
      {
        question: "Lopen de cycli nog?",
        answer:
          "Ja. De baan blijft veranderen, maar haar langzame veranderingen verklaren de snelle opwarming van nu niet.",
      },
      {
        question: "Kunnen natuurlijke en menselijke oorzaken allebei bestaan?",
        answer:
          "Ja. Het klimaat heeft natuurlijke drijfveren op veel tijdschalen. Meerdere onafhankelijke bewijslijnen schrijven de opwarming van nu vooral toe aan menselijke uitstoot van broeikasgassen.",
      },
    ],
  },
];
