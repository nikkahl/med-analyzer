// tests/parser.test.js
import ParserService from '../src/services/parser.service.js';

describe('ParserService Logic', () => {
    
    beforeAll(() => {
        ParserService.dictionary = [
            {
                _id: '1',
                name: 'Гемоглобін',
                aliases: ['Hemoglobin', 'HGB'],
                units: 'г/л',
                referenceMin: 120,
                referenceMax: 160
            },
            {
                _id: '2',
                name: 'Гематокрит',
                aliases: ['HCT'],
                units: '%',
                referenceMin: 35,
                referenceMax: 50
            }
        ];
    });
    test('should correctly parse value with attached unit (137g)', () => {
        const rawText = '1. "Гемоглобіні - 137g/l НОРМА - 115 - 175';
        const result = ParserService.parse(rawText);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Гемоглобін');
        expect(result[0].value).toBe(137); 
    });

    test('should ignore list numbers in the next line', () => {
        const rawText = 'Гемоглобін 137 \n 2. Лейкоцити'; 
        const value = ParserService.extractValue(rawText.toLowerCase(), 'гемоглобін');
        expect(value).toBe(137);
    });

    test('should handle aliases (HGB)', () => {
        const rawText = 'Result HGB: 140.5 g/l';
        const result = ParserService.parse(rawText);

        expect(result[0].name).toBe('Гемоглобін');
        expect(result[0].value).toBe(140.5);
    });

    test('should ignore ranges like 10-20', () => {
        const rawText = 'Гематокрит 45 % (норма 35 - 50)';
        const result = ParserService.parse(rawText);
        
        expect(result[0].value).toBe(45);
    });
});