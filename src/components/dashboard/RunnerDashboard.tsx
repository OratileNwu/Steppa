
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type Filter = "All tasks" | "Groceries" | "Parcels";
type Errand = {
  id: string;
  category: "Groceries" | "Parcels";
  title: string;
  description: string;
  distance: number;
  pickup: string;
  dropoff: string;
  fee: number;
};

const GREEN = "#176B49";

const errands: Errand[] = [
  {
    id: "1",
    category: "Groceries",
    title: "Grocery pickup",
    description: "Pick up milk, brown bread and eggs from Pick n Pay.",
    distance: 1.8,
    pickup: "Maponya Mall",
    dropoff: "Orlando West",
    fee: 85,
  },
  {
    id: "2",
    category: "Parcels",
    title: "Collect a parcel",
    description: "Collect a small parcel from the Pargo counter.",
    distance: 3.2,
    pickup: "Soweto",
    dropoff: "Orlando East",
    fee: 70,
  },
  {
    id: "3",
    category: "Groceries",
    title: "Shopping assistance",
    description: "Collect a small grocery order from Shoprite.",
    distance: 4.1,
    pickup: "Jabulani Mall",
    dropoff: "Zola",
    fee: 60,
  },
];

export default function RunnerDashboard() {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [filter, setFilter] = useState<Filter>("All tasks");
  const [selectedTab, setSelectedTab] = useState("Available");

  const visible = errands.filter(
    (errand) =>
      online &&
      (filter === "All tasks" || errand.category === filter)
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>STEPPA RUNNER</Text>
            <Text style={styles.heading}>Ready to earn?</Text>
            <Text style={styles.subheading}>
              Find errands in your neighbourhood.
            </Text>
          </View>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={24} color={GREEN} />
          </View>
        </View>

        <View style={styles.onlineCard}>
          <View style={styles.onlineLeft}>
            <View style={styles.statusDot} />
            <View>
              <Text style={styles.onlineTitle}>
                {online ? "You're online" : "You're offline"}
              </Text>
              <Text style={styles.muted}>
                {online
                  ? "Available for new errands"
                  : "Go online to see errands"}
              </Text>
            </View>
          </View>
          <Switch
            value={online}
            onValueChange={setOnline}
            trackColor={{ false: "#D1D5DB", true: "#9ACDB1" }}
            thumbColor={online ? GREEN : "#FFFFFF"}
          />
        </View>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Ionicons name="wallet-outline" size={23} color={GREEN} />
            <Text style={styles.statLabel}>Today&apos;s earnings</Text>
            <Text style={styles.statValue}>R185</Text>
            <Text style={styles.statFoot}>Simulated</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={23} color={GREEN} />
            <Text style={styles.statLabel}>Completed errands</Text>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statFoot}>Today</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          {["Available", "My errands"].map((tab) => (
            <Pressable
              key={tab}
              style={[
                styles.tab,
                selectedTab === tab && styles.activeTab,
              ]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {selectedTab === "Available" ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Near you</Text>
              <Text style={styles.nearby}>Within 5 km</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterRow}
            >
              {(["All tasks", "Groceries", "Parcels"] as Filter[]).map(
                (item) => (
                  <Pressable
                    key={item}
                    onPress={() => setFilter(item)}
                    style={[
                      styles.chip,
                      filter === item && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filter === item && styles.chipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                )
              )}
            </ScrollView>

            {visible.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="moon-outline" size={32} color={GREEN} />
                <Text style={styles.emptyTitle}>
                  {online ? "No errands found" : "You are offline"}
                </Text>
                <Text style={styles.muted}>
                  {online
                    ? "Try another category."
                    : "Switch online to browse errands."}
                </Text>
              </View>
            ) : (
              visible.map((errand) => (
                <View key={errand.id} style={styles.errandCard}>
                  <View style={styles.errandTop}>
                    <View style={styles.errandIcon}>
                      <Ionicons
                        name={
                          errand.category === "Groceries"
                            ? "basket-outline"
                            : "cube-outline"
                        }
                        size={25}
                        color={GREEN}
                      />
                    </View>

                    <View style={styles.errandInfo}>
                      <Text style={styles.category}>
                        {errand.category.toUpperCase()} ·{" "}
                        {errand.distance.toFixed(1)} KM
                      </Text>
                      <Text style={styles.errandTitle}>
                        {errand.title}
                      </Text>
                    </View>

                    <Text style={styles.fee}>R{errand.fee}</Text>
                  </View>

                  <Text style={styles.description}>
                    {errand.description}
                  </Text>

                  <View style={styles.line} />

                  <View style={styles.location}>
                    <Ionicons
                      name="location-outline"
                      size={19}
                      color="#6B7280"
                    />
                    <Text style={styles.locationText}>
                      {errand.pickup} → {errand.dropoff}
                    </Text>
                  </View>

                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => {
                      // Connect to the team's errand details screen.
                    }}
                  >
                    <Text style={styles.primaryButtonText}>
                      View errand
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={21}
                      color="#FFFFFF"
                    />
                  </Pressable>
                </View>
              ))
            )}
          </>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="bicycle-outline" size={36} color={GREEN} />
            <Text style={styles.emptyTitle}>My errands</Text>
            <Text style={styles.muted}>
              Your accepted and active errands will appear here.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem}>
          <Ionicons name="home-outline" size={24} color={GREEN} />
          <Text style={styles.navActive}>Home</Text>
        </Pressable>
        <Pressable
          style={styles.navItem}
          onPress={() => setSelectedTab("My errands")}
        >
          <Ionicons name="list-outline" size={24} color="#8B9490" />
          <Text style={styles.navLabel}>Activity</Text>
        </Pressable>
        <Pressable style={styles.navItem}>
          <Ionicons name="wallet-outline" size={24} color="#8B9490" />
          <Text style={styles.navLabel}>Wallet</Text>
        </Pressable>
        <Pressable style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#8B9490" />
          <Text style={styles.navLabel}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAF9" },
  scroll: { padding: 20, paddingBottom: 30 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  eyebrow: {
    color: GREEN,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  heading: {
    fontSize: 27,
    fontWeight: "700",
    color: "#17231D",
    marginTop: 6,
  },
  subheading: { color: "#69746E", marginTop: 5, fontSize: 13 },
  avatar: {
    backgroundColor: "#E5F4EB",
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  onlineCard: {
    backgroundColor: "#E5F4EB",
    borderRadius: 17,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 17,
  },
  onlineLeft: { flexDirection: "row", alignItems: "center", gap: 11 },
  statusDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: GREEN,
  },
  onlineTitle: { color: GREEN, fontSize: 15, fontWeight: "700" },
  muted: { color: "#718078", fontSize: 12, marginTop: 4 },
  stats: { flexDirection: "row", gap: 12, marginBottom: 23 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 17,
    padding: 16,
    gap: 7,
  },
  statLabel: { color: "#68756D", fontSize: 12 },
  statValue: { color: GREEN, fontSize: 27, fontWeight: "700" },
  statFoot: { color: "#94A3A0", fontSize: 11 },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#EBF0ED",
    padding: 4,
    borderRadius: 14,
    marginBottom: 23,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 11,
  },
  activeTab: { backgroundColor: "#FFFFFF" },
  tabText: { color: "#78837D", fontWeight: "600" },
  activeTabText: { color: GREEN },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 21, fontWeight: "700", color: "#17231D" },
  nearby: { color: GREEN, fontSize: 13, fontWeight: "600" },
  filterRow: { marginBottom: 19 },
  chip: {
    borderWidth: 1,
    borderColor: "#E1E7E3",
    borderRadius: 24,
    paddingVertical: 11,
    paddingHorizontal: 18,
    marginRight: 10,
    backgroundColor: "#FFFFFF",
  },
  chipActive: {
    backgroundColor: "#E5F4EB",
    borderColor: "#B8DCC7",
  },
  chipText: { color: "#17231D", fontWeight: "500" },
  chipTextActive: { color: GREEN, fontWeight: "700" },
  errandCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 21,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E4E9E5",
    marginBottom: 17,
    elevation: 2,
  },
  errandTop: { flexDirection: "row", alignItems: "center", gap: 11 },
  errandIcon: {
    width: 55,
    height: 55,
    borderRadius: 15,
    backgroundColor: "#E5F4EB",
    justifyContent: "center",
    alignItems: "center",
  },
  errandInfo: { flex: 1 },
  category: { color: GREEN, fontSize: 11, fontWeight: "700" },
  errandTitle: {
    fontSize: 17,
    color: "#17231D",
    fontWeight: "600",
    marginTop: 6,
  },
  fee: { color: GREEN, fontSize: 22, fontWeight: "700" },
  description: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 19,
  },
  line: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 17,
  },
  location: { flexDirection: "row", alignItems: "center", gap: 8 },
  locationText: { color: "#6B7280", fontSize: 12, flex: 1 },
  primaryButton: {
    marginTop: 19,
    backgroundColor: GREEN,
    borderRadius: 13,
    padding: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  empty: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: { color: "#17231D", fontSize: 18, fontWeight: "700" },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
    paddingBottom: 12,
  },
  navItem: { flex: 1, alignItems: "center", gap: 5 },
  navActive: { color: GREEN, fontSize: 11, fontWeight: "600" },
  navLabel: { color: "#8B9490", fontSize: 11 },
});
