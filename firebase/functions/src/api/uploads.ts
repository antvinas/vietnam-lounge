import * as express from 'express';
import {requireAuth} from '../middlewares/requireAuth';
import {UploadsService} from '../services/uploads/Uploads.service';

const router = express.Router();
const uploadsService = UploadsService.getInstance();

/**
 * POST /uploads/presigned-url
 */
router.post('/presigned-url', requireAuth, async (req, res) => {
  const { fileType, directory } = req.body;

  if (!fileType) {
    return res.status(400).send({ error: 'fileType is required.' });
  }

  try {
    const { uploadUrl, key } = await uploadsService.createPresignedUrl(fileType, directory);
    return res.status(200).send({ uploadUrl, key });
  } catch (error) {
    console.error('Failed to create presigned URL:', error);
    return res.status(500).send({ error: 'Failed to create presigned URL.' });
  }
});

/**
 * DELETE /uploads
 */
router.delete('/', requireAuth, async (req, res) => {
  const { key, url } = req.body;
  const target = key || url;

  if (!target) {
    return res.status(400).send({ error: 'Key or URL is required to delete file.' });
  }

  try {
    await uploadsService.deleteFile(target);
    return res.status(200).send({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Failed to delete file:', error);
    return res.status(500).send({ error: 'Failed to delete file.' });
  }
});

export const uploadsRouter = router;