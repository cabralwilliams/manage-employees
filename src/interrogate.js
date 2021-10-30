
const { qInput, qList, qNumber, qConfirm } = require('./questions');
const inquirer = require('inquirer');
const cTable = require('console.table');
const db = require('./connection');

const mainMenu = ["View all Departments","View all Roles","View all Employees","Add Department","Add Role","Add Employee","Update Employee Role","Update Employee Manager","Exit Program"];

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

//Inquirer question arrays
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

//The following query is probably rendered obsolete by the identifyManagers query below
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

//A list of utility to query strings to use for generating, using, and dropping the temporary managers table

//Deletes managers table
const dropManagersTable = `DROP TABLE IF EXISTS managers`;

//Creates managers table and populates it with all employees
const populateManagers = `CREATE TABLE managers (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(30),
    last_name VARCHAR(30)
) SELECT employee.first_name, employee.last_name FROM employee`;

//Displays all employees with employee id, full name role, department, salary, and manager full name
const identifyManagers = `SELECT employee.id, CONCAT(employee.first_name, ' ', employee.last_name) AS 'Employee Name', role.title AS Title, department.name AS Department, role.salary AS Salary, CONCAT(managers.first_name, ' ', managers.last_name) AS Manager
FROM employee
LEFT JOIN role ON employee.role_id = role.id
LEFT JOIN department ON role.department_id = department.id
LEFT JOIN managers ON employee.manager_id = managers.id`;


//List of reconfigured questions
//Requires that a prior query returns an array of the current departments.
const assignDepartment = (departments) => {
    return {
        type: "list",
        name: "dep_name",
        message: "Select a department below to which this role will be assigned.",
        choices: departments,
        default: departments[0]
    };
};

//Requires that a prior query returns an array of the current roles and the departments to which they are assigned.
const assignRole = (roles) => {
    return {
        type: "list",
        name: "emp_role",
        message: "Please assign this employee a role from the list below.",
        choices: roles,
        default: roles[0]
    };
};

function addNewEmployee() {
    let managersArr, rolesArr;
    db.query(dropManagersTable, (err, result) => {
        if(err) {
            console.log(err);
        }
    });
    db.query(
        `${populateManagers}`, (err, mRows) => {
            //The above query creates a temporary managers table from which the list will be created for choosing the employee's manager
            if(err) {
                console.log(err);
            }
            db.query(`SELECT * FROM managers`, (err, mRows2) => {
                if(err) {
                    console.log(err);
                }
                managersArr = mRows2;
                db.query(`SELECT role.id, role.title FROM role`, (err, rRows) => {
                    //The above query will produce an array of roles
                    if(err) {
                        console.log(err);
                    }
                    rolesArr = rRows;
                    //console.log(managersArr);
                    //console.log(rolesArr);

                    //Show current list of employees
                    db.query(identifyManagers, (err, empTab) => {
                        if(err) {
                            console.log(err);
                        }
                        //Show emploee table but with manager names instead of manager ids
                        console.log(cTable.getTable(empTab));

                        //Create arrays to handle role choices and manager choices
                        let roleChoices = rolesArr.map(roleOb => {
                            return `${roleOb.id}. ${roleOb.title}`;
                        });
                        let managerChoices = managersArr.map(managerOb => {
                            return `${managerOb.id}. ${managerOb.first_name} ${managerOb.last_name}`;
                        });
                        managerChoices.push("None");

                        //Questions for inquirer
                        let emp_questions = [emp_fn,emp_ln,assignRole(roleChoices),qList("emp_man","Please assign this employee a manager from the list below.  If the employee has no manager, please select 'None' (located at the end).",managerChoices)];

                        inquirer.prompt(
                            emp_questions
                        )
                        .then(emp_data => {
                            //console.log(emp_data);
                            //Grab the id number assigned to the particular role
                            let roleId = parseInt(emp_data.emp_role.split(".")[0]);

                            //Grab the employee id number assigned to the manager or null
                            let managerId = emp_data.emp_man === "None" ? null : parseInt(emp_data.emp_man.split(".")[0]);

                            //Add employee to database
                            db.query(`INSERT INTO employee (first_name,last_name,role_id,manager_id) VALUES (?,?,?,?)`, [emp_data.emp_fn,emp_data.emp_ln,roleId,managerId], (err, result) => {
                                if(err) {
                                    console.log(err);
                                }
                                console.log(`\n${emp_data.emp_fn} ${emp_data.emp_ln} was added successfully!\n`);

                                //Ask if the user wants to perform another action or quit.
                                inquirer.prompt([backToStart])
                                .then(userChoice => {
                                    if(userChoice.back_to_start) {
                                        runProgram();
                                    } else {
                                        process.exit();
                                    }
                                });
                            });
                        });
                    });
                });
            });
        }
    );
};

//Role update section
const up_role_q1 = `SELECT CONCAT(employee.first_name, ' ', employee.last_name) AS Employee, role.title AS 'Current Title'
FROM employee
LEFT JOIN role ON employee.role_id = role.id`;

function updateRole() {
    let empArr, empList, roleList, roleChangeMsg, empId, emp_name;

    //First query will get a list of employee roles
    db.promise().query(`SELECT role.id, role.title FROM role`)
    .then(([rows,fields]) => {
        roleList = rows.map(roleDatum => `${roleDatum.id}. ${roleDatum.title}`);

        //Second query will show a list of employees and current roles
        db.promise().query(up_role_q1)
        .then(([rows,fields]) => {
            console.log(cTable.getTable(rows));

            //Next query will consolidate employees into selectable list
            db.promise().query(`SELECT * FROM employee`)
            .then(([rows, fields]) => {
                //Set empArr to recovered data
                empArr = rows;
                //console.log(empArr);

                //empArr[n] = {id, first_name, last_name, role_id, manager_id}
                //map empArr to 'id. first_name last_name'
                empList = empArr.map(employee => {
                    return `${employee.id}. ${employee.first_name} ${employee.last_name}`;
                });

                //process.exit();
                inquirer.prompt([
                    {
                        name: 'selection',
                        type: "list",
                        message: "Select the employee whose role you wish to update.",
                        choices: empList
                    }
                ])
                .then(sel_emp =>{
                    //Determine which employee was selected
                    let sel_Arr = sel_emp.selection.split(".");
                    empId = parseInt(sel_Arr[0]);
                    emp_name = sel_Arr[1].trim();
                    roleChangeMsg = `Select the new role for ${emp_name} from the list of choices below.`;
                })
                .then(() => {
                    inquirer.prompt([
                        {
                            type: "list",
                            name: "new_role",
                            message: roleChangeMsg,
                            choices: roleList
                        }
                    ])
                    .then(updatedRole => {
                        let new_role_id = parseInt(updatedRole.new_role.split(".")[0]);

                        //Update the employee with the new role id
                        db.promise().query(`UPDATE employee SET employee.role_id = ? WHERE employee.id = ?`,[new_role_id,empId])
                        .then(([rows,fields]) => {
                            console.log(`\n${emp_name}'s role was successfully changed!`);
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
                        })
                        .catch(err => {
                            console.log(err);
                        });
                    });
                });
            })
            .catch(err => {
                console.log(err);
            });
        })
        .catch(err => {
            console.log(err);
        });
    })
    .catch(err => {
        console.log(err);
    });
}

function updateManager() {
    let emp_array; //Will store employees as { id, full_name, manager_full_name }
    let emp_list; //Shows the employee list options
    let emp_id; //The id of the selected employee
    let emp_name; //Full name of the employee
    let manage_id; //Stores the manager id

    //Drop and recreate managers table
    db.promise().query(dropManagersTable)
    .then(() => {
        //Create managers table
        db.promise().query(populateManagers)
        .then(() => {
            //Get employees array and display list of employees with current manager
            db.promise().query(`SELECT employee.id, CONCAT(employee.first_name, ' ', employee.last_name) AS 'Employee Name', CONCAT(managers.first_name, ' ', managers.last_name) AS 'Current Manager'
            FROM employee
            LEFT JOIN managers ON employee.manager_id = managers.id`)
            .then(([rows,fields]) => {
                emp_array = rows;
                emp_list = emp_array.map(listOb => `${listOb.id}. ${listOb['Employee Name']}`);
                //console.log(emp_array);
                //process.exit();

                //Show the list of employees and current managers
                console.log(cTable.getTable(emp_array));

                //Use inquirer to choose an employee whose manager should change
                inquirer.prompt([
                    qList('selEmployee','Select the employee whose manager you wish to update.',emp_list)
                ])
                .then(selected => {
                    let split_select = selected.selEmployee.split(".");
                    emp_id = parseInt(split_select[0]);
                    emp_name = split_select[1].trim();

                    //Create the manager selection list excluding the selected employee
                    let managerChoices = emp_list.filter(nextEmp => parseInt(nextEmp.split(".")[0]) !== emp_id);

                    //console.log(managerChoices);
                    //process.exit();

                    //Push Leave Current Manager option
                    managerChoices.push("Leave Current Manager","Set Manager to None");

                    //Use inquirer to choose new manager
                    inquirer.prompt([
                        qList("newManager",`Select the new manager for ${emp_name} from the list below.`,managerChoices)
                    ])
                    .then(nextOb => {
                        if(nextOb.newManager === "Leave Current Manager") {
                            //Inquire about another action or quit
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
                        } else if(nextOb.newManager === "Set Manager to None") {
                            //Run the query to set manager to null
                            db.promise().query(`UPDATE employee SET employee.manager_id = NULL WHERE employee.id = ?`,emp_id)
                            .then(() => {
                                console.log(`${emp_name}'s manager was successfully set to none/null.`);
                                //Inquire about another action or quit
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
                            })
                            .catch(err => {
                                console.log(err);
                            });
                        } else {
                            //Run the query to set manager to new value based on id
                            let nextArr = nextOb.newManager.split(".");
                            manage_id = parseInt(nextArr[0]);
                            let newManagerName = nextArr[1].trim();
                            db.promise().query(`UPDATE employee SET employee.manager_id = ? WHERE employee.id = ?`,[manage_id,emp_id])
                            .then(() => {
                                console.log(`${emp_name}'s manager was successfully set to ${newManagerName}.`);
                                //Inquire about another action or quit
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
                            })
                            .catch(err => {
                                console.log(err);
                            });
                        }
                    })
                })
            })
            .catch(err => {
                console.log(err);
            });
        })
        .catch(err => {
            console.log(err);
        });
    })
    .catch(err => {
        console.log(err);
    });
}

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
                db.promise().query(identifyManagers)
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
                addNewEmployee();
                break;
            case "Update Employee Role":
                updateRole();
                break;
            case "Update Employee Manager":
                updateManager();
                break;
            case "Exit Program":
                console.log('\nHave a nice day!');
                process.exit();
                break;
        }
    });
};

module.exports = runProgram;
//module.exports = addNewEmployee;
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