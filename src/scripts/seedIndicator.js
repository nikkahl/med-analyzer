// src/scripts/seedIndicators.js
import 'dotenv/config';
import mongoose from 'mongoose';
import Indicator from '../models/indicator.model.js';
import logger from '../logger.js';

const MONGO_URI = process.env.MONGO_URI;

const indicatorsToSeed = [
  {
    name: 'Гемоглобін',
    units: 'г/л',
    aliases: ['HGB', 'Hb', 'Hemoglobin', 'Hgb', 'гемоглобін'],
    referenceMin: 120,
    referenceMax: 160,
  },
  {
    name: 'Еритроцити',
    units: '10^12/л',
    aliases: ['RBC', 'Erythrocytes', 'Red Blood Cells', 'еритроцити'],
    referenceMin: 3.8,
    referenceMax: 5.1,
  },
  {
    name: 'Лейкоцити',
    units: '10^9/л',
    aliases: ['WBC', 'Leukocytes', 'White Blood Cells', 'лейкоцити'],
    referenceMin: 4.0,
    referenceMax: 9.0,
  },
  {
    name: 'Тромбоцити',
    units: '10^9/л',
    aliases: ['PLT', 'Platelets', 'тромбоцити'],
    referenceMin: 150,
    referenceMax: 400,
  },
  {
    name: 'Гематокрит',
    units: '%',
    aliases: ['HCT', 'Hematocrit', 'Ht', 'гематокрит'],
    referenceMin: 35,
    referenceMax: 50,
  },
  {
    name: 'ШОЕ (Швидкість осідання еритроцитів)',
    units: 'мм/год',
    aliases: ['ESR', 'ШОЕ', 'РОЕ'],
    referenceMin: 2,
    referenceMax: 15, 
  },
  {
    name: 'Лімфоцити',
    units: '%',
    aliases: ['LYM', 'LYMPH', 'Lymphocytes', 'лімфоцити'],
    referenceMin: 19,
    referenceMax: 37,
  },
  {
    name: 'Моноцити',
    units: '%',
    aliases: ['MON', 'Monocytes', 'моноцити'],
    referenceMin: 3,
    referenceMax: 11,
  }
];

const seedIndicators = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('MongoDB Connected for seeding...');

    await Indicator.deleteMany({});
    logger.info('Indicators collection cleared.');

    await Indicator.insertMany(indicatorsToSeed);
    logger.info('Indicators seeded successfully!');

    process.exit(0);
  } catch (error) {
    logger.error(`Seeding Error: ${error.message}`);
    process.exit(1);
  }
};

seedIndicators();