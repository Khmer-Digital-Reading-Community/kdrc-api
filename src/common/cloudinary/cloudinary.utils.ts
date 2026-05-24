import { v2 as cloudinary } from 'cloudinary';

export const testCloudinaryConnection = async () => {
  try {
    const config = cloudinary.config();
    console.log('Cloudinary Config:', {
      cloud_name: config.cloud_name,
      api_key: config.api_key ? '***' : 'MISSING',
      api_secret: config.api_secret ? '***' : 'MISSING',
    });

    // Test API call
    const result = await cloudinary.api.resources({
      max_results: 1,
    });

    console.log('✅ Cloudinary connection successful');
    return { success: true, message: 'Connected' };
  } catch (error: any) {
    console.error('❌ Cloudinary connection failed:', error.message);
    return { success: false, message: error.message };
  }
};
