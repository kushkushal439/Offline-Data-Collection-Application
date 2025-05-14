import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from "react-native";
import { Text, Card, useTheme, Surface, Badge } from "react-native-paper";
import { Link } from "expo-router";
import { StyleSheet } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { useAuth } from '@/context/authcontext';
import { ENDPOINTS } from '../services/api';

// Define the Form interface for TypeScript
interface Form {
  _id: string;
  FormID: number;
  title: string;
  description: string;
  date: string;
  Questions: any[];
}

export default function DownloadForms() {
  const theme = useTheme();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();

  // Fetch forms when component mounts
  useEffect(() => {
    fetchForms();
  }, []);

  // Function to fetch forms from API
  const fetchForms = async () => {
    console.log('token being used is', token)
    try {
      setLoading(true);
      // Adjust the URL to match your backend API endpoint
      const response = await axios.get(ENDPOINTS.FORMS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });      setForms(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching forms:', err);
      setError('Failed to load forms. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Adds form to local storage in "formsToFill". If it already exists, prints an error message. 
  const handleFormClick = async (form: Form) => {
    try {
      const storedForms = await AsyncStorage.getItem('formsToFill');
      const formsToFill = storedForms ? JSON.parse(storedForms) : [];
      
      // Check if the form already exists
      const formExists = formsToFill.some(storedForm => storedForm._id === form._id);
      
      if (formExists) {
        Toast.show({
          type: 'info',
          text1: 'Info',
          text2: 'Form already exists in local storage.'
        });
      } else {
        formsToFill.push(form);
        await AsyncStorage.setItem('formsToFill', JSON.stringify(formsToFill));
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Form added to local storage successfully!'
        });
      }
    } catch (error) {
      console.error('Error saving form to local storage', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save form.'
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.headerContainer}>
        <Text variant="headlineMedium" style={styles.header}>Download Forms</Text>
        <Text variant="bodyMedium" style={styles.subheader}>View and Download available forms</Text>
      </Surface>

      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading forms...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={48} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Card style={styles.retryCard} onPress={fetchForms}>
              <Card.Content>
                <Text style={styles.retryText}>Retry</Text>
              </Card.Content>
            </Card>
          </View>
        ) : forms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-outline" size={48} color="#aaa" />
            <Text style={styles.emptyText}>No forms available</Text>
          </View>
        ) : (
          forms.map((form) => (
            <Card key={form._id} style={styles.card} mode="elevated" onPress={() => handleFormClick(form)}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons 
                    name="file-download-outline" 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text variant="titleMedium" style={styles.title}>{form.title}</Text>
                  <Text variant="bodyMedium" style={styles.description}>
                    {form.description}
                  </Text>
                  <Text variant="bodyMedium" style={styles.date}>
                    {form.date}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  header: {
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  subheader: {
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    minHeight: 300,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  description: {
    color: '#666',
    marginTop: 4,
  },
  date: {
    marginTop: 8,
    alignSelf: 'flex-start',
    color: '#611',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    color: '#666',
    textAlign: 'center',
  },
  retryCard: {
    width: 120,
    alignItems: 'center',
    borderRadius: 20,
  },
  retryText: {
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: '#666',
  },
});