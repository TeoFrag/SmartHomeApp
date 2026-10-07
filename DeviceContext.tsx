import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface PriceHistoryEntry {
  date: string;
  price: number;
}

interface DeviceContextType {
  isHeaterOn: boolean;
  setIsHeaterOn: (value: boolean) => void;
  isLightsOn: boolean;
  setIsLightsOn: (value: boolean) => void;
  isAcOn: boolean;
  setIsAcOn: (value: boolean) => void;
  isThermostatOn: boolean;
  setIsThermostatOn: (value: boolean) => void;
  isWashingMachineOn: boolean;
  setIsWashingMachineOn: (value: boolean) => void;
  username: string;
  setUsername: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  darkMode: boolean;
  toggleDarkMode: (value: boolean) => void;
  isLoggedIn: boolean;
  authToken: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  powerPriceHistory: PriceHistoryEntry[];
  updatePowerPrice: (newPrice: number) => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [isHeaterOn, setIsHeaterOn] = useState(false);
  const [isLightsOn, setIsLightsOn] = useState(true);
  const [isAcOn, setIsAcOn] = useState(false);
  const [isThermostatOn, setIsThermostatOn] = useState(false);

  const [isWashingMachineOn, setIsWashingMachineOn] = useState(false);

  const [username, setUsernameState] = useState("Teo");
  const [address, setAddressState] = useState("Αριστοτέλους 12, Βόλος");
  const [darkMode, setDarkModeState] = useState(false);

  const [isLoggedIn, setIsLoggedInState] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [powerPriceHistory, setPowerPriceHistory] = useState<
    PriceHistoryEntry[]
  >([{ date: "2026-01-01", price: 0.15 }]);

  const router = useRouter();

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedName = await AsyncStorage.getItem("@user_name");
        if (savedName !== null) setUsernameState(savedName);

        const savedAddress = await AsyncStorage.getItem("@user_address");
        if (savedAddress !== null) setAddressState(savedAddress);

        const savedDarkMode = await AsyncStorage.getItem("@dark_mode");
        if (savedDarkMode !== null) setDarkModeState(savedDarkMode === "true");

        const savedLoginState = await AsyncStorage.getItem("@is_logged_in");
        if (savedLoginState === "true") setIsLoggedInState(true);

        const savedToken = await AsyncStorage.getItem("@access_token");
        if (savedToken !== null) setAuthToken(savedToken);

        const savedPriceHistory = await AsyncStorage.getItem(
          "@power_price_history",
        );
        if (savedPriceHistory !== null) {
          setPowerPriceHistory(JSON.parse(savedPriceHistory));
        }
      } catch (error) {
        console.log("Σφάλμα κατά τη φόρτωση των δεδομένων", error);
      }
    };
    loadSavedData();
  }, []);

  const setUsername = async (newName: string) => {
    setUsernameState(newName);
    try {
      await AsyncStorage.setItem("@user_name", newName);
    } catch (error) {
      console.log("Σφάλμα κατά την αποθήκευση του ονόματος", error);
    }
  };

  const setAddress = async (newAddress: string) => {
    setAddressState(newAddress);
    try {
      await AsyncStorage.setItem("@user_address", newAddress);
    } catch (error) {
      console.log("Σφάλμα κατά την αποθήκευση της διεύθυνσης", error);
    }
  };

  const toggleDarkMode = async (newMode: boolean) => {
    setDarkModeState(newMode);
    try {
      await AsyncStorage.setItem("@dark_mode", newMode ? "true" : "false");
    } catch (error) {
      console.log("Σφάλμα κατά την αποθήκευση του Dark Mode", error);
    }
  };

  const login = async (token: string) => {
    setIsLoggedInState(true);
    setAuthToken(token);
    try {
      await AsyncStorage.setItem("@is_logged_in", "true");
      await AsyncStorage.setItem("@access_token", token);
    } catch (error) {
      console.log("Σφάλμα κατά το login", error);
    }
  };

  const logout = async () => {
    setIsLoggedInState(false);
    setAuthToken(null);
    try {
      await AsyncStorage.removeItem("@is_logged_in");
      await AsyncStorage.removeItem("@access_token");

      router.replace("/login");
    } catch (error) {
      console.log("Σφάλμα κατά το logout", error);
    }
  };

  const updatePowerPrice = async (newPrice: number) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    const dateString = `${yyyy}-${mm}-${dd}`;

    let updatedHistory = [...powerPriceHistory];
    const existingIndex = updatedHistory.findIndex(
      (entry) => entry.date === dateString,
    );

    if (existingIndex !== -1) {
      updatedHistory[existingIndex].price = newPrice;
    } else {
      updatedHistory.push({ date: dateString, price: newPrice });
    }

    updatedHistory.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    setPowerPriceHistory(updatedHistory);
    try {
      await AsyncStorage.setItem(
        "@power_price_history",
        JSON.stringify(updatedHistory),
      );
    } catch (error) {
      console.log("Σφάλμα κατά την αποθήκευση της τιμής", error);
    }
  };

  return (
    <DeviceContext.Provider
      value={{
        isHeaterOn,
        setIsHeaterOn,
        isLightsOn,
        setIsLightsOn,
        isAcOn,
        setIsAcOn,
        isThermostatOn,
        setIsThermostatOn,
        isWashingMachineOn,
        setIsWashingMachineOn,
        username,
        setUsername,
        address,
        setAddress,
        darkMode,
        toggleDarkMode,
        isLoggedIn,
        authToken,
        login,
        logout,
        powerPriceHistory,
        updatePowerPrice,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDeviceContext() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error(
      "Το useDeviceContext πρέπει να χρησιμοποιείται μέσα σε DeviceProvider",
    );
  }
  return context;
}
export default function DummyRoute() {
  return null;
}
