require('dotenv').config();

const express = require('express');
const app = express();
const inquirer = require('inquirer');
const db = require('./src/connection');
const PORT = process.env.PORT || 3006;
const runProgram = require('./src/interrogate');

db.connect(err => {
    if(err) throw err;
    console.log('Database connected.');
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
    runProgram();
});