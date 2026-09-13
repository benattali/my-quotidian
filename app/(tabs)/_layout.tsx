import { withLayoutContext } from 'expo-router';
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs';
import type {
  ParamListBase,
  TabNavigationState,
} from '@react-navigation/native';
import { Image, ImageSourcePropType } from 'react-native';

import { colors } from '@/theme';

const { Navigator } = createMaterialTopTabNavigator();

// Swipeable tab navigator wired into Expo Router.
const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

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
  return (
    <Image
      source={source}
      resizeMode="contain"
      style={{ width: 24, height: 24, opacity: focused ? 1 : 0.5 }}
    />
  );
}

export default function TabsLayout() {
  return (
    <MaterialTopTabs
      // Bottom tab bar, swipe left/right between screens.
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarShowIcon: true,
        tabBarPressColor: 'transparent',
        tabBarIndicatorStyle: { height: 0 },
        tabBarLabelStyle: {
          textTransform: 'none',
          fontSize: 11,
          fontWeight: '600',
          margin: 0,
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.accent,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <MaterialTopTabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.today} focused={focused} />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.favorites} focused={focused} />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.settings} focused={focused} />
          ),
        }}
      />
    </MaterialTopTabs>
  );
}
