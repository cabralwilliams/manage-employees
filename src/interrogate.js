
const { qInput, qList, qNumber, qConfirm } = require('./questions');
const inquirer = require('inquirer');
const cTable = require('console.table');
const db = require('./connection');

const mainMenu = ["View all Departments","View all Roles","View all Employees","Add Department","Add Role","Add Employee","Update Employee Role","Exit Program"];

const whatToDo = qList("employee_action","\nWelcome to the Employee Manager!\nChoose an action from the list below.\n",mainMenu);
const backToStart = qConfirm("back_to_start","\nDo you wish to perform another action?  (Y for yes, N to quit)",true);

const dep_name = qInput("dep_name","Please enter the name of the department that you wish to add.", { checkValidity: true, validMessage: "The department name cannot be an empty string."});
const role_name = qInput("role_name","Please enter the name of the role that you wish to add.", { checkValidity: true, validMessage: "The role name cannot be an empty string."});
const role_dep_id = qNumber("role_dep_id","Please input the number corresponding to the department to which this role will belong.","The department number must correspond to a department included in the department table list.");
const role_salary = qNumber("role_salary","Please enter the salary corresponding to this role.","The salary corresponding to this role should be greater than 0.  After all, slavery isn't technically legal.  Also, it would probably be nice for an employee to say that he or she earns an integer salary value, right?");
const emp_fn = qInput("emp_fn","Please enter the first name of the employee whom you wish to add.", { checkValidity: true, validMessage: "The employee's first name cannot be an empty string."});
const emp_ln = qInput("emp_ln","Please enter the last name of the employee whom you wish to add.", { checkValidity: true, validMessage: "The employee's last name cannot be an empty string."});
const emp_rol_id = qNumber("emp_rol_id","Please input the number corresponding to the role to which this employee belongs.","The role number must correspond to a role included in the role table list.");
const emp_man_id = { type: "number", name: "emp_man_id", message: "Please input the number corresponding to this employee's manager.  If this employee has no manager, please leave this blank." };

const depQs = [dep_name];
const roleQs = [role_name,role_dep_id,role_salary];
const empQs = [emp_fn,emp_ln,emp_rol_id,emp_man_id];

//Query List
const queryDepartments = `SELECT department.name, department.id AS 'department id' FROM department`;
const showDepartments = () => {
    db.query(queryDepartments, (err, deps) => {
        if(err) {
            console.log(err);
        } else {
            console.log('\n');
            console.log(cTable.getTable(deps));
            
        }
    });
};

const queryRoles = `SELECT role.title, role.id AS role_id, department.name AS department, role.salary AS salary
FROM role
LEFT JOIN department on role.department_id = department.id`;
const showRoles = () => {
    db.query(queryRoles, (err, roles) => {
        if(err) {
            console.log(err);
        } else {
            console.log('\n');
            console.log(cTable.getTable(roles));
        }
    });
};
const queryEmployees = `SELECT employee.id, employee.first_name, employee.last_name, role.title AS title, department.name AS department, role.salary AS salary, employee.manager_id AS manager
FROM employee
LEFT JOIN role ON employee.role_id = role.id
LEFT JOIN department ON role.department_id = department.id`;
const showEmployees = () => {
    db.query(queryEmployees, (err, emps) => {
        if(err) {
            console.log(err);
        } else {
            console.log('\n');
            console.log(cTable.getTable(emps));
        }
    });
};
const addDepQuery = `INSERT INTO department (name) VALUES (?)`;
const addRoleQuery = `INSERT INTO role (title,department_id,salary) VALUES (?,?,?)`;

const runProgram = () => {
    inquirer.prompt(
        [whatToDo]
    )
    .then(userAction => {
        switch(userAction.employee_action) {
            case "View all Departments":
                //showDepartments();
                db.promise().query(queryDepartments)
                .then(([rows,fields]) => {
                    console.log('\n');
                    console.log(cTable.getTable(rows));
                })
                .catch(err => {
                    console.log(err);
                })
                .then(() => {
                    inquirer.prompt([
                        backToStart
                    ])
                    .then(doMore => {
                        if(doMore.back_to_start) {
                            runProgram();
                        } else {
                            console.log('\nHave a nice day!');
                            process.exit();
                        }
                    });
                });
                break;
            case "View all Roles":
                //showRoles();
                db.promise().query(queryRoles)
                .then(([rows,fields]) => {
                    console.log('\n');
                    console.log(cTable.getTable(rows));
                })
                .catch(err => {
                    console.log(err);
                })
                .then(() => {
                    inquirer.prompt([
                        backToStart
                    ])
                    .then(doMore => {
                        if(doMore.back_to_start) {
                            runProgram();
                        } else {
                            console.log('\nHave a nice day!');
                            process.exit();
                        }
                    });
                });
                break;
            case "View all Employees":
                //showEmployees();
                db.promise().query(queryEmployees)
                .then(([rows,fields]) => {
                    console.log('\n');
                    console.log(cTable.getTable(rows));
                })
                .catch(err => {
                    console.log(err);
                })
                .then(() => {
                    inquirer.prompt([
                        backToStart
                    ])
                    .then(doMore => {
                        if(doMore.back_to_start) {
                            runProgram();
                        } else {
                            console.log('\nHave a nice day!');
                            process.exit();
                        }
                    });
                });
                break;
            case "Add Department":
                //showDepartments();
                db.promise().query(queryDepartments)
                .then(([rows,fields]) => {
                    console.log('\n');
                    console.log(cTable.getTable(rows));
                })
                .catch(err => {
                    console.log(err);
                })
                .then(() => {
                    inquirer.prompt(depQs)
                    .then(depData => {
                        db.promise().query(addDepQuery, depData.dep_name)
                        .then(([rows,fields]) => {
                            console.log('\nThe department ' + depData.dep_name + ' was successfully added.');
                        })
                        .catch(err => {
                            console.log(err);
                        })
                        .then(() => {
                            inquirer.prompt([
                                backToStart
                            ])
                            .then(doMore => {
                                if(doMore.back_to_start) {
                                    runProgram();
                                } else {
                                    console.log('\nHave a nice day!');
                                    process.exit();
                                }
                            });
                        });
                    });
                });
                break;
            case "Add Role":
                db.promise().query(queryRoles)
                .then(([rows,fields]) => {
                    console.log('\n');
                    console.log(cTable.getTable(rows));
                })
                .catch(err => {
                    console.log(err);
                })
                .then(() => {
                    console.log('\nAbove is a table of the current roles, the departments to which the roles belong, and the salaries associated with the roles.  Please answer the following questions to add the new role.\n');
                    inquirer.prompt(
                        roleQs
                    )
                    .then(roleOb => {
                        const qParams = [roleOb.role_name,roleOb.role_dep_id,roleOb.role_salary];
                        db.promise().query(addRoleQuery,qParams)
                        .then(([rows,fields]) => {
                            console.log('\nThe role ' + roleOb.role_name + ' was successfully added.');
                        })
                        .catch(err => {
                            console.log(err);
                        })
                        .then(() => {
                            inquirer.prompt([
                                backToStart
                            ])
                            .then(doMore => {
                                if(doMore.back_to_start) {
                                    runProgram();
                                } else {
                                    console.log('\nHave a nice day!');
                                    process.exit();
                                }
                            });
                        });
                    });
                });
                break;
            case "Add Employee":
                db.promise().query(queryRoles)
                .then(([rows,fields]) => {
                    console.log('\n');
                    console.log(cTable.getTable(rows));
                })
                .catch(err => {
                    console.log(err);
                })
                .then(() => {
                    console.log('\nAbove is a table of the current roles, the departments to which the roles belong, and the salaries associated with the roles.  Please answer the following questions to add the new role.\n');
                    inquirer.prompt(
                        roleQs
                    )
                    .then(roleOb => {
                        const qParams = [roleOb.role_name,roleOb.role_dep_id,roleOb.role_salary];
                        db.promise().query(addRoleQuery,qParams)
                        .then(([rows,fields]) => {
                            console.log('\nThe role ' + roleOb.role_name + ' was successfully added.');
                        })
                        .catch(err => {
                            console.log(err);
                        })
                        .then(() => {
                            inquirer.prompt([
                                backToStart
                            ])
                            .then(doMore => {
                                if(doMore.back_to_start) {
                                    runProgram();
                                } else {
                                    console.log('\nHave a nice day!');
                                    process.exit();
                                }
                            });
                        });
                    });
                });
                break;
            case "Update Employee Role":
                break;
            case "Exit Program":
                break;
        }
    });
};

module.exports = runProgram;
/*
if whatToDo = View all Departments -> query show Departments
if whatToDo = view all Employees -> query show Employees
if whatToDo = View all Roles -> query show Roles
if whatToDo = Add Department -> Show Departments -> inquirer depQs
if whatToDo = Add Role -> Show Roles + Departments? -> inquirer roleQs
if whatToDo = Add Employee -> Show Roles + Managers? -> inquirer empQs
if whatToDo = Update Employee Role -> Show Roles -> inquirer new role question -> must have employee id to update proper table row
Might need to interrupt the questions and chain them together with .then statements to see data tables between questions
*/