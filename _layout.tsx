import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import {
  Drawer,
  DrawerContentScrollView,
  DrawerItemList,
} from "expo-router/drawer";

import { DeviceProvider, useDeviceContext } from "./context/DeviceContext";

function CustomDrawerContent(props: any) {
  const { username, darkMode } = useDeviceContext();

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: darkMode ? "#121212" : "#ffffff" }}
    >
      <LinearGradient
        colors={["#4facfe", "#00f2fe"]}
        style={styles.drawerHeader}
      >
        <View style={styles.profileImagePlaceholder}>
          <Ionicons name="person" size={40} color="#005088" />
        </View>
        <Text style={styles.userName}>{username}</Text>
        <Text style={styles.userAddress}>Διαχείριση Smart Home</Text>
      </LinearGradient>

      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

function DrawerMenu() {
  const { darkMode } = useDeviceContext();
  const router = useRouter();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: darkMode ? "#1e1e1e" : "#ffffff" },
        headerTintColor: darkMode ? "#ffffff" : "#2c3e50",
        drawerStyle: { width: 280 },
        drawerActiveTintColor: "#3498db",
        drawerInactiveTintColor: darkMode ? "#aaaaaa" : "#333333",
      }}
    >
      <Drawer.Screen
        name="login"
        options={{ drawerItemStyle: { display: "none" }, headerShown: false }}
      />
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Αρχική",
          headerTitle: "Κέντρο Ελέγχου",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="sensors"
        options={{
          drawerLabel: "Αισθητήρες",
          headerTitle: "Αισθητήρες",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="devices"
        options={{
          drawerLabel: "Συσκευές",
          headerTitle: "Συσκευές",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="hardware-chip-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="energy"
        options={{
          drawerLabel: "Ενέργεια",
          headerTitle: "Ενέργεια",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="calendar"
        options={{
          drawerLabel: "Ημερολόγιο",
          headerTitle: "Ημερολόγιο",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="notifications"
        options={{
          drawerLabel: "Ειδοποιήσεις",
          headerTitle: "Ειδοποιήσεις",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: "Ρυθμίσεις",
          headerTitle: "Ρυθμίσεις",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="room/[id]"
        options={{ drawerItemStyle: { display: "none" }, title: "Δωμάτιο" }}
      />
      <Drawer.Screen
        name="context/DeviceContext"
        options={{ drawerItemStyle: { display: "none" } }}
      />
    </Drawer>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DeviceProvider>
        <DrawerMenu />
      </DeviceProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    height: 180,
    justifyContent: "center",
    padding: 20,
    marginBottom: 10,
  },
  profileImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    elevation: 5,
  },
  userName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  userAddress: {
    color: "#ffffff",
    fontSize: 13,
    opacity: 0.8,
  },
});
