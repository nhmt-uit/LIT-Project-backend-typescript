import dotenv from 'dotenv';

dotenv.config();

const MONGO_OPTIONS = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    socketTimeoutMS: 30000,
    keepAlive: true,
    poolSize: 50,
    autoIndex: false,
    retryWrites: false
};

const MONGO_DATABASE = process.env.MONGO_DATABASE || 'lit_project_database';
const MONGO_USERNAME = process.env.MONGO_USERNAME || 'admin_mmsoft';
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || 'lit_project_mmsoft';
const MONGO_HOST = process.env.MONGO_URL || `172.31.19.17:27017`;
const MONGO = {
    host: MONGO_HOST,
    password: MONGO_PASSWORD,
    username: MONGO_USERNAME,
    options: MONGO_OPTIONS,
    url: `mongodb://${MONGO_HOST}/${MONGO_DATABASE}`
};

const SERVER_HOSTNAME = process.env.SERVER_HOSTNAME || '3.16.41.142';
const SERVER_PORT = process.env.SERVER_PORT || 8000;

const SERVER = {
    hostname: SERVER_HOSTNAME,
    port: SERVER_PORT
};

const config = {
    mongo: MONGO,
    server: SERVER
};

export default config;