// src/services/ocr.service.js

import { createWorker } from 'tesseract.js';
import logger from '../logger.js'; 


class OcrService { 

  constructor() { 
    this.languages = 'ukr+eng';
    logger.info('OcrService initialized. Languages: ' + this.languages);
  }

  /**
   * Розпізнає текст із буфера зображення.
   * @param {Buffer} imageBuffer - буфер зображення, отриманий від multer.
   * @returns {Promise<string>} - розпізнаний текст.
   */
  async recognize(imageBuffer) {
    logger.info('Starting OCR process...');
    let worker;
    try {
      
      worker = await createWorker(this.languages); 
 
      const { data: { text } } = await worker.recognize(imageBuffer);
      logger.info('OCR process finished successfully.');
 
      return text;
 
    } catch (error) {
      logger.error('Error during OCR process', error);
      throw new Error('Failed to recognize text from image.');
 
    } finally {
      if (worker) {
        await worker.terminate();
        logger.info('Tesseract worker terminated.');
      }
    }
  }
}

export default new OcrService();