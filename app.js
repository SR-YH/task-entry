const TARGET_REPO = "SR-YH/notion-task-manager";
const ISSUE_BASE_URL = `https://github.com/${TARGET_REPO}/issues/new`;
const DRAFT_KEY = "notion-task-pwa:draft:v1";

const form = document.querySelector("#taskForm");
const fields = {
  shortTitle: document.querySelector("#shortTitle"),
  request: document.querySelector("#request"),
  project: document.querySelector("#project"),
  dueDate: document.querySelector("#dueDate"),
  context: document.querySelector("#context"),
};
const message = document.querySelector("#formMessage");
const clearDraftButton = document.querySelector("#clearDraft");
const connectionStatus = document.querySelector("#connectionStatus");
const installButton = document.querySelector("#installButton");
const installText = document.querySelector("#installText");

let deferredInstallPrompt = null;
let draftTimer = null;

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function updateConnectionStatus() {
  const online = navigator.onLine;
  connectionStatus.textContent = online ? "Lista para preparar el Issue" : "Sin conexión. Puedes completar el borrador.";
  connectionStatus.classList.toggle("offline", !online);
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    for (const [key, element] of Object.entries(fields)) {
      if (typeof draft[key] === "string") element.value = draft[key];
    }
    if (Object.values(fields).some((element) => element.value.trim())) {
      setMessage("Borrador local recuperado.");
    }
  } catch {
    setMessage("No se pudo recuperar el borrador local.", true);
  }
}

function saveDraft() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    const draft = Object.fromEntries(
      Object.entries(fields).map(([key, element]) => [key, element.value])
    );
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // El formulario sigue funcionando aunque el navegador bloquee localStorage.
    }
  }, 180);
}

function clearDraft() {
  for (const element of Object.values(fields)) element.value = "";
  localStorage.removeItem(DRAFT_KEY);
  setMessage("Borrador eliminado.");
  fields.shortTitle.focus();
}

function normalizeText(value) {
  return value.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function buildIssueBody() {
  const request = normalizeText(fields.request.value);
  const project = normalizeText(fields.project.value);
  const dueDate = fields.dueDate.value;
  const context = normalizeText(fields.context.value);
  const sections = [`## Petición\n${request}`];

  if (project) sections.push(`## Proyecto\n${project}`);
  if (dueDate) sections.push(`## Fecha límite\n${dueDate}`);
  if (context) sections.push(`## Contexto o restricciones\n${context}`);
  sections.push("---\nCreado desde la PWA de tareas.");
  return sections.join("\n\n");
}

function buildIssueUrl(title, body) {
  const url = new URL(ISSUE_BASE_URL);
  url.searchParams.set("title", `Tarea: ${title}`);
  url.searchParams.set("body", body);
  url.searchParams.set("labels", "ai:task");
  return url.toString();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = normalizeText(fields.shortTitle.value);
  const request = normalizeText(fields.request.value);

  if (!title) {
    setMessage("Añade un resumen para la tarea.", true);
    fields.shortTitle.focus();
    return;
  }
  if (!request) {
    setMessage("Describe la petición antes de continuar.", true);
    fields.request.focus();
    return;
  }
  if (title.length > 120) {
    setMessage("El resumen supera 120 caracteres.", true);
    fields.shortTitle.focus();
    return;
  }

  const url = buildIssueUrl(title, buildIssueBody());
  setMessage("Abriendo GitHub para confirmar el Issue...");
  window.location.assign(url);
});

for (const element of Object.values(fields)) {
  element.addEventListener("input", saveDraft);
  element.addEventListener("change", saveDraft);
}

clearDraftButton.addEventListener("click", clearDraft);

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
  installText.textContent = "Instala la PWA para abrirla como una aplicación.";
});

installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.hidden = true;
  installText.textContent = "La instalación está disponible desde el menú del navegador.";
});

window.addEventListener("appinstalled", () => {
  installButton.hidden = true;
  installText.textContent = "PWA instalada correctamente.";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      setMessage("La app funciona, pero no se pudo activar el modo offline.", true);
    });
  });
}

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
if (isIos && !isStandalone) {
  installText.textContent = "En iPhone: Compartir → Añadir a pantalla de inicio.";
}

loadDraft();
updateConnectionStatus();