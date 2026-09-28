// ===== de game zelf: hartje, botten, blasters en munten =====
// minigame.js regelt de menu's en de voortgang, dit bestand doet alleen het spelen
// alles draait om een lijst "spelers", nu is dat er 1 maar later kan er makkelijk een 2e bij (multiplayer)

let canvas = document.getElementById("spelveld");
let pen = canvas.getContext("2d");
let breed = canvas.width;
let hoog = canvas.height;

// het pixel hartje, X is gekleurd
let hartPixels = [
  ".XX.XX.",
  "XXXXXXX",
  "XXXXXXX",
  ".XXXXX.",
  "..XXX..",
  "...X...",
];
let pixel = 2.4;
let hartMaat = 7 * pixel;

// kleuren van de ziel, regenboog verandert steeds
let zielKleuren = {
  rood: "#ff0000",
  geel: "#ffe14d",
  groen: "#39ff5a",
  paars: "#c04cff",
  blauw: "#2a6bff",
};

let botKleuren = {
  wit: "white",
  blauw: "#3ff4ff",
  oranje: "#ffa62b",
};

// welke toetsen wat doen, bij multiplayer krijgt elke speler zijn eigen rijtje
let besturing = {
  links: ["arrowleft", "a"],
  rechts: ["arrowright", "d"],
  op: ["arrowup", "w", " "],
  neer: ["arrowdown", "s"],
  item: ["e", "x"],
};

let toetsen = {};
let vinger = null;
let ronde = null;
let frame;
let vorigeTijd;

// ===== een ronde starten en stoppen =====
// opties: modus, titel, fases, maxHp, snelheid, magneet, taarten, skin, naam, level, maakFase, bijFase, bijTaart, bijEinde
function startRonde(opties) {
  ronde = {
    opties,
    tijd: 0,
    intro: 1.4,
    fases: opties.fases.slice(),
    faseNr: -1,
    fase: null,
    faseTijd: 0,
    totaal: opties.fases.reduce((som, f) => som + f.duur, 0),
    vak: { x: 90, y: 60, b: 300, h: 180 },
    vakDoel: { b: 300, h: 180 },
    spelers: [maakSpeler(opties)],
    kogels: [],
    munten: [],
    deeltjes: [],
    teksten: [],
    score: 0,
    multiplier: 1,
    graze: 0,
    goud: 0,
    geraakt: 0,
    muntTimer: 1.5,
    taartTimer: 25,
    schudden: 0,
    flits: 0,
    pauze: false,
    stervend: 0,
    klaar: false,
  };

  toetsen = {};
  vinger = null;
  canvas.focus();

  vorigeTijd = performance.now();
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(spelLus);
}

function stopRonde() {
  if (ronde) ronde.klaar = true;
  cancelAnimationFrame(frame);
}

function rondeBezig() {
  return ronde !== null && !ronde.klaar;
}

function maakSpeler(opties) {
  return {
    x: breed / 2 - hartMaat / 2,
    y: 150 - hartMaat / 2,
    vy: 0,
    hp: opties.maxHp,
    maxHp: opties.maxHp,
    snelheid: 150 * opties.snelheid,
    magneet: opties.magneet,
    taarten: opties.taarten,
    taartKlaar: 0,
    skin: opties.skin,
    modus: "rood",
    opGrond: false,
    bewoog: false,
    onkwetsbaar: 0,
    knoppen: besturing,
    spoor: [],
    dood: false,
  };
}

function spelLus(nu) {
  if (!rondeBezig()) return;

  // dt is de tijd sinds de vorige frame, max 0.05 zodat niks door een bot heen springt
  let dt = Math.min((nu - vorigeTijd) / 1000, 0.05);
  vorigeTijd = nu;

  if (!ronde.pauze) update(dt);
  teken();

  if (rondeBezig()) {
    frame = requestAnimationFrame(spelLus);
  }
}

function eindeRonde(gewonnen) {
  let r = ronde;
  r.klaar = true;
  cancelAnimationFrame(frame);

  r.opties.bijEinde({
    gewonnen,
    modus: r.opties.modus,
    tijd: r.tijd,
    score: Math.round(r.score),
    goud: r.goud,
    geraakt: r.geraakt,
    graze: r.graze,
    taartenOver: r.spelers[0].taarten,
  });
}

// ===== alles bijwerken =====
function update(dt) {
  let r = ronde;
  r.schudden = Math.max(0, r.schudden - dt);
  r.flits = Math.max(0, r.flits - dt);

  // het vak groeit of krimpt rustig naar de maat van de aanval, net als bij sans
  r.vak.b += (r.vakDoel.b - r.vak.b) * Math.min(1, dt * 6);
  r.vak.h += (r.vakDoel.h - r.vak.h) * Math.min(1, dt * 6);
  r.vak.x = breed / 2 - r.vak.b / 2;
  r.vak.y = 150 - r.vak.h / 2;

  updateDeeltjes(dt);

  // hartje is kapot, even de animatie afspelen en dan game over
  if (r.stervend > 0) {
    let voor = r.stervend;
    r.stervend -= dt;
    if (voor > 0.9 && r.stervend <= 0.9) hartSpat();
    if (r.stervend <= 0) eindeRonde(false);
    return;
  }

  r.spelers.forEach((s) => beweegSpeler(s, dt));

  if (r.intro > 0) {
    r.intro -= dt;
    return;
  }

  r.tijd += dt;
  r.faseTijd += dt;
  if (!r.fase || r.faseTijd >= r.fase.duur) {
    volgendeFase();
    if (r.klaar) return;
  }

  patronen[r.fase.patroon].update(r.fase, dt);

  beweegKogels(dt);
  updateMunten(dt);
  checkRaak();

  // elke seconde dat je leeft is punten, keer je multiplier
  r.score += dt * 10 * r.multiplier;

  if (r.spelers.every((s) => s.dood)) {
    r.stervend = 1.4;
    piep(220, 0.12, 0.08);
  }
}

function volgendeFase() {
  let r = ronde;
  r.faseNr++;

  if (r.faseNr >= r.fases.length) {
    // endless gaat altijd door, een stage is klaar
    if (r.opties.modus === "endless") {
      r.fases.push(r.opties.maakFase(r.faseNr, r.tijd));
    } else {
      eindeRonde(true);
      return;
    }
  }

  // een kopie, dan begint elke fase met een schone lei
  r.fase = { ...r.fases[r.faseNr] };
  r.faseTijd = 0;

  // na een zwaartekracht aanval ben je weer gewoon rood
  r.spelers.forEach((s) => {
    s.modus = "rood";
    s.vy = 0;
  });

  let patroon = patronen[r.fase.patroon];
  r.vakDoel = { b: patroon.vak[0], h: patroon.vak[1] };
  patroon.start(r.fase);

  if (r.opties.bijFase) r.opties.bijFase(r.fase);
}

function ingedrukt(speler, actie) {
  return speler.knoppen[actie].some((t) => toetsen[t]);
}

function beweegSpeler(s, dt) {
  if (s.dood) return;

  s.onkwetsbaar = Math.max(0, s.onkwetsbaar - dt);
  s.taartKlaar = Math.max(0, s.taartKlaar - dt);

  let dx = 0;
  let dy = 0;
  if (ingedrukt(s, "links")) dx -= 1;
  if (ingedrukt(s, "rechts")) dx += 1;
  if (ingedrukt(s, "op")) dy -= 1;
  if (ingedrukt(s, "neer")) dy += 1;

  // op je telefoon gaat het hartje naar je vinger toe
  if (vinger && s === ronde.spelers[0]) {
    let vx = vinger.x - (s.x + hartMaat / 2);
    let vy = vinger.y - (s.y + hartMaat / 2);
    let afstand = Math.hypot(vx, vy);
    if (afstand > 3) {
      dx = vx / afstand;
      dy = s.modus === "blauw" ? (vy < -20 ? -1 : 0) : vy / afstand;
    }
  }

  let oudX = s.x;
  let oudY = s.y;
  let v = ronde.vak;

  if (s.modus === "blauw") {
    // blauwe ziel: zwaartekracht, springen met omhoog
    s.x += Math.sign(dx) * s.snelheid * dt;
    let springen = dy < 0;

    if (springen && s.opGrond) {
      s.vy = -370;
      s.opGrond = false;
      piep(520, 0.05, 0.03);
    }
    // loslaten = korter springen
    if (!springen && s.vy < -140) s.vy = -140;

    s.vy += 950 * dt;
    s.y += s.vy * dt;
  } else {
    // schuin gaat even snel als recht
    if (dx && dy && !vinger) {
      dx *= 0.7071;
      dy *= 0.7071;
    }
    s.x += dx * s.snelheid * dt;
    s.y += dy * s.snelheid * dt;
  }

  // binnen het vak blijven
  s.x = Math.min(Math.max(s.x, v.x + 4), v.x + v.b - 4 - hartMaat);
  let bodem = v.y + v.h - 4 - hartMaat;
  s.opGrond = false;
  if (s.y >= bodem) {
    s.y = bodem;
    if (s.modus === "blauw") {
      s.vy = 0;
      s.opGrond = true;
    }
  }
  if (s.y < v.y + 4) {
    s.y = v.y + 4;
    s.vy = Math.max(0, s.vy);
  }

  s.bewoog = Math.abs(s.x - oudX) > 0.05 || Math.abs(s.y - oudY) > 0.05;

  // spoor achter het hartje voor de regenboog ziel
  s.spoor.push({ x: s.x, y: s.y });
  if (s.spoor.length > 12) s.spoor.shift();

  if (ingedrukt(s, "item")) eetTaart(s);
}

function eetTaart(s) {
  if (!s || s.dood || s.taarten <= 0 || s.taartKlaar > 0 || s.hp >= s.maxHp) return;

  s.taarten--;
  s.taartKlaar = 1;
  s.hp = Math.min(s.maxHp, s.hp + 10);
  zweefTekst("+10 HP", s.x, s.y - 6, "#39ff5a");
  piep(660, 0.08, 0.05);
  setTimeout(() => piep(990, 0.12, 0.05), 80);

  if (ronde.opties.bijTaart) ronde.opties.bijTaart(s.taarten);
}

// voor de taart knop op je telefoon
function gebruikItem() {
  if (rondeBezig()) eetTaart(ronde.spelers[0]);
}

// ===== de aanvallen =====
// elke aanval heeft een vak maat, een start en een update
// "niv" is hoe moeilijk, 1 is makkelijk en 3 is heel moeilijk
function maakBot(x, y, b, h, vx, vy, kleur = "wit") {
  ronde.kogels.push({ soort: "bot", x, y, b, h, vx, vy, kleur, schade: 3, gegraasd: new Set() });
}

function sneller(f, basis, extra = 0.3) {
  return basis * (1 + (f.niv - 1) * extra);
}

let patronen = {
  // muur met een gat erin, soms een blauwe of oranje bot
  muur: {
    vak: [300, 180],
    start(f) {
      f.t = 0.5;
    },
    update(f, dt) {
      f.t -= dt;
      if (f.t > 0) return;
      f.t = Math.max(0.42, 1.1 - (f.niv - 1) * 0.25);

      let v = ronde.vak;
      let links = Math.random() < 0.5;
      let vx = sneller(f, 130) * (links ? 1 : -1);
      let x = links ? v.x - 12 : v.x + v.b + 2;
      let kans = Math.random();

      if (f.blauw && kans < f.blauw) {
        maakBot(x, v.y, 10, v.h, vx * 0.85, 0, "blauw");
        return;
      }
      if (f.oranje && kans < (f.blauw || 0) + f.oranje) {
        maakBot(x, v.y, 10, v.h, vx * 0.85, 0, "oranje");
        return;
      }

      let gat = Math.max(38, 70 - (f.niv - 1) * 12);
      let gatY = v.y + 16 + Math.random() * (v.h - 32 - gat);
      maakBot(x, v.y, 10, gatY - v.y, vx, 0);
      maakBot(x, gatY + gat, 10, v.y + v.h - gatY - gat, vx, 0);
    },
  },

  // een slang van botten, je moet het gat volgen
  golf: {
    vak: [320, 170],
    start(f) {
      f.t = 0;
      f.hoek = Math.random() * 6;
      f.links = Math.random() < 0.5;
    },
    update(f, dt) {
      f.t -= dt;
      if (f.t > 0) return;

      let v = ronde.vak;
      let snelheid = sneller(f, 120, 0.25);
      f.t = 16 / snelheid;
      f.hoek += 0.16 * (1 + (f.niv - 1) * 0.35);

      let gat = Math.max(44, 64 - (f.niv - 1) * 10);
      let midden = v.y + v.h / 2 + Math.sin(f.hoek) * (v.h / 2 - gat / 2 - 10);
      let x = f.links ? v.x - 12 : v.x + v.b + 2;
      let vx = f.links ? snelheid : -snelheid;

      maakBot(x, v.y, 10, midden - gat / 2 - v.y, vx, 0);
      maakBot(x, midden + gat / 2, 10, v.y + v.h - midden - gat / 2, vx, 0);
    },
  },

  // botten die uit de lucht vallen
  regen: {
    vak: [260, 200],
    start(f) {
      f.t = 0.3;
    },
    update(f, dt) {
      f.t -= dt;
      if (f.t > 0) return;
      f.t = Math.max(0.12, 0.38 - (f.niv - 1) * 0.12);

      let v = ronde.vak;
      let h = 24 + Math.random() * 36;
      let x = v.x + 6 + Math.random() * (v.b - 22);
      let vy = (150 + Math.random() * 60) * (1 + (f.niv - 1) * 0.3);
      let kleur = f.blauw && Math.random() < f.blauw ? "blauw" : "wit";
      maakBot(x, v.y - h, 10, h, 0, vy, kleur);
    },
  },

  // eerst een rode waarschuwing, dan schieten er botten uit de grond
  spikes: {
    vak: [320, 170],
    start(f) {
      f.t = 0.4;
    },
    update(f, dt) {
      f.t -= dt;
      if (f.t > 0) return;
      f.t = Math.max(0.7, 1.5 - (f.niv - 1) * 0.35);

      let v = ronde.vak;
      let b = 60 + Math.random() * 50;
      let s = levendeSpeler();

      // de helft van de keren mikt hij op jou, dus stilstaan werkt niet
      let x = Math.random() < 0.5 && s ? s.x + hartMaat / 2 - b / 2 : v.x + Math.random() * (v.b - b);
      x = Math.min(Math.max(x, v.x + 4), v.x + v.b - 4 - b);

      ronde.kogels.push({
        soort: "waarschuwing",
        x,
        b,
        tijd: Math.max(0.4, 0.75 - (f.niv - 1) * 0.12),
        snelheid: sneller(f, 520, 0.2),
      });
      piep(900, 0.05, 0.02);
    },
  },

  // gaster blasters, eerst mikken en dan een dikke straal
  blaster: {
    vak: [300, 200],
    start(f) {
      f.t = 0.6;
    },
    update(f, dt) {
      f.t -= dt;
      if (f.t > 0) return;
      f.t = Math.max(0.75, 1.7 - (f.niv - 1) * 0.4);

      let aantal = f.niv >= 1.8 ? 2 : 1;
      for (let i = 0; i < aantal; i++) maakBlaster(f.niv, i * 0.3);
    },
  },

  // blauwe ziel, je valt naar beneden en moet over botten springen
  zwaartekracht: {
    vak: [340, 130],
    start(f) {
      f.t = 1;
      ronde.spelers.forEach((s) => {
        s.modus = "blauw";
        s.vy = 400;
      });
      piep(180, 0.2, 0.06);
    },
    update(f, dt) {
      f.t -= dt;
      if (f.t > 0) return;
      f.t = Math.max(0.55, 1.05 - (f.niv - 1) * 0.25) + Math.random() * 0.3;

      let v = ronde.vak;
      let links = Math.random() < 0.5;
      let vx = sneller(f, 150, 0.25) * (links ? 1 : -1);
      let x = links ? v.x - 12 : v.x + v.b + 2;

      if (Math.random() < 0.25) {
        // lange bot van boven, dus NIET springen
        maakBot(x, v.y, 10, v.h - 40, vx, 0);
      } else {
        let h = 18 + Math.random() * (24 + f.niv * 6);
        maakBot(x, v.y + v.h - h, 10, h, vx, 0);

        // soms twee achter elkaar
        if (f.niv > 1.3 && Math.random() < 0.35) {
          maakBot(x + (links ? -70 : 70), v.y + v.h - h, 10, h, vx, 0);
        }
      }
    },
  },
};

function levendeSpeler() {
  return ronde.spelers.find((s) => !s.dood);
}

function maakBlaster(niv, vertraging) {
  let s = levendeSpeler();
  if (!s) return;

  // ergens rondom het vak, gericht op waar jij nu staat
  let hoek = Math.random() * Math.PI * 2;
  let x = breed / 2 + Math.cos(hoek) * 200;
  let y = 150 + Math.sin(hoek) * 125;
  x = Math.min(Math.max(x, 24), breed - 24);
  // niet over de hp balk onderin
  y = Math.min(Math.max(y, 24), 258);

  let doelX = s.x + hartMaat / 2;
  let doelY = s.y + hartMaat / 2;

  ronde.kogels.push({
    soort: "blaster",
    x,
    y,
    hoek: Math.atan2(doelY - y, doelX - x),
    wacht: vertraging,
    laden: Math.max(0.45, 0.8 - (niv - 1) * 0.15),
    vuur: 0.35,
    weg: 0.25,
    binnen: 0,
    breedte: 26,
    schade: 5,
    gegraasd: new Set(),
    geladen: false,
    gevuurd: false,
  });
}

function beweegKogels(dt) {
  let r = ronde;
  let v = r.vak;
  let nieuw = [];

  r.kogels.forEach((k) => {
    if (k.soort === "bot") {
      k.x += k.vx * dt;
      k.y += k.vy * dt;
    }

    if (k.soort === "waarschuwing") {
      k.tijd -= dt;
      if (k.tijd <= 0) {
        k.weg = true;
        // botten schieten omhoog uit de grond
        for (let bx = k.x; bx < k.x + k.b - 6; bx += 14) {
          nieuw.push({ soort: "bot", x: bx, y: v.y + v.h, b: 10, h: 70, vx: 0, vy: -k.snelheid, kleur: "wit", schade: 3, gegraasd: new Set() });
        }
        ruis(0.15, 0.12, 2500);
      }
    }

    if (k.soort === "blaster") {
      if (k.wacht > 0) {
        k.wacht -= dt;
        return;
      }
      k.binnen = Math.min(1, k.binnen + dt * 5);

      if (k.laden > 0) {
        if (!k.geladen) {
          k.geladen = true;
          sweep(200, 900, k.laden, 0.03);
        }
        k.laden -= dt;
      } else if (k.vuur > 0) {
        if (!k.gevuurd) {
          k.gevuurd = true;
          ruis(0.4, 0.2, 900);
          r.schudden = Math.max(r.schudden, 0.15);
        }
        k.vuur -= dt;
      } else {
        k.weg -= dt;
        if (k.weg <= 0) k.klaar = true;
      }
    }
  });

  r.kogels.push(...nieuw);

  // alles wat uit beeld is weggooien
  r.kogels = r.kogels.filter((k) => {
    if (k.soort === "waarschuwing") return !k.weg;
    if (k.soort === "blaster") return !k.klaar;
    return k.x > v.x - 90 && k.x < v.x + v.b + 90 && k.y < v.y + v.h + 90 && k.y + k.h > v.y - 90;
  });
}

// ===== munten en taartjes om op te pakken =====
function updateMunten(dt) {
  let r = ronde;
  let v = r.vak;

  r.muntTimer -= dt;
  if (r.muntTimer <= 0 && r.munten.length < 3) {
    r.muntTimer = 2.2 + Math.random() * 1.5;
    let blauw = r.spelers.some((s) => s.modus === "blauw");
    r.munten.push({
      soort: "munt",
      x: v.x + 14 + Math.random() * (v.b - 28),
      y: blauw ? v.y + v.h - 16 - Math.random() * 50 : v.y + 14 + Math.random() * (v.h - 28),
      waarde: Math.random() < 0.2 ? 3 : 1,
      leven: 5,
    });
  }

  // in endless komt er af en toe een taartje dat je heelt
  if (r.opties.modus === "endless") {
    r.taartTimer -= dt;
    if (r.taartTimer <= 0) {
      r.taartTimer = 22;
      r.munten.push({ soort: "taart", x: v.x + v.b / 2, y: v.y + v.h / 2, leven: 6 });
    }
  }

  r.munten.forEach((m) => {
    m.leven -= dt;

    // binnen het vak blijven als het vak kleiner wordt
    m.x = Math.min(Math.max(m.x, v.x + 10), v.x + v.b - 10);
    m.y = Math.min(Math.max(m.y, v.y + 10), v.y + v.h - 10);

    r.spelers.forEach((s) => {
      if (s.dood || m.leven <= 0) return;
      let sx = s.x + hartMaat / 2;
      let sy = s.y + hartMaat / 2;
      let afstand = Math.hypot(sx - m.x, sy - m.y);

      // magneet trekt munten naar je toe
      if (m.soort === "munt" && s.magneet > 0 && afstand < s.magneet) {
        m.x += ((sx - m.x) / afstand) * 220 * dt;
        m.y += ((sy - m.y) / afstand) * 220 * dt;
      }

      if (afstand < 15) {
        m.leven = 0;
        if (m.soort === "munt") {
          r.goud += m.waarde;
          r.score += 25 * r.multiplier;
          zweefTekst("+" + m.waarde + "G", m.x, m.y, "#ffe14d");
          piep(988, 0.05, 0.04);
          setTimeout(() => piep(1319, 0.12, 0.04), 60);
        } else {
          s.hp = Math.min(s.maxHp, s.hp + 8);
          zweefTekst("+8 HP", m.x, m.y, "#39ff5a");
          piep(660, 0.1, 0.05);
        }
      }
    });
  });

  r.munten = r.munten.filter((m) => m.leven > 0);
}

// ===== geraakt of net niet (graze) =====
function overlapt(a, b) {
  return a.x < b.x + b.b && a.x + a.b > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// hoe ver je van de straal van een blaster af zit
function afstandTotStraal(s, k) {
  let px = s.x + hartMaat / 2 - k.x;
  let py = s.y + hartMaat / 2 - k.y;
  let langs = px * Math.cos(k.hoek) + py * Math.sin(k.hoek);
  let dwars = Math.abs(-px * Math.sin(k.hoek) + py * Math.cos(k.hoek));
  return { voor: langs > 0, dwars };
}

function checkRaak() {
  let r = ronde;

  r.spelers.forEach((s) => {
    if (s.dood) return;

    // de hitbox is iets kleiner dan het hartje, dat voelt eerlijker
    let hitbox = { x: s.x + 3, y: s.y + 3, b: hartMaat - 6, h: hartMaat - 6 };
    let graasZone = { x: s.x - 7, y: s.y - 7, b: hartMaat + 14, h: hartMaat + 14 };

    r.kogels.forEach((k) => {
      if (k.soort === "bot") {
        // blauw doet pijn als je beweegt, oranje als je stilstaat
        let pijn = k.kleur === "wit" || (k.kleur === "blauw" && s.bewoog) || (k.kleur === "oranje" && !s.bewoog);

        if (pijn && overlapt(hitbox, k)) {
          raak(s, k.schade);
        } else if (!k.gegraasd.has(s) && overlapt(graasZone, k)) {
          graze(s, k);
        }
      }

      if (k.soort === "blaster" && k.wacht <= 0 && k.laden <= 0 && k.vuur > 0) {
        let straal = afstandTotStraal(s, k);
        if (straal.voor && straal.dwars < k.breedte / 2) {
          raak(s, k.schade);
        } else if (straal.voor && straal.dwars < k.breedte / 2 + 16 && !k.gegraasd.has(s)) {
          graze(s, k);
        }
      }
    });
  });
}

function raak(s, schade) {
  if (s.onkwetsbaar > 0) return;
  let r = ronde;

  s.hp = Math.max(0, s.hp - schade);
  s.onkwetsbaar = 1;
  r.geraakt++;
  r.multiplier = 1;
  r.schudden = 0.25;
  r.flits = 0.12;
  piep(110, 0.15, 0.08);

  scherven(s.x + hartMaat / 2, s.y + hartMaat / 2, "#ff4040", 6);
  if (s.hp <= 0) s.dood = true;
}

// net langs een aanval = graze, dat geeft punten en je multiplier gaat omhoog
function graze(s, k) {
  let r = ronde;
  k.gegraasd.add(s);
  r.graze++;
  r.multiplier = Math.min(5, r.multiplier + 0.1);
  r.score += 5 * r.multiplier;
  piep(1400 + r.multiplier * 120, 0.03, 0.02);

  for (let i = 0; i < 3; i++) {
    r.deeltjes.push({
      x: s.x + hartMaat / 2,
      y: s.y + hartMaat / 2,
      vx: (Math.random() - 0.5) * 140,
      vy: (Math.random() - 0.5) * 140,
      leven: 0.3,
      max: 0.3,
      kleur: "white",
      maat: 2,
    });
  }
}

// ===== deeltjes en zwevende tekst =====
function scherven(x, y, kleur, aantal) {
  for (let i = 0; i < aantal; i++) {
    ronde.deeltjes.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 220,
      vy: -60 - Math.random() * 160,
      zwaar: true,
      leven: 0.9,
      max: 0.9,
      kleur,
      maat: 3,
    });
  }
}

function zweefTekst(tekst, x, y, kleur) {
  ronde.teksten.push({ tekst, x, y, kleur, leven: 0.9 });
}

function updateDeeltjes(dt) {
  let r = ronde;
  r.deeltjes.forEach((d) => {
    d.leven -= dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    if (d.zwaar) d.vy += 500 * dt;
  });
  r.deeltjes = r.deeltjes.filter((d) => d.leven > 0);

  r.teksten.forEach((t) => {
    t.leven -= dt;
    t.y -= 30 * dt;
  });
  r.teksten = r.teksten.filter((t) => t.leven > 0);
}

// het hartje breekt in stukjes, net als in undertale
function hartSpat() {
  ruis(0.3, 0.15, 1500);
  ronde.spelers.forEach((s) => scherven(s.x + hartMaat / 2, s.y + hartMaat / 2, zielKleur(s), 8));
}

// ===== tekenen =====
function zielKleur(s) {
  if (s.modus === "blauw") return zielKleuren.blauw;
  if (s.skin === "regenboog") return "hsl(" + ((performance.now() / 6) % 360) + ", 100%, 60%)";
  return zielKleuren[s.skin] || zielKleuren.rood;
}

function teken() {
  let r = ronde;
  pen.save();
  pen.fillStyle = "black";
  pen.fillRect(0, 0, breed, hoog);

  if (r.schudden > 0) {
    pen.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
  }

  if (r.stervend > 0) {
    tekenSterven();
    pen.restore();
    return;
  }

  tekenBovenbalk();

  // het witte vak
  let v = r.vak;
  pen.strokeStyle = "white";
  pen.lineWidth = 4;
  pen.strokeRect(v.x, v.y, v.b, v.h);

  // alleen in het vak tekenen, dan komen botten er niet overheen
  pen.save();
  pen.beginPath();
  pen.rect(v.x + 2, v.y + 2, v.b - 4, v.h - 4);
  pen.clip();
  r.kogels.forEach((k) => {
    if (k.soort === "bot") tekenBot(k);
    if (k.soort === "waarschuwing") tekenWaarschuwing(k);
  });
  r.munten.forEach(tekenMunt);
  pen.restore();

  // blasters mogen buiten het vak
  r.kogels.forEach((k) => {
    if (k.soort === "blaster") tekenBlaster(k);
  });

  tekenDeeltjes();
  r.spelers.forEach(tekenSpeler);

  r.teksten.forEach((t) => {
    pen.globalAlpha = Math.min(1, t.leven / 0.4);
    pen.fillStyle = t.kleur;
    pen.font = '16px "sans", monospace';
    pen.textAlign = "center";
    pen.fillText(t.tekst, t.x, t.y);
  });
  pen.globalAlpha = 1;

  tekenOnderbalk();

  if (r.intro > 0) {
    groteTekst(r.intro > 0.5 ? "READY?" : "GO!", 150, r.intro > 0.5 ? "white" : "#ffe14d");
  }

  if (r.pauze) {
    pen.fillStyle = "rgba(0, 0, 0, 0.7)";
    pen.fillRect(0, 0, breed, hoog);
    groteTekst("PAUZE", 150, "white");
    kleineTekst("druk op P om verder te gaan", 185);
  }

  if (r.flits > 0) {
    pen.fillStyle = "rgba(255, 0, 0, " + r.flits * 2 + ")";
    pen.fillRect(0, 0, breed, hoog);
  }

  pen.restore();
}

function groteTekst(tekst, y, kleur) {
  pen.fillStyle = kleur;
  pen.textAlign = "center";
  pen.font = '40px "MonsterFriendFont", monospace';
  pen.fillText(tekst, breed / 2, y);
}

function kleineTekst(tekst, y, kleur = "white") {
  pen.fillStyle = kleur;
  pen.textAlign = "center";
  pen.font = '18px "sans", monospace';
  pen.fillText(tekst, breed / 2, y);
}

function tekenBovenbalk() {
  let r = ronde;
  pen.font = '18px "sans", monospace';
  pen.fillStyle = "white";

  pen.textAlign = "left";
  pen.fillText(r.opties.titel, 16, 30);

  pen.textAlign = "center";
  if (r.opties.modus === "endless") {
    pen.fillText(Math.floor(r.tijd) + "s", breed / 2, 30);
  } else {
    pen.fillText("nog " + Math.ceil(Math.max(0, r.totaal - r.tijd)) + "s", breed / 2, 30);
  }

  pen.textAlign = "right";
  pen.fillText("SCORE " + Math.round(r.score), breed - 16, 30);
  if (r.multiplier > 1.01) {
    pen.fillStyle = r.multiplier >= 3 ? "#ff4dff" : "#ffe14d";
    pen.fillText("x" + r.multiplier.toFixed(1), breed - 16, 50);
  }
}

function tekenOnderbalk() {
  let r = ronde;
  let s = r.spelers[0];
  let y = 290;

  pen.font = '18px "sans", monospace';
  pen.textAlign = "left";
  pen.fillStyle = "white";
  pen.fillText(r.opties.naam + "  LV " + r.opties.level, 16, y);

  // de hp balk wordt langer als je meer max hp hebt, net als in undertale
  let balkX = 190;
  let balkB = Math.min(150, s.maxHp * 1.5);
  pen.fillText("HP", 160, y);
  pen.fillStyle = "#b00000";
  pen.fillRect(balkX, y - 15, balkB, 17);
  pen.fillStyle = "#ffe14d";
  pen.fillRect(balkX, y - 15, balkB * (s.hp / s.maxHp), 17);
  pen.fillStyle = "white";
  pen.fillText(s.hp + " / " + s.maxHp, balkX + balkB + 10, y);

  let y2 = 320;
  pen.fillStyle = "#ffe14d";
  pen.fillText(r.goud + " G", 16, y2);
  pen.fillStyle = "white";
  pen.fillText("GRAZE " + r.graze, 110, y2);

  if (s.taarten > 0) {
    tekenTaartje(250, y2 - 12);
    pen.fillStyle = "white";
    pen.fillText("x" + s.taarten + " (E)", 268, y2);
  }
}

function tekenBot(k) {
  pen.fillStyle = botKleuren[k.kleur];

  if (k.h < 14) {
    pen.fillRect(k.x, k.y, k.b, k.h);
    return;
  }
  // het stokje
  pen.fillRect(k.x + 2, k.y + 4, k.b - 4, k.h - 8);
  // de knobbels aan de uiteinden
  pen.fillRect(k.x, k.y, k.b, 6);
  pen.fillRect(k.x, k.y + k.h - 6, k.b, 6);
}

function tekenWaarschuwing(k) {
  let v = ronde.vak;
  let knipper = Math.floor(k.tijd * 14) % 2 === 0;
  pen.fillStyle = knipper ? "rgba(255, 40, 40, 0.45)" : "rgba(255, 40, 40, 0.2)";
  pen.fillRect(k.x, v.y + v.h - 30, k.b, 28);
  pen.strokeStyle = "#ff4040";
  pen.lineWidth = 2;
  pen.strokeRect(k.x, v.y + v.h - 30, k.b, 28);
  pen.fillStyle = "white";
  pen.font = '18px "sans", monospace';
  pen.textAlign = "center";
  pen.fillText("!", k.x + k.b / 2, v.y + v.h - 10);
}

function tekenMunt(m) {
  // knipperen als hij bijna weg is
  if (m.leven < 1 && Math.floor(m.leven * 10) % 2 === 0) return;

  if (m.soort === "taart") {
    tekenTaartje(m.x - 8, m.y - 8);
    return;
  }

  // een draaiende pixel munt
  let draai = Math.abs(Math.sin(performance.now() / 180 + m.x));
  let b = Math.max(2, 10 * draai);
  pen.fillStyle = m.waarde > 1 ? "#ffb52b" : "#ffe14d";
  pen.fillRect(m.x - b / 2, m.y - 6, b, 12);
  pen.fillStyle = "#fff6b0";
  pen.fillRect(m.x - b / 4, m.y - 4, Math.max(1, b / 4), 4);
}

function tekenTaartje(x, y) {
  pen.fillStyle = "#c97a2b";
  pen.fillRect(x, y + 6, 16, 8);
  pen.fillStyle = "#ffd28a";
  pen.fillRect(x + 1, y + 3, 14, 4);
  pen.fillStyle = "#ff4d6d";
  pen.fillRect(x + 6, y, 4, 4);
}

// de schedel van een blaster, X is wit en O is een oog
let schedelPixels = [
  "..XXXXX..",
  ".XXXXXXX.",
  "XXOOXOOXX",
  "XXOOXOOXX",
  "XXXXXXXXX",
  ".XXX.XXX.",
  ".X.X.X.X.",
];

function tekenBlaster(k) {
  if (k.wacht > 0) return;

  // hij schuift van buiten het scherm naar binnen
  let terug = (1 - k.binnen) * 60;
  let x = k.x - Math.cos(k.hoek) * terug;
  let y = k.y - Math.sin(k.hoek) * terug;

  pen.save();
  pen.translate(x, y);
  pen.rotate(k.hoek);

  if (k.laden > 0) {
    // een dun lijntje waar hij gaat schieten
    pen.fillStyle = "rgba(255, 255, 255, " + (Math.floor(k.laden * 12) % 2 ? 0.25 : 0.1) + ")";
    pen.fillRect(0, -1, 700, 2);
  } else if (k.vuur > 0) {
    let dik = k.breedte * (0.85 + Math.random() * 0.15);
    pen.fillStyle = "white";
    pen.fillRect(0, -dik / 2, 700, dik);
    pen.fillStyle = "#c9fdff";
    pen.fillRect(0, -dik / 4, 700, dik / 2);
  } else {
    // straal wordt dunner en verdwijnt
    let dik = k.breedte * (k.weg / 0.25);
    pen.fillStyle = "rgba(255, 255, 255, 0.8)";
    pen.fillRect(0, -dik / 2, 700, dik);
  }

  // de schedel kijkt naar voren
  pen.rotate(-Math.PI / 2);
  let p = 3;
  let open = k.laden <= 0 && k.vuur > 0 ? 4 : 0;
  schedelPixels.forEach((rij, r) => {
    [...rij].forEach((c, kol) => {
      if (c === ".") return;
      pen.fillStyle = c === "O" ? "black" : "white";
      let extra = r >= 5 ? open : 0;
      pen.fillRect((kol - 4.5) * p, (r - 7) * p + extra, p, p);
    });
  });

  pen.restore();
}

function tekenDeeltjes() {
  ronde.deeltjes.forEach((d) => {
    pen.globalAlpha = Math.max(0, d.leven / d.max);
    pen.fillStyle = d.kleur;
    pen.fillRect(d.x - d.maat / 2, d.y - d.maat / 2, d.maat, d.maat);
  });
  pen.globalAlpha = 1;
}

function tekenSpeler(s) {
  if (s.dood) return;

  // regenboog ziel heeft een spoor
  if (s.skin === "regenboog" && s.modus !== "blauw") {
    s.spoor.forEach((p, i) => {
      pen.globalAlpha = (i / s.spoor.length) * 0.35;
      tekenHart(p.x, p.y, "hsl(" + ((performance.now() / 6 + i * 20) % 360) + ", 100%, 60%)");
    });
    pen.globalAlpha = 1;
  }

  // hartje knippert als je net geraakt bent
  if (s.onkwetsbaar === 0 || Math.floor(s.onkwetsbaar * 12) % 2 === 0) {
    tekenHart(s.x, s.y, zielKleur(s));
  }
}

function tekenHart(x, y, kleur) {
  pen.fillStyle = kleur;
  hartPixels.forEach((rij, r) => {
    [...rij].forEach((p, k) => {
      if (p === "X") {
        pen.fillRect(Math.round(x + k * pixel), Math.round(y + r * pixel), Math.ceil(pixel), Math.ceil(pixel));
      }
    });
  });
}

// eerst breekt het hartje in 2, dan spat het uit elkaar
function tekenSterven() {
  let r = ronde;
  if (r.stervend > 0.9) {
    r.spelers.forEach((s) => {
      let kier = (1.4 - r.stervend) * 8;
      pen.save();
      pen.beginPath();
      pen.rect(0, 0, s.x + hartMaat / 2, hoog);
      pen.clip();
      tekenHart(s.x - kier, s.y, zielKleur(s));
      pen.restore();
      pen.save();
      pen.beginPath();
      pen.rect(s.x + hartMaat / 2, 0, breed, hoog);
      pen.clip();
      tekenHart(s.x + kier, s.y, zielKleur(s));
      pen.restore();
    });
  }
  tekenDeeltjes();
}

// voor minigame.js: game over scherm
function tekenGameOver() {
  pen.fillStyle = "black";
  pen.fillRect(0, 0, breed, hoog);
  groteTekst("GAME", 140, "white");
  groteTekst("OVER", 190, "white");
}

// voor minigame.js: uitslag met sterren
function tekenUitslag(titel, sterren, getoond, regels) {
  pen.fillStyle = "rgba(0, 0, 0, 0.85)";
  pen.fillRect(0, 0, breed, hoog);
  groteTekst(titel, 90, "#ffe14d");

  for (let i = 0; i < 3; i++) {
    let aan = i < Math.min(sterren, getoond);
    tekenSter(breed / 2 - 60 + i * 60, 140, aan);
  }

  regels.forEach((regel, i) => kleineTekst(regel, 200 + i * 26));
}

function tekenSter(x, y, aan) {
  pen.save();
  pen.translate(x, y);
  pen.fillStyle = aan ? "#ffe14d" : "#333";
  if (aan) {
    pen.shadowColor = "#ffe14d";
    pen.shadowBlur = 14;
  }
  pen.beginPath();
  for (let i = 0; i < 10; i++) {
    let straal = i % 2 === 0 ? 20 : 8;
    let hoek = (i * Math.PI) / 5 - Math.PI / 2;
    pen.lineTo(Math.cos(hoek) * straal, Math.sin(hoek) * straal);
  }
  pen.closePath();
  pen.fill();
  pen.restore();
}

// waar het hartje nu op de pagina staat, daar komen de xp kristallen vandaan
function spelerOpPagina() {
  let rand = canvas.getBoundingClientRect();
  let s = ronde ? ronde.spelers[0] : { x: breed / 2, y: 150 };
  return {
    x: rand.left + ((s.x + hartMaat / 2) / breed) * rand.width,
    y: rand.top + ((s.y + hartMaat / 2) / hoog) * rand.height,
  };
}

// ===== besturing =====
let alleSpelToetsen = Object.values(besturing).flat();

document.addEventListener("keydown", (e) => {
  if (!rondeBezig()) return;
  let toets = e.key.toLowerCase();

  if (toets === "p") {
    ronde.pauze = !ronde.pauze;
    toetsen = {};
    return;
  }

  if (alleSpelToetsen.includes(toets)) {
    // anders scrollt de pagina mee
    e.preventDefault();
    toetsen[toets] = true;
  }
});

document.addEventListener("keyup", (e) => {
  toetsen[e.key.toLowerCase()] = false;
});

// als je naar een ander venster gaat blijven toetsen anders "ingedrukt"
window.addEventListener("blur", () => {
  toetsen = {};
  if (rondeBezig() && ronde.intro <= 0) ronde.pauze = true;
});

// de muis of vinger positie omrekenen naar canvas pixels
function naarCanvas(e) {
  let rand = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rand.left) / rand.width) * breed,
    y: ((e.clientY - rand.top) / rand.height) * hoog,
  };
}

canvas.addEventListener("pointerdown", (e) => {
  if (!rondeBezig()) return;
  canvas.setPointerCapture(e.pointerId);
  vinger = naarCanvas(e);
});

canvas.addEventListener("pointermove", (e) => {
  if (vinger) vinger = naarCanvas(e);
});

canvas.addEventListener("pointerup", () => (vinger = null));
canvas.addEventListener("pointercancel", () => (vinger = null));
