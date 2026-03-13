import nlp from 'compromise';

const text = 'Honeymoon trip to Bali starting 12 May for 2 persons';
const doc = nlp(text);

console.log('Places:', doc.places().out('array'));
console.log('Nouns:', doc.nouns().out('array'));
console.log('Match #Place:', doc.match('#Place').out('array'));
console.log('Match #City:', doc.match('#City').out('array'));
console.log('Match #Country:', doc.match('#Country').out('array'));
console.log('Match #Region:', doc.match('#Region').out('array'));
