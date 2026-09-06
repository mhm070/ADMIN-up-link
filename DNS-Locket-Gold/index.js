const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  console.log("Starting the batch creation and configuration process...");
  const browser = await chromium.launch({ headless: true });

  const totalAccounts = 1;

  for (let i = 1; i <= totalAccounts; i++) {
    console.log(`\n--- Starting Account ${i} of ${totalAccounts} ---`);
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // ================================================================
      // STEP 1 & 2: Fetch temporary email
      // ================================================================
      console.log(`[Account ${i}] Fetching temporary email...`);
      await page.goto("https://tinyhost.shop", { waitUntil: "networkidle" });

      const emailSelector = "#email";
      await page.waitForSelector(emailSelector, {
        state: "visible",
        timeout: 15000,
      });
      const cleanEmail = (
        await page.locator(emailSelector).inputValue()
      ).trim();
      console.log(`[Account ${i}] Extracted Email: ` + cleanEmail);

      // ================================================================
      // STEP 3 & 4: NextDNS Signup with Verification
      // ================================================================
      console.log(`[Account ${i}] Navigating to NextDNS signup...`);
      await page.goto("https://my.nextdns.io/signup", {
        waitUntil: "networkidle",
      });

      // CẬP NHẬT: Mật khẩu dài hơn 8 ký tự
      const accountPassword = "whatupbroinreallife889";
      await page.fill('input[type="email"]', cleanEmail);
      await page.fill('input[type="password"]', accountPassword);
      await page.click('button[type="submit"]');

      // Chờ hệ thống NextDNS xử lý đăng ký
      await page.waitForTimeout(4000);

      // KIỂM TRA ĐĂNG KÝ: Nếu URL vẫn còn chữ 'signup' nghĩa là bị lỗi
      const currentURL = page.url();
      if (currentURL.includes("signup") || currentURL.includes("login")) {
        // Chụp lại màn hình lỗi để xem nguyên nhân
        await page.screenshot({ path: `error_account_${i}.png` });
        throw new Error(
          "Registration rejected by NextDNS! Check error_account_" +
            i +
            ".png in your files.",
        );
      }

      console.log(
        `[Account ${i}] Registration successful. Accessing dashboard...`,
      );

      // ================================================================
      // STEP 6: Navigate to Security & Disable all active tasks
      // ================================================================
      console.log(`[Account ${i}] Configuring Security tab...`);
      await page.getByRole("link", { name: "Security" }).click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const securityToggleSelector = "input.form-check-input:checked";

      // Đếm xem có bao nhiêu nút đang bật
      let activeCount = await page.locator(securityToggleSelector).count();
      console.log(`--> Found ${activeCount} active toggles to turn off.`);

      // Dùng vòng lặp while: Chừng nào số lượng nút bật vẫn lớn hơn 0
      while (activeCount > 0) {
        // Luôn nhắm vào nút đang BẬT đầu tiên trong danh sách và ép tắt nó
        await page
          .locator(securityToggleSelector)
          .first()
          .uncheck({ force: true });
        await page.waitForTimeout(500);

        // Đếm lại số lượng nút bật còn sót lại trên màn hình
        activeCount = await page.locator(securityToggleSelector).count();
      }

      // ================================================================
      // STEP 7: Navigate to Privacy, Turn off toggles & Remove blocklists
      // ================================================================
      console.log(`[Account ${i}] Configuring Privacy tab...`);
      await page.getByRole("link", { name: "Privacy" }).click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // PART 1: Turn off any active toggles (using the exact same logic as the Security tab)
      const privacyToggleSelector = "input.form-check-input:checked";
      let activePrivacyCount = await page
        .locator(privacyToggleSelector)
        .count();
      console.log(
        `--> Found ${activePrivacyCount} active toggles in Privacy to turn off.`,
      );

      while (activePrivacyCount > 0) {
        await page
          .locator(privacyToggleSelector)
          .first()
          .uncheck({ force: true });
        await page.waitForTimeout(500);
        activePrivacyCount = await page.locator(privacyToggleSelector).count();
      }

      // PART 2: Remove all blocklists using the SVG X-mark icon
      const removeButtonSelector = 'svg[data-icon="xmark"]';
      let removeCount = await page.locator(removeButtonSelector).count();
      console.log(`--> Found ${removeCount} blocklists to remove.`);

      while (removeCount > 0) {
        await page.locator(removeButtonSelector).first().click({ force: true });
        await page.waitForTimeout(1000);
        removeCount = await page.locator(removeButtonSelector).count();
      }

      // ================================================================
      // STEP 8: Navigate to Denylist & Add domain
      // ================================================================
      console.log(`[Account ${i}] Configuring Denylist tab...`);
      await page.getByRole("link", { name: "Denylist" }).click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // CẬP NHẬT: Dùng đúng dòng chữ mờ đã tìm được
      await page.fill(
        'input[placeholder="Add a domain..."]',
        "api.revenuecat.com",
      );
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1500);

      // ================================================================
      // STEP 9: Extract iOS Configuration Link & Save to File
      // ================================================================
      console.log(`[Account ${i}] Extracting iOS Configuration Link...`);

      const currentUrl = page.url();
      const idMatch = currentUrl.match(/my\.nextdns\.io\/([a-zA-Z0-9]+)/);

      let iosLink = "Link Not Found";
      if (idMatch && idMatch[1]) {
        const configID = idMatch[1];

        // SỬA LẠI ĐƯỜNG DẪN TẠI ĐÂY: Dùng cổng API để tải trực tiếp profile
        iosLink = `https://api.nextdns.io/apple/profile?profile=${configID}`;

        console.log(`--> Built iOS Link: ${iosLink}`);
      } else {
        console.log("--> Could not extract Config ID from URL.");
      }

      const fileContent = `Email: ${cleanEmail}\nPassword: ${accountPassword}\niOS Link: ${iosLink}\n------------------------\n`;
      fs.appendFileSync("account.txt", fileContent);

      console.log(`[Account ${i}] Setup complete. Saved to account.txt.`);
    } catch (error) {
      console.error(`[Account ${i}] Failed. Error details:`, error.message);
    } finally {
      await context.close();
    }

    if (i < totalAccounts) {
      console.log("Waiting 3 seconds before creating the next account...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  await browser.close();
  console.log(
    "\nBatch creation and configuration process finished successfully!",
  );
})();
