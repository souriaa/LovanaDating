import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { FC, useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { Photo } from "../types/profile";

interface Props {
  photo: Photo;
}

export const ProfilePhoto: FC<Props> = ({ photo }) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  return (
    <>
      <TouchableOpacity
        className="w-full aspect-square"
        onPress={() => setShowPreviewModal(true)}
      >
        <View className="w-full aspect-square rounded-md overflow-hidden ">
          <Image
            source={photo.photo_url}
            className="flex-1 w-full bg-neutral-200"
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={showPreviewModal}
        transparent={true}
        onRequestClose={() => setShowPreviewModal(false)}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Image
              source={photo.photo_url}
              style={styles.fullScreenImage}
              contentFit="contain"
            />
            <TouchableOpacity
              onPress={() => setShowPreviewModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close-circle" size={40} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "90%",
    height: "90%",
    borderRadius: 12,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
  },
});
