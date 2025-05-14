import express from 'express';
import Response from '../models/Response.js';
import authenticateUser from '../middleware/authenticate.js';
import asyncHandler from '../utils/asyncHandler.js';
import Form from '../models/Form.js';

const router = express.Router();

// Helper function to safely format date
const formatSubmissionDate = (response) => {
  try {
    // First priority: use submissionDate and submissionTime if both exist and are valid
    if (response.submissionDate && response.submissionTime) {
      const dateStr = `${response.submissionDate.trim()} ${response.submissionTime.trim()}`;
      const date = new Date(dateStr);
      
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    // Second priority: Use the document's timestamps
    if (response.createdAt) {
      return new Date(response.createdAt).toISOString();
    }
    
    // Last resort: current time
    return new Date().toISOString();
  } catch (error) {
    console.error('Error formatting date:', error);
    // Use document timestamp as fallback
    return response.createdAt ? 
      new Date(response.createdAt).toISOString() : 
      new Date().toISOString();
  }
};

router.get('/', authenticateUser, asyncHandler(async (req, res) => {
  try {
    // First get all forms created by this user
    const userForms = await Form.find({ Creator: req.user._id }).select('FormID');
    const userFormIds = userForms.map(form => form.FormID);
    
    // Then find responses only for those forms
    const responses = await Response.find({ FormID: { $in: userFormIds } });
    
    // Transform responses to match expected format in the frontend
    const formattedResponses = responses.map(response => ({
      _id: response._id,
      formId: response.FormID,
      submittedAt: formatSubmissionDate(response),
      answers: response.answers
    }));
    
    res.json(formattedResponses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to retrieve responses' });
  }
}));

// Get responses for a specific form - verify form belongs to user first
router.get('/form/:formId', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const { formId } = req.params;
    
    // Convert to Number if FormID is stored as a number
    const formIdNum = Number(formId);
    
    // Check if the form belongs to the logged-in user
    const formExists = await Form.findOne({ 
      FormID: formIdNum, 
      Creator: req.user._id 
    });
    
    if (!formExists) {
      return res.status(403).json({ error: 'You do not have permission to access responses for this form' });
    }
    
    // Get responses for this form
    const responses = await Response.find({ FormID: formIdNum });
    
    // Transform responses to match expected format in the frontend
    const formattedResponses = responses.map(response => ({
      _id: response._id,
      formId: response.FormID,
      submittedAt: formatSubmissionDate(response),
      answers: response.answers
    }));
    
    res.json(formattedResponses);
  } catch (error) {
    console.error('Error fetching form responses:', error);
    res.status(500).json({ error: 'Failed to retrieve form responses' });
  }
}));

// Get a specific response by ID - verify form belongs to user first
router.get('/:id', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const response = await Response.findById(req.params.id);
    
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }
    
    // Check if the form this response belongs to was created by the logged-in user
    const formExists = await Form.findOne({ 
      FormID: response.FormID, 
      Creator: req.user._id 
    });
    
    if (!formExists) {
      return res.status(403).json({ error: 'You do not have permission to access this response' });
    }
    
    // Transform to match expected format
    const formattedResponse = {
      _id: response._id,
      formId: response.FormID,
      submittedAt: formatSubmissionDate(response),
      answers: response.answers
    };
    
    res.json(formattedResponse);
  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({ error: 'Failed to retrieve response' });
  }
}));

// Delete a specific response - verify form belongs to user first
router.delete('/:id', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const response = await Response.findById(req.params.id);
    
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }
    
    // Check if the form this response belongs to was created by the logged-in user
    const formExists = await Form.findOne({ 
      FormID: response.FormID, 
      Creator: req.user._id 
    });
    
    if (!formExists) {
      return res.status(403).json({ error: 'You do not have permission to delete this response' });
    }
    
    // Now that we've verified ownership, delete the response
    await Response.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Response deleted successfully' });
  } catch (error) {
    console.error('Error deleting response:', error);
    res.status(500).json({ error: 'Failed to delete response' });
  }
}));

export default router;