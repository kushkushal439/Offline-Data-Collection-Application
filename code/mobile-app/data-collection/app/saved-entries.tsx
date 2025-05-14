import { View, ScrollView, StyleSheet } from "react-native";
import { Text, Card, useTheme, Surface } from "react-native-paper";
import { useState, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function ViewSavedEntries() {
    const theme = useTheme();
    const navigation = useNavigation();
    const [savedEntries, setSavedEntries] = useState([]);

    useEffect(() => {
        loadSavedEntries();
    }, []);

    const loadSavedEntries = async () => {
        try {
            const formSubmissions = await AsyncStorage.getItem('formSubmissions');
            const forms = await AsyncStorage.getItem('formsToFill');

            if (formSubmissions && forms) {
                const submissions = JSON.parse(formSubmissions);
                const availableForms = JSON.parse(forms);

                // Merge form details with submissions
                const entriesWithDetails = submissions.map(submission => {
                    const formDetails = availableForms.find(form => form.FormID === submission.FormID);
                    return {
                        ...submission,
                        formTitle: formDetails?.title || 'Unknown Form',
                        totalQuestions: formDetails?.Questions?.length || 0,
                        questions: formDetails?.Questions || []
                    };
                });

                setSavedEntries(entriesWithDetails);
            }
        } catch (error) {
            console.error('Error loading saved entries:', error);
        }
    };

    const handleContinueForm = (entry) => {
        // Find the original form data
        const formData = {
            FormID: entry.FormID,
            title: entry.formTitle,
            Questions: entry.questions,
            savedAnswers: entry.answers,
            prevquestions: entry.prevquestions,
            lastQuestionAnswered: entry.lastQuestionAnswered,
            submissionId: entry.submissionId,
        };
        console.log(`Resuming form with submissionID: ${entry.submissionId}`);
        navigation.navigate('form', { questionData: formData });
    };

    return (
        <ScrollView style={styles.container}>
            <Surface style={styles.headerContainer}>
                <Text variant="headlineMedium" style={styles.header}>Saved Entries</Text>
                <Text variant="bodyMedium" style={styles.subheader}>
                    View and continue your saved form submissions
                </Text>
            </Surface>

            <View style={styles.listContainer}>
                {savedEntries.map((entry, index) => (
                    <Card
                        key={index}
                        style={styles.card}
                        mode="elevated"
                        onPress={() => handleContinueForm(entry)}
                    >
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons
                                    name={entry.isComplete ? "check-circle-outline" : "progress-clock"}
                                    size={24}
                                    color={entry.isComplete ? theme.colors.primary : theme.colors.warning}
                                />
                            </View>
                            <View style={styles.textContainer}>
                                <Text variant="titleMedium" style={styles.title}>
                                    {entry.formTitle}
                                </Text>
                                <Text variant="bodyMedium" style={styles.description}>
                                    Status: {entry.isComplete ? 'Complete' : 'Incomplete'}
                                </Text>
                                <Text variant="bodyMedium" style={styles.description}>
                                    Last modified: {new Date(entry.timestamp).toLocaleString()}
                                </Text>
                                <Text variant="bodyMedium" style={[styles.description, styles.progress]}>
                                    Progress: {Object.keys(entry.answers).length} / {entry.totalQuestions} questions
                                </Text>
                            </View>
                            <MaterialCommunityIcons
                                name="chevron-right"
                                size={24}
                                color={theme.colors.primary}
                            />
                        </Card.Content>
                    </Card>
                ))}

                {savedEntries.length === 0 && (
                    <Text style={styles.emptyText}>No saved entries found</Text>
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
    progress: {
        color: '#1976d2',
        marginTop: 8,
        fontWeight: '500',
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 32,
        fontSize: 16,
    }
});