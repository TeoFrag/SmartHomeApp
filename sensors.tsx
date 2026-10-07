import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

import { useDeviceContext } from "./context/DeviceContext";

export default function SensorsScreen() {
  const router = useRouter();
  const { authToken, darkMode } = useDeviceContext();
  const screenWidth = Dimensions.get("window").width;

  const [devices, setDevices] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chartDataCache, setChartDataCache] = useState<Record<string, any[]>>(
    {},
  );
  const [loadingChart, setLoadingChart] = useState<boolean>(false);
  const [selectedData, setSelectedData] = useState<
    Record<string, { value: number; time: string }>
  >({});

  const theme = {
    background: darkMode ? "#121212" : "#f4f6f8",
    cardBg: darkMode ? "#1e1e1e" : "#ffffff",
    textMain: darkMode ? "#ffffff" : "#2c3e50",
    textSub: darkMode ? "#aaaaaa" : "#7f8c8d",
    borderColor: darkMode ? "#333333" : "#e0e6ed",
  };

  const fetchInitialData = async (isRefresh = false) => {
    if (!authToken) return;
    try {
      if (!isRefresh) setLoading(true);

      const roomsRes = await fetch(
        "http://10.64.44.134:8000/rest/v1/rooms?select=*",
        {
          headers: {
            "Content-Type": "application/json",
            apikey:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4MTU0MjE3LCJleHAiOjIwMzA2NzAwMDB9.1u7FC7aK_c3E6VQUsCoTCY006_KrsCUcdPo2JUScU0U",
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      const roomsData = await roomsRes.json();
      if (roomsRes.ok) setRooms(roomsData);

      const devRes = await fetch(
        "http://10.64.44.134:8000/rest/v1/devices?select=*",
        {
          headers: {
            "Content-Type": "application/json",
            apikey:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4MTU0MjE3LCJleHAiOjIwMzA2NzAwMDB9.1u7FC7aK_c3E6VQUsCoTCY006_KrsCUcdPo2JUScU0U",
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      const devData = await devRes.json();
      if (devRes.ok) setDevices(devData);
    } catch (error) {
      console.log("Σφάλμα:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [authToken]);

  const onRefresh = () => {
    setRefreshing(true);
    setChartDataCache({});
    fetchInitialData(true);
  };

  const handleExpandDevice = async (device: any) => {
    const id = device.device_id;
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);
    if (chartDataCache[id]) return;

    setLoadingChart(true);
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startIso = startOfDay.toISOString();

      let metricsToFetch: any[] = [];

      if (device.kind === "sub_meter") {
        metricsToFetch = [
          {
            key: "power",
            title: "Ιστορικό Ισχύος Σήμερα (W)",
            color: "#e74c3c",
            suffix: "W",
            fromZero: true,
          },
        ];
      } else if (
        device.kind === "climate_sensor" ||
        device.kind === "air_quality_sensor"
      ) {
        metricsToFetch = [
          {
            key: "temperature",
            title: "Ιστορικό Θερμοκρασίας Σήμερα (°C)",
            color: "#f39c12",
            suffix: "°",
            fromZero: false,
          },
          {
            key: "humidity",
            title: "Ιστορικό Υγρασίας Σήμερα (%)",
            color: "#3498db",
            suffix: "%",
            fromZero: false,
          },
        ];
      } else if (device.kind === "motion_sensor") {
        metricsToFetch = [
          {
            key: "illuminance",
            title: "Φωτεινότητα Χώρου Σήμερα (Lux)",
            color: "#f1c40f",
            suffix: " lx",
            fromZero: true,
          },
        ];
      }

      const fetchedCharts = await Promise.all(
        metricsToFetch.map(async (metric) => {
          const res = await fetch(
            `http://10.64.44.134:8000/rest/v1/api_device_measurement_readings?device_id=eq.${id}&key=eq.${metric.key}&ts=gte.${startIso}&order=ts.desc&limit=2000`,
            {
              headers: {
                "Content-Type": "application/json",
                apikey:
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4MTU0MjE3LCJleHAiOjIwMzA2NzAwMDB9.1u7FC7aK_c3E6VQUsCoTCY006_KrsCUcdPo2JUScU0U",
                Authorization: `Bearer ${authToken}`,
              },
            },
          );
          const data = await res.json();

          let rawLabels = ["-"];
          let displayLabels = ["-"];
          let chartValues = [0];

          if (res.ok && data && data.length > 0) {
            const chronologicalData = [...data].reverse();
            const filteredData: any[] = [];
            let lastHourTracked = -1;

            chronologicalData.forEach((d) => {
              const date = new Date(d.ts);
              const currentHour = date.getHours();
              if (currentHour !== lastHourTracked) {
                filteredData.push(d);
                lastHourTracked = currentHour;
              }
            });

            rawLabels = filteredData.map((d) => {
              const date = new Date(d.ts);
              return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
            });

            const step = Math.max(1, Math.ceil(rawLabels.length / 5));
            displayLabels = rawLabels.map((l, index) =>
              index % step === 0 ? l : "",
            );
            chartValues = filteredData.map((d) => Number(d.value) || 0);
          }

          let datasets: any[] = [
            { data: chartValues.length ? chartValues : [0] },
          ];
          if (metric.key === "temperature") {
            if (
              !chartValues.length ||
              (chartValues.length === 1 && chartValues[0] === 0)
            ) {
              datasets = [{ data: [28] }];
            }
            datasets.push({
              data: [30],
              withDots: false,
              color: () => "transparent",
            });
            datasets.push({
              data: [26],
              withDots: false,
              color: () => "transparent",
            });
          }

          return {
            title: metric.title,
            color: metric.color,
            suffix: metric.suffix,
            fromZero: metric.fromZero,
            rawLabels,
            data: {
              labels: displayLabels.length ? displayLabels : ["-"],
              datasets: datasets,
            },
          };
        }),
      );

      setChartDataCache((prev) => ({ ...prev, [id]: fetchedCharts }));
    } catch (error) {
      console.log("Σφάλμα φόρτωσης γραφημάτων:", error);
    } finally {
      setLoadingChart(false);
    }
  };

  const translateRoomName = (roomId: string) => {
    const room = rooms.find((r) => r.room_id === roomId);
    if (!room) return "Άγνωστος Χώρος";
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

  const chartConfig = {
    backgroundColor: theme.cardBg,
    backgroundGradientFrom: theme.cardBg,
    backgroundGradientTo: theme.cardBg,
    color: (opacity = 1, forceColor?: string) =>
      forceColor || `rgba(52, 152, 219, ${opacity})`,
    labelColor: (opacity = 1) => theme.textSub,
    propsForDots: { r: "5", strokeWidth: "2", stroke: theme.cardBg },
    decimalPlaces: 1,
  };

  if (loading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ color: theme.textSub, marginTop: 10 }}>
          Φόρτωση Συσκευών...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#3498db"
        />
      }
    >
      <Text style={[styles.header, { color: theme.textMain }]}>
        Αισθητήρες & Μετρητές
      </Text>

      <View style={styles.listContainer}>
        {devices.map((device) => {
          const isExpanded = expandedId === device.device_id;
          let displayName =
            device.friendly_name || device.meta?.friendly_name || device.model;

          if (device.serial_number === "C8F09E88E68C") {
            displayName = "Θερμοσίφωνας";
          } else if (device.serial_number === "C8F09E879348") {
            displayName = "Γενική Κατανάλωση Σπιτιού";
          } else if (device.kind === "climate_sensor") {
            displayName = "Συνθήκες Χώρου";
          } else if (device.kind === "air_quality_sensor") {
            displayName = "Μετρητής Ποιότητας Αέρα";
          } else if (
            device.serial_number === "0x00158d000204c7b9" ||
            device.kind === "motion_sensor"
          ) {
            displayName = "Αισθητήρας Φωτισμού";
          }

          const roomName = translateRoomName(device.room_id);
          const chartsArray = chartDataCache[device.device_id];

          let iconName = "hardware-chip-outline";
          let defaultColor = "#3498db";
          if (device.kind === "sub_meter") {
            iconName = "flash-outline";
            defaultColor = "#e74c3c";
          }
          if (device.kind === "climate_sensor") {
            iconName = "thermometer-outline";
            defaultColor = "#f39c12";
          }
          if (device.kind === "motion_sensor") {
            iconName = "sunny-outline";
            defaultColor = "#f1c40f";
          }
          if (device.kind === "air_quality_sensor") {
            iconName = "leaf-outline";
            defaultColor = "#1abc9c";
          }

          return (
            <View
              key={device.device_id}
              style={[
                styles.deviceCard,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: isExpanded ? defaultColor : theme.borderColor,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.cardHeader}
                activeOpacity={0.7}
                onPress={() => handleExpandDevice(device)}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: defaultColor + "20" },
                  ]}
                >
                  <Ionicons
                    name={iconName as any}
                    size={24}
                    color={defaultColor}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.deviceName, { color: theme.textMain }]}
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>
                  <Text style={[styles.roomText, { color: theme.textSub }]}>
                    <Ionicons name="location-outline" size={12} /> {roomName}
                  </Text>
                </View>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={24}
                  color={theme.textSub}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.chartContainer}>
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: theme.borderColor },
                    ]}
                  />

                  {loadingChart && !chartsArray ? (
                    <View style={{ padding: 30, alignItems: "center" }}>
                      <ActivityIndicator size="small" color={defaultColor} />
                      <Text
                        style={{
                          marginTop: 10,
                          color: theme.textSub,
                          fontSize: 12,
                        }}
                      >
                        Επεξεργασία δεδομένων...
                      </Text>
                    </View>
                  ) : chartsArray ? (
                    <View style={{ width: "100%" }}>
                      {chartsArray.map((chartInfo, index) => {
                        const specificChartId = `${device.device_id}_${index}`;
                        const selectedPoint = selectedData[specificChartId];

                        return (
                          <View key={index} style={{ marginBottom: 25 }}>
                            <View style={styles.chartHeaderRow}>
                              <Text
                                style={[
                                  styles.chartTitle,
                                  { color: theme.textMain },
                                ]}
                              >
                                {chartInfo.title}
                              </Text>
                              {selectedPoint && (
                                <View
                                  style={[
                                    styles.selectedBadge,
                                    { backgroundColor: chartInfo.color + "20" },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.selectedBadgeText,
                                      { color: chartInfo.color },
                                    ]}
                                  >
                                    {selectedPoint.value}
                                    {chartInfo.suffix} @ {selectedPoint.time}
                                  </Text>
                                </View>
                              )}
                            </View>

                            <LineChart
                              data={chartInfo.data}
                              width={screenWidth - 70}
                              height={180}
                              yAxisLabel=""
                              yAxisSuffix={chartInfo.suffix}
                              chartConfig={{
                                ...chartConfig,
                                color: (opacity = 1) =>
                                  `rgba(${parseInt(chartInfo.color.slice(1, 3), 16)}, ${parseInt(chartInfo.color.slice(3, 5), 16)}, ${parseInt(chartInfo.color.slice(5, 7), 16)}, ${opacity})`,
                              }}
                              bezier
                              style={styles.chartStyle}
                              fromZero={chartInfo.fromZero}
                              onDataPointClick={({
                                value,
                                index: pointIndex,
                              }) => {
                                setSelectedData((prev) => ({
                                  ...prev,
                                  [specificChartId]: {
                                    value: value,
                                    time:
                                      chartInfo.rawLabels[pointIndex] || "-",
                                  },
                                }));
                              }}
                            />
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 10 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  listContainer: { paddingBottom: 40 },
  deviceCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 15 },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  deviceName: { fontSize: 14, fontWeight: "bold", marginBottom: 3 },
  roomText: { fontSize: 13 },
  chartContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    alignItems: "center",
  },
  divider: { height: 1, width: "100%", marginBottom: 15 },
  chartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
  },
  chartTitle: { fontSize: 13, fontWeight: "600", flex: 1 },
  selectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
  },
  selectedBadgeText: { fontSize: 11, fontWeight: "bold" },
  chartStyle: { borderRadius: 12, marginLeft: -15 },
});
