import { View, Pressable } from "react-native";
import { Text, Surface, useTheme } from "react-native-paper";
import { Link, router, Redirect } from "expo-router";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet } from "react-native";
import { useAuth } from '../context/authcontext';
import { useEffect } from "react";

export default function Index() {
  const theme = useTheme();
  const { token, logout } = useAuth();
  
  // Use Redirect component instead of programmatic navigation
  if (!token) {
    return <Redirect href="/login" />;
  }
  
  const menuItems = [
    {
      title: "Download New Form",
      route: "/download-forms",
      icon: "download"
    },
    {
      title: "View/Edit Saved Entries",
      route: "/saved-entries",
      icon: "file-document-edit-outline" as keyof typeof MaterialCommunityIcons.glyphMap
    },
    {
      title: "Upload Saved Entries",
      route: "/sync-data",
      icon: "file-upload-outline" as keyof typeof MaterialCommunityIcons.glyphMap
    },
    {
      title: "Fill Forms",
      route: "fill-forms",
      icon: "form-select" as keyof typeof MaterialCommunityIcons.glyphMap
    },
    {
      title: "Logout",
      icon: "logout",
      onPress: async () => {
        await logout();
        router.replace('/login');
      }
    }
  ];

  return (
    <Surface style={styles.container}>
      <Text variant="headlineLarge" style={styles.header}>Data Collection App</Text>
      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          item.route ? (
            <Link href={item.route as any} asChild key={index}>
              <Pressable>
                <Surface style={styles.menuItem} elevation={2}>
                  <MaterialCommunityIcons 
                    name={item.icon} 
                    size={40} 
                    color={theme.colors.primary} 
                  />
                  <Text variant="titleMedium" style={styles.menuText}>{item.title}</Text>
                </Surface>
              </Pressable>
            </Link>
          ) : (
            <Pressable key={index} onPress={item.onPress}>
              <Surface style={styles.menuItem} elevation={2}>
                <MaterialCommunityIcons 
                  name={item.icon} 
                  size={40} 
                  color={theme.colors.primary} 
                />
                <Text variant="titleMedium" style={styles.menuText}>{item.title}</Text>
              </Surface>
            </Pressable>
          )
        ))}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    textAlign: 'center',
    marginVertical: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
  },
  menuItem: {
    width: 150,
    height: 150,
    padding: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  menuText: {
    textAlign: 'center',
    marginTop: 12,
  }
});