import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { theme } from "../../constants/theme";
import {
  declineSchedule,
  getScheduleParticipantsByMessageId,
  getScheduleSubtext,
  participateInSchedule,
} from "../../service/messageService";
import { getActivePlanByUserId } from "../../service/profilePlanService";
import { getProfile } from "../../service/userService";
import { supabase } from "../lib/supabase";
import { SwipeableMessage } from "./swipeable-message";

interface MessageItemProps {
  item: any;
  index: number;
  isMine: boolean;
  userId: string;
  onToggleTime: (id: string) => void;
  onLongPress: (message: any) => void;
  statusText: string;
  onReply: (message: any) => void;
  showTime: boolean;
  onAIRequest?: (message: any) => void;
  aiLoading?: boolean;
  aiAnswerText: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  item,
  index,
  isMine,
  userId,
  onToggleTime,
  onLongPress,
  statusText,
  onReply,
  showTime,
  onAIRequest,
  aiLoading,
  aiAnswerText,
}) => {
  const [hovered, setHovered] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [userDecision, setUserDecision] = useState<boolean | null>(null);
  const [planIsValid, setPlanIsValid] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);

  useEffect(() => {
    if (item.is_schedule) {
      fetchParticipants();
    }
  }, [item]);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile();
        if (!profile) return;

        const plan = await getActivePlanByUserId(profile.id);
        setPlanIsValid(plan?.plan_id === 3);
      } catch (err) {
        console.error("Failed to fetch profile or AI status:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (item.is_schedule || aiAnswerText == null) {
      (async () => {
        const subtext = await getScheduleSubtext(item.id);
        if (subtext) setAiRecommendation(subtext);
      })();
    }
  }, [item.id]);

  useEffect(() => {
    if (!item.is_schedule) return;

    const channel = supabase
      .channel("public:message_schedule_participants")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_schedule_participants",
        },
        (payload) => {
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [item.id]);

  const fetchParticipants = async () => {
    setIsScheduleLoading(true);
    try {
      const data = await getScheduleParticipantsByMessageId(item.id);
      setParticipants(data);

      const userPart = data.find((p: any) => p.user_id === userId);
      const decision = userPart
        ? userPart.accept_status === true
          ? true
          : userPart.decide_at !== null && userPart.accept_status === false
            ? false
            : null
        : null;
      setUserDecision(decision);
    } catch (err) {
      console.error("Error fetching participants:", err);
    } finally {
      setIsScheduleLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      await participateInSchedule(item.id);
      setUserDecision(true);
      fetchParticipants();
    } catch (err) {
      console.error("Error accepting schedule:", err);
    }
  };

  const handleDecline = async () => {
    try {
      await declineSchedule(item.id);
      setUserDecision(false);
      fetchParticipants();
    } catch (err) {
      console.error("Error declining schedule:", err);
    }
  };

  const openModal = () => {
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
  };

  const renderAIRecommendationLink = () => {
    if (!planIsValid || userDecision !== true || !aiRecommendation) return null;

    return (
      <Pressable onPress={openModal} style={{ marginTop: 10 }}>
        <Text
          style={{
            color: theme.colors.primaryDark,
            textDecorationLine: "underline",
            fontFamily: "Poppins-SemiBold",
          }}
        >
          View AI Recommendation
        </Text>
      </Pressable>
    );
  };

  const renderModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView>
            <Text style={styles.modalTitle}>AI Recommendation</Text>
            <Text style={styles.modalText}>
              {aiAnswerText || aiRecommendation}
            </Text>
          </ScrollView>
          <Pressable onPress={closeModal} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  let bubbleStyle = item.reply_to
    ? styles.singleBubble
    : item.isFirstInGroup && item.isLastInGroup
      ? styles.singleBubble
      : item.isFirstInGroup
        ? isMine
          ? styles.firstBubbleMine
          : styles.firstBubble
        : item.isLastInGroup
          ? isMine
            ? styles.lastBubbleMine
            : styles.lastBubble
          : isMine
            ? styles.middleBubbleMine
            : styles.middleBubble;

  const isFirstOrSingle = !!item.reply_to || item.isFirstInGroup;

  const showTimestamp = showTime || isFirstOrSingle;

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();

    const isSameDay =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isSameDay) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const dayDiff = (now - date) / (1000 * 60 * 60 * 24);

    if (dayDiff < 7) {
      return `${date.toLocaleDateString("vi-VN", { weekday: "long" })} ${date.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      )}`;
    }

    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const allResponded = participants.every(
    (p) => p.accept_status === true || p.accept_status === false
  );
  const allAccepted = participants.every((p) => p.accept_status === true);

  if (item.is_schedule) {
    return (
      <View style={styles.scheduleContainer}>
        <View style={styles.scheduleBox}>
          <Text style={styles.scheduleTitle}>{item.body}</Text>

          {item.schedule_date && (
            <Text style={styles.scheduleDate}>
              {formatTimestamp(item.schedule_date)}
            </Text>
          )}
          {isScheduleLoading ? (
            <ActivityIndicator
              size="small"
              color={theme.colors.primaryDark}
              style={{ marginVertical: 20 }}
            />
          ) : (
            <>
              {participants.length > 0 && (
                <Text style={styles.scheduleParticipants}>
                  Participants:{" "}
                  {participants.map((p: any, i: number) => (
                    <Text key={p.user_id}>
                      {p.user_id === userId ? "You" : p.first_name} (
                      {p.accept_status === true
                        ? "Accepted"
                        : p.decide_at !== null && p.accept_status === false
                          ? "Declined"
                          : "Pending"}
                      ){i < participants.length - 1 ? ", " : ""}
                    </Text>
                  ))}
                </Text>
              )}

              {userDecision === null ? (
                <View style={styles.participateButtons}>
                  <Text> </Text>
                  <Pressable
                    style={[styles.btn, styles.btnYes]}
                    onPress={handleAccept}
                  >
                    <Text style={styles.btnText}>Accept</Text>
                  </Pressable>
                  <Text> </Text>
                  <Pressable
                    style={[styles.btn, styles.btnNo]}
                    onPress={handleDecline}
                  >
                    <Text style={styles.btnText}>Decline</Text>
                  </Pressable>
                  <Text> </Text>
                </View>
              ) : userDecision === true ? (
                allAccepted ? (
                  <Text
                    className="text-sm font-poppins-semibold"
                    style={{ marginTop: 10, color: theme.colors.primaryDark }}
                  >
                    All participants accepted!
                  </Text>
                ) : allResponded ? (
                  <Text
                    className="text-sm font-poppins-semibold"
                    style={{ marginTop: 10, color: theme.colors.textDarkGray }}
                  >
                    Other have declined this schedule
                  </Text>
                ) : (
                  <Text
                    className="text-sm font-poppins-semibold"
                    style={{ marginTop: 10, color: theme.colors.textDarkGray }}
                  >
                    Waiting for other to respond...
                  </Text>
                )
              ) : (
                <Text
                  className="text-sm font-poppins-semibold"
                  style={{ marginTop: 10, color: "#999" }}
                >
                  You declined this schedule
                </Text>
              )}
              {planIsValid && userDecision === true && allAccepted && (
                <View style={{ marginTop: 10 }}>
                  {aiLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.primaryDark}
                      style={{ marginVertical: 10 }}
                    />
                  ) : (
                    <>
                      <Pressable onPress={() => onAIRequest?.(item)}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            paddingHorizontal: 8,
                            paddingVertical: 6,
                            backgroundColor: "#f0f0f0",
                            borderRadius: theme.radius.lg,
                          }}
                        >
                          <View
                            style={{
                              position: "relative",
                              width: 28,
                              height: 28,
                              justifyContent: "center",
                              alignItems: "center",
                              marginRight: 8,
                            }}
                          >
                            <Ionicons
                              name="chatbubble-ellipses-outline"
                              size={28}
                              color={theme.colors.primaryDark}
                            />
                            <Text
                              style={{
                                position: "absolute",
                                top: -4,
                                right: -4,
                                fontSize: 8,
                                color: theme.colors.primaryDark,
                                fontWeight: "bold",
                              }}
                            >
                              AI
                            </Text>
                          </View>

                          <Text
                            style={{
                              fontFamily: "Poppins-Regular",
                              fontSize: 14,
                              color: theme.colors.textDark,
                              textDecorationLine: "underline",
                            }}
                          >
                            {!aiRecommendation
                              ? "Get AI recommendation on date places and ideas!"
                              : "Reuse?"}
                          </Text>
                        </View>
                      </Pressable>

                      {aiRecommendation && (
                        <View
                          style={{
                            marginTop: 10,
                            padding: 10,
                            backgroundColor: "#f0f0f0",
                            borderRadius: theme.radius.md,
                            textAlign: "center",
                          }}
                        >
                          {renderAIRecommendationLink()}
                          {renderModal()}
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View>
      {showTimestamp && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
        >
          <Text style={styles.timestamp}>
            {formatTimestamp(item.created_at)}
          </Text>
        </Animated.View>
      )}
      <SwipeableMessage onReply={() => onReply(item)} isMine={isMine}>
        <Pressable
          onPress={() => onToggleTime(item.id)}
          onLongPress={() => onLongPress(item)}
          delayLongPress={300}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: isMine ? "flex-end" : "flex-start",
            }}
          >
            {/* Left button if isMine */}
            {isMine && hovered && (
              <Pressable
                onPress={() => {
                  onLongPress(item);
                  setHovered(false);
                }}
                style={{ marginRight: 6, opacity: 0.7 }}
              >
                <Ionicons name="ellipsis-horizontal-circle-outline" size={20} />
              </Pressable>
            )}

            {/* Message bubble */}
            <View
              style={[
                styles.messageContainer,
                isMine ? styles.myMessage : styles.theirMessage,
                bubbleStyle,
              ]}
            >
              {!!item.body && (
                <Text
                  style={[
                    styles.messageText,
                    {
                      color: isMine
                        ? theme.colors.textLight
                        : theme.colors.textDarkGray,
                    },
                  ]}
                >
                  {item.body}
                </Text>
              )}
            </View>

            {!isMine && hovered && (
              <Pressable
                onPress={() => {
                  onLongPress(item);
                  setHovered(false);
                }}
                style={{ marginLeft: 6, opacity: 0.7 }}
              >
                <Ionicons name="ellipsis-horizontal-circle-outline" size={20} />
              </Pressable>
            )}
          </View>
        </Pressable>
      </SwipeableMessage>
      {/* Status Seen */}
      {index === 0 && statusText !== "" && (
        <View style={styles.statusSeen}>
          <Text style={styles.typingText}>{statusText}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  timestamp: {
    marginTop: 20,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
    fontSize: 12,
  },
  messageContainer: {
    marginVertical: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.xxl,
    maxWidth: "80%",
    flexShrink: 1,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.primaryDark,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.backgroundGray,
  },
  singleBubble: {
    borderRadius: theme.radius.xxl,
    marginVertical: 6,
  },
  firstBubble: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xxl,
    borderBottomLeftRadius: theme.radius.xxs,
    borderBottomRightRadius: theme.radius.xxl,
    marginTop: 6,
  },
  middleBubble: {
    borderTopLeftRadius: theme.radius.xxs,
    borderTopRightRadius: theme.radius.xxl,
    borderBottomLeftRadius: theme.radius.xxs,
    borderBottomRightRadius: theme.radius.xxl,
  },
  lastBubble: {
    borderTopLeftRadius: theme.radius.xxs,
    borderTopRightRadius: theme.radius.xxl,
    borderBottomLeftRadius: theme.radius.xl1,
    borderBottomRightRadius: theme.radius.xxl,
    marginBottom: 6,
  },
  firstBubbleMine: {
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xl1,
    borderBottomLeftRadius: theme.radius.xxl,
    borderBottomRightRadius: theme.radius.xxs,
    marginTop: 6,
  },
  middleBubbleMine: {
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxs,
    borderBottomLeftRadius: theme.radius.xxl,
    borderBottomRightRadius: theme.radius.xxs,
  },
  lastBubbleMine: {
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxs,
    borderBottomLeftRadius: theme.radius.xxl,
    borderBottomRightRadius: theme.radius.xl1,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    flexWrap: "wrap",
    fontFamily: "Poppins-Regular",
  },
  statusSeen: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  typingText: {
    fontSize: 13,
    color: theme.colors.textLighterGray,
    fontFamily: "Poppins-Regular",
  },
  replyBubble: {
    marginBottom: -20,
    paddingBottom: 18,
  },
  myMessageReply: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.backgroundGray,
    opacity: 0.5,
    borderBottomRightRadius: 0,
  },
  theirMessageReply: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.backgroundGray,
    opacity: 0.5,
    borderBottomLeftRadius: 0,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  scheduleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  scheduleBox: {
    width: "85%",
    backgroundColor: theme.colors.backgroundGray,
    borderRadius: theme.radius.xl,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.primaryDark,
  },
  scheduleTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: theme.colors.textDark,
    marginBottom: 6,
  },
  scheduleDate: {
    fontSize: 13,
    color: theme.colors.textLighterGray,
    fontFamily: "Poppins-Regular",
  },
  scheduleParticipants: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: theme.colors.textDarkGray,
    textAlign: "center",
  },
  participateButtons: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.lg,
    textAlign: "center",
  },
  btnYes: {
    backgroundColor: theme.colors.primaryDark,
  },
  btnNo: {
    backgroundColor: "#999",
  },
  btnText: {
    color: "white",
    fontFamily: "Poppins-Medium",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Medium",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#333",
  },
  modalCloseBtn: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryDark,
    alignItems: "center",
  },
  modalCloseText: {
    color: "#fff",
    fontFamily: "Poppins-Medium",
  },
});
