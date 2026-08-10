export function getPurchasesModule() {
  try {
    return require('react-native-purchases').default;
  } catch {
    return null;
  }
}
