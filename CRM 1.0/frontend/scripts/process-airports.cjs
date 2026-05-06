const fs = require('fs');
const https = require('https');
const path = require('path');
const csv = require('csv-parser');

const CSV_URL = 'https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv';
const TEMP_CSV_PATH = path.join(__dirname, 'airports-temp.csv');
const OUTPUT_JSON_PATH = path.join(__dirname, '../src/data/airports.json');

// Ensure data directory exists
const dataDir = path.dirname(OUTPUT_JSON_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('Downloading airports.csv...');

const file = fs.createWriteStream(TEMP_CSV_PATH);
https.get(CSV_URL, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to download file. Status Code: ${response.statusCode}`);
    process.exit(1);
  }

  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('Download complete. Processing data...');
    processData();
  });
}).on('error', (err) => {
  fs.unlink(TEMP_CSV_PATH, () => {}); // Keep temp file clean
  console.error('Error downloading the file:', err.message);
});

function processData() {
  const airports = [];

  fs.createReadStream(TEMP_CSV_PATH)
    .pipe(csv())
    .on('data', (row) => {
      // We need to extract: name, municipality (city), iso_country, iata_code
      // And filter out empty IATA codes
      
      const iata = row.iata_code ? row.iata_code.trim() : '';
      if (!iata || iata === '') return;
      
      // Filter out closed airports if possible, but the prompt just says filter out without valid IATA codes.
      // We might want to ensure it's a real airport (type != closed)
      if (row.type === 'closed') return;

      const city = row.municipality || '';
      const country = row.iso_country || '';
      const airport = row.name || '';

      airports.push({
        city,
        country,
        airport,
        iata
      });
    })
    .on('end', () => {
      console.log(`Processed ${airports.length} airports with IATA codes.`);
      
      // Sort alphabetically by city or iata for better UX initially
      airports.sort((a, b) => a.city.localeCompare(b.city) || a.iata.localeCompare(b.iata));

      fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(airports, null, 2));
      console.log(`Successfully saved to ${OUTPUT_JSON_PATH}`);
      
      // Clean up temp file
      fs.unlinkSync(TEMP_CSV_PATH);
    })
    .on('error', (err) => {
      console.error('Error processing CSV:', err.message);
    });
}
