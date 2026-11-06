// Native button activation supplies Enter/Space behavior. No custom key emulation.
export function createDisclosure(document, button, content) {
  function setExpanded(expanded) {
    if (!expanded && content.contains(document.activeElement)) button.focus();
    content.hidden = !expanded;
    button.setAttribute('aria-expanded', String(expanded));
  }
  button.setAttribute('aria-controls', content.id);
  setExpanded(false);
  button.addEventListener('click', () => setExpanded(content.hidden));
  return {collapse: () => setExpanded(false)};
}
export function trapTab(panel, document, event) {
  if (event.key !== 'Tab') return;
  const nodes = [...panel.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),[tabindex="0"]')]
    .filter(node => !node.closest('[hidden]') && node.getClientRects().length);
  const first = nodes[0], last = nodes.at(-1);
  if (!first) return;
  if (!nodes.includes(document.activeElement) || (event.shiftKey && document.activeElement === first)) {
    event.preventDefault(); (event.shiftKey ? last : first).focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first.focus();
  }
}
export const nearBottom = node => node.scrollHeight - node.clientHeight - node.scrollTop <= 40;
export function revealMessage(scroller, entry) {
  scroller.scrollTop += entry.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 12;
}
// visualViewport follows a mobile keyboard even where layout viewport units do not.
export function fitViewport(panel, viewport) {
  if (!viewport) return;
  panel.style.setProperty('--available-height', `${Math.max(1, viewport.height - 16)}px`);
  panel.style.setProperty('--viewport-top', `${viewport.offsetTop + 8}px`);
  panel.classList.toggle('short-viewport', viewport.height <= 480);
}
