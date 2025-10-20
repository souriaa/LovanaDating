import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "~/constants/theme";

type InputDateAlertModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  okText?: string;
  cancelText?: string;
  onOk: (value: { text: string; date: Date }) => void;
  onCancel: () => void;
  defaultValue?: string;
  defaultDate?: Date;
};

export const InputDateAlertModal = ({
  visible,
  title,
  message,
  placeholder,
  okText = "OK",
  cancelText = "Cancel",
  onOk,
  onCancel,
  defaultValue = "",
  defaultDate = new Date(),
}: InputDateAlertModalProps) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [date, setDate] = useState(defaultDate);
  const [showPicker, setShowPicker] = useState<"date" | "time" | null>(null);

  const handleOk = () => {
    onOk({ text: inputValue, date });
    setInputValue("");
  };

  const handleCancel = () => {
    onCancel();
    setInputValue("");
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(null);
    if (selectedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      setDate(newDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowPicker(null);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modal}>
            <Text style={styles.title}>{title}</Text>
            {message && <Text style={styles.message}>{message}</Text>}

            <TextInput
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textLightGray}
              value={inputValue}
              onChangeText={setInputValue}
              multiline
            />

            {/* Date Picker */}
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowPicker("date")}
            >
              <Text style={styles.dateText}>
                📅 {date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {/* Time Picker */}
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowPicker("time")}
            >
              <Text style={styles.dateText}>
                ⏰{" "}
                {date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>

            {/* Show picker */}
            {showPicker === "date" && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handleDateChange}
              />
            )}
            {showPicker === "time" && (
              <DateTimePicker
                value={date}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleTimeChange}
              />
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handleCancel}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleOk}>
                <Text style={styles.okText}>{okText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 20,
    elevation: 10,
    width: "100%",
  },
  title: { fontSize: 18, marginBottom: 10, fontFamily: "Poppins-SemiBold" },
  message: { fontSize: 16, marginBottom: 10, fontFamily: "Poppins-Regular" },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 6,
    minHeight: 80,
    padding: 10,
    marginBottom: 20,
    fontFamily: "Poppins-Regular",
    textAlignVertical: "top",
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    justifyContent: "center",
  },
  dateText: { fontFamily: "Poppins-Regular", color: theme.colors.textDarkGray },
  buttonContainer: { flexDirection: "row", justifyContent: "flex-end" },
  button: { marginLeft: 10, paddingVertical: 6, paddingHorizontal: 12 },
  cancelText: {
    fontSize: 16,
    color: theme.colors.textLightGray,
    fontFamily: "Poppins-Regular",
  },
  okText: {
    fontSize: 16,
    color: theme.colors.primaryDark,
    fontFamily: "Poppins-Regular",
  },
});
