// backend/db.js
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();


let storagePath; //path.resolve(process.env.ELECTRON_SQLITE_PATH || __dirname, '../../', process.env.DATABASE_URL);
const DATABASE_URL = process.env.DATABASE_URL || '/database/database.sqlite'
if (process.env.ELECTRON_RUNNING && process.env.ELECTRON_SQLITE_PATH) {
    storagePath = path.join(process.env.ELECTRON_SQLITE_PATH, DATABASE_URL);
    console.log(`SQLite database path (Electron): ${DATABASE_URL}`);
} else {
    // Original path for development or non-Electron environments
    storagePath = path.resolve(process.env.ELECTRON_SQLITE_PATH || __dirname, '../../', process.env.DATABASE_URL);;
    console.log(`SQLite database path (Development): ${DATABASE_URL}`);
}



const dbDir = path.dirname(storagePath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false,
    // timezone: '+05:00'
});


module.exports = sequelize