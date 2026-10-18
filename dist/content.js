// Edit this file to replace proposed course copy and configure live integrations.
// Never put API keys or private WhatsApp group invitation links in public files.
export const settings = {
  academyName: 'TERA Coffee Academy',
  enquiryEndpoint: '', // HTTPS endpoint accepting POST JSON; must validate, rate-limit and store server-side.
  newsletterEndpoint: '',
};
export const courses = [
  {id:'fundamentals', number:'01', title:'Barista Fundamentals', subtitle:'A considered beginning.', format:['online','in-person'], level:'Beginner', icon:'cup', description:'A proposed introduction to coffee, equipment and the everyday decisions behind a balanced cup.', topics:['Understanding coffee and equipment','Exploring grind and extraction','Building a thoughtful brewing routine']},
  {id:'latte', number:'02', title:'Latte Art Mastery', subtitle:'Turn technique into expression.', format:['in-person'], level:'To be confirmed', icon:'latte', description:'A proposed practical exploration of milk texture, pouring control and visual expression.', topics:['Milk preparation and texture','Pouring foundations','Practice and refinement']},
  {id:'roasting', number:'03', title:'Coffee Roasting', subtitle:'Discover the character within.', format:['in-person'], level:'To be confirmed', icon:'bean', description:'A proposed exploration of how heat transforms green coffee into a spectrum of flavour.', topics:['Green coffee characteristics','Understanding roast development','Observing and recording results']},
  {id:'sensory', number:'04', title:'Sensory & Cupping', subtitle:'Learn to taste with intention.', format:['in-person'], level:'To be confirmed', icon:'sensory', description:'A proposed introduction to deliberate tasting, aroma and the language of coffee.', topics:['Aroma and flavour awareness','A structured tasting approach','Comparing and describing cups']},
  {id:'business', number:'05', title:'Café Business Management', subtitle:'Bring your vision to the table.', format:['in-person'], level:'To be confirmed', icon:'business', description:'A proposed pathway for exploring the operations behind a thoughtful café experience.', topics:['Service and workflow','Quality and consistency','Planning a café concept']},
];
export const stages = [
 {label:'CHARACTER',title:'Read the bean.',description:'Origin, processing and roasting leave their mark. Learning to recognise that character is where the craft begins.',caption:'A study in texture'},
 {label:'RITUAL',title:'Make every movement matter.',description:'The grind. The water. The pace of the pour. A thoughtful brewing routine turns small decisions into a balanced cup.',caption:'Precision, poured slowly'},
 {label:'EXPRESSION',title:'Finish with intention.',description:'Silky milk meets carefully extracted coffee. Texture and control come together in a cup made to be savoured.',caption:'The final, personal touch'},
];
export function allowedLevels(format) { return format === 'online' ? ['beginner'] : ['beginner','intermediate','professional']; }
export function validateEnquiry(data) {
  if (!data.name?.trim() || data.name.length > 100) return 'Please enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')) return 'Please enter a valid email address.';
  if (!/^\+[0-9 ()-]{7,24}$/.test(data.phone || '')) return 'Include a valid WhatsApp number and country code.';
  if (!['online','in-person'].includes(data.format) || !allowedLevels(data.format).includes(data.level)) return 'Choose a valid learning format and level.';
  if (!data.consent) return 'Please agree to be contacted about your enquiry.';
  return '';
}
