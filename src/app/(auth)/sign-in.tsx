import { VideoBackground } from "@/components/video-background";
import { Link, Stack } from "expo-router";
import { Pressable, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "tailwindcss/colors";
import Logo from "~/assets/images/lovana-logo.svg";

export default function Page() {
  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <StatusBar barStyle={"light-content"} />
      <VideoBackground source={require("~/assets/images/background.mp4")}>
        <SafeAreaView className="flex-1 p-10">
          <View className="flex-1 items-center pt-14">
            <Logo fill={colors.white} width={150} height={57} />
            <View className="h-4" />
            <Text className="text-white text-xl font-poppins-semibold">
              Designed to be deleted
            </Text>
          </View>
          <Link href={"/phone"} asChild>
            <Pressable className="bg-fuchsia-900 h-16 items-center justify-center rounded-full">
              <Text className="text-white text-lg font-poppins-semibold">
                Sign in with Phone Number
              </Text>
            </Pressable>
          </Link>
        </SafeAreaView>
      </VideoBackground>
    </View>
  );
}
