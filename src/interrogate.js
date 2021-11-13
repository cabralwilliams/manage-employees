
const { qInput, qList, qNumber, qConfirm } = require('./questions');
const inquirer = require('inquirer');
const cTable = require('console.table');
const db = require('./connection');

const mainMenu = ["View all Departments","View all Roles","View all Employees","Add Department","Add Role","Add Employee","Update Employee Role","Update Employee Manager","See Employees by Manager","See Employees by Department","See Department Budget","Dismiss Employee","Eliminate Role","Eliminate Department","Exit Program"];

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
const roleQs = [role_name,role_dep_id,role_salary]; //Need to redo such that second question is a list question containing 
const empQs = [emp_fn,emp_ln,emp_rol_id,emp_man_id];

//New role questions
const newRoleQs = roleStrings => {
    let output = [role_name];
    const depQ = qList("role_dep_id","Please select an option for the department to which this role will belong.",roleStrings);
    output.push(depQ, role_salary);
    return output;
};

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
    last_name VARCHAR(30),
    employee_id INTEGER
) SELECT employee.first_name, employee.last_name, employee.id AS employee_id FROM employee`;

//Displays all employees with employee id, full name role, department, salary, and manager full name
const identifyManagers = `SELECT employee.id, CONCAT(employee.first_name, ' ', employee.last_name) AS 'Employee Name', role.title AS Title, department.name AS Department, role.salary AS Salary, CONCAT(managers.first_name, ' ', managers.last_name) AS Manager
FROM employee
LEFT JOIN role ON employee.role_id = role.id
LEFT JOIN department ON role.department_id = department.id
LEFT JOIN managers ON employee.manager_id = managers.employee_id`;


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

function addNewRole() {
    let departments;
    //Get an array of the departments so that the role questions can be asked
    db.promise().query(queryDepartments)
    .then(([rows,fields]) => {
        //Returned row { name, department id }
        //Check to see if any department exists first
        if(rows.length === 0) {
            console.log(`\nThere are no departments yet!  Please add a department first before creating a role.\n`);
            inquirer.prompt([backToStart])
            .then(userChoice => {
                if(userChoice.back_to_start) {
                    runProgram();
                } else {
                    console.log('\nHave a nice day!');
                    process.exit();
                }
            })
            .catch(err => {
                console.log(err);
            });
        } else {
            departments = rows.map(row => {
                return `${row["department id"]}. ${row.name}`;
            });
            db.promise().query(queryRoles)
            .then(([rows,fields]) => {
                console.log(cTable.getTable(rows));
                console.log(`Above is the list of current roles.\n`);
    
                //Inquire the add role questions
                inquirer.prompt(
                    newRoleQs(departments)
                )
                .then(roleOb => {
                    const depId = parseInt(roleOb.role_dep_id.split(".")[0]);
                    const roleParams = [roleOb.role_name,depId,roleOb.role_salary];
                    let roleName = roleParams[0];
                    
                    //Add the role
                    db.promise().query(addRoleQuery,roleParams)
                    .then(([rows,fields]) => {
                        console.log(`\nThe role '${roleName}' has been added.`);
                        inquirer.prompt([backToStart])
                        .then(userChoice => {
                            if(userChoice.back_to_start) {
                                runProgram();
                            } else {
                                console.log('\nHave a nice day!');
                                process.exit();
                            }
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
            })
            .catch(err => {
                console.log(err);
            });
        }
    })
    .catch(err => {
        console.log(err);
    });
}

function addNewEmployee() {
    let managersArr, rolesArr;
    //Check to see if any roles exist before adding employee
    db.promise().query("SELECT * FROM role")
    .then(([rows,fields]) => {
        //Do any roles exist yet?
        if(rows.length === 0) {
            console.log(`\nThere are no roles (and maybe no departments) yet.  Please make sure at least one role exists before adding an employee.\n`);
            //Ask if the user wants to perform another action or quit.
            inquirer.prompt([backToStart])
            .then(userChoice => {
                if(userChoice.back_to_start) {
                    runProgram();
                } else {
                    console.log('\nHave a nice day!');
                    process.exit();
                }
            })
            .catch(err => {
                console.log(err);
            });
        } else {
            db.promise().query(dropManagersTable)
            .then(() => {
                db.promise().query(populateManagers)
                .then(() => {
                    db.promise().query(`SELECT * FROM managers`)
                    .then(([rows,fields]) => {
                        //Get the managers from the temporary managers table
                        managersArr = rows;
                        db.promise().query(`SELECT role.id, role.title FROM role`)
                        .then(([rows,fields]) => {
                            rolesArr = rows;
                            //Show current list of employees
                            db.promise().query(identifyManagers)
                            .then(([rows,fields]) => {
                                console.log(cTable.getTable(rows));
        
                                //Create arrays to handle role choices and manager choices
                                let roleChoices = rolesArr.map(roleOb => {
                                    return `${roleOb.id}. ${roleOb.title}`;
                                });
                                let managerChoices = managersArr.map(managerOb => {
                                    return `${managerOb.employee_id}. ${managerOb.first_name} ${managerOb.last_name}`;
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
                                        //Drop the managers table
                                        db.promise().query(dropManagersTable)
                                        .then(() => {
                                            //Drop the managers table
                                            db.promise().query(dropManagersTable)
                                            .then(() => {
        
                                                //Ask if the user wants to perform another action or quit.
                                                inquirer.prompt([backToStart])
                                                .then(userChoice => {
                                                    if(userChoice.back_to_start) {
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
                })
                .catch(err => {
                    console.log(err);
                });
            })
            .catch(err => {
                console.log(err);
            });
        }
    })
    .catch(err => {
        console.log(err);
    });
};

//Role update section
const up_role_q1 = `SELECT CONCAT(employee.first_name, ' ', employee.last_name) AS Employee, role.title AS 'Current Title'
FROM employee
LEFT JOIN role ON employee.role_id = role.id`;

function updateRole() {
    let empArr, empList, roleList, roleChangeMsg, empId, emp_name;

    //Check to see whether any employees exist yet
    db.promise().query("SELECT * FROM employee")
    .then(([rows,fields]) => {
        if(rows.length === 0) {
            console.log(`\nThere are no employees whose roles can be changed yet.\n`);
            //Ask if the user wants to perform another action or quit.
            inquirer.prompt([backToStart])
            .then(userChoice => {
                if(userChoice.back_to_start) {
                    runProgram();
                } else {
                    console.log('\nHave a nice day!');
                    process.exit();
                }
            });
        } else {
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

    //Check to see whether any employees exist yet
    db.promise().query("SELECT * FROM employee")
    .then(([rows,fields]) => {
        if(rows.length === 0) {
            console.log(`\nThere are no employees whose manager can be changed yet.\n`);
            //Ask if the user wants to perform another action or quit.
            inquirer.prompt([backToStart])
            .then(userChoice => {
                if(userChoice.back_to_start) {
                    runProgram();
                } else {
                    console.log('\nHave a nice day!');
                    process.exit();
                }
            });
        } else {
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
                                        //Drop the managers table
                                        db.promise().query(dropManagersTable)
                                        .then(() => {
                                            //Ask if the user wants to perform another action or quit.
                                            inquirer.prompt([backToStart])
                                            .then(userChoice => {
                                                if(userChoice.back_to_start) {
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
    })
    .catch(err => {
        console.log(err);
    });
}

function employeesByManager() {
    let manager_list;
    let man_id_list;

    //Check to see whether any employees exist yet
    db.promise().query("SELECT * FROM employee")
    .then(([rows,fields]) => {
        if(rows.length === 0) {
            console.log(`\nThere are no employees yet and thus no managers.\n`);
            //Ask if the user wants to perform another action or quit.
            inquirer.prompt([backToStart])
            .then(userChoice => {
                if(userChoice.back_to_start) {
                    runProgram();
                } else {
                    console.log('\nHave a nice day!');
                    process.exit();
                }
            });
        } else {
            //Drop and recreate managers table
            db.promise().query(dropManagersTable)
            .then(() => {
                //Add managers table back
                db.promise().query(populateManagers)
                .then(([rows,fields]) => {
                    //Select manager_id from employees and filter out the null values
                    db.promise().query('SELECT employee.manager_id FROM employee')
                    .then(([rows,fields]) => {
                        //Convert returned object array to array of numbers
                        man_id_list = rows.map(row => row.manager_id).filter(idVal => idVal !== null);

                        //Only get unique values for manager ids
                        man_id_list = [...new Set(man_id_list)];

                        //Run query to only get employees who have been assigned as managers
                        db.promise().query(`SELECT * FROM managers WHERE managers.employee_id IN (${man_id_list.join(",")})`)
                        .then(([rows,fields]) => {
                            //Turn the list into a selectable array
                            manager_list = rows.map(row => `${row.id}. ${row.first_name} ${row.last_name}`);
                            
                            //Inquire about which manager is wanted
                            inquirer.prompt([
                                qList("which_manager","Select a manager from the list below to see that manager's employees.",manager_list)
                            ])
                            .then(theManager => {
                                let managerArray = theManager.which_manager.split(".");
                                //Get manager name and id for further use
                                let managerId = parseInt(managerArray[0]);
                                let managerName = managerArray[1].trim();

                                console.log(`Below are all employees who report to ${managerName}.\n`);
                                //Retrieve the employees in question
                                db.promise().query(`SELECT CONCAT(employee.first_name, ' ', employee.last_name) AS 'Employees Reporting to ${managerName}' FROM employee WHERE employee.manager_id = ?`,managerId)
                                .then(([rows,fields]) => {
                                    //console.log(fields);
                                    console.log(cTable.getTable(rows));
                                    db.promise().query(dropManagersTable)
                                    .then(() => {
                                        //Ask if the user wants to perform another action or quit.
                                        inquirer.prompt([backToStart])
                                        .then(userChoice => {
                                            if(userChoice.back_to_start) {
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
                                })
                                .catch(err => {
                                    console.log(err);
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
            })
            .catch(err => {
                console.log(err);
            });
        }
    })
    .catch(err => {
        console.log(err);
    });
}

function employeesByDepartment() {
    let departmentList; //Will hold an array of objects with a department_id = integer, role_ids = array of integers
    let departmentChoices; //Will hold the list of department choices for inquirer

    //Query the roles table - create array with containing all department ids - eliminate repeats by creating set - loop through roles to get role_ids associated with specific departments
    db.promise().query(`SELECT * from role`)
    .then(([rows,fields]) => {
        if(rows.length === 0) {
            console.log(`\nThere are no roles (or employees) to place in departments!\n`);
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
        } else {
            let depArr = [];
            for(let i = 0; i < rows.length; i++) {
                depArr.push(rows[i].department_id);
            }
            depArr = [...new Set(depArr)];
    
            //Create the array of objects
            departmentList = depArr.map(depNumber => {
                return { dep_id: depNumber, role_ids: [] };
            });
    
            //Populate role_ids arrays
            for(let i = 0; i < rows.length; i++) {
                for(let j = 0; j < departmentList.length; j++) {
                    if(rows[i].department_id === departmentList[j].dep_id) {
                        departmentList[j].role_ids.push(rows[i].id);
                        break;
                    }
                }
            }
            
            //Query the departments to form the choices array
            db.promise().query(`SELECT * FROM department`)
            .then(([rows,fields]) => {
                
                //Choice Array
                departmentChoices = rows.map(dChoice => `${dChoice.id}. ${dChoice.name}`);
                
                //Inquire about department
                inquirer.prompt([
                    qList("dep_chosen","Choose a department from the list below to see its employees.",departmentChoices)
                ])
                .then(depChoice => {
                    let depId, depName;
                    let depArray = depChoice.dep_chosen.split(".");
                    depId = parseInt(depArray[0]);
                    depName = depArray[1].trim();
    
                    let depOb = departmentList.filter(dep => dep.dep_id === depId)[0];
                    if(!depOb) {
                        console.log(`\nThere are no employees in the ${depName} department.\n`);
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
                    } else {
                        console.log(`\nBelow is a list of all of the employees in the ${depName} department.\n`);
    
                        //Query the employee table to get only those employees whose role_id is in the array of role_ids for the department in question
                        db.promise().query(`SELECT CONCAT(employee.first_name, ' ', employee.last_name) AS 'Employee Name', role.title AS Title
                        FROM employee
                        LEFT JOIN role ON employee.role_id = role.id WHERE role.id IN (${depOb.role_ids.join(",")})`)
                        .then(([rows,fields]) => {
                            console.log(cTable.getTable(rows));
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
                            if(err) {
                                console.log(err);
                            }
                        });
                    }
                });
            })
            .catch(err => {
                if(err) {
                    console.log(err);
                }
            });
        }
    })
    .catch(err => {
        if(err) {
            console.log(err);
        }
    });
}

function getDepartmentBudget() {
    //This should use some of the same resources from employeesByDepartment
    let departmentList; //Will hold an array of objects with a department_id = integer, role_ids = array of integers
    let departmentChoices; //Will hold the list of department choices for inquirer

    //Query the roles table - create array with containing all department ids - eliminate repeats by creating set - loop through roles to get role_ids associated with specific departments
    db.promise().query(`SELECT * from role`)
    .then(([rows,fields]) => {
        if(rows.length === 0) {
            console.log(`\nThere are no roles to pay salaries at the moment.\n`);
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
        } else {
            let depArr = [];
            for(let i = 0; i < rows.length; i++) {
                depArr.push(rows[i].department_id);
            }
            depArr = [...new Set(depArr)];
    
            //Create the array of objects
            departmentList = depArr.map(depNumber => {
                return { dep_id: depNumber, role_ids: [] };
            });
    
            //Populate role_ids arrays
            for(let i = 0; i < rows.length; i++) {
                for(let j = 0; j < departmentList.length; j++) {
                    if(rows[i].department_id === departmentList[j].dep_id) {
                        //Push object {id,salary} into role_ids
                        departmentList[j].role_ids.push({id: rows[i].id, salary: rows[i].salary});
                        break;
                    }
                }
            }
            
            //Query the departments to form the choices array
            db.promise().query(`SELECT * FROM department`)
            .then(([rows,fields]) => {
                
                //Choice Array
                departmentChoices = rows.map(dChoice => `${dChoice.id}. ${dChoice.name}`);
                
                //Inquire about department
                inquirer.prompt([
                    qList("dep_chosen","Choose a department from the list below to see its budget.",departmentChoices)
                ])
                .then(depChoice => {
                    let depId, depName;
                    let depArray = depChoice.dep_chosen.split(".");
                    depId = parseInt(depArray[0]);
                    depName = depArray[1].trim();
    
                    let depOb = departmentList.filter(dep => dep.dep_id === depId)[0];

                    if(!depOb) {
                        console.log(`\nThere are no employees in the ${depName} department.\n`);
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
                    } else {
                        //Gather role ids in a new array
                        let roleIds = [];
                        for(let i = 0; i < depOb.role_ids.length; i++) {
                            roleIds.push(depOb.role_ids[i].id);
                        }
                        console.log(`\nBelow is the budget for the ${depName} department.\n`);

                        //Query the employee table to get only those employees whose role_id is in the array of role_ids for the department in question
                        db.promise().query(`SELECT * FROM employee WHERE employee.role_id IN (${roleIds.join(",")})`)
                        .then(([rows,fields]) => {
                            //console.log(rows);
                            let budget = 0;

                            //Loop through matched employees and add salary to budget
                            for(let i = 0; i < rows.length; i++) {
                                for(let j = 0; j < depOb.role_ids.length; j++) {
                                    if(rows[i].role_id === depOb.role_ids[j].id) {
                                        budget += parseInt(depOb.role_ids[j].salary);
                                        break;
                                    }
                                }
                            }

                            console.log(`\n\t$${budget}`);
                            
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
                            if(err) {
                                console.log(err);
                            }
                        });
                    }
                });
            })
            .catch(err => {
                if(err) {
                    console.log(err);
                }
            });
        }
    })
    .catch(err => {
        if(err) {
            console.log(err);
        }
    });
}

//Methods for deleting departments, roles, and employees - I may not finish these
//Downsizes an employee
function downsize() {
    let employeeList;
    db.promise().query(`SELECT id, CONCAT(first_name, ' ', last_name) AS 'Employee Name' FROM employee`)
    .then(([rows,fields]) => {
        employeeList = rows.map(row => {
            return `${row.id}. ${row["Employee Name"]}`;
        });
        
        if(employeeList.length === 0) {
            //Darn it!  No employees to dismiss!
            console.log("\nThere are no employees yet!\n");
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
        } else {
            employeeList.push("None");
            //Whom to get rid of...
            inquirer.prompt(
                [qList("whomToAx","Which employee from the list below do you wish to let go?",employeeList)]
            )
            .then(scapegoat => {
                if(scapegoat.whomToAx === "None") {
                    console.log(`No employee will be downsized.`);
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
                } else {
                    const employeeDetails = scapegoat.whomToAx.split(".");
                    const empId = parseInt(employeeDetails[0]);
                    const employeeName = employeeDetails[1].trim();
                    
                    //You're fired!
                    db.promise().query(`DELETE FROM employee WHERE id = ?`,empId)
                    .then(([rows,fields]) => {
                        console.log(`\n${employeeName} has left to pursue other opportunities.`);
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
            .catch(err => {
                console.log(err);
            });
        }
    })
    .catch(err => {
        console.log(err);
    });
}

//Outsources a role
function outsource() {
    let roleList;
    db.promise().query(`SELECT role.id, role.title FROM role`)
    .then(([rows,fields]) => {
        if(rows.length === 0) {
            //No roles yet!
            console.log(`\nThere are no roles yet!\n`);
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
        } else {
            roleList = rows.map(row => {
                return `${row.id}. ${row.title}`;
            });
            roleList.push("None");
            
            //Inquire about which role to delete
            inquirer.prompt([
                qList("toOutsource","Which of the following roles would you like to eliminate?",roleList)
            ])
            .then(outsourcee => {
                if(outsourcee.toOutsource === "None") {
                    console.log(`\nNo role will be eliminated.\n`);
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
                } else {
                    const outArr = outsourcee.toOutsource.split(".");
                    const roleId = parseInt(outArr[0]);
                    const roleName = outArr[1].trim();
                    //Drop the role
                    db.promise().query(`DELETE FROM role WHERE id = ?`,roleId)
                    .then(() => {
                        console.log(`\nThe role '${roleName}' has been eliminated!\n`);
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
            .catch(err => {
                console.log(err);
            });
        }
        
    })
    .catch(err => {
        console.log(err);
    });
}

//Reorganizes a department to, well, nothing
function reorganize() {
    db.promise().query("SELECT * FROM department")
    .then(([rows,fields]) => {
        if(rows.length === 0) {
            console.log(`\nThere are no departments yet!  You probably should add one!\n`);
            //Inquire about more actions
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
        } else {
            let depList = rows.map(row => `${row.id}. ${row.name}`);
            depList.push("None")
            
            //Inquire about which department to eliminate
            inquirer.prompt([
                qList("choppingBlock","Which department do you wish to eliminate?",depList)
            ])
            .then(optimized => {
                if(optimized.choppingBlock === "None") {
                    console.log("\nAll departments will be retained.\n");
                    //Inquire about more actions
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
                } else {
                    const depArr = optimized.choppingBlock.split(".");
                    const depId = parseInt(depArr[0]);
                    const depName = depArr[1].trim();
                    //Eliminate the department
                    db.promise().query("DELETE FROM department WHERE id = ?", depId)
                    .then(() => {
                        console.log(`\nThe department '${depName}' has been eliminated.\n`);
                        //Inquire about more actions
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
            .catch(err => {
                console.log(err);
            });
        }
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
                //Create the managers table
                db.promise().query(dropManagersTable)
                .then(() => {
                    db.promise().query(populateManagers)
                    .then(() => {
                        db.promise().query(identifyManagers)
                        .then(([rows,fields]) => {
                            console.log('\n');
                            console.log(cTable.getTable(rows));
                        })
                        .catch(err => {
                            console.log(err);
                        })
                        .then(() => {
                            //drop managers table
                            db.promise().query(dropManagersTable)
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
                            })
                            .catch(err => {
                                console.log(err);
                            });
                        });
                    })
                    .catch(err => {
                        console.log(err);
                    });
                })
                .catch(err => {
                    console.log(err);
                })
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
                addNewRole();
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
            case "See Employees by Manager":
                employeesByManager();
                break;
            case "See Employees by Department":
                employeesByDepartment();
                break;
            case "See Department Budget":
                getDepartmentBudget();
                break;
            case "Dismiss Employee":
                downsize();
                break;
            case "Eliminate Role":
                outsource();
                break;
            case "Eliminate Department":
                reorganize();
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