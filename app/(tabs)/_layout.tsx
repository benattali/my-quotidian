import { Tabs } from 'expo-router';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { Image, ImageSourcePropType, View } from 'react-native';

import { colors } from '@/theme';

const icons = {
  today: require('../../assets/icons/sun.png') as ImageSourcePropType,
  favorites: require('../../assets/icons/heart.png') as ImageSourcePropType,
  settings: require('../../assets/icons/gear.png') as ImageSourcePropType,
};

function TabIcon({
  source,
  focused,
}: {
  source: ImageSourcePropType;
  focused: boolean;
}) {
  // Full-colour icons — dim the inactive ones instead of tinting.
  return (
    <Image
      source={source}
      resizeMode="contain"
      style={{ width: 26, height: 26, opacity: focused ? 1 : 0.5 }}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      // Draw the divider ourselves — a purple 1px top border on a wrapper —
      // because the tab bar's own borderTopColor renders white regardless.
      tabBar={(props) => (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.accent }}>
          <BottomTabBar {...props} />
        </View>
      )}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.accent, fontWeight: '800' },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        } as any,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.today} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.favorites} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.settings} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
