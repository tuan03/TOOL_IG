const fs = require('fs');

// Đọc danh sách tài khoản
const data = fs.readFileSync('accounts.txt', 'utf-8');
const accounts = data
  .split('\n')
  .map(line => line.trim())
  .filter(line => line !== '');

// Đọc danh sách email thành công
const data2 = fs.readFileSync('./logs/accSuccessDone.txt', 'utf-8');
const successEmails = new Set(
  data2
    .split('\n')
    .map(line => line.trim().split('|')[0].trim())
    .filter(email => email.includes('@'))
);

// Lọc bỏ những dòng có email đã thành công
const filteredAccounts = accounts.filter(line => {
  const email = line.split('|')[0].trim();
  return !successEmails.has(email);
});

// Ghi ra file mới hoặc ghi đè lại accounts.txt
fs.writeFileSync('accounts_filtered.txt', filteredAccounts.join('\n'), 'utf-8');

console.log(`Đã lọc xong. Còn lại ${filteredAccounts.length} dòng.`);
