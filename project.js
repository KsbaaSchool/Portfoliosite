let repos = document.getElementById("repos");

let sectie = document.getElementById("repos");

let zoekbalk = document.getElementById("zoekcontainer");
let zoeksub = document.getElementById("zoeksub");
let repo;

let gezocht = document.getElementById("zoekbalk");

let laden = document.createElement("h2");
laden.textContent = "repo's aan het laden...";
laden.className = "loading";
document.body.append(laden);

async function showgitrepo() {
  try {
    const antwoord = await fetch(
      "https://api.github.com/users/KsbaaSchool/repos",
    );
    laden.remove();
    if (!antwoord.ok) {
      throw new Error("niks gevonden of gefetched");
    }

    repo = await antwoord.json();

    displayKoppies(repo);
  } catch (error) {
    console.error(error);

    laden.remove();

    let fout = document.createElement("h2");
    fout.textContent = "kon de repo's niet laden, probeer het later opnieuw";
    fout.className = "fout";
    sectie.append(fout);
  }
}
showgitrepo();

function displayKoppies(lijst) {
  let koppie;
  let beschrijving;

  for (const r of lijst) {
    koppie = document.createElement("a");
    beschrijving = document.createElement("p");
    koppie.style.display = "block";
    koppie.textContent = r.name;
    koppie.href = r.html_url;
    koppie.target = "_blank";
    beschrijving.textContent = r.description;
    koppie.style.textDecoration = "underline";

    sectie.append(koppie);

    koppie.after(beschrijving);
  }
}

zoeksub.addEventListener("submit", (e) => {
  e.preventDefault();

  sectie.innerHTML = "";

  let waarde = gezocht.value.toLowerCase();

  let newrepo = repo.filter((r) => {
    r.description ?? "";
    return (
      r.name.toLowerCase().includes(waarde) ||
      (r.description ?? "").toLowerCase().includes(waarde)
    );
  });

  displayKoppies(newrepo);
});
