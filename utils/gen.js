const path = require('path');
const fs = require('fs');
function generateVietnameseName() {
    const familyNames = [
        "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng",
        "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Tạ", "Đinh", "Trịnh", "Mai", "Hà",
        "La", "Chu", "Cao", "Thái", "Kiều", "Tô", "Lâm", "Quách",
        "Trương", "Lương", "Vương", "Đoàn", "Quang", "Cung", "Tống", "Triệu", 
        "Nghiêm", "Bạch", "Vi", "Giang", "Nguyễn Thị", "Lưu", "Liêu", "Thạch", "Châu", 
        "Hứa", "Phùng", "Tiêu", "Tăng", "Âu Dương", "Mạc", "Trà"
    ];

    const middleNames = [
        "Văn", "Hữu", "Đức", "Công", "Ngọc", "Thị", "Minh", "Gia", "Thanh", "Trọng",
        "Anh", "Quang", "Xuân", "Tiến", "Thành", "Tấn", "Thế", "Nhật", "Bảo", "Diệu",
        "Mạnh", "Khánh", "Thùy", "Phương", "Vĩnh", "Phúc", "Đình", "Thiện",
        "Chí", "Tuấn", "Kim", "Lan", "Hải", "Trí", "Thảo", "Thu", "Mai", "Diễm",
        "Tú", "Ngân", "Yến", "Như", "Tường", "Việt", "Đan", "Thi", "An", "Linh",
        "Tâm", "Cẩm", "Hương", "Hòa", "Lệ", "Thắm", "Quỳnh", "Thục", "Tiểu", "Uyên"
    ];

    const givenNames = [
        "An", "Bình", "Chi", "Dũng", "Hà", "Hạnh", "Hải", "Hiếu", "Hương", "Hùng",
        "Khoa", "Khôi", "Lan", "Linh", "Mai", "Nam", "Phong", "Phúc", "Quân", "Quỳnh",
        "Sơn", "Tâm", "Thảo", "Thắng", "Thịnh", "Trang", "Trung", "Tú", "Tuấn", "Vy",
        "Anh", "Thư", "Hải", "Long", "Tiến", "Ngân", "Thúy", "Lộc", "Tín", "Loan",
        "Nhung", "Kim", "Diễm", "Yến", "Tường", "Việt", "Châu", "Vân", "Bảo", "Nhi",
        "Đạt", "Kiên", "Cường", "Hạo", "Tài", "Khánh", "Thái", "Trí", "Phát", "Toàn",
        "Duy", "Đức", "Khang", "Thiện", "Lâm", "Hậu", "Tiểu", "Hoa", "Thắm", "Oanh",
        "Trâm", "Ngọc", "Thục", "Hân", "Giang", "My", "Di", "Thu", "Hòa", "Minh",
        "Tú", "Uyên", "Thương", "Lệ", "Tuyến", "Trang", "Như", "Tịnh", "Thúy An", "Bích"
    ];

    const family = familyNames[Math.floor(Math.random() * familyNames.length)];
    const middle = middleNames[Math.floor(Math.random() * middleNames.length)];
    const given = givenNames[Math.floor(Math.random() * givenNames.length)];

    return family + " " + middle + " " + given;
}

function generateStrongPassword(length = 12) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*()_+[]{}|;:,.<>?';

  const all = upper + lower + digits + special;

  let password = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  for (let i = password.length; i < length; i++) {
    password.push(all[Math.floor(Math.random() * all.length)]);
  }

  // Trộn ngẫu nhiên các ký tự
  return password.sort(() => Math.random() - 0.5).join('');
}
function appendLog(message, logFile = 'logs/logs.txt') {
    const logDir = path.dirname(logFile);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    fs.appendFile(logFile, logEntry, (err) => {
        if (err) {
            console.error('❌ Lỗi ghi log:', err);
        }
    });
}
const { spawn } = require("child_process");

function runGetMail(email, refresh_token, client_id) {
  return new Promise((resolve, reject) => {
    const proc = spawn("python", ["./utils/getCode.py", email, refresh_token, client_id]);

    let stdoutData = "";
    let stderrData = "";

    proc.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        // Thành công, trả về code lấy được
        resolve(stdoutData.trim());
      } else {
        // Thất bại, trả về lỗi
        reject(new Error(stderrData.trim() || "Unknown error"));
      }
    });
  });
}
async function waitForOTPWithTimeout(account, timeoutMs = 120000, intervalMs = 6000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const interval = setInterval(async () => {
      try {
        const opt = await runGetMail(account.email, account.refresh_token, account.client_id);
        
        if (opt) {
          clearInterval(interval);
          resolve(opt); // Trả về mã OTP nếu có
        }
      } catch (err) {
        // Có thể in log tạm thời ở đây nếu muốn theo dõi
      }

      // Kiểm tra quá thời gian
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        reject(new Error('Timeout khi lấy mã xác nhận (OTP)'));
      }
    }, intervalMs); // mỗi 5s kiểm tra 1 lần
  });
}
module.exports = {
  generateVietnameseName,
  generateStrongPassword,
  appendLog,
  runGetMail,
  waitForOTPWithTimeout
};