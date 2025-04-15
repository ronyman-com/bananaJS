const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = req.body.directory || './uploads';
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });


module.exports = {
  handleUpload: multer({ storage }).array('files'),
  processUpload: async (req, res) => {
    try {
      if (!req.files?.length) throw new Error('No files uploaded');
      
      const results = req.files.map(file => ({
        originalName: file.originalname,
        path: file.path,
        size: file.size
      }));

      res.json({ success: true, files: results });
    } catch (err) {
      res.status(500).json({ 
        success: false, 
        error: err.message 
      });
    }
  }
};