// src/services/parser.service.js

import IndicatorService from './indicator.service.js';
import logger from '../logger.js';

class ParserService {
  constructor() {
    this.dictionary = []; 
    this.loadDictionary();
  }

  async loadDictionary() {
    try {
      this.dictionary = await IndicatorService.getAll();
      logger.info(`Словник завантажено. ${this.dictionary.length} показників.`);
    } catch (error) {
      logger.error('Failed to load indicator dictionary', error);
    }
  }

  parse(rawText) {
    if (!this.dictionary.length || !rawText) return [];
    
    const foundIndicators = [];
    const lowerCaseText = rawText.toLowerCase();

    for (const indicator of this.dictionary) {
    const searchTerms = [indicator.name.toLowerCase(), ...indicator.aliases.map(a => a.toLowerCase())];

      for (const term of searchTerms) {
        if (lowerCaseText.includes(term)) {
          const value = this.extractValue(lowerCaseText, term);

          if (value !== null) {
            foundIndicators.push({
              dictionaryId: indicator._id,
              name: indicator.name,
              value: value,
              units: indicator.units,
              referenceMin: indicator.referenceMin,
              referenceMax: indicator.referenceMax,
            });
            break; 
          }
        }
      }
    }
    return foundIndicators;
  }

  extractValue(text, term) {
    try {
      const termIndex = text.indexOf(term);
      if (termIndex === -1) return null;

      const startIndex = termIndex + term.length;
      let searchSlice = text.substring(startIndex, startIndex + 50);
        searchSlice = searchSlice.replace(/\d+[.,]?\d*\s*-\s*\d+[.,]?\d*/g, " ");

      
      const regex = /(?<!\w)(\d+[.,]?\d*)(?!\w)/;
      const match = searchSlice.match(regex);

      if (match && match[1]) {
        const numericString = match[1].replace(',', '.');
        return parseFloat(numericString);
      }

      return null; 
    } catch (error) {
      return null;
    }
  }
}

    export default new ParserService();