# Filum Webchat — React Native Example

A minimal example showing how to embed [Filum](https://filum.ai) Webchat inside a React Native (Expo) app using a WebView.

It demonstrates:

- Loading the Filum Webchat inside a `WebView`
- Passing the logged-in user's info (name, email, phone) so returning users don't have to re-identify
- Persisting the chat session across app restarts (via `AsyncStorage`)
- Handling `postMessage` events from the Webchat (`webchat_loaded`, `update_session`, `open_link`)
- Safely handling external links tapped inside the chat (copy to clipboard or open in browser, with a warning for non-Filum domains)

## Files

| File | Purpose |
| --- | --- |
| `LiveChatScreen.tsx` | The screen component that renders the WebView and handles messages |
| `construct-webchat-url.ts` | Builds the Webchat URL with all the required query parameters |

Drop these two files into your own Expo/React Native app.

## Configuration

Open `LiveChatScreen.tsx` and replace the placeholder constants near the top of the file with the values from your Filum workspace:

```ts
const BASE_URL = 'https://chat.filum.ai';
const ORG_ID = 'REPLACE_WITH_YOUR_ORG_ID';
const INSTALLED_SOURCE_ID = 0; // <-- Replace with YOUR installedSourceId
```

- **`BASE_URL`** — keep `https://chat.filum.ai` for Filum production.
- **`ORG_ID`** — your organization ID from the Filum dashboard.
- **`INSTALLED_SOURCE_ID`** — **you must change this to your own `installedSourceId`**. You can find it in your Filum dashboard under the Webchat installation settings. Each customer has their own value.

Optionally, you can also change the `defaultUser` object to pass your real logged-in user's info so the chat can pre-fill the contact form.

## Dependencies

Install these in your Expo / React Native project:

```sh
npx expo install react-native-webview react-native-safe-area-context @react-native-async-storage/async-storage expo-clipboard
```

- `react-native-webview` — renders the embedded Webchat
- `react-native-safe-area-context` — keeps the chat above the home indicator on notched devices
- `@react-native-async-storage/async-storage` — persists the chat session between app launches
- `expo-clipboard` — copies links to the clipboard when the user taps a link inside the chat

## Usage

```tsx
import LiveChatScreen from './LiveChatScreen';

export default function App() {
  return <LiveChatScreen />;
}
```

Make sure the screen is wrapped in a `SafeAreaProvider` somewhere above it (usually at the app root):

```tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Root() {
  return (
    <SafeAreaProvider>
      <LiveChatScreen />
    </SafeAreaProvider>
  );
}
```

## How it works

The URL built by `constructWebchatUrl` includes:

- `organizationId`, `installedSourceId` — identify your workspace
- `mode=webview` & `hideHeader=true` — tell Filum Webchat to render in mobile mode
- `locale` — the display language (`en`, `vi`, etc.)
- `_defaultUserName`, `_defaultUserEmail`, `_defaultUserPhone` — optional prefill values
- `sessionId`, `sessionToken`, `sessionTokenExpiration`, `userId`, `conversationId` — restored from a previous session, so the user returns to their existing conversation

When the Webchat is loaded, it sends messages back to the native side via `window.ReactNativeWebView.postMessage(...)`. The native side listens in `onMessage`:

- `webchat_loaded` — the chat UI is ready; hide the loading spinner
- `update_session` — new session data to persist; save it to `AsyncStorage`
- `open_link` — the user tapped an external link; show a confirm modal before opening

## License

MIT
