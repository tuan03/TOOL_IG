const fs = require('fs');

const data = fs.readFileSync('accounts.txt', 'utf-8');
const accounts = data
    .split('\n')                      // Tách thành từng dòng
    .map(line => line.trim())        // Xóa khoảng trắng đầu cuối mỗi dòng
    .filter(line => line !== '')     // Bỏ dòng trống
    .map(line => {
        const [email, password, refresh_token, client_id] = line.split('|');
        return { email, password, refresh_token, client_id };
    });



const { openInstagramSignup } = require('./auto.js'); // Giả sử bạn đã định nghĩa hàm này trong auto.js

// (accounts[3]);


const MAX_CONCURRENT = 3;
let runningCount = 0;
let index = 0;
async function processNext() {
  if (index >= accounts.length) return;

  const account = accounts[index++];
  runningCount++;

  openInstagramSignup(account).finally(() => {
    runningCount--;
    processNext(); 
  });

  if (runningCount < MAX_CONCURRENT && index < accounts.length) {
    processNext();
  }
}
processNext();
