/* console.log(`Yo`);
window.alert('Are you sure you want to continue?'); 

let x;

x = window.prompt();

window.alert(`haha you chose ${x}`)
*/

let zoeksub = document.getElementById("zoeksub");

let gezocht = document.getElementById("zoekbalk");

let routes = {
  'blog': 'blog.html',
  'contact': 'contact.html',
  'home': 'index.html',
  'projecten': 'projecten.html',
  'whoami' : 'index.html'
};


zoeksub.addEventListener("submit", function(e) {
e.preventDefault();


let pagina = gezocht.value.toLowerCase();

if(routes[pagina]){

window.location.href = routes[pagina];

}

});

console.log(typeof routes);