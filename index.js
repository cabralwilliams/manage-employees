require('dotenv').config();

const inquirer = require('inquirer');
const mysql = require('mysql2');
const mysql_PW = process.env.mysql_PW;
