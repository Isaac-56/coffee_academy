// Edit this file to replace proposed course copy and configure live integrations.
// Never put API keys or private WhatsApp group invitation links in public files.
export const settings = {
  academyName: 'Henok Asrat',
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
  {label:'THE BEAN', title:'It begins with possibility.', description:'Origin, variety and processing shape the character waiting inside every bean.', detail:'Look closely: the centre crease is a familiar feature of the seed we call a coffee bean. Every origin tells a different story.'},
  {label:'THE ROAST', title:'Character, revealed by heat.', description:'Roasting transforms green coffee, developing colour, aroma and flavour over time.', detail:'Roasting is a balance of heat and time. A darker colour alone does not tell you whether a coffee will taste better.'},
  {label:'THE GRIND', title:'Precision in the smallest details.', description:'Grinding creates the surface area that lets water draw flavour from the coffee.', detail:'Grind size changes the way water interacts with coffee. Consistency helps make your brewing results repeatable.'},
  {label:'THE BREW', title:'Where patience meets precision.', description:'Water, temperature and time come together. Small adjustments can change the cup.', detail:'A brew recipe is a starting point. Observe the result and adjust one variable at a time.'},
  {label:'THE CUP', title:'An invitation to savour.', description:'Pause, taste and notice. The final cup is both a result and the beginning of another discovery.', detail:'Let the coffee cool a little and taste again. Your perception of its aroma, sweetness and balance may change.'},
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
