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

type InputAlertModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  okText?: string;
  cancelText?: string;
  onOk: (value: string) => void;
  onCancel: () => void;
  defaultValue?: string;
};

export const InputAlertModal = ({
  visible,
  title,
  message,
  placeholder,
  okText = "OK",
  cancelText = "Cancel",
  onOk,
  onCancel,
  defaultValue = "",
}: InputAlertModalProps) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  const handleOk = () => {
    onOk(inputValue);
    setInputValue("");
  };

  const handleCancel = () => {
    onCancel();
    setInputValue("");
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
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <TextInput
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textLightGray}
              value={inputValue}
              onChangeText={setInputValue}
              multiline
            />
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
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    fontFamily: "Poppins-SemiBold",
  },
  message: {
    fontSize: 16,
    marginBottom: 10,
    fontFamily: "Poppins-Regular",
  },
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    marginLeft: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
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
