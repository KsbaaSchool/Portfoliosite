// de switch knop die de hele site omzet van gaming naar business en terug

document.documentElement.classList.add("js");

let opBusiness = document.documentElement.dataset.thema === "business";
let rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function leesThema() {
  try {
    return localStorage.getItem("thema");
  } catch (e) {
    return null;
  }
}

function zetThema(thema) {
  try {
    localStorage.setItem("thema", thema);
  } catch (e) {}
}

// staat de site op business maar zit je op een game pagina, dan meteen door
if (!opBusiness && leesThema() === "business") {
  location.replace("business.html");
}

if (opBusiness) {
  zetThema("business");
}

let komtVanWissel = false;
try {
  komtVanWissel = sessionStorage.getItem("wissel") === "ja";
  sessionStorage.removeItem("wissel");
} catch (e) {}

// pagina even verstoppen tot het overgang scherm eroverheen ligt
if (komtVanWissel && !rustig) {
  document.documentElement.style.visibility = "hidden";
}

function maakScherm(kleur) {
  let scherm = document.createElement("div");
  scherm.className = "wisselscherm";
  scherm.style.position = "fixed";
  scherm.style.inset = "0";
  scherm.style.background = kleur;
  scherm.style.zIndex = "9999";
  scherm.style.visibility = "visible";
  scherm.style.pointerEvents = "none";
  document.body.append(scherm);
  return scherm;
}

function middenVan(knop) {
  let r = knop.getBoundingClientRect();
  return `${r.left + r.width / 2}px ${r.top + r.height / 2}px`;
}

document.addEventListener("DOMContentLoaded", () => {
  if (komtVanWissel && !rustig) {
    let scherm = maakScherm(opBusiness ? "#f6f5f1" : "#000");
    document.documentElement.style.visibility = "";
    scherm.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 600,
      delay: 100,
      easing: "ease-out",
      fill: "forwards",
    });
    setTimeout(() => scherm.remove(), 750);
  }

  let knop = document.getElementById("themaknop");
  if (!knop) return;

  knop.addEventListener("click", () => {
    if (knop.classList.contains("bezig")) return;

    let naarBusiness = !opBusiness;
    let doel = naarBusiness ? "business.html" : "index.html";

    knop.classList.add("bezig");
    knop.setAttribute("aria-checked", String(naarBusiness));
    zetThema(naarBusiness ? "business" : "gaming");

    if (rustig) {
      location.href = doel;
      return;
    }

    // eerst schuift het rondje, daarna groeit er een cirkel uit de knop over de hele site
    setTimeout(() => {
      let plek = middenVan(knop);
      let scherm = maakScherm(naarBusiness ? "#f6f5f1" : "#000");

      scherm.animate(
        [
          { clipPath: `circle(0% at ${plek})` },
          { clipPath: `circle(150% at ${plek})` },
        ],
        {
          duration: 850,
          easing: "cubic-bezier(0.7, 0, 0.3, 1)",
          fill: "forwards",
        },
      );

      setTimeout(() => {
        try {
          sessionStorage.setItem("wissel", "ja");
        } catch (e) {}
        location.href = doel;
      }, 900);
    }, 500);
  });
});

// als je met de terug knop terugkomt staat alles weer netjes
window.addEventListener("pageshow", (e) => {
  if (!e.persisted) return;

  document.querySelectorAll(".wisselscherm").forEach((s) => s.remove());

  let knop = document.getElementById("themaknop");
  if (knop) {
    knop.classList.remove("bezig");
    knop.setAttribute("aria-checked", String(opBusiness));
  }

  if (!opBusiness && leesThema() === "business") {
    zetThema("gaming");
  }
});
