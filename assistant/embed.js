
const start = document.getElementById('start');
const input = document.getElementById('question');
function show() { if (document.getElementById('assistant').hidden) start.click(); }
const observer = new MutationObserver(() => {
  if (!input.disabled) { observer.disconnect(); show(); }
});
if (input.disabled) {
  observer.observe(input, {attributes: true, attributeFilter: ['disabled']});
  window.setTimeout(() => {observer.disconnect(); show();}, 2500);
} else show();
function informParent() {
  if (window.parent !== window) window.parent.postMessage({type:'sv-assistant-close'}, window.location.origin);
}
document.getElementById('close').addEventListener('click', informParent);
document.addEventListener('keydown', e => { if (e.key === 'Escape') queueMicrotask(informParent); });
window.addEventListener('message', e => {
  if (e.origin !== window.location.origin || e.source !== window.parent) return;
  if (e.data?.type === 'sv-assistant-open') show();
});
