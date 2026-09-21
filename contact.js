let contactform = document.getElementById("contactform");
let verstuurd = document.getElementById("verstuurd");

let naam = document.getElementById("naam");
let email = document.getElementById("email");
let bericht = document.getElementById("bericht");

let naamfout = document.getElementById("naamfout");
let emailfout = document.getElementById("emailfout");
let berichtfout = document.getElementById("berichtfout");
let input = document.querySelectorAll("input");

input.forEach((element) => {
  element.style.width = "200px";
});

function checkVeld(veld, fout, tekst) {
  if (veld.value.trim() === "") {
    fout.textContent = tekst;
    veld.setAttribute("aria-invalid", "true");
    return false;
  }

  fout.textContent = "";
  veld.removeAttribute("aria-invalid");
  return true;
}

naam.addEventListener("input", () => {
  checkVeld(naam, naamfout, "vul je naam in");
});

email.addEventListener("input", () => {
  checkVeld(email, emailfout, "vul je email in");
});

bericht.addEventListener("input", () => {
  checkVeld(bericht, berichtfout, "vul een bericht in");
});

contactform.addEventListener("submit", (e) => {
  e.preventDefault();

  verstuurd.textContent = "";

  let naamGoed = checkVeld(naam, naamfout, "vul je naam in");
  let emailGoed = checkVeld(email, emailfout, "vul je email in");
  let berichtGoed = checkVeld(bericht, berichtfout, "vul een bericht in");

  if (naamGoed && emailGoed && berichtGoed) {
    verstuurd.textContent = "bedankt, je bericht is verstuurd!";
    contactform.reset();
  }
});
