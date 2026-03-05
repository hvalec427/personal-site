---
layout: log
title: Connect Android Device with Wireless Debugging (ADB)
slug: connect-android-wireless-adb
---

# Connect Android Device with Wireless Debugging (ADB)

ADB allows you to debug an Android device over Wi-Fi instead of USB.

---

## 🟢 One-time setup (only once per device)

### Enable Developer Options

1. Open **Settings**
2. Go to **About phone**
3. Tap **Build number** **7 times**

### Enable Wireless Debugging

Settings → **Developer options** → enable **Wireless debugging**

---

## 🔵 Steps you must do every time

### 1. Start pairing on the phone

Open:

**Settings → Developer options → Wireless debugging → Pair device with pairing code**

You will see:

* **IP address**
* **Pairing port**
* **Pairing code**

---

### 2. Pair from your computer

```bash
adb pair <ip>:<pair-port>
```

Example:

```bash
adb pair 192.168.1.12:37123
```

Enter the **pairing code** shown on the phone.

---

### 3. Connect to the device

```bash
adb connect <ip>:<debug-port>
```

Example:

```bash
adb connect 192.168.1.12:5555
```

---

### 4. Verify connection

```bash
adb devices
```

Your device should appear as:

```
192.168.1.12:5555 device
```

---

✅ You can now install apps, run logs, and debug **without a USB cable**.
