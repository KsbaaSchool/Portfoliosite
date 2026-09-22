/* console.log(`Yo`);
window.alert('Are you sure you want to continue?'); 

let x;

x = window.prompt();

window.alert(`haha you chose ${x}`)
*/

let zoeksub = document.getElementById("zoeksub");

let gezocht = document.getElementById("zoekbalk");

let routes = {
  blog: "blog.html",
  contact: "contact.html",
  home: "index.html",
  projecten: "projecten.html",
  whoami: "index.html",
  business: "business.html",
};

zoeksub.addEventListener("submit", function (e) {
  e.preventDefault();

  let pagina = gezocht.value.toLowerCase();

  if (routes[pagina]) {
    window.location.href = routes[pagina];
  }
});

// dialoog tekst typt zichzelf, net als in een game
let dialoog = document.getElementById("dialoog");
let regels = dialoog.querySelectorAll(".typ");
let rustigAan = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let klaar = false;
let teksten = [];

regels.forEach((regel) => {
  let tekst = regel.textContent.trim().replace(/\s+/g, " ");

  // screenreaders krijgen gewoon meteen de hele tekst
  let echt = document.createElement("span");
  echt.className = "sr-only";
  echt.textContent = tekst;

  let zicht = document.createElement("span");
  zicht.setAttribute("aria-hidden", "true");

  regel.replaceChildren(echt, zicht);
  teksten.push({ zicht, tekst });
});

function allesTonen() {
  klaar = true;
  teksten.forEach((t) => (t.zicht.textContent = t.tekst));
}

async function typ() {
  for (const t of teksten) {
    for (let i = 0; i < t.tekst.length; i++) {
      if (klaar) return;
      t.zicht.textContent += t.tekst[i];

      if (t.tekst[i] !== " " && i % 2 === 0) {
        piep(300 + Math.random() * 40, 0.05, 0.03);
      }
      await new Promise((r) => setTimeout(r, 35));
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  klaar = true;
}

// klik op het vak om meteen alles te zien
dialoog.addEventListener("click", allesTonen);

if (rustigAan) {
  allesTonen();
} else {
  typ();
}
