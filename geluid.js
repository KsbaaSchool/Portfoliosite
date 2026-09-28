// alle geluidjes en klik animaties van de game kant

let klikGeluid = new Audio("assets/audio/buttonClick.mp3");
klikGeluid.preload = "auto";

let geluidAan = true;
try {
  geluidAan = localStorage.getItem("geluid") !== "uit";
} catch (e) {}

// web audio maakt de piepjes zelf, daar heb je geen bestand voor nodig
let audioCtx;

function maakCtx() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

// kom je via een klik op mijn site hier, dan mag geluid meestal meteen
maakCtx();

// browsers laten pas geluid toe na de eerste klik of toets
document.addEventListener("pointerdown", maakCtx, { once: true });
document.addEventListener("keydown", maakCtx, { once: true });

function speelKlik() {
  if (!geluidAan) return;
  let klik = klikGeluid.cloneNode();
  klik.volume = 0.6;
  klik.play().catch(() => {});
}

function piep(toon, duur, volume) {
  if (!geluidAan || !audioCtx || audioCtx.state !== "running") return;

  let osc = audioCtx.createOscillator();
  let gain = audioCtx.createGain();
  let nu = audioCtx.currentTime;

  osc.type = "square";
  osc.frequency.value = toon;
  gain.gain.setValueAtTime(volume, nu);
  gain.gain.exponentialRampToValueAtTime(0.0001, nu + duur);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(nu);
  osc.stop(nu + duur);
}

// toon die omhoog of omlaag glijdt, voor de blasters in de minigame
function sweep(van, tot, duur, volume) {
  if (!geluidAan || !audioCtx || audioCtx.state !== "running") return;

  let osc = audioCtx.createOscillator();
  let gain = audioCtx.createGain();
  let nu = audioCtx.currentTime;

  osc.type = "square";
  osc.frequency.setValueAtTime(van, nu);
  osc.frequency.exponentialRampToValueAtTime(tot, nu + duur);
  gain.gain.setValueAtTime(volume, nu);
  gain.gain.exponentialRampToValueAtTime(0.0001, nu + duur);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(nu);
  osc.stop(nu + duur);
}

// ruis, klinkt als een knal of een straal
let ruisBuffer;

function ruis(duur, volume, filterToon) {
  if (!geluidAan || !audioCtx || audioCtx.state !== "running") return;

  // 1 seconde willekeurige ruis, die maak ik maar 1 keer
  if (!ruisBuffer) {
    ruisBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
    let data = ruisBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  let bron = audioCtx.createBufferSource();
  let filter = audioCtx.createBiquadFilter();
  let gain = audioCtx.createGain();
  let nu = audioCtx.currentTime;

  bron.buffer = ruisBuffer;
  filter.type = "lowpass";
  filter.frequency.value = filterToon;
  gain.gain.setValueAtTime(volume, nu);
  gain.gain.exponentialRampToValueAtTime(0.0001, nu + duur);

  bron.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  bron.start(nu);
  bron.stop(nu + duur);
}

// sans stem voor de dialoog, ik speel steeds 1 blipje uit sansStem.mp3
// het blipje zit van 0.03 tot 0.096 seconden in het bestand
let sansGeluid;
let blipStart = 0.03;
let blipDuur = 0.066;

fetch("assets/audio/sansStem.mp3")
  .then((antwoord) => antwoord.arrayBuffer())
  .then((data) => new OfflineAudioContext(1, 1, 44100).decodeAudioData(data))
  .then((buffer) => (sansGeluid = buffer))
  .catch(() => {});

function sansPraat() {
  if (!geluidAan || !sansGeluid || !audioCtx || audioCtx.state !== "running") return;

  let bron = audioCtx.createBufferSource();
  let gain = audioCtx.createGain();
  let nu = audioCtx.currentTime;

  bron.buffer = sansGeluid;

  // heel kort in en uit faden zodat je geen tikje hoort
  gain.gain.setValueAtTime(0, nu);
  gain.gain.linearRampToValueAtTime(0.8, nu + 0.004);
  gain.gain.setValueAtTime(0.8, nu + blipDuur - 0.01);
  gain.gain.linearRampToValueAtTime(0, nu + blipDuur);

  bron.connect(gain);
  gain.connect(audioCtx.destination);
  bron.start(nu, blipStart, blipDuur);
}

// een mp3 inladen zodat je er later stukjes uit kan afspelen
function laadGeluid(pad) {
  return fetch(pad)
    .then((antwoord) => antwoord.arrayBuffer())
    .then((data) => new OfflineAudioContext(1, 1, 44100).decodeAudioData(data))
    .catch(() => null);
}

// speel een stuk van een geluid af, van seconde "van" en "duur" lang
// met "over" kan je het een paar seconden later laten beginnen
function speelStuk(buffer, van, duur, volume, over = 0) {
  if (!geluidAan || !buffer || !audioCtx || audioCtx.state !== "running") return;

  let bron = audioCtx.createBufferSource();
  let gain = audioCtx.createGain();
  let start = audioCtx.currentTime + over;

  bron.buffer = buffer;

  // zacht in en uit faden
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.setValueAtTime(volume, start + Math.max(0.02, duur - 0.3));
  gain.gain.linearRampToValueAtTime(0, start + duur);

  bron.connect(gain);
  gain.connect(audioCtx.destination);
  bron.start(start, van, duur);
}

// geluid aan en uit knop
let geluidknop = document.getElementById("geluidknop");

if (geluidknop) {
  geluidknop.setAttribute("aria-pressed", String(geluidAan));

  geluidknop.addEventListener("click", () => {
    geluidAan = !geluidAan;
    geluidknop.setAttribute("aria-pressed", String(geluidAan));
    try {
      localStorage.setItem("geluid", geluidAan ? "aan" : "uit");
    } catch (e) {}
    speelKlik();
  });
}

// de thema switch krijgt ook een klik
let switchknop = document.getElementById("themaknop");
if (switchknop) {
  switchknop.addEventListener("click", speelKlik);
}

// klein piepje als je over een knop gaat
document.querySelectorAll(".pixelknop").forEach((knop) => {
  knop.addEventListener("mouseenter", () => piep(880, 0.04, 0.03));
  knop.addEventListener("focus", () => piep(880, 0.04, 0.03));

  knop.addEventListener("click", (e) => {
    speelKlik();

    // animatie opnieuw starten, ook als je snel achter elkaar klikt
    knop.classList.remove("geklikt");
    void knop.offsetWidth;
    knop.classList.add("geklikt");

    // bij links even wachten zodat je de animatie en het geluid nog meekrijgt
    let nieuwTabblad = e.ctrlKey || e.metaKey || e.shiftKey || knop.target === "_blank";
    if (knop.tagName === "A" && !nieuwTabblad) {
      e.preventDefault();
      setTimeout(() => {
        location.href = knop.href;
      }, 280);
    }
  });

  knop.addEventListener("animationend", (e) => {
    if (e.animationName === "knal") {
      knop.classList.remove("geklikt");
    }
  });
});

// typ geluidjes in alle invoervelden
document.querySelectorAll("input, textarea").forEach((veld) => {
  veld.addEventListener("input", () => {
    piep(520 + Math.random() * 180, 0.035, 0.025);
  });
});

// zoeken geeft ook een klik
let zoekformulier = document.getElementById("zoeksub");
if (zoekformulier) {
  zoekformulier.addEventListener("submit", speelKlik);
}
