import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseConfig } from './common/config/database.config';

export default new DataSource({
  ...databaseConfig,
});
