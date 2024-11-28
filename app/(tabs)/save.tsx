import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Linking,
  ToastAndroid,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { IData } from ".";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize";
import FontAwesome from "react-native-vector-icons/FontAwesome";

const getAllKeys = async (): Promise<readonly string[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys;
  } catch (e) {
    return [];
  }
};

const getData = async (key: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(`${key}`);
    return jsonValue ? JSON.parse(jsonValue) : null;
  } catch (e) {
    return null;
  }
};

export default function SaveScreen() {
  const [saves, setSaves] = useState<IData[]>([]);
  const [notiSaved, setNotiSaved] = useState<IData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const modalizeRef = useRef<Modalize>(null);

  const openLink = (link: string) => {
    Linking.openURL(link).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

  const openGithub = () => {
    Linking.openURL("https://github.com/yoosunu?tab=repositories").catch(
      (err) => console.error("Failed to open URL:", err)
    );
  };

  const showToast = (code: number) => {
    ToastAndroid.show(`${code} was deleted`, ToastAndroid.LONG);
  };

  const showToastClear = () => {
    ToastAndroid.show(`Deleted All`, ToastAndroid.LONG);
  };

  const loadAllData = async () => {
    try {
      const keys = await getAllKeys();
      const dataPromises = keys.map((key) => getData(key));
      const results = await Promise.all(dataPromises);
      setSaves(results.filter((item) => item !== null) as IData[]);
    } catch (e) {
      console.log(e);
    }
  };

  const removeValue = async (key: string) => {
    try {
      await AsyncStorage.removeItem(`${key}`);
      setSaves(saves.filter((save) => save.code !== parseInt(key)));
    } catch (e) {
      console.log(e);
    }
    console.log("Done.");
  };

  const clearAll = async () => {
    try {
      await AsyncStorage.clear();
      setSaves([]);
    } catch (e) {
      console.log(e);
    }
    console.log("Done.");
  };

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  return (
    <GestureHandlerRootView>
      <View style={styles.header}>
        <Text style={styles.apot}>Apot</Text>
        <Text style={styles.subHeaderText}>Saved notifications</Text>
        <Pressable onPress={() => setModalVisible(!modalVisible)}>
          <FontAwesome
            name="trash"
            size={30}
            color="black"
            style={{ paddingVertical: 20, paddingHorizontal: 135 }}
          />
        </Pressable>
      </View>
      <View style={styles.middle}>
        <ScrollView>
          {saves?.map((save) => (
            <ScrollView
              key={save.code}
              horizontal
              style={styles.notice}
              contentContainerStyle={styles.noticeContainer}
            >
              <Pressable
                style={styles.pressable}
                onPress={() => {
                  modalizeRef.current?.open();
                  setNotiSaved(save);
                }}
              >
                <View style={styles.sizedBox}>
                  <Text style={styles.code}>{save.code}</Text>
                </View>
                <View>
                  <Text style={styles.title}>{save.title}</Text>
                </View>
              </Pressable>
            </ScrollView>
          ))}
        </ScrollView>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.githubBox} onPress={openGithub}>
          <FontAwesome
            name="github"
            size={30}
            color="lightgray"
            style={{ paddingVertical: 10, paddingHorizontal: 20 }}
          />
          <View>
            <Text style={styles.githubText}>Wanna Detail?</Text>
          </View>
        </Pressable>
        <View style={{ paddingVertical: 14, paddingHorizontal: 25 }}>
          <Text style={styles.githubText}>© Copyright 2024 Apot</Text>
          <Text style={styles.githubText}>Programmed by Jasper</Text>
        </View>
      </View>
      <Modalize
        ref={modalizeRef}
        scrollViewProps={{ showsVerticalScrollIndicator: false }}
        modalHeight={330}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {/* Title Section */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalNoti}>Notification</Text>
              <FontAwesome
                name="close"
                size={24}
                color="#B39DDB"
                onPress={() => modalizeRef.current?.close()}
              />
            </View>

            {/* Content Section */}
            <View style={styles.modalBody}>
              <Text style={styles.modalTitle}>{notiSaved?.title}</Text>
              <View style={styles.modalBodyDetail}>
                <View>
                  <Text style={styles.modalCode}>{notiSaved?.code}</Text>
                  <Text style={styles.modalEtc}>{notiSaved?.etc}</Text>
                </View>
                <View>
                  <Pressable
                    style={styles.modalButtonSave}
                    onPress={() => {
                      removeValue(`${notiSaved!.code}`);
                      modalizeRef.current?.close();
                      showToast(notiSaved!.code);
                    }}
                  >
                    <Text style={styles.modalButtonSaveText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
            {/* Footer Section */}
            <Pressable
              style={styles.modalButton}
              onPress={() => openLink(notiSaved!.link)}
            >
              <Text style={styles.modalButtonText}>Check Now</Text>
            </Pressable>
          </View>
        </View>
      </Modalize>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Are you sure deleting?</Text>
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => {
                clearAll();
                setModalVisible(!modalVisible);
                showToastClear();
              }}
            >
              <Text style={styles.textStyle}>CLEAR</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  entireView: {
    flex: 1,
  },
  header: {
    backgroundColor: "#B39EE0",
    paddingTop: 40,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#AEB8C3",
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    width: "101%",
    justifyContent: "flex-start",
  },
  subHeaderText: {
    fontSize: 15,
    paddingLeft: 10,
    fontStyle: "italic",
    color: "491e64",
    marginTop: 16,
    fontWeight: "500",
  },
  middle: {
    backgroundColor: "#EDE7F6",
    paddingLeft: 30,
    paddingRight: 30,
    paddingBottom: 25,
    flex: 9,
  },
  footer: {
    backgroundColor: "#242326",
    flexDirection: "row",
    width: "100%",
    flex: 1,
  },
  apot: {
    color: "black",
    fontSize: 30,
    fontStyle: "italic",
    fontWeight: "500",
    marginTop: 2,
  },
  notice: {
    flexDirection: "row",
    width: "100%",
    borderBottomWidth: 1,
    borderColor: "#AEB8C3",
    paddingTop: 20,
    paddingBottom: 20,
  },
  noticeContainer: {
    alignItems: "center",
  },
  pressable: {
    flexDirection: "row",
    alignItems: "center",
  },
  sizedBox: {
    paddingRight: 17,
  },
  code: {
    fontSize: 17,
    color: "#491e64",
    fontWeight: "600",
    fontStyle: "italic",
  },
  title: {
    fontSize: 15,
    color: "#491e64",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "82%",
    backgroundColor: "#B39DDB",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  modalNoti: {
    fontSize: 20,
    color: "black",
    fontWeight: "bold",
    fontStyle: "italic",
  },
  modalBody: {
    marginBottom: 44,
  },
  modalBodyDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCode: {
    fontSize: 16,
    color: "black",
    marginBottom: 5,
    fontWeight: "600",
    fontStyle: "italic",
  },
  modalTitle: {
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 30,
  },
  modalEtc: {
    fontSize: 14,
    color: "black",
  },
  modalButton: {
    backgroundColor: "#D1C4E9",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
    marginBottom: 100,
  },
  modalButtonSave: {
    backgroundColor: "#D1C4E9",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  modalButtonSaveText: {
    fontWeight: "500",
  },
  modalButtonText: {
    color: "#2F2F2F",
    fontWeight: "bold",
    fontSize: 16,
  },
  githubText: {
    color: "lightgray",
    paddingRight: 30,
  },
  githubBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "lightgray",
    borderRadius: 10,
    margin: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: 20,
    backgroundColor: "#E3DDF3",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 10,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#7E57C2",
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    color: "#311B92",
    fontSize: 20,
    marginBottom: 40,
    textAlign: "center",
    fontWeight: "600",
    fontStyle: "italic",
  },
});
