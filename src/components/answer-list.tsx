import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { FC, useEffect, useState } from "react";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import { DraggableGrid } from "react-native-draggable-grid";
import { theme } from "~/constants/theme";
import { deleteProfileAnswer } from "../../service/profileAnswerService";
import { Answer, PrivateProfile } from "../api/my-profile/types";
import { useEdit } from "../store/edit";

type Item = {
  key: string;
  answer: Answer;
  disabledDrag?: boolean;
  disabledReSorted?: boolean;
};

interface Props {
  profile: PrivateProfile;
  columns?: number;
  spacing?: number;
  margin?: number;
  height?: number;
  slots?: number;
}

export const AnswerList: FC<Props> = ({
  profile,
  columns = 1,
  spacing = 10,
  margin = 10,
  height = 120,
  slots = 3,
}) => {
  const width = Dimensions.get("window").width - margin * 2;
  const size = width / columns - spacing;

  const [data, setData] = useState<Item[]>([]);
  const { setEdits: setMyProfileChanges, setGridActive } = useEdit();

  useEffect(() => {
    if (!data.length) {
      const initialData: Item[] = Array(slots)
        .fill(null)
        .map((_, index) => {
          const answer = profile?.answers[index] || null;
          return {
            key: index.toString(),
            answer: answer,
            disabledDrag: answer === null,
            disabledReSorted: answer === null,
          };
        });
      setData(initialData);
    } else {
      const newData = data.map((item, index) => {
        const answer = profile?.answers[index] || null;
        return {
          ...item,
          answer: answer,
          disabledDrag: answer === null,
          disabledReSorted: answer === null,
        };
      });
      setData(newData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const renderItem = (item: Item) => {
    return (
      <View
        style={{
          width: size,
          height: height,
          paddingVertical: spacing / 2,
        }}
        key={item.key}
      >
        {item.answer ? (
          <View className="flex-1 rounded-md overflow-hidden border border-neutral-200 p-5 flex-row items-center justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-base font-poppins-regular">
                {item.answer.question}
              </Text>
              <Text
                className="text-base font-poppins-regular text-neutral-400"
                numberOfLines={3}
              >
                {item.answer.answer_text}
              </Text>
            </View>

            {item.answer && !item.answer.id.startsWith("temp_") && (
              <TouchableOpacity onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={20} color="grey" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            onPress={onItemPress}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: theme.colors.primaryDark,
              borderStyle: "dashed",
              borderRadius: 8,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="add" size={32} color={theme.colors.primaryDark} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const onDragRelease = (data: Item[]) => {
    const answers = data
      .map((item, index) => {
        return {
          ...item.answer,
          answer_order: index,
        };
      })
      .filter((item) => item.answer_text != null);

    setMyProfileChanges({
      ...profile,
      answers,
    });
    setData(data);
    setGridActive(false);
  };

  const onDragItemActive = () => {
    setGridActive(true);
  };

  const onItemPress = (item: Item) => {
    if (item.answer) {
      router.push({
        pathname: "/(app)/write-answer",
        params: {
          itemId: item.answer.id,
          promptId: item.answer.prompt_id,
        },
      });
    } else {
      router.push("/(app)/prompts");
    }
    return;
  };

  const handleDelete = async (item: Item) => {
    if (!item.answer) return;

    const answerId = item.answer.id;

    const newData = data.filter((d) => d.key !== item.key);
    setData(newData);

    const updatedAnswers = newData
      .filter((i) => i.answer && !i.answer.id.startsWith("temp_"))
      .map((i, index) => ({ ...i.answer, answer_order: index }));

    setMyProfileChanges({ ...profile, answers: updatedAnswers });

    if (!answerId.startsWith("temp_")) {
      try {
        await deleteProfileAnswer(answerId);
      } catch (err) {
        console.error("deleteProfileAnswer error:", err);
      }
    }
  };

  return (
    <View>
      <View
        style={{
          width: width,
          alignSelf: "center",
        }}
      >
        <DraggableGrid
          numColumns={1}
          renderItem={renderItem}
          data={data}
          onDragRelease={onDragRelease}
          onDragItemActive={onDragItemActive}
          onItemPress={onItemPress}
          itemHeight={120}
        />
      </View>
    </View>
  );
};
