import * as express from 'express';
import {requireAuth} from '../middlewares/requireAuth';
import {UploadsService} from '../services/uploads/Uploads.service';

const router = express.Router();
const uploadsService = UploadsService.getInstance();

/**
 * POST /uploads/presigned-url
 * 
 * Creates a presigned URL for a client to upload a file directly to S3.
 * The client must provide the file's MIME type in the request body.
 * 
 * Request Body:
 *  { 
 *    "fileType": "image/jpeg",
 *    "directory": "profile-pictures" // Optional: specify a directory
 *  }
 * 
 * Response:
 *  { 
 *    "uploadUrl": "https://<bucket-name>.s3.<region>.amazonaws.com/...?...".
 *    "key": "<directory>/<uuid>.<ext>"
 *  }
 */
router.post('/presigned-url', requireAuth, async (req, res) => {
  const { fileType, directory } = req.body;

  if (!fileType) {
    return res.status(400).send({ error: 'fileType is required.' });
  }

  try {
    const { uploadUrl, key } = await uploadsService.createPresignedUrl(fileType, directory);
    res.status(200).send({ uploadUrl, key });
  } catch (error) {
    console.error('Failed to create presigned URL:', error);
    res.status(500).send({ error: 'Failed to create presigned URL.' });
  }
});

export const uploadsRouter = router;
