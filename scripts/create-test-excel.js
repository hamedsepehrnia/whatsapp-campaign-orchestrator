require('dotenv').config();
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Create test recipients data
const testRecipients = [
    { phone: '09123456789', name: 'علی احمدی' },
    { phone: '09187654321', name: 'فاطمه محمدی' },
    { phone: '09121112233', name: 'محمد رضایی' },
    { phone: '09124445566', name: 'زهرا کریمی' },
    { phone: '09127778899', name: 'حسین نوری' },
    { phone: '09129998877', name: 'مریم صادقی' },
    { phone: '09123334455', name: 'رضا احمدی' },
    { phone: '09126667788', name: 'سارا موسوی' },
    { phone: '09125554433', name: 'امیر حسینی' },
    { phone: '09128889900', name: 'نرگس رضوی' }
];

// Create workbook
const wb = xlsx.utils.book_new();

// Create worksheet from data
const ws = xlsx.utils.json_to_sheet(testRecipients);

// Add worksheet to workbook
xlsx.utils.book_append_sheet(wb, ws, 'Recipients');

// Ensure uploads/templates directory exists
const templatesDir = path.join(__dirname, '../src/uploads/templates');
if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
}

// Write file
const filePath = path.join(templatesDir, 'test-recipients.xlsx');
xlsx.writeFile(wb, filePath);

console.log('✅ Test Excel file created successfully!');
console.log(`📁 File path: ${filePath}`);
console.log(`📊 Total recipients: ${testRecipients.length}`);
console.log('\n📋 Recipients list:');
testRecipients.forEach((recipient, index) => {
    console.log(`   ${index + 1}. ${recipient.name} - ${recipient.phone}`);
});
console.log('\n💡 You can use this file to test campaign recipient upload.');

