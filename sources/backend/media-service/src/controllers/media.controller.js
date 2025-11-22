const fs = require('fs');
const path = require('path');
const { uploadDir } = require('../config/multer.config');

class MediaController {
  /**
   * POST /upload
   * Sube uno o varios archivos
   */
  async uploadFiles(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'No files uploaded',
          message: 'Please select at least one file to upload'
        });
      }

      // Preparar respuesta con información de archivos subidos
      const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `${req.protocol}://${req.get('host')}/media/files/${file.filename}`,
        uploadedAt: new Date().toISOString()
      }));

      res.status(201).json({
        message: 'Files uploaded successfully',
        count: uploadedFiles.length,
        files: uploadedFiles
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /upload/single
   * Sube un solo archivo
   */
  async uploadSingleFile(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          message: 'Please select a file to upload'
        });
      }

      const fileInfo = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `${req.protocol}://${req.get('host')}/media/files/${req.file.filename}`,
        uploadedAt: new Date().toISOString()
      };

      res.status(201).json({
        message: 'File uploaded successfully',
        file: fileInfo
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /files/:filename
   * Obtiene un archivo por nombre
   */
  async getFile(req, res, next) {
    try {
      const { filename } = req.params;
      const filePath = path.join(uploadDir, filename);

      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: 'File not found',
          message: `File ${filename} does not exist`
        });
      }

      // Enviar archivo
      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /files
   * Lista todos los archivos
   */
  async listFiles(req, res, next) {
    try {
      const files = fs.readdirSync(uploadDir);
      
      const fileList = files.map(filename => {
        const filePath = path.join(uploadDir, filename);
        const stats = fs.statSync(filePath);
        
        return {
          filename,
          size: stats.size,
          url: `${req.protocol}://${req.get('host')}/media/files/${filename}`,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      });

      res.json({
        count: fileList.length,
        files: fileList
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /files/:filename
   * Elimina un archivo
   */
  async deleteFile(req, res, next) {
    try {
      const { filename } = req.params;
      const filePath = path.join(uploadDir, filename);

      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: 'File not found',
          message: `File ${filename} does not exist`
        });
      }

      // Eliminar archivo
      fs.unlinkSync(filePath);

      res.json({
        message: 'File deleted successfully',
        filename
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /info/:filename
   * Obtiene información de un archivo sin descargarlo
   */
  async getFileInfo(req, res, next) {
    try {
      const { filename } = req.params;
      const filePath = path.join(uploadDir, filename);

      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: 'File not found',
          message: `File ${filename} does not exist`
        });
      }

      const stats = fs.statSync(filePath);
      const ext = path.extname(filename);

      res.json({
        filename,
        extension: ext,
        size: stats.size,
        url: `${req.protocol}://${req.get('host')}/media/files/${filename}`,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /health
   * Health check del servicio
   */
  async healthCheck(req, res) {
    try {
      // Verificar que el directorio de uploads existe y es escribible
      const uploadsAccessible = fs.existsSync(uploadDir);
      
      res.json({
        status: 'healthy',
        service: 'media-service',
        uploadsDirectory: uploadsAccessible ? 'accessible' : 'not accessible',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        service: 'media-service',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new MediaController();
