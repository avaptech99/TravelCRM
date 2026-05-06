import * as chrono from 'chrono-node';
import nlp from 'compromise';
import appCache from './cache';

interface TravelInfo {
    destinationCity?: string;
    travelDate?: Date;
    travellers?: number;
}

export function extractTravelInfo(text: string): TravelInfo {
    if (!text) {
        return {
            destinationCity: undefined,
            travelDate: undefined,
            travellers: undefined,
        };
    }

    // Normalize text for cache key (lowercase, trimmed, max 200 chars to avoid huge keys)
    const normalizedText = text.trim().toLowerCase().substring(0, 200);
    const cacheKey = `nlp_${Buffer.from(normalizedText).toString('base64').substring(0, 32)}`;
    
    const cached = appCache.get(cacheKey) as TravelInfo | null;
    if (cached) {
        console.log(`[CACHE HIT] NLP Extraction: ${cacheKey}`);
        return { ...cached };
    }

    const doc = nlp(text);

    let destinationCity: string | undefined = undefined;
    let travelDate: Date | undefined = undefined;
    let travellers: number | undefined = undefined;

    // Detect places (cities or countries)
    let places = doc.places().out('array');
    if (places && places.length > 0) {
        destinationCity = places[0];
    } else {
        // Fallback: Heuristic for "to [Place]" or "visit [Place]"
        const heuristic = doc.match('(to|visit|at|in) [#Noun+]').not('(to|visit|at|in)').first();
        if (heuristic.found) {
            destinationCity = heuristic.out('text').trim();
        }
    }

    // Detect date
    const parsedDate = chrono.parseDate(text);
    if (parsedDate) {
        travelDate = parsedDate;
    }

    // Detect traveller count
    const numberMatch = text.match(/([\d]+)\s?(pax|persons|people|travelers|travellers|members|adults|kids|children|infants)/i);
    if (numberMatch) {
        travellers = parseInt(numberMatch[1], 10);
    } else {
        const textNumberMatch = text.match(/(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(pax|persons|people|travelers|travellers|members|adults|kids|children|infants)/i);
        if (textNumberMatch) {
            const wordToNumber: { [key: string]: number } = {
                one: 1, two: 2, three: 3, four: 4, five: 5,
                six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
                eleven: 11, twelve: 12
            };
            travellers = wordToNumber[textNumberMatch[1].toLowerCase()];
        }
    }

    const result: TravelInfo = {
        destinationCity,
        travelDate,
        travellers,
    };

    // Cache the result for 1 hour — NLP logic doesn't change
    appCache.set(cacheKey, result, 3600);

    return result;
}
