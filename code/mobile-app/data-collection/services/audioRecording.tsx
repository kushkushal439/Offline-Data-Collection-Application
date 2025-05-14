import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

class AudioRecordingService {
  constructor() {
    this.recording = null;
    this.sound = null;
    this.isRecording = false;
    this.recordingURI = null;
  }

  async startRecording(formId, submissionId) {
    try {
      // Request permissions
      console.log('Requesting permissions');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording instance
      console.log('Starting recording');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.LOW_QUALITY
        // Other options: HIGH_QUALITY, MEDIUM_QUALITY, HIGH_LOSSLESS
      );
      this.recording = recording;
      this.isRecording = true;

      // Generate a unique filename based on form and submission IDs
      this.recordingURI = `${FileSystem.documentDirectory}form_${formId}_submission_${submissionId}_${Date.now()}.m4a`;
      console.log('Recording started, will save to', this.recordingURI);

      return true;
    } catch (error) {
      console.error('Failed to start recording', error);
      return false;
    }
  }

  async stopRecording() {
    console.log('Stopping recording');
    if (!this.recording) {
      return null;
    }

    try {
      // Stop the recording
      await this.recording.stopAndUnloadAsync();

      // Get the recorded URI from the recording object
      const uri = this.recording.getURI();
      
      // Move the file from temporary location to our desired location
      if (uri && this.recordingURI) {
        await FileSystem.moveAsync({
          from: uri,
          to: this.recordingURI
        });
      }

      // Clean up
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      this.recording = null;
      this.isRecording = false;

      console.log('Recording stopped, file saved to', this.recordingURI);
      return this.recordingURI;
    } catch (error) {
      console.error('Failed to stop recording', error);
      return null;
    }
  }

  async playRecording(uri) {
    try {
      // Unload any previous sound
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // Create and load the sound
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      
      this.sound = sound;
      
      // Play the sound
      await this.sound.playAsync();
      
      return true;
    } catch (error) {
      console.error('Failed to play recording', error);
      return false;
    }
  }

  async stopPlayback() {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
  }
}

export default new AudioRecordingService();