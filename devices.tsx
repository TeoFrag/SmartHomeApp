import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from "react-native";
import { triggerDeviceNotification } from "./notifications";

import { useDeviceContext } from "./context/DeviceContext";

export default function DynamicDevicesScreen() {
  const router = useRouter();
  const {
    authToken,
    darkMode,
    isHeaterOn,
    setIsHeaterOn,
    isWashingMachineOn,
    setIsWashingMachineOn,
  } = useDeviceContext();

  const [devices, setDevices] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const theme = {
    background: darkMode ? "#121212" : "#f4f6f8",
    cardBg: darkMode ? "#1e1e1e" : "#ffffff",
    textMain: darkMode ? "#ffffff" : "#2c3e50",
    textSub: darkMode ? "#aaaaaa" : "#7f8c8d",
    borderColor: darkMode ? "#333333" : "#e0e6ed",
  };

  const fetchData = async (isRefresh = false) => {
    if (!authToken) return;

    try {
      if (!isRefresh) setLoading(true);

      const roomsResponse = await fetch(
        "http://10.64.44.134:8000/rest/v1/rooms?select=*",
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
      const roomsData = await roomsResponse.json();
      if (roomsResponse.ok && Array.isArray(roomsData)) {
        setRooms(roomsData);
      }

      const devicesResponse = await fetch(
        "http://10.64.44.134:8000/rest/v1/devices?select=*",
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
      const devicesData = await devicesResponse.json();

      if (devicesResponse.ok && Array.isArray(devicesData)) {
        const updatedDevices = devicesData.map((d) => {
          if (d.serial_number === "C8F09E88E68C") {
            return { ...d, meta: { ...(d.meta || {}), is_on: isHeaterOn } };
          }
          return d;
        });

        const virtualWashingMachine = {
          device_id: "virtual_washing_machine",
          serial_number: "VIRTUAL_WM_001",
          kind: "sub_meter",
          meta: { is_on: isWashingMachineOn },
          room_id: "bathroom_force",
        };

        setDevices([...updatedDevices, virtualWashingMachine]);
      }
    } catch (error) {
      console.log("Σφάλμα:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      if (isActive) fetchData();
      return () => {
        isActive = false;
      };
    }, [authToken, isHeaterOn, isWashingMachineOn]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const toggleDeviceStatus = async (
    deviceId: string,
    currentState: boolean,
  ) => {
    const newState = !currentState;
    const targetDevice = devices.find((d) => d.device_id === deviceId);

    if (deviceId === "virtual_washing_machine") {
      setIsWashingMachineOn(newState);
      setDevices((prevDevices) =>
        prevDevices.map((device) =>
          device.device_id === deviceId
            ? { ...device, meta: { ...device.meta, is_on: newState } }
            : device,
        ),
      );
      await triggerDeviceNotification("Πλυντήριο Ρούχων", newState);
      return;
    }

    if (targetDevice?.serial_number === "C8F09E88E68C") {
      setIsHeaterOn(newState);
      setDevices((prevDevices) =>
        prevDevices.map((device) =>
          device.device_id === deviceId
            ? { ...device, meta: { ...device.meta, is_on: newState } }
            : device,
        ),
      );
      await triggerDeviceNotification("Θερμοσίφωνας", newState);

      try {
        await fetch(
          `http://10.64.44.134:8000/rest/v1/devices?device_id=eq.${deviceId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              apikey:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4MTU0MjE3LCJleHAiOjIwMzA2NzAwMDB9.1u7FC7aK_c3E6VQUsCoTCY006_KrsCUcdPo2JUScU0U",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              meta: { ...(targetDevice?.meta || {}), is_on: newState },
            }),
          },
        );
      } catch (error) {
        console.log("Σφάλμα server:", error);
      }
      return;
    }

    setDevices((prevDevices) =>
      prevDevices.map((device) =>
        device.device_id === deviceId
          ? { ...device, meta: { ...device.meta, is_on: newState } }
          : device,
      ),
    );

    if (targetDevice?.serial_number === "C8F09E879348") {
      await triggerDeviceNotification("Γενική Κατανάλωση", newState);
    }

    try {
      await fetch(
        `http://10.64.44.134:8000/rest/v1/devices?device_id=eq.${deviceId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4MTU0MjE3LCJleHAiOjIwMzA2NzAwMDB9.1u7FC7aK_c3E6VQUsCoTCY006_KrsCUcdPo2JUScU0U",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            meta: { ...(targetDevice?.meta || {}), is_on: newState },
          }),
        },
      );
    } catch (error) {
      console.log("Σφάλμα server:", error);
    }
  };

  const getRoomName = (roomId: string) => {
    if (roomId === "main_panel_force") return "Κεντρικός Πίνακας";
    if (roomId === "bathroom_force") return "Μπάνιο";

    const room = rooms.find((r) => r.room_id === roomId);
    if (!room) return "Άγνωστο Δωμάτιο";

    const translations: any = {
      "Living Room": "Σαλόνι",
      Kitchen: "Κουζίνα",
      Bathroom: "Μπάνιο",
      Office: "Γραφείο",
      "Outdoor / Balcony": "Μπαλκόνι",
      "Main Electrical Panel": "Κεντρικός Πίνακας",
    };
    return translations[room.name] || room.name;
  };

  const controllableDevices = devices.filter((d) => d.kind === "sub_meter");

  const groupedDevices = controllableDevices.reduce((groups: any, device) => {
    let roomId = device.room_id || "unassigned";

    if (
      device.serial_number === "C8F09E88E68C" ||
      device.serial_number === "C8F09E879348"
    ) {
      const panel = rooms.find((r) => r.name === "Main Electrical Panel");
      roomId = panel ? panel.room_id : "main_panel_force";
    }

    if (!groups[roomId]) {
      groups[roomId] = [];
    }
    groups[roomId].push(device);
    return groups;
  }, {});

  if (loading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color="#4facfe" />
        <Text style={[styles.loadingText, { color: theme.textSub }]}>
          Συγχρονισμός Συσκευών...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4facfe"
          />
        }
      >
        <Text style={[styles.header, { color: theme.textMain }]}>
          Διαχείριση Συσκευών
        </Text>

        {controllableDevices.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: theme.cardBg, borderColor: theme.borderColor },
            ]}
          >
            <Ionicons
              name="hardware-chip-outline"
              size={60}
              color={theme.textSub}
            />
            <Text style={[styles.emptyStateTitle, { color: theme.textMain }]}>
              Καμία Συσκευή
            </Text>
            <Text style={[styles.emptyStateText, { color: theme.textSub }]}>
              Δεν βρέθηκαν ελεγχόμενες συσκευές στη βάση δεδομένων.
            </Text>
          </View>
        ) : (
          Object.keys(groupedDevices).map((roomId) => (
            <View key={roomId} style={styles.roomSection}>
              <Text style={[styles.roomTitle, { color: theme.textMain }]}>
                {getRoomName(roomId)}
              </Text>

              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: theme.borderColor,
                  },
                ]}
              >
                {groupedDevices[roomId].map((device: any, index: number) => {
                  const isDeviceOn = device.meta?.is_on || false;

                  let displayName = "Άγνωστη Συσκευή";
                  let iconName = "power-outline";
                  let iconColor = isDeviceOn ? "#2ecc71" : "#f39c12";

                  if (device.serial_number === "C8F09E88E68C") {
                    displayName = "Θερμοσίφωνας";
                    iconName = "water-outline";
                  } else if (device.serial_number === "C8F09E879348") {
                    displayName = "Γενική Κατανάλωση";
                    iconName = "flash-outline";
                  } else if (device.device_id === "virtual_washing_machine") {
                    displayName = "Πλυντήριο Ρούχων";
                    iconName = "shirt-outline";
                  }

                  return (
                    <View key={device.device_id}>
                      <View style={styles.deviceRow}>
                        <View style={styles.deviceInfo}>
                          <View
                            style={[
                              styles.iconBox,
                              { backgroundColor: theme.background },
                            ]}
                          >
                            <Ionicons
                              name={iconName as any}
                              size={24}
                              color={iconColor}
                            />
                          </View>
                          <View>
                            <Text
                              style={[
                                styles.deviceName,
                                { color: theme.textMain },
                              ]}
                              numberOfLines={1}
                            >
                              {displayName}
                            </Text>
                            <Text
                              style={[
                                styles.deviceType,
                                { color: theme.textSub },
                              ]}
                            >
                              Διακόπτης Ελέγχου • ID:{" "}
                              {device.device_id.substring(0, 5)}...
                            </Text>
                          </View>
                        </View>

                        <Switch
                          value={isDeviceOn}
                          onValueChange={() =>
                            toggleDeviceStatus(device.device_id, isDeviceOn)
                          }
                          trackColor={{ false: "#dcdcdc", true: "#2ecc71" }}
                          thumbColor={"#ffffff"}
                        />
                      </View>

                      {index < groupedDevices[roomId].length - 1 && (
                        <View
                          style={[
                            styles.divider,
                            { backgroundColor: theme.borderColor },
                          ]}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 15, fontSize: 16, fontWeight: "500" },
  contentContainer: { padding: 20, paddingBottom: 100, paddingTop: 10 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },

  emptyState: {
    alignItems: "center",
    padding: 40,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },
  emptyStateText: { fontSize: 14, textAlign: "center", lineHeight: 22 },

  roomSection: { marginBottom: 25 },
  roomTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 5,
  },
  card: {
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  deviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 5,
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  deviceName: { fontSize: 14, fontWeight: "600", width: 200 },
  deviceType: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginHorizontal: 10 },
});
