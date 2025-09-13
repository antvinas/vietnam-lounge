
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// A simple flag to check if we are in a production environment
const isProduction = process.env.NODE_ENV === 'production';

export class UploadsService {
  private static instance: UploadsService;
  private s3: AWS.S3 | null = null;

  private constructor() {
    // Only initialize S3 in a production environment
    if (isProduction) {
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION || !process.env.S3_BUCKET_NAME) {
        console.warn('AWS S3 environment variables are not fully configured for production.');
        // In production, we might want to throw an error to prevent the app from starting
        // throw new Error('S3 environment variables are not set for production');
      } else {
        this.s3 = new AWS.S3({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION,
          signatureVersion: 'v4',
        });
      }
    } else {
      console.log('S3 Service is in development mode. AWS S3 will not be initialized.');
    }
  }

  public static getInstance(): UploadsService {
    if (!UploadsService.instance) {
      UploadsService.instance = new UploadsService();
    }
    return UploadsService.instance;
  }

  public async createPresignedUrl(fileType: string, directory: string = 'uploads'): Promise<{ uploadUrl: string, key: string }> {
    const key = `${directory}/${uuidv4()}.${this.getFileExtension(fileType)}`;

    // If not in production (or S3 is not available), return a dummy URL for local development
    if (!isProduction || !this.s3) {
      console.log(`[DEV MODE] Generated dummy presigned URL for key: ${key}`);
      return {
        uploadUrl: `http://localhost:9199/uploads/dummy-url-for/${key}`,
        key: key
      };
    }

    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME environment variable is not set.');
    }

    const params = {
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
      Expires: 60 * 5, // URL expires in 5 minutes
    };

    const uploadUrl = await this.s3.getSignedUrlPromise('putObject', params);

    return { uploadUrl, key };
  }

  private getFileExtension(fileType: string): string {
    switch (fileType) {
      case 'image/jpeg': return 'jpg';
      case 'image/png': return 'png';
      case 'image/gif': return 'gif';
      default: return 'bin';
    }
  }
}
