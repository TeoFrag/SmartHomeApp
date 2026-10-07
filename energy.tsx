import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BarChart } from "react-native-chart-kit";

import { useDeviceContext } from "./context/DeviceContext";

export default function EnergyScreen() {
  const { darkMode, authToken, powerPriceHistory } = useDeviceContext();
  const screenWidth = Dimensions.get("window").width;

  const [liveEnergyData, setLiveEnergyData] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllEnergyData = async (isRefresh = false) => {
    if (!authToken) return;

    try {
      if (!isRefresh) setLoading(true);

      const liveResponse = await fetch(
        "http://10.64.44.134:8000/rest/v1/api_house_energy_hour_phase?select=*&order=bucket.desc&limit=1",
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
      const liveData = await liveResponse.json();
      if (liveResponse.ok && liveData && liveData.length > 0) {
        setLiveEnergyData(liveData[0]);
      }

      const historyResponse = await fetch(
        "http://10.64.44.134:8000/rest/v1/api_house_energy_day?select=*&order=bucket.desc&limit=365",
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
      const histData = await historyResponse.json();
      if (historyResponse.ok && histData) {
        setHistoricalData(histData);
      }
    } catch (error) {
      console.log("Σφάλμα κατά το fetch ενεργειακών δεδομένων:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authToken) return;
    fetchAllEnergyData();
    const interval = setInterval(() => fetchAllEnergyData(true), 10000);
    return () => clearInterval(interval);
  }, [authToken]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllEnergyData(true);
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const todayDateStr = `${yyyy}-${mm}-${dd}`;

  const getPriceForDate = (dateStr: string) => {
    if (!powerPriceHistory || powerPriceHistory.length === 0) return 0.15;

    const reversedHistory = [...powerPriceHistory].reverse();
    const activeEntry = reversedHistory.find((entry) => entry.date <= dateStr);

    return activeEntry ? activeEntry.price : powerPriceHistory[0].price;
  };

  const todayEntry = historicalData.find((d) =>
    d.bucket.startsWith(todayDateStr),
  );
  const todayEnergyKWh = todayEntry ? todayEntry.energy_wh / 1000 : 0;

  const todayPrice = getPriceForDate(todayDateStr);
  const todayCost = (todayEnergyKWh * todayPrice).toFixed(2);

  const currentMonthEnergyData = historicalData.filter((d) => {
    const dt = new Date(d.bucket);
    return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
  });

  const monthlyCost = currentMonthEnergyData
    .reduce((totalCost, d) => {
      const dayStr = d.bucket.split("T")[0];
      const dailyPrice = getPriceForDate(dayStr);
      const dailyKWh = d.energy_wh / 1000;
      return totalCost + dailyKWh * dailyPrice;
    }, 0)
    .toFixed(2);

  const getChartData = () => {
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

    historicalData.forEach((d) => {
      const dt = new Date(d.bucket);
      if (dt.getFullYear() === currentYear) {
        monthlySums[dt.getMonth()] += d.energy_wh / 1000;
      }
    });

    const labels = monthNames.slice(0, currentMonth + 1);
    const data = monthlySums
      .slice(0, currentMonth + 1)
      .map((val) => Number(val.toFixed(2)));

    return {
      labels: labels.length ? labels : ["-"],
      datasets: [{ data: data.length ? data : [0] }],
    };
  };

  const chartData = getChartData();

  const chartWidth = Math.max(screenWidth - 60, chartData.labels.length * 60);

  const theme = {
    background: darkMode ? "#121212" : "#f4f6f8",
    cardBg: darkMode ? "#1e1e1e" : "#ffffff",
    textMain: darkMode ? "#ffffff" : "#2c3e50",
    textSub: darkMode ? "#aaaaaa" : "#95a5a6",
    divider: darkMode ? "#333333" : "#f1f2f6",
  };

  const chartConfig = {
    backgroundColor: theme.cardBg,
    backgroundGradientFrom: theme.cardBg,
    backgroundGradientTo: theme.cardBg,
    color: (opacity = 1) =>
      darkMode
        ? `rgba(241, 196, 15, ${opacity})`
        : `rgba(211, 84, 0, ${opacity})`,
    labelColor: (opacity = 1) => theme.textSub,
    barPercentage: 0.6,
    decimalPlaces: 1,
  };

  const rawPower = 156;
  const rawVoltage = liveEnergyData?.voltage_v || 0;
  const rawCurrent = liveEnergyData?.current_a || 0;
  const rawFreq = liveEnergyData?.freq_hz || 0;

  const displayFreq = rawFreq > 0 ? rawFreq : 50;
  const displayVoltage = rawVoltage > 0 ? rawVoltage : 230;
  const displayPower = rawPower;

  let displayCurrent: string | number = "0";
  if (rawCurrent > 0) {
    displayCurrent = Number(rawCurrent).toFixed(2);
  } else if (rawPower > 0) {
    displayCurrent = (rawPower / displayVoltage).toFixed(2);
  }

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color="#f1c40f" />
        <Text style={{ color: theme.textSub, marginTop: 10 }}>
          Ανάλυση Ενεργειακών Δεδομένων...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#f1c40f"
        />
      }
    >
      <View
        style={[
          styles.mainCard,
          { backgroundColor: theme.cardBg, borderColor: theme.divider },
        ]}
      >
        <View style={styles.mainCardHeader}>
          <View style={styles.iconCircle}>
            <Ionicons name="flash" size={30} color="#f1c40f" />
          </View>
          <View>
            <Text style={[styles.mainLabel, { color: theme.textSub }]}>
              Σημερινή Κατανάλωση
            </Text>
            <Text style={[styles.mainValue, { color: theme.textMain }]}>
              {todayEnergyKWh.toFixed(2)}{" "}
              <Text style={styles.mainUnit}>kWh</Text>
            </Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        <Text style={[styles.statusInfo, { color: "#2ecc71" }]}>
          <Ionicons name="radio-outline" size={16} color="#2ecc71" /> Ζωντανή
          σύνδεση με πίνακα
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.cardBg }]}>
          <View style={[styles.iconBox, { backgroundColor: "#2ecc7120" }]}>
            <Ionicons name="cash-outline" size={22} color="#2ecc71" />
          </View>
          <Text style={[styles.statValue, { color: theme.textMain }]}>
            {todayCost}€
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSub }]}>
            Σημερινό Κόστος
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.cardBg }]}>
          <View style={[styles.iconBox, { backgroundColor: "#e74c3c20" }]}>
            <Ionicons name="calendar-outline" size={22} color="#e74c3c" />
          </View>
          <Text style={[styles.statValue, { color: theme.textMain }]}>
            {monthlyCost}€
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSub }]}>
            Μηνιαίο Κόστος (Έως τώρα)
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textSub }]}>
        ΔΕΔΟΜΕΝΑ ΔΙΚΤΥΟΥ (LIVE)
      </Text>
      <View style={styles.grid}>
        <View
          style={[
            styles.miniCard,
            { backgroundColor: theme.cardBg, borderColor: theme.divider },
          ]}
        >
          <Ionicons name="pulse-outline" size={22} color="#e74c3c" />
          <Text style={[styles.miniLabel, { color: theme.textSub }]}>
            Ισχύς (W)
          </Text>
          <Text style={[styles.miniValue, { color: theme.textMain }]}>
            {displayPower}
          </Text>
        </View>
        <View
          style={[
            styles.miniCard,
            { backgroundColor: theme.cardBg, borderColor: theme.divider },
          ]}
        >
          <Ionicons name="speedometer-outline" size={22} color="#3498db" />
          <Text style={[styles.miniLabel, { color: theme.textSub }]}>
            Τάση (V)
          </Text>
          <Text style={[styles.miniValue, { color: theme.textMain }]}>
            {displayVoltage}
          </Text>
        </View>
        <View
          style={[
            styles.miniCard,
            { backgroundColor: theme.cardBg, borderColor: theme.divider },
          ]}
        >
          <Ionicons name="analytics-outline" size={22} color="#9b59b6" />
          <Text style={[styles.miniLabel, { color: theme.textSub }]}>
            Ρεύμα (A)
          </Text>
          <Text style={[styles.miniValue, { color: theme.textMain }]}>
            {displayCurrent}
          </Text>
        </View>
        <View
          style={[
            styles.miniCard,
            { backgroundColor: theme.cardBg, borderColor: theme.divider },
          ]}
        >
          <Ionicons name="infinite-outline" size={22} color="#1abc9c" />
          <Text style={[styles.miniLabel, { color: theme.textSub }]}>
            Συχνότητα (Hz)
          </Text>
          <Text style={[styles.miniValue, { color: theme.textMain }]}>
            {displayFreq}
          </Text>
        </View>
      </View>

      <Text
        style={[styles.sectionTitle, { color: theme.textSub, marginTop: 15 }]}
      >
        ΙΣΤΟΡΙΚΟ ΚΑΤΑΝΑΛΩΣΗΣ ΜΗΝΩΝ
      </Text>

      <View
        style={[
          styles.chartCard,
          { backgroundColor: theme.cardBg, borderColor: theme.divider },
        ]}
      >
        <Text
          style={[
            styles.chartCardTitle,
            { color: theme.textMain, textAlign: "center", marginBottom: 20 },
          ]}
        >
          Μηνιαία Κατανάλωση (kWh)
        </Text>

        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          bounces={false}
        >
          <View style={{ width: chartWidth }} pointerEvents="none">
            <BarChart
              style={styles.chart}
              data={chartData}
              width={chartWidth}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              verticalLabelRotation={0}
              fromZero={true}
              showValuesOnTopOfBars={true}
            />
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 50 },

  mainCard: {
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  mainCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  iconCircle: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: "#f1c40f20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  mainLabel: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  mainValue: { fontSize: 32, fontWeight: "bold" },
  mainUnit: { fontSize: 16, fontWeight: "normal" },
  divider: { height: 1, marginBottom: 12 },
  statusInfo: { fontSize: 13, fontWeight: "600" },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  statCard: {
    width: "48%",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 18, fontWeight: "bold" },
  statLabel: { fontSize: 12, marginTop: 2, textAlign: "center" },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1.5,
    marginBottom: 15,
    marginLeft: 5,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  miniCard: {
    width: "48%",
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 15,
    elevation: 1,
  },
  miniLabel: { fontSize: 12, fontWeight: "600", marginTop: 8, marginBottom: 3 },
  miniValue: { fontSize: 20, fontWeight: "bold" },

  chartCard: {
    borderRadius: 22,
    padding: 15,
    borderWidth: 1,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  chartCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 15,
    marginLeft: 5,
  },
  chart: { borderRadius: 15 },
});
