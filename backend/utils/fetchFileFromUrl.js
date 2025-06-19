import axios from 'axios';
import fs from 'fs';
import path from 'path';

export const fetchFileFromUrl = async (url, destination) => {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    // Validate content type
    const contentType = response.headers['content-type'];
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(contentType)) {
      throw new Error('Invalid file type from URL. Only PDF, JPEG, and DOCX are allowed.');
    }

    // Generate file extension based on content type
    let ext = '.bin';
    if (contentType === 'application/pdf') ext = '.pdf';
    else if (contentType === 'image/jpeg') ext = '.jpg';
    else if (contentType.includes('wordprocessingml.document')) ext = '.docx';
    else if (contentType === 'application/msword') ext = '.doc';

    const filePath = path.join(destination, `${Date.now()}-resume${ext}`);
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', (err) => reject(err));
    });
  } catch (error) {
    throw new Error(`Failed to fetch file from URL: ${error.message}`);
  }
};