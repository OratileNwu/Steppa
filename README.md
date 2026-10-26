# Steppa

**Your Neighbourhood. On the Move.**

Steppa is a South African neighbourhood errand platform that connects people who need everyday tasks completed with nearby runners who can take them on. The aim is to make local errands more convenient while creating earning opportunities within communities.

## Try Steppa

- **Live web app:** https://steppa.onrender.com
- **Source code:** https://github.com/OratileNwu/Steppa

The hosted version is intended for demonstration. Availability and features may change while the team continues development. Do not enter sensitive personal or payment information.

## Current MVP

The current build focuses on the core customer-to-runner errand journey:

- Customer and runner experiences.
- Creating and viewing errand requests.
- Runner acceptance and errand status updates.
- Completion flow and two-way ratings, where enabled for a completed errand.
- Firebase-backed application data and access controls.
- A web build that can be opened in a browser for demonstrations.

The feature set is still evolving. The SOS button is a **demonstration prototype only**; it does not contact emergency services, notify nearby runners, create an emergency event, or share background/live location. The native map component is also a placeholder and should not be treated as working native live tracking. Do not rely on these prototypes for real-world emergencies or location tracking.

## Technology

- **Application:** React Native
- **Framework and tooling:** Expo, Expo Router
- **Language:** TypeScript
- **Backend:** Firebase, including Firebase Authentication and Cloud Firestore where configured
- **Web map:** MapLibre
- **Hosting:** Render (web demonstration)
- **Version control:** Git and GitHub

The project may use different implementations on web and native platforms. Verify any platform-specific feature on the target device before describing it as supported.

## Run locally

### Prerequisites

Install:

- [Node.js](https://nodejs.org/) (use a version compatible with the project's Expo dependencies)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/go/) on a compatible phone, or an Android emulator

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/OratileNwu/Steppa.git
   cd Steppa
   ```

2. Install dependencies:

   ```bash
   npm ci
   ```

3. Configure the required Firebase client settings using the environment variable names referenced by the application. Keep local values in an ignored environment file such as `.env.local`; never commit private credentials or secrets. If you do not have access to the project's Firebase configuration, ask the project maintainer.

4. Start Expo:

   ```bash
   npx expo start
   ```

5. Follow the Expo CLI instructions to open the project on a compatible device or emulator. Test platform-specific functionality on the platform you intend to demonstrate.

**Windows PowerShell:** If PowerShell does not recognise `npm`, try `npm.cmd ci`.

### Useful checks

Depending on the installed dependencies and environment, these checks can help identify issues:

```bash
npx tsc --noEmit
npx expo-doctor
```

A successful type check or project diagnostic does not replace end-to-end testing of the app.

## Project structure

Key locations include:

- `app/` — Expo Router routes and screens
- `src/components/` — reusable interface components
- `src/services/` — application services, including errand and rating logic
- `src/lib/` — shared libraries and Firebase setup
- `assets/` — images, icons, and static assets
- `app.json` — Expo app configuration
- `package.json` — scripts and dependencies
- `package-lock.json` — locked dependency versions

The exact structure may evolve as development continues.

## Security and privacy

- Never commit `.env.local`, passwords, private API credentials, Firebase service-account keys, or other secrets.
- Firebase client configuration is not a substitute for correctly configured Firebase Security Rules.
- Do not publish judge/demo passwords or private credentials in this README or source control. Share demo access details only through the submission channel intended by the organisers.
- Use test accounts and non-sensitive test data for demonstrations.
- Treat the SOS and native-map limitations described above as important safety restrictions.

If a secret has already been committed, deleting it from the latest version of the file is not enough: revoke or rotate the exposed credential and review the repository history.

## Team collaboration

We use Git and GitHub to coordinate work.

1. Create a feature or fix branch.
2. Make a focused change and test it locally.
3. Commit with a clear message.
4. Push the branch and open a Pull Request for review.
5. Review the changes and resolve conflicts before merging.

Example branch names:

```text
feature/customer-errand-flow
feature/runner-dashboard
feature/firebase-setup
fix/navigation-error
```

Avoid committing generated build output such as `dist/` unless the project specifically requires it. Keep environment files and credentials out of commits.

## Android builds

The repository has an EAS `preview` profile intended to build an installable Android APK. From a configured checkout, run:

```bash
npm ci
npx expo-doctor
npx eas-cli build --platform android --profile preview
```

Sign in to the Expo account that has access to the configured EAS project when prompted. Download the APK from the completed build page and test it on an Android device. The presence of a build profile does not mean a current APK has already been built or verified.

## Useful documentation

- [Expo](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/docs/getting-started)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Firebase](https://firebase.google.com/docs)
- [MapLibre](https://maplibre.org/)
- [GitHub](https://docs.github.com/)

---

*Steppa — Your Neighbourhood. On the Move.*
