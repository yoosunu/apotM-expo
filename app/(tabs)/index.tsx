import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Linking,
  ToastAndroid,
} from "react-native";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize";
import FontAwesome from "react-native-vector-icons/FontAwesome";
// @ts-ignore
import { DOMParser } from "react-native-html-parser";
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";

export interface IData {
  code: number;
  tag: string;
  title: string;
  link: string;
  writer: string;
  etc: string;
}

// background section

async function postDataBG() {
  let scrappedDataBG: IData[] = [];

  const url =
    "https://www.jbnu.ac.kr/web/news/notice/sub01.do?pageIndex=1&menu=2377";
  const url2 =
    "https://www.jbnu.ac.kr/web/news/notice/sub01.do?pageIndex=2&menu=2377";
  const url3 =
    "https://www.jbnu.ac.kr/web/news/notice/sub01.do?pageIndex=3&menu=2377";

  const fetchInfosBG = async (url: string) => {
    const fetchedData: IData[] = [];

    try {
      // Fetch HTML content
      const response = await fetch(url);
      const html = await response.text();

      // Parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Find rows with class "tr-normal"
      const trs = doc.getElementsByClassName("tr-normal");
      for (let i = 0; i < trs.length; i++) {
        const tr = trs[i];

        // code
        const brdNum = tr.getElementsByClassName("brd-num")[0];
        const codeGet = brdNum ? brdNum.textContent.trim() : "";
        const code = parseInt(codeGet);

        // tag
        const tagType = tr.getElementsByClassName("tag-type-01")[0];
        const tag = tagType ? tagType.textContent.trim() : "";

        // title
        const titleHtml = tr.getElementsByClassName("title")[0];
        const title = titleHtml ? titleHtml.textContent.trim() : "";

        // link
        const onclickValue = titleHtml?.getAttribute("onclick");
        let link = "";
        if (onclickValue) {
          const startIndex = onclickValue.indexOf("'") + 1;
          const endIndex = onclickValue.indexOf("'", startIndex);
          const extractedValue = onclickValue.substring(startIndex, endIndex);
          link = `https://www.jbnu.ac.kr/web/Board/${extractedValue}/detailView.do?pageIndex=1&menu=2377`;
        }

        // source (writer)
        const brdWriter = tr.getElementsByClassName("brd-writer")[0];
        const writer = brdWriter ? brdWriter.textContent.trim() : "";

        // etc
        const etcList = tr.getElementsByClassName("etc-list")[0];
        const etc =
          etcList?.getElementsByTagName("li")[0]?.textContent.trim() || "";

        fetchedData.push({ code, tag, title, link, writer, etc });
      }
      scrappedDataBG = fetchedData;
      return scrappedDataBG;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  fetchInfosBG(url);
  fetchInfosBG(url2);
  fetchInfosBG(url3);

  console.log("background~~");
  console.log(scrappedDataBG);

  // const saveTesting = async () => {
  //   try {
  //     const keys = await fetchInfosBG(url);
  //     if (keys) {
  //       // 각 데이터 저장 로직을 Promise.all로 처리
  //       await Promise.all(keys.map((key) => saveData(key)));
  //       console.log("All data saved successfully.");
  //     } else {
  //       console.error("No data fetched.");
  //     }
  //   } catch (e) {
  //     console.error("Error in saveTesting:", e);
  //   }
  // };

  for (const d of scrappedDataBG) {
    try {
      const response = await fetch(
        "https://backend.apot.pro/api/v1/notifications/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(d),
        }
      );
      console.log("data posted.");
      console.log(`length of data: ${scrappedDataBG.length}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const result = await response.json();
      console.log(result);
    } catch (error) {
      return error;
    }
  }
}

const BACKGROUND_FETCH_TASK = "background-fetch";

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log("[BackgroundFetch] Task executed");
    await postDataBG();
    return "NewData";
  } catch (error) {
    console.error("[BackgroundFetch] Error in background task:", error);
    return "Failed";
  }
});

// 백그라운드 작업 시작
const setupBackgroundFetch = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log("[BackgroundFetch] Task registered successfully");
  } catch (error) {
    console.error("[BackgroundFetch] Error registering task:", error);
  }
};

setupBackgroundFetch();

export default function HomeScreen() {
  const [backendData, setBackendData] = useState<IData[]>([]);
  const [noti, setNoti] = useState<IData | null>(null);
  const sortedData = backendData.sort((a, b) => b.code - a.code);

  const modalizeRef = useRef<Modalize>(null);

  const getData = async () => {
    try {
      const response = await fetch(
        "https://backend.apot.pro/api/v1/notifications/",
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const dataGet = await response.json();
      setBackendData(dataGet);
    } catch (error) {
      return error;
    }
  };

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

  // saving section
  // const saveData = async (value: IData) => {
  //   try {
  //     const jsonValue = JSON.stringify(value);
  //     await AsyncStorage.setItem(`${value.code}`, jsonValue);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // };

  const showToast = (code: number) => {
    ToastAndroid.show(`${code} was saved`, ToastAndroid.LONG);
  };

  //notification section

  useEffect(() => {
    getData();
  }, []);

  return (
    <GestureHandlerRootView style={styles.entireView}>
      <View style={styles.header}>
        <Text style={styles.apot}>Apot</Text>
        <Text style={styles.subHeaderText}>Push alarmer</Text>
        <Pressable>
          <FontAwesome
            name="bell"
            size={30}
            color="lightgray"
            style={{ paddingVertical: 10, paddingHorizontal: 20 }}
          />
        </Pressable>
      </View>
      <View style={styles.middle}>
        <ScrollView>
          {sortedData?.map((d) => (
            <ScrollView
              key={d.code}
              horizontal
              style={styles.notice}
              contentContainerStyle={styles.noticeContainer}
            >
              <Pressable
                style={styles.pressable}
                onPress={() => {
                  modalizeRef.current?.open();
                  setNoti(d);
                }}
              >
                <View style={styles.sizedBox}>
                  <Text style={styles.code}>{d.code}</Text>
                </View>
                <View>
                  <Text style={styles.title}>{d.title}</Text>
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
              <Text style={styles.modalTitle}>{noti?.title}</Text>
              <View style={styles.modalBodyDetail}>
                <View>
                  <Text style={styles.modalCode}>{noti?.code}</Text>
                  <Text style={styles.modalEtc}>{noti?.etc}</Text>
                </View>
                <View>
                  <Pressable
                    style={styles.modalButtonSave}
                    onPress={() => {
                      // saveData(noti!);
                      modalizeRef.current?.close();
                      showToast(noti!.code);
                    }}
                  >
                    <Text style={styles.modalButtonSaveText}>Save</Text>
                  </Pressable>
                </View>
              </View>
            </View>
            {/* Footer Section */}
            <Pressable
              style={styles.modalButton}
              onPress={() => openLink(noti!.link)}
            >
              <Text style={styles.modalButtonText}>Check Now</Text>
            </Pressable>
          </View>
        </View>
      </Modalize>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  entireView: {
    flex: 1,
  },
  header: {
    backgroundColor: "#3A3A3A",
    paddingTop: 40,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#B39DDB",
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    width: "101%",
    justifyContent: "flex-start",
  },
  subHeaderText: {
    fontSize: 15,
    paddingLeft: 10,
    paddingRight: 140,
    fontStyle: "italic",
    color: "#B39DDB",
    marginTop: 16,
    fontWeight: "500",
  },
  middle: {
    backgroundColor: "#2F2F2F",
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
    color: "#B39DDB",
    fontSize: 30,
    fontStyle: "italic",
    fontWeight: "500",
    marginTop: 2,
  },
  notice: {
    flexDirection: "row",
    width: "100%",
    borderBottomWidth: 1,
    borderColor: "#B39DDB",
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
    color: "#B39DDB",
    fontWeight: "600",
    fontStyle: "italic",
  },
  title: {
    fontSize: 15,
    color: "#B39DDB",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)", // 어두운 투명 배경
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "82%",
    backgroundColor: "#424242", // 모달 배경
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
    color: "#B39DDB",
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
    color: "#B39DDB",
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
    color: "#9E9E9E",
  },
  modalButton: {
    backgroundColor: "#B39DDB",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
    marginBottom: 100,
  },
  modalButtonSave: {
    backgroundColor: "#B39DDB",
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
});
