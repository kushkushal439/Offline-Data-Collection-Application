import { View, ScrollView, StyleSheet } from "react-native";
import { Text, Card, Button, useTheme, Surface, Divider } from "react-native-paper";
import { useState, useEffect } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../context/authcontext';
import { ENDPOINTS } from "../services/api";

const SYNC_ENTRIES_URL = ENDPOINTS.SYNC_ENTRIES;
const SYNC_MEDIA_URL = ENDPOINTS.SYNC_MEDIA;

export default function FormEntriesDashboard() {
  const theme = useTheme();
  const { token } = useAuth();
  const [uploadStatus, setUploadStatus] = useState("");
  const [mediaUploadStatus, setMediaUploadStatus] = useState("");
  const [entries, setEntries] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [formDetails, setFormDetails] = useState({});

  useEffect(() => {
    loadCompletedEntries();
    loadMediaFiles();
  }, []);

  const loadCompletedEntries = async () => {
    try {
      // Load form submissions and form details
      const submissionsData = await AsyncStorage.getItem("formSubmissions");
      const formsData = await AsyncStorage.getItem("formsToFill");

      if (submissionsData && formsData) {
        const submissions = JSON.parse(submissionsData);
        const forms = JSON.parse(formsData);
        console.log("Forms", forms);
        console.log("Submissions", submissions);
        // Create a map of form details for quick lookup
        const formMap = forms.reduce((acc, form) => {
          acc[form.FormID] = form;
          return acc;
        }, {});

        setFormDetails(formMap);

        // Filter only completed submissions
        let uniqueIdCounter = 0;
        console.log(submissions);
        const completedEntries = submissions
          .filter((submission) => submission.isComplete === true)
          .map((submission) => ({
            id: uniqueIdCounter++,
            FormID: submission.FormID,
            formName: formMap[submission.FormID]?.title || "Unknown Form",
            submissionDate: new Date(submission.timestamp).toLocaleDateString(),
            submissionTime: new Date(submission.timestamp).toLocaleTimeString(),
            status: "Pending Sync",
            answers: submission.answers,
            submissionId: submission.submissionId
          }));
        setEntries(completedEntries);
      }
    } catch (error) {
      console.error("Error loading completed entries:", error);
    }
  };

  const loadMediaFiles = async () => {
    try {
      const mediaData = await AsyncStorage.getItem("mediaFiles");
      if (mediaData) {
        const media = JSON.parse(mediaData);
        setMediaFiles(media.filter(file => !file.synced));
      }
    } catch (error) {
      console.error("Error loading media files:", error);
    }
  };

  // Enhanced syncFormEntries function
  const syncFormEntries = async () => {
    try {
        setUploadStatus("Syncing...");
        // Load form submissions
        const storedEntries = await AsyncStorage.getItem("formSubmissions");
        const formSubmissions = storedEntries ? JSON.parse(storedEntries) : [];

        // 'entries' state variable contains forms to sync
        const transformedEntries = entries
            .filter((entry) => entry.status === "Pending Sync")
            .map((entry) => ({
                FormID: entry.FormID,
                submissionDate: entry.submissionDate,
                submissionTime: entry.submissionTime,
                answers: entry.answers,
                localTimestamp: new Date().toISOString(),
                submissionId: entry.submissionId
            }));

        // No entries to sync
        if (transformedEntries.length === 0) {
            setUploadStatus("No entries left to sync");
            return;
        }

        // Make API request
        console.log('data token', token);
        const response = await axios.post(SYNC_ENTRIES_URL, transformedEntries, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 200 || response.status === 201) {
            console.log("Creating response ID mapping for media files");
            
            // Create a mapping of submission IDs to use for media uploads
            const responseIdMapping = {};
            
            // Add each synced form submission to the mapping
            entries
                .filter(entry => entry.status === "Pending Sync")
                .forEach(entry => {
                    responseIdMapping[entry.submissionId] = entry.submissionId;
                    console.log(`Mapped ${entry.submissionId} to itself`);
                });
            
            // Save this mapping to storage for media uploads
            console.log("Saving response ID mapping:", responseIdMapping);
            await AsyncStorage.setItem('responseIdMapping', JSON.stringify(responseIdMapping));
            
            // Remove synced entries from local storage
            const remainingEntries = formSubmissions.filter(
                (entry) => !entry.isComplete
            );

            // Update local storage
            await AsyncStorage.setItem(
                "formSubmissions",
                JSON.stringify(remainingEntries)
            );
            
            // Update status to show entries.status changed to success
            setEntries(entries.map((entry) => ({ ...entry, status: "Synced" })));
            setUploadStatus(`Synced ${response.data.count} entries successfully`);
        } else {
            throw new Error(`Server responded with status: ${response.status} : ${response.statusText}`);
        }
    } catch (error) {
        console.error("Sync failed:", error);
        setUploadStatus(`Error: ${error.message || "Network Error"}`);
    }
};

  const syncMediaFiles = async () => {
    console.log('⭐ Starting syncMediaFiles function');
    try {
        if (mediaFiles.length === 0) {
            console.log('❌ No media files to sync');
            setMediaUploadStatus("No media files to sync");
            return;
        }
        
        console.log(`📁 Found ${mediaFiles.length} media files to sync`);
        setMediaUploadStatus("Syncing media files...");
        
        // Get the response ID mapping from AsyncStorage
        const mappingData = await AsyncStorage.getItem('responseIdMapping');
        if (!mappingData) {
            console.log('❌ No response mapping data found');
            setMediaUploadStatus("Error: Please sync form data first");
            return;
        }
        
        const responseIdMapping = JSON.parse(mappingData);
        console.log('🔄 Response ID mapping:', responseIdMapping);
        
        // Create a deep copy of the files to avoid modifying the original array during iteration
        const mediaFilesCopy = JSON.parse(JSON.stringify(mediaFiles));
        console.log(`📋 Created copy of ${mediaFilesCopy.length} media files`);
        
        // Group files by submissionId for better tracking
        const filesBySubmission = {};
        mediaFilesCopy.forEach(file => {
            if (!filesBySubmission[file.submissionId]) {
                filesBySubmission[file.submissionId] = [];
            }
            filesBySubmission[file.submissionId].push(file);
        });
        
        console.log(`🗂️ Grouped files by submission: ${Object.keys(filesBySubmission).length} submissions found`);
        Object.keys(filesBySubmission).forEach(subId => {
            console.log(`- Submission ${subId}: ${filesBySubmission[subId].length} files`);
        });
        
        // Count to track progress
        let uploadedCount = 0;
        let failedCount = 0;
        let totalFileCount = mediaFilesCopy.length;
        // Track which files were successfully synced
        const syncedFileUris = new Set();
        
        // Process each submission's files
        for (const submissionId in filesBySubmission) {
            console.log(`🔄 Processing submission: ${submissionId}`);
            const files = filesBySubmission[submissionId];
            const responseId = responseIdMapping[submissionId];
            
            if (!responseId) {
                console.log(`❌ No response ID found for submission: ${submissionId}`);
                failedCount += files.length;
                continue;
            }
            
            console.log(`✅ Found response ID for submission ${submissionId}: ${responseId}`);
            console.log(`📄 Processing ${files.length} files for this submission`);
            
            // Process each file for this submission
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                console.log(`📂 [${i+1}/${files.length}] Processing file: ${file.uri.split('/').pop()}`);
                
                try {
                    // Check if file exists
                    console.log(`🔍 Checking if file exists: ${file.uri}`);
                    const fileInfo = await FileSystem.getInfoAsync(file.uri);
                    if (!fileInfo.exists) {
                        console.log(`❌ File doesn't exist: ${file.uri}`);
                        failedCount++;
                        continue;
                    }
                    
                    console.log(`✅ File exists: ${file.uri}, size: ${fileInfo.size} bytes`);
                    
                    // Create form data for file upload
                    const formData = new FormData();
                    
                    // Get file name from URI
                    const fileName = file.uri.split('/').pop();
                    
                    // Get file type (MIME type)
                    let fileType = 'audio/m4a';  // Default for audio recordings
                    if (file.uri.endsWith('.mp4')) fileType = 'video/mp4';
                    else if (file.uri.endsWith('.jpg') || file.uri.endsWith('.jpeg')) fileType = 'image/jpeg';
                    else if (file.uri.endsWith('.png')) fileType = 'image/png';
                    
                    console.log(`📋 Preparing form data: ${fileName} (${fileType})`);
                    
                    // Append file to form data
                    formData.append('file', {
                        uri: file.uri,
                        name: fileName,
                        type: fileType
                    });
                    
                    // Append metadata
                    formData.append('formId', file.formId.toString());
                    formData.append('responseId', responseId);
                    
                    // Use the part number or original questionId
                    const questionId = file.partNumber 
                        ? `recording_part_${file.partNumber}` 
                        : file.questionId;
                    
                    formData.append('questionId', questionId);
                    
                    console.log(`🚀 Making API request for file: ${fileName}`);
                    console.log(`- formId: ${file.formId}, responseId: ${responseId}, questionId: ${questionId}`);
                    
                    // Make API request
                    const response = await axios.post(SYNC_MEDIA_URL, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    console.log(`📡 API response status: ${response.status}`);
                    
                    if (response.status === 200 || response.status === 201) {
                        // Don't modify the file object - just track its URI as synced
                        syncedFileUris.add(file.uri);
                        uploadedCount++;
                        
                        console.log(`✅ File uploaded successfully: ${file.uri}`);
                        console.log(`📊 Progress: ${uploadedCount}/${totalFileCount}`);
                        
                        setMediaUploadStatus(`Syncing... (${uploadedCount}/${totalFileCount})`);
                    } else {
                        console.log(`⚠️ Unexpected response status: ${response.status}`);
                        failedCount++;
                    }
                } catch (fileError) {
                    console.error(`❌ Error uploading file: ${file.uri}`, fileError);
                    console.log(`- Error message: ${fileError.message}`);
                    if (fileError.response) {
                        console.log(`- Response status: ${fileError.response.status}`);
                        console.log(`- Response data:`, fileError.response.data);
                    }
                    failedCount++;
                }
            }
        }
        
        console.log(`📊 Upload summary: ${uploadedCount} uploaded, ${failedCount} failed`);
        
        // Now update the original mediaFiles array and AsyncStorage
        console.log('🔄 Updating AsyncStorage with synced files');
        const updatedMediaFiles = await AsyncStorage.getItem('mediaFiles');
        const allMediaFiles = updatedMediaFiles ? JSON.parse(updatedMediaFiles) : [];
        
        console.log(`📁 Total files in storage: ${allMediaFiles.length}`);
        console.log(`📁 Files marked as synced: ${syncedFileUris.size}`);
        
        // Mark files as synced in the full media files list
        const updatedAllMediaFiles = allMediaFiles.map(file => {
            if (syncedFileUris.has(file.uri)) {
                console.log(`✓ Marking file as synced: ${file.uri.split('/').pop()}`);
                return { ...file, synced: true };
            }
            return file;
        });
        
        // Save updated media files 
        await AsyncStorage.setItem('mediaFiles', JSON.stringify(updatedAllMediaFiles));
        console.log('💾 Updated media files saved to AsyncStorage');
        
        // Update the state with files that still need syncing
        const remainingFiles = mediaFiles.filter(file => !syncedFileUris.has(file.uri));
        console.log(`🔄 Updating state: ${remainingFiles.length} files remaining to sync`);
        setMediaFiles(remainingFiles);
        
        // Set final status
        if (failedCount > 0) {
            setMediaUploadStatus(`Completed with errors: ${uploadedCount} uploaded, ${failedCount} failed`);
        } else {
            setMediaUploadStatus(`Successfully uploaded ${uploadedCount} files`);
        }
        
        console.log('✅ syncMediaFiles function completed');
        
    } catch (error) {
        console.error("❌ Media sync failed:", error);
        console.log(`- Error message: ${error.message}`);
        if (error.response) {
            console.log(`- Response status: ${error.response.status}`);
            console.log(`- Response data:`, error.response.data);
        }
        setMediaUploadStatus(`Error: ${error.message || "Network Error"}`);
    }
};

  const deleteEntry = async (id: number) => {
    try {
      const submissionsData = await AsyncStorage.getItem("formSubmissions");
      if (submissionsData) {
        const submissions = JSON.parse(submissionsData);
        // Find the entry and update its isComplete status
        const updatedSubmissions = submissions.map((sub) =>
          sub.FormID === id ? { ...sub, isComplete: false } : sub
        );
        // Save back to storage
        await AsyncStorage.setItem(
          "formSubmissions",
          JSON.stringify(updatedSubmissions)
        );
        // Update state to remove from view
        setEntries(entries.filter((entry) => entry.id !== id));
      }
    } catch (error) {
      console.error("Error updating entry status:", error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.headerContainer}>
        <Text variant="headlineMedium" style={styles.header}>
          Data Synchronization
        </Text>
        <Text variant="bodyMedium" style={styles.subheader}>
          Sync your collected data with the server
        </Text>
      </Surface>

      <View style={styles.listContainer}>
        {/* Form Response Sync Section */}
        <Text variant="titleLarge" style={styles.sectionTitle}>Form Responses</Text>
        <Button
          mode="contained"
          onPress={syncFormEntries}
          style={styles.uploadButton}
          buttonColor={theme.colors.primary}
          disabled={uploadStatus === "Syncing..." || entries.length === 0}
        >
          {uploadStatus === "Syncing..." ? "Syncing..." : "Sync Form Responses"}
        </Button>
        {uploadStatus !== "" && (
          <Text style={styles.statusText}>{uploadStatus}</Text>
        )}

        {entries.length === 0 && (
          <Text style={styles.emptyText}>No completed forms to sync</Text>
        )}

        {entries.map((entry) => (
          <Card key={entry.id} style={styles.card} mode="elevated">
            <Card.Content style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.textContainer}>
                <Text variant="titleMedium" style={styles.title}>
                  {entry.formName}
                </Text>
                <Text variant="bodyMedium" style={styles.description}>
                  <Text style={{ fontWeight: "bold" }}>Date:</Text>{" "}
                  {entry.submissionDate}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.description, 
                    styles.status,
                    entry.status === "Synced" && { color: theme.colors.primary }
                  ]}
                >
                  {entry.status}
                </Text>
              </View>
              <View style={styles.deleteContainer}>
                <MaterialCommunityIcons
                  name="delete-outline"
                  size={24}
                  color={theme.colors.error}
                  onPress={() => deleteEntry(entry.id)}
                />
              </View>
            </Card.Content>
          </Card>
        ))}

        <Divider style={styles.divider} />

        {/* Media Files Sync Section */}
        <Text variant="titleLarge" style={styles.sectionTitle}>Media Files</Text>
        <Button
          mode="contained"
          onPress={syncMediaFiles}
          style={styles.uploadButton}
          buttonColor={theme.colors.secondary}
          disabled={mediaUploadStatus === "Syncing media files..." || mediaFiles.length === 0}
        >
          {mediaUploadStatus === "Syncing media files..." ? "Syncing..." : "Sync Media Files"}
        </Button>
        {mediaUploadStatus !== "" && (
          <Text style={styles.statusText}>{mediaUploadStatus}</Text>
        )}

        {mediaFiles.length === 0 && (
          <Text style={styles.emptyText}>No media files to sync</Text>
        )}

        {mediaFiles.map((file, index) => (
          <Card key={index} style={styles.card} mode="elevated">
            <Card.Content style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={file.type === 'audio' ? "microphone" : "file-image"}
                  size={24}
                  color={theme.colors.secondary}
                />
              </View>
              <View style={styles.textContainer}>
                <Text variant="titleMedium" style={styles.title}>
                  {file.type.charAt(0).toUpperCase() + file.type.slice(1)} Recording
                </Text>
                <Text variant="bodyMedium" style={styles.description}>
                  <Text style={{ fontWeight: "bold" }}>Form ID:</Text> {file.formId}
                </Text>
                <Text variant="bodyMedium" style={styles.description}>
                  <Text style={{ fontWeight: "bold" }}>Date:</Text>{" "}
                  {new Date(file.timestamp).toLocaleDateString()}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[styles.description, styles.mediaStatus]}
                >
                  {file.synced ? "Synced" : "Pending"}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

// Add this to the existing styles
const additionalStyles = StyleSheet.create({
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 32,
    fontSize: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  mediaStatus: {
    color: "#7b1fa2", // Purple for media
    marginTop: 8,
    fontWeight: "500",
  },
});

// Merge the additional styles with existing styles
const styles = StyleSheet.create({
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f5f5f5",
    },
    headerContainer: {
      padding: 16,
      backgroundColor: "#fff",
      elevation: 2,
    },
    header: {
      color: "#1a1a1a",
      fontWeight: "bold",
    },
    subheader: {
      color: "#666",
      marginTop: 4,
    },
    listContainer: {
      padding: 26,
    },
    uploadButton: {
      marginBottom: 20,
      borderRadius: 8,
    },
    card: {
      marginBottom: 12,
      borderRadius: 12,
      elevation: 3,
    },
    cardContent: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: 16,
    },
    iconContainer: {
      backgroundColor: "#f0f0f0",
      padding: 8,
      borderRadius: 8,
      marginRight: 16,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontWeight: "600",
      color: "#1a1a1a",
    },
    description: {
      color: "#666",
      marginTop: 4,
    },
    status: {
      color: "#ff9800",
      marginTop: 8,
      fontWeight: "500",
    },
    statusText: {
      textAlign: "center",
      marginBottom: 20,
      color: "#666",
      fontWeight: "bold",
    },
    deleteContainer: {
      padding: 8,
      justifyContent: "center",
      alignItems: "center",
    },
  }),
  ...additionalStyles,
});