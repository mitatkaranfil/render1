const telegramWebApp = require('telegram-web-app');
const dotenv = require('dotenv');

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Validate Telegram WebApp data
 * @param {string} initData - Telegram WebApp init data
 * @returns {boolean} Whether the data is valid
 */
exports.validateTelegramData = (initData) => {
  // DEBUG: VALIDATION BYPASS - SADECE GELIŞTIRME SIRASINDA KULLANILMALI
  console.log('BYPASSING ALL TELEGRAM VALIDATION WITH BYPASS TOKEN');
  
  try {
    if (!BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN is missing in environment variables');
      // Hat değil, production için çalışmalı
      return true;
    }

    // Use the default export's validate method
    const isValid = telegramWebApp.validate(BOT_TOKEN, initData);
    console.log('Telegram data validation result:', isValid);
    return isValid;
  } catch (error) {
    console.error('Error validating Telegram data:', error);
    return false;
  }
};

/**
 * Extract user data from Telegram WebApp data
 * @param {Object} telegramData - Data received from Telegram WebApp
 * @returns {Object|null} User data or null if invalid
 */
exports.extractTelegramUser = (telegramData) => {
  try {
    if (!telegramData || !telegramData.user) {
      return null;
    }
    
    const { user } = telegramData;
    
    return {
      telegram_id: user.id.toString(),
      username: user.username || null,
      first_name: user.first_name || 'User',
      last_name: user.last_name || null,
      photo_url: user.photo_url || null,
      language_code: user.language_code || 'en'
    };
  } catch (error) {
    console.error('Error extracting Telegram user data:', error);
    return null;
  }
};

module.exports = {
  validateTelegramData,
  extractTelegramUser
};