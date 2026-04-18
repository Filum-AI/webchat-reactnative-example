import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { constructWebchatUrl, type LiveChatSessionData } from './construct-webchat-url';

// ---------------------------------------------------------------------------
// Filum Webchat configuration
// ---------------------------------------------------------------------------
// NOTE: Replace `ORG_ID` and `INSTALLED_SOURCE_ID` below with the values from
// your own Filum workspace. You can find these in your Filum dashboard under
// the Webchat installation settings. `BASE_URL` stays the same for all
// customers using Filum production (https://chat.filum.ai).
// ---------------------------------------------------------------------------
const BASE_URL = 'https://chat.filum.ai';
const ORG_ID = 'REPLACE_WITH_YOUR_ORG_ID';
const INSTALLED_SOURCE_ID = 0; // <-- Replace with YOUR installedSourceId

const SESSION_STORAGE_KEY = 'filum_live_chat_session';

export default function LiveChatScreen() {
  const [webchatLoaded, setWebchatLoaded] = useState(false);
  const [liveChatUrl, setLiveChatUrl] = useState('');
  const [pendingLink, setPendingLink] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    AsyncStorage.getItem(SESSION_STORAGE_KEY).then((value) => {
      let sessionData: LiveChatSessionData | undefined = undefined;
      if (value) {
        try {
          sessionData = JSON.parse(value);
        } catch {
          console.error('Failed to parse session data from async storage');
        }
      }
      const url = constructWebchatUrl({
        baseUrl: BASE_URL,
        orgId: ORG_ID,
        installedSourceId: INSTALLED_SOURCE_ID,
        sessionData,
        // Optional: prefill the chat with the logged-in user's info.
        defaultUser: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: undefined,
        },
        locale: 'en',
      });
      setLiveChatUrl(url);
    });
  }, []);

  return (
    <>
      <View style={styles.container}>
        {!webchatLoaded && <ActivityIndicator style={styles.loader} />}
        {liveChatUrl && (
          <WebView
            originWhitelist={['https://chat.filum.ai', 'https://chat.filum.asia']}
            source={{ uri: liveChatUrl }}
            onError={(event) => {
              console.error(event);
            }}
            style={[
              styles.webview,
              { opacity: webchatLoaded ? 1 : 0, paddingBottom: insets.bottom },
            ]}
            onMessage={async (event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'webchat_loaded') {
                  setWebchatLoaded(true);
                } else if (data.type === 'update_session') {
                  const sessionData = data.data;
                  AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
                } else if (data.type === 'open_link') {
                  const url = data.data;
                  if (!url) return;
                  setPendingLink(url);
                }
              } catch (err) {
                console.error('Invalid WebView message', err);
              }
            }}
          />
        )}
      </View>

      <Modal
        visible={!!pendingLink}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingLink(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPendingLink(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Open link</Text>
            <Text style={styles.modalUrl} numberOfLines={2}>
              {pendingLink}
            </Text>
            {pendingLink && !/^https?:\/\/([^/]*\.)?filum\.ai/i.test(pendingLink) && (
              <Text style={styles.modalWarning}>
                Be cautious when opening links from unknown sources
              </Text>
            )}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  if (!pendingLink) return;
                  Clipboard.setStringAsync(pendingLink).then(() =>
                    Alert.alert('Success', 'Link copied'),
                  );
                  setPendingLink(null);
                }}
              >
                <Text style={styles.primaryButtonText}>Copy link</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  if (!pendingLink) return;
                  Linking.openURL(pendingLink);
                  setPendingLink(null);
                }}
              >
                <Text style={styles.secondaryButtonText}>Open in browser</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  loader: { position: 'absolute', top: '50%', left: 0, right: 0 },
  webview: { flex: 1 },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    marginHorizontal: 32,
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: 'white',
    padding: 24,
  },
  modalTitle: { textAlign: 'center', fontSize: 18, fontWeight: '600' },
  modalUrl: { marginTop: 8, textAlign: 'center', fontSize: 14, color: '#6b7280' },
  modalWarning: { marginTop: 12, textAlign: 'center', fontSize: 12, color: '#ea580c' },
  modalActions: { marginTop: 20, gap: 12 },
  primaryButton: { alignItems: 'center', borderRadius: 12, backgroundColor: '#2563eb', paddingVertical: 12 },
  primaryButtonText: { fontWeight: '600', color: 'white' },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    paddingVertical: 12,
  },
  secondaryButtonText: { fontWeight: '600' },
});
