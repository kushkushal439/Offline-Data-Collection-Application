import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import * as Font from 'expo-font';
import Toast from 'react-native-toast-message';
import { enableScreens } from 'react-native-screens';
import { AuthProvider } from '../context/authcontext';
import { useAuth } from '../context/authcontext';

// Enable screens for better performance
enableScreens();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create a separate component for the authenticated content
function AuthenticatedLayout() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: true, animation: 'slide_from_right' }}>
      {!token ? (
        <>
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
            title: "Login"
          }}
        />
        <Stack.Screen
        name="signup"
        options={{
          headerShown: false,
          title: "Sign Up"
        }}
        />
        </>
      ) : (
        <>
          <Stack.Screen
            name="index"
            options={{
              title: "Home",
            }}
          />
          <Stack.Screen
            name="fill-forms"
            options={{
              title: "Fill Forms",
            }}
          />
          <Stack.Screen
            name="forms/sample"
            options={{
              title: "Sample form",
            }}
          />
          <Stack.Screen
            name="download-forms"
            options={{
              title: "Download Forms",
            }}
          />
          <Stack.Screen
            name="forms/view/[id]"
            options={{
              title: "View form",
            }}
          />
          <Stack.Screen
            name="sync-data"
            options={{
              title: "Sync Data",
            }}
          />
          <Stack.Screen
            name="saved-entries"
            options={{
              title: "Saved Entries",
            }}
          />
        </>
      )}
    </Stack>
  );
}

// Main layout component
export default function Layout() {
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          MaterialCommunityIcons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
        });
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      }
    }
    loadFonts();
  }, []);

  return (
    <AuthProvider>
      <PaperProvider theme={MD3LightTheme}>
        <AuthenticatedLayout />
        <Toast />
      </PaperProvider>
    </AuthProvider>
  );
}