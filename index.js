const { chromium } = require('playwright');

// Use environment variable for webhook URL, with a default value
const webhookUrl = process.env.WEBHOOK_URL || "https://api.day.app/";

// const producUrl = "https://www.metrobyt-mobile.com/cell-phone/apple-iphone-12";
// const producUrl2 = "https://www.metrobyt-mobile.com/cell-phone/apple-iphone-13";
const producUrl = "https://sell.pia.jp/inbound/selectTicket.php?eventCd=2435790&rlsCd=008&langCd=eng&x=191&y=32";

const makeGetRequest = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP request failed with status ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    throw error;
  }
};

const checkStock = async () => {
  let browser;
  try {
    console.log(webhookUrl);
    browser = await chromium.launch();
    const urls = [producUrl];
    console.log("start checking ticket");
    const results = await Promise.all(urls.map(async (url) => {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for the select element to be available
    await page.waitForSelector('#insPerformCode');

    // Select the option with value "013"
    await page.selectOption('#insPerformCode', '013');

    // Wait for potential dynamic changes after selection
    await page.waitForTimeout(1000);

    // Check the inputs with values "01", "03", "05"
    const valuesToCheck = ['01', '03', '05'];
    
    for (const value of valuesToCheck) {
      const input = await page.$(`input[value="${value}"]`);
      
      if (input) {
        // Check if the input is disabled
        const isDisabled = await input.evaluate(el => el.disabled);
        
        if (!isDisabled) {
          const message = "Ticket is available on https://sell.pia.jp/inbound/selectTicket.php?eventCd=2435790&rlsCd=008&langCd=eng&x=191&y=32"
          await makeGetRequest(webhookUrl + encodeURIComponent(message));
          console.log('Sent message to Bark:', message);
        } else {
          console.log("Ticket not available this time")
        }
      }
    }
    await page.close();
    }));
  } catch (error) {
    console.error('Error in checkStock:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      return
    }
  }
};

checkStock();