import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, View } from "react-native";
import { theme } from "~/constants/theme";
import { setScheduleSubtext } from "../../service/messageService";
import { InputAlertModal } from "./input-alert-modal";
import { MessageItem } from "./message-item";

interface MessageListProps {
  messages: any[];
  userId: string;
  onReply: (message: any) => void;
  onToggleTime: (id: string) => void;
  onLongPress: (message: any) => void;
  statusText: string;
  loadOlderMessages: () => Promise<any[]>;
  hasMore: boolean;
  toggledTimeIds: string[];
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  userId,
  onReply,
  onToggleTime,
  onLongPress,
  statusText,
  loadOlderMessages,
  hasMore,
  toggledTimeIds,
}) => {
  const [loadingOlder, setLoadingOlder] = useState(false);

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [activeMessage, setActiveMessage] = useState<any | null>(null);
  const [aiAnswerText, setAiAnswerText] = useState<any | null>(null);

  const [loadingRes, setLoadingRes] = useState(false);

  async function getAIAnswer(
    promptText: string,
    customizationMessage?: string
  ): Promise<string | null> {
    if (!promptText) return null;

    const aiPrompt = `
You are an AI assistant helping a user plan a date. 
The user wants ideas for places, activities, or things to prepare for a successful and enjoyable date. 
Focus on PRACTICAL SUGGESTIONS, giving out things in BULLET POINTS, CREATIVE IDEAS, and TIPS for preparation.
Base your suggestions on this input:
"${promptText}"
${customizationMessage ? `Additional instructions: ${customizationMessage}` : ""}

Provide a short, friendly, natural response. 
Use clear, actionable suggestions. 
Only one short paragraph, do not repeat or quote the input. 
Answer in English unless otherwise instructed or answer in language that Additional instructions used.
`.trim();

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_URL}/AIReplySuggestion`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aiPrompt),
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      return data?.body || null;
    } catch (err) {
      console.error("Failed to fetch AI answer:", err);
      return null;
    }
  }

  const handleAIRecommendationPress = (message: any) => {
    setActiveMessage(message);
    setAiModalVisible(true);
  };

  const handleAiOk = async (value: string) => {
    if (!value) {
      Alert.alert("Error", "Invalid prompt!", [
        { text: "OK", style: "cancel" },
      ]);
      return;
    }

    setLoadingRes(true);
    setAiModalVisible(false);

    try {
      const aiAnswer = await getAIAnswer(
        "User wants suggestions for date places, activities, and preparation tips.",
        value
      );

      if (aiAnswer && activeMessage) {
        setAiAnswerText(aiAnswer);
        await setScheduleSubtext(activeMessage.id, aiAnswer);
      }
    } catch (err) {
      console.error(err);
      Alert.alert(
        "Error",
        "Something went wrong while getting AI suggestions."
      );
    } finally {
      setLoadingRes(false);
    }
  };

  const handleAiCancel = () => {
    setAiModalVisible(false);
  };

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const isMine = String(item.sender_id) === String(userId);
      return (
        <MessageItem
          item={item}
          index={index}
          isMine={isMine}
          userId={userId}
          onToggleTime={onToggleTime}
          onLongPress={onLongPress}
          statusText={statusText}
          onReply={onReply}
          showTime={toggledTimeIds.includes(item.id)}
          onAIRequest={() => handleAIRecommendationPress(item)}
          aiLoading={loadingRes}
          aiAnswerText={aiAnswerText}
        />
      );
    },
    [userId, onToggleTime, onLongPress, statusText, loadingRes, aiAnswerText]
  );

  const handleEndReached = async () => {
    if (loadingOlder || !hasMore) return;

    setLoadingOlder(true);
    try {
      await loadOlderMessages();
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setLoadingOlder(false);
    }
  };

  return (
    <>
      <FlatList
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        inverted
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          loadingOlder ? (
            <View style={{ padding: 8 }}>
              <ActivityIndicator
                size="small"
                color={theme.colors.primaryDark}
              />
            </View>
          ) : null
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 10,
          flexGrow: 1,
          justifyContent: "flex-end",
        }}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={5}
      />

      <InputAlertModal
        visible={aiModalVisible}
        title="AI Recommendation for Date"
        message="Enter details about the date or preferences. For example: type of activity, mood, or special requests."
        placeholder="e.g., Give me an easy/common place to go out, and tell me what I need to prepare to surprise the other person? Answer in Vietnamese"
        okText="Confirm"
        cancelText="Cancel"
        onOk={handleAiOk}
        onCancel={handleAiCancel}
      />
    </>
  );
};
