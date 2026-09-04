# Ontwerpkeuzes

Alles hier is html en css die ik zelf heb geschreven. geen framework en geen template.
opgezocht op youtube en in de docs van mdn.

In de opdracht staat dat je minimaal 2 gebruikersscenario's en minimaal 3 ontwerpkeuzes moet
onderbouwen, met minimaal 1 bron. ik ga niet voor die minimale eis. ik heb 6 keuzes
uitgewerkt met 6 bronnen erbij, want ik wil hier boven voldoende op staan en niet precies op
de streep.

## Voor wie ik het maak

**Scenario 1, de recruiter met weinig tijd**
Iemand van een stagebedrijf krijgt mijn link en opent hem op een laptop. die heeft geen zin
om te zoeken. hij wil binnen 10 seconden zien wie ik ben, wat ik gemaakt heb en hoe hij mij
kan mailen.

**Scenario 2, een klasgenoot of docent die mijn blog leest op de telefoon**
Die zit in de trein en wil zien hoe ik iets heb opgelost. hij wil gewoon scrollen, niet
steeds in en uit klikken en niet inzoomen om de tekst te kunnen lezen.

## Keuze 1, overal hetzelfde menu op dezelfde plek

Elke pagina heeft precies dezelfde header met dezelfde 4 knoppen in dezelfde volgorde.
projecten staat als 2e zodat de recruiter er meteen bij is. het menu zit in een nav element
met daarin een ul met li's, want een menu is eigenlijk gewoon een lijstje met links.

Waarom: allebei de scenarios hebben dit nodig. de recruiter wil in 1 klik naar projecten en
degene die de blog leest wil daarna makkelijk terug.

Bron: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav

## Keuze 2, alles in 1 kolom onder elkaar

Geen kolommen naast elkaar. header, dan main, dan footer, gewoon onder elkaar. daardoor
hoeft de layout op een smal scherm niet om te klappen, hij staat al goed. de knoppen zijn
30px tekst met padding eromheen dus je raakt ze met je duim.

Waarom: scenario 2. blog lezen op de telefoon zonder horizontaal scrollen.

Bron: https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design

## Keuze 3, hover animatie op de knoppen

Ga je met je muis over een knop, dan flitst er een rood blokje achter de tekst. dat blokje is
een lege div naast de link, die pak ik met a:hover + .box. de beweging zelf zit in een
keyframes met scale en opacity.

        Waarom: het lijkt professioneel, een recruiter zou je eerder aannemen voor zulke details. en het past bij de game stijl.

Bron: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations

## Keuze 4, custom fonts

De h1 is press start 2p en de h2 is MonsterFriend, allebei pixel fonts. undertale was
vroeger als kind mijn favoriete game, daarom heb ik de achtergrond en juist dit stel fonts
gekozen. het zijn custom fonts, dus geen standaard font van de browser maar bestanden die ik
zelf heb gedownload en in mijn assets map heb gezet. met font-face geef ik ze in de css een
naam en het pad naar dat bestand, en daarna gebruik ik die naam gewoon in font-family. zo
ziet het er op elke computer hetzelfde uit, ook als iemand dat font niet geinstalleerd heeft.

Maar in zo'n pixel font een hele alinea lezen is niet fijn, dus alle p tekst staat in het
sans font.

Waarom: het moet er wel uitzien als mij, het is een portfolio en geen bedrijfssite. maar de
recruiter uit scenario 1 moet mijn tekst ook echt kunnen lezen.

Bron: https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face

## Keuze 5, donker met lichte tekst en rode koppen

De video achtergrond is donker dus mijn tekst is aliceblue of wit. de h2 is rood, dat valt op
en hakt de pagina in stukjes zodat je snel kan scannen waar iets over gaat.

Ik heb mijn kleuren door de contrast checker van webaim gehaald en ze halen allemaal de AA
grens van 4.5. rood op zwart komt op 5.2 en mijn gewone tekst op 19.

Bron: https://webaim.org/resources/contrastchecker/

## Keuze 6, externe css en een professionele mappenstructuur

De css staat in 1 apart bestand en niet in de html. ik pas het op 1 plek aan en het
verandert meteen op alle 4 de paginas.

Verder heb ik bewust voor een professionele mappenstructuur gekozen en niet alles los in 1
map. in assets staan css, fonts, img en video netjes apart. dat had ik ooit gelezen en het
wordt ook zo aangeraden. het is veel overzichtelijker, ik weet meteen waar ik moet zijn, en
ik kan er zo een nieuwe pagina of blogpost bij zetten zonder dat ik iets hoef te verplaatsen.

## Eerlijk over mobile first

Ik heb de site op mijn laptop gebouwd en dus niet mobile first. mdn raadt mobile first aan
en dat had ik beter kunnen doen, want dan begin je klein en bouw je omhoog in plaats van
andersom.

Getest heb ik hem daarna wel met f12 op mobiel, tablet en desktop. nergens horizontaal
scrollen en overal leesbaar. daarna heb ik er 3 media queries voor die 3 breedtes in gezet.

Bron: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries

## Wat wel en niet semantisch is

Semantisch betekent dat je het element pakt dat zegt wat iets is. header voor de bovenkant,
nav voor het menu, main voor de inhoud, article voor een blogpost die op zichzelf staat en
footer voor onderaan. dat heb ik op alle 4 de paginas zo gedaan.

Een div is geen fout. een div is juist bedoeld voor iets dat inhoudelijk niks betekent. mijn
lege divs met class box staan er puur voor de hover animatie, die betekenen niks, dus daar
hoort een div en niks anders. wat wel fout zou zijn is div class="header" schrijven terwijl
het element header gewoon bestaat.

Wat nog beter kan: mijn portret is nu een div met tekst erin. zodra ik een echte foto heb
wordt dat een img met een alt tekst, want dan is het wel inhoud. en mijn footers zijn leeg.

## Wat ik hierna nog ga doen

Een echte foto in het portret zetten met een alt tekst erbij, en iets in mijn footers zetten.
