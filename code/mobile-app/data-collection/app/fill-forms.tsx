import { View, ScrollView, TouchableOpacity} from "react-native";
import { Text, Card, useTheme, Surface, Badge, Button } from "react-native-paper";
import { Link } from "expo-router";
import { StyleSheet } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';

export default function FillForms() {
  const [formsToFill, setFormsToFill] = useState([]);
  const navigation = useNavigation();
  const theme = useTheme();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const storedForms = await AsyncStorage.getItem('formsToFill');
        if (storedForms) {
          setFormsToFill(JSON.parse(storedForms));
        }
      } catch (error) {
        console.error('Error fetching forms from local storage', error);
      }
    };

    fetchForms();
  }, []);

  
  const handleFormSelect = (form) => {
    console.log('Form selected', form);
    navigation.navigate('form', { questionData: form });
  };


  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      setFormsToFill([]);
      console.log('AsyncStorage cleared');
    } catch (error) {
      console.error('Error clearing AsyncStorage', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.headerContainer}>
        <Text variant="headlineMedium" style={styles.header}>Fill Forms</Text>
        <Text variant="bodyMedium" style={styles.subheader}>Select a form to fill</Text>
      </Surface>

      <View style={styles.listContainer}>
        {formsToFill.map((form) => (
          <TouchableOpacity key={form.FormID} onPress={() => handleFormSelect(form)} style={styles.formItem}>
            <Card style={styles.card} mode="elevated">
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons 
                    name="file-document-outline" 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text variant="titleMedium" style={styles.title}>{form.title}</Text>
                  <Text variant="bodyMedium" style={styles.description}>
                    {form.description}
                  </Text>
                </View>
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={24} 
                  color={theme.colors.primary} 
                />
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
        <Button
                  mode="contained"
                  onPress={clearStorage}
                  // style={styles.uploadButton}
                  buttonColor={theme.colors.primary}
                  // disabled={uploadStatus === 'Syncing...'}
                >
                  Clear Storage
                </Button>
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
      padding: 26,
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
    button : {
      borderRadius: 8,
    }
  });