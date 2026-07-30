export function getMobileAdsModule() {
  try {
    return require('react-native-google-mobile-ads');
  } catch (error) {
    return null;
  }
}
