import {blockedWords} from './blocked_words';

export class BadWordsService {
  private static instance: BadWordsService;
  private readonly blockedWords: Set<string>;

  private constructor() {
    // Using a Set for efficient lookups (O(1) average time complexity)
    this.blockedWords = new Set(blockedWords.map(word => word.toLowerCase()));
  }

  public static getInstance(): BadWordsService {
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
  public containsBlockedWords(text: string): boolean {
    if (!text) return false;
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
  public scrub(text: string): string {
    if (!text) return '';
    
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
