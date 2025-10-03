import { router, Stack } from "expo-router";
import { isEqual } from "lodash";
import { Alert } from "react-native";
import colors from "tailwindcss/colors";
import { theme } from "../../../../../constants/theme";
import { useMyProfile, useUpdateProfile } from "../../../../api/my-profile";
import { StackHeaderV3 } from "../../../../components/stack-header-v3";
import { MaterialTopTabs } from "../../../../layouts/material-top-tabs";
import { useEdit } from "../../../../store/edit";

export default function Layout() {
  const { data: profile } = useMyProfile();
  const { edits, setEdits, gridActive } = useEdit();
  const { mutate } = useUpdateProfile();

  const handlePressCancel = async () => {
    if (isEqual(profile, edits)) {
      router.dismiss();
      return;
    }

    Alert.alert(
      "Discard Changes",
      "Are you sure you want to discard your changes?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Discard",
          onPress: () => {
            setEdits(profile);
            router.dismiss();
          },
        },
      ]
    );
  };

  const handlePresDone = async () => {
    if (!edits) {
      Alert.alert("Error", "Something went wrong, please try again later");
      return;
    }

    if (isEqual(profile, edits)) {
      router.dismiss();
      return;
    }

    mutate(edits, {
      onSuccess: () => {
        router.dismiss();
      },
      onError: () => {
        Alert.alert("Error", "Something went wrong, please try again later");
      },
    });
  };
  return (
    <>
      <StackHeaderV3
        title={edits?.first_name || ""}
        onPressCancel={handlePressCancel}
        onPressDone={handlePresDone}
      />
      <MaterialTopTabs
        screenOptions={{
          tabBarIndicatorStyle: {
            backgroundColor: theme.colors.primary,
          },
          tabBarLabelStyle: {
            textTransform: "capitalize",
            fontWeight: "bold",
            fontSize: 13,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: colors.neutral[300],
          swipeEnabled: !gridActive,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Edit",
          }}
        />
        <Stack.Screen
          name="view"
          options={{
            title: "View",
          }}
        />
      </MaterialTopTabs>
    </>
  );
}
