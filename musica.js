const trilha = document.querySelector("#trilha");
const controle = document.querySelector("#som");
const legenda = controle.querySelector("span");
let aguardaToque = true;

function mostrar(texto) {
  legenda.textContent = texto;
  controle.setAttribute("aria-label", texto);
}
function tocar() {
  trilha.play().catch(() => {
    if (trilha.paused) mostrar("Tocar música");
  });
}
trilha.addEventListener("playing", () => {
  aguardaToque = false;
  mostrar("Pausar música");
});
trilha.addEventListener("pause", () => mostrar("Tocar música"));
controle.addEventListener("click", () => {
  aguardaToque = false;
  if (trilha.paused) tocar();
  else trilha.pause();
});
function tentarNoGesto(evento) {
  if (aguardaToque && trilha.paused && !controle.contains(evento.target)) tocar();
}
for (const tipo of ["pointerup", "keydown", "click"]) {
  document.addEventListener(tipo, tentarNoGesto, { passive:true });
}
tocar();
