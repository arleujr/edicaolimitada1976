// Preencha com os links oficiais ao iniciar a confirmação de presença.
const links = { mapEmbed: "", directions: "", formEmbed: "", form: "" };

function showLink(id, url) {
  if (!url) return;
  const link = document.getElementById(id);
  if (!link) return;
  link.href = url;
  link.hidden = false;
}

function showFrame(id, url, title, status) {
  if (!url) return;
  const container = document.getElementById(id);
  if (!container) return;
  const frame = document.createElement("iframe");
  frame.src = url;
  frame.title = title;
  frame.loading = "lazy";
  container.append(frame);
  document.getElementById(status).hidden = true;
}

showLink("directions", links.directions);
showLink("form-link", links.form);
showFrame("map", links.mapEmbed, "Mapa do Sítio Calmaria", "map-status");
showFrame("rsvp", links.formEmbed, "Formulário de confirmação de presença", "rsvp-status");
const rsvpStatus = document.getElementById("rsvp-status");
if (links.form && rsvpStatus) rsvpStatus.hidden = true;
