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
