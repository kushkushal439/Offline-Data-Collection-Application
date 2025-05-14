import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { useAuth } from '../context/authcontext';
import { ENDPOINTS } from '../services/api';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSignup = async () => {
    try {
      const response = await fetch(ENDPOINTS.SIGNUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Username: username,
          Email: email,
          Password: password,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.token) {
        await login(data.token);
        router.replace('/');
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Signup error:', error);
    }
  };

  return (
    <Surface style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
      
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      <TextInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        style={styles.input}
      />

      <Button 
        mode="contained" 
        onPress={handleSignup}
        style={styles.button}
      >
        Sign Up
      </Button>

      <View style={styles.footer}>
        <Text variant="bodyMedium">Already have an account? </Text>
        <Link href="/login" asChild>
          <Button mode="text">Login</Button>
        </Link>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  }
});