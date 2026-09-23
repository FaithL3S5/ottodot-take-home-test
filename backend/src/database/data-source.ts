import { DataSource } from 'typeorm';
import { createDataSourceOptions } from './data-source-options.js';

export default new DataSource(createDataSourceOptions());
