import type { LearnTopic } from "@/lib/learn/topics";

export const topicsSr: LearnTopic[] = [
  {
    slug: "eccentricity",
    shortTitle: "Ekscentricitet",
    eyebrow: "Oblik orbite · Istezanje",
    title: "Kako se menja oblik orbite",
    description:
      "Kako se oblik Zemljine orbite menja tokom 100.000 godina, zašto to jedva menja godišnju sunčevu svetlost i zašto je ipak važno za ledena doba.",
    answer:
      "Ekscentricitet meri koliko Zemljina orbita odstupa od kruga. Pomera se između skoro kružne i blago ovalne, što menja razliku između Zemljine najmanje i najveće udaljenosti od Sunca.",
    period: "Glavni ritmovi oko 100.000 i 405.000 godina",
    facts: [
      {
        label: "Šta se menja",
        title: "Oblik orbite",
        copy: "Elipsa postaje malo okrugla ili malo izdužena.",
      },
      {
        label: "Direktan uticaj",
        title: "Razlika između blizu i daleko",
        copy: "Danas je Zemlja u najbližoj tački 147,1 milion km od Sunca, a u najdaljoj 152,1 milion km. Kod najvećeg izduženja razlika je 17 miliona km.",
      },
      {
        label: "Uloga u klimi",
        title: "Pojačivač njihanja",
        copy: "Određuje koliko njihanje može da promeni sezonsku sunčevu svetlost.",
      },
    ],
    sections: [
      {
        heading: "Šta je ekscentricitet",
        paragraphs: [
          "Krug ima ekscentricitet 0. Zemljina orbita danas ima 0,0167, dovoljno blizu krugu da crtež u pravoj razmeri izgleda okruglo. U poslednjih 800.000 godina ostajao je između oko 0,004 i 0,05. Sunce se nalazi u jednoj žiži elipse, a ne u njenom središtu.",
          "Kako ekscentricitet raste, Zemljina najbliža tačka (perihel) postaje bliža, a najdalja (afel) dalja. Sunčeva svetlost je jača kada je Zemlja bliže, jer se ista energija raspoređuje na manju površinu. Sa današnjim oblikom najbliža sunčeva svetlost je 7% jača od najdalje. Kod najvećeg izduženja je 26% jača.",
        ],
      },
      {
        heading: "Mala promena sa velikim sporednim dejstvom",
        paragraphs: [
          "Tokom cele godine, izduženija orbita menja sunčevu svetlost koju Zemlja prima za manje od 0,2%. Ono što menja jeste sezonska ravnoteža. Kada je orbita skoro krug, njihanje jedva da je važno, jer je svaka tačka na istom rastojanju. Kada je orbita izdužena, njihanje može da promeni sunčevu svetlost usred leta na 65°N za više od 100 W/m².",
          "Zapis leda ima najjači ritam na 100.000 godina, što je čudno, jer je direktan uticaj orbite na tom periodu slab. Ledeni pokrivači, okeani i ugljen-dioksid moraju da ga pojačavaju. Kako tačno, i dalje je predmet rasprave.",
        ],
      },
      {
        heading: "To nije prekidač za ledeno doba",
        paragraphs: [
          "Nijedan određeni ekscentricitet ne započinje ledeno doba. Tri orbitalna ciklusa se kombinuju, a zatim led, okeani i gasovi staklene bašte pojačavaju ili slabe rezultat.",
          "Laboratorija računa sunčevu svetlost za datu orbitu i dodaje grubu procenu leda i temperature. Za pravo predviđanje leda potreban je klimatski model povrh toga.",
        ],
      },
    ],
    questions: [
      {
        question: "Da li je Zemljina orbita veoma eliptična?",
        answer:
          "Ne. Čak i kada je najizduženija, blizu je krugu. Crteži je preteruju da bi se promena videla.",
      },
      {
        question: "Da li menja dužinu godine?",
        answer:
          "Ne. Godina je i dalje jedan obilazak oko Sunca. Ekscentricitet menja razliku između blizu i daleko i Zemljinu brzinu duž orbite, koja je veća kada je Zemlja bliže.",
      },
    ],
  },
  {
    slug: "obliquity",
    shortTitle: "Nagib ose",
    eyebrow: "Nagib ose · Naginjanje",
    title: "Kako se menja Zemljin nagib",
    description:
      "Zašto se Zemljin nagib njiše između 22,1° i 24,5° na svakih 41.000 godina i šta to radi jačini godišnjih doba.",
    answer:
      "Nagib ose je nagib Zemljine ose, meren od prave koja stoji uspravno na ravan orbite. Njiše se između oko 22,1° i 24,5° u ciklusu od 41.000 godina. Danas iznosi 23,44° i opada, a sledeći minimum stiže za oko 10.000 godina.",
    period: "Oko 41.000 godina",
    facts: [
      {
        label: "Šta se menja",
        title: "Nagib ose",
        copy: "Osa je nagnuta između 22,1° i 24,5° od uspravnog.",
      },
      {
        label: "Na 65°N",
        title: "Dnevna svetlost usred leta",
        copy: "Sunce je iznad horizonta 20,1 sat pri nagibu od 22,1° i 22,4 sata pri 24,5°.",
      },
      {
        label: "Uloga u klimi",
        title: "Letnje topljenje",
        copy: "Hladnija leta na visokim širinama puštaju da više zimskog snega opstane.",
      },
    ],
    sections: [
      {
        heading: "Kako nagib pravi godišnja doba",
        paragraphs: [
          "Godišnja doba dolaze od nagiba, a ne od rastojanja. Zemlja je najbliža Suncu početkom januara, kada je na severu zima. Dok Zemlja obilazi, hemisfera nagnuta ka Suncu dobija duže dane i više Sunce. Druga hemisfera dobija kraće dane i niže Sunce.",
          "Veći nagib povećava tu razliku. Uticaj raste sa geografskom širinom, pa polovi to osećaju najviše, a tropi jedva.",
        ],
      },
      {
        heading: "Zašto je važan za led",
        paragraphs: [
          "Na dan usred leta na 65°N dnevni prosek sunčeve svetlosti iznosi 457 W/m² pri nagibu od 22,1° i 496 W/m² pri 24,5°. To je razlika od 39 W/m². Sa manjim nagibom severna leta su hladnija i opstaje više zimskog snega. Ponavljano hiljadama godina, to može da izgradi ledeni pokrivač, ako ostatak klime to dozvoljava.",
          "Ista promena premešta sunčevu svetlost između geografskih širina. Ne zagreva niti hladi jednostavno celu planetu.",
        ],
      },
      {
        heading: "Mali ugao sa dugim dometom",
        paragraphs: [
          "Ceo opseg je 2,4 stepena. Deluje na isti način hiljadama godina, a povratne sprege leda, okeana i ugljen-dioksida ga pojačavaju.",
          "Nagib uvek treba čitati zajedno sa istezanjem i njihanjem. Zajedno određuju gde i kada se sunčeva svetlost najviše menja.",
        ],
      },
    ],
    questions: [
      {
        question: "Koliki je Zemljin nagib danas?",
        answer:
          "23,44°, standardna referentna vrednost J2000. Polako opada.",
      },
      {
        question: "Da li bi Zemlja imala godišnja doba bez nagiba?",
        answer:
          "Samo slaba. Rastojanje bi i dalje malo menjalo sunčevu svetlost, ali bi se obe hemisfere zagrevale i hladile zajedno.",
      },
    ],
  },
  {
    slug: "precession",
    shortTitle: "Precesija",
    eyebrow: "Smer ose · Njihanje",
    title: "Kako precesija pomera godišnja doba",
    description:
      "Kako okretanje Zemljine ose i njene orbite pomera godišnja doba duž orbite otprilike svakih 23.000 godina.",
    answer:
      "Precesija menja gde na orbiti pada svako godišnje doba. Zemljina osa se polako okreće kao osa čigre, a okreće se i duža osa orbite. Zajedno pomeraju godišnja doba u odnosu na Zemljinu najbližu i najdalju tačku.",
    period: "Klimatski ritmovi oko 19.000 i 23.000 godina",
    facts: [
      {
        label: "Prvo okretanje",
        title: "Osa",
        copy: "Opisuje krug u prostoru, kao osa čigre.",
      },
      {
        label: "Drugo okretanje",
        title: "Elipsa",
        copy: "Njena najbliža tačka se polako pomera u odnosu na zvezde.",
      },
      {
        label: "Uloga u klimi",
        title: "Vreme leta",
        copy: "Leto blizu Sunca je jače od leta daleko od njega.",
      },
    ],
    sections: [
      {
        heading: "Dva okretanja koja se sabiraju",
        paragraphs: [
          "Samoj osi treba oko 25.800 godina da jednom obiđe krug. Okreće se i elipsa, a to dvoje zajedno vraća godišnja doba na isto mesto orbite otprilike svakih 21.000 godina. Klimatski zapis pokazuje vrhove oko 19.000 i 23.000 godina.",
        ],
      },
      {
        heading: "Zašto vreme menja sunčevu svetlost",
        paragraphs: [
          "Zemlja dobija više sunčeve svetlosti kada je bliže Suncu. Ako severno leto pada na bližem kraju orbite, sunčeva svetlost usred leta dobija podsticaj. Pola ciklusa kasnije pada na daljem kraju i podsticaj postaje kazna.",
          "Pri današnjoj orbiti ta zamena pomera sunčevu svetlost usred leta na 65°N sa 478 na oko 510 W/m². Kod najizduženije orbite pomera je za 115 W/m². Dve hemisfere se menjaju u suprotnim smerovima: kada je severno leto blizu Sunca, južno leto je daleko od njega.",
        ],
      },
      {
        heading: "Zašto čuješ i 26.000 i 23.000",
        paragraphs: [
          "Oko 26.000 godina je okretanje same ose. Za klimu je važno kada svako godišnje doba pada u odnosu na bližu i dalju tačku, a to daje kraće ritmove.",
          "Oba broja su tačna kada kažeš o kojem okretanju je reč.",
        ],
      },
    ],
    questions: [
      {
        question: "Da li je precesija isto što i nagib?",
        answer:
          "Ne. Nagib je ugao ose. Precesija je smer u kojem pokazuje nagnuta osa.",
      },
      {
        question: "Da li deluje na obe hemisfere na isti način?",
        answer:
          "Deluje na njih suprotno. Severno i južno leto padaju šest meseci jedno od drugog, na suprotnim stranama orbite.",
      },
    ],
  },
  {
    slug: "65-north-insolation",
    shortTitle: "Sunce na 65°N",
    eyebrow: "Letnja sunčeva svetlost",
    title: "Zašto je letnja sunčeva svetlost na 65°N važna",
    description:
      "Zašto naučnici koriste sunčevu svetlost usred leta na 65°N za proučavanje ledenih doba i šta taj broj govori, a šta ne.",
    answer:
      "Veliki ledeni pokrivači rasli su na visokim severnim širinama, a da li će rasti zavisilo je od toga koliko je zimskog snega preživelo leto. Sunčeva svetlost usred leta na 65°N je standardno merilo za to.",
    period: "Dnevni prosek na vrhu atmosfere, za letnji solsticijum",
    facts: [
      {
        label: "Gde",
        title: "Visoke severne širine",
        copy: "65°N prolazi kroz severnu Kanadu, Skandinaviju i Sibir, blizu nekadašnjih ledenih pokrivača.",
      },
      {
        label: "Kada",
        title: "Usred leta",
        copy: "Leto određuje koliko se zimskog snega topi.",
      },
      {
        label: "Šta meri",
        title: "Dolaznu sunčevu svetlost",
        copy: "Insolacija je energija koja stiže na vrh atmosfere. To nije temperatura.",
      },
    ],
    sections: [
      {
        heading: "Leto je važnije od zime",
        paragraphs: [
          "Ledenom pokrivaču je potreban sneg, a taj sneg mora da opstane preko leta. Snežna zima praćena sunčanim letom ne ostavlja ništa. Hladno leto pušta da se sneg gomila godinama.",
          "Zato Milankovićeva teorija gleda letnji energetski bilans na visokim severnim širinama. Ona povezuje orbitu sa onim što odlučuje da li led raste: koliko se snega topi.",
        ],
      },
      {
        heading: "Zašto 65°N",
        paragraphs: [
          "Linija 65°N prolazi kroz zonu u kojoj su rasli veliki severni ledeni pokrivači. Daje jedan broj koji je lako porediti kroz vreme.",
          "Istraživači koriste i druge geografske širine, druga godišnja doba i zbirove za celo leto. Vrednost za solsticijum na 65°N je jednostavna za objašnjenje i prati iste ritmove.",
        ],
      },
      {
        heading: "Šta taj broj ne može da ti kaže",
        paragraphs: [
          "To je sunčeva svetlost na vrhu atmosfere. Ne daje temperaturu vazduha, sneg, morske struje, gasove staklene bašte ni zapreminu leda. Oni zavise od atmosfere, okeana, kopna i klime koja im je prethodila.",
          "Veći broj može podstaći topljenje. Koliko će se otopiti zavisi od svega toga.",
        ],
      },
    ],
    questions: [
      {
        question: "Šta znači insolacija?",
        answer:
          "Dolazno sunčevo zračenje. Može se dati za bilo koju geografsku širinu i dan, na vrhu atmosfere ili na tlu. Ovde je to dnevni prosek na vrhu atmosfere.",
      },
      {
        question: "Zašto ne koristiti globalni godišnji prosek?",
        answer:
          "Topljenje je sezonsko i lokalno. Globalni godišnji prosek se jedva menja sa orbitom. Menja se to kako se sunčeva svetlost raspoređuje između godišnjih doba i geografskih širina.",
      },
    ],
  },
  {
    slug: "modern-climate-change",
    shortTitle: "Savremeno zagrevanje",
    eyebrow: "Orbitalni ciklusi i današnja klima",
    title: "Objašnjavaju li orbitalni ciklusi savremeno zagrevanje?",
    description:
      "Ne. Orbita se menja tokom desetina hiljada godina. Današnje zagrevanje dolazi uglavnom od gasova staklene bašte koje ispušta ljudska aktivnost.",
    answer:
      "Ne. Orbitalni ciklusi menjaju sunčevu svetlost tokom desetina hiljada godina. Ne mogu da objasne brzinu ni obrazac današnjeg zagrevanja, koje dolazi uglavnom od gasova staklene bašte koje ispušta ljudska aktivnost.",
    period: "Orbitalni ciklusi: desetine hiljada godina",
    facts: [
      {
        label: "Vremenska skala",
        title: "Previše sporo",
        copy: "Orbita se primetno menja tek tokom hiljada godina.",
      },
      {
        label: "Savremeni uzrok",
        title: "Gasovi staklene bašte",
        copy: "Sagorevanje fosilnih goriva povećava ugljen-dioksid i druge gasove koji zadržavaju toplotu.",
      },
      {
        label: "Upotreba danas",
        title: "Kontekst",
        copy: "Ciklusi objašnjavaju vreme drevnih ledenih doba, a ne današnji trend.",
      },
    ],
    sections: [
      {
        heading: "Vremenske skale se ne poklapaju",
        paragraphs: [
          "Ekscentricitet, nagib i precesija menjaju se tokom desetina do stotina hiljada godina. Zagrevanje od 1800-ih je prebrzo da bi poticalo od njih.",
        ],
      },
      {
        heading: "Dva različita mehanizma",
        paragraphs: [
          "Orbitalni ciklusi premeštaju sunčevu svetlost između godišnjih doba i geografskih širina. Ne prave brz, trajan porast gasova koji zadržavaju toplotu. Sagorevanje fosilnih goriva to radi i usporava koliko brzo Zemlja odaje toplotu u svemir.",
          "Naučnici razlikuju ta dva po vremenu, po tome gde i kada se zagrevanje dešava i po direktnim merenjima Zemljinog energetskog bilansa.",
        ],
      },
      {
        heading: "Zašto je stara klima i dalje važna",
        paragraphs: [
          "Zapisi ledenih doba pokazuju kako led, okeani i ugljen-dioksid mogu da pojačaju malu promenu sunčeve svetlosti. To pomaže naučnicima da procene koliko je klima osetljiva.",
          "Orbita je pomogla da se odredi vreme ledenih doba. Glavni pokretač današnjeg zagrevanja su gasovi staklene bašte koje je napravio čovek.",
        ],
      },
    ],
    questions: [
      {
        question: "Da li ciklusi i dalje rade?",
        answer:
          "Da. Orbita se i dalje menja, ali njene spore promene ne objašnjavaju brzo zagrevanje danas.",
      },
      {
        question: "Mogu li prirodni i ljudski uzroci da postoje zajedno?",
        answer:
          "Da. Klima ima prirodne pokretače na mnogim vremenskim skalama. Nekoliko nezavisnih linija dokaza pripisuje današnje zagrevanje uglavnom ljudskoj emisiji gasova staklene bašte.",
      },
    ],
  },
];
