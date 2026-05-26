import { Injectable, Inject } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

export interface UploadOptions {
  folder?: string;
  public_id?: string;
  resource_type?: 'auto' | 'image' | 'video' | 'raw';
  quality?: 'auto' | string;
  transformation?: any[];
  [key: string]: any;
}

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private cloudinaryClient: typeof cloudinary) {}

  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions = {},
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('CloudinaryService: Starting upload with options:', {
        folder: options.folder,
        resource_type: options.resource_type,
      });

      const uploadOptions = {
        folder: options.folder || 'toscan',
        public_id: options.public_id,
        resource_type: options.resource_type || 'auto',
        quality: options.quality || 'auto',
        transformation: options.transformation,
        ...options,
      };

      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('CloudinaryService: Upload stream error:', error);
            reject(error);
          } else {
            console.log('CloudinaryService: Upload successful, result:', {
              public_id: result?.public_id,
              secure_url: result?.secure_url?.substring(0, 50) + '...',
            });
            resolve(result);
          }
        },
      );

      if (file.buffer) {
        console.log('CloudinaryService: Uploading buffer, size:', file.buffer.length);
        stream.end(file.buffer);
      } else if (file.stream) {
        console.log('CloudinaryService: Uploading stream');
        const fileStream = Readable.from(file.stream);
        fileStream.pipe(stream);
      } else {
        reject(new Error('File has no buffer or stream'));
      }
    });
  }

  async deleteFile(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
  }

  async uploadBookCover(file: Express.Multer.File): Promise<any> {
    return this.uploadFile(file, {
      folder: 'toscan/book-covers',
      quality: 'auto',
      fetch_format: 'auto',
      transformation: [{ width: 300, height: 450, crop: 'fill', gravity: 'face' }],
    });
  }

  async uploadContentImage(file: Express.Multer.File): Promise<any> {
    return this.uploadFile(file, {
      folder: 'toscan/content-images',
      quality: 'auto',
      fetch_format: 'auto',
      transformation: [{ max_width: 1200, crop: 'scale' }],
    });
  }

  async uploadAvatar(file: Express.Multer.File): Promise<any> {
    return this.uploadFile(file, {
      folder: 'toscan/avatars',
      quality: 'auto',
      fetch_format: 'auto',
      transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
    });
  }
}
