import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDeviceContext } from "./context/DeviceContext";

const STORAGE_KEY = "@user_notifications";

export const triggerDeviceNotification = async (
  deviceName: string,
  isOn: boolean,
) => {
  try {
    const storedNotifs = await AsyncStorage.getItem(STORAGE_KEY);
    let currentNotifs = storedNotifs ? JSON.parse(storedNotifs) : [];

    const timeString = new Date().toLocaleTimeString("el-GR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const isSchedule = deviceName.includes("ρυθμίστηκε");

    const newNotif = {
      id: `device_action_${Date.now()}`,
      title: isSchedule ? "Προγραμματισμός Συσκευής" : "Ενημέρωση Συσκευής",
      message: isSchedule
        ? deviceName
        : `Ο ${deviceName} ${isOn ? "ενεργοποιήθηκε" : "απενεργοποιήθηκε"}.`,
      time: timeString,
      icon: isSchedule ? "time-outline" : isOn ? "power" : "power-outline",
      color: isSchedule ? "#2ecc71" : isOn ? "#e74c3c" : "#7f8c8d",
    };

    currentNotifs = [newNotif, ...currentNotifs];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentNotifs));
  } catch (error) {
    console.log("Σφάλμα αποθήκευσης ειδοποίησης συσκευής:", error);
  }
};

export default function NotificationsScreen() {
  const { darkMode, authToken } = useDeviceContext();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadAndCheckNotifications = async () => {
        try {
          setLoading(true);

          const storedNotifs = await AsyncStorage.getItem(STORAGE_KEY);
          let currentNotifs = storedNotifs ? JSON.parse(storedNotifs) : [];

          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yStr = yesterday.toISOString().split("T")[0];

          const expectedNotifId = `energy_summary_${yStr}`;

          const alreadyHasNotif = currentNotifs.some(
            (n: any) => n.id === expectedNotifId,
          );

          if (!alreadyHasNotif && authToken) {
            const response = await fetch(
              "http://10.64.44.134:8000/rest/v1/api_house_energy_day?select=*&order=bucket.desc&limit=2",
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  apikey:
                    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4MTU0MjE3LCJleHAiOjIwMzA2NzAwMDB9.1u7FC7aK_c3E6VQUsCoTCY006_KrsCUcdPo2JUScU0U",
                  Authorization: `Bearer ${authToken}`,
                },
              },
            );

            const data = await response.json();

            if (response.ok && data && data.length > 0) {
              const yEntry = data.find((d: any) => d.bucket.startsWith(yStr));

              if (yEntry) {
                const energyKWh = (yEntry.energy_wh / 1000).toFixed(2);
                const cost = (Number(energyKWh) * 0.15).toFixed(2);

                const newNotif = {
                  id: expectedNotifId,
                  title: "Απολογισμός Ενέργειας",
                  message: `Χθες καταναλώσατε ${energyKWh} kWh με κόστος ~${cost} €.`,
                  time: "Σήμερα",
                  icon: "flash",
                  color: "#2ecc71",
                };

                currentNotifs = [newNotif, ...currentNotifs];

                await AsyncStorage.setItem(
                  STORAGE_KEY,
                  JSON.stringify(currentNotifs),
                );
              }
            }
          }

          setNotifications(currentNotifs);
        } catch (error) {
          console.log("Σφάλμα στη φόρτωση ειδοποιήσεων:", error);
        } finally {
          setLoading(false);
        }
      };

      loadAndCheckNotifications();
    }, [authToken]),
  );

  const handleDeleteNotification = (id: string) => {
    Alert.alert(
      "Διαγραφή",
      "Είστε σίγουρος ότι θέλετε να διαγράψετε αυτή την ειδοποίηση;",
      [
        { text: "Ακυρωση", style: "cancel" },
        {
          text: "Διαγραφη",
          style: "destructive",
          onPress: async () => {
            const updatedNotifs = notifications.filter((n) => n.id !== id);
            setNotifications(updatedNotifs);
            await AsyncStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(updatedNotifs),
            );
          },
        },
      ],
    );
  };

  const theme = {
    background: darkMode ? "#121212" : "#f4f6f8",
    card: darkMode ? "#1e1e1e" : "#ffffff",
    text: darkMode ? "#ffffff" : "#2c3e50",
    subText: darkMode ? "#aaaaaa" : "#7f8c8d",
    border: darkMode ? "#333333" : "#f1f2f6",
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.text} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.subText }]}>
              Δεν υπάρχουν ειδοποιήσεις.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onLongPress={() => handleDeleteNotification(item.id)}
              delayLongPress={400}
              style={[
                styles.notificationCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: item.color + "20" },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={item.color}
                />
              </View>
              <View style={styles.textContainer}>
                <View style={styles.row}>
                  <Text
                    style={[styles.notifTitle, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={[styles.notifTime, { color: theme.subText }]}>
                    {item.time}
                  </Text>
                </View>
                <Text style={[styles.notifMessage, { color: theme.subText }]}>
                  {item.message}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { textAlign: "center", marginTop: 50, fontSize: 16 },
  notificationCard: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textContainer: { flex: 1 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "bold",
    flexShrink: 1,
    marginRight: 8,
  },
  notifTime: {
    fontSize: 12,
    flexShrink: 0,
  },
  notifMessage: { fontSize: 14, lineHeight: 20 },
});
