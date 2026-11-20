const home = document.querySelector(".home-page");
const button = home.querySelector(".motion-toggle");
let choice = true;
function updateMotion() {
  const playing = choice;
  home.classList.toggle("effects-playing", playing);
  home.classList.toggle("effects-paused", !playing);
  button.textContent = playing ? "Pausar efeitos" : "Ativar efeitos";
}
button.addEventListener("click", () => {
  choice = !home.classList.contains("effects-playing");
  updateMotion();
});
button.hidden = false;
updateMotion();
