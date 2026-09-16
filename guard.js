/**
 * guard.js
 * این فایل رو در ابتدای <head> یا شروع <body> هر برنامه لود کن.
 * هر بار برنامه باز می‌شه، وضعیت دسترسی از فایل config.json در گیت‌هاب چک می‌شه.
 */
(function () {
  // ==== تنظیمات: این آدرس رو با آدرس ریپوی خودت جایگزین کن ====
  const CONFIG_URL =
    "https://cdn.jsdelivr.net/gh/USERNAME/REPO@main/config.json";
  // اگه jsDelivr کش قدیمی نشون داد، از raw.githubusercontent.com استفاده کن:
  // const CONFIG_URL = "https://raw.githubusercontent.com/USERNAME/REPO/main/config.json";

  const STORAGE_KEY = "app_device_id";

  function getOrCreateDeviceId() {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  }

  function showBlockScreen(message) {
    document.documentElement.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = `
      body { margin:0; }
      .guard-block {
        position: fixed; inset: 0;
        background: #111318; color: #f5f5f5;
        display: flex; align-items: center; justify-content: center;
        text-align: center; padding: 24px;
        font-family: -apple-system, "Segoe UI", Tahoma, sans-serif;
        direction: rtl; font-size: 18px; line-height: 1.7;
        z-index: 999999;
      }
    `;
    document.head.appendChild(style);
    const overlay = document.createElement("div");
    overlay.className = "guard-block";
    overlay.textContent = message || "دسترسی شما به این برنامه لغو شده است.";
    document.body.appendChild(overlay);
  }

  async function checkAccess() {
    const deviceId = getOrCreateDeviceId();

    // اطلاعات دستگاه که همراه هر چک ارسال می‌شه (فقط برای شناسایی؛ به هیچ سروری پوش نمی‌شه،
    // فقط اگه بعداً بخوای بک‌اند اضافه کنی برای لاگ کردنش آماده‌ست)
    const deviceInfo = {
      device_id: deviceId,
      user_agent: navigator.userAgent,
      platform: navigator.platform || "",
      language: navigator.language || "",
    };
    window.__deviceInfo = deviceInfo; // برای دیباگ در کنسول مرورگر قابل مشاهده‌ست

    try {
      const res = await fetch(CONFIG_URL + "?t=" + Date.now(), {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("config fetch failed");
      const config = await res.json();

      if (Array.isArray(config.banned_ids) && config.banned_ids.includes(deviceId)) {
        showBlockScreen(config.message);
      }
      // اگه بن نبود، اجرای عادی برنامه بدون وقفه ادامه پیدا می‌کنه
    } catch (e) {
      // بدون اینترنت یا خطای شبکه: برنامه به‌صورت عادی اجرا می‌شه
      console.warn("Access check skipped:", e.message);
    }
  }

  checkAccess();
})();
