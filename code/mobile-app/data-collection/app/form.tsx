import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, ScrollView, StyleSheet, Platform, TouchableWithoutFeedback, 
  KeyboardAvoidingView, Keyboard, SafeAreaView, Alert, TouchableOpacity
} from 'react-native';
import { Text, Button, TextInput, Surface, RadioButton } from 'react-native-paper';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { StackNavigationProp } from '@react-navigation/stack';
import audioRecordingService from '../services/audioRecording';

// import questionData from './sample.json'

type RootStackParamList = {
  [key: string]: any;
};

export default function SurveyPage() {
    const route = useRoute();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { questionData } = route.params as { questionData: any };
    const questions = questionData.Questions;
    console.log('qD:', questionData);
    
    // Initialize with saved answers if they exist
    const [answers, setAnswers] = useState(questionData.savedAnswers || {});
    
    // Start from the last answered question if continuing a saved form
    const [currentQuestion, setCurrentQuestion] = useState(
        questionData.lastQuestionAnswered !== undefined 
            ? questionData.lastQuestionAnswered 
            : 0
    );
    
    // Initialize questions history based on current question
    const [questionsSoFar, setQuestionsSoFar] = useState(questionData.prevquestions || []);
    
    const [showExitDialog, setShowExitDialog] = useState(false);
    
    // Audio recording states
    const [isRecording, setIsRecording] = useState(false);
    const [recordingStarted, setRecordingStarted] = useState(false);
    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [recordingTimeElapsed, setRecordingTimeElapsed] = useState(0);
    const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
    const [submissionId, setSubmissionId] = useState(() => {
        // If this is a resumed form, use the original submissionId
        console.log('submissionId:', questionData.submissionId);
        if (questionData.submissionId) {
            return questionData.submissionId;
        }
        console.log('Creating new submissionId');
        // Otherwise create a new one
        return `submission_${Date.now()}`;
    });

    // Add this useEffect to log the submission ID for debugging
    useEffect(() => {
        console.log(`Form using submissionId: ${submissionId}`);
    }, [submissionId]);

    // Ask if user wants to record audio when form opens
    useEffect(() => {
        if (!recordingStarted) {
            Alert.alert(
                "Audio Recording",
                "Would you like to record audio while filling this form?",
                [
                    {
                        text: "No",
                        style: "cancel"
                    },
                    { 
                        text: "Yes", 
                        onPress: startRecording 
                    }
                ]
            );
            setRecordingStarted(true);
        }
        
        return () => {
            // Clean up when component unmounts
            if (isRecording) {
                stopRecording();
            }
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        };
    }, []);

    const startRecording = async () => {
        const success = await audioRecordingService.startRecording(questionData.FormID, submissionId);
        if (success) {
            setIsRecording(true);
            
            // Start a timer to show recording duration
            const interval = setInterval(() => {
                setRecordingTimeElapsed(prev => prev + 1);
            }, 1000);
            
            setTimerInterval(interval);
        }
    };

    const stopRecording = async () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
        }
        
        const uri = await audioRecordingService.stopRecording();
        if (uri) {
            setAudioUri(uri);
            setIsRecording(false);
            return uri;
        }
        return null;
    };

    const toggleRecording = async () => {
        if (isRecording) {
            await stopRecording();
        } else {
            await startRecording();
        }
    };

    const playRecording = async () => {
        if (audioUri) {
            await audioRecordingService.playRecording(audioUri);
        }
    };

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                setShowExitDialog(true);
                return true;
            };

            navigation.setOptions({
                headerBackVisible: false,
                headerLeft: () => (
                    <Button
                        onPress={onBackPress}
                        mode="text"
                        icon="arrow-left"
                    >
                        Back
                    </Button>
                ),
            });

            return () => {
                navigation.setOptions({
                    headerLeft: undefined,
                    headerBackVisible: true,
                });
            };
        }, [navigation, setShowExitDialog])
    );

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const findNextValidQuestion = (currentIndex) => {

        if ('*' in questions[currentIndex].GoTo) {
            return questions[currentIndex].GoTo["*"];
        }

        // If question is not required, we can always go to next question
        if (!questions[currentIndex].required) {
            return currentIndex + 1;
        }

        // For required questions, check the answer and GoTo logic
        if (answers[currentIndex]) {
            if (questions[currentIndex].GoTo.length == 0) {
                return currentIndex + 1;
            }
            else {
                if ("*" in questions[currentIndex].GoTo) {
                    return questions[currentIndex].GoTo["*"];
                }
                if (answers[currentIndex] in questions[currentIndex].GoTo) {
                    return questions[currentIndex].GoTo[answers[currentIndex]];
                }
                else {
                    return currentIndex + 1;
                }
            }
        }
        return -1;
    };

    const handleNext = () => {
        console.log(questions);
        console.log(answers)
        const nextQuestionIndex = findNextValidQuestion(currentQuestion);
        if (nextQuestionIndex !== -1) {
            setQuestionsSoFar([...questionsSoFar, currentQuestion]);
            setCurrentQuestion(nextQuestionIndex);
        }
    };

    const handleBack = () => {
        if (currentQuestion === 0) {
            setShowExitDialog(true);
        } else if (questionsSoFar.length > 0) {

            const { [currentQuestion]: removed, ...remainingAnswers } = answers;
            setAnswers(remainingAnswers);

            const previousQuestion = questionsSoFar[questionsSoFar.length - 1];
            setCurrentQuestion(previousQuestion);
            setQuestionsSoFar(questionsSoFar.slice(0, -1));
        }
    };

    const handleAnswerChange = (value) => {
        if (questions[currentQuestion].type === "checkbox") {
            // For checkbox, toggle the selected option in the array
            const currentAnswers = answers[currentQuestion] || [];
            const newAnswers = currentAnswers.includes(value)
                ? currentAnswers.filter(item => item !== value)
                : [...currentAnswers, value];
            
            setAnswers({
                ...answers,
                [currentQuestion]: newAnswers
            });
        } else {
            // Original behavior for other input types
            setAnswers({
                ...answers,
                [currentQuestion]: value
            });
        }
    };

    const handleSubmit = async () => {
        try {
            // Stop recording if it's still going
            let finalAudioUri = audioUri;
            if (isRecording) {
                finalAudioUri = await stopRecording();
            }

            const existingData = await AsyncStorage.getItem('formSubmissions');
            const submissions = existingData ? JSON.parse(existingData) : [];
            
            // Check if this is an update to an existing submission
            const submissionIndex = submissions.findIndex(
                sub => sub.FormID === questionData.FormID && 
                JSON.stringify(sub.answers) === JSON.stringify(questionData.savedAnswers)
            );

            const newSubmission = {
                answers,
                timestamp: new Date().toISOString(),
                FormID: questionData.FormID,
                isComplete: true,
                prevquestions: questionsSoFar,
                lastQuestionAnswered: questions.length - 1,
                submissionId: submissionId, // Add submission ID
                audioRecording: finalAudioUri // Add audio URI
            };
            
            if (submissionIndex !== -1) {
                // Update existing submission
                submissions[submissionIndex] = newSubmission;
            } else {
                // Add new submission
                submissions.push(newSubmission);
            }
            
            await AsyncStorage.setItem('formSubmissions', JSON.stringify(submissions));
            
            // Store audio file reference separately for better tracking
            if (finalAudioUri) {
                const existingMediaData = await AsyncStorage.getItem('mediaFiles');
                const mediaFiles = existingMediaData ? JSON.parse(existingMediaData) : [];
                
                mediaFiles.push({
                    uri: finalAudioUri,
                    formId: questionData.FormID,
                    submissionId: submissionId,
                    type: 'audio',
                    questionId: 'full_recording', // Not tied to a specific question
                    synced: false,
                    timestamp: new Date().toISOString()
                });
                
                await AsyncStorage.setItem('mediaFiles', JSON.stringify(mediaFiles));
            }
            
            alert('Form submitted successfully!');
            navigation.goBack();
        } catch (error) {
            console.error('Error saving form:', error);
            alert('Failed to save form submission');
        }
    };

    const savePartialSubmission = async () => {
        try {
            // Stop recording if it's still going
            let finalAudioUri = audioUri;
            if (isRecording) {
                finalAudioUri = await stopRecording();
            }
            
            const existingData = await AsyncStorage.getItem('formSubmissions');
            const submissions = existingData ? JSON.parse(existingData) : [];
            
            // Check if this is an update to an existing submission
            const submissionIndex = submissions.findIndex(
                sub => sub.FormID === questionData.FormID && 
                JSON.stringify(sub.answers) === JSON.stringify(questionData.savedAnswers)
            );
            
            const partialSubmission = {
                answers,
                timestamp: new Date().toISOString(),
                FormID: questionData.FormID,
                isComplete: false,
                prevquestions: questionsSoFar,
                lastQuestionAnswered: currentQuestion,
                submissionId: submissionId, // Add submission ID
                audioRecording: finalAudioUri // Add audio URI
            };
            
            if (submissionIndex !== -1) {
                // Update existing submission
                submissions[submissionIndex] = partialSubmission;
            } else {
                // Add new submission
                submissions.push(partialSubmission);
            }
            
            await AsyncStorage.setItem('formSubmissions', JSON.stringify(submissions));
            
            // Store audio file reference with a part number
            if (finalAudioUri) {
                const existingMediaData = await AsyncStorage.getItem('mediaFiles');
                const mediaFiles = existingMediaData ? JSON.parse(existingMediaData) : [];
                
                // Get the count of recordings for this submission to create a part number
                const existingPartsCount = mediaFiles.filter(
                    file => file.submissionId === submissionId && file.type === 'audio'
                ).length;
                
                mediaFiles.push({
                    uri: finalAudioUri,
                    formId: questionData.FormID,
                    submissionId: submissionId,
                    type: 'audio',
                    questionId: 'recording_part_' + (existingPartsCount + 1), // Add part number
                    synced: false,
                    timestamp: new Date().toISOString(),
                    partNumber: existingPartsCount + 1 // Track which part this is
                });
                
                await AsyncStorage.setItem('mediaFiles', JSON.stringify(mediaFiles));
            }
            
            alert('Progress saved');
            navigation.goBack();
        } catch (error) {
            console.error('Error saving partial progress:', error);
            alert('Failed to save progress');
        }
    };

    const renderInput = () => {
        const question = questions[currentQuestion];
        if (question.type === "text") {
            return (
                <TextInput
                    value={answers[currentQuestion] || ''}
                    onChangeText={handleAnswerChange}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="default"
                />
            );
        }
        if (question.type === "integer") {
            return (
                <View>
                    <TextInput
                        value={answers[currentQuestion] || ''}
                        onChangeText={handleAnswerChange}
                        mode="outlined"
                        style={styles.input}
                        keyboardType="numeric"
                        error={answers[currentQuestion] && !isValidInteger(answers[currentQuestion])}
                    />
                    {answers[currentQuestion] && !isValidInteger(answers[currentQuestion]) && (
                        <Text style={styles.errorText}>Please enter a valid integer number</Text>
                    )}
                </View>
            );
        }
        if (question.type === "decimal") {
            return (
                <View>
                    <TextInput
                        value={answers[currentQuestion] || ''}
                        onChangeText={handleAnswerChange}
                        mode="outlined"
                        style={styles.input}
                        keyboardType="decimal-pad"
                        error={answers[currentQuestion] && !isValidDecimal(answers[currentQuestion])}
                    />
                    {answers[currentQuestion] && !isValidDecimal(answers[currentQuestion]) && (
                        <Text style={styles.errorText}>Please enter a valid decimal number</Text>
                    )}
                </View>
            );
        }
        if (question.type === "phone") {
            return (
                <View>
                    <TextInput
                        value={answers[currentQuestion] || ''}
                        onChangeText={handleAnswerChange}
                        mode="outlined"
                        style={styles.input}
                        keyboardType="phone-pad"
                        maxLength={10}
                        error={answers[currentQuestion] && (!/^\d{10}$/.test(answers[currentQuestion]))}
                    />
                    {answers[currentQuestion] && !/^\d{10}$/.test(answers[currentQuestion]) && (
                        <Text style={styles.errorText}>Please enter a valid 10-digit phone number</Text>
                    )}
                </View>
            );
        }
        if (question.type === "email") {
            return (
                <View>
                    <TextInput
                        value={answers[currentQuestion] || ''}
                        onChangeText={handleAnswerChange}
                        mode="outlined"
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={answers[currentQuestion] && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers[currentQuestion]))}
                    />
                    {answers[currentQuestion] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers[currentQuestion]) && (
                        <Text style={styles.errorText}>Please enter a valid email address</Text>
                    )}
                </View>
            );
        }
        if (question.type === "date") {
            return (
                <View>
                    <TextInput
                        value={answers[currentQuestion] || ''}
                        onChangeText={handleAnswerChange}
                        mode="outlined"
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        error={answers[currentQuestion] && !isValidDate(answers[currentQuestion])}
                    />
                    {answers[currentQuestion] && !isValidDate(answers[currentQuestion]) && (
                        <Text style={styles.errorText}>Please enter a valid date in YYYY-MM-DD format</Text>
                    )}
                </View>
            );
        }
        if (question.type === "mcq") {
            return (
                <RadioButton.Group
                    onValueChange={handleAnswerChange}
                    value={answers[currentQuestion] || ''}
                >
                    {question.options.map((option) => (
                        <View key={option} style={styles.radioItem}>
                            <RadioButton value={option} />
                            <Text>{option}</Text>
                        </View>
                    ))}
                </RadioButton.Group>
            );
        }
        if (question.type === "checkbox") {
            const selectedOptions = answers[currentQuestion] || [];
            return (
                <View>
                    {question.options.map((option) => (
                        <TouchableWithoutFeedback 
                            key={option}
                            onPress={() => handleAnswerChange(option)}
                        >
                            <View style={styles.checkboxItem}>
                                <View style={[
                                    styles.checkbox,
                                    selectedOptions.includes(option) && styles.checkboxSelected
                                ]}>
                                    {selectedOptions.includes(option) && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </View>
                                <Text style={styles.checkboxLabel}>{option}</Text>
                            </View>
                        </TouchableWithoutFeedback>
                    ))}
                </View>
            );
        }
        if (question.type === "range") {
            const minValue = question.minValue || 0;
            const maxValue = question.maxValue || 10;
            const step = 1;
            
            return (
                <View style={styles.ratingContainer}>
                    <View style={styles.ratingLabels}>
                        <Text>{minValue}</Text>
                        <Text>{maxValue}</Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={minValue}
                        maximumValue={maxValue}
                        step={step}
                        value={Number(answers[currentQuestion]) || minValue}
                        onValueChange={handleAnswerChange}
                        minimumTrackTintColor="#6200ee"
                        maximumTrackTintColor="#000000"
                        thumbTintColor="#6200ee"
                    />
                    <Text style={styles.ratingValue}>
                        Selected value: {answers[currentQuestion] || minValue}
                    </Text>
                </View>
            );
        }
    };

    const isValidDate = (dateString: string) => {
        // Check format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
        
        // Check if it's a valid date
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return false;
        
        // Check if the date matches the input (handles invalid dates like 2024-02-31)
        const [year, month, day] = dateString.split('-').map(Number);
        return date.getFullYear() === year &&
               date.getMonth() + 1 === month &&
               date.getDate() === day;
    };

    const isValidInteger = (value: string) => {
        // Check if it's a valid integer (no decimals)
        return /^-?\d+$/.test(value);
    };

    const isValidDecimal = (value: string) => {
        // Check if it's a valid decimal number
        // Allows numbers like: 123, -123, 123.45, -123.45
        return /^-?\d*\.?\d+$/.test(value);
    };

    const isCurrentAnswerValid = () => {
        const question = questions[currentQuestion];

        // if the answer for this question is empty, return true
        if (!answers[currentQuestion]) {
            return true;
        }

        if (question.type === "integer") {
            return answers[currentQuestion] && isValidInteger(answers[currentQuestion]);
        }
        if (question.type === "decimal") {
            return answers[currentQuestion] && isValidDecimal(answers[currentQuestion]);
        }
        if (question.type === "phone") {
            return answers[currentQuestion] && /^\d{10}$/.test(answers[currentQuestion]);
        }
        if (question.type === "email") {
            return answers[currentQuestion] && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers[currentQuestion]);
        }
        if (question.type === "date") {
            return answers[currentQuestion] && isValidDate(answers[currentQuestion]);
        }
        if (question.type === "checkbox") {
            // If required, at least one option should be selected
            return !question.required || (answers[currentQuestion] && answers[currentQuestion].length > 0);
        }
        return true;
    };

    const ContentWrapper = Platform.OS === 'web' ? View : KeyboardAvoidingView;

    return (
        <SafeAreaView style={styles.container}>
            <ContentWrapper 
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.content}
            >
                {Platform.OS === 'web' ? (
                    <ScrollView 
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Surface style={styles.card}>
                            <Text style={styles.questionNumber}>Question {currentQuestion + 1} of {questions.length}</Text>
                            <Text style={styles.question}>{questions[currentQuestion].text}</Text>
                            {renderInput()}
                        </Surface>

                        {/* Audio Recording UI */}
                        <Surface style={styles.recordingCard}>
                            <View style={styles.recordingContainer}>
                                <View style={styles.recordingStatus}>
                                    {isRecording ? (
                                        <View style={styles.recordingIndicator}>
                                            <MaterialCommunityIcons name="record-circle" size={24} color="red" />
                                            <Text style={styles.recordingTime}>
                                                Recording: {formatTime(recordingTimeElapsed)}
                                            </Text>
                                        </View>
                                    ) : audioUri ? (
                                        <Text>Recording saved ({formatTime(recordingTimeElapsed)})</Text>
                                    ) : recordingStarted ? (
                                        <Text>Recording paused</Text>
                                    ) : null}
                                </View>

                                <View style={styles.recordingControls}>
                                    {/* Record/Pause button */}
                                    <TouchableOpacity 
                                        style={styles.recordButton} 
                                        onPress={toggleRecording}
                                    >
                                        <MaterialCommunityIcons 
                                            name={isRecording ? "pause" : "record"} 
                                            size={32} 
                                            color={isRecording ? "#ff4136" : "#2ecc40"} 
                                        />
                                    </TouchableOpacity>

                                    {/* Play button (only if we have a recording) */}
                                    {audioUri && !isRecording && (
                                        <TouchableOpacity 
                                            style={styles.playButton} 
                                            onPress={playRecording}
                                        >
                                            <MaterialCommunityIcons name="play" size={32} color="#0074D9" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </Surface>

                        <View style={styles.buttonContainer}>
                            <Button
                                mode={currentQuestion === 0 ? "outlined" : "contained"}
                                onPress={handleBack}
                                style={styles.button}
                                disabled={currentQuestion === 0}
                            >
                                {currentQuestion === 0 ? "Exit" : "Previous"}
                            </Button>

                            {currentQuestion < questions.length - 1 ? (
                                <Button
                                    mode="contained"
                                    onPress={handleNext}
                                    style={styles.button}
                                    disabled={questions[currentQuestion].required && 
                                            (!answers[currentQuestion] || !isCurrentAnswerValid())}
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    mode="contained"
                                    onPress={handleSubmit}
                                    style={styles.button}
                                    disabled={questions[currentQuestion].required && 
                                            (!answers[currentQuestion] || !isCurrentAnswerValid())}
                                >
                                    Submit
                                </Button>
                            )}
                        </View>
                    </ScrollView>
                ) : (
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView 
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Surface style={styles.card}>
                                <Text style={styles.questionNumber}>Question {currentQuestion + 1} of {questions.length}</Text>
                                <Text style={styles.question}>{questions[currentQuestion].text}</Text>
                                {renderInput()}
                            </Surface>

                            {/* Audio Recording UI */}
                            <Surface style={styles.recordingCard}>
                                <View style={styles.recordingContainer}>
                                    <View style={styles.recordingStatus}>
                                        {isRecording ? (
                                            <View style={styles.recordingIndicator}>
                                                <MaterialCommunityIcons name="record-circle" size={24} color="red" />
                                                <Text style={styles.recordingTime}>
                                                    Recording: {formatTime(recordingTimeElapsed)}
                                                </Text>
                                            </View>
                                        ) : audioUri ? (
                                            <Text>Recording saved ({formatTime(recordingTimeElapsed)})</Text>
                                        ) : recordingStarted ? (
                                            <Text>Recording paused</Text>
                                        ) : null}
                                    </View>

                                    <View style={styles.recordingControls}>
                                        {/* Record/Pause button */}
                                        <TouchableOpacity 
                                            style={styles.recordButton} 
                                            onPress={toggleRecording}
                                        >
                                            <MaterialCommunityIcons 
                                                name={isRecording ? "pause" : "record"} 
                                                size={32} 
                                                color={isRecording ? "#ff4136" : "#2ecc40"} 
                                            />
                                        </TouchableOpacity>

                                        {/* Play button (only if we have a recording) */}
                                        {audioUri && !isRecording && (
                                            <TouchableOpacity 
                                                style={styles.playButton} 
                                                onPress={playRecording}
                                            >
                                                <MaterialCommunityIcons name="play" size={32} color="#0074D9" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </Surface>

                            <View style={styles.buttonContainer}>
                                <Button
                                    mode={currentQuestion === 0 ? "outlined" : "contained"}
                                    onPress={handleBack}
                                    style={styles.button}
                                    disabled={currentQuestion === 0}
                                >
                                    {currentQuestion === 0 ? "Exit" : "Previous"}
                                </Button>

                                {currentQuestion < questions.length - 1 ? (
                                    <Button
                                        mode="contained"
                                        onPress={handleNext}
                                        style={styles.button}
                                        disabled={questions[currentQuestion].required && 
                                                (!answers[currentQuestion] || !isCurrentAnswerValid())}
                                    >
                                        Next
                                    </Button>
                                ) : (
                                    <Button
                                        mode="contained"
                                        onPress={handleSubmit}
                                        style={styles.button}
                                        disabled={questions[currentQuestion].required && 
                                                (!answers[currentQuestion] || !isCurrentAnswerValid())}
                                    >
                                        Submit
                                    </Button>
                                )}
                            </View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                )}
            </ContentWrapper>
            {showExitDialog && (
                <View style={styles.dialogOverlay}>
                    <Surface style={styles.dialog}>
                        <Text style={styles.dialogTitle}>Save Progress?</Text>
                        <Text style={styles.dialogText}>
                            Would you like to save your progress before exiting?
                        </Text>
                        <View style={styles.dialogButtons}>
                            <Button mode="outlined" onPress={() => {
                                setShowExitDialog(false);
                                navigation.goBack();
                            }}>
                                Don't Save
                            </Button>
                            <Button 
                                mode="contained" 
                                onPress={() => {
                                    savePartialSubmission();
                                    setShowExitDialog(false);
                                }}
                            >
                                Save
                            </Button>
                        </View>
                    </Surface>
                </View>
            )}
        </SafeAreaView>
    );
}

// Update the styles to include new recording-related styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        ...(Platform.OS === 'web' ? {
            maxWidth: '90%', // Changed from 800 to 90%
            width: '100%',
            marginHorizontal: 'auto',
            height: '100vh',
            minWidth: 320, // Added minimum width
            // maxWidth: 1200, // Added maximum width
        } : {})
    },
    content: {
        flex: 1,
        ...(Platform.OS === 'web' ? {
            overflow: 'auto'
        } : {})
    },
    scrollContent: {
        flexGrow: 1,
        padding: Platform.OS === 'web' ? 24 : 16,
        justifyContent: 'space-between',
        minHeight: Platform.OS === 'web' ? '100vh' : 'auto'
    },
    card: {
        padding: 24,
        borderRadius: 12,
        backgroundColor: 'white',
        marginVertical: 24,
        width: '100%', // Added width
        ...(Platform.OS === 'web' ? {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            cursor: 'default',
            minWidth: 300, // Added minimum width
        } : {})
    },
    questionNumber: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    question: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    input: {
        marginTop: 16,
    },
    radioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 'auto',
        paddingVertical: 16,
    },
    button: {
        width: '45%',
        borderRadius: 8,
        ...(Platform.OS === 'web' ? {
            cursor: 'pointer'
        } : {})
    },
    dialogOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    dialog: {
        padding: 20,
        borderRadius: 8,
        backgroundColor: 'white',
        width: '80%',
        maxWidth: 400,
    },
    dialogTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    dialogText: {
        fontSize: 16,
        marginBottom: 20,
    },
    dialogButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    errorText: {
        color: '#B00020',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    checkboxItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
        paddingVertical: 4,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#6200ee',
        borderRadius: 4,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#6200ee',
    },
    checkmark: {
        color: 'white',
        fontSize: 16,
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#333',
    },
    ratingContainer: {
        marginTop: 16,
        width: '100%',
    },
    ratingLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    ratingValue: {
        textAlign: 'center',
        marginTop: 8,
        fontSize: 16,
        color: '#666',
    },
    // New styles for audio recording
    recordingCard: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'white',
        marginBottom: 16,
    },
    recordingContainer: {
        alignItems: 'center',
    },
    recordingStatus: {
        marginBottom: 10,
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recordingTime: {
        marginLeft: 8,
        color: 'red',
        fontWeight: 'bold',
    },
    recordingControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    recordButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
});