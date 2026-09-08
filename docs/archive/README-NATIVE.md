# Loadnote — Native App Wrapper (Capacitor)

This wraps the existing web app in a native shell for **Android** and **iOS** using [Capacitor](https://capacitorjs.com/).

## Requirements

### Both platforms
- Node.js 20+ and npm
- This project folder (`fitness-tracker`)

### Android
- Android Studio (latest)
- Android SDK + an emulator or USB device with debugging enabled

### iOS (Mac only)
- macOS
- Xcode + CocoaPods (`sudo gem install cocoapods`)

## One-time setup

```bash
cd fitness-tracker
npm install
node scripts/sync-www.js
npx cap add android   # Linux/Mac/Windows
npx cap add ios       # Mac only
npx cap sync
```

## Day-to-day workflow

1. Edit the web app files in the project root (`index.html`, `app.js`, `styles.css`, …).
2. Sync into the native projects:

```bash
npm run sync
```

3. Open in the native IDE:

```bash
npm run android   # opens Android Studio
npm run ios       # opens Xcode (Mac only)
```

4. Press **Run** in Android Studio or Xcode.

## Build release

### Android APK / AAB
1. `npm run sync`
2. Open Android Studio → **Build → Generate Signed Bundle / APK**
3. Follow the signing wizard (create a keystore if you don’t have one)

### iOS
1. `npm run sync`
2. Open Xcode → select your Team under Signing
3. **Product → Archive** → distribute via TestFlight or App Store

## Notes

- Data stays **on-device** (IndexedDB / local storage in the WebView). It does not sync to the cloud unless you add that later.
- Camera barcode scanning needs the **Camera** permission on device; Capacitor will use the WebView implementation.
- Service workers behave differently inside native WebViews; the app works without them.
- Do not commit huge `android/` / `ios/` build artifacts if you prefer a slim repo — you can always `cap add` again. After `cap add`, those folders are required for local builds.

## App IDs

- **appId:** `com.fitnesstracker.app` (change in `capacitor.config.json` before store release)
- **appName:** Loadnote
