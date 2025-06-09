# smokedpi
Grill controller
=======
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
(Complete working version 1.0 of Smoked Pi app)

## Docker

You can also run the development server inside a Docker container.

Build the image:

```bash
docker build -t smokedpi .
```

Start the server:

```bash
docker run -it --rm \
  -p 8081:8081 \
  -p 19000:19000 \
  -p 19001:19001 \
  -p 19002:19002 \
  -p 19006:19006 \
  smokedpi
```

The Expo CLI will start and you can access the project using the printed URL.

You can alternatively use **Docker Compose** to build and run the project:

```bash
docker compose up --build
```

When finished, stop the server with `Ctrl+C` and run:

```bash
docker compose down
```

Docker Compose maps the same ports so the app will be available at the printed URL.
