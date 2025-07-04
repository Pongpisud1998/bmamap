npm install -g expo-cli

npx create-expo-app react-map

cd react-app

npx expo prebuild

npm install @rnmapbox/maps


xcode-select -p
/Library/Developer/CommandLineTools X

fix: sudo xcode-select --switch /Applications/Xcode.app

xcode-select -p
/Applications/Xcode.app/Contents/Developer Y

ls /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/


rm -rf ios/Pods ios/Podfile.lock
cd ios
pod install --repo-update
cd ..
npx expo run:ios

npm install --save-dev typescript @types/react @types/react-native