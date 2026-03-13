import { extractTravelInfo } from './src/utils/extractTravelInfo';
const text = 'Honeymoon trip to Bali starting 12 May for 2 persons';
const info = extractTravelInfo(text);
console.log('Test1:', text);
console.log('Result1:', info);

const text2 = 'Trip to Dubai 20 Apr 2026 6 pax';
const info2 = extractTravelInfo(text2);
console.log('\nTest2:', text2);
console.log('Result2:', info2);

const text3 = 'New enquiry for a Maldives package, travelling next month with three adults';
const info3 = extractTravelInfo(text3);
console.log('\nTest3:', text3);
console.log('Result3:', info3);

