import { parseTravelInfo } from './utils/travelParser';

const testInputs = [
    "Delhi to Toronto 15 April 2026 3 pax",
    "Honeymoon Maldives next Friday 2 people",
    "Delhi Toronto 20 April 4",
    "Dubai 4 adults 2 kids",
    "Honeymoon Bali 5 days 2 persons",
    "Mumbai → Goa 20 May 3 pax"
];

console.log("--- Travel Parser Test Results ---");

testInputs.forEach((input, index) => {
    console.log(`\nInput ${index + 1}: "${input}"`);
    const start = performance.now();
    const result = parseTravelInfo(input);
    const end = performance.now();
    
    console.log("Result:", JSON.stringify(result, null, 2));
    console.log(`Performance: ${(end - start).toFixed(4)}ms`);
});

console.log("\n--- End of Tests ---");
