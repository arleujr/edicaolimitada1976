const trilha = document.querySelector("#trilha");
const controle = document.querySelector("#som");
const capa = document.querySelector("#capa");
const abrir = document.querySelector("#abrir");
const aviso = document.querySelector("#aviso-som");
const semSom = document.querySelector("#sem-som");
let espera;

function mostrarFalha() {
  clearTimeout(espera);
  abrir.textContent = "Tentar novamente";
  aviso.textContent = "A música não começou. Você pode tentar de novo ou abrir o convite sem som.";
  semSom.hidden = false;
}

function atualizarControle() {
  controle.querySelector("span").textContent = trilha.paused ? "Tocar música" : "Pausar música";
}

trilha.addEventListener("playing", () => {
  clearTimeout(espera);
  if (capa.open) capa.close();
  atualizarControle();
});
trilha.addEventListener("pause", atualizarControle);

abrir.addEventListener("click", () => {
  clearTimeout(espera);
  aviso.textContent = "Carregando a música…";
  espera = setTimeout(mostrarFalha, 10000);
  if (trilha.error) trilha.load();
  trilha.play().catch(mostrarFalha);
});
semSom.addEventListener("click", () => {
  clearTimeout(espera);
  trilha.pause();
  capa.close();
});
controle.addEventListener("click", () => {
  if (!trilha.paused) return trilha.pause();
  if (trilha.error) trilha.load();
  trilha.play().catch(() => {
    capa.showModal();
    mostrarFalha();
  });
});

trilha.play().catch(erro => {
  capa.showModal();
  if (erro.name !== "NotAllowedError") mostrarFalha();
});
