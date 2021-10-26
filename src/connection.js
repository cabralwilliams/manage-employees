require('dotenv').config();
const mysql = require('mysql2');
const mysql_PW = process.env.mysql_PW;

const db = mysql.createConnection({
    user: 'root',
    password: mysql_PW,
    host: 'localhost',
    database: 'employee_manager'
});

module.exports = db;