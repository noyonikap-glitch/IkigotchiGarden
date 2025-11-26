# IkigotchiGarden 🌱 

![Expo](https://img.shields.io/badge/Expo-SDK%2053-blueviolet)
![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-green)
![Status](https://img.shields.io/badge/Status-MVP%20Complete-brightgreen)

A minimalist plant care companion — track watering needs, get reminders, and feel your plants bounce with joy when you care for them. Built with React Native and Expo.

---

## ✨ Features

- 📅 **Watering Reminders** via local notifications
- 🪴 **Add Your Own Plants** with type-based care suggestions
- 🎨 **Grid-Based UI** with pixel-plant avatar support
- 🔎 **Automatic Genus Detection** via a local Vision Transformer
- 💧 **Mark as Watered** with animated bounce
- 🧠 **Persistent Storage** using AsyncStorage
- 🔔 **Offline-First** and works without internet

---

## 🛠️ Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/noyonikap-glitch/IkigotchiGarden.git
cd IkigotchiGarden
```
### 2. Install dependencies
```bash
npm install
```

## 3. Log in to EAS and build a development version
```bash
eas login
eas build --profile development --platform [android || ios]
```

### 4. Start the dev server
```bash
npx expo start
```

## 5. Install EAS development version and connect to dev server

Scan the QR code with the Expo Go app on your mobile device to launch the app.

## ⚠️ Known Limitations

🔕 Expo Go no longer supports remote push notifications as of SDK 53

✅ All local notifications (watering reminders) still work as intended

🔧 If notifications don't work as expected, try:

```bash
npx expo run:android
```

## 🧩 Tech Stack

React Native

Expo SDK 53

expo-notifications for scheduled watering reminders

AsyncStorage for local plant data

Animated API for bounce effects

FlatList for responsive grids


## 💡 Ideas for Future Features

☁️ Cloud sync + user accounts

🔄 Recurring care tasks (pruning, fertilizing)

🌤 Weather-integrated watering logic

👯 Share plant collections with friends

## 📄 License
MIT License — use, remix, modify, and grow your own garden 🌱

Made with 💚 by @noyonikap-glitch, @nf317881, and @segtreebruh



