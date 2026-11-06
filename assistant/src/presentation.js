import {safeLink} from './engine.js';
const profileArt = Object.freeze({bianca:'assets/bia-lines.svg',hannes:'assets/wolfbyte-ridge.svg',crow:'assets/crow-trace.svg'});

// Build the complete message before adding it to the live log. All content is text.
export function createMessage(document, text, user = false, result = null, onChoose = () => {}) {
  const element = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  };
  const entry = element('div', `message${user ? ' user' : ' assistant-message'}`);
  entry.append(element('strong', 'message-speaker', user ? 'You' : 'StoneVeld Assistant'));
  if (!user && result?.id === 'facebook') entry.className += ' message-social';
  let content = entry;
  if (!user && result?.profile) {
    const known = Object.hasOwn(profileArt,result.profile.id);
    const card = element('div', `person-card${known ? ` person-${result.profile.id}` : ''}`);
    const heading = element('div', 'person-heading');
    const initials = element('span', 'person-initial', result.profile.name.slice(0, 1));
    initials.setAttribute('aria-hidden', 'true');
    const identity = element('div', 'person-identity');
    identity.append(element('span', 'person-name', result.profile.name), element('span', 'person-studio', result.profile.studio));
    heading.append(initials, identity);
    if (known) {
      const art = element('img','person-art');
      art.src = profileArt[result.profile.id]; art.alt = ''; art.width = 160; art.height = 72;
      art.setAttribute('aria-hidden','true'); heading.append(art);
    }
    card.append(heading);
    if (result.id === 'direct-email' && result.profile.specialty) card.append(element('p','person-specialty',result.profile.specialty));
    entry.append(card); content = card;
  }
  // Paragraph breaks make longer requirements answers easier to scan.
  for (const paragraph of text.split(/\n\n+/)) content.append(element('p', 'message-text', paragraph));
  const href = !user && result?.link ? safeLink(result.link) : null;
  if (href) {
    const a = element('a', 'message-link');
    a.href = href;
    a.textContent=result.linkLabel || 'Email the StoneVeld team';
    content.append(a);
  }
  if (!user && result?.profile) {
    const seen = new Set(href ? [href] : []);
    for (const [destination, label] of [[result.profile.studioLink,result.profile.studioLabel],[result.profile.emailLink,result.profile.emailLabel]]) {
      const target = safeLink(destination);
      if (!target || seen.has(target)) continue;
      seen.add(target);
      const link = element('a','profile-link',label || 'Contact StoneVeld');
      link.href = target; content.append(link);
    }
  }
  const options = !user && (result?.choices || result?.suggestions);
  if (options?.length) {
    const group = element('div', 'follow-ups');
    const label = result.choices ? 'Choose a topic' : 'Keep exploring';
    group.append(element('p', 'follow-up-label', label));
    const choices = element('div', 'choices');
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', result.choices ? label : 'Suggested next questions');
    for (const choice of options) {
      const button = element('button', 'suggestion', choice.title);
      button.type = 'button';
      button.addEventListener('click', () => onChoose(choice.title, choice.id));
      choices.append(button);
    }
    group.append(choices);
    entry.append(group);
  }
  return entry;
}
