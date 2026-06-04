import { Injectable, Inject } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { mkdir, writeFile } from 'fs/promises';
import { join, extname } from 'path';

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

  private hasCloudinaryCredentials() {
    return Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET,
    );
  }

  private buildLocalUrl(filename: string, folder: string) {
    const apiPort = process.env.API_PORT || process.env.PORT || '3000';
    return `http://localhost:${apiPort}/uploads/${folder}/${filename}`;
  }

  private async saveLocalFallback(
    file: Express.Multer.File,
    folder: string,
  ): Promise<any> {
    if (!file.buffer) {
      throw new Error('Local upload fallback requires file buffer');
    }

    const safeFolder = join(process.cwd(), 'uploads', folder);
    await mkdir(safeFolder, { recursive: true });

    const extension = extname(file.originalname) || '.jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    const filePath = join(safeFolder, filename);

    await writeFile(filePath, file.buffer);

    return {
      public_id: filename,
      secure_url: this.buildLocalUrl(filename, folder),
      bytes: file.size,
      width: null,
      height: null,
      fallback: true,
    };
  }

  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions = {},
  ): Promise<any> {
    const localFolder = options.folder || 'toscan';

    if (!this.hasCloudinaryCredentials()) {
      console.warn(
        'Cloudinary credentials are missing. Using local upload fallback for exchange posting.',
      );
      return this.saveLocalFallback(file, localFolder);
    }

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

      let stream;
      try {
        stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('CloudinaryService: Upload stream error:', error);
              this.saveLocalFallback(file, localFolder)
                .then(resolve)
                .catch(reject);
            } else {
              console.log('CloudinaryService: Upload successful, result:', {
                public_id: result?.public_id,
                secure_url: result?.secure_url?.substring(0, 50) + '...',
              });
              resolve(result);
            }
          },
        );
      } catch (error) {
        console.error('CloudinaryService: Failed to create upload stream:', error);
        this.saveLocalFallback(file, localFolder)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (file.buffer) {
        console.log('CloudinaryService: Uploading buffer, size:', file.buffer.length);
        stream.end(file.buffer);
      } else if (file.stream) {
        console.log('CloudinaryService: Uploading stream');
        const fileStream = Readable.from(file.stream);
        fileStream.pipe(stream);
      } else {
        this.saveLocalFallback(file, localFolder)
          .then(resolve)
          .catch(reject);
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
