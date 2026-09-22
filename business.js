// menubalk krijgt een schaduw zodra je naar beneden scrollt
let balk = document.getElementById("balk");

window.addEventListener("scroll", () => {
  balk.classList.toggle("gescrold", window.scrollY > 10);
});

// blokken komen rustig omhoog als ze in beeld komen
let opkomers = document.querySelectorAll(".opkomen");

let kijker = new IntersectionObserver(
  (items) => {
    items.forEach((item) => {
      if (item.isIntersecting) {
        item.target.classList.add("zichtbaar");
        kijker.unobserve(item.target);
      }
    });
  },
  { threshold: 0.15 },
);

opkomers.forEach((el) => kijker.observe(el));

// het menu laat zien in welk stuk je nu zit
let menulinks = document.querySelectorAll("nav a");

let sectieKijker = new IntersectionObserver(
  (items) => {
    items.forEach((item) => {
      if (!item.isIntersecting) return;

      menulinks.forEach((link) => {
        let actief = link.getAttribute("href") === "#" + item.target.id;
        link.classList.toggle("actief", actief);
        if (actief) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    });
  },
  { rootMargin: "-45% 0px -50% 0px" },
);

document.querySelectorAll("main section").forEach((s) => sectieKijker.observe(s));

// projecten van github
let projectlijst = document.getElementById("projectlijst");
let projectstatus = document.getElementById("projectstatus");
let projectzoek = document.getElementById("projectzoek");
let projectsort = document.getElementById("projectsort");
let aantalrepos = document.getElementById("aantalrepos");
let repos = [];

async function haalRepos() {
  try {
    const antwoord = await fetch(
      "https://api.github.com/users/KsbaaSchool/repos",
    );

    if (!antwoord.ok) {
      throw new Error("niks gevonden of gefetched");
    }

    repos = await antwoord.json();
    aantalrepos.textContent = repos.length;
    toonRepos();
  } catch (error) {
    console.error(error);
    projectstatus.textContent =
      "Kon de projecten niet laden, probeer het later opnieuw.";
    projectstatus.classList.add("fout");
  }
}

function toonRepos() {
  let waarde = projectzoek.value.toLowerCase().trim();

  let lijst = repos.filter((r) => {
    return (
      r.name.toLowerCase().includes(waarde) ||
      (r.description ?? "").toLowerCase().includes(waarde)
    );
  });

  if (projectsort.value === "naam") {
    lijst.sort((a, b) => a.name.localeCompare(b.name));
  } else if (projectsort.value === "sterren") {
    lijst.sort((a, b) => b.stargazers_count - a.stargazers_count);
  } else {
    lijst.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
  }

  projectlijst.innerHTML = "";

  if (lijst.length === 0) {
    projectstatus.textContent = "Geen projecten gevonden.";
    return;
  }

  projectstatus.textContent =
    lijst.length === 1 ? "1 project" : `${lijst.length} projecten`;

  for (const r of lijst) {
    let kaart = document.createElement("li");
    kaart.className = "project";

    let titel = document.createElement("h3");
    titel.textContent = r.name;

    let tekst = document.createElement("p");
    tekst.textContent = r.description ?? "Nog geen beschrijving.";

    let info = document.createElement("p");
    info.className = "projectinfo";
    let datum = new Date(r.pushed_at).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    info.textContent = `${r.language ?? "Code"} · ★ ${r.stargazers_count} · ${datum}`;

    let link = document.createElement("a");
    link.href = r.html_url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Bekijk op GitHub →";
    link.setAttribute("aria-label", `${r.name} bekijken op GitHub`);

    kaart.append(titel, tekst, info, link);
    projectlijst.append(kaart);
  }
}

projectzoek.addEventListener("input", toonRepos);
projectsort.addEventListener("change", toonRepos);
document
  .getElementById("projectfilter")
  .addEventListener("submit", (e) => e.preventDefault());

haalRepos();

// contactformulier
let bcontactform = document.getElementById("bcontactform");
let bnaam = document.getElementById("bnaam");
let bemail = document.getElementById("bemail");
let bbericht = document.getElementById("bbericht");
let bverstuurd = document.getElementById("bverstuurd");

function checkVeld(veld, fout, tekst, extraCheck) {
  let waarde = veld.value.trim();
  let melding = "";

  if (waarde === "") {
    melding = tekst;
  } else if (extraCheck) {
    melding = extraCheck(waarde);
  }

  document.getElementById(fout).textContent = melding;

  if (melding) {
    veld.setAttribute("aria-invalid", "true");
    return false;
  }

  veld.removeAttribute("aria-invalid");
  return true;
}

function checkEmail(waarde) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waarde)) {
    return "dit is geen geldig email adres";
  }
  return "";
}

bnaam.addEventListener("input", () => {
  checkVeld(bnaam, "bnaamfout", "vul je naam in");
});

bemail.addEventListener("input", () => {
  checkVeld(bemail, "bemailfout", "vul je email in", checkEmail);
});

bbericht.addEventListener("input", () => {
  checkVeld(bbericht, "bberichtfout", "vul een bericht in");
});

bcontactform.addEventListener("submit", (e) => {
  e.preventDefault();

  bverstuurd.textContent = "";

  let naamGoed = checkVeld(bnaam, "bnaamfout", "vul je naam in");
  let emailGoed = checkVeld(bemail, "bemailfout", "vul je email in", checkEmail);
  let berichtGoed = checkVeld(bbericht, "bberichtfout", "vul een bericht in");

  if (naamGoed && emailGoed && berichtGoed) {
    bverstuurd.textContent = "Bedankt, je bericht is verstuurd!";
    bcontactform.reset();
  } else {
    bcontactform.querySelector("[aria-invalid='true']").focus();
  }
});
