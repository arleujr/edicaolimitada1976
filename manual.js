const track = document.querySelector(".carousel-track");
const cards = [...track.querySelectorAll(".carousel-card")];
const links = [...document.querySelectorAll(".carousel-controls a")];
const [previous, next] = document.querySelectorAll("[data-direction]");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let active = 0;
function showCard(index) {
  if (!cards[index]) return;
  track.scrollTo({ left: index * track.clientWidth, behavior: reducedMotion.matches ? "auto" : "smooth" });
}
function syncControls() {
  active = Math.round(track.scrollLeft / track.clientWidth);
  previous.disabled = active === 0;
  next.disabled = active === cards.length - 1;
  links.forEach((link, index) => {
    if (index === Math.min(active, links.length - 1)) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
}
previous.hidden = next.hidden = false;
previous.addEventListener("click", () => showCard(active - 1));
next.addEventListener("click", () => showCard(active + 1));
links.forEach((link, index) => link.addEventListener("click", event => {
  event.preventDefault();
  showCard(index);
}));
track.addEventListener("scroll", syncControls, { passive: true });
track.addEventListener("keydown", event => {
  if (event.target === track && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
    event.preventDefault();
    showCard(active + (event.key === "ArrowLeft" ? -1 : 1));
  }
});
syncControls();

