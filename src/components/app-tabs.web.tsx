import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";

export default function AppTabs() {
    return (
        <Tabs>
            <TabSlot style={{ flex: 1 }} />
            <TabList>
                <TabTrigger name="index" href="/">
                    Home
                </TabTrigger>
                <TabTrigger name="explore" href="/explore">
                    Explore
                </TabTrigger>
                <TabTrigger name="account" href="/account">
                    Account
                </TabTrigger>
            </TabList>
        </Tabs>
    );
}
