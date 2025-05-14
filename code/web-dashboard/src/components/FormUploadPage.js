import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Card,
  CardContent,
  Collapse,
  Stack,
  Grid,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';

import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Chip from '@mui/material/Chip';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import axios from 'axios';
import FilterListIcon from '@mui/icons-material/FilterList';
import GetAppIcon from '@mui/icons-material/GetApp';
import MicIcon from '@mui/icons-material/Mic';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler,
} from 'chart.js';
import WordCloud from 'react-d3-cloud';
import { ChartWrapper, VisualizationErrorBoundary } from './ChartComponents';
import { API_URL } from '../config';

/**
 * @typedef {Object} FormDataType
 * @property {string} _id
 * @property {string} title
 * @property {string} description
 * @property {string} [createdAt]
 * @property {string} [date]
 * @property {Array<any>} [Questions]
 */

/**
 * @typedef {Object} ResponseData
 * @property {string} _id
 * @property {string} formId
 * @property {Object.<string, any>} answers
 * @property {string} submittedAt
 */

// Register Chart.js components
ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler
);

const FormsTab = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [forms, setForms] = useState([]);
  const [error, setError] = useState(null);

  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [currentForm, setCurrentForm] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [accessError, setAccessError] = useState(null);
  const [accessSuccess, setAccessSuccess] = useState(null);
  const [removingUser, setRemovingUser] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await axios.get(`${API_URL}/forms/CreatedForms`, { withCredentials: true });
      setForms(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching forms:', err);
      setError('Failed to load forms. Please try again later.');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus(null);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an Excel file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('formFile', file);

    setIsUploading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/forms/upload-excel`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      setUploadStatus({
        success: true,
        message: 'Form uploaded successfully!',
        form: response.data.form,
      });
      // Refresh forms list after successful upload
      fetchForms();
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus({
        success: false,
        message: err.response?.data?.error || 'Upload failed. Please try again.',
      });
    } finally {
      setIsUploading(false);
      setFile(null);
      // Reset file input manually if needed
      const fileInput = document.getElementById('form-file-upload');
      if (fileInput) fileInput.value = '';
    }
  };

  const handleDeleteForm = async (id) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      try {
        await axios.delete(`${API_URL}/forms/${id}`, { withCredentials: true });
        setForms(forms.filter((form) => form._id !== id));
      } catch (err) {
        console.error('Error deleting form:', err);
        setError('Failed to delete form. Please try again.');
      }
    }
  };

  const handleOpenAccessDialog = (form) => {
    setCurrentForm(form);
    setAccessDialogOpen(true);
    setUserEmail('');
    setAccessError(null);
    setAccessSuccess(null);
  };

  const handleCloseAccessDialog = () => {
    setAccessDialogOpen(false);
    setCurrentForm(null);
  };

  const handleAddUserAccess = async (e) => {
    e.preventDefault();
    if (!userEmail || !userEmail.trim()) {
      setAccessError('Please enter a valid email address');
      return;
    }

    setAddingUser(true);
    setAccessError(null);
    setAccessSuccess(null);

    try {
      const response = await axios.post(
        `${API_URL}/forms/${currentForm._id}/access`,
        { email: userEmail.trim() },
        { withCredentials: true }
      );

      setAccessSuccess('User access added successfully');
      setUserEmail('');

      // Update the current form with the updated data
      setCurrentForm(response.data.form);

      // Refresh the forms list to include the updated data
      fetchForms();
    } catch (err) {
      console.error('Error adding user access:', err);
      setAccessError(err.response?.data?.error || 'Failed to add user access. Please try again.');
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUserAccess = async (userId) => {
    if (!currentForm || !userId) return;

    setRemovingUser(true);
    setAccessError(null);
    setAccessSuccess(null);
    setUserToRemove(userId);

    try {
      const response = await axios.delete(
        `${API_URL}/forms/${currentForm._id}/access/${userId}`,
        { withCredentials: true }
      );

      setAccessSuccess('User access removed successfully');

      // Update the current form with the updated data
      setCurrentForm(response.data.form);

      // Refresh the forms list to include the updated data
      fetchForms();
    } catch (err) {
      console.error('Error removing user access:', err);
      setAccessError(err.response?.data?.error || 'Failed to remove user access. Please try again.');
    } finally {
      setRemovingUser(false);
      setUserToRemove(null);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Form Management
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {uploadStatus && (
        <Alert severity={uploadStatus.success ? 'success' : 'error'} sx={{ mb: 2 }}>
          {uploadStatus.message}
        </Alert>
      )}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upload New Form
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <input
                accept=".xlsx"
                style={{ display: 'none' }}
                id="form-file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="form-file-upload">
                <Button variant="contained" component="span" startIcon={<CloudUploadIcon />}>
                  Select Excel File
                </Button>
              </label>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<DescriptionIcon />}
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `${window.location.origin}/Template.xlsx`;
                  link.download = 'Template.xlsx';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Download Template
              </Button>
            </Stack>
            {file && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected file: {file.name}
              </Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <Button type="submit" variant="contained" color="primary" disabled={!file || isUploading} sx={{ mt: 1 }}>
                {isUploading ? <CircularProgress size={24} sx={{ color: 'white', mr: 1 }} /> : 'Upload Form'}
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              The Excel file should have a "Settings" sheet with form metadata and a "Questionnare" sheet with questions.
            </Typography>
          </Box>
        </CardContent>
      </Card>
      <Divider sx={{ mb: 4 }} />
      <Typography variant="h5" component="h2" gutterBottom>
        Uploaded Forms
      </Typography>
      {forms.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No forms have been uploaded yet.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="forms table">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell>Questions</TableCell>
                <TableCell align="center">Access</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {forms.map((form) => (
                <TableRow key={form._id} hover>
                  <TableCell component="th" scope="row">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                      {form.title}
                    </Box>
                  </TableCell>
                  <TableCell>{form.description}</TableCell>
                  <TableCell>
                    {new Date(form.createdAt || form.date || Date.now()).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{form.Questions?.length || 0}</TableCell>

                  {/*Access column */}
                  <TableCell align="center">
                    <Tooltip title="Manage user access">
                      <IconButton
                        aria-label="manage access"
                        onClick={() => handleOpenAccessDialog(form)}
                        color="primary"
                      >
                        <PeopleIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>

                  {/* Delete form*/}
                  <TableCell align="right">
                    <Tooltip title="Delete form">
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteForm(form._id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={accessDialogOpen}
        onClose={handleCloseAccessDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          <Typography variant="h6" component="div">
            Manage Form Access
          </Typography>
          {currentForm && (
            <Typography variant="subtitle1" color="text.secondary">
              {currentForm.title}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          {accessError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {accessError}
            </Alert>
          )}
          {accessSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {accessSuccess}
            </Alert>
          )}

          <Box component="form" onSubmit={handleAddUserAccess} sx={{ mb: 4 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              Add User Access
            </Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                label="User Email"
                variant="outlined"
                size="small"
                fullWidth
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Enter email address"
                disabled={addingUser}
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<PersonAddIcon />}
                disabled={addingUser}
                sx={{ minWidth: '100px' }}
              >
                {addingUser ? <CircularProgress size={24} /> : 'Add'}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            Users with Access
          </Typography>

          {currentForm && currentForm.UsersWithAccess && currentForm.UsersWithAccess.length > 0 ? (
            <List sx={{ bgcolor: '#f5f5f5', borderRadius: 1 }}>
              {currentForm.UsersWithAccess.map((user) => (
                <ListItem
                  key={user._id}
                  divider
                  secondaryAction={
                    <Tooltip title="Remove access">
                      <IconButton
                        edge="end"
                        aria-label="remove access"
                        onClick={() => handleRemoveUserAccess(user._id)}
                        color="error"
                        disabled={removingUser}
                        sx={{ '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.04)' } }}
                      >
                        {removingUser && userToRemove === user._id ? (
                          <CircularProgress size={20} color="error" />
                        ) : (
                          <PersonRemoveIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography variant="body1">
                        {user.Username || 'Unnamed User'}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {user.Email}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Paper
              variant="outlined"
              sx={{
                py: 3,
                bgcolor: '#f5f5f5',
                borderStyle: 'dashed',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary" align="center">
                No users have been granted access to this form yet.
              </Typography>
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={handleCloseAccessDialog} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const ResponsesTab = () => {
  const [responses, setResponses] = useState([]);
  const [forms, setForms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedFormId, setSelectedFormId] = useState('');
  const [filteredResponses, setFilteredResponses] = useState([]);
  const [formQuestionMap, setFormQuestionMap] = useState({});
  const [filterCriteria, setFilterCriteria] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);

  const [hideEmptyColumns, setHideEmptyColumns] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const [activeView, setActiveView] = useState('responses');
  const [mcqVisualizations, setMcqVisualizations] = useState([]);
  const [rangeVisualizations, setRangeVisualizations] = useState([]);
  const [textVisualizations, setTextVisualizations] = useState([]);
  const [numericalVisualizations, setNumericalVisualizations] = useState([]);
  const [checkboxVisualizations, setCheckboxVisualizations] = useState([]);
  const [dateVisualizations, setDateVisualizations] = useState([]);

  const [audioFilesDialogOpen, setAudioFilesDialogOpen] = useState(false);
  const [audioFilesList, setAudioFilesList] = useState([]);
  const [audioFilesLoading, setAudioFilesLoading] = useState(false);
  const [audioResponseId, setAudioResponseId] = useState(null);

  useEffect(() => {
    fetchFormsAndResponses();
  }, []);

  // Modify the useEffect that sets filteredResponses
  useEffect(() => {
    if (selectedFormId) {
      let filtered = responses.filter((resp) => resp.formId === parseInt(selectedFormId));

      // Apply additional filters if they exist
      if (isFilterApplied && Object.keys(filterCriteria).length > 0) {
        filtered = filtered.filter((response) => {
          // Check each filter criterion
          for (const questionId in filterCriteria) {
            const expectedAnswer = filterCriteria[questionId];
            // Skip empty filter criteria
            if (!expectedAnswer || expectedAnswer.length === 0) continue;

            const actualAnswer = response.answers[questionId];

            // Handle date type answers
            if (actualAnswer && typeof actualAnswer === 'string' && actualAnswer.includes('T')) {
              const filterDate = new Date(expectedAnswer);
              const responseDate = new Date(actualAnswer);

              // Compare dates by day (ignoring time)
              if (filterDate.toDateString() !== responseDate.toDateString()) {
                return false;
              }
            }
            // Handle checkbox (array) answers differently
            else if (Array.isArray(actualAnswer)) {
              // For checkbox answers, check if the expected answer is included in the actual answers
              if (!actualAnswer.includes(expectedAnswer)) {
                return false;
              }
            } else {
              // For non-checkbox answers, do exact match
              if (String(actualAnswer || '').trim() !== expectedAnswer.trim()) {
                return false;
              }
            }
          }
          // All criteria matched (or were empty)
          return true;
        });
      }

      setFilteredResponses(filtered);
    } else {
      setFilteredResponses(responses);
    }
  }, [selectedFormId, responses, filterCriteria, isFilterApplied]);

  const handleFilterChange = (questionId, value) => {
    setFilterCriteria((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const applyFilters = () => {
    setIsFilterApplied(true);
  };

  const clearFilters = () => {
    setFilterCriteria({});
    setIsFilterApplied(false);
  };

  const handleSectionToggle = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    if (selectedFormId) {
      setFilteredResponses(responses.filter((resp) => resp.formId === parseInt(selectedFormId)));
    } else {
      setFilteredResponses(responses);
    }
  }, [selectedFormId, responses]);

  const fetchFormsAndResponses = async () => {
    setLoading(true);
    setError(null);
    try {
      setLoading(true);
      // Fetch both forms and responses in parallel
      const [formsRes, responsesRes] = await Promise.all([
        axios.get(`${API_URL}/forms/CreatedForms`, { withCredentials: true }),
        axios.get(`${API_URL}/responses`, { withCredentials: true }),
      ]);

      setForms(formsRes.data || []);
      setResponses(responsesRes.data || []);
      setFilteredResponses(responsesRes.data || []);

      // Create a map of form questions for easy access
      const questionMap = {};
      formsRes.data.forEach((form) => {
        questionMap[form.FormID] = {};
        form.Questions.forEach((q) => {
          questionMap[form.FormID][q.id] = q.text;
        });
      });
      setFormQuestionMap(questionMap);
    } catch (err) {
      console.error(err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (event) => {
    setSelectedFormId(event.target.value);
    setFilterCriteria({});
    setIsFilterApplied(false);

    // If filters are shown, hide them for the new form
    if (showFilters) {
      setShowFilters(false);
    }
  };

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getEmptyColumns = () => {
    if (!selectedFormId || filteredResponses.length === 0) return [];

    // Get all question IDs for this form
    const questionIds = Object.keys(formQuestionMap[selectedFormId] || {});

    // Find columns where all responses have empty values
    const emptyColumns = questionIds.filter((questionId) => {
      return filteredResponses.every((response) => {
        const answer = response.answers[questionId];
        return answer === undefined || answer === null || answer === '';
      });
    });

    return emptyColumns;
  };

  // Get question columns for the selected form
  const getQuestionColumns = () => {
    if (!selectedFormId || !formQuestionMap[selectedFormId]) return [];

    // Get all questions for the selected form, excluding empty ones
    let questions = Object.entries(formQuestionMap[selectedFormId]).map(([id, text]) => ({
      id,
      text,
    }));

    if (hideEmptyColumns) {
      const emptyColumns = getEmptyColumns();
      questions = questions.filter((question) => !emptyColumns.includes(question.id));
    }

    return questions;
  };

  const getQuestionsForFilter = () => {
    if (!selectedFormId || !formQuestionMap[selectedFormId]) return [];

    // Get the full form data with sections
    const selectedForm = forms.find((form) => form.FormID === parseInt(selectedFormId));
    if (!selectedForm) return [];

    // Get all questions grouped by section
    const sectionMap = {};

    selectedForm.Questions.forEach((q) => {
      const sectionName = q.section || 'General Questions';

      if (!sectionMap[sectionName]) {
        sectionMap[sectionName] = [];
      }

      // Only include if we're showing all columns or this isn't an empty column
      if (!hideEmptyColumns || !getEmptyColumns().includes(q.id)) {
        sectionMap[sectionName].push({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options || [],
          minValue: q.minValue,
          maxValue: q.maxValue,
        });
      }
    });

    return sectionMap;
  };

  const handleExportCSV = () => {
    if (!selectedFormId || filteredResponses.length === 0) return;

    // Get non-empty question columns for the selected form
    const questionColumns = getQuestionColumns();

    // Create header row
    const header = questionColumns.map((col) => `"${col.text.replace(/"/g, '""')}"`);

    // Create rows for each response
    const rows = filteredResponses.map((response) => {
      return questionColumns.map((column) => {
        const value = response.answers[column.id] || '';
        // Escape quotes for CSV
        return `"${String(value).replace(/"/g, '""')}"`;
      });
    });

    // Combine header and rows
    const csvContent = [header, ...rows].map((row) => row.join(',')).join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `form_responses_${selectedFormId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAudio = (responseId, formId) => {
    // Check for required params
    if (!responseId || !formId) {
      setError('Missing required information to fetch audio');
      return;
    }

    setAudioFilesLoading(true);
    setAudioResponseId(responseId);

    try {
      // Create a request to the files API to get audio recordings
      const audioUrl = `${API_URL}/files/response/${responseId}`;

      axios
        .get(audioUrl, { withCredentials: true })
        .then((response) => {
          // Check if we have any audio files
          const audioFiles = response.data.files.filter(
            (file) =>
              file.questionId === 'full_recording' ||
              file.questionId.startsWith('recording_part')
          );

          if (audioFiles.length === 0) {
            alert('No audio recordings found for this response');
            return;
          }

          // Store the audio files and open the dialog
          setAudioFilesList(audioFiles);
          setAudioFilesDialogOpen(true);
        })
        .catch((err) => {
          console.error('Error fetching audio files:', err);
          alert('Failed to retrieve audio recordings for this response');
        })
        .finally(() => {
          setAudioFilesLoading(false);
        });
    } catch (err) {
      console.error('Error initiating audio fetch:', err);
      setError('Failed to fetch audio recordings');
      setAudioFilesLoading(false);
    }
  };

  const handleDownloadSingleAudio = (audioFile) => {
    // Create descriptive filename
    const fileType = audioFile.questionId === 'full_recording' ? 'full' : 'partial';
    const fileName = `response_${audioResponseId}_${fileType}_recording.m4a`;

    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = `${API_URL}/files/${audioFile._id}`;
    downloadLink.download = fileName;

    // Append to body, click, then remove
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const processMcqVisualizations = () => {
    if (!selectedFormId || !filteredResponses.length) return [];

    const selectedForm = forms.find((form) => form.FormID === parseInt(selectedFormId));
    if (!selectedForm) return [];

    const mcqQuestions = selectedForm.Questions.filter((q) => q.type === 'mcq');
    const visualizations = mcqQuestions.map((question) => {
      // Count responses for each option
      const optionCounts = {};
      question.options.forEach((option) => {
        optionCounts[option] = 0;
      });

      filteredResponses.forEach((response) => {
        const answer = response.answers[question.id];
        if (answer && optionCounts.hasOwnProperty(answer)) {
          optionCounts[answer]++;
        }
      });

      // Prepare data for Chart.js
      const data = {
        labels: question.options,
        datasets: [
          {
            data: question.options.map((option) => optionCounts[option]),
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
            ],
            borderColor: '#fff',
            borderWidth: 1,
          },
        ],
      };

      return {
        questionId: question.id,
        questionText: question.text,
        data,
      };
    });

    setMcqVisualizations(visualizations);
  };

  const processRangeVisualizations = () => {
    if (!selectedFormId || !filteredResponses.length) return [];

    const selectedForm = forms.find((form) => form.FormID === parseInt(selectedFormId));
    if (!selectedForm) return [];

    const rangeQuestions = selectedForm.Questions.filter((q) => q.type === 'range');
    const visualizations = rangeQuestions
      .map((question) => {
        // Get all responses for this question
        const responses = filteredResponses
          .map((response) => response.answers[question.id])
          .filter((answer) => answer !== undefined && answer !== null && answer !== '')
          .map(Number)
          .sort((a, b) => a - b);

        if (responses.length === 0) return null;

        // Use the range from the question definition
        const min = question.minValue || 0;
        const max = question.maxValue || 10;
        const frequency = {};

        // Initialize frequency for all possible values in the range
        for (let i = min; i <= max; i++) {
          frequency[i] = 0;
        }

        // Count frequencies
        responses.forEach((value) => {
          if (value >= min && value <= max) {
            frequency[value]++;
          }
        });

        // Prepare data for Chart.js
        const data = {
          labels: Object.keys(frequency),
          datasets: [
            {
              label: 'Frequency',
              data: Object.values(frequency),
              borderColor: '#4BC0C0',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: '#4BC0C0',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: '#4BC0C0',
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2,
            },
          ],
        };

        return {
          questionId: question.id,
          questionText: question.text,
          data,
          min,
          max,
        };
      })
      .filter((viz) => viz !== null);

    setRangeVisualizations(visualizations);
  };

  const processTextVisualizations = () => {
    if (!selectedFormId || !filteredResponses.length) return [];

    const selectedForm = forms.find((form) => form.FormID === parseInt(selectedFormId));
    if (!selectedForm) return [];

    const textQuestions = selectedForm.Questions.filter((q) => q.type === 'text');
    const visualizations = textQuestions
      .map((question) => {
        // Get all responses for this question
        const responses = filteredResponses
          .map((response) => response.answers[question.id])
          .filter((answer) => answer && answer.trim() !== '');

        if (responses.length === 0) return null;

        // Process text to create word frequency map
        const wordFrequency = {};
        responses.forEach((text) => {
          // Split text into words and count frequency
          const words = text.toLowerCase().split(/\s+/);
          words.forEach((word) => {
            if (word.length > 2) {
              // Ignore very short words
              wordFrequency[word] = (wordFrequency[word] || 0) + 1;
            }
          });
        });

        // Convert to word cloud format
        const words = Object.entries(wordFrequency)
          .map(([text, value]) => ({
            text,
            value: Math.log(value) * 10, // Scale the values for better visualization
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 50); // Limit to top 50 words

        return {
          questionId: question.id,
          questionText: question.text,
          words,
        };
      })
      .filter((viz) => viz !== null);

    setTextVisualizations(visualizations);
  };

  const processNumericalVisualizations = () => {
    if (!selectedFormId || !filteredResponses.length) {
      setNumericalVisualizations([]);
      return;
    }

    const selectedForm = forms.find((form) => form.FormID === parseInt(selectedFormId));
    if (!selectedForm) {
      setNumericalVisualizations([]);
      return;
    }

    const numericalQuestions = selectedForm.Questions.filter(
      (q) => q.type === 'integer' || q.type === 'decimal'
    );
    const visualizations = numericalQuestions
      .map((question) => {
        // Get all responses for this question
        const responses = filteredResponses
          .map((response) => response.answers[question.id])
          .filter((answer) => answer !== undefined && answer !== null && answer !== '')
          .map(Number)
          .sort((a, b) => a - b);

        if (responses.length === 0) return null;

        // Calculate min and max values
        const min = Math.min(...responses);
        const max = Math.max(...responses);

        // For integer questions, ensure min and max are integers
        const isIntegerQuestion = question.type === 'integer';
        const adjustedMin = isIntegerQuestion ? Math.floor(min) : min;
        const adjustedMax = isIntegerQuestion ? Math.ceil(max) : max;

        // Handle single value case
        if (adjustedMin === adjustedMax) {
          const singleValue = adjustedMin;
          const data = {
            labels: [isIntegerQuestion ? `${singleValue}` : `${singleValue.toFixed(2)}`],
            datasets: [
              {
                label: 'Frequency',
                data: [responses.length],
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1,
                barPercentage: 0.9,
                categoryPercentage: 0.9,
              },
            ],
          };

          return {
            questionId: question.id,
            questionText: question.text,
            data,
            min: singleValue,
            max: singleValue,
            numBins: 1,
            binWidth: 0,
          };
        }

        // Use a fixed number of bins for consistency
        const numBins = 10;

        // Calculate bin width
        const binWidth = (adjustedMax - adjustedMin) / numBins;

        // Create bins
        const bins = Array(numBins).fill(0);
        const binLabels = [];

        // Initialize bin labels
        for (let i = 0; i < numBins; i++) {
          const binStart = adjustedMin + i * binWidth;
          const binEnd = binStart + binWidth;
          if (isIntegerQuestion) {
            // For integer questions, use integer ranges
            const start = Math.floor(binStart);
            const end = Math.ceil(binEnd);
            binLabels.push(`${start} - ${end}`);
          } else {
            // For decimal questions, use decimal ranges
            binLabels.push(`${binStart.toFixed(2)} - ${binEnd.toFixed(2)}`);
          }
        }

        // Count frequencies
        responses.forEach((value) => {
          const binIndex = Math.min(
            Math.floor((value - adjustedMin) / binWidth),
            numBins - 1
          );
          bins[binIndex]++;
        });

        // Prepare data for Chart.js
        const data = {
          labels: binLabels,
          datasets: [
            {
              label: 'Frequency',
              data: bins,
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 1,
              barPercentage: 0.9,
              categoryPercentage: 0.9,
            },
          ],
        };

        return {
          questionId: question.id,
          questionText: question.text,
          data,
          min: adjustedMin,
          max: adjustedMax,
          numBins,
          binWidth,
        };
      })
      .filter((viz) => viz !== null);

    setNumericalVisualizations(visualizations);
  };

  const processCheckboxVisualizations = () => {
    if (!selectedFormId || !filteredResponses.length) return [];

    const selectedForm = forms.find((form) => form.FormID === parseInt(selectedFormId));
    if (!selectedForm) return [];

    const checkboxQuestions = selectedForm.Questions.filter((q) => q.type === 'checkbox');
    const visualizations = checkboxQuestions.map((question) => {
      // Count responses for each option
      const optionCounts = {};
      question.options.forEach((option) => {
        optionCounts[option] = 0;
      });

      filteredResponses.forEach((response) => {
        const answers = response.answers[question.id];
        if (answers && Array.isArray(answers)) {
          answers.forEach((answer) => {
            if (optionCounts.hasOwnProperty(answer)) {
              optionCounts[answer]++;
            }
          });
        }
      });

      // Calculate percentage for each option
      const totalResponses = filteredResponses.length;
      const percentages = question.options.map((option) =>
        ((optionCounts[option] / totalResponses) * 100).toFixed(1)
      );

      // Prepare data for Chart.js
      const data = {
        labels: question.options,
        datasets: [
          {
            label: 'Count',
            data: question.options.map((option) => optionCounts[option]),
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
            ],
            borderColor: '#fff',
            borderWidth: 1,
          },
        ],
      };

      return {
        questionId: question.id,
        questionText: question.text,
        data,
        percentages,
      };
    });

    setCheckboxVisualizations(visualizations);
  };

  const processDateVisualizations = () => {
    if (!selectedFormId || !filteredResponses.length) return [];

    const selectedForm = forms.find((form) => form.FormID === parseInt(selectedFormId));
    if (!selectedForm) return [];

    const dateQuestions = selectedForm.Questions.filter((q) => q.type === 'date');
    const visualizations = dateQuestions
      .map((question) => {
        // Get all responses for this question
        const responses = filteredResponses
          .map((response) => response.answers[question.id])
          .filter((answer) => answer && answer.trim() !== '');

        if (responses.length === 0) return null;

        // Convert dates to timestamps and count frequencies
        const dateCounts = {};
        responses.forEach((dateStr) => {
          const date = new Date(dateStr);
          const timestamp = date.getTime();
          dateCounts[timestamp] = (dateCounts[timestamp] || 0) + 1;
        });

        // Sort by timestamp
        const sortedTimestamps = Object.keys(dateCounts).sort((a, b) => a - b);

        // Create data points array
        const dataPoints = sortedTimestamps.map((timestamp) => ({
          x: parseInt(timestamp),
          y: dateCounts[timestamp],
        }));

        // Prepare data for Chart.js
        const data = {
          datasets: [
            {
              label: 'Responses',
              data: dataPoints,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgb(75, 192, 192)',
              borderWidth: 2,
              tension: 0.1,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        };

        return {
          questionId: question.id,
          questionText: question.text,
          data,
          minTimestamp: parseInt(sortedTimestamps[0]),
          maxTimestamp: parseInt(sortedTimestamps[sortedTimestamps.length - 1]),
        };
      })
      .filter((viz) => viz !== null);

    setDateVisualizations(visualizations);
  };

  useEffect(() => {
    processMcqVisualizations();
    processRangeVisualizations();
    processTextVisualizations();
    processNumericalVisualizations();
    processCheckboxVisualizations();
    processDateVisualizations();
  }, [selectedFormId, filteredResponses, forms]);

  const renderAudioFilesDialog = () => {
    return (
      <Dialog
        open={audioFilesDialogOpen}
        onClose={() => setAudioFilesDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Available Audio Recordings
          <Typography variant="subtitle2" color="text.secondary">
            Response ID: {audioResponseId}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {audioFilesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              <Typography variant="body2" paragraph>
                Click on a recording below to download it:
              </Typography>
              <List>
                {audioFilesList.map((file, index) => (
                  <ListItem
                    key={file._id}
                    divider={index < audioFilesList.length - 1}
                    button
                    onClick={() => handleDownloadSingleAudio(file)}
                  >
                    <ListItemText
                      primary={
                        file.questionId === 'full_recording'
                          ? 'Full Recording'
                          : `Recording Part ${file.questionId.split('_').pop()}`
                      }
                      secondary={`File ID: ${file._id}`}
                    />
                    <GetAppIcon color="primary" />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAudioFilesDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderResponseTable = () => {
    const questionColumns = selectedFormId ? getQuestionColumns() : [];

    if (questionColumns.length === 0) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center', mt: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Please select a form to view responses.
          </Typography>
        </Paper>
      );
    }

    if (filteredResponses.length === 0) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center', mt: 2 }}>
          <Typography variant="body1" color="text.secondary">
            No responses available for this form.
          </Typography>
        </Paper>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="responses table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Response ID</TableCell>
              <TableCell>Submitted At</TableCell>
              <TableCell align="center">Audio</TableCell>
              {questionColumns.map((col) => (
                <TableCell key={col.id} sx={{ minWidth: 150, maxWidth: 300 }}>
                  {col.text}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredResponses.map((resp) => (
              <React.Fragment key={resp._id}>
                <TableRow hover>
                  <TableCell padding="checkbox">
                    <IconButton size="small" onClick={() => toggleRow(resp._id)}>
                      {expandedRows.has(resp._id) ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell>{resp._id}</TableCell>
                  <TableCell>{new Date(resp.submittedAt).toLocaleString()}</TableCell>
                  {/* New Audio Download Button Cell */}
                  <TableCell align="center">
                    <Tooltip title="Download audio recording">
                      <IconButton
                        color="primary"
                        onClick={() => handleDownloadAudio(resp._id, selectedFormId)}
                      >
                        <MicIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  {questionColumns.map((col) => (
                    <TableCell key={col.id} sx={{ wordBreak: 'break-word' }}>
                      {resp.answers[col.id] || ''}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4 + questionColumns.length}>
                    <Collapse in={expandedRows.has(resp._id)} timeout="auto" unmountOnExit>
                      <Box margin={2}>
                        <Typography variant="subtitle1" gutterBottom>
                          Raw Answer Data
                        </Typography>
                        <pre
                          style={{
                            backgroundColor: '#f5f5f5',
                            padding: '10px',
                            borderRadius: '4px',
                            overflowX: 'auto',
                          }}
                        >
                          {JSON.stringify(resp.answers, null, 2)}
                        </pre>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderVisualizations = () => {
    if (!selectedFormId) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center', mt: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Please select a form to view visualizations.
          </Typography>
        </Paper>
      );
    }

    if (filteredResponses.length === 0) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center', mt: 2 }}>
          <Typography variant="body1" color="text.secondary">
            No responses available for the current filters.
          </Typography>
        </Paper>
      );
    }

    if (
      mcqVisualizations.length === 0 &&
      rangeVisualizations.length === 0 &&
      textVisualizations.length === 0 &&
      numericalVisualizations.length === 0 &&
      checkboxVisualizations.length === 0 &&
      dateVisualizations.length === 0
    ) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center', mt: 2 }}>
          <Typography variant="body1" color="text.secondary">
            No visualizable questions found in this form.
          </Typography>
        </Paper>
      );
    }

    return (
      <Grid container spacing={2}>
        {mcqVisualizations.map((viz, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {viz.questionText}
              </Typography>
              <VisualizationErrorBoundary>
                {viz.data ? (
                  <ChartWrapper
                    type="pie"
                    data={viz.data}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const value = context.raw;
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${context.label}: ${value} (${percentage}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No data available for visualization
                  </Typography>
                )}
              </VisualizationErrorBoundary>
            </Paper>
          </Grid>
        ))}
        {rangeVisualizations.map((viz, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {viz.questionText}
              </Typography>
              <VisualizationErrorBoundary>
                {viz.data ? (
                  <ChartWrapper
                    type="line"
                    data={viz.data}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        intersect: false,
                        mode: 'index',
                      },
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Value',
                            font: {
                              size: 12,
                              weight: 'bold',
                            },
                            padding: { top: 10, bottom: 10 },
                          },
                          grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false,
                          },
                          ticks: {
                            font: {
                              size: 11,
                            },
                            padding: 8,
                          },
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Frequency',
                            font: {
                              size: 12,
                              weight: 'bold',
                            },
                            padding: { top: 10, bottom: 10 },
                          },
                          beginAtZero: true,
                          grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false,
                            drawTicks: false,
                          },
                          ticks: {
                            stepSize: 1,
                            font: {
                              size: 11,
                            },
                            padding: 8,
                            callback: function (value) {
                              return value;
                            },
                          },
                          border: {
                            display: false,
                          },
                        },
                      },
                      plugins: {
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleFont: {
                            size: 13,
                            weight: 'bold',
                          },
                          bodyFont: {
                            size: 12,
                          },
                          padding: 10,
                          displayColors: false,
                          callbacks: {
                            title: function (context) {
                              return `Value: ${context[0].label}`;
                            },
                            label: function (context) {
                              return `Frequency: ${context.raw}`;
                            },
                          },
                        },
                        legend: {
                          display: false,
                        },
                      },
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No data available for visualization
                  </Typography>
                )}
              </VisualizationErrorBoundary>
            </Paper>
          </Grid>
        ))}
        {textVisualizations.map((viz, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {viz.questionText}
              </Typography>
              <VisualizationErrorBoundary>
                {viz.words && viz.words.length > 0 ? (
                  <WordCloud
                    data={viz.words}
                    width={400}
                    height={300}
                    font="Arial"
                    fontSize={(word) => word.value}
                    rotate={0}
                    padding={5}
                    random={Math.random}
                    onWordClick={(word) => console.log(`Clicked on ${word.text}`)}
                  />
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: 'center', mt: 4 }}
                  >
                    No words to display
                  </Typography>
                )}
              </VisualizationErrorBoundary>
            </Paper>
          </Grid>
        ))}
        {numericalVisualizations.map((viz, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {viz.questionText}
              </Typography>
              <VisualizationErrorBoundary>
                {viz.data ? (
                  <ChartWrapper
                    type="bar"
                    data={viz.data}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Value Range',
                            font: {
                              size: 12,
                              weight: 'bold',
                            },
                            padding: { top: 10, bottom: 10 },
                          },
                          grid: {
                            display: false,
                          },
                          ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                          },
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Frequency',
                            font: {
                              size: 12,
                              weight: 'bold',
                            },
                            padding: { top: 10, bottom: 10 },
                          },
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1,
                          },
                        },
                      },
                      plugins: {
                        tooltip: {
                          callbacks: {
                            title: function (context) {
                              return `Range: ${context[0].label}`;
                            },
                            label: function (context) {
                              return `Count: ${context.raw}`;
                            },
                          },
                        },
                        legend: {
                          display: false,
                        },
                      },
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No data available for visualization
                  </Typography>
                )}
              </VisualizationErrorBoundary>
            </Paper>
          </Grid>
        ))}
        {checkboxVisualizations.map((viz, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {viz.questionText}
              </Typography>
              <VisualizationErrorBoundary>
                {viz.data ? (
                  <ChartWrapper
                    type="bar"
                    data={viz.data}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Percentage',
                            font: {
                              size: 12,
                              weight: 'bold',
                            },
                            padding: { top: 10, bottom: 10 },
                          },
                          grid: {
                            display: false,
                          },
                          ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                          },
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Options',
                            font: {
                              size: 12,
                              weight: 'bold',
                            },
                            padding: { top: 10, bottom: 10 },
                          },
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1,
                          },
                        },
                      },
                      plugins: {
                        tooltip: {
                          callbacks: {
                            title: function (context) {
                              return `Option: ${context[0].label}`;
                            },
                            label: function (context) {
                              return `Percentage: ${viz.percentages[context.dataIndex]}%`;
                            },
                          },
                        },
                        legend: {
                          display: false,
                        },
                      },
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No data available for visualization
                  </Typography>
                )}
              </VisualizationErrorBoundary>
            </Paper>
          </Grid>
        ))}
        {dateVisualizations.map((viz, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {viz.questionText}
              </Typography>
              <VisualizationErrorBoundary>
                {viz.data ? (
                  <ChartWrapper
                    type="line"
                    data={viz.data}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        x: {
                          type: 'linear',
                          position: 'bottom',
                          title: {
                            display: true,
                            text: 'Date',
                            font: {
                              size: 12,
                              weight: 'bold',
                            },
                            padding: { top: 10, bottom: 10 },
                          },
                          min: viz.minTimestamp,
                          max: viz.maxTimestamp,
                          ticks: {
                            callback: function (value) {
                              return new Date(value).toLocaleDateString('default', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              });
                            },
                            maxRotation: 45,
                            minRotation: 45,
                          },
                          grid: {
                            display: false,
                          },
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Number of Responses',
                            font: {
                              size: 12,
                              weight: 'bold',
                            },
                            padding: { top: 10, bottom: 10 },
                          },
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1,
                          },
                        },
                      },
                      plugins: {
                        tooltip: {
                          callbacks: {
                            title: function (context) {
                              return `Date: ${new Date(context[0].parsed.x).toLocaleDateString()}`;
                            },
                            label: function (context) {
                              return `Responses: ${context.parsed.y}`;
                            },
                          },
                        },
                        legend: {
                          display: false,
                        },
                      },
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No data available for visualization
                  </Typography>
                )}
              </VisualizationErrorBoundary>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <>
      {/* Top controls area with form selector and export button */}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Show error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          {/* Form selector and export button */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} md={6}>
                <Typography variant="body2" gutterBottom>
                  Select a form to view responses:
                </Typography>
                <select
                  value={selectedFormId}
                  onChange={handleFormChange}
                  style={{
                    padding: '8px 12px',
                    width: '100%',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                >
                  <option value="">Select...</option>
                  {forms.map((form) => (
                    <option key={form._id} value={form.FormID}>
                      {form.title}
                    </option>
                  ))}
                </select>
              </Grid>
              <Grid
                item
                xs={12}
                md={6}
                sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}
              >
                <Button
                  variant="contained"
                  onClick={handleExportCSV}
                  disabled={!selectedFormId || filteredResponses.length === 0}
                  startIcon={<GetAppIcon />}
                >
                  Export as CSV
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Filters area - only shown when a form is selected */}
          {selectedFormId && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
              >
                <Typography variant="h6">Filter Responses</Typography>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={hideEmptyColumns}
                        onChange={(e) => setHideEmptyColumns(e.target.checked)}
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="body2">Hide columns with no data</Typography>
                    }
                  />
                  <Tooltip title="When enabled, columns where all responses have empty values will be hidden from the table and export">
                    <IconButton size="small">
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowFilters(!showFilters)}
                  startIcon={showFilters ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </Box>

              <Collapse in={showFilters}>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Enter expected answers below to filter responses. Leave blank to match any answer.
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={hideEmptyColumns}
                        onChange={(e) => setHideEmptyColumns(e.target.checked)}
                        size="small"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          Hide empty columns
                        </Typography>
                        <Tooltip title="Hide questions where all responses have empty values">
                          <InfoOutlinedIcon fontSize="small" />
                        </Tooltip>
                      </Box>
                    }
                  />
                </Box>

                {/* Section-based question filters */}
                <Box sx={{ mb: 2 }}>
                  {Object.entries(getQuestionsForFilter()).map(([sectionName, questions], index) => {
                    const isExpanded = expandedSections[sectionName] !== false; // Default to expanded

                    return (
                      <Paper
                        key={sectionName}
                        variant="outlined"
                        sx={{
                          mb: 2,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          onClick={() => handleSectionToggle(sectionName)}
                          sx={{
                            p: 1.5,
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="medium">
                            {sectionName} ({questions.length})
                          </Typography>
                          <IconButton size="small" sx={{ color: 'inherit' }}>
                            {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                        </Box>

                        <Collapse in={isExpanded}>
                          <Box sx={{ p: 2 }}>
                            {questions.map((question) => (
                              <Box
                                key={question.id}
                                sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight="medium"
                                  sx={{ mb: 1 }}
                                >
                                  {question.text}
                                </Typography>

                                {question.type === 'checkbox' ? (
                                  <FormControl fullWidth size="small">
                                    <Select
                                      value={filterCriteria[question.id] || ''}
                                      onChange={(e) =>
                                        handleFilterChange(question.id, e.target.value)
                                      }
                                      displayEmpty
                                      sx={{ width: '100%' }}
                                    >
                                      <MenuItem value="">
                                        <em>Any answer</em>
                                      </MenuItem>
                                      {question.options.map((option) => (
                                        <MenuItem key={option} value={option}>
                                          {option}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                ) : question.type === 'date' ? (
                                  <TextField
                                    type="date"
                                    fullWidth
                                    size="small"
                                    value={filterCriteria[question.id] || ''}
                                    onChange={(e) =>
                                      handleFilterChange(question.id, e.target.value)
                                    }
                                    InputLabelProps={{
                                      shrink: true,
                                    }}
                                  />
                                ) : question.type === 'mcq' &&
                                  question.options &&
                                  question.options.length > 0 ? (
                                  <FormControl fullWidth size="small">
                                    <Select
                                      value={filterCriteria[question.id] || ''}
                                      onChange={(e) =>
                                        handleFilterChange(question.id, e.target.value)
                                      }
                                      displayEmpty
                                      sx={{ width: '100%' }}
                                    >
                                      <MenuItem value="">
                                        <em>Any answer</em>
                                      </MenuItem>
                                      {question.options.map((option) => (
                                        <MenuItem key={option} value={option}>
                                          {option}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                ) : (
                                  <TextField
                                    placeholder="Expected answer"
                                    fullWidth
                                    size="small"
                                    value={filterCriteria[question.id] || ''}
                                    onChange={(e) =>
                                      handleFilterChange(question.id, e.target.value)
                                    }
                                  />
                                )}
                              </Box>
                            ))}
                          </Box>
                        </Collapse>
                      </Paper>
                    );
                  })}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button variant="outlined" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <Button
                    variant="contained"
                    onClick={applyFilters}
                    startIcon={<FilterListIcon />}
                  >
                    Apply Filters
                  </Button>
                </Box>
              </Collapse>

              {/* Filter stats when filters are applied */}
              {isFilterApplied && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterListIcon fontSize="small" color="primary" />
                  <Typography variant="body2">
                    Showing {filteredResponses.length} of{' '}
                    {responses.filter((r) => r.formId === parseInt(selectedFormId)).length}{' '}
                    responses
                  </Typography>
                  {Object.values(filterCriteria).some(
                    (value) => value && value.trim() !== ''
                  ) && (
                    <Button size="small" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </Box>
              )}
            </Paper>
          )}

          {/* Add navigation tabs */}
          <Box sx={{ mt: 3 }}>
            <Tabs
              value={activeView}
              onChange={(e, newValue) => setActiveView(newValue)}
              indicatorColor="primary"
              textColor="primary"
              centered
            >
              <Tab label="Responses" value="responses" />
              <Tab label="Visualizations" value="visualizations" />
            </Tabs>
          </Box>

          {/* Content based on active tab */}
          <Box sx={{ mt: 2 }}>
            {activeView === 'responses' && renderResponseTable()}
            {activeView === 'visualizations' && renderVisualizations()}
          </Box>
        </>
      )}

      {renderAudioFilesDialog()}
    </>
  );
};

const FormUploadPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  const handleTabChange = (_event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      // Call logout API
      await axios.post(`${API_URL}/web_dashboard_users/logout`, {}, { withCredentials: true });

      // Clear localStorage
      localStorage.removeItem('userInfo');

      // Redirect to login
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear localStorage and redirect even if API call fails
      localStorage.removeItem('userInfo');
      navigate('/login');
    }
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Form Management Dashboard
          </Typography>
          {/* User profile menu */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              {userInfo.username || userInfo.email || 'User'}
            </Typography>
            <IconButton
              color="inherit"
              onClick={handleMenuClick}
              aria-controls="user-menu"
              aria-haspopup="true"
            >
              <AccountCircleIcon />
            </IconButton>
            <Menu
              id="user-menu"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4, mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Forms" />
          <Tab label="Responses" />
        </Tabs>
        <Box sx={{ mt: 4 }}>
          {activeTab === 0 && <FormsTab />}
          {activeTab === 1 && <ResponsesTab />}
        </Box>
      </Container>
    </Box>
  );
};

export default FormUploadPage;
