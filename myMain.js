const fs = require('fs-extra')
const fetch = require('node-fetch');
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

// const { openInstagramSignup } = require('./autov2.js'); // Giả sử bạn đã định nghĩa hàm này trong auto.js

// (accounts[3]);
// openInstagramSignup(accounts[0])
const myProxy = [{
  proxy: null,
  linkChange: 'https://api.enode.vn/getip/9995369a8e0ffe8dad010b002bd7e8f0bad8f5c6',
}, {
  proxy: null,
  linkChange: 'https://api.enode.vn/getip/4c9ea74ca50bbacb8d4bc11bfbb965722ca2920e', // Thay thế bằng link thực tế để đổi IP
}]



const MAX_CONCURRENT = 5;
const TASKS_PER_PROXY = 25;
let runningCount = 0;
let index = 0;


const proxyState = myProxy.map(p => ({
  ...p,
  taskIsHas: 0,
  taskDone: 0,
  isWaiting: false,

}));
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getNextProxy() {
  while (true) {
    // Ưu tiên tìm proxy chưa đầy (taskIsHas < TASKS_PER_PROXY)
    const availableProxies = proxyState.filter(
      proxy => !proxy.isWaiting && proxy.taskIsHas < TASKS_PER_PROXY
    );
    if (availableProxies.length > 0) {
      // Bước 2: Tìm proxy có số task ít nhất
      let minProxy = availableProxies[0];
      for (const proxy of availableProxies) {
        if (proxy.taskIsHas < minProxy.taskIsHas) {
          minProxy = proxy;
        }
      }

      console.log(`✅ Selected optimal proxy: ${minProxy.proxy} (Tasks: ${minProxy.taskIsHas})`);
      return minProxy;
    }
    await delay(5000);
  }
}

async function resetFullProxies() {

  while (true) {
    // Tìm tất cả proxy đã đầy và không đang chờ
    const fullProxies = proxyState.filter(
      proxy => proxy.taskDone >= TASKS_PER_PROXY && !proxy.isWaiting
    );

    if (fullProxies.length === 0) {
      await delay(5000); // Không có proxy cần reset, chờ 5s
      continue;
    }

    // Reset từng proxy đầy
    for (const proxy of fullProxies) {
      proxy.isWaiting = true;
      console.log(`🔄 Resetting IP for proxy: ${proxy.proxy}`);

      try {
        while (true) {
          const response = await fetch(proxy.linkChange);
          const data = await response.json();

          if (data.error) {
            const message = data.error;
            const match = message.match(/đợi (\d+) giây/);
            if (match) {
              const waitTime = parseInt(match[1], 10);
              console.log(`⏳ Đợi ${waitTime + 2} giây trước khi thử lại...`);
              await delay((waitTime + 2) * 1000);
              continue; // Thử lại
            } else {
              console.log("⚠️ Lỗi không phải do giới hạn thời gian:", message);
              break; // Lỗi khác, thoát
            }
          } else {
            break; // Reset thành công
          }
        }
        console.log('✅ IP reset done for proxy:', proxy.proxy);
        await delay(10000); // Chờ 10s sau reset
        proxy.taskDone = 0;
        proxy.taskIsHas = 0;
        proxy.isWaiting = false;
      } catch (err) {
        console.error('❌ Failed to reset IP for proxy:', proxy.proxy, err);
        await delay(10000); // Chờ lâu hơn nếu lỗi
        proxy.isWaiting = false; // Bỏ trạng thái chờ để thử lại sau
      }
    }
  }
}

// Bắt đầu luồng reset proxy
resetFullProxies().catch(err => {
  console.error('❌ Error in resetFullProxies:', err);
});

async function processNext() {
  if (index >= accounts.length) return;

  const account = accounts[index++];
  runningCount++;
  const currentProxy = await getNextProxy();
  currentProxy.taskIsHas++;
  const profile = `D:/TEMP_CHROME/chrome_${Date.now()}`;
  openInstagramSignup(account, currentProxy.proxy,profile).catch(async (e) => {
    accounts.push(account); // Đưa lại tài khoản vào cuối danh sách
  }).finally(async () => {
    runningCount--;
    currentProxy.taskDone++;
    try{
      await fs.remove(profile);
      console.log(`Đã xóa profile: ${profile}`)
    } catch(e){
      console.log("tickkkkk",e)
    }
    console.log(`✅ Finished processing account: ${account.email} | Proxy: ${currentProxy.proxy}`);
    processNext();
  });

  if (runningCount < MAX_CONCURRENT && index < accounts.length) {
    processNext();
  }
}
processNext();



