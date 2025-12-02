// Test the getPostFileUrl function
import { getPostFileUrl } from './src/utils/imageUtils.js';
import { getBaseUrl } from './src/config/environment.js';

console.log('Base URL:', getBaseUrl());
console.log('File path from DB:', 'uploads/1759856787921-08ClassBasic.pdf');
console.log('Generated URL:', getPostFileUrl('uploads/1759856787921-08ClassBasic.pdf'));
console.log('Expected URL:', 'http://localhost:5000/uploads/1759856787921-08ClassBasic.pdf');