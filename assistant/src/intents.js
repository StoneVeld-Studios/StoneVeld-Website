// Phrase evidence scores are routing heuristics, not probabilities.
export const INTENT_THRESHOLD = 3;
export const people = {
  bianca: {name: 'Bianca', pattern: /\b(bianca|bia)\b/},
  crow: {name: 'Crow', pattern: /\b(crow|leon)\b/},
  hannes: {name: 'Hannes', pattern: /\b(hannes|wolfbyte)\b/}
};
const requirements = [
  ['shop', 'an online shop', /\b(online (shop|store)|e commerce|ecommerce|web ?shop|sell (my |our |their )?(products? |goods? )?online|shopping cart)\b/],
  ['accounts', 'customer accounts', /\b((customer|client|user|member) (accounts?|profiles?|logins?|portals?)|log ?in|sign ?in|sign ?up|register|registration|membership)\b/],
  ['payments', 'payment processing', /\b(payments?|checkout|check out|pay online|pay by card|card processing|credit cards?|debit cards?|stripe|paypal|payfast)\b/],
  ['bookings', 'online bookings', /\b(bookings?|reservations?|appointments?|book (online|a slot|a session)|reserve (a )?(slot|session))\b/],
  ['integrations', 'system integrations', /\b(integrat(e|es|ion|ions)|connect (to|with)|sync|crm|erp|api)\b/],
  ['mobile-app', 'a mobile application', /\b(mobile app|android|ios|iphone app)\b/],
  ['security', 'specific security requirements', /\b(encryption|encrypted|single sign on|sso|two factor|biometric|security audit)\b/],
  ['infrastructure', 'specialist infrastructure', /\b(kubernetes|clusters?|cloud hosting|load balancing|high availability)\b/]
];
export function requirementLabels(ids) {
  return ids.map(id => requirements.find(item => item[0] === id)?.[1] || 'the specific features you described');
}
export function recognizeIntent(q, context, services) {
  const members = Object.keys(people).filter(id => people[id].pattern.test(q));
  const project = /\bnexus\b/.test(q) ? 'nexus' : /\b(contingency|federation)\b/.test(q) ? 'contingency' : /\bopen tools\b/.test(q) ? 'open-tools' : null;
  const found = requirements.filter(([, , pattern]) => pattern.test(q)).map(([id]) => id);
  const explicitServices = Object.keys(services).filter(id => services[id].pattern.test(q));
  if (found.includes('shop') && !project && !explicitServices.includes('websites')) explicitServices.push('websites');
  const related = /^(and |also |what about |how about |can it |could it |does it |would it |can they |could they )/.test(q);
  let service = explicitServices.length === 1 ? explicitServices[0] : null;
  if (!explicitServices.length && !project && related) service = context?.service || null;
  const request = /\b(can|could|would|need|want|build|create|develop|add|support|include|handle|implement|looking for)\b/.test(q);
  // Unknown feature names receive a cautious response without echoing arbitrary input.
  if (!found.length && service && request && /\b(support|include|integrate|handle|implement|run)\s+\w+|\b(website|site|app) with \w+/.test(q)) found.push('other');
  const pricing = /\b(price|prices|pricing|cost|costs|much|quote|quotation|rates|budget|fee|fees)\b/.test(q);
  const availability = /\b(hours|availability|available|today|tomorrow|deadline|deadlines|urgent|emergency|immediately|guarantee)\b|how long|finish by/.test(q);
  const contact = /\b(email|e mail|address|contact|reach|message|talk|speak)\b/.test(q);
  const score = found.length ? (request || related || pricing ? 3 : 1) + (service ? 2 : 0) : 0;
  return {requirements: found, members, project, service, explicitServices, pricing, availability, contact,
    score, related, needsReview: score >= INTENT_THRESHOLD,
    ambiguous: explicitServices.length > 1 && found.length > 0};
}
export function factIntent(fact) {
  if (fact.id === 'prices') return 'pricing';
  if (fact.id === 'hours') return 'human_confirmation';
  if (fact.id === 'contact' || fact.id === 'direct-email') return 'contact';
  if (fact.topic === 'team') return 'team_enquiry';
  if (fact.topic === 'projects') return 'project_enquiry';
  if (['websites', 'creative', 'technical'].includes(fact.id)) return 'service_enquiry';
  return 'general_information';
}
