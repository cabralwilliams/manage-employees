# Manage Employees

![Initial Menu](./assets/images/employee-manager1.jpg)

[Demonstration Video](https://watch.screencastify.com/v/ZhFBupc1BcSLXjC87X72)
  
  ## Description
  This application, once set up, will allow the user to manage certain details about a work organization.  The user will be able to create department, role, and employee data.  The user will also be able to assign and update managers and roles of those employees.
  
  ## Table of Contents
  
  * [Installation](#installation)
  * [Usage](#usage)
  * [License](#license)
  * [Contributing](#contributing)
  * [Tests](#tests)
  * [Questions](#questions)
  
  ## Installation
  
  The project runs using Node.js and requires the mysql2, inquirer, console.table, and dotenv node packages.  The dotenv package allows for saving the user's mysql password for local usage without exposing the password publicly.
  
  ## Usage
  
  The databases and the table schema have already been created.  From the root folder, the user should enter the mysql program and then type these two commands in this order: source 'db/db.sql;' and 'db/schema.sql'.   This will create the database and populate it with the necessary tables.  (In the program as it exists now, I am using 'root' as the username and my mysql password for that username.  I installed the 'dotenv' package and include a .env file in the root of the project.  The .env file does not carry over to GitHub.  If you wish to use the same connection setup as I have, you will have to install dotenv and include the statment "require('dotenv').config()" in the src/cconnection.js file.  Then, you will have to create the .env file, placing a line of code saying mysql_PW=SOME_PASSWORD_STRING.  Alternatively, you can just hardcode your password in place of the process.env.mysql_PW line in connection.js.) Once the required files and node packages are in place, the user should run the command 'npm start' from the command line in the root directory.  From here, just answer the prompted questions.
  
  ## License
  
  

  ## Contributing

  This project adheres to the [Contributor Covenant](https://www.contributor-covenant.org/).
  
  
  ## Tests
  
  There was no formal testing used in building this project.  To check whether the program was functioning properly during development, constant console.log actions were performed.
  
  ## Questions
  [GitHub Profile](http://github.com/cabralwilliams)
  
  For any questions concerning this application, please contact me at cabral.williams@gmail.com.