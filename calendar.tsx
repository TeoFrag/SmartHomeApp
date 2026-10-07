import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useDeviceContext } from "./context/DeviceContext";
import { triggerDeviceNotification } from "./notifications";

const MONTHS = [
  "Ιανουάριος",
  "Φεβρουάριος",
  "Μάρτιος",
  "Απρίλιος",
  "Μάιος",
  "Ιούνιος",
  "Ιούλιος",
  "Αύγουστος",
  "Σεπτέμβριος",
  "Οκτώβριος",
  "Νοέμβριος",
  "Δεκέμβριος",
];

const MONTHS_GENITIVE = [
  "Ιανουαρίου",
  "Φεβρουαρίου",
  "Μαρτίου",
  "Απριλίου",
  "Μαΐου",
  "Ιουνίου",
  "Ιουλίου",
  "Αυγούστου",
  "Σεπτεμβρίου",
  "Οκτωβρίου",
  "Νοεμβρίου",
  "Δεκεμβρίου",
];

export default function CalendarScreen() {
  const router = useRouter();
  const today = new Date();

  const { darkMode, authToken, powerPriceHistory } = useDeviceContext();

  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const [selectedDate, setSelectedDate] = useState(today);

  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [scheduledTasks, setScheduledTasks] = useState<
    Record<string, { id: string; name: string; icon: string; time: string }[]>
  >({});

  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [schedulingDevice, setSchedulingDevice] = useState<string>("");
  const [schedulingIcon, setSchedulingIcon] = useState<string>("");
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);

  useEffect(() => {
    if (!authToken) return;

    const fetchHistoricalData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "http://10.64.44.134:8000/rest/v1/api_house_energy_day?select=*&order=bucket.desc&limit=100",
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
        if (response.ok && data) {
          setHistoricalData(data);
        }
      } catch (error) {
        console.log("Σφάλμα κατά το fetch ημερολογίου:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [authToken]);

  const theme = {
    background: darkMode ? "#121212" : "#f4f6f8",
    headerBg: darkMode ? "#1e1e1e" : "#ffffff",
    cardBg: darkMode ? "#1e1e1e" : "#ffffff",
    textMain: darkMode ? "#ffffff" : "#2c3e50",
    textSub: darkMode ? "#aaaaaa" : "#7f8c8d",
    borderColor: darkMode ? "#333333" : "#e0e6ed",
    arrowBtnBg: darkMode ? "#2a2a2a" : "#f0f9ff",
    dayText: darkMode ? "#ffffff" : "#34495e",
    todayBoxBg: darkMode ? "#1c2d27" : "#e8f6f3",
    todayText: darkMode ? "#2ecc71" : "#27ae60",
    statsRowBg: darkMode ? "#1a2a3a" : "#f0f9ff",
    tipBoxBg: darkMode ? "#2c2512" : "#fcf3cf",
    tipBoxText: darkMode ? "#f1c40f" : "#917217",
  };

  const minPastDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  const maxFutureDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0,
  ).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handlePrevMonth = () => {
    const prevMonth = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() - 1,
      1,
    );
    if (prevMonth >= minPastDate) {
      setViewDate(prevMonth);
    } else {
      Alert.alert(
        "Όριο Ιστορικού",
        "Το ιστορικό κατανάλωσης διατηρείται στη βάση δεδομένων μόνο για τους τελευταίους 3 μήνες.",
      );
    }
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() + 1,
      1,
    );
    if (nextMonth <= maxFutureDate) {
      setViewDate(nextMonth);
    } else {
      Alert.alert(
        "Όριο Προγραμματισμού",
        "Μπορείτε να προγραμματίσετε εργασίες μόνο μέχρι 1 μήνα μπροστά.",
      );
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
  };

  const compareSelected = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
  ).getTime();
  const compareToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();

  const isPast = compareSelected < compareToday;
  const isFuture = compareSelected > compareToday;

  const getLocalIsoDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const selectedDateStr = getLocalIsoDate(selectedDate);
  const dayData = historicalData.find((d) =>
    d.bucket.startsWith(selectedDateStr),
  );

  const getPriceForDate = (dateStr: string) => {
    if (!powerPriceHistory || powerPriceHistory.length === 0) return 0.15;
    const reversedHistory = [...powerPriceHistory].reverse();
    const activeEntry = reversedHistory.find((entry) => entry.date <= dateStr);
    return activeEntry ? activeEntry.price : powerPriceHistory[0].price;
  };

  const dailyEnergyKWh = dayData ? dayData.energy_wh / 1000 : 0;
  const dailyPrice = getPriceForDate(selectedDateStr);
  const dailyCost = (dailyEnergyKWh * dailyPrice).toFixed(2);

  const selectedMonthData = historicalData.filter((d) => {
    const dt = new Date(d.bucket);
    return (
      dt.getMonth() === selectedDate.getMonth() &&
      dt.getFullYear() === selectedDate.getFullYear()
    );
  });

  const monthlyEnergyKWh = selectedMonthData.reduce(
    (sum, d) => sum + d.energy_wh / 1000,
    0,
  );

  const monthlyCostTotal = selectedMonthData
    .reduce((totalCost, d) => {
      const dayStr = d.bucket.split("T")[0];
      const dailyPriceForMonth = getPriceForDate(dayStr);
      const dailyKWhForMonth = d.energy_wh / 1000;
      return totalCost + dailyKWhForMonth * dailyPriceForMonth;
    }, 0)
    .toFixed(2);

  const futureDevices = [
    { id: "washing", name: "Πλυντήριο Ρούχων", icon: "shirt-outline" },
    { id: "heater", name: "Θερμοσίφωνας", icon: "water-outline" },
  ];

  const openTimePicker = (deviceName: string, iconName: string) => {
    setSchedulingDevice(deviceName);
    setSchedulingIcon(iconName);
    const now = new Date();
    setSelectedHour(now.getHours());
    setSelectedMinute(Math.round(now.getMinutes() / 5) * 5);
    setTimePickerVisible(true);
  };

  const confirmSchedule = async () => {
    setTimePickerVisible(false);
    const timeString = `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`;
    const dateKey = getLocalIsoDate(selectedDate);

    const article = schedulingDevice === "Θερμοσίφωνας" ? "Ο" : "Το";

    const notificationText = `${article} ${schedulingDevice} ρυθμίστηκε να ξεκινήσει στις ${timeString} (${selectedDate.getDate()}/${selectedDate.getMonth() + 1}).`;

    const newTask = {
      id: Math.random().toString(36).substring(7),
      name: schedulingDevice,
      icon: schedulingIcon,
      time: timeString,
    };

    setScheduledTasks((prev) => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newTask],
    }));

    try {
      if (typeof triggerDeviceNotification === "function") {
        await triggerDeviceNotification(notificationText, true);
      }
    } catch (error) {
      console.log("Σφάλμα αποστολής ειδοποίησης:", error);
    }

    setTimeout(() => {
      Alert.alert(
        "Επιτυχής Προγραμματισμός",
        `${article} ${schedulingDevice} προγραμματίστηκε με επιτυχία για τις ${timeString}!`,
      );
    }, 300);
  };

  const deleteTask = (taskId: string) => {
    const dateKey = getLocalIsoDate(selectedDate);
    Alert.alert(
      "Διαγραφή Εργασίας",
      "Είστε σίγουροι ότι θέλετε να ακυρώσετε αυτόν τον προγραμματισμό;",
      [
        { text: "Ακυρο", style: "cancel" },
        {
          text: "Διαγραφη",
          style: "destructive",
          onPress: () => {
            setScheduledTasks((prev) => ({
              ...prev,
              [dateKey]: prev[dateKey].filter((t) => t.id !== taskId),
            }));
          },
        },
      ],
    );
  };

  const incrementHour = () => setSelectedHour((h) => (h + 1) % 24);
  const decrementHour = () => setSelectedHour((h) => (h - 1 + 24) % 24);
  const incrementMinute = () => setSelectedMinute((m) => (m + 5) % 60);
  const decrementMinute = () => setSelectedMinute((m) => (m - 5 + 60) % 60);

  const selectedDayNum = selectedDate.getDate();
  const selectedMonthGenitive = MONTHS_GENITIVE[selectedDate.getMonth()];

  const pastDateString =
    selectedDayNum === 1
      ? `Την 1η ${selectedMonthGenitive}`
      : `Στις ${selectedDayNum} ${selectedMonthGenitive}`;

  const futureDateString =
    selectedDayNum === 1
      ? `την 1η ${selectedMonthGenitive}`
      : `τις ${selectedDayNum} ${selectedMonthGenitive}`;

  const currentDayTasks = scheduledTasks[selectedDateStr] || [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView style={styles.container}>
        <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textMain} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textMain }]}>
            Πίσω
          </Text>
        </View>

        <View style={[styles.calendarCard, { backgroundColor: theme.cardBg }]}>
          <View style={styles.monthSelector}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={[
                styles.arrowButton,
                { backgroundColor: theme.arrowBtnBg },
              ]}
            >
              <Ionicons name="chevron-back" size={24} color="#3498db" />
            </TouchableOpacity>
            <Text style={[styles.monthText, { color: theme.textMain }]}>
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={handleNextMonth}
              style={[
                styles.arrowButton,
                { backgroundColor: theme.arrowBtnBg },
              ]}
            >
              <Ionicons name="chevron-forward" size={24} color="#3498db" />
            </TouchableOpacity>
          </View>

          <View style={styles.daysGrid}>
            {daysArray.map((day) => {
              const isThisDayToday =
                day === today.getDate() &&
                viewDate.getMonth() === today.getMonth() &&
                viewDate.getFullYear() === today.getFullYear();
              const isThisDaySelected =
                day === selectedDate.getDate() &&
                viewDate.getMonth() === selectedDate.getMonth() &&
                viewDate.getFullYear() === selectedDate.getFullYear();

              const loopDateStr = getLocalIsoDate(
                new Date(viewDate.getFullYear(), viewDate.getMonth(), day),
              );
              const hasTasks =
                scheduledTasks[loopDateStr] &&
                scheduledTasks[loopDateStr].length > 0;

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayBox,
                    isThisDayToday && {
                      backgroundColor: theme.todayBoxBg,
                      borderWidth: 1,
                      borderColor: "#2ecc71",
                    },
                    isThisDaySelected && styles.selectedBox,
                  ]}
                  onPress={() => handleSelectDay(day)}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: theme.dayText },
                      isThisDayToday && {
                        color: theme.todayText,
                        fontWeight: "bold",
                      },
                      isThisDaySelected && styles.selectedText,
                    ]}
                  >
                    {day}
                  </Text>
                  {hasTasks && (
                    <View
                      style={[
                        styles.taskDot,
                        {
                          backgroundColor: isThisDaySelected
                            ? "#fff"
                            : "#2ecc71",
                        },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.content}>
          {loading && (
            <View style={{ alignItems: "center", padding: 20 }}>
              <ActivityIndicator size="small" color="#3498db" />
              <Text style={{ color: theme.textSub, marginTop: 5 }}>
                Φόρτωση ιστορικού...
              </Text>
            </View>
          )}

          {isPast && !loading && (
            <View>
              <View
                style={[styles.infoCard, { backgroundColor: theme.cardBg }]}
              >
                <View style={styles.cardHeader}>
                  <Ionicons name="stats-chart" size={24} color="#3498db" />
                  <Text style={[styles.cardTitle, { color: theme.textMain }]}>
                    Ημερήσια Κατανάλωση
                  </Text>
                </View>
                <Text style={[styles.infoText, { color: theme.textMain }]}>
                  {pastDateString}, το σπίτι κατανάλωσε:
                </Text>
                <View
                  style={[
                    styles.statsRow,
                    { backgroundColor: theme.statsRowBg },
                  ]}
                >
                  <Text style={styles.statValue}>
                    {dailyEnergyKWh.toFixed(2)} kWh
                  </Text>
                  <Text style={[styles.statCost, { color: theme.textSub }]}>
                    ~{dailyCost} €
                  </Text>
                </View>
                <View
                  style={[styles.tipBox, { backgroundColor: theme.tipBoxBg }]}
                >
                  <Text style={[styles.tipText, { color: theme.tipBoxText }]}>
                    💡 Η κατανάλωση κρατήθηκε σε φυσιολογικά επίπεδα.
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.infoCard,
                  { backgroundColor: theme.cardBg, marginBottom: 15 },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Ionicons name="calendar-outline" size={24} color="#e74c3c" />
                  <Text style={[styles.cardTitle, { color: theme.textMain }]}>
                    Σύνολο: {MONTHS[selectedDate.getMonth()]}{" "}
                    {selectedDate.getFullYear()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statsRow,
                    { backgroundColor: theme.statsRowBg },
                  ]}
                >
                  <Text style={styles.statValue}>
                    {monthlyEnergyKWh.toFixed(2)} kWh
                  </Text>
                  <Text style={[styles.statCost, { color: theme.textSub }]}>
                    ~{monthlyCostTotal} €
                  </Text>
                </View>
              </View>
            </View>
          )}

          {!isPast && currentDayTasks.length > 0 && (
            <View style={{ marginBottom: 20, marginTop: 15 }}>
              <Text
                style={[styles.futureSectionTitle, { color: theme.textMain }]}
              >
                Προγραμματισμένες Εργασίες
              </Text>

              {currentDayTasks.map((task) => (
                <View
                  key={task.id}
                  style={[
                    styles.deviceTab,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: "#2ecc71",
                      borderWidth: 1,
                    },
                  ]}
                >
                  <View style={styles.deviceTabLeft}>
                    <View
                      style={[
                        styles.deviceIconBackground,
                        { backgroundColor: "#2ecc7120" },
                      ]}
                    >
                      <Ionicons
                        name={task.icon as any}
                        size={22}
                        color="#2ecc71"
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.deviceTabText,
                          { color: theme.textMain },
                        ]}
                      >
                        {task.name}
                      </Text>
                      <Text
                        style={{
                          color: theme.textSub,
                          fontSize: 13,
                          marginTop: 2,
                        }}
                      >
                        ⏰ Ώρα Έναρξης: {task.time}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => deleteTask(task.id)}
                    style={{ padding: 8 }}
                  >
                    <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {isFuture && (
            <View style={styles.futureContainer}>
              <Text
                style={[styles.futureSectionTitle, { color: theme.textMain }]}
              >
                Νέος Προγραμματισμός για {futureDateString}
              </Text>

              {futureDevices.map((device) => (
                <View
                  key={device.id}
                  style={[styles.deviceTab, { backgroundColor: theme.cardBg }]}
                >
                  <View style={styles.deviceTabLeft}>
                    <View
                      style={[
                        styles.deviceIconBackground,
                        { backgroundColor: theme.arrowBtnBg },
                      ]}
                    >
                      <Ionicons
                        name={device.icon as any}
                        size={22}
                        color="#3498db"
                      />
                    </View>
                    <Text
                      style={[styles.deviceTabText, { color: theme.textMain }]}
                    >
                      {device.name}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => openTimePicker(device.name, device.icon)}
                    style={styles.addButton}
                  >
                    <Ionicons name="add-circle" size={32} color="#2ecc71" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {!isPast && !isFuture && !loading && (
            <View>
              <View
                style={[styles.infoCard, { backgroundColor: theme.cardBg }]}
              >
                <View style={styles.cardHeader}>
                  <Ionicons name="today-outline" size={24} color="#2ecc71" />
                  <Text style={[styles.cardTitle, { color: theme.textMain }]}>
                    Σημερινή Κατανάλωση
                  </Text>
                </View>
                <Text style={[styles.infoText, { color: theme.textMain }]}>
                  Μέχρι αυτή την ώρα σήμερα, το σπίτι έχει καταναλώσει:
                </Text>
                <View
                  style={[
                    styles.statsRow,
                    { backgroundColor: theme.statsRowBg },
                  ]}
                >
                  <Text style={styles.statValue}>
                    {dailyEnergyKWh.toFixed(2)} kWh
                  </Text>
                  <Text style={[styles.statCost, { color: theme.textSub }]}>
                    ~{dailyCost} €
                  </Text>
                </View>
                <View
                  style={[styles.tipBox, { backgroundColor: theme.tipBoxBg }]}
                >
                  <Text style={[styles.tipText, { color: theme.tipBoxText }]}>
                    Τα ζωντανά, αναλυτικά γραφήματα της ημέρας βρίσκονται στην
                    καρτέλα "Ενέργεια".
                  </Text>
                </View>
              </View>

              <View style={styles.futureContainer}>
                <Text
                  style={[styles.futureSectionTitle, { color: theme.textMain }]}
                >
                  Νέος Προγραμματισμός για το υπόλοιπο της ημέρας
                </Text>

                {futureDevices.map((device) => (
                  <View
                    key={device.id}
                    style={[
                      styles.deviceTab,
                      { backgroundColor: theme.cardBg },
                    ]}
                  >
                    <View style={styles.deviceTabLeft}>
                      <View
                        style={[
                          styles.deviceIconBackground,
                          { backgroundColor: theme.arrowBtnBg },
                        ]}
                      >
                        <Ionicons
                          name={device.icon as any}
                          size={22}
                          color="#3498db"
                        />
                      </View>
                      <Text
                        style={[
                          styles.deviceTabText,
                          { color: theme.textMain },
                        ]}
                      >
                        {device.name}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => openTimePicker(device.name, device.icon)}
                      style={styles.addButton}
                    >
                      <Ionicons name="add-circle" size={32} color="#2ecc71" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isTimePickerVisible}
        onRequestClose={() => setTimePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.cardBg }]}
          >
            <Text style={[styles.modalTitle, { color: theme.textMain }]}>
              Επιλογή Ώρας
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSub }]}>
              {schedulingDevice}
            </Text>

            <View style={styles.timePickerContainer}>
              <View style={styles.timeColumn}>
                <TouchableOpacity
                  onPress={incrementHour}
                  style={styles.timeArrow}
                >
                  <Ionicons
                    name="chevron-up"
                    size={32}
                    color={theme.textMain}
                  />
                </TouchableOpacity>
                <Text style={[styles.timeText, { color: theme.textMain }]}>
                  {String(selectedHour).padStart(2, "0")}
                </Text>
                <TouchableOpacity
                  onPress={decrementHour}
                  style={styles.timeArrow}
                >
                  <Ionicons
                    name="chevron-down"
                    size={32}
                    color={theme.textMain}
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.timeSeparator, { color: theme.textMain }]}>
                :
              </Text>

              <View style={styles.timeColumn}>
                <TouchableOpacity
                  onPress={incrementMinute}
                  style={styles.timeArrow}
                >
                  <Ionicons
                    name="chevron-up"
                    size={32}
                    color={theme.textMain}
                  />
                </TouchableOpacity>
                <Text style={[styles.timeText, { color: theme.textMain }]}>
                  {String(selectedMinute).padStart(2, "0")}
                </Text>
                <TouchableOpacity
                  onPress={decrementMinute}
                  style={styles.timeArrow}
                >
                  <Ionicons
                    name="chevron-down"
                    size={32}
                    color={theme.textMain}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.arrowBtnBg },
                ]}
                onPress={() => setTimePickerVisible(false)}
              >
                <Text
                  style={[styles.modalButtonText, { color: theme.textSub }]}
                >
                  Ακύρωση
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#2ecc71" }]}
                onPress={confirmSchedule}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Προγραμματισμός
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingTop: 8,
    elevation: 2,
  },
  backButton: { padding: 5 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  calendarCard: {
    padding: 15,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  arrowButton: { padding: 8, borderRadius: 10 },
  monthText: { fontSize: 18, fontWeight: "bold" },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  dayBox: {
    width: "13%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    margin: "0.6%",
    borderRadius: 10,
  },
  selectedBox: { backgroundColor: "#3498db" },
  dayNumber: { fontSize: 16, fontWeight: "500" },
  selectedText: { color: "#fff", fontWeight: "bold" },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  content: { paddingHorizontal: 20, paddingBottom: 30 },
  infoCard: {
    padding: 20,
    borderRadius: 20,
    marginTop: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  statValue: { fontSize: 24, fontWeight: "bold", color: "#2980b9" },
  statCost: { fontSize: 18 },
  tipBox: { padding: 12, borderRadius: 10 },
  tipText: { fontSize: 13 },
  futureContainer: { marginTop: 15 },
  futureSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    paddingLeft: 5,
  },
  deviceTab: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  deviceTabLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  deviceIconBackground: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  deviceTabText: { fontSize: 15, fontWeight: "600" },
  addButton: { padding: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    borderRadius: 25,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 25,
  },
  timePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  timeColumn: {
    alignItems: "center",
    width: 90,
  },
  timeArrow: {
    padding: 10,
  },
  timeText: {
    fontSize: 40,
    fontWeight: "bold",
    marginVertical: 10,
    textAlign: "center",
    width: "100%",
  },
  timeSeparator: {
    fontSize: 40,
    fontWeight: "bold",
    marginHorizontal: 5,
    paddingBottom: 5,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 10,
    fontWeight: "bold",
  },
});
