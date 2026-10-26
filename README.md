# Steppa

**Your Neighbourhood. On the Move.**

Steppa is a South African neighbourhood-based platform designed to connect people who need everyday errands completed with local runners who can assist. The goal is to make local errands more convenient while creating earning opportunities within communities.

> **Project status:** Early development — features and requirements are still being finalised by the team.

## Technology Stack

- **Mobile application:** React Native
- **Development framework:** Expo
- **Language:** TypeScript
- **Backend services:** Firebase (planned)
- **Version control:** Git and GitHub

## Getting Started

### Prerequisites

Before running Steppa locally, install:

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/go/) on a compatible mobile device, or an Android emulator.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/OratileNwu/Steppa.git
   ```

2. Navigate to the project directory:

   ```bash
   cd Steppa
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the Expo development server:

   ```bash
   npx expo start
   ```

5. Follow the terminal instructions to open the app on a compatible device or emulator.

**Windows PowerShell note:** If PowerShell blocks the `npm` command, use `npm.cmd install` instead.

## Project Structure

The application uses Expo Router for file-based navigation.

- `src/app/` — application screens and routes
- `assets/` — images, icons, and other static assets
- `package.json` — project dependencies and scripts
- `package-lock.json` — locked dependency versions

The exact structure may evolve as development progresses.

## Team Collaboration

We use GitHub to manage the codebase and coordinate development.

### Workflow

1. Keep the `main` branch stable.
2. Create a separate branch for each feature or task.
3. Commit changes with clear, descriptive messages.
4. Push your branch to GitHub.
5. Open a Pull Request to merge your changes into `main`.
6. Review changes and resolve conflicts before merging.

### Branch naming examples

```text
feature/home-screen
feature/user-authentication
feature/firebase-setup
feature/runner-dashboard
fix/navigation-error
```

Avoid committing directly to `main` when working on a shared feature.

## Development Guidelines

- Discuss and agree on features before implementation.
- Keep code readable and organised.
- Do not commit passwords, API keys, Firebase service-account credentials, or other secrets.
- Test changes locally before opening a Pull Request.
- Update this README as the project evolves.

## Useful Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [GitHub Documentation](https://docs.github.com/)

---

*Steppa — Your Neighbourhood. On the Move.*
## Hackathon build notes

### Android APK (internal testing)

The repository includes an EAS `preview` profile configured to produce an installable Android APK. From a clean checkout, run:

```bash
npm ci
npx expo-doctor
npx eas-cli build --platform android --profile preview
```

Sign in to the Expo account with access to the configured EAS project when prompted. Download the APK from the completed EAS build page and install it on a test Android phone. Build completion and device testing must be verified by the team; configuration alone does not mean an APK has already been built or tested.

### Safety prototype limitation

The runner dashboard includes a visible SOS prototype button for demonstration. At this stage it only displays an explanatory message. It does **not** contact emergency services, notify nearby runners, upload an emergency event, or share background/live location. Do not rely on it for real emergencies.

### Maps and location status

The web map implementation uses MapLibre. The native `SteppaMap` component remains a placeholder until native map rendering, location permissions, and device testing are implemented. Do not describe native live tracking as working until it has been verified on physical Android devices.
