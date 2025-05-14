import xlsx from 'xlsx';
import fs from 'fs';

// Load the Excel file
const workbook = xlsx.readFile('messform.xlsx');

// Function to extract form settings
function getFormSettings(sheet) {
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    const settings = {};
    if (data[0] && data[1]) {
        data[0].forEach((key, index) => {
            if (key && data[1][index]) {
                // Convert Excel date number to proper date string
                if (key === 'Date') {
                    const excelDate = data[1][index];
                    if (typeof excelDate === 'number') {
                        const dateObj = xlsx.SSF.parse_date_code(excelDate);
                        settings[key] = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
                    } else {
                        settings[key] = data[1][index];
                    }
                } else {
                    settings[key] = data[1][index];
                }
            }
        });
    }
    return settings;
}

function parseResponseCounts(responseString) {
    if (!responseString) return {};
    
    return responseString.split(',')
        .reduce((acc, pair) => {
            const [option, count] = pair.split(':').map(s => s.trim());
            acc[option] = parseInt(count);
            return acc;
        }, {});
}

// Function to extract questionnaire data
function getQuestions(sheet) {
    const questions = xlsx.utils.sheet_to_json(sheet);
    return questions.map(q => ({
        id: q.Id.toString() || "0",
        text: q.Question || '',
        type: q.Type || '',
        options: q.Options ? q.Options.split(',').map(opt => opt.trim()) : [],
        GoTo: parseResponseCounts(q.GoTo)
    }));
}

// Extract data from sheets
const settingsSheet = workbook.Sheets['Settings'];
const questionnaireSheet = workbook.Sheets['Questionnare'];
// console.log(questionnaireSheet);

const formSettings = settingsSheet ? getFormSettings(settingsSheet) : {};
const questions = questionnaireSheet ? getQuestions(questionnaireSheet) : [];

const formJson = {
    FormID: formSettings['FormID'] || '',
    title: formSettings['Title'] || '',
    description: formSettings['Description'] || '',
    date: formSettings['Date'] || '',
    Questions: questions
};

// Save to JSON file
fs.writeFileSync('form_data.json', JSON.stringify(formJson, null, 2));
console.log('Form data extracted successfully!');
