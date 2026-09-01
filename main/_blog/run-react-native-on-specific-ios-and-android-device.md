---
title: Run React Native App on a Specific Device or Simulator
description: Targeting a specific device or simulator when running a React Native app.
created: 2026-05-20
updated: 2026-05-20
---

# Run React Native App on a Specific Device or Simulator

## Android

Run on the default device or emulator:

```
npx react-native run-android
```

Run on a specific emulator or device:

```
npx react-native run-android --deviceId emulator-5554
```

```
npx react-native run-android --deviceId R58M123ABC
```

## iOS

Run on the default simulator:

```
npx react-native run-ios
```

Run on a specific simulator:

```
npx react-native run-ios --simulator="iPhone 16"
```

Run on a simulator or physical device by UDID:

```
npx react-native run-ios --udid YOUR_UDID
```

## Tips

Get connected Android device and emulator IDs:

```
adb devices
```

Get connected iOS device and simulator UDIDs:

```
xcrun xctrace list devices
```

If you use a custom script like `yarn ios`, add `--` before the flags:

```
yarn ios -- --simulator="iPhone 16"
yarn ios -- --udid YOUR_UDID
yarn android -- --deviceId emulator-5554
```
