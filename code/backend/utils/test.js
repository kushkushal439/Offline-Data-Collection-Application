import fs from 'fs';
import { convertExcelToFormData } from './excelConverter.js';

// Read the Excel file
try {
    const buffer = fs.readFileSync('./test.xlsx');
    const formData = convertExcelToFormData(buffer);
    
    // Pretty print the result
    console.log('Converted Form Data:');
    console.log(JSON.stringify(formData, null, 2));
} catch (error) {
    console.error('Error:', error.message);
}