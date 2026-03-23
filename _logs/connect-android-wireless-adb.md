---
layout: log
title: Connect Android Device with Wireless Debugging (ADB)
slug: connect-android-wireless-adb
created_at: 2026-03-05
updated_at: 2026-03-05
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

2. Developer options
3. Wireless debugging
4. Pair device with pairing code\*\*

You will see:

- **IP address**
- **Pairing port**
- **Pairing code**

### 2. Pair from your computer

```bash
adb pair <ip>:<pair-port>
```

Example:

```bash
adb pair 192.168.1.12:37123
```

Enter the **pairing code** shown on the phone.

### 3. Connect to the device

```bash
adb connect <ip>:<debug-port>
```

Example:

```bash
adb connect 192.168.1.12:5555
```

### 4. Verify connection

```bash
adb devices
```

Your device should appear as:

```
192.168.1.12:5555 device
```

You can now install apps, run logs, and debug **without a USB cable**.
