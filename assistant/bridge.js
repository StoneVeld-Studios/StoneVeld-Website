
// Strict same-origin bridge: the iframe owns chat state and all answer logic.
const origin = window.location.origin;
const button = document.createElement('button');
button.id = 'sv-assistant-launcher';
button.type = 'button';
button.setAttribute('aria-controls', 'sv-assistant-shell');
button.setAttribute('aria-expanded', 'false');
button.setAttribute('aria-label', 'Open StoneVeld Assistant');
button.innerHTML = '<span class="sv-as-mark" aria-hidden="true">✦</span><span>Ask StoneVeld</span>';
const shell = document.createElement('div');
shell.id = 'sv-assistant-shell';
shell.hidden = true;
shell.setAttribute('role', 'dialog');
shell.setAttribute('aria-modal', 'true');
shell.setAttribute('aria-label', 'StoneVeld Assistant');
const frame = document.createElement('iframe');
frame.title = 'StoneVeld Assistant conversation';
frame.setAttribute('referrerpolicy', 'no-referrer');
shell.append(frame);
document.body.append(button, shell);
let loaded = false;
let inertBefore = [];
function openAssistant() {
  if (!shell.hidden) return;
  inertBefore = [...document.body.children]
    .filter(el => el !== shell && el !== button && !['SCRIPT', 'STYLE'].includes(el.tagName))
    .map(el => [el, el.inert]);
  for (const [el] of inertBefore) el.inert = true;
  shell.hidden = false;
  button.hidden = true;
  button.setAttribute('aria-expanded', 'true');
  if (!loaded) {
    loaded = true;
    frame.src = '/assistant/embed.html';
  } else {
    frame.contentWindow?.postMessage({type: 'sv-assistant-open'}, origin);
  }
  frame.focus({preventScroll: true});
}
function closeAssistant() {
  if (shell.hidden) return;
  shell.hidden = true;
  button.hidden = false;
  button.setAttribute('aria-expanded', 'false');
  for (const [el, prev] of inertBefore) el.inert = prev;
  inertBefore = [];
  button.focus({preventScroll: true});
}
button.addEventListener('click', openAssistant);
window.addEventListener('message', event => {
  if (event.origin !== origin || event.source !== frame.contentWindow) return;
  if (event.data?.type === 'sv-assistant-close') closeAssistant();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !shell.hidden && document.activeElement !== frame) {
    event.preventDefault();
    closeAssistant();
  }
});
