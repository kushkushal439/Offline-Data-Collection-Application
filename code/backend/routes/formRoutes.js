import express from 'express';
import multer from 'multer';
import { convertExcelToFormData } from '../utils/excelConverter.js';
import Form from '../models/Form.js';
import Response from '../models/Response.js';
import authenticateMobile from '../middleware/authenticatemobile.js';
import authenticateUser from '../middleware/authenticate.js';
import User from '../models/Users.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            cb(null, true);
        } else {
            cb(new Error('Only .xlsx files are allowed'), false);
        }
    }
});

// Route to upload Excel file and create form - no auth required
router.post('/upload-excel', authenticateUser, upload.single('formFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Convert Excel file to form data
        const formData = convertExcelToFormData(req.file.buffer);
        
        // For now, assign a default userId or omit if your schema allows
        // formData.userId = "000000000000000000000000"; // Default ObjectId or whatever makes sense for your app

        // Create and save new form
        const newForm = new Form(formData);
        newForm.Creator = req.user._id;
        const savedForm = await newForm.save();

        res.status(201).json({
            message: 'Form created successfully',
            form: savedForm
        });
    } catch (error) {
        console.error('Form upload error:', error);
        res.status(500).json({ 
            error: 'Failed to process form upload',
            details: error.message 
        });
    }
});

// Get all forms - no auth required
router.get('/', async (req, res) => {
    try {
        const forms = await Form.find();
        res.json(forms);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve forms' });
    }
});

router.get('/CreatedForms', authenticateUser, async (req, res) => {
    try {
        // Check if user is authenticated and req.user exists
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'User not authenticated properly' });
        }

        // Query for forms where Creator matches the authenticated user's ID
        const forms = await Form.find({ Creator: req.user._id }).populate('UsersWithAccess', 'Username Email');
        
        // Log for debugging
        // console.log(`Found ${forms.length} forms created by user ${req.user._id}`);
        
        res.json(forms);
    } catch (error) {
        console.error('Error fetching created forms:', error);
        res.status(500).json({ error: 'Failed to retrieve forms', details: error.message });
    }
});

router.get('/AvailableForms', authenticateMobile, async (req, res) => {
    console.log(req.user);
    try {
        const userId = req.user._id;
        const forms = await Form.find({
            UsersWithAccess: { $in: [userId] }
        });
        res.json(forms);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve available forms',
            details: error.message 
        });
    }
});

// Get a specific form by ID - no auth required
router.get('/:id', async (req, res) => {
    try {
        const form = await Form.findById(req.params.id);
        
        if (!form) {
            return res.status(404).json({ error: 'Form not found' });
        }
        
        res.json(form);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve form' });
    }
});

// Delete a form - no auth required
router.delete('/:id', async (req, res) => {
    try {
        const form = await Form.findByIdAndDelete(req.params.id);
        
        if (!form) {
            return res.status(404).json({ error: 'Form not found' });
        }
        
        res.json({ message: 'Form deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete form' });
    }
});


// Add a user (by email) to form access
router.post('/:id/access', authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const { email } = req.body;
  
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
  
      // Find the form
      const form = await Form.findById(id);
      
      // Check form exists
      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }
      
      // Check if user is the creator
      if (form.Creator.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to manage this form' });
      }
      
      // Find the user by email
      const user = await User.findOne({ Email: email.toLowerCase() });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found with this email' });
      }
      
      // Check if user already has access
      if (form.UsersWithAccess.includes(user._id)) {
        return res.status(400).json({ error: 'User already has access to this form' });
      }
      
      // Add user to access list
      form.UsersWithAccess.push(user._id);
      
      // Save the form
      await form.save();
      
      // Return the updated form with populated users
      const updatedForm = await Form.findById(id).populate('UsersWithAccess', 'Username Email');
      
      res.json({ 
        message: 'User access added successfully',
        form: updatedForm
      });
    } catch (error) {
      console.error('Error adding form access:', error);
      res.status(500).json({ error: 'Failed to add form access' });
    }
  });
  
  // Remove a user from form access
  router.delete('/:id/access/:userId', authenticateUser, async (req, res) => {
    try {
      const { id, userId } = req.params;
      
      // Find the form
      const form = await Form.findById(id);
      
      // Check form exists
      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }
      
      // Check if user is the creator
      if (form.Creator.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to manage this form' });
      }
      
      // Remove user from access list
      form.UsersWithAccess = form.UsersWithAccess.filter(
        id => id.toString() !== userId
      );
      
      // Save the form
      await form.save();
      
      // Return the updated form with populated users
      const updatedForm = await Form.findById(id).populate('UsersWithAccess', 'Username Email');
      
      res.json({ 
        message: 'User access removed successfully',
        form: updatedForm
      });
    } catch (error) {
      console.error('Error removing form access:', error);
      res.status(500).json({ error: 'Failed to remove form access' });
    }
  });

router.post('/syncentries', async (req, res) => {
    try {
        // req.body should be an array of form submissions
        const submissions = req.body;
        
        if (!Array.isArray(submissions)) {
            return res.status(400).json({ error: 'Expected an array of submissions' });
        }
        
        if (submissions.length === 0) {
            return res.status(400).json({ error: 'No submissions provided' });
        }
        
        // Save each submission
        const savedSubmissions = [];
        const responseMapping = [];
        
        for (const submission of submissions) {
            const formResponse = new Response({
                FormID: submission.FormID,
                answers: submission.answers,
                submissionDate: submission.submissionDate,
                submissionTime: submission.submissionTime,
                submittedBy: req.user?._id, // Add the user ID if available
                localSubmissionId: submission.submissionId // Store the local ID
            });
            
            const savedSubmission = await formResponse.save();
            savedSubmissions.push(savedSubmission);
            
            // Add mapping between local and server IDs
            if (submission.submissionId) {
                responseMapping.push({
                    localId: submission.submissionId,
                    serverId: savedSubmission._id.toString()
                });
            }
        }
        
        res.status(201).json({
            message: `Successfully saved ${savedSubmissions.length} submissions`,
            count: savedSubmissions.length,
            responses: responseMapping // Return the ID mapping for file uploads
        });
    } catch (error) {
        console.error('Error syncing entries:', error);
        res.status(500).json({ error: 'Failed to sync entries: ' + error.message });
    }
});

export default router;