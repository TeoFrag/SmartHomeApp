import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useDeviceContext } from "./context/DeviceContext";

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [isNetworkModalVisible, setNetworkModalVisible] = useState(false);

  const [isPricingModalVisible, setPricingModalVisible] = useState(false);
  const [newPriceInput, setNewPriceInput] = useState("");

  const {
    username,
    setUsername,
    darkMode,
    toggleDarkMode,
    logout,
    powerPriceHistory,
    updatePowerPrice,
  } = useDeviceContext();

  const theme = {
    background: darkMode ? "#121212" : "#f4f6f8",
    card: darkMode ? "#1e1e1e" : "#ffffff",
    text: darkMode ? "#ffffff" : "#2c3e50",
    subText: darkMode ? "#aaaaaa" : "#95a5a6",
    divider: darkMode ? "#333333" : "#f1f2f6",
    inputBg: darkMode ? "#2a2a2a" : "#f4f6f8",
    inputBorder: darkMode ? "#444444" : "#e0e6ed",
  };

  const getTodayPrice = () => {
    if (!powerPriceHistory || powerPriceHistory.length === 0) return 0.15;

    const todayStr = new Date().toISOString().split("T")[0];

    const reversedHistory = [...powerPriceHistory].reverse();
    const activeEntry = reversedHistory.find((entry) => entry.date <= todayStr);

    return activeEntry ? activeEntry.price : powerPriceHistory[0].price;
  };

  const currentPrice = getTodayPrice();

  const confirmLogout = () => {
    Alert.alert("Αποσύνδεση", "Είστε σίγουροι ότι θέλετε να αποσυνδεθείτε;", [
      { text: "Όχι", style: "cancel" },
      { text: "Ναι", onPress: logout, style: "destructive" },
    ]);
  };

  const saveProfile = () => {
    setProfileModalVisible(false);
    Alert.alert("Επιτυχία", "Τα στοιχεία του προφίλ σας ενημερώθηκαν!");
  };

  const saveNewPrice = () => {
    const parsedPrice = parseFloat(newPriceInput.replace(",", "."));

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert("Σφάλμα", "Παρακαλώ εισάγετε μια έγκυρη τιμή (π.χ. 0.20)");
      return;
    }

    updatePowerPrice(parsedPrice);
    setPricingModalVisible(false);
    setNewPriceInput("");
    Alert.alert(
      "Επιτυχία",
      `Η νέα τιμή (${parsedPrice}€/kWh) καταχωρήθηκε και θα ξεκινήσει να ισχύει από αύριο τα μεσάνυχτα!`,
    );
  };

  const handleNotificationsToggle = (value: boolean) => {
    setNotifications(value);
    if (value) {
      Alert.alert("Ειδοποιήσεις", "Οι ειδοποιήσεις ενεργοποιήθηκαν.");
    } else {
      Alert.alert("Ειδοποιήσεις", "Οι ειδοποιήσεις απενεργοποιήθηκαν.");
    }
  };

  const handleTermsPress = () => {
    Alert.alert(
      "Όροι Χρήσης",
      "Η παρούσα εφαρμογή αναπτύχθηκε στα πλαίσια πτυχιακής εργασίας.",
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>
          Λογαριασμός
        </Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <SettingButton
            icon="person-outline"
            title="Επεξεργασία Προφίλ"
            onPress={() => setProfileModalVisible(true)}
            color="#3498db"
            textColor={theme.text}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>
          Κατάσταση Συστήματος
        </Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <SettingButton
            icon="server-outline"
            title="Πληροφορίες Δικτύου"
            onPress={() => setNetworkModalVisible(true)}
            color="#3498db"
            textColor={theme.text}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>
          Τιμολόγηση
        </Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <SettingButton
            icon="flash-outline"
            title={`Τιμή Κιλοβατώρας: ${currentPrice}€`}
            onPress={() => {
              setNewPriceInput(currentPrice.toString());
              setPricingModalVisible(true);
            }}
            color="#f1c40f"
            textColor={theme.text}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>
          Προτιμήσεις
        </Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <SettingToggle
            icon="moon-outline"
            title="Σκοτεινή Εμφάνιση"
            value={darkMode}
            onValueChange={toggleDarkMode}
            color="#8e44ad"
            textColor={theme.text}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingToggle
            icon="notifications-outline"
            title="Ειδοποιήσεις"
            value={notifications}
            onValueChange={handleNotificationsToggle}
            color="#e74c3c"
            textColor={theme.text}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>
          Ασφάλεια
        </Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <SettingButton
            icon="key-outline"
            title="Αλλαγή Κωδικού"
            onPress={() =>
              Alert.alert(
                "Μη Διαθέσιμο",
                "Η αλλαγή κωδικού δεν υποστηρίζεται σε αυτή την έκδοση.",
              )
            }
            color="#e74c3c"
            textColor={theme.text}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>
          Έκδοση και όροι
        </Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <SettingButton
            icon="information-circle-outline"
            title="Όροι Χρήσης"
            onPress={handleTermsPress}
            color="#7f8c8d"
            textColor={theme.text}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <View style={styles.versionContainer}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: "transparent", marginLeft: 10 },
                ]}
              ></View>
              <Text style={[styles.versionText, { color: theme.text }]}>
                Έκδοση Εφαρμογής
              </Text>
            </View>
            <Text style={styles.versionNumber}>1.0.0</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingButton
            icon="log-out-outline"
            title="Αποσύνδεση"
            onPress={confirmLogout}
            color="#e74c3c"
            textColor="#e74c3c"
          />
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isProfileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Επεξεργασία Προφίλ
              </Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#e74c3c" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.input,
                { color: theme.text, backgroundColor: theme.inputBg },
              ]}
              value={username}
              onChangeText={setUsername}
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
              <Text style={styles.saveButtonText}>Αποθήκευση</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isPricingModalVisible}
        onRequestClose={() => setPricingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Τιμή Κιλοβατώρας (€)
              </Text>
              <TouchableOpacity onPress={() => setPricingModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#e74c3c" />
              </TouchableOpacity>
            </View>

            <Text
              style={{
                color: theme.subText,
                marginBottom: 15,
                fontSize: 13,
                lineHeight: 20,
              }}
            >
              Η νέα τιμή θα εφαρμοστεί αυτόματα από τα μεσάνυχτα της επόμενης
              ημέρας. Οι προηγούμενες ημέρες του μήνα θα διατηρήσουν την παλιά
              τιμή.
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.inputBg,
                  fontSize: 18,
                  fontWeight: "bold",
                },
              ]}
              keyboardType="numeric"
              value={newPriceInput}
              onChangeText={setNewPriceInput}
              placeholder="π.χ. 0.15"
              placeholderTextColor={theme.subText}
            />
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: "#f39c12" }]}
              onPress={saveNewPrice}
            >
              <Text style={styles.saveButtonText}>Ενημέρωση Τιμής</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isNetworkModalVisible}
        onRequestClose={() => setNetworkModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View
            style={[
              styles.networkModalContent,
              { backgroundColor: theme.card },
            ]}
          >
            <View style={styles.networkModalHeader}>
              <Ionicons name="server" size={24} color="#3498db" />
              <Text style={[styles.networkModalTitle, { color: theme.text }]}>
                Πληροφορίες Δικτύου
              </Text>
            </View>

            <View
              style={[
                styles.networkInfoBox,
                { backgroundColor: theme.inputBg },
              ]}
            >
              <View style={styles.networkInfoRow}>
                <Text style={styles.networkInfoLabel}>Server IP:</Text>
                <Text style={[styles.networkInfoValue, { color: theme.text }]}>
                  10.64.44.134
                </Text>
              </View>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.divider, marginVertical: 8 },
                ]}
              />
              <View style={styles.networkInfoRow}>
                <Text style={styles.networkInfoLabel}>Port:</Text>
                <Text style={[styles.networkInfoValue, { color: theme.text }]}>
                  8000
                </Text>
              </View>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.divider, marginVertical: 8 },
                ]}
              />
              <View style={styles.networkInfoRow}>
                <Text style={styles.networkInfoLabel}>API Status:</Text>
                <Text style={[styles.networkInfoValue, { color: "#2ecc71" }]}>
                  Online
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { marginTop: 15 }]}
              onPress={() => setNetworkModalVisible(false)}
            >
              <Text style={styles.saveButtonText}>Κλείσιμο</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function SettingToggle({
  icon,
  title,
  value,
  onValueChange,
  color,
  textColor,
}: any) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconBox, { backgroundColor: color + "20" }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.settingTitle, { color: textColor }]}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#dcdcdc", true: color }}
      />
    </View>
  );
}

function SettingButton({ icon, title, onPress, color, textColor }: any) {
  return (
    <Pressable style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconBox, { backgroundColor: color + "20" }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.settingTitle, { color: textColor }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 25 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    marginLeft: 10,
    letterSpacing: 1,
  },
  card: { borderRadius: 20, padding: 5, elevation: 2 },
  divider: { height: 1, marginVertical: 0, marginHorizontal: 15 },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  settingLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  settingTitle: { fontSize: 16, fontWeight: "500" },
  versionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 0,
  },
  versionText: { fontSize: 16, fontWeight: "500" },
  versionNumber: {
    fontSize: 16,
    color: "#95a5a6",
    fontWeight: "600",
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    minHeight: "45%",
  },
  networkModalContent: {
    width: "85%",
    borderRadius: 20,
    padding: 25,
  },
  networkModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "center",
    gap: 10,
  },
  networkModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  networkInfoBox: {
    borderRadius: 15,
    padding: 15,
  },
  networkInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  networkInfoLabel: {
    color: "#7f8c8d",
    fontSize: 15,
    fontWeight: "500",
  },
  networkInfoValue: {
    fontSize: 15,
    fontWeight: "bold",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  modalTitle: { fontSize: 22, fontWeight: "bold" },
  input: { padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 16 },
  saveButton: {
    backgroundColor: "#3498db",
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
