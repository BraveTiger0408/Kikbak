App.accessRule('*'); 

App.info({
  id: 'tv.kikbak.kikbak',
  name: 'kikbak.tv',
  description: 'Top Music Videos of the Web',
  author: 'Andrew Lisowski and Emmett Harper',
  website: 'http://kikbak.tv',
  version: '1.0.0'
});

// iOS Preferences
App.setPreference('Orientation', 'default');
App.setPreference('Orientation', 'all', 'ios')
App.setPreference('StatusBarStyle', 'lightcontent');
App.setPreference('StatusBarOverlaysWebView', 'true');

App.icons({
  // iOS
  'iphone': 'resources/icons/ios/Icon-60.png',
  'iphone_2x': 'resources/icons/ios/Icon-60@2x.png',
  'iphone_3x': 'resources/icons/ios/Icon-60@3x.png',
  'ipad': 'resources/icons/ios/Icon-76.png',
  'ipad_2x': 'resources/icons/ios/Icon-76@2x.png',
  // Android
  'android_ldpi': 'resources/icons/android/36.png',
  'android_mdpi': 'resources/icons/android/48.png',
  'android_hdpi': 'resources/icons/android/72.png',
  'android_xhdpi': 'resources/icons/android/96.png'
});

App.launchScreens({
  // iOS
  'iphone': 'resources/splash/ios/iPhone3-Portrait.png',
  'iphone_2x': 'resources/splash/ios/iPhone4-2x-Portrait.png',
  'iphone5': 'resources/splash/ios/iPhone5-2x-Portrait.png',
  'iphone6': 'resources/splash/ios/iPhone6-2x-Portrait.png',
  'iphone6p_portrait': 'resources/splash/ios/iPhone6+-Portrait.png',
  'iphone6p_landscape': 'resources/splash/ios/iPhone6+-Landscape.png',

  'ipad_portrait': 'resources/splash/ios/ipadPortrait.png',
  'ipad_portrait_2x': 'resources/splash/ios/iPadAir_Mini@2x-Portrait.png',
  'ipad_landscape': 'resources/splash/ios/ipadLandscape.png',
  'ipad_landscape_2x': 'resources/splash/ios/iPadAir_Mini@2x-Landscape.png',
  // Android 
  'android_ldpi_portrait': 'resources/splash/android/LDPI-Portrait.png',
  'android_ldpi_landscape': 'resources/splash/android/LDPI-Landscape.png',
  'android_mdpi_portrait': 'resources/splash/android/MDPI-Portrait.png',
  'android_mdpi_landscape': 'resources/splash/android/MDPI-Landscape.png',
  'android_hdpi_portrait': 'resources/splash/android/HDPI-Portrait.png',
  'android_hdpi_landscape': 'resources/splash/android/HDPI-Landscape.png',
  'android_xhdpi_portrait': 'resources/splash/android/XDPI-Portrait.png',
  'android_xhdpi_landscape': 'resources/splash/android/XDPI-Landscape.png'
});