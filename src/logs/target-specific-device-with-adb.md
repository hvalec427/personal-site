---
title: How to Target a Specific Device with ADB
created: 2026-05-20
updated: 2026-05-20
---

# How to Target a Specific Device with ADB

List connected devices and emulators:

```
adb devices
```

Target a specific device with `-s`:

```
adb -s emulator-5554 install app.apk
adb -s emulator-5554 uninstall com.example.app
```

Example with a physical device:

```
adb -s R58M123ABC install app.apk
adb -s R58M123ABC uninstall com.example.app
```
