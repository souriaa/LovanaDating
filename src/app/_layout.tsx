import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SendbirdUIKitContainer } from "@sendbird/uikit-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Checkbox from "expo-checkbox";
import { useFonts } from "expo-font";
import { Image } from "expo-image";
import * as Notifications from "expo-notifications";
import { SplashScreen, Stack } from "expo-router";
import { VideoView } from "expo-video";
import LottieView from "lottie-react-native";
import { cssInterop } from "nativewind";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView from "react-native-maps";
import { theme } from "../../constants/theme";
import "../../global.css";
import { getProfile } from "../../service/userService";
import { fonts } from "../constants/fonts";
import { platformServices } from "../lib/sendbird";
import { supabase } from "../lib/supabase";
import { AuthProvider } from "../store/auth";

cssInterop(VideoView, { className: { target: "style" } });
cssInterop(Ionicons, { className: { target: "style" } });
cssInterop(Image, { className: { target: "style" } });
cssInterop(MapView, { className: { target: "style" } });
cssInterop(Checkbox, { className: { target: "style" } });
cssInterop(LottieView, { className: { target: "style" } });

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      lightColor: theme.colors.primaryDark,
    });
  }

  return token;
}

export default function Layout() {
  const [loaded, error] = useFonts(fonts);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    const setupPush = async () => {
      const token = await registerForPushNotificationsAsync();
      if (!token) return;

      const profile = await getProfile();
      if (!profile) return;

      await supabase.from("user_push_tokens").upsert({
        profile_id: profile.id,
        token,
        device_name: Platform.OS,
        updated_at: new Date(),
      });
    };

    setupPush();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      async (notification) => {
        await Notifications.presentNotificationAsync(
          notification.request.content
        );
      }
    );
    return () => subscription.remove();
  }, []);

  if (!loaded && !error) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SendbirdUIKitContainer
        appId={process.env.EXPO_PUBLIC_SENDBIRD_APP_ID!}
        chatOptions={{ localCacheStorage: AsyncStorage }}
        platformServices={platformServices}
      >
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen
                name="(app)"
                options={{
                  animation: "none",
                }}
              />
              <Stack.Screen
                name="(auth)"
                options={{
                  animation: "none",
                }}
              />
            </Stack>
          </AuthProvider>
        </QueryClientProvider>
      </SendbirdUIKitContainer>
    </GestureHandlerRootView>
  );
}
