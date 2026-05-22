import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

app.use(express.json());

// Create uploads directory structure
const uploadDirs = [
  'uploads/candidates/profile_pictures',
  'uploads/candidates/cvs',
  'uploads/jobs'
];

uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Multer storage configurations
const createStorage = (subdir) => multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, subdir);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${timestamp}-${originalName}`);
  }
});

// File filter functions
const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF files are allowed.'));
  }
};

const uploaders = {
  profilePicture: multer({ 
    storage: createStorage('uploads/candidates/profile_pictures'),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
  }),
  cv: multer({ 
    storage: createStorage('uploads/candidates/cvs'),
    fileFilter: pdfFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
  }),
  jobImage: multer({ 
    storage: createStorage('uploads/jobs'),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
  })
};

// Helper function to get full URL
const getFileUrl = (filename, subpath) => {
  return `http://localhost:${PORT}/uploads/${subpath}/${filename}`;
};

// POST Endpoints - Upload
app.post('/upload/candidate/profile_picture', uploaders.profilePicture.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }
  res.json({
    filename: req.file.filename,
    url: getFileUrl(req.file.filename, 'candidates/profile_pictures')
  });
});

app.post('/upload/candidate/cv', uploaders.cv.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }
  res.json({
    filename: req.file.filename,
    url: getFileUrl(req.file.filename, 'candidates/cvs')
  });
});

app.post('/upload/job/image', uploaders.jobImage.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }
  res.json({
    filename: req.file.filename,
    url: getFileUrl(req.file.filename, 'jobs')
  });
});

// Error handling middleware for multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds the limit' });
    }
  } else if (err && err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// GET Endpoints - List files
app.get('/files/candidates/profile_pictures', (req, res) => {
  const dirPath = path.join(__dirname, 'uploads/candidates/profile_pictures');
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read directory' });
    }
    const filesWithUrls = files.map(file => ({
      filename: file,
      url: getFileUrl(file, 'candidates/profile_pictures')
    }));
    res.json(filesWithUrls);
  });
});

app.get('/files/candidates/cvs', (req, res) => {
  const dirPath = path.join(__dirname, 'uploads/candidates/cvs');
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read directory' });
    }
    const filesWithUrls = files.map(file => ({
      filename: file,
      url: getFileUrl(file, 'candidates/cvs')
    }));
    res.json(filesWithUrls);
  });
});

app.get('/files/jobs', (req, res) => {
  const dirPath = path.join(__dirname, 'uploads/jobs');
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read directory' });
    }
    const filesWithUrls = files.map(file => ({
      filename: file,
      url: getFileUrl(file, 'jobs')
    }));
    res.json(filesWithUrls);
  });
});

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`File server running on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`CORS origins: ${corsOrigins.join(', ')}`);
});
