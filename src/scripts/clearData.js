// src/scripts/clearData.js
import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Analysis from '../models/analysis.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../public/uploads');

const clearData = async () => {
  try {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not defined in .env');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const result = await Analysis.deleteMany({});
    console.log(` Видалено записів з бази: ${result.deletedCount}`);

    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      let deletedFiles = 0;

      for (const file of files) {
        if (file === '.gitkeep') continue; 
        
        fs.unlinkSync(path.join(uploadsDir, file));
        deletedFiles++;
      }
      console.log(`Видалено картинок з диска: ${deletedFiles}`);
    } else {
      console.log('Папка uploads порожня.');
    }

    console.log('Історія очищена');
    process.exit(0);

  } catch (error) {
    console.error('Помилка при очищенні:', error);
    process.exit(1);
  }
};

clearData();