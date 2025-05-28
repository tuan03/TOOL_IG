const { Builder, By, until, Key } = require('selenium-webdriver');
const { generateVietnameseName,
    generateStrongPassword,
    appendLog,
    generateRandomUsername, waitForOTPWithTimeout } = require("./utils/gen.js");

require('chromedriver');
const chrome = require('selenium-webdriver/chrome');

async function fillData(driver, xpath, text) {

    const input = await driver.wait(
        until.elementLocated(By.xpath(xpath)),
        10000
    );

    // Clear nếu cần
    await input.clear();

    // Nhập text vào input
    await input.sendKeys(text);
}
async function clickButton(driver, xpath) {
    const button = await driver.wait(
        until.elementLocated(By.xpath(xpath)),
        7000
    );
    await button.click();

}
async function scrollToBottom(driver) {
    await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
    await sleep(1000); // Chờ 1 giây để trang tải thêm nội dung
}
async function scrollToTop(driver) {
    await driver.executeScript("window.scrollTo(0, 0);");
    await sleep(1000);
}
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function openInstagramSignup(account, proxy = null, profile) {
    let options = new chrome.Options();
    options.addArguments('--lang=vi');

    options.addArguments(`--user-data-dir=${profile}`);
    if (proxy) {
        console.log(`Sử dụng proxy: ${proxy}`);
        options.addArguments(`--proxy-server=http://${proxy}`);
        options.addArguments('--ignore-certificate-errors');
        options.addArguments('--allow-insecure-localhost');
    }
    // options.addArguments('--headless', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'); // Uncomment nếu cần chạy headless
    const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    await driver.manage().setTimeouts({ implicit: 5000 });

    try {
        const name = generateVietnameseName();
        const password = generateStrongPassword(12);
        const txt = `${account.email} | ${password} | ${name}`;
        appendLog(txt, 'logs/working.txt');

        await driver.get('https://www.instagram.com/accounts/emailsignup');


        await fillData(driver, '//input[@name="emailOrPhone"]', account.email);
        await sleep(1000);
        await fillData(driver, '//input[@name="password"]', password);

        await sleep(1000);
        await fillData(driver, '//input[@name="fullName"]', name);

        await sleep(2000);
        try {
            await clickButton(driver, "//button[.//span[text()='Làm mới đề xuất']]")
        } catch (e) {
            const username = generateRandomUsername(account.email);
            await fillData(driver, '//input[@name="username"]', username);
        }

        // await clickButton(driver, "//button[.//span[text()='Làm mới đề xuất']]")
        await scrollToBottom(driver);
        await sleep(1000);
        await clickButton(driver, "//button[@type='submit' and text()='Đăng ký']")
        await sleep(2000);
        await scrollToTop(driver);

        await driver.wait(until.elementLocated(By.css('select[title="Tháng:"]')), 5000);
        await driver.wait(until.elementLocated(By.css('select[title="Ngày:"]')), 5000);
        await driver.wait(until.elementLocated(By.css('select[title="Năm:"]')), 5000);



        const monthSelect = await driver.wait(
            until.elementLocated(By.css('select[title="Tháng:"]')),
            10000
        );
        const daySelect = await driver.wait(
            until.elementLocated(By.css('select[title="Ngày:"]')),
            5000
        );
        const yearSelect = await driver.wait(
            until.elementLocated(By.css('select[title="Năm:"]')),
            5000
        );

        await monthSelect.click();
        const randomNumber_Month = Math.floor(Math.random() * (4 - 1 + 1)) + 1;
        for (let i = 0; i < randomNumber_Month; i++) {
            await driver.actions().sendKeys(Key.ARROW_DOWN).perform();
            await driver.sleep(40);
        }
        await monthSelect.sendKeys(Key.ENTER);

        await daySelect.click();
        const randomNumber_Day = Math.floor(Math.random() * (20 - 1 + 1)) + 1;
        for (let i = 0; i < randomNumber_Day; i++) {
            await driver.actions().sendKeys(Key.ARROW_UP).perform();
            await driver.sleep(40);
        }
        await daySelect.sendKeys(Key.ENTER);

        await yearSelect.click();
        const randomNumber_Year = Math.floor(Math.random() * (30 - 23 + 1)) + 23;
        for (let i = 0; i < randomNumber_Year; i++) {
            await driver.actions().sendKeys(Key.ARROW_DOWN).perform();
            await driver.sleep(40);
        }
        await yearSelect.sendKeys(Key.ENTER);


        await sleep(1000);
        await clickButton(driver, "//button[@type='button' and text()='Tiếp']")
        await sleep(2000); // Chờ 2 giây để trang tải
        try {
            const otp = await waitForOTPWithTimeout(account, 240000, 10000);
            await fillData(driver, '//input[@name="email_confirmation_code"]', otp);
            await clickButton(driver, "//div[@role='button' and text()='Tiếp']");
            await sleep(5000); // Chờ 5 giây để trang tải
            const start = Date.now();
            while (true) {
                try {
                    // Chờ xem có span chứa text "Mã không hợp lệ..."
                    await driver.wait(until.elementLocated(By.xpath("//span[text()='Mã không hợp lệ. Bạn có thể yêu cầu mã mới.']")), 5000);

                    // Nếu có thì tìm nút "Gửi lại mã." và click
                    const resendButton = await driver.findElement(By.xpath("//div[contains(text(), 'Gửi lại mã')]"));
                    await resendButton.click();
                    await sleep(15000); // Chờ 15 giây để trang tải
                    const otp = await waitForOTPWithTimeout(account, 240000, 10000);
                    await fillData(driver, '//input[@name="email_confirmation_code"]', otp);
                    await clickButton(driver, "//div[@role='button' and text()='Tiếp']");
                    await sleep(5000); // Chờ 5 giây để trang tải
                } catch (e) {
                    break;
                }
                if (Date.now() - start > 30000) {
                    throw new Error('Đợi OTP Đã vượt quá 30 giây');
                }
            }
            const targetUrl = 'https://www.instagram.com/';
            const startTime = Date.now();
            const text1 = 'Địa chỉ IP bạn đang dùng đã được gắn cờ là một proxy mở';
            const text2 = 'Rất tiếc, đã xảy ra sự cố khi tạo tài khoản của bạn'
            const TIMEOUT = 5000
            while ((Date.now() - startTime) < 180000) {
                const currentUrl = await driver.getCurrentUrl();

                // Kiểm tra URL hiện tại
                if (currentUrl === targetUrl ||currentUrl.includes('https://www.instagram.com/accounts/suspended')) {
                    console.log(`✅ Đăng ký thành công cho tài khoản: ${account.email}`);
                    appendLog(`${account.email} | ${password} | Nhập thành công: ${otp}`, 'logs/accSuccessDone.txt');
                    return
                }
                try{
                    const el0 = await driver.wait(until.elementLocated(By.xpath("//span[text()='Mã không hợp lệ. Bạn có thể yêu cầu mã mới.']")), TIMEOUT);
                    break;
                }catch(e){

                }
                try {
                    const el1 = await driver.wait(until.elementLocated(By.xpath(`//*[contains(text(), "${text1}")]`)), TIMEOUT);
                    if (el1) {
                        await clickButton(driver, "//div[@role='button' and text()='Tiếp']");
                    }
                } catch (e) {
                }


                try {
                    const el2 = await driver.wait(until.elementLocated(By.xpath(`//*[contains(text(), "${text2}")]`)), TIMEOUT);
                    if (el2) {
                        appendLog(`${account.email}`, 'logs/accSpam.txt');
                        return;
                    }
                } catch (e) {

                }

            }
            throw new Error(`Có lỗi xảy ra khi tạo tài khoản, sẽ runback ${account.email}`)
        } catch (error) {
            appendLog(`${account.email} | ${error.message}`, 'logs/accFails.txt');
            throw new Error(`Không nhận được mã OTP trong thời gian chờ cho tài khoản: ${account.email}`);
        }

    } catch (err) {
        console.error('Lỗi:', err);
        await sleep(2000);
        await driver.quit()
        throw new Error(`Không thể đăng ký tài khoản: ${account.email}. Lỗi: ${err.message}`);
    } finally {
        // Đóng trình duyệt sau 10s hoặc bạn có thể comment để giữ mở
        await sleep(2000);
        await driver.quit()
        await sleep(1000);

    }
}

module.exports = { openInstagramSignup };
