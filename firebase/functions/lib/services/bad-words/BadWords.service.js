"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadWordsService = void 0;
const blocked_words_1 = require("./blocked_words");
class BadWordsService {
    constructor() {
        // Using a Set for efficient lookups (O(1) average time complexity)
        this.blockedWords = new Set(blocked_words_1.blockedWords.map(word => word.toLowerCase()));
    }
    static getInstance() {
        if (!BadWordsService.instance) {
            BadWordsService.instance = new BadWordsService();
        }
        return BadWordsService.instance;
    }
    /**
     * Checks if a given text contains any blocked words.
     * @param text The text to check.
     * @returns True if the text contains a blocked word, false otherwise.
     */
    containsBlockedWords(text) {
        if (!text)
            return false;
        const lowerCaseText = text.toLowerCase();
        for (const word of this.blockedWords) {
            if (lowerCaseText.includes(word)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Scrubs a given text by replacing blocked words with asterisks (*).
     * @param text The text to scrub.
     * @returns The scrubbed text.
     */
    scrub(text) {
        if (!text)
            return '';
        // This is a simple implementation. For more complex cases (e.g., word boundaries),
        // you might want to use regular expressions.
        let scrubbedText = text;
        for (const word of this.blockedWords) {
            const regex = new RegExp(word, 'gi'); // g for global, i for case-insensitive
            const replacement = '*'.repeat(word.length);
            scrubbedText = scrubbedText.replace(regex, replacement);
        }
        return scrubbedText;
    }
}
exports.BadWordsService = BadWordsService;
//# sourceMappingURL=BadWords.service.js.map