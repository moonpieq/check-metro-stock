const { chromium } = require('playwright');

// Use environment variable for webhook URL, with a default value
const webhookUrl = process.env.WEBHOOK_URL || "https://api.day.app/default-key/";

const producUrl = "https://www.metrobyt-mobile.com/cell-phone/apple-iphone-12";
const producUrl2 = "https://www.metrobyt-mobile.com/cell-phone/apple-iphone-se-3rd-gen";

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
  console.log("Initiating check stock sequence");
  let browser;
  try {
    browser = await chromium.launch();
    const urls = [producUrl, producUrl2];
    const results = await Promise.all(urls.map(async (url) => {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });
      if(await page.isVisible('[id = "onetrust-reject-all-handler"]')){
        await page.click('[id = "onetrust-reject-all-handler"]');
      }
      
      await page.click('.text-medium.text-tmo-gray75.font-weight-bold');

      const isButtonActive = await page.evaluate(() => {
        const button = document.querySelector('button[data-testid="add-to-cart-button"]');
        if (button) {
          return !button.disabled && !button.classList.contains('mat-button-disabled');
        } else {
          console.log("Add to cart button not found")
        }
        return false;
      });

      console.log(`Button status for ${url}: ${isButtonActive ? 'Active' : 'Inactive'}`);
      await page.close();
      return { url, isButtonActive };
    }));

    const inStockItems = results.filter(result => result.isButtonActive);

    if (inStockItems.length > 0) {
      const message = inStockItems.map(item => `iPhone in stock at ${item.url}`).join(', ');
      await makeGetRequest(webhookUrl + encodeURIComponent(message));
      console.log('Sent message to Bark:', message);
      return
    } else {
      console.log('Stock check complete. No items in stock.');
      return
    }
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