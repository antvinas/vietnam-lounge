import * as AWS from 'aws-sdk';
import {v4 as uuidv4} from 'uuid';

export class UploadsService {
  private static instance: UploadsService;
  private readonly s3: AWS.S3;

  private constructor() {
    // IMPORTANT: In a real production environment, do not hardcode credentials.
    // Use IAM roles, environment variables, or Firebase Secret Manager.
    // For this example, we assume environment variables are set:
    // AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME
    
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION || !process.env.S3_BUCKET_NAME) {
        console.warn('AWS S3 environment variables are not fully configured.');
    }

    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      signatureVersion: 'v4',
    });
  }

  public static getInstance(): UploadsService {
    if (!UploadsService.instance) {
      UploadsService.instance = new UploadsService();
    }
    return UploadsService.instance;
  }

  /**
   * Creates a presigned URL for uploading a file to S3.
   * @param {string} fileType - The MIME type of the file (e.g., 'image/jpeg').
   * @param {string} directory - The directory/path within the bucket to upload to.
   * @returns {Promise<{uploadUrl: string, fileUrl: string}>}
   */
  public async createPresignedUrl(fileType: string, directory: string = 'uploads'): Promise<{uploadUrl: string, key: string}> {
    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME environment variable is not set.');
    }

    const fileExtension = this.getFileExtension(fileType);
    const key = `${directory}/${uuidv4()}.${fileExtension}`;

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
    switch(fileType) {
        case 'image/jpeg': return 'jpg';
        case 'image/png': return 'png';
        case 'image/gif': return 'gif';
        // Add other file types as needed
        default: return 'bin'; // default to binary extension
    }
  }
}
