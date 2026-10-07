import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { triggerDeviceNotification } from "./notifications";

import { useDeviceContext } from "./context/DeviceContext";

export default function HomeScreen() {
  const router = useRouter();

  const currentHour = new Date().getHours();
  let greeting = "Καλησπέρα";
  let greetingIcon: keyof typeof Ionicons.glyphMap = "partly-sunny";

  if (currentHour >= 6 && currentHour < 12) {
    greeting = "Καλημέρα";
    greetingIcon = "sunny";
  } else if (currentHour >= 12 && currentHour < 20) {
    greeting = "Καλησπέρα";
    greetingIcon = "partly-sunny";
  } else {
    greeting = "Καληνύχτα";
    greetingIcon = "moon";
  }

  const {
    username,
    darkMode,
    authToken,
    isHeaterOn,
    setIsHeaterOn,
    isWashingMachineOn,
    setIsWashingMachineOn,
  } = useDeviceContext();

  const [humidity, setHumidity] = useState(45);
  const [temperature, setTemperature] = useState(18);
  const [power, setPower] = useState(156);
  const [lastUpdated, setLastUpdated] = useState<string>("Περιμένετε...");
  const [rooms, setRooms] = useState<any[]>([]);
  const [dailyEnergy, setDailyEnergy] = useState<number>(0);
  const [devices, setDevices] = useState<any[]>([]);
  const [apiStatus, setApiStatus] = useState<"Online" | "Offline">("Online");

  useFocusEffect(
    useCallback(() => {
      if (!authToken) return;
      let isActive = true;

      const fetchAllData = async () => {
        try {
          const salonSensorId = "9152d5f0-56a6-4edc-a052-d8adfbcbdcaa";
          const response = await fetch(
            `http://10.64.44.134:8000/rest/v1/api_device_measurement_readings?device_id=eq.${salonSensorId}&select=*&order=ts.desc&limit=10`,
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
          if (response.ok) setApiStatus("Online");
          else setApiStatus("Offline");

          const data = await response.json();
          if (isActive && Array.isArray(data)) {
            const latestTemp = data.find((item) => item.key === "temperature");
            if (latestTemp) setTemperature(latestTemp.value);
            const latestHum = data.find(
              (item) =>
                item.key === "humidity" || item.key === "relative_humidity",
            );
            if (latestHum) setHumidity(latestHum.value);
            setLastUpdated(new Date().toLocaleTimeString("el-GR"));
          }
        } catch (e) {
          if (isActive) setApiStatus("Offline");
        }

        try {
          const powerResponse = await fetch(
            "http://10.64.44.134:8000/rest/v1/api_device_measurement_readings?key=eq.active_power&select=*&order=ts.desc&limit=1",
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
          const powerData = await powerResponse.json();
          if (isActive && powerResponse.ok && powerData.length > 0) {
            setPower(156);
          }
        } catch (e) {}

        try {
          const energyResponse = await fetch(
            "http://10.64.44.134:8000/rest/v1/api_house_energy_day?select=*&order=bucket.desc&limit=3",
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
          const energyData = await energyResponse.json();
          if (isActive && energyResponse.ok && energyData) {
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const dd = String(now.getDate()).padStart(2, "0");
            const todayDateStr = `${yyyy}-${mm}-${dd}`;
            const todayEntry = energyData.find((d: any) =>
              d.bucket.startsWith(todayDateStr),
            );
            if (todayEntry) setDailyEnergy(todayEntry.energy_wh / 1000);
            else setDailyEnergy(0);
          }
        } catch (e) {}
      };

      fetchAllData();
      const interval = setInterval(fetchAllData, 30000);

      return () => {
        isActive = false;
        clearInterval(interval);
      };
    }, [authToken]),
  );

  useEffect(() => {
    if (!authToken) return;
    const fetchRooms = async () => {
      try {
        const response = await fetch(
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
        const data = await response.json();
        if (response.ok) setRooms(data);
      } catch (error) {}
    };
    fetchRooms();
  }, [authToken]);

  const toggleDeviceStatus = async (
    identifier: string,
    currentState: boolean,
  ) => {
    const newState = !currentState;

    if (identifier === "virtual_washing_machine") {
      setIsWashingMachineOn(newState);
      await triggerDeviceNotification("Πλυντήριο Ρούχων", newState);
      return;
    }

    if (identifier === "C8F09E88E68C") {
      setIsHeaterOn(newState);
      await triggerDeviceNotification("Θερμοσίφωνας", newState);

      try {
        await fetch(
          `http://10.64.44.134:8000/rest/v1/devices?serial_number=eq.C8F09E88E68C`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              apikey:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4MTU0MjE3LCJleHAiOjIwMzA2NzAwMDB9.1u7FC7aK_c3E6VQUsCoTCY006_KrsCUcdPo2JUScU0U",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              meta: { is_on: newState },
            }),
          },
        );
      } catch (error) {
        console.log("Σφάλμα server:", error);
      }
      return;
    }
  };

  const handleDeparture = async () => {
    if (isHeaterOn) {
      setIsHeaterOn(false);
      await triggerDeviceNotification("Θερμοσίφωνας", false);

      try {
        await fetch(
          `http://10.64.44.134:8000/rest/v1/devices?serial_number=eq.C8F09E88E68C`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              apikey:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4MTU0MjE3LCJleHAiOjIwMzA2NzAwMDB9.1u7FC7aK_c3E6VQUsCoTCY006_KrsCUcdPo2JUScU0U",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              meta: { is_on: false },
            }),
          },
        );
      } catch (e) {
        console.log("Σφάλμα απενεργοποίησης θερμοσίφωνα:", e);
      }
    }

    Alert.alert(
      "Αναχώρηση",
      "Λειτουργία Αναχώρησης: Ο θερμοσίφωνας απενεργοποιήθηκε με επιτυχία.",
    );
  };

  const controllableDevices = [
    {
      device_id: "heater_fallback",
      name: "Θερμοσίφωνας",
      icon: "water-outline",
      color: "#e74c3c",
      is_on: isHeaterOn,
      identifier: "C8F09E88E68C",
    },
    {
      device_id: "virtual_washing_machine",
      name: "Πλυντήριο Ρούχων",
      icon: "shirt-outline",
      color: "#9b59b6",
      is_on: isWashingMachineOn,
      identifier: "virtual_washing_machine",
    },
  ];

  const activeDevicesCount = controllableDevices.filter((d) => d.is_on).length;

  const theme = {
    background: darkMode ? "#121212" : "#ffffff",
    cardBg: darkMode ? "#1e1e1e" : "#fbfcfd",
    textMain: darkMode ? "#ffffff" : "#2c3e50",
    textSub: darkMode ? "#aaaaaa" : "#7f8c8d",
    borderColor: darkMode ? "#333333" : "#f1f1f1",
    pillBg: darkMode ? "#2a2a2a" : "#f1f2f6",
    pillText: darkMode ? "#ffffff" : "#2f3640",
    badgeBg: darkMode ? "#1a3a5a" : "#e8f4fd",
  };

  const translateRoomName = (name: string) => {
    const translations: any = {
      "Living Room": "Σαλόνι",
      Kitchen: "Κουζίνα",
      Bathroom: "Μπάνιο",
      Office: "Γραφείο",
      "Outdoor / Balcony": "Μπαλκόνι",
      "Main Electrical Panel": "Κεντρικός Πίνακας",
    };
    return translations[name] || name;
  };

  const filteredRooms = rooms.filter(
    (room) =>
      room.name !== "Kitchen" &&
      room.name !== "Office" &&
      room.name !== "Main Electrical Panel",
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.greetingRow}>
            <Text style={[styles.helloText, { color: theme.textSub }]}>
              {greeting}
            </Text>
            <Ionicons name={greetingIcon} size={18} color="#f39c12" />
          </View>
          <Text style={[styles.nameText, { color: theme.textMain }]}>
            {username}
          </Text>
        </View>
        <TouchableOpacity
          style={{ marginRight: 15 }}
          onPress={() => router.push("/notifications")}
        >
          <Ionicons
            name="notifications-outline"
            size={28}
            color={theme.textMain}
          />
          <View style={[styles.redBadge, { borderColor: theme.background }]} />
        </TouchableOpacity>
        <LinearGradient
          colors={["#4facfe", "#00f2fe"]}
          style={styles.avatarCircle}
        >
          <Ionicons name="person" size={30} color="white" />
        </LinearGradient>
      </View>

      {darkMode ? (
        <View
          style={[
            styles.statusCard,
            { backgroundColor: theme.cardBg, borderColor: theme.borderColor },
          ]}
        >
          <StatusCardContent
            theme={theme}
            humidity={humidity}
            temperature={temperature}
            power={power}
            lastUpdated={lastUpdated}
            apiStatus={apiStatus}
          />
        </View>
      ) : (
        <LinearGradient
          colors={["#fff", "#f0f9ff"]}
          style={[styles.statusCard, { borderColor: theme.borderColor }]}
        >
          <StatusCardContent
            theme={theme}
            humidity={humidity}
            temperature={temperature}
            power={power}
            lastUpdated={lastUpdated}
            apiStatus={apiStatus}
          />
        </LinearGradient>
      )}

      <Text style={[styles.sectionTitle, { color: theme.textMain }]}>
        Χώροι ({filteredRooms.length})
      </Text>
      <View style={styles.roomsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.roomsScroll}
        >
          {filteredRooms.length === 0 ? (
            <Text style={{ color: theme.textSub }}>Φόρτωση δωματίων...</Text>
          ) : (
            filteredRooms.map((room) => (
              <RoomPill
                key={room.room_id}
                title={translateRoomName(room.name)}
                path={`/room/${room.room_id}`}
                router={router}
                theme={theme}
              />
            ))
          )}
        </ScrollView>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textMain }]}>
        Γρήγορα Σενάρια
      </Text>
      <View style={styles.scenesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scenesScroll}
        >
          <SceneButton
            title="Αναχώρηση"
            icon="exit-outline"
            color="#e74c3c"
            onPress={handleDeparture}
            theme={theme}
          />
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[
          styles.energyBanner,
          { backgroundColor: theme.cardBg, borderColor: theme.borderColor },
        ]}
        onPress={() => router.push("/energy")}
        activeOpacity={0.7}
      >
        <View style={styles.energyBannerLeft}>
          <View style={styles.energyIconBox}>
            <Ionicons name="flash" size={20} color="#f1c40f" />
          </View>
          <View>
            <Text style={[styles.energyBannerTitle, { color: theme.textMain }]}>
              Ημερήσια Κατανάλωση
            </Text>
            <Text
              style={[styles.energyBannerSubtitle, { color: theme.textSub }]}
            >
              {dailyEnergy.toFixed(2)} kWh
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.devicesHeader}>
        <Text style={[styles.sectionTitleNoMargin, { color: theme.textMain }]}>
          Συσκευές
        </Text>
        <View style={[styles.activeBadge, { backgroundColor: theme.badgeBg }]}>
          <Text style={styles.activeBadgeText}>
            {activeDevicesCount} ανοιχτές
          </Text>
        </View>
      </View>

      <View style={styles.gridContainer}>
        {controllableDevices.map((device) => (
          <DeviceCard
            key={device.device_id}
            icon={device.icon}
            title={device.name}
            value={device.is_on}
            onValueChange={() =>
              toggleDeviceStatus(device.identifier, device.is_on)
            }
            activeColor={device.color}
            theme={theme}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function StatusCardContent({
  theme,
  humidity,
  temperature,
  power,
  lastUpdated,
  apiStatus,
}: any) {
  return (
    <>
      <View style={styles.statusHeader}>
        <View>
          <Text style={[styles.cardTitle, { color: theme.textMain }]}>
            Κατάσταση Σπιτιού
          </Text>
          <Text style={[styles.lastUpdatedText, { color: theme.textSub }]}>
            Ανανέωση: {lastUpdated}
          </Text>
        </View>
        <View style={styles.apiStatusContainer}>
          <View
            style={[
              styles.apiStatusDot,
              {
                backgroundColor: apiStatus === "Online" ? "#2ecc71" : "#e74c3c",
              },
            ]}
          />
          <Text
            style={[
              styles.apiStatusText,
              { color: apiStatus === "Online" ? "#2ecc71" : "#e74c3c" },
            ]}
          >
            API: {apiStatus}
          </Text>
        </View>
      </View>
      <View style={styles.statusRow}>
        <View style={styles.statusItem}>
          <Ionicons name="water" size={24} color="#3498db" />
          <Text style={[styles.statusValue, { color: theme.textMain }]}>
            {humidity}%
          </Text>
          <Text style={[styles.statusLabel, { color: theme.textSub }]}>
            Υγρασία
          </Text>
        </View>
        <View
          style={[
            styles.statusSeparator,
            { backgroundColor: theme.borderColor },
          ]}
        />
        <View style={styles.statusItem}>
          <Ionicons name="cloud" size={24} color="#f39c12" />
          <Text style={[styles.statusValue, { color: theme.textMain }]}>
            {temperature}°C
          </Text>
          <Text style={[styles.statusLabel, { color: theme.textSub }]}>
            Θερμοκρ.
          </Text>
        </View>
        <View
          style={[
            styles.statusSeparator,
            { backgroundColor: theme.borderColor },
          ]}
        />
        <View style={styles.statusItem}>
          <Ionicons name="flash" size={24} color="#e74c3c" />
          <Text style={[styles.statusValue, { color: theme.textMain }]}>
            {power}W
          </Text>
          <Text style={[styles.statusLabel, { color: theme.textSub }]}>
            Ισχύς
          </Text>
        </View>
      </View>
    </>
  );
}

function RoomPill({ title, path, router, theme }: any) {
  return (
    <Pressable
      style={[styles.roomPill, { backgroundColor: theme.pillBg }]}
      onPress={() => router.push(path)}
    >
      <Text style={[styles.roomPillText, { color: theme.pillText }]}>
        {title}
      </Text>
    </Pressable>
  );
}

function SceneButton({ title, icon, color, onPress, theme }: any) {
  return (
    <Pressable
      style={[
        styles.sceneButton,
        { backgroundColor: theme.cardBg, borderColor: theme.borderColor },
      ]}
      onPress={onPress}
    >
      <View style={[styles.sceneIconBox, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[styles.sceneText, { color: theme.textMain }]}>{title}</Text>
    </Pressable>
  );
}

function DeviceCard({
  icon,
  title,
  value,
  onValueChange,
  activeColor,
  theme,
}: any) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardBg, borderColor: theme.borderColor },
      ]}
    >
      <View style={styles.cardHeader}>
        <Ionicons
          name={icon as any}
          size={28}
          color={value ? activeColor : theme.textSub}
        />
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.borderColor, true: activeColor }}
          thumbColor={"#ffffff"}
          style={styles.switch}
        />
      </View>
      <View>
        <Text
          style={[styles.cardDeviceTitle, { color: theme.textMain }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.cardStatus,
            value ? { color: activeColor } : { color: theme.textSub },
          ]}
        >
          {value ? "Αναμμένο" : "Σβηστό"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: -5,
  },
  helloText: { fontSize: 18 },
  nameText: { fontSize: 32, fontWeight: "bold" },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  redBadge: {
    position: "absolute",
    right: 2,
    top: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e74c3c",
    borderWidth: 2,
  },
  statusCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  cardTitle: { fontSize: 18, fontWeight: "600" },
  lastUpdatedText: { fontSize: 11, marginTop: 2 },
  apiStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.03)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 5,
    marginRight: -12,
  },
  apiStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  apiStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusItem: { alignItems: "center", flex: 1 },
  statusSeparator: { width: 1, height: 40 },
  statusValue: { fontSize: 18, fontWeight: "bold", marginTop: 5 },
  statusLabel: { fontSize: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  energyBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  energyBannerLeft: { flexDirection: "row", alignItems: "center" },
  energyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f1c40f20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  energyBannerTitle: { fontSize: 14, fontWeight: "bold" },
  energyBannerSubtitle: { fontSize: 15, marginTop: 2, fontWeight: "bold" },
  devicesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitleNoMargin: { fontSize: 20, fontWeight: "bold" },
  activeBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  activeBadgeText: { fontSize: 12, fontWeight: "600", color: "#3498db" },
  roomsWrapper: { marginBottom: 25 },
  roomsScroll: { flexDirection: "row", paddingVertical: 5 },
  roomPill: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginRight: 10,
  },
  roomPillText: { fontSize: 15, fontWeight: "600" },
  scenesWrapper: { marginBottom: 25 },
  scenesScroll: { flexDirection: "row", paddingVertical: 5 },
  sceneButton: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 15,
    alignItems: "center",
    width: 105,
    borderWidth: 1,
    elevation: 2,
  },
  sceneIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  sceneText: { fontSize: 14, fontWeight: "600" },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    borderRadius: 20,
    padding: 15,
    height: 140,
    justifyContent: "space-between",
    marginBottom: 15,
    borderWidth: 1,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switch: { transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] },
  cardDeviceTitle: { fontSize: 14, fontWeight: "600" },
  cardStatus: { fontSize: 13, fontWeight: "500" },
});
