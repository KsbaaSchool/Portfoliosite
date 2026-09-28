// geheime undertale minigame, de menu's, stages, winkel, scores en xp
// klik 3 keer op het tekstvak en zeg YES
// het spelen zelf zit in spel.js

let tekstvak = document.getElementById("dialoog");
let venster = document.getElementById("spelvenster");
let vraag = document.getElementById("spelvraag");
let spelstatus = document.getElementById("spelstatus");
let keuzes = document.getElementById("keuzes");
let jaknop = document.getElementById("jaknop");
let neeknop = document.getElementById("neeknop");
let spelhulp = document.getElementById("spelhulp");
let itemknop = document.getElementById("itemknop");
let eindknoppen = document.getElementById("eindknoppen");

let kaart = document.querySelector(".kaart");
let levelgetal = document.getElementById("levelgetal");
let xpbalk = document.getElementById("xpbalk");
let xpvulling = document.getElementById("xpvulling");
let xpmelding = document.getElementById("xpmelding");
let xplaag = document.getElementById("xplaag");
let xpcanvas = document.getElementById("xpcanvas");
let xppen = xpcanvas.getContext("2d");

// "rustig" komt uit thema.js, die is true als iemand minder beweging wil

// de geluiden, xpVeel is iemand die heel veel xp oppakt in minecraft
let xpGeluid;
let levelGeluid;
laadGeluid("assets/audio/xpVeel.mp3").then((buffer) => (xpGeluid = buffer));
laadGeluid("assets/audio/levelUp.mp3").then((buffer) => (levelGeluid = buffer));

// in xpVeel begint het oppakken bij 4.22 sec, vanaf 5.0 tot 9.3 sec komt het einde met heel veel pings
// in levelUp zit de fanfare vanaf 0.82 sec
let xpGeluidStart = 4.22;
let xpGeluidEinde = 5.0;
let xpGeluidEindeDuur = 4.3;
let levelGeluidStart = 0.82;

// level up moet harder dan de xp
let xpVolume = 0.45;
let levelVolume = 1.1;

// ===== voortgang, blijft bewaard in je browser =====
let standaard = {
  level: 0,
  xp: 0,
  gehaald: 0,
  sterren: {},
  goud: 0,
  upgrades: { hp: 0, snelheid: 0, magneet: 0 },
  taarten: 1,
  skin: "rood",
  skins: ["rood"],
  scores: [],
  naam: "",
};

let voortgang = structuredClone(standaard);

try {
  let opgeslagen = JSON.parse(localStorage.getItem("minigame"));
  if (opgeslagen) {
    voortgang = { ...voortgang, ...opgeslagen };
    voortgang.upgrades = { ...standaard.upgrades, ...opgeslagen.upgrades };
  }
} catch (e) {}

function bewaar() {
  try {
    localStorage.setItem("minigame", JSON.stringify(voortgang));
  } catch (e) {}
}

// hoeveel xp je nodig hebt voor het volgende level
function xpNodig(level) {
  return 100 + level * 50;
}

// elk level geeft 4 max hp erbij, net als LV in undertale
function maxHpNu() {
  return 20 + voortgang.level * 4 + voortgang.upgrades.hp * 5;
}

function sterrenTotaal() {
  return Object.values(voortgang.sterren).reduce((som, n) => som + n, 0);
}

function toonXp() {
  let nodig = xpNodig(voortgang.level);
  xpvulling.style.width = (voortgang.xp / nodig) * 100 + "%";
  levelgetal.textContent = voortgang.level;

  xpbalk.setAttribute("aria-valuemax", nodig);
  xpbalk.setAttribute("aria-valuenow", voortgang.xp);
  xpbalk.setAttribute("aria-valuetext", voortgang.xp + " van " + nodig + " XP");
}

function toonStatus() {
  spelstatus.textContent =
    "LV " + voortgang.level +
    " · " + voortgang.goud + " G" +
    " · ★ " + sterrenTotaal() + "/" + stages.length * 3 +
    " · taart x" + voortgang.taarten;
}

// ===== de stages =====
// elke stage is een rijtje aanvallen (fases), "zeg" typt sans als die fase begint
let stages = [
  {
    intro: "* let's start easy. just dodge.",
    fases: [
      { patroon: "muur", duur: 10, niv: 1 },
      { patroon: "muur", duur: 10, niv: 1.3, zeg: "* grab the gold. you'll need it." },
    ],
  },
  {
    intro: "* blue means stop. don't move.",
    fases: [
      { patroon: "muur", duur: 8, niv: 1.2, blauw: 0.35 },
      { patroon: "golf", duur: 8, niv: 1, zeg: "* follow the path." },
      { patroon: "muur", duur: 6, niv: 1.4, blauw: 0.25 },
    ],
  },
  {
    intro: "* orange means move. keep going.",
    fases: [
      { patroon: "muur", duur: 8, niv: 1.3, oranje: 0.35 },
      { patroon: "golf", duur: 7, niv: 1.3 },
      { patroon: "muur", duur: 8, niv: 1.5, blauw: 0.2, oranje: 0.2, zeg: "* now both. good luck." },
    ],
  },
  {
    intro: "* looks like rain.",
    fases: [
      { patroon: "regen", duur: 8, niv: 1 },
      { patroon: "spikes", duur: 8, niv: 1, zeg: "* watch your step." },
      { patroon: "golf", duur: 8, niv: 1.5 },
    ],
  },
  {
    intro: "* ever seen one of these?",
    fases: [
      { patroon: "blaster", duur: 9, niv: 1 },
      { patroon: "muur", duur: 7, niv: 1.6 },
      { patroon: "blaster", duur: 9, niv: 1.5, zeg: "* two at once. heh." },
    ],
  },
  {
    intro: "* you're blue now. jump!",
    fases: [
      { patroon: "zwaartekracht", duur: 10, niv: 1 },
      { patroon: "blaster", duur: 7, niv: 1.6 },
      { patroon: "zwaartekracht", duur: 9, niv: 1.4, zeg: "* gravity again." },
    ],
  },
  {
    intro: "* getting warmed up?",
    fases: [
      { patroon: "regen", duur: 7, niv: 1.6, blauw: 0.2 },
      { patroon: "spikes", duur: 7, niv: 1.6 },
      { patroon: "golf", duur: 7, niv: 1.8 },
      { patroon: "blaster", duur: 7, niv: 2, zeg: "* almost there." },
    ],
  },
  {
    intro: "* last one. give it everything.",
    fases: [
      { patroon: "muur", duur: 6, niv: 2, blauw: 0.2, oranje: 0.2 },
      { patroon: "zwaartekracht", duur: 7, niv: 1.8, zeg: "* ..." },
      { patroon: "blaster", duur: 6, niv: 2.2 },
      { patroon: "golf", duur: 6, niv: 2 },
      { patroon: "regen", duur: 6, niv: 2 },
      { patroon: "spikes", duur: 6, niv: 2.2, zeg: "* ok. you're good." },
    ],
  },
];

// in endless komen de aanvallen willekeurig en wordt het steeds moeilijker
let endlessPatronen = ["muur", "golf", "regen", "spikes", "blaster", "zwaartekracht"];
let vorigPatroon = "";

function maakEndlessFase(nr, tijd) {
  let patroon;
  do {
    patroon = endlessPatronen[Math.floor(Math.random() * endlessPatronen.length)];
  } while (patroon === vorigPatroon);
  vorigPatroon = patroon;

  let fase = { patroon, duur: 7, niv: 1 + tijd / 25 };
  if (patroon === "muur") {
    fase.blauw = 0.2;
    fase.oranje = 0.15;
  }
  if (patroon === "regen") fase.blauw = 0.15;
  return fase;
}

// ===== 3 keer klikken op het tekstvak =====
let kliks = 0;
let klikTimer;

tekstvak.addEventListener("click", () => {
  kliks++;
  clearTimeout(klikTimer);
  klikTimer = setTimeout(() => (kliks = 0), 1200);

  if (kliks === 3) {
    kliks = 0;
    openVenster();
  }
});

// ===== tekst typen met de sans stem =====
let typNummer = 0;

async function typTekst(tekst) {
  let nummer = ++typNummer;
  vraag.textContent = "";

  for (let i = 0; i < tekst.length; i++) {
    // is er ondertussen nieuwe tekst gestart, dan stoppen
    if (nummer !== typNummer) return;
    vraag.textContent += tekst[i];

    if (/[a-z0-9]/i.test(tekst[i]) && i % 2 === 0) {
      sansPraat();
    }
    await wacht(35);
  }
}

function wacht(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function willekeurig(lijst) {
  return lijst[Math.floor(Math.random() * lijst.length)];
}

// ===== het venster =====
function openVenster() {
  stopRonde();
  vraag.classList.remove("eng");
  keuzes.hidden = false;
  canvas.hidden = true;
  spelhulp.hidden = true;
  itemknop.hidden = true;
  eindknoppen.hidden = true;
  toonStatus();

  venster.showModal();
  neeknop.focus();
  typTekst("* Are you sure you want to continue?");
}

function sluitVenster() {
  stopRonde();
  typNummer++;
  if (venster.open) venster.close();
}

// Esc sluit het venster ook, dan moet het spel wel stoppen
venster.addEventListener("close", () => {
  stopRonde();
  typNummer++;
  venster.classList.remove("xp-moment");
});

// laat alleen de menu knoppen zien, het spel en de hulp gaan weg
function menuScherm() {
  stopRonde();
  vraag.classList.remove("eng");
  keuzes.hidden = true;
  canvas.hidden = true;
  spelhulp.hidden = true;
  itemknop.hidden = true;
  toonStatus();
}

// maakt de knoppen onderin, bijv de stages of opnieuw en stoppen
function toonKnoppen(lijst, focusOp = 0, alsLijst = false) {
  eindknoppen.replaceChildren();
  eindknoppen.classList.toggle("lijst", alsLijst);

  lijst.forEach((item) => {
    let knop = document.createElement("button");
    knop.type = "button";
    knop.className = "keuze";
    knop.textContent = item.tekst;
    knop.disabled = item.dicht === true;

    knop.addEventListener("click", () => {
      speelKlik();
      item.actie();
    });

    eindknoppen.append(knop);
  });

  eindknoppen.hidden = false;
  let focusKnop = eindknoppen.children[focusOp];
  if (focusKnop && !focusKnop.disabled) focusKnop.focus();
}

// met pijltjes tussen de knoppen, net als in undertale
[keuzes, eindknoppen].forEach((rij) => {
  rij.addEventListener("keydown", (e) => {
    // in het naam vakje gewoon typen
    if (e.target.tagName === "INPUT") return;

    let knoppen = [...rij.querySelectorAll("button:not(:disabled)")];
    let nu = knoppen.indexOf(document.activeElement);
    let stap = 0;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") stap = 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") stap = -1;

    if (stap !== 0 && knoppen.length) {
      e.preventDefault();
      knoppen[(nu + stap + knoppen.length) % knoppen.length].focus();
      piep(880, 0.04, 0.03);
    }

    // z is de ok knop in undertale
    if (e.key === "z" || e.key === "Z") {
      document.activeElement.click();
    }
  });
});

neeknop.addEventListener("click", async () => {
  speelKlik();
  keuzes.hidden = true;
  vraag.classList.add("eng");
  await typTekst("* ...wise choice.");
  await wacht(1200);
  sluitVenster();
});

jaknop.addEventListener("click", () => {
  speelKlik();
  hoofdmenu();
});

itemknop.addEventListener("click", () => gebruikItem());

// ===== hoofdmenu =====
function hoofdmenu() {
  menuScherm();
  let endlessOpen = voortgang.gehaald >= 2;

  toonKnoppen(
    [
      { tekst: "STAGES", actie: stagesMenu },
      { tekst: endlessOpen ? "ENDLESS" : "ENDLESS (haal stage 2)", actie: speelEndless, dicht: !endlessOpen },
      { tekst: "WINKEL", actie: winkel },
      { tekst: "SCORES", actie: scoresMenu },
      { tekst: "STOPPEN", actie: sluitVenster },
    ],
    0,
    true
  );

  typTekst(
    willekeurig([
      "* so. what'll it be, kid?",
      "* back for more, huh?",
      "* take your time. i've got all day.",
      "* the gold won't collect itself.",
    ])
  );
}

function sterrenTekst(n) {
  return "★".repeat(n) + "☆".repeat(3 - n);
}

function stagesMenu() {
  menuScherm();

  let lijst = stages.map((stage, i) => {
    let n = i + 1;
    // een stage is open als je de stage ervoor gehaald hebt
    let open = n <= voortgang.gehaald + 1;
    return {
      tekst: open ? "STAGE " + n + "  " + sterrenTekst(voortgang.sterren[n] || 0) : "STAGE " + n + "  LOCKED",
      actie: () => speelStage(n),
      dicht: !open,
    };
  });
  lijst.push({ tekst: "TERUG", actie: hoofdmenu });

  // focus op de hoogste stage die open is
  toonKnoppen(lijst, Math.min(voortgang.gehaald, stages.length - 1), true);
  typTekst("* pick a stage. no hits = 3 stars.");
}

// ===== spelen =====
function spelerOpties() {
  return {
    maxHp: maxHpNu(),
    snelheid: 1 + voortgang.upgrades.snelheid * 0.08,
    magneet: [0, 70, 130][voortgang.upgrades.magneet],
    taarten: voortgang.taarten,
    skin: voortgang.skin,
    naam: (voortgang.naam || "KHALID").toUpperCase(),
    level: voortgang.level,
    bijTaart: (over) => (itemknop.textContent = "TAART x" + over),
  };
}

function spelScherm() {
  keuzes.hidden = true;
  eindknoppen.hidden = true;
  canvas.hidden = false;
  spelhulp.hidden = false;
  itemknop.hidden = voortgang.taarten === 0;
  itemknop.textContent = "TAART x" + voortgang.taarten;
  toonStatus();
}

let huidigeStage = 1;

function speelStage(n) {
  huidigeStage = n;
  spelScherm();
  typTekst(stages[n - 1].intro);

  startRonde({
    ...spelerOpties(),
    modus: "stage",
    titel: "STAGE " + n,
    fases: stages[n - 1].fases,
    bijFase: (fase) => {
      if (fase.zeg) typTekst(fase.zeg);
    },
    bijEinde: naRonde,
  });
}

function speelEndless() {
  spelScherm();
  typTekst("* how long can you last?");
  vorigPatroon = "";

  startRonde({
    ...spelerOpties(),
    modus: "endless",
    titel: "ENDLESS",
    fases: [maakEndlessFase(0, 0)],
    maakFase: maakEndlessFase,
    bijEinde: naRonde,
  });
}

// ===== na een ronde =====
function naRonde(uitslag) {
  voortgang.taarten = uitslag.taartenOver;
  voortgang.goud += uitslag.goud;
  itemknop.hidden = true;
  spelhulp.hidden = true;
  bewaar();

  if (uitslag.modus === "endless") {
    endlessKlaar(uitslag);
  } else if (uitslag.gewonnen) {
    stageGehaald(uitslag);
  } else {
    stageVerloren(uitslag);
  }
}

async function stageVerloren(uitslag) {
  tekenGameOver();
  await typTekst(willekeurig(["* stay determined...", "* get dunked on. heh.", "* close one. try again?"]));
  if (!venster.open) return;

  toonStatus();
  toonKnoppen([
    { tekst: "OPNIEUW", actie: () => speelStage(huidigeStage) },
    { tekst: "STAGES", actie: stagesMenu },
    { tekst: "MENU", actie: hoofdmenu },
  ]);
}

async function stageGehaald(uitslag) {
  let n = huidigeStage;

  // sterren: gehaald = 1, max 2 keer geraakt = 2, niet geraakt = 3
  let sterren = 1 + (uitslag.geraakt <= 2 ? 1 : 0) + (uitslag.geraakt === 0 ? 1 : 0);
  let oudeSterren = voortgang.sterren[n] || 0;
  let nieuweSterren = Math.max(0, sterren - oudeSterren);
  voortgang.sterren[n] = Math.max(oudeSterren, sterren);

  let eersteKeer = n > voortgang.gehaald;
  if (eersteKeer) voortgang.gehaald = n;

  let bonus = 5 + n * 3;
  voortgang.goud += bonus;
  bewaar();

  let regels = ["SCORE " + uitslag.score, "GOUD +" + (uitslag.goud + bonus) + "   GRAZE " + uitslag.graze];

  // de sterren komen er 1 voor 1 bij
  for (let i = 0; i <= sterren; i++) {
    tekenUitslag("STAGE CLEAR!", sterren, i, regels);
    if (i > 0) piep(660 + i * 220, 0.12, 0.05);
    await wacht(350);
  }

  await typTekst(sterren === 3 ? "* not a scratch. impressive." : "* heh. not bad, kid.");
  await wacht(400);
  if (!venster.open) return;

  // de eerste keer veel xp, en elke nieuwe ster geeft nog wat extra
  let verdiend = (eersteKeer ? 30 + n * 15 : 10) + nieuweSterren * 10;
  await typTekst("* you got " + verdiend + " XP." + (nieuweSterren > 0 ? " new star!" : ""));
  await wacht(300);

  let oudLevel = voortgang.level;
  await geefXp(verdiend, spelerOpPagina());
  bewaar();
  if (!venster.open) return;

  if (voortgang.level > oudLevel) {
    await typTekst("* your LV increased. (LV " + voortgang.level + ", +4 max HP)");
  } else if (n === stages.length && eersteKeer) {
    await typTekst("* you beat all stages. endless is waiting.");
  }

  toonStatus();
  let lijst = [];
  if (n < stages.length) lijst.push({ tekst: "VOLGENDE STAGE", actie: () => speelStage(n + 1) });
  if (sterren < 3) lijst.push({ tekst: "OPNIEUW (★)", actie: () => speelStage(n) });
  lijst.push({ tekst: "STAGES", actie: stagesMenu }, { tekst: "MENU", actie: hoofdmenu });
  toonKnoppen(lijst);
}

async function endlessKlaar(uitslag) {
  tekenGameOver();
  let seconden = Math.floor(uitslag.tijd);
  await typTekst("* you lasted " + seconden + " seconds. score " + uitslag.score + ".");
  await wacht(400);
  if (!venster.open) return;

  // in de top 5? dan mag je je naam invullen
  let scores = voortgang.scores;
  if (scores.length < 5 || uitslag.score > scores[scores.length - 1].score) {
    await typTekst("* new high score! your name?");
    let naam = await vraagNaam();
    voortgang.naam = naam;
    scores.push({ naam, score: uitslag.score, tijd: seconden });
    scores.sort((a, b) => b.score - a.score);
    voortgang.scores = scores.slice(0, 5);
    bewaar();
  }

  let verdiend = Math.min(200, Math.floor(uitslag.score / 60));
  if (verdiend > 0) {
    await typTekst("* you got " + verdiend + " XP.");
    await wacht(300);
    let oudLevel = voortgang.level;
    await geefXp(verdiend, spelerOpPagina());
    bewaar();
    if (!venster.open) return;
    if (voortgang.level > oudLevel) {
      await typTekst("* your LV increased. (LV " + voortgang.level + ")");
    }
  }

  toonStatus();
  toonKnoppen([
    { tekst: "OPNIEUW", actie: speelEndless },
    { tekst: "SCORES", actie: scoresMenu },
    { tekst: "MENU", actie: hoofdmenu },
  ]);
}

// een klein formulier voor je naam, 3 letters zoals in een arcade
function vraagNaam() {
  return new Promise((klaar) => {
    eindknoppen.replaceChildren();
    eindknoppen.classList.remove("lijst");

    let form = document.createElement("form");
    form.className = "naamform";

    let label = document.createElement("label");
    label.htmlFor = "spelnaam";
    label.textContent = "NAAM";

    let invoer = document.createElement("input");
    invoer.id = "spelnaam";
    invoer.maxLength = 3;
    invoer.autocomplete = "off";
    invoer.value = voortgang.naam.slice(0, 3);

    let ok = document.createElement("button");
    ok.type = "submit";
    ok.className = "keuze";
    ok.textContent = "OK";

    form.append(label, invoer, ok);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      speelKlik();
      klaar(invoer.value.trim().toUpperCase().slice(0, 3) || "???");
    });

    eindknoppen.append(form);
    eindknoppen.hidden = false;
    invoer.focus();
  });
}

function scoresMenu() {
  menuScherm();

  let regels = voortgang.scores.map((s, i) => i + 1 + ".  " + s.naam.padEnd(3, " ") + "   " + s.score + "   (" + s.tijd + "s)");
  if (regels.length === 0) regels.push("nog geen scores. speel endless!");

  typNummer++;
  vraag.textContent = "* top 5 endless\n" + regels.join("\n");

  toonKnoppen([{ tekst: "TERUG", actie: hoofdmenu }]);
}

// ===== winkel =====
let winkelSpullen = [
  { id: "hp", naam: "MEER HP", prijzen: [25, 50, 80, 120], uitleg: "* +5 max HP. stacks." },
  { id: "snelheid", naam: "SNELLER", prijzen: [30, 60, 100], uitleg: "* move a bit faster." },
  { id: "magneet", naam: "MAGNEET", prijzen: [40, 90], uitleg: "* pulls gold to you." },
];

let zielen = [
  { id: "geel", naam: "GELE ZIEL", prijs: 60 },
  { id: "groen", naam: "GROENE ZIEL", prijs: 60 },
  { id: "paars", naam: "PAARSE ZIEL", prijs: 80 },
  { id: "regenboog", naam: "REGENBOOG ZIEL", prijs: 200 },
];

function winkel(focusOp = 0, tekst) {
  menuScherm();
  let lijst = [];

  winkelSpullen.forEach((ding) => {
    let lvl = voortgang.upgrades[ding.id];
    let max = lvl >= ding.prijzen.length;
    lijst.push({
      tekst: max ? ding.naam + "  MAX" : ding.naam + " " + (lvl + 1) + "/" + ding.prijzen.length + "  " + ding.prijzen[lvl] + "G",
      dicht: max,
      actie: () => koop(ding.prijzen[lvl], () => voortgang.upgrades[ding.id]++, ding.uitleg),
    });
  });

  let taartVol = voortgang.taarten >= 3;
  lijst.push({
    tekst: taartVol ? "TAART  VOL (3/3)" : "TAART " + voortgang.taarten + "/3  15G",
    dicht: taartVol,
    actie: () => koop(15, () => voortgang.taarten++, "* eat it in a fight with E. +10 HP."),
  });

  zielen.forEach((ziel) => {
    let heb = voortgang.skins.includes(ziel.id);
    let aan = voortgang.skin === ziel.id;
    lijst.push({
      tekst: aan ? ziel.naam + "  AAN" : heb ? ziel.naam + "  GEBRUIK" : ziel.naam + "  " + ziel.prijs + "G",
      dicht: aan,
      actie: () => {
        if (heb) {
          voortgang.skin = ziel.id;
          bewaar();
          winkel(0, "* looking good.");
        } else {
          koop(ziel.prijs, () => {
            voortgang.skins.push(ziel.id);
            voortgang.skin = ziel.id;
          }, "* a new soul. nice.");
        }
      },
    });
  });

  // terug naar je gewone rode ziel
  if (voortgang.skin !== "rood") {
    lijst.push({
      tekst: "RODE ZIEL  GEBRUIK",
      actie: () => {
        voortgang.skin = "rood";
        bewaar();
        winkel(0, "* classic.");
      },
    });
  }

  lijst.push({ tekst: "TERUG", actie: hoofdmenu });
  toonKnoppen(lijst, focusOp, true);
  typTekst(tekst || "* welcome to my shop. " + voortgang.goud + " G? let's see.");
}

function koop(prijs, geef, uitleg) {
  if (voortgang.goud < prijs) {
    piep(150, 0.15, 0.05);
    typTekst("* not enough G, kid. you need " + prijs + ".");
    return;
  }

  voortgang.goud -= prijs;
  geef();
  bewaar();
  piep(988, 0.05, 0.05);
  setTimeout(() => piep(1319, 0.15, 0.05), 70);
  winkel(0, uitleg);
}

// ===== xp geven met vliegende kristallen =====
toonXp();

function krijgXp(hoeveel) {
  voortgang.xp += hoeveel;

  // genoeg xp, dan level up en de rest gaat mee naar het volgende level
  while (voortgang.xp >= xpNodig(voortgang.level)) {
    voortgang.xp -= xpNodig(voortgang.level);
    voortgang.level++;
    levelOmhoog();
  }

  toonXp();

  // de balk even op laten lichten
  xpbalk.classList.remove("puls");
  void xpbalk.offsetWidth;
  xpbalk.classList.add("puls");
}

function levelOmhoog() {
  speelStuk(levelGeluid, levelGeluidStart, 2.4, levelVolume);

  let tekst = document.createElement("span");
  tekst.className = "levelup-tekst";
  tekst.textContent = "LEVEL UP!";
  tekst.setAttribute("aria-hidden", "true");
  tekst.addEventListener("animationend", () => tekst.remove());
  kaart.append(tekst);

  kaart.classList.remove("levelup");
  void kaart.offsetWidth;
  kaart.classList.add("levelup");

  xpmelding.textContent = "Level up! Je bent nu level " + voortgang.level;
}

async function geefXp(hoeveel, van) {
  xpmelding.textContent = "+" + hoeveel + " XP";

  // bij veel xp komen er veel meer kristallen die harder gloeien
  let veel = hoeveel >= 100;

  // de xp verdelen over de kristallen
  let aantal = veel ? Math.min(160, Math.round(hoeveel * 1.4)) : Math.min(60, Math.max(8, Math.round(hoeveel * 0.8)));
  let perKristal = Math.floor(hoeveel / aantal);
  let over = hoeveel % aantal;

  // geen animaties of geen popover support, dan gewoon de balk vullen
  if (rustig || typeof xplaag.showPopover !== "function") {
    speelStuk(xpGeluid, xpGeluidStart, 1.2, xpVolume);
    for (let i = 0; i < aantal; i++) {
      krijgXp(perKristal + (i < over ? 1 : 0));
      await wacht(20);
    }
    return;
  }

  // venster doorzichtig maken en de xp balk in beeld brengen
  venster.classList.add("xp-moment");
  xpbalk.scrollIntoView({ block: "center", behavior: "smooth" });
  await wacht(500);

  let doel = xpbalk.getBoundingClientRect();

  // de laag over het hele scherm zetten
  let dpr = window.devicePixelRatio || 1;
  xpcanvas.width = innerWidth * dpr;
  xpcanvas.height = innerHeight * dpr;
  xppen.setTransform(dpr, 0, 0, dpr, 0, 0);
  xplaag.showPopover();

  // eerst spatten ze uit elkaar, daarna worden ze naar de balk gezogen
  let kristallen = [];
  for (let i = 0; i < aantal; i++) {
    let hoek = Math.random() * Math.PI * 2;
    let afstand = (veel ? 60 : 50) + Math.random() * (veel ? 200 : 120);

    kristallen.push({
      spat: {
        x: van.x + Math.cos(hoek) * afstand,
        y: van.y + Math.sin(hoek) * afstand * 0.7 - 30,
      },
      doel: {
        x: doel.left + 4 + Math.random() * (doel.width - 8),
        y: doel.top + doel.height / 2,
      },
      vertrek: 0.4 + (i / aantal) * (veel ? 2.2 : 0.9) + Math.random() * 0.15,
      vliegtijd: 0.45 + Math.random() * 0.3,
      maat: (veel ? 3 : 2.5) + Math.random() * 3,
      gloed: veel ? 20 : 10,
      kleur: 70 + Math.random() * 45,
      fase: Math.random() * 10,
      xp: perKristal + (i < over ? 1 : 0),
      aangekomen: false,
    });
  }

  // het oppak geluid loopt van het eerste tot het laatste kristal
  // bij veel xp pak ik het einde van de mp3 waar je heel veel oppakt
  let eerste = Math.min(...kristallen.map((k) => k.vertrek + k.vliegtijd));
  let laatste = Math.max(...kristallen.map((k) => k.vertrek + k.vliegtijd));
  if (veel) {
    speelStuk(xpGeluid, xpGeluidEinde, Math.min(xpGeluidEindeDuur, laatste - eerste + 0.6), xpVolume, eerste);
  } else {
    speelStuk(xpGeluid, xpGeluidStart, laatste - eerste + 0.5, xpVolume, eerste);
  }

  let vonkjes = [];

  await new Promise((klaar) => {
    let begin = performance.now();
    let afgerond = false;

    // voor de zekerheid, als de animatie niet loopt krijg je de xp toch
    let noodstop = setTimeout(() => afronden(), (laatste + 2) * 1000);

    function afronden() {
      if (afgerond) return;
      afgerond = true;
      clearTimeout(noodstop);
      kristallen.forEach((k) => {
        if (!k.aangekomen) {
          k.aangekomen = true;
          krijgXp(k.xp);
        }
      });
      xppen.clearRect(0, 0, innerWidth, innerHeight);
      xplaag.hidePopover();
      klaar();
    }

    function kristalLus(nu) {
      if (afgerond) return;
      let t = (nu - begin) / 1000;
      xppen.clearRect(0, 0, innerWidth, innerHeight);

      kristallen.forEach((k) => {
        if (k.aangekomen) return;

        let pos;
        if (t < 0.4) {
          // uit elkaar spatten, snel en dan afremmen
          let p = 1 - Math.pow(1 - t / 0.4, 3);
          pos = mix(van, k.spat, p);
        } else if (t < k.vertrek) {
          // even zweven
          pos = { x: k.spat.x, y: k.spat.y + Math.sin(t * 6 + k.fase) * 3 };
        } else {
          // naar de balk gezogen worden, steeds sneller
          let p = Math.min(1, (t - k.vertrek) / k.vliegtijd);
          pos = mix(k.spat, k.doel, p * p * p);

          if (p >= 1) {
            k.aangekomen = true;
            krijgXp(k.xp);
            for (let v = 0; v < 3; v++) {
              vonkjes.push({
                x: k.doel.x,
                y: k.doel.y,
                vx: (Math.random() - 0.5) * 120,
                vy: -40 - Math.random() * 90,
                leven: 0.35,
              });
            }
            return;
          }
        }

        tekenKristal(pos.x, pos.y, k, t);
      });

      // kleine vonkjes bij de balk
      vonkjes.forEach((v) => {
        v.leven -= 1 / 60;
        v.x += v.vx / 60;
        v.y += v.vy / 60;
        v.vy += 4;
      });
      vonkjes = vonkjes.filter((v) => v.leven > 0);
      vonkjes.forEach((v) => {
        xppen.globalAlpha = v.leven / 0.35;
        xppen.fillStyle = "#f4ffd0";
        xppen.fillRect(v.x - 1, v.y - 1, 2, 2);
      });
      xppen.globalAlpha = 1;

      if (kristallen.every((k) => k.aangekomen) && vonkjes.length === 0) {
        afronden();
      } else {
        requestAnimationFrame(kristalLus);
      }
    }

    requestAnimationFrame(kristalLus);
  });

  await wacht(300);
  venster.classList.remove("xp-moment");
  await wacht(300);
}

function mix(a, b, p) {
  return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p };
}

// een klein glinsterend kristalletje, een ruitje met een wit randje
function tekenKristal(x, y, k, t) {
  let glinster = 0.75 + 0.45 * Math.abs(Math.sin(t * 14 + k.fase));
  let m = k.maat * glinster;

  xppen.save();
  xppen.translate(x, y);
  xppen.shadowColor = "hsl(" + k.kleur + ", 100%, 60%)";
  xppen.shadowBlur = k.gloed * glinster;

  xppen.fillStyle = "hsl(" + k.kleur + ", 100%, 55%)";
  xppen.beginPath();
  xppen.moveTo(0, -m * 1.4);
  xppen.lineTo(m, 0);
  xppen.lineTo(0, m * 1.4);
  xppen.lineTo(-m, 0);
  xppen.closePath();
  xppen.fill();

  // wit glimmetje in het midden
  xppen.shadowBlur = 0;
  xppen.fillStyle = "rgba(255, 255, 255, 0.85)";
  xppen.fillRect(-m * 0.3, -m * 0.5, m * 0.5, m * 0.6);
  xppen.restore();
}
