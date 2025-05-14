import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  Badge
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  ExpandMore as ExpandMoreIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Description as DocumentIcon,
  Download as DownloadIcon,
  PersonRemove as PersonRemoveIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config';

const FileManagementPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState([]);
  const [selectedForm, setSelectedForm] = useState('');
  const [selectedResponse, setSelectedResponse] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [questionId, setQuestionId] = useState('');

  // Access management
  const [openAccessDialog, setOpenAccessDialog] = useState(false);
  const [currentFileId, setCurrentFileId] = useState(null);
  const [emailToAdd, setEmailToAdd] = useState('');

  // Get icon based on file type
  const getFileIcon = (contentType) => {
    if (contentType.startsWith('image/')) return <ImageIcon color="primary" />;
    if (contentType === 'application/pdf') return <PdfIcon color="error" />;
    if (contentType.startsWith('video/')) return <VideoIcon color="secondary" />;
    if (contentType.startsWith('audio/')) return <AudioIcon color="success" />;
    if (contentType.startsWith('application/')) return <DocumentIcon color="info" />;
    return <FileIcon />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_URL}/forms/CreatedForms`, { withCredentials: true });
      setForms(response.data || []);
    } catch (err) {
      console.error('Error fetching forms:', err);
      setError('Failed to load forms. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async (formId) => {
    if (!formId) return;
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_URL}/responses/form/${formId}`, { withCredentials: true });
      setResponses(response.data || []);
    } catch (err) {
      console.error('Error fetching responses:', err);
      setError('Failed to load responses for this form.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilesForForm = async (formId) => {
    if (!formId) return;
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const response = await axios.get(`${API_URL}/files/form/${formId}`, { withCredentials: true });
      setFiles(response.data.files || []);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files for this form.');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilesForResponse = async (responseId) => {
    if (!responseId) return;
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const response = await axios.get(`${API_URL}/files/response/${responseId}`, { withCredentials: true });
      setFiles(response.data.files || []);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files for this response.');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (event) => {
    const formId = event.target.value;
    setSelectedForm(formId);
    setSelectedResponse('');
    fetchResponses(formId);
    fetchFilesForForm(formId);
  };

  const handleResponseChange = (event) => {
    const responseId = event.target.value;
    setSelectedResponse(responseId);
    fetchFilesForResponse(responseId);
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setUploadFile(event.target.files[0]);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    
    if (!uploadFile) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!selectedForm) {
      setError('Please select a form');
      return;
    }
    
    if (!selectedResponse) {
      setError('Please select a response');
      return;
    }
    
    if (!questionId.trim()) {
      setError('Please provide a question ID');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('formId', selectedForm);
      formData.append('responseId', selectedResponse);
      formData.append('questionId', questionId);
      
      await axios.post(`${API_URL}/files/web-upload`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Refresh the files list
      if (selectedResponse) {
        fetchFilesForResponse(selectedResponse);
      } else {
        fetchFilesForForm(selectedForm);
      }
      
      setSuccess('File uploaded successfully!');
      setUploadFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('upload-file-input');
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to upload file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = (fileId, filename) => {
    // Create an anchor to download the file
    const downloadLink = document.createElement('a');
    downloadLink.href = `${API_URL}/files/${fileId}`;
    downloadLink.download = filename;
    downloadLink.target = '_blank';
    
    // Ensure cookies are sent with the request
    downloadLink.setAttribute('rel', 'noopener noreferrer');
    
    // Add to DOM and trigger click, then clean up
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/files/${fileId}`, { withCredentials: true });
      
      // Refresh the files list
      if (selectedResponse) {
        fetchFilesForResponse(selectedResponse);
      } else {
        fetchFilesForForm(selectedForm);
      }
      
      setSuccess('File deleted successfully!');
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to delete file.');
    } finally {
      setLoading(false);
    }
  };

  // File access management
  const openManageAccessDialog = (fileId) => {
    setCurrentFileId(fileId);
    setOpenAccessDialog(true);
    setEmailToAdd('');
  };

  const handleAddAccess = async () => {
    if (!emailToAdd.trim() || !currentFileId) return;
    
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/files/${currentFileId}/access`,
        { email: emailToAdd },
        { withCredentials: true }
      );
      
      // Refresh the file list
      if (selectedResponse) {
        fetchFilesForResponse(selectedResponse);
      } else {
        fetchFilesForForm(selectedForm);
      }
      
      setSuccess(`Access granted to ${emailToAdd}`);
      setEmailToAdd('');
    } catch (err) {
      console.error('Error adding access:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to grant access.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAccess = async (userId) => {
    if (!currentFileId) return;
    
    try {
      setLoading(true);
      await axios.delete(
        `${API_URL}/files/${currentFileId}/access/${userId}`,
        { withCredentials: true }
      );
      
      // Refresh the file list
      if (selectedResponse) {
        fetchFilesForResponse(selectedResponse);
      } else {
        fetchFilesForForm(selectedForm);
      }
      
      setSuccess('Access removed successfully');
    } catch (err) {
      console.error('Error removing access:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to remove access.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Reset the files list when changing tabs
    setFiles([]);
    
    if (newValue === 0) {
      if (selectedForm) {
        fetchFilesForForm(selectedForm);
      }
    } else {
      if (selectedResponse) {
        fetchFilesForResponse(selectedResponse);
      }
    }
  };

  const getCurrentFile = () => {
    return files.find(file => file._id === currentFileId);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        File Management
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Upload, view, and manage files associated with your forms and responses
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Upload New File
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="form-select-label">Select Form</InputLabel>
              <Select
                labelId="form-select-label"
                id="form-select"
                value={selectedForm}
                label="Select Form"
                onChange={handleFormChange}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {forms.map((form) => (
                  <MenuItem key={form._id} value={form.FormID}>
                    {form.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="response-select-label">Select Response</InputLabel>
              <Select
                labelId="response-select-label"
                id="response-select"
                value={selectedResponse}
                label="Select Response"
                onChange={handleResponseChange}
                disabled={!selectedForm || loading}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {responses.map((response) => (
                  <MenuItem key={response._id} value={response._id}>
                    {response._id} ({new Date(response.submittedAt).toLocaleDateString()})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Question ID"
              variant="outlined"
              value={questionId}
              onChange={(e) => setQuestionId(e.target.value)}
              sx={{ mb: 2 }}
              disabled={!selectedForm || !selectedResponse || loading}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '2px dashed #ccc', borderRadius: 2, p: 3, mb: 2 }}>
                <input
                  accept="image/*,application/pdf,video/*,audio/*"
                  style={{ display: 'none' }}
                  id="upload-file-input"
                  type="file"
                  onChange={handleFileChange}
                  disabled={!selectedForm || !selectedResponse || loading}
                />
                <label htmlFor="upload-file-input">
                  <Button
                    component="span"
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                    disabled={!selectedForm || !selectedResponse || loading}
                    sx={{ mb: 2 }}
                  >
                    Select File
                  </Button>
                </label>
                {uploadFile && (
                  <Typography variant="body2">
                    Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                  </Typography>
                )}
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={!uploadFile || !selectedForm || !selectedResponse || !questionId || loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                Upload File
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Form Files" />
          <Tab label="Response Files" />
        </Tabs>
      </Box>

      <Box sx={{ mb: 4 }}>
        {activeTab === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Files for Selected Form
              </Typography>
              {selectedForm ? (
                files.length > 0 ? (
                  <List>
                    {files.map((file) => (
                      <React.Fragment key={file._id}>
                        <ListItem
                          secondaryAction={
                            <Box>
                              <Tooltip title="Download">
                                <IconButton 
                                  edge="end" 
                                  aria-label="download"
                                  onClick={() => handleDownloadFile(file._id, file.filename)}
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Manage Access">
                                <IconButton 
                                  edge="end" 
                                  aria-label="manage access" 
                                  onClick={() => openManageAccessDialog(file._id)}
                                  sx={{ ml: 1 }}
                                >
                                  <Badge 
                                    badgeContent={file.usersWithAccess?.length || 0} 
                                    color="primary"
                                  >
                                    <PersonAddIcon />
                                  </Badge>
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton 
                                  edge="end" 
                                  aria-label="delete" 
                                  onClick={() => handleDeleteFile(file._id)}
                                  color="error"
                                  sx={{ ml: 1 }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          }
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {getFileIcon(file.contentType)}
                                <Typography sx={{ ml: 1 }}>{file.filename}</Typography>
                              </Box>
                            }
                            secondary={
                              <React.Fragment>
                                <Typography variant="body2" color="text.secondary">
                                  Size: {formatFileSize(file.size)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Uploaded: {new Date(file.uploadDate).toLocaleString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Response: {file.responseId}
                                </Typography>
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary" align="center">
                    No files found for this form
                  </Typography>
                )
              ) : (
                <Typography color="text.secondary" align="center">
                  Please select a form to view files
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Files for Selected Response
              </Typography>
              {selectedResponse ? (
                files.length > 0 ? (
                  <List>
                    {files.map((file) => (
                      <React.Fragment key={file._id}>
                        <ListItem
                          secondaryAction={
                            <Box>
                              <Tooltip title="Download">
                                <IconButton 
                                  edge="end" 
                                  aria-label="download"
                                  onClick={() => handleDownloadFile(file._id, file.filename)}
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Manage Access">
                                <IconButton 
                                  edge="end" 
                                  aria-label="manage access" 
                                  onClick={() => openManageAccessDialog(file._id)}
                                  sx={{ ml: 1 }}
                                >
                                  <Badge 
                                    badgeContent={file.usersWithAccess?.length || 0} 
                                    color="primary"
                                  >
                                    <PersonAddIcon />
                                  </Badge>
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton 
                                  edge="end" 
                                  aria-label="delete" 
                                  onClick={() => handleDeleteFile(file._id)}
                                  color="error"
                                  sx={{ ml: 1 }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          }
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {getFileIcon(file.contentType)}
                                <Typography sx={{ ml: 1 }}>{file.filename}</Typography>
                              </Box>
                            }
                            secondary={
                              <React.Fragment>
                                <Typography variant="body2" color="text.secondary">
                                  Size: {formatFileSize(file.size)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Uploaded: {new Date(file.uploadDate).toLocaleString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Question ID: {file.questionId}
                                </Typography>
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary" align="center">
                    No files found for this response
                  </Typography>
                )
              ) : (
                <Typography color="text.secondary" align="center">
                  Please select a response to view files
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Dialog for managing file access */}
      <Dialog
        open={openAccessDialog}
        onClose={() => setOpenAccessDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Manage File Access</DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" gutterBottom>
            Current users with access:
          </Typography>
          
          {getCurrentFile()?.usersWithAccess?.length > 0 ? (
            <List>
              {getCurrentFile()?.usersWithAccess.map(user => (
                <ListItem 
                  key={user._id}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="remove access"
                      onClick={() => handleRemoveAccess(user._id)}
                      color="error"
                    >
                      <PersonRemoveIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={user.Username}
                    secondary={user.Email}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No users have been granted explicit access to this file.
            </Typography>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Add new user:
          </Typography>
          <Box sx={{ display: 'flex', mt: 2 }}>
            <TextField
              label="User Email"
              variant="outlined"
              fullWidth
              value={emailToAdd}
              onChange={(e) => setEmailToAdd(e.target.value)}
            />
            <Button 
              variant="contained"
              color="primary"
              onClick={handleAddAccess}
              disabled={!emailToAdd.trim() || loading}
              sx={{ ml: 2 }}
            >
              Add
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAccessDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FileManagementPage;