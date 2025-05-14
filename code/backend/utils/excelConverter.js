import xlsx from 'xlsx';

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

function parseGoToValues(responseString) {
    if (!responseString) return {};
    
    // Return object with key-value pairs for branching logic
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
    let present_section = "";

    // console.log("Questions extracted:", questions.filter(q => q.Id !== undefined && q.Id !== ''));
    
    return questions.reduce((acc, q) => {
        if (q.Element?.toLowerCase() === 'section') {
            // Update section and skip adding to results
            present_section = q.Text || '';
            return acc;
        }
        
        if (q.Id !== undefined && q.Id !== '') {
            // Process options and extract range values if applicable
            const options = q.Options ? q.Options.split(',').map(opt => opt.trim()) : [];
            let minValue = undefined;
            let maxValue = undefined;
            
            if (q.Type?.toLowerCase() === 'range' && options.length === 2) {
                [minValue, maxValue] = options.map(val => parseInt(val));
            }
            
            // Add question with current section
            acc.push({
                id: (q.Id?.toString().match(/\d+/) || ["0"])[0],
                text: q.Text || '',
                type: q.Type?.toLowerCase() || '',
                required: q.Required ? (q.Required.toLowerCase() === 'yes') : false,
                options: options,
                GoTo: parseGoToValues(q.GoTo),
                section: present_section,
                answer: "",
                ...(minValue !== undefined && { minValue }),
                ...(maxValue !== undefined && { maxValue })
            });
        }
        return acc;
    }, []);
}

// Function to generate a unique FormID (timestamp-based)
function generateUniqueFormId() {
    // Using current timestamp + random number to ensure uniqueness
    return Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 10000);
}

// Main function to convert Excel to form data
export function convertExcelToFormData(buffer) {
    // Load the Excel file from buffer
    const workbook = xlsx.read(buffer, { type: 'buffer' });

    // Extract data from sheets
    const settingsSheet = workbook.Sheets['Settings'];
    const questionnaireSheet = workbook.Sheets['Questionnare'];

    if (!settingsSheet || !questionnaireSheet) {
        throw new Error('Excel file must contain "Settings" and "Questionnare" sheets');
    }

    const formSettings = getFormSettings(settingsSheet);
    const questions = getQuestions(questionnaireSheet);

    return {
        // Auto-generate FormID instead of using from sheet
        FormID: generateUniqueFormId(),
        title: formSettings['Title'] || 'Untitled Form',
        description: formSettings['Description'] || '',
        date: formSettings['Date'] || new Date().toISOString().split('T')[0],
        Questions: questions
    };
}