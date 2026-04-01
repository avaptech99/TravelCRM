import { extractTravelInfo } from './src/utils/extractTravelInfo';

const text = 'Flight to Bali for 4 people on 25th May';

console.log('--- FIRST RUN (Should be slow) ---');
const start1 = Date.now();
const res1 = extractTravelInfo(text);
console.log('Time:', Date.now() - start1, 'ms');
console.log('Result:', JSON.stringify(res1));

console.log('\n--- SECOND RUN (Should be instant < 2ms) ---');
const start2 = Date.now();
const res2 = extractTravelInfo(text);
console.log('Time:', Date.now() - start2, 'ms');
console.log('Result:', JSON.stringify(res2));

if (JSON.stringify(res1) === JSON.stringify(res2) && (Date.now() - start2) < 5) {
    console.log('\n✅ TEST PASSED: Cache is working and returned identical results.');
} else {
    console.log('\n❌ TEST FAILED: Cache did not work as expected.');
}
