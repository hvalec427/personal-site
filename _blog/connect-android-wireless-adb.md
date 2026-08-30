---
title: Connect Android Device with Wireless Debugging (ADB)
description: Debug an Android device over Wi-Fi instead of USB.
created: 2026-03-05
updated: 2026-03-29
---

# Connect Android Device with Wireless Debugging (ADB)

ADB allows you to debug an Android device over Wi-Fi instead of USB.

## One-time setup (only once per device)

### Enable Developer Options

1. Open **Settings**
2. Go to **About phone**
3. Tap **Build number** **7 times**

### Enable Wireless Debugging

1. Settings
2. **Developer options**
3. enable **Wireless debugging**

## Steps you must do every time

### 1. Start pairing on the phone

1. Developer options
2. Wireless debugging
3. Pair device with pairing code

You will see:

- **IP address**
- **Pairing port**
- **Pairing code**

### 2. Pair from your computer

```
adb pair <ip>:<pair-port>
```

Example:

```
adb pair 192.168.1.12:37123
```

Enter the **pairing code** shown on the phone.

### 3. Connect to the device

```
adb connect <ip>:<debug-port>
```

Example:

```
adb connect 192.168.1.12:5555
```

### 4. Verify connection

```
adb devices
```

Your device should appear as:

```
192.168.1.12:5555 device
```

You can now install apps, run logs, and debug **without a USB cable**.
