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
    aliases: ['HGB', 'Hb', 'Hemoglobin', 'Hgb', 'гемоглобін']
  },
  {
    name: 'Еритроцити',
    units: '10^12/л',
    aliases: ['RBC', 'Erythrocytes', 'Red Blood Cells', 'еритроцити']
  },
  {
    name: 'Лейкоцити',
    units: '10^9/л',
    aliases: ['WBC', 'Leukocytes', 'White Blood Cells', 'лейкоцити']
  },
  {
    name: 'Гематокрит',
    units: '%',
    aliases: ['HCT', 'Hematocrit', 'PCV', 'гематокрит']
  },
  {
    name: 'Тромбоцити',
    units: '10^9/л',
    aliases: ['PLT', 'Platelets', 'тромбоцити']
  },
  {
    name: 'ШОЕ',
    units: 'мм/год',
    aliases: ['ESR', 'Швидкість осідання еритроцитів', 'РОЕ']
  },
  {
    name: 'Лімфоцити',
    units: '%',
    aliases: ['LYM', 'LYMPH', 'Lymphocytes', 'лімфоцити']
  },
  {
    name: 'Моноцити',
    units: '%',
    aliases: ['MON', 'Monocytes', 'моноцити']
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('Connected to DB for seeding...');

    await Indicator.deleteMany({});
    logger.info('Old indicators cleared.');

    await Indicator.insertMany(indicatorsToSeed);
    logger.info(`Successfully seeded ${indicatorsToSeed.length} indicators!`);

    process.exit(0);
  } catch (error) {
    logger.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();