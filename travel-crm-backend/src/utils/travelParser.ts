import * as chrono from 'chrono-node';
import nlp from 'compromise';

const travelDestinations = [
    'maldives',
    'bali',
    'phuket',
    'krabi',
    'pattaya',
    'sentosa',
    'dubai',
    'singapore',
];

export function parseTravelInfo(text: string) {
    if (!text) {
        return {
            fromCity: undefined,
            destinationCity: undefined,
            travelDate: undefined,
            travellers: undefined,
            duration: undefined,
        };
    }

    const doc = nlp(text);
    let fromCity: string | undefined = undefined;
    let destinationCity: string | undefined = undefined;
    let travelDate: Date | undefined = undefined;
    let travellers: number | undefined = undefined;
    let duration: string | undefined = undefined;

    // Detect places using compromise
    const places = doc.places().out('array');

    // Direction Detection Logic
    if (text.includes(' from ') && text.includes(' to ')) {
        const fromMatch = text.match(/from\s+([^to\s]+)/i);
        const toMatch = text.match(/to\s+([^from\s]+)/i);
        if (fromMatch) fromCity = fromMatch[1].trim();
        if (toMatch) destinationCity = toMatch[1].trim();
    } else if (text.includes(' to ')) {
        const parts = text.split(/\s+to\s+/i);
        if (parts.length >= 2) {
            const beforeTo = nlp(parts[0]).places().out('array');
            const afterTo = nlp(parts[1]).places().out('array');
            if (beforeTo.length > 0) fromCity = beforeTo[0];
            if (afterTo.length > 0) destinationCity = afterTo[0];
        }
    } else if (text.includes('→')) {
        const parts = text.split('→');
        if (parts.length >= 2) {
            const firstPartPlaces = nlp(parts[0]).places().out('array');
            const secondPartPlaces = nlp(parts[1]).places().out('array');
            if (firstPartPlaces.length > 0) fromCity = firstPartPlaces[0];
            if (secondPartPlaces.length > 0) destinationCity = secondPartPlaces[0];
        }
    } else if (places.length >= 2) {
        // Step 5: If two places exist but no "to" keyword
        fromCity = places[0];
        destinationCity = places[places.length - 1];
    } else if (places.length === 1) {
        // Check if one "place" is actually two adjacent ones like "Delhi Toronto"
        const matchedPlaces = doc.match('#Place+').out('array');
        if (matchedPlaces.length === 1) {
            const parts = matchedPlaces[0].split(' ');
            if (parts.length >= 2) {
                fromCity = parts[0];
                destinationCity = parts[parts.length - 1];
            } else {
                destinationCity = matchedPlaces[0];
            }
        } else if (matchedPlaces.length >= 2) {
            fromCity = matchedPlaces[0];
            destinationCity = matchedPlaces[matchedPlaces.length - 1];
        } else {
            destinationCity = places[0];
        }
    }

    // Step 6: Fix: Destination Not a City (Country/Keyword detection)
    if (!destinationCity) {
        const lowerText = text.toLowerCase();
        for (const dest of travelDestinations) {
            if (lowerText.includes(dest)) {
                destinationCity = dest.charAt(0).toUpperCase() + dest.slice(1);
                break;
            }
        }
    }

    // Date Detection (chrono-node)
    const parsedDate = chrono.parseDate(text);
    if (parsedDate) {
        travelDate = parsedDate;
    }

    // Traveller Detection
    const travellerMatch = text.match(/(\d+)\s?(pax|persons|people|travellers|members)/i);
    if (travellerMatch) {
        travellers = parseInt(travellerMatch[1], 10);
    } else {
        // Step 10: Fix: Traveller Count Without Keywords
        const numbers = text.match(/\b(\d+)\b/g);
        if (numbers) {
            for (const numStr of numbers) {
                const num = parseInt(numStr, 10);
                // Simple heuristic: if it's a small number and not part of a date
                // chrono-node already uses dates, so we just check if it's not the same as day/year if possible
                // But a simpler check is often enough: count < 20 and not obviously a year
                if (num > 0 && num < 20 && (!parsedDate || (num !== parsedDate.getDate() && num !== parsedDate.getFullYear()))) {
                    travellers = num;
                    break;
                }
            }
        }
    }

    // Duration Detection
    const durationMatch = text.match(/(\d+)\s?(days|day|nights|night)/i);
    if (durationMatch) {
        duration = durationMatch[0];
    }

    return {
        fromCity,
        destinationCity,
        travelDate,
        travellers,
        duration,
    };
}
