import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";

import { useDeviceContext } from "../context/DeviceContext";
import { triggerDeviceNotification } from "../notifications";

export default function DynamicRoomScreen() {
  const { id, from } = useLocalSearchParams();
  const router = useRouter();
  const { authToken, darkMode } = useDeviceContext();
  const screenWidth = Dimensions.get("window").width;

  const [roomName, setRoomName] = useState("Φόρτωση...");
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<any[]>([]);

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

  useFocusEffect(
    useCallback(() => {
      if (!authToken || !id) return;
      let isActive = true;

      const fetchRoomDetails = async () => {
        try {
          if (roomName === "Φόρτωση...") setLoading(true);

          const roomResponse = await fetch(
            `http://10.64.44.134:8000/rest/v1/rooms?room_id=eq.${id}&select=*`,
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
          const roomData = await roomResponse.json();
          if (
            isActive &&
            roomResponse.ok &&
            Array.isArray(roomData) &&
            roomData.length > 0
          ) {
            setRoomName(translateRoomName(roomData[0].name));
          }

          const devicesResponse = await fetch(
            `http://10.64.44.134:8000/rest/v1/devices?room_id=eq.${id}&select=*`,
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
          if (isActive && devicesResponse.ok && Array.isArray(devicesData)) {
            setDevices(devicesData);
          }
        } catch (error) {
          console.log("Σφάλμα:", error);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchRoomDetails();
      const interval = setInterval(fetchRoomDetails, 30000);

      return () => {
        isActive = false;
        clearInterval(interval);
      };
    }, [id, authToken]),
  );

  const toggleDeviceStatus = async (
    deviceId: string,
    currentState: boolean,
  ) => {
    const newState = !currentState;
    const targetDevice = devices.find((d) => d.device_id === deviceId);

    setDevices((prevDevices) =>
      prevDevices.map((device) =>
        device.device_id === deviceId
          ? { ...device, meta: { ...device.meta, is_on: newState } }
          : device,
      ),
    );

    if (targetDevice?.serial_number === "C8F09E88E68C") {
      await triggerDeviceNotification("Θερμοσίφωνας", newState);
    } else if (
      targetDevice?.serial_number === "C8F09E879348" ||
      targetDevice?.meta?.measures === "House"
    ) {
      await triggerDeviceNotification("Πλυντήριο Ρούχων", newState);
    }

    try {
      const response = await fetch(
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

      if (!response.ok) throw new Error("Αποτυχία ενημέρωσης server");
    } catch (error) {
      setDevices((prevDevices) =>
        prevDevices.map((device) =>
          device.device_id === deviceId
            ? { ...device, meta: { ...device.meta, is_on: currentState } }
            : device,
        ),
      );
      Alert.alert("Σφάλμα", "Δεν ήταν δυνατή η επικοινωνία με τη βάση.");
    }
  };

  const handleExpandDevice = async (device: any) => {
    const devId = device.device_id;

    if (expandedId === devId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(devId);
    if (chartDataCache[devId]) return;

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
            `http://10.64.44.134:8000/rest/v1/api_device_measurement_readings?device_id=eq.${devId}&key=eq.${metric.key}&ts=gte.${startIso}&order=ts.desc&limit=2000`,
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

      setChartDataCache((prev) => ({ ...prev, [devId]: fetchedCharts }));
    } catch (error) {
      console.log("Σφάλμα φόρτωσης γραφημάτων:", error);
    } finally {
      setLoadingChart(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color="#4facfe" />
        <Text style={[styles.loadingText, { color: theme.textSub }]}>
          Φόρτωση δεδομένων δωματίου...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (from === "sensors") {
              router.replace("/sensors");
            } else {
              router.replace("/");
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textMain} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textMain }]}>
          {roomName}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.sectionTitle, { color: theme.textMain }]}>
          Στοιχεία Δωματίου ({devices.length})
        </Text>

        {devices.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.cardBg, borderColor: theme.borderColor },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={40}
              color={theme.textSub}
            />
            <Text style={[styles.emptyText, { color: theme.textMain }]}>
              Δεν βρέθηκαν καταχωρημένες συσκευές για αυτό το δωμάτιο.
            </Text>
          </View>
        ) : (
          devices.map((device, index) => {
            let displayName =
              device.friendly_name ||
              device.meta?.friendly_name ||
              device.model ||
              device.kind ||
              "Άγνωστη Συσκευή";
            let iconName = "hardware-chip-outline";
            let iconColor = "#3498db";

            const isSwitch = device.kind === "sub_meter";
            const isDeviceOn = device.meta?.is_on || false;
            const isExpanded = expandedId === device.device_id;
            const chartsArray = chartDataCache[device.device_id];

            if (device.serial_number === "C8F09E88E68C") {
              displayName = "Θερμοσίφωνας";
              iconName = "water-outline";
              iconColor = "#e74c3c";
            } else if (device.serial_number === "C8F09E879348") {
              displayName = "Πλυντήριο Ρούχων";
              iconName = "shirt-outline";
              iconColor = "#9b59b6";
            } else if (device.kind === "climate_sensor") {
              displayName = "Συνθήκες Χώρου";
              iconName = "thermometer-outline";
              iconColor = "#f39c12";
            } else if (device.kind === "air_quality_sensor") {
              displayName = "Μετρητής Ποιότητας Αέρα";
              iconName = "leaf-outline";
              iconColor = "#1abc9c";
            } else if (
              device.serial_number === "0x00158d000204c7b9" ||
              device.kind === "motion_sensor"
            ) {
              displayName = "Αισθητήρας Φωτισμού";
              iconName = "sunny-outline";
              iconColor = "#f1c40f";
            }

            return (
              <View
                key={device.device_id || index.toString()}
                style={[
                  styles.deviceCard,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: isExpanded ? iconColor : theme.borderColor,
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleExpandDevice(device)}
                  style={styles.cardHeader}
                >
                  <View style={styles.deviceInfo}>
                    <View
                      style={[
                        styles.iconBox,
                        { backgroundColor: iconColor + "20" },
                      ]}
                    >
                      <Ionicons
                        name={iconName as any}
                        size={24}
                        color={iconColor}
                      />
                    </View>
                    <View style={{ marginLeft: 15, flexShrink: 1 }}>
                      <Text
                        style={[styles.deviceName, { color: theme.textMain }]}
                      >
                        {displayName}
                      </Text>
                      <Text
                        style={[styles.deviceSub, { color: theme.textSub }]}
                      >
                        {isSwitch ? "Διακόπτης Ελέγχου" : "Αισθητήρας"}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {isSwitch && (
                      <Switch
                        value={isDeviceOn}
                        onValueChange={() =>
                          toggleDeviceStatus(device.device_id, isDeviceOn)
                        }
                        trackColor={{
                          false: theme.borderColor,
                          true: iconColor,
                        }}
                        thumbColor={"#ffffff"}
                        style={{
                          transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
                          marginRight: 10,
                        }}
                      />
                    )}
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={24}
                      color={theme.textSub}
                    />
                  </View>
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
                        <ActivityIndicator size="small" color={iconColor} />
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
                        {chartsArray.map((chartInfo, cIndex) => {
                          const specificChartId = `${device.device_id}_${cIndex}`;
                          const selectedPoint = selectedData[specificChartId];

                          return (
                            <View key={cIndex} style={{ marginBottom: 25 }}>
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
                                      {
                                        backgroundColor: chartInfo.color + "20",
                                      },
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

                        {device.serial_number === "C8F09E88E68C" && (
                          <HeaterMonthlyChart
                            deviceId={device.device_id}
                            authToken={authToken}
                            theme={theme}
                            screenWidth={screenWidth}
                          />
                        )}
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

function HeaterMonthlyChart({ deviceId, authToken, theme, screenWidth }: any) {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://10.64.44.134:8000/rest/v1/api_device_measurement_readings?device_id=eq.${deviceId}&key=eq.active_power&select=value,ts&order=ts.desc&limit=5000`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              apikey:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4MTU0MjE3LCJleHAiOjIwMzA2NzAwMDB9.1u7FC7aK_c3E6VQUsCoTCY006_KrsCUcdPo2JUScU0U",
            },
          },
        );
        const data = await res.json();
        if (!isActive) return;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const monthNames = [
          "Ιαν",
          "Φεβ",
          "Μαρ",
          "Απρ",
          "Μαι",
          "Ιουν",
          "Ιουλ",
          "Αυγ",
          "Σεπ",
          "Οκτ",
          "Νοε",
          "Δεκ",
        ];
        const monthlySums = new Array(12).fill(0);

        if (res.ok && Array.isArray(data) && data.length > 0) {
          data.forEach((d: any) => {
            const dt = new Date(d.ts);
            if (dt.getFullYear() === currentYear) {
              const powerInW = Number(d.value) || 0;
              monthlySums[dt.getMonth()] += (powerInW / 1000) * 0.5;
            }
          });
        }

        const labels = monthNames.slice(0, currentMonth + 1);
        const chartValues = monthlySums
          .slice(0, currentMonth + 1)
          .map((val) => Number(val.toFixed(2)));

        setChartData({
          labels: labels.length ? labels : ["-"],
          datasets: [{ data: chartValues.length ? chartValues : [0] }],
        });
      } catch (e) {}
      if (isActive) setLoading(false);
    };
    fetchData();
    return () => {
      isActive = false;
    };
  }, [deviceId, authToken]);

  if (loading) {
    return (
      <View style={{ padding: 20, alignItems: "center" }}>
        <ActivityIndicator size="small" color="#e74c3c" />
        <Text style={{ color: theme.textSub, marginTop: 5, fontSize: 12 }}>
          Υπολογισμός μηνιαίας ενέργειας...
        </Text>
      </View>
    );
  }

  const chartWidth = Math.max(
    screenWidth - 70,
    (chartData?.labels.length || 1) * 60,
  );

  return (
    <View style={{ marginTop: 20, width: "100%" }}>
      <Text
        style={[styles.chartTitle, { color: theme.textMain, marginBottom: 15 }]}
      >
        Μηνιαία Κατανάλωση Ενέργειας (kWh)
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
      >
        <View style={{ width: chartWidth }} pointerEvents="none">
          <BarChart
            data={chartData || { labels: ["-"], datasets: [{ data: [0] }] }}
            width={chartWidth}
            height={200}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: theme.cardBg,
              backgroundGradientFrom: theme.cardBg,
              backgroundGradientTo: theme.cardBg,
              color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
              labelColor: () => theme.textSub,
              barPercentage: 0.6,
              decimalPlaces: 1,
            }}
            fromZero={true}
            showValuesOnTopOfBars={true}
            verticalLabelRotation={0}
            style={{ marginLeft: -15 }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: { marginTop: 10, fontSize: 16, fontWeight: "500" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(150, 150, 150, 0.1)",
    borderRadius: 20,
  },
  title: { fontSize: 24, fontWeight: "bold" },
  contentContainer: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  emptyCard: {
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  deviceCard: {
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  deviceInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  deviceName: { fontSize: 14, fontWeight: "600" },
  deviceSub: { fontSize: 12, marginTop: 4 },
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
