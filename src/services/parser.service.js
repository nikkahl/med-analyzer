// src/services/parser.service.js

import IndicatorService from './indicator.service.js';
import logger from '../logger.js';

class ParserService {
  constructor() {
    this.dictionary = []; // кешування довідника
    this.loadDictionary();
  }

  async loadDictionary() {
    try {
      logger.info('Loading indicator dictionary...');
      this.dictionary = await IndicatorService.getAll();
      logger.info(`Dictionary loaded successfully. ${this.dictionary.length} indicators.`);
    } catch (error) {
      logger.error('Failed to load indicator dictionary', error);
    }
  }

  /**
   * @param {string} rawText - Сирий текст від Tesseract.
   * @returns {Array<Object>} - Масив показників.
   */
  parse(rawText) {
    if (!this.dictionary.length) {
      logger.warn('Parser dictionary is empty. Cannot parse text.');
      return [];
    }

    const foundIndicators = [];
    // Приводимо весь текст до нижнього регістру 
    const lowerCaseText = rawText.toLowerCase();

    // 1. Проходимо по кожному показнику з довідника
    for (const indicator of this.dictionary) {
      // 2. Створюємо список всіх можливих назв (основна + аліаси)
      const searchTerms = [indicator.name.toLowerCase(), ...indicator.aliases.map(a => a.toLowerCase())];

      // 3. Шукаємо кожну назву в тексті
      for (const term of searchTerms) {
        if (lowerCaseText.includes(term)) {
          // 4. числове значення
          const value = this.extractValue(lowerCaseText, term);

          if (value !== null) {
            // 5. Додаємо знайдений показник у результат
            foundIndicators.push({
              dictionaryId: indicator._id, // Посилання на довідник [cite: 97]
              name: indicator.name,     // "Гемоглобін" [cite: 98]
              value: value,             // 130 [cite: 99]
              units: indicator.units,     // "г/л" [cite: 100]
            });
           
            break;
          }
        }
      }
    }

    return foundIndicators;
  }

  /**
   * Допоміжна функція для пошуку числа.
   * @param {string} text - Текст у нижньому регістрі
   * @param {string} term - Знайдений термін (напр. "гемоглобін")
   * @returns {number | null} - Знайдене число або null
   */
  extractValue(text, term) {
    try {
      // Знаходимо, де закінчується термін
      const termIndex = text.indexOf(term);
      const startIndex = termIndex + term.length;

      // Дивимося на "зріз" тексту після терміну
      // (шукаємо у наступних ~30 символах)
      const searchSlice = text.substring(startIndex, startIndex + 30);

      // Регулярний вираз для пошуку числа (напр. 130, 4.5, 12,7)
      const regex = /([\d]+[.,]?[\d]*)/;
      const match = searchSlice.match(regex);

      if (match && match[0]) {
        // Замінюємо кому на крапку (для стандартного float)
        const numericString = match[0].replace(',', '.');
        return parseFloat(numericString);
      }

      return null; // Не знайшли число поруч
    } catch (error) {
      logger.warn(`Error extracting value for term: ${term}`, error);
      return null;
    }
  }
}

export default new ParserService();