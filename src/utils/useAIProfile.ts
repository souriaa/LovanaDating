import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_AI_KEY = "ai_profile_limit";
const LIMIT = 5;
const RESET_TIME = 60 * 60 * 1000;

export async function getAIProfileStatus() {
  try {
    const data = await AsyncStorage.getItem(PROFILE_AI_KEY);
    const now = Date.now();

    if (!data) return { count: 0, timestamp: now };

    const { count, timestamp } = JSON.parse(data);

    if (now - timestamp > RESET_TIME) {
      await AsyncStorage.setItem(
        PROFILE_AI_KEY,
        JSON.stringify({ count: 0, timestamp: now })
      );
      return { count: 0, timestamp: now };
    }

    return { count, timestamp };
  } catch (err) {
    console.error("Error reading AI profile status:", err);
    return { count: 0, timestamp: Date.now() };
  }
}

export async function useAIProfileResponse() {
  try {
    const { count, timestamp } = await getAIProfileStatus();
    const now = Date.now();

    if (now - timestamp > RESET_TIME) {
      await AsyncStorage.setItem(
        PROFILE_AI_KEY,
        JSON.stringify({ count: 1, timestamp: now })
      );
      return 1;
    }

    await AsyncStorage.setItem(
      PROFILE_AI_KEY,
      JSON.stringify({ count: count + 1, timestamp })
    );
    return count + 1;
  } catch (err) {
    console.error("Error updating AI profile usage:", err);
    return null;
  }
}

export { LIMIT, RESET_TIME };
