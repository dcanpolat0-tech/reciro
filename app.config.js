const fs = require('fs');
const path = require('path');

const appJson = require('./app.json');

function loadLocalEnv() {
  const envPath = path.join(__dirname, '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadLocalEnv();

module.exports = ({ config }) => ({
  ...config,
  ...appJson.expo,
  extra: {
    ...(config.extra || {}),
    ...(appJson.expo.extra || {}),
    receiptAnalysisUrl: process.env.EXPO_PUBLIC_RECEIPT_ANALYSIS_URL || '',
    analysisClientToken: process.env.EXPO_PUBLIC_ANALYSIS_CLIENT_TOKEN || '',
    revenueCatIosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '',
    revenueCatAndroidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || appJson.expo.extra?.supabaseUrl || '',
    supabasePublishableKey:
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || appJson.expo.extra?.supabasePublishableKey || '',
    googleIosClientId:
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || appJson.expo.extra?.googleIosClientId || '',
    googleWebClientId:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || appJson.expo.extra?.googleWebClientId || '',
  },
});
