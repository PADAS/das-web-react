import dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { parsed: ENV } = dotenv.config({ path: path.join(__dirname, '.env') });

export const { APP_PREFIX, PROTOCOL, HOST, API_URL, PORT } = ENV;

export const DAS_API_URL = `${PROTOCOL}://${HOST}${API_URL}`;
