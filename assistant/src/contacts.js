// Owner approval: docs/CODEX_TASK_004.md. Never extend this list from visitor input.
export const CONTACT_SOURCE = 'Owner-approved public business contacts 2026-11-06';
export const CONTACT_REVIEWED = '2026-11-06';
export const businessContacts = Object.freeze({
  general: Object.freeze({name: 'StoneVeld team', email: 'info@stoneveldstudios.co.za', subject: 'StoneVeld enquiry'}),
  crow: Object.freeze({name: 'Crow', email: 'leon@stoneveldstudios.co.za', subject: 'Enquiry for Crow'}),
  bianca: Object.freeze({name: 'Bianca', email: 'bianca@stoneveldstudios.co.za', subject: 'Enquiry for Bianca'}),
  hannes: Object.freeze({name: 'Hannes', email: 'hannes@stoneveldstudios.co.za', subject: 'Enquiry for Hannes'})
});
export function businessContact(id) {
  return Object.hasOwn(businessContacts, id) ? businessContacts[id] : businessContacts.general;
}
export function contactLink(id) {
  const {email, subject} = businessContact(id);
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
export function isApprovedMailbox(address) {
  return Object.values(businessContacts).some(contact => contact.email === address);
}
export function validateContactDirectory(entries) {
  if (!Array.isArray(entries) || entries.length !== Object.keys(businessContacts).length) throw new Error('Invalid business contact directory.');
  const ids = new Set();
  for (const entry of entries) {
    if (!entry || !Object.hasOwn(businessContacts, entry.id) || ids.has(entry.id)) throw new Error('Invalid business contact entry.');
    const approved = businessContacts[entry.id];
    if (entry.name !== approved.name || entry.email !== approved.email || entry.source !== CONTACT_SOURCE || entry.reviewed !== CONTACT_REVIEWED || Object.keys(entry).sort().join(',') !== 'email,id,name,reviewed,source') throw new Error('Unapproved business contact data.');
    ids.add(entry.id);
  }
}
