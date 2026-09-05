export function getGoogleSignInModule() {
  try {
    return require('@react-native-google-signin/google-signin');
  } catch {
    return null;
  }
}
