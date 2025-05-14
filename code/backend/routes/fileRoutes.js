import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import File from '../models/File.js';
import Form from '../models/Form.js';
import Response from '../models/Response.js';
import authenticateUser from '../middleware/authenticate.js';
import authenticateMobile from '../middleware/authenticatemobile.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/Users.js';

const router = express.Router();

// Configure multer for file uploads (temporary storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept images and common document types
    if (file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'video/mp4' ||
      file.mimetype.startsWith('audio/')) { // Allow all audio types
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// Initialize GridFS bucket
let gridFSBucket;
mongoose.connection.once('open', () => {
  gridFSBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'files'
  });
});

// Helper function to check file access
const hasFileAccess = async (userId, fileId) => {
  const file = await File.findById(fileId);
  if (!file) return false;
  
  // Check if user is in usersWithAccess array
  if (file.usersWithAccess.some(id => id.toString() === userId.toString())) return true;
  
  // Check if user is the creator or has access to the form
  const form = await Form.findOne({ FormID: file.formId });
  if (!form) return false;
  
  return form.Creator.toString() === userId.toString() || 
         form.UsersWithAccess.some(id => id.toString() === userId.toString());
};

// Upload a file (from mobile app)
router.post('/upload', authenticateMobile, upload.single('file'), asyncHandler(async (req, res) => {
  if (!gridFSBucket) {
    res.status(500);
    throw new Error('Database connection not ready');
  }

  const { formId, responseId, questionId } = req.body;
  
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }
  
  if (!formId || !responseId || !questionId) {
    res.status(400);
    throw new Error('Missing required information (formId, responseId, or questionId)');
  }

  let response = null;
  
  // Check if responseId is a valid MongoDB ObjectId
  const isValidObjectId = mongoose.Types.ObjectId.isValid(responseId);
  
  if (isValidObjectId) {
    // If it's a valid ObjectId, try to find the response directly
    response = await Response.findById(responseId);
  } else {
    // If it's not a valid ObjectId (like a local submission ID from the mobile app)
    // Find the most recent response for this form
    response = await Response.findOne({ 
      FormID: parseInt(formId)
    }).sort({ createdAt: -1 });
  }

  if (!response) {
    // If no response found, create a temporary placeholder response
    const newResponse = new Response({
      FormID: parseInt(formId),
      answers: {},
      submissionDate: new Date().toLocaleDateString(),
      submissionTime: new Date().toLocaleTimeString(),
      submittedBy: req.user._id,
      localSubmissionId: responseId // Store the local submission ID
    });
    
    response = await newResponse.save();
  }

  // Create a unique filename
  const uniqueFilename = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
  
  try {
    // Use a Promise to handle the GridFS stream
    const fileId = await new Promise((resolve, reject) => {
      // Create a stream to upload to GridFS
      const uploadStream = gridFSBucket.openUploadStream(uniqueFilename, {
        contentType: req.file.mimetype
      });
      
      // Write file buffer to the upload stream
      uploadStream.once('error', reject);
      uploadStream.end(req.file.buffer, () => {
        // When upload completes, resolve with the file's ID
        resolve(uploadStream.id);
      });
    });
    
    // Now create the metadata document using the returned fileId
    const newFile = new File({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      size: req.file.size,
      fileId: fileId,  // Use the fileId from the uploadStream
      formId: parseInt(formId),
      responseId: response._id, // Use the ObjectId of the response we found or created
      questionId: questionId,
      localSubmissionId: responseId, // Store the local submission ID for reference
      usersWithAccess: [req.user._id] // Initially, only the uploader has access
    });
    
    await newFile.save();
    
    res.status(201).json({
      success: true,
      fileId: newFile._id,
      filename: newFile.filename,
      size: newFile.size,
      contentType: newFile.contentType,
      uploadDate: newFile.uploadDate
    });
  } catch (error) {
    console.error("GridFS upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}));

// Get all files for a specific form (web dashboard)
router.get('/form/:formId', authenticateUser, asyncHandler(async (req, res) => {
  const formId = parseInt(req.params.formId);
  
  // Check if user has access to this form
  const form = await Form.findOne({ FormID: formId });
  
  if (!form) {
    res.status(404);
    throw new Error('Form not found');
  }
  
  // Check if user is creator or has access
  const isCreator = form.Creator.toString() === req.user._id.toString();
  const hasAccess = form.UsersWithAccess.some(id => id.toString() === req.user._id.toString());
  
  if (!isCreator && !hasAccess) {
    res.status(403);
    throw new Error('You do not have permission to access files for this form');
  }
  
  // Get files metadata (without actual file data)
  const files = await File.find({ formId })
    .populate({
      path: 'usersWithAccess',
      select: 'Username Email'
    });
  
  res.status(200).json({
    success: true,
    files
  });
}));

// Get all files for a specific response
router.get('/response/:responseId', authenticateUser, asyncHandler(async (req, res) => {
  const { responseId } = req.params;
  
  // Find response
  const response = await Response.findById(responseId);
  if (!response) {
    res.status(404);
    throw new Error('Response not found');
  }
  
  // Check if user has access to the form this response belongs to
  const form = await Form.findOne({ FormID: response.FormID });
  if (!form) {
    res.status(404);
    throw new Error('Associated form not found');
  }
  
  const isCreator = form.Creator.toString() === req.user._id.toString();
  const hasAccess = form.UsersWithAccess.some(id => id.toString() === req.user._id.toString());
  
  if (!isCreator && !hasAccess) {
    res.status(403);
    throw new Error('You do not have permission to access files for this response');
  }
  
  // Get files metadata (without actual file data)
  const files = await File.find({ responseId })
    .populate({
      path: 'usersWithAccess',
      select: 'Username Email'
    });
  
  res.status(200).json({
    success: true,
    files
  });
}));

// Download/view a specific file
router.get('/:id', authenticateUser, asyncHandler(async (req, res) => {
  if (!gridFSBucket) {
    res.status(500);
    throw new Error('Database connection not ready');
  }

  const { id } = req.params;
  
  // Check access
  const hasAccess = await hasFileAccess(req.user._id, id);
  
  if (!hasAccess) {
    res.status(403);
    throw new Error('You do not have permission to access this file');
  }
  
  const file = await File.findById(id);
  
  if (!file) {
    res.status(404);
    throw new Error('File not found');
  }
  
  // Set appropriate headers for file download
  res.set({
    'Content-Type': file.contentType,
    'Content-Disposition': `inline; filename="${file.filename}"`,
    'Content-Length': file.size
  });
  
  // Create a download stream and pipe it to the response
  const downloadStream = gridFSBucket.openDownloadStream(file.fileId);
  
  // Handle download errors
  downloadStream.on('error', (error) => {
    res.status(404).json({ error: 'File not found in storage' });
  });
  
  // Pipe the file stream to the response
  downloadStream.pipe(res);
}));

// Delete a file
router.delete('/:id', authenticateUser, asyncHandler(async (req, res) => {
    if (!gridFSBucket) {
      res.status(500);
      throw new Error('Database connection not ready');
    }
  
    const { id } = req.params;
    
    const file = await File.findById(id);
    
    if (!file) {
      res.status(404);
      throw new Error('File not found');
    }
    
    // Check if user is the creator of the associated form
    const form = await Form.findOne({ FormID: file.formId });
    
    if (!form || form.Creator.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('You do not have permission to delete this file');
    }
    
    // Delete the file metadata first (which is what matters for the application)
    const gridFSFileId = file.fileId.toString();
    await File.findByIdAndDelete(id);
    
    // Try to delete the GridFS file, but don't throw errors if it fails
    try {
      // Use the callback API for GridFS delete to avoid uncaught promise rejections
      gridFSBucket.delete(
        mongoose.Types.ObjectId.createFromHexString(gridFSFileId), 
        (error) => {
          if (error) {
            console.log("GridFS delete warning (non-fatal):", error.message);
            // We're intentionally not propagating this error
          }
        }
      );
    } catch (gridFsError) {
      // Just log the error but don't fail the request
      console.log("Error in GridFS delete (non-fatal):", gridFsError.message);
    }
    
    res.status(200).json({
      success: true,
      message: 'File metadata deleted successfully'
    });
  }));


// Grant access to a file
router.post('/:id/access', authenticateUser, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }
  
  const file = await File.findById(id);
  
  if (!file) {
    res.status(404);
    throw new Error('File not found');
  }
  
  // Check if user is the creator of the associated form
  const form = await Form.findOne({ FormID: file.formId });
  
  if (!form || form.Creator.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You do not have permission to manage access for this file');
  }
  
  // Find user by email
  const user = await User.findOne({ Email: email.toLowerCase() });
  
  if (!user) {
    res.status(404);
    throw new Error('User not found with this email');
  }
  
  // Check if user already has access
  if (file.usersWithAccess.some(id => id.toString() === user._id.toString())) {
    res.status(400);
    throw new Error('User already has access to this file');
  }
  
  // Add user to access list
  file.usersWithAccess.push(user._id);
  await file.save();
  
  // Return updated file with populated users
  const updatedFile = await File.findById(id)
    .populate({
      path: 'usersWithAccess',
      select: 'Username Email'
    });
  
  res.status(200).json({
    success: true,
    message: 'Access granted successfully',
    file: updatedFile
  });
}));

// Remove access from a file
router.delete('/:id/access/:userId', authenticateUser, asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  
  const file = await File.findById(id);
  
  if (!file) {
    res.status(404);
    throw new Error('File not found');
  }
  
  // Check if user is the creator of the associated form
  const form = await Form.findOne({ FormID: file.formId });
  
  if (!form || form.Creator.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You do not have permission to manage access for this file');
  }
  
  // Remove user from access list
  file.usersWithAccess = file.usersWithAccess.filter(id => id.toString() !== userId);
  await file.save();
  
  // Return updated file with populated users
  const updatedFile = await File.findById(id)
    .populate({
      path: 'usersWithAccess',
      select: 'Username Email'
    });
  
  res.status(200).json({
    success: true,
    message: 'Access removed successfully',
    file: updatedFile
  });
}));

// Upload file from web dashboard
router.post('/web-upload', authenticateUser, upload.single('file'), asyncHandler(async (req, res) => {
  if (!gridFSBucket) {
    res.status(500);
    throw new Error('Database connection not ready');
  }

  const { formId, responseId, questionId } = req.body;
  
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }
  
  if (!formId || !responseId || !questionId) {
    res.status(400);
    throw new Error('Missing required information');
  }

  // Check if user has access to the form
  const form = await Form.findOne({ FormID: parseInt(formId) });
  
  if (!form) {
    res.status(404);
    throw new Error('Form not found');
  }
  
  if (form.Creator.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You do not have permission to upload files to this form');
  }

  // Create a unique filename
  const uniqueFilename = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
  
  try {
    // Use a Promise to handle the GridFS stream
    const fileId = await new Promise((resolve, reject) => {
      // Create a stream to upload to GridFS
      const uploadStream = gridFSBucket.openUploadStream(uniqueFilename, {
        contentType: req.file.mimetype
      });
      
      // Write file buffer to the upload stream
      uploadStream.once('error', reject);
      uploadStream.end(req.file.buffer, () => {
        // When upload completes, resolve with the file's ID
        resolve(uploadStream.id);
      });
    });
    
    // Now create the metadata document using the returned fileId
    const newFile = new File({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      size: req.file.size,
      fileId: fileId,  // Use the fileId from the uploadStream
      formId: parseInt(formId),
      responseId: responseId,
      questionId: questionId,
      usersWithAccess: [req.user._id] // Initially, only the uploader has access
    });
    
    await newFile.save();
    
    res.status(201).json({
      success: true,
      fileId: newFile._id,
      filename: newFile.filename,
      size: newFile.size,
      contentType: newFile.contentType,
      uploadDate: newFile.uploadDate
    });
  } catch (error) {
    console.error("GridFS upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}));

export default router;