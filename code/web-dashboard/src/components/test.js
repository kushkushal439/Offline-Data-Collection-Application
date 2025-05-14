import React, { useState, useEffect } from 'react';
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
  Grid
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import axios from 'axios';
import FilterListIcon from '@mui/icons-material/FilterList';
import GetAppIcon from '@mui/icons-material/GetApp';

import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const FormsTab = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [forms, setForms] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await axios.get(`${API_URL}/forms`);
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
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadStatus({
        success: true,
        message: 'Form uploaded successfully!',
        form: response.data.form
      });
      // Refresh forms list after successful upload
      fetchForms();
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus({
        success: false,
        message: err.response?.data?.error || 'Upload failed. Please try again.'
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
        await axios.delete(`${API_URL}/forms/${id}`);
        setForms(forms.filter((form) => form._id !== id));
      } catch (err) {
        console.error('Error deleting form:', err);
        setError('Failed to delete form. Please try again.');
      }
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
                  <TableCell align="right">
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteForm(form._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
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

  useEffect(() => {
    fetchFormsAndResponses();
  }, []);


  // Modify the useEffect that sets filteredResponses
  useEffect(() => {
    if (selectedFormId) {
      let filtered = responses.filter(resp => resp.formId === parseInt(selectedFormId));

      // Apply additional filters if they exist
      if (isFilterApplied && Object.keys(filterCriteria).length > 0) {
        filtered = filtered.filter(response => {
          // Check each filter criterion
          for (const questionId in filterCriteria) {
            const expectedAnswer = filterCriteria[questionId].trim();
            // Skip empty filter criteria
            if (!expectedAnswer) continue;

            const actualAnswer = String(response.answers[questionId] || '').trim();
            // If this criterion doesn't match, exclude the response
            if (actualAnswer !== expectedAnswer) {
              return false;
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
    setFilterCriteria(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const applyFilters = () => {
    setIsFilterApplied(true);
  };

  const clearFilters = () => {
    setFilterCriteria({});
    setIsFilterApplied(false);
  };


  useEffect(() => {
    if (selectedFormId) {
      setFilteredResponses(responses.filter(resp => resp.formId === parseInt(selectedFormId)));
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
        axios.get(`${API_URL}/forms`),
        axios.get(`${API_URL}/responses`)
      ]);

      setForms(formsRes.data || []);
      setResponses(responsesRes.data || []);
      setFilteredResponses(responsesRes.data || []);

      // Create a map of form questions for easy access
      const questionMap = {};
      formsRes.data.forEach(form => {
        questionMap[form.FormID] = {};
        form.Questions.forEach(q => {
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
    const emptyColumns = questionIds.filter(questionId => {
      return filteredResponses.every(response => {
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
    let questions = Object.entries(formQuestionMap[selectedFormId])
    .map(([id, text]) => ({
      id,
      text
    }));

    if (hideEmptyColumns) {
      const emptyColumns = getEmptyColumns();
      questions = questions.filter(question => !emptyColumns.includes(question.id));
    }

    return questions;
  };

  const getQuestionsForFilter = () => {
    // if (!selectedFormId || !formQuestionMap[selectedFormId]) return [];

    // // Get all questions for the selected form
    // return Object.entries(formQuestionMap[selectedFormId])
    //   .map(([id, text]) => ({
    //     id,
    //     text
    //   }));
    if (!selectedFormId || !formQuestionMap[selectedFormId]) return [];
    // Get all questions for the selected form, excluding empty ones
    let questions = Object.entries(formQuestionMap[selectedFormId])
    .map(([id, text]) => ({
      id,
      text
    }));

    if (hideEmptyColumns) {
      const emptyColumns = getEmptyColumns();
      questions = questions.filter(question => !emptyColumns.includes(question.id));
    }

    return questions;

  };

  // const escapeCSV = (field) => {
  //   if (field == null) return '';
  //   let output = String(field);
  //   if (output.search(/("|,|\n)/g) >= 0) {
  //     output = '"' + output.replace(/"/g, '""') + '"';
  //   }
  //   return output;
  // };

  // const generateCSV = (items) => {
  //   if (!selectedFormId || items.length === 0) {
  //     return '';
  //   }

  //   // Get question columns for the selected form
  //   const questionColumns = getQuestionColumns();
  //   const header = ['Response ID', 'Submitted At', ...questionColumns.map(q => q.text)];

  //   const rows = items.map((resp) => {
  //     const rowData = [resp._id, new Date(resp.submittedAt).toLocaleString()];

  //     // Add answer for each question
  //     questionColumns.forEach(q => {
  //       const answer = resp.answers[q.id] || '';
  //       rowData.push(answer);
  //     });

  //     return rowData;
  //   });

  //   const csvLines = [header.join(','), ...rows.map((row) => row.map(escapeCSV).join(','))];
  //   return csvLines.join('\n');
  // };

  const handleExportCSV = () => {
    if (!selectedFormId || filteredResponses.length === 0) return;

    // Get non-empty question columns for the selected form
    const questionColumns = getQuestionColumns();

    // Create header row
    const header = questionColumns.map(col => `"${col.text.replace(/"/g, '""')}"`);

    // Create rows for each response
    const rows = filteredResponses.map(response => {
      return questionColumns.map(column => {
        const value = response.answers[column.id] || '';
        // Escape quotes for CSV
        return `"${String(value).replace(/"/g, '""')}"`;
      });
    });

    // Combine header and rows
    const csvContent = [header, ...rows].map(row => row.join(',')).join('\n');

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
                  {questionColumns.map((col) => (
                    <TableCell key={col.id} sx={{ wordBreak: 'break-word' }}>
                      {resp.answers[col.id] || ''}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3 + questionColumns.length}>
                    <Collapse in={expandedRows.has(resp._id)} timeout="auto" unmountOnExit>
                      <Box margin={2}>
                        <Typography variant="subtitle1" gutterBottom>
                          Raw Answer Data
                        </Typography>
                        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflowX: 'auto' }}>
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
                    border: '1px solid #ccc'
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
              <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Filter Responses
                </Typography>
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
                      <Typography variant="body2">
                        Hide columns with no data
                      </Typography>
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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter expected answers below to filter responses. Leave blank to match any answer.
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
                  {getQuestionsForFilter().map(question => (
                    <Box key={question.id} sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" fontWeight="medium" noWrap title={question.text} sx={{ mb: 0.5 }}>
                        {question.text.length > 40 ? `${question.text.substring(0, 40)}...` : question.text}
                      </Typography>
                      <input
                        style={{
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #ccc',
                          fontSize: '0.875rem'
                        }}
                        placeholder="Expected answer"
                        value={filterCriteria[question.id] || ''}
                        onChange={(e) => handleFilterChange(question.id, e.target.value)}
                      />
                    </Box>
                  ))}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button variant="outlined" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <Button variant="contained" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </Box>
              </Collapse>

              {/* Filter stats when filters are applied */}
              {isFilterApplied && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterListIcon fontSize="small" color="primary" />
                  <Typography variant="body2">
                    Showing {filteredResponses.length} of {responses.filter(r => r.formId === parseInt(selectedFormId)).length} responses
                  </Typography>
                  {Object.values(filterCriteria).some(value => value && value.trim() !== '') && (
                    <Button size="small" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </Box>
              )}
            </Paper>
          )}


          {/* Response table */}
          {renderResponseTable()}
        </>
      )}

    </>





  );
};

const FormUploadPage = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Form Management Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4, mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
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