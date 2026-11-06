import {businessContact, contactLink, isApprovedMailbox, validateContactDirectory, CONTACT_SOURCE, CONTACT_REVIEWED} from './contacts.js';
import {recognizeIntent, requirementLabels, people, factIntent} from './intents.js';
export const CONTACT = contactLink('general');
export const FACEBOOK_PAGE = 'https://www.facebook.com/p/StoneVeld-Studios-61596017890951/';
export const TTL = 10 * 60 * 1000;
export const normalize = value => String(value).toLowerCase().normalize('NFKC').replace(/([a-z])[’']s\b/g, '$1').replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const stop = new Set('a an the is are do does can you your me my i we what who how tell about with for and of to at it have someone please need want offer provide help'.split(' '));
const services = {
  websites: {pattern: /\b(websites?|web design|web development|site)\b/, label: 'your website project'},
  creative: {pattern: /\b(creative|graphic|illustration|branding|visual design)\b/, label: 'your creative project'},
  technical: {pattern: /\b(technical|computer|linux|troubleshooting|technical support)\b/, label: 'your technical enquiry'}
};
const followUps = {
  websites: ['prices', 'workflow'], creative: ['prices', 'workflow'], technical: ['hours', 'contact'],
  prices: ['workflow', 'contact'], workflow: ['prices', 'contact'], hours: ['contact'],
  team: ['crow', 'bianca', 'hannes'], crow: ['direct-email'], bianca: ['direct-email'], hannes: ['direct-email'],
  contingency: ['open-tools', 'contact'], 'open-tools': ['contingency', 'contact'], nexus: ['contact'],
  studio: ['websites', 'creative', 'technical'], assistant: ['websites', 'team', 'contact']
};
const suggestionLabels = {prices: 'What about pricing?', workflow: 'How do I get started?', hours: 'What about availability?', contact: 'How can I contact the team?', 'direct-email': 'How can I reach them?'};
const tokens = text => normalize(text).split(' ').filter(t => t && !stop.has(t));
export function safeLink(value) {
  if (typeof value !== 'string' || /[\s\\\u0000-\u001f]/.test(value)) return null;
  try {
    const url = new URL(value, 'https://stoneveldstudios.co.za/');
    if (url.username || url.password) return null;
    if (url.protocol === 'https:' && url.origin === 'https://stoneveldstudios.co.za') return url.href;
    if (url.protocol === 'https:' && url.href === FACEBOOK_PAGE) return url.href;
    if (url.protocol === 'mailto:' && isApprovedMailbox(url.pathname) && !url.hash && url.searchParams.getAll('subject').length <= 1 && [...url.searchParams.keys()].every(k => k === 'subject') && !/[\r\n]/.test(decodeURIComponent(url.search))) return url.href;
  } catch { /* Invalid links are omitted. */ }
  return null;
}
export function validateKnowledge(data) {
  if (!data || !Array.isArray(data.facts) || !data.facts.length) throw new Error('Knowledge is unavailable.');
  validateContactDirectory(data.businessContacts);
  const ids = new Set();
  for (const fact of data.facts) {
    if (!fact || ['id','topic','title','answer','source','reviewed'].some(k => typeof fact[k] !== 'string' || !fact[k].trim()) || ids.has(fact.id) || !/^\d{4}-\d{2}-\d{2}$/.test(fact.reviewed) || !Array.isArray(fact.questions) || !fact.questions.length || !Array.isArray(fact.keywords) || [...fact.questions,...fact.keywords].some(s => typeof s !== 'string' || !s.trim()) || !safeLink(fact.link)) throw new Error('Invalid knowledge entry.');
    ids.add(fact.id);
  }
  return data;
}
function distance(a, b) {
  if (a.length === b.length) {
    const different = [...a].map((c,i)=>c===b[i]?-1:i).filter(i=>i>=0);
    if (different.length===2 && different[1]===different[0]+1 && a[different[0]]===b[different[1]] && a[different[1]]===b[different[0]]) return 1;
  }
  const row = Array.from({length:b.length+1}, (_,i) => i);
  for (let i=1;i<=a.length;i++) {
    let previous=row[0]; row[0]=i;
    for (let j=1;j<=b.length;j++) { const old=row[j]; row[j]=Math.min(row[j]+1,row[j-1]+1,previous+(a[i-1]!==b[j-1])); previous=old; }
  }
  return row[b.length];
}
export class Receptionist {
  constructor(data, clock = Date.now) { this.facts=structuredClone(validateKnowledge(data).facts); this.clock=clock; this.clear(); }
  clear() { this.context=null; this.pending=[]; this.pendingReview=null; this.pendingContacts=[]; this.lastActivity=null; }
  expire() { if (this.lastActivity !== null && this.clock()-this.lastActivity >= TTL) { this.clear(); return true; } return false; }
  answer(input, selectedId = null) {
    this.expire(); this.lastActivity=this.clock();
    const q=normalize(String(input).slice(0,1000));
    const intent=recognizeIntent(q, this.context, services);
    const reply = (id, target = null) => {
      if (services[id] && this.pendingReview) return this.reviewRequirements({service:id, requirements:this.pendingReview, pricing:false, availability:false});
      const fact=this.facts.find(f=>f.id===id);
      if (!fact) return this.unknown();
      const explicitServices = intent.explicitServices;
      const supporting = ['prices', 'workflow', 'hours', 'contact'];
      let service = services[id] ? id : supporting.includes(id) ? this.context?.service ?? null : null;
      if (explicitServices.length) service = explicitServices.length === 1 ? explicitServices[0] : null;
      // Explicit project subjects must not inherit a previous service.
      if (intent.project || (/\bshop\b/.test(q) && !intent.requirements.includes('shop'))) service = null;
      const previous = this.context;
      const member = people[id] ? id : id === 'direct-email'
        ? target || (intent.members.length === 1 ? intent.members[0] : intent.members.length > 1 ? null : (!q || /\b(him|her|them|their|his)\b/.test(q) || /^(tell me more|more details|more)$/.test(q)) ? previous?.member || null : null) : null;
      const retained = supporting.includes(id) && !intent.project && (service === previous?.service) ? previous?.requirements || [] : [];
      this.context={id:fact.id,topic:fact.topic,service,member,requirements:retained}; this.pending=[]; this.pendingReview=null; this.pendingContacts=[];
      let text = id === 'prices' && service ? `For ${services[service].label}, ${fact.answer}` : fact.answer;
      if (id === 'crow' && /\b(?:owner|founder|who owns stoneveld|who founded stoneveld|person in charge)\b/.test(q)) {
        text = 'Leon (Crow) is the owner of StoneVeld Studios. ' + fact.answer;
      }
      let link = fact.link;
      let linkLabel = fact.linkLabel || fact.title;
      if (id === 'direct-email') {
        const contact = businessContact(member || 'general');
        const privateRequest = /\b(private|personal)\b/.test(q);
        const displayName = member === 'crow' ? 'Leon (Crow)' : contact.name;
        text = `${privateRequest ? 'Private contact details are not available. ' : ''}${member ? privateRequest ? `You can use ${displayName}’s work email: ${contact.email}.` : `You can email ${displayName} at ${contact.email}.` : `You can reach the StoneVeld team at ${contact.email}.`}`;
        if (member === 'crow' && /\b(?:owner|founder|person in charge)\b/.test(q) && !privateRequest) {
          text = 'To reach the StoneVeld Studios owner, Leon (Crow), you can email ' + contact.email + '. The link opens your email application; I cannot send messages for you.';
        }
        link = contactLink(member || 'general');
        linkLabel = member ? `Email ${displayName} at StoneVeld` : 'Email the StoneVeld team';
      }
      if (retained.length && ['prices','hours','workflow'].includes(id)) text += `\n\nYou mentioned ${requirementLabels(retained).join(', ')}. I can’t confirm those features without the team reviewing your project.`;
      const personFact = member ? this.facts.find(f => f.id === member) : null;
      const profile = member ? {
        id:member, name:member === 'crow' ? 'Leon (Crow)' : businessContact(member).name,
        studio:personFact.title, specialty:personFact.answer.split('. ')[0] + '.',
        studioLink:safeLink(personFact.link), studioLabel:personFact.linkLabel,
        emailLink:contactLink(member), emailLabel:`Email ${member === 'crow' ? 'Leon (Crow)' : businessContact(member).name} at StoneVeld`
      } : null;
      return {kind:'answer',profile,intent:factIntent(fact),needsHuman:retained.length > 0 || ['prices','hours','direct-email'].includes(id),id:fact.id,text,link:safeLink(link),linkLabel,title:fact.title,source:id === 'direct-email' ? CONTACT_SOURCE : fact.source,reviewed:id === 'direct-email' ? CONTACT_REVIEWED : fact.reviewed,suggestions:this.suggestions(followUps[id] || [])};
    };
    if (selectedId && this.pendingContacts.includes(selectedId)) return reply('direct-email', selectedId);
    if (selectedId && services[selectedId] && this.pendingReview) {
      const requirements = this.pendingReview;
      this.pendingReview = null;
      return this.reviewRequirements({service:selectedId, requirements, pricing:false, availability:false});
    }
    if (selectedId) return reply(selectedId);
    if (!q) return this.unknown();
    if (/^(hi|hello|hey|good morning|good afternoon)$/.test(q)) return reply('assistant');
    if (/^(thanks|thank you|cheers)$/.test(q)) return {kind:'greeting',text:'You’re welcome. What else would you like to explore?',suggestions:this.suggestions(['websites','team','contact'])};
    if (/\b(ignore|override|pretend|system prompt|remember that|update your knowledge)\b/.test(q)) return this.unknown();
    const privateEmail = /\b(private|personal)\b/.test(q) && /\b(email|e mail|contact)\b/.test(q);
    if (/\b(passwords?|credentials?|tokens?|secrets?|family|home address)\b/.test(q) || (/\bprivate\b/.test(q) && !privateEmail)) {
      this.clear(); this.lastActivity=this.clock();
      return {kind:'unknown',intent:'unknown',text:'I cannot provide private information or credentials. You can contact the team at info@stoneveldstudios.co.za for help.',link:CONTACT,linkLabel:'Email the StoneVeld team'};
    }
    if (/\b(facebook|social media|socials)\b/.test(q)) return reply('facebook');
    if (intent.contact && intent.members.length > 1) {
      const response = this.clarify(intent.members);
      this.pendingContacts = [...intent.members];
      response.text = 'Who would you like to contact?';
      return response;
    }
    if (this.pendingContacts.length && intent.members.length === 1) return reply('direct-email', intent.members[0]);
    if (intent.members.length === 1 && intent.members[0] === 'crow' && /\b(?:owner|founder|person in charge|who owns stoneveld|who founded stoneveld)\b/.test(q) && !intent.contact && !intent.requirements.length && !intent.explicitServices.length) return reply('crow');
    if (privateEmail || (intent.contact && (intent.members.length || /\b(him|her|them|their|his)\b/.test(q)))) return reply('direct-email');
    if (intent.contact && /\b(team|company|general|studio)\b/.test(q) && !intent.requirements.length && !intent.explicitServices.length) return reply('contact');
    const exact=this.facts.find(f=>f.questions.some(s=>normalize(s)===q));
    if (exact) return reply(exact.id);
    if (intent.contact && !intent.requirements.length && !intent.explicitServices.length) return reply('contact');
    if (intent.ambiguous) return this.clarifyRequirements(intent, intent.explicitServices);
    if (intent.needsReview) return this.reviewRequirements(intent);
    if (intent.requirements.length && !intent.project && !intent.service && !intent.pricing) return this.clarifyRequirements(intent, ['websites','technical','contact']);
    if (/\b(email|address|contact|reach)\b/.test(q) && /\b(bianca|bia|hannes|crow|leon|personal|direct|individual|him|her|them)\b/.test(q)) return reply('direct-email');
    if (/\b(price|prices|pricing|cost|costs|much|quote|quotation|rates|budget|fee|fees)\b/.test(q)) return reply('prices');
    if (/\b(hours|opening|available|availability|today|urgent|emergency|immediately|deadline|deadlines|tomorrow|scheduling|response time|saturday|sundays?|weekends?|business hours|enquiry hours)\b/.test(q) || /open now|how long|when can|finish by/.test(q)) return reply('hours');
    if (/\b(send|sent|deliver)\b/.test(q) && /\b(email|message|enquiry)\b/.test(q)) return reply('contact');
    if (/^(and |what about )?(him|her|them|that|it|more|tell me more|more details)$/.test(q)) return this.context?.id === 'requirements' ? this.reviewRequirements({service:this.context.service,requirements:this.context.requirements,pricing:false,availability:false}) : this.context ? reply(this.context.id) : this.clarify(['websites','creative','technical']);
    if (q==='projects' || q==='your projects') return this.clarify(['contingency','open-tools','nexus']);
    // Rank remaining wording conservatively after explicit intents.
    const query=tokens(q);
    const ranked=this.facts.filter(f=>f.id!=='direct-email').map(f=> {
      const words=[...new Set(f.keywords.flatMap(tokens))];
      let score=0;
      for (const word of query) {
        const frequency=this.facts.filter(g=>g.keywords.flatMap(tokens).includes(word)).length;
        const weight=frequency>2 ? 0.65 : 2.5;
        if(words.includes(word)) score+=weight;
        else if(word.length>=5 && words.some(w=>w.length>=5 && distance(word,w)<=1)) score+=1.8;
      }
      for(const phrase of f.keywords) if(normalize(phrase).includes(' ') && q.includes(normalize(phrase))) score+=3;
      if(f.id==='websites' && query.some(w=>['website','websites','site'].includes(w))) score+=2;
      if (['crow','bianca','hannes'].includes(f.id) && query.includes(f.id)) score+=4;
      return {id:f.id,score};
    }).sort((a,b)=>b.score-a.score);
    if(ranked[0].score<1.5) return ranked[0].score>0 ? this.clarify(ranked.slice(0,3).map(f=>f.id)) : this.unknown();
    if(ranked[0].score-ranked[1].score<1) return this.clarify(ranked.filter(f=>f.score>0).slice(0,3).map(f=>f.id));
    return reply(ranked[0].id);
  }
  reviewRequirements(intent) {
    const service = intent.service;
    const previous = !intent.project && service === this.context?.service ? this.context.requirements || [] : [];
    const requirements = [...new Set([...previous, ...intent.requirements])];
    this.context = {id:'requirements',topic:service || 'requirements',service,member:null,requirements};
    this.pending = []; this.pendingReview = null; this.pendingContacts=[];
    // These introductions restate the existing service facts; no feature is confirmed.
    const intro = {
      websites:'StoneVeld Studios offers website design and development.',
      technical:'StoneVeld Studios offers practical help with software, systems and everyday technology problems.',
      creative:'StoneVeld Studios explores creative concepts, visual design and storytelling.'
    };
    const parts = [intent.project ? this.facts.find(f => f.id === intent.project).answer : intro[service] || 'Thanks for describing your project.'];
    parts.push(`You mentioned ${requirementLabels(requirements).join(', ')}. I can’t confirm those particular features without the team reviewing your project.`);
    if (intent.pricing) parts.push(this.facts.find(f => f.id === 'prices').answer);
    if (intent.availability) parts.push(this.facts.find(f => f.id === 'hours').answer);
    parts.push('Would you like to contact StoneVeld Studios to discuss what your project needs? The email link opens your email application; I cannot send messages.');
    return {kind:'answer',id:'requirements',intent:intent.pricing?'pricing':'technical_requirements',needsHuman:true,
      service,requirements:[...requirements],text:parts.join('\n\n'),link:CONTACT,linkLabel:'Email StoneVeld about your project',suggestions:this.suggestions(['contact','workflow','prices'])};
  }
  clarifyRequirements(intent, ids) {
    const response = this.clarify(ids);
    this.pendingReview = [...intent.requirements];
    return response;
  }
  clarify(ids) { this.pendingContacts=[]; this.pendingReview=null; this.pending=ids; this.context=null; return {kind:'clarify',intent:'clarification',text:'I can help with a few topics here. Which would you like to explore?',choices:ids.map(id=>({id,title:this.facts.find(f=>f.id===id).title})),link:CONTACT,linkLabel:'Email the StoneVeld team'}; }
  choose(id) { this.expire(); const fact=this.facts.find(f=>f.id===id); return fact ? this.answer('', fact.id) : this.unknown(); }
  suggestions(ids) { return ids.filter(id => this.facts.some(f => f.id === id)).map(id => ({id, title: suggestionLabels[id] || this.facts.find(f => f.id === id).title})); }
  unknown() { this.pendingContacts=[]; this.pendingReview=null; this.context=null; this.pending=[]; return {kind:'unknown',intent:'unknown',text:'I’m not sure about that, and I don’t want to guess. You can try a topic below or reach the team at info@stoneveldstudios.co.za. The email link opens your email application; I cannot send messages.',link:CONTACT,linkLabel:'Email the StoneVeld team'}; }
}
