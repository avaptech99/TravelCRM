"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTravelInfo = extractTravelInfo;
const chrono = __importStar(require("chrono-node"));
const compromise_1 = __importDefault(require("compromise"));
const cache_1 = __importDefault(require("./cache"));
function extractTravelInfo(text) {
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
    const cached = cache_1.default.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] NLP Extraction: ${cacheKey}`);
        return { ...cached };
    }
    const doc = (0, compromise_1.default)(text);
    let destinationCity = undefined;
    let travelDate = undefined;
    let travellers = undefined;
    // Detect places (cities or countries)
    let places = doc.places().out('array');
    if (places && places.length > 0) {
        destinationCity = places[0];
    }
    else {
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
    }
    else {
        const textNumberMatch = text.match(/(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(pax|persons|people|travelers|travellers|members|adults|kids|children|infants)/i);
        if (textNumberMatch) {
            const wordToNumber = {
                one: 1, two: 2, three: 3, four: 4, five: 5,
                six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
                eleven: 11, twelve: 12
            };
            travellers = wordToNumber[textNumberMatch[1].toLowerCase()];
        }
    }
    const result = {
        destinationCity,
        travelDate,
        travellers,
    };
    // Cache the result for 1 hour — NLP logic doesn't change
    cache_1.default.set(cacheKey, result, 3600);
    return result;
}
