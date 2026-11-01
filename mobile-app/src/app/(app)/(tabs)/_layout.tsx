import { Pressable, StyleSheet } from 'react-native';
import { Tabs, router } from 'expo-router';
import Icon from '@/components/common/Icon';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.slate[400],
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
        headerStyle: styles.header,
        sceneStyle: styles.scene,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'home' : 'home-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Lịch sử',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'time' : 'time-outline'} color={color} size={size} />
          ),
          headerRight: () => (
            <Pressable onPress={() => router.push('/lookup')} hitSlop={10} style={styles.headerButton}>
              <Icon name="search" size={22} color={colors.slate[700]} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Quét QR',
          tabBarIcon: ({ color, size }) => <Icon name="qr-code-outline" color={color} size={size} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/qr');
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'person' : 'person-outline'} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.slate[50],
  },
  headerTitle: {
    fontWeight: '700',
    color: colors.slate[900],
  },
  headerButton: {
    marginRight: 16,
  },
  scene: {
    backgroundColor: colors.slate[50],
  },
});
