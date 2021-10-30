INSERT INTO department (name) 
VALUES 
    ('Autobots'),
    ('Decepticons'),
    ('GI Joe'),
    ('Cobra');

INSERT into role (title, salary, department_id)
VALUES
    ('Autobot Commander',10000000,1),
    ('Dinobot',5000000,1),
    ('Aerialbot',1000000,1),
    ('Autobot',60000,1),
    ('Decepticon Commander',100000000,2),
    ('Constructicon',100,2),
    ('Stunticon',1000,2),
    ('Combaticon',10000,2),
    ('Decepticon',10000000,2),
    ('General',2000000,3),
    ('Colonel',1500000,3),
    ('Major',1250000,3),
    ('Captain',1000000,3),
    ('Emperor',10000000,4),
    ('Dictator',9000000,4),
    ('Crime Lord',8000000,4),
    ('Dreadnok',1000,4),
    ('Crimson Guard',750,4),
    ('Thug',50,4);

INSERT into employee (first_name,last_name,role_id,manager_id)
VALUES
    ('Optimus','Prime',1,NULL),
    ('Omega','Supreme',4,1),
    ('Hot','Rod',4,1),
    ('Grim','Lock',2,1),
    ('Slag','Slag',2,4),
    ('Sludge','Sludge',2,4),
    ('Mega','Tron',5,NULL),
    ('Star','Scream',9,7),
    ('Sound','Wave',9,7);

SELECT employee.first_name, employee.last_name, role.title AS title, role.salary AS salary
    FROM employee
    LEFT JOIN role ON employee.role_id = role.id;

SELECT department.name, department.id AS department_id FROM department;

SELECT role.title, role.id AS role_id, department.name AS department, role.salary AS salary
    FROM role
    LEFT JOIN department on role.department_id = department.id;

SELECT employee.id, employee.first_name, employee.last_name, role.title AS title, department.name AS department, role.salary AS salary, employee.manager_id AS manager
    FROM employee
    LEFT JOIN role ON employee.role_id = role.id
    LEFT JOIN department ON role.department_id = department.id;

DROP TABLE IF EXISTS managers;

CREATE TABLE managers (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(30),
    last_name VARCHAR(30)
) SELECT employee.first_name, employee.last_name FROM employee;

SELECT * FROM managers;

SELECT employee.id, CONCAT(employee.first_name, ' ', employee.last_name) AS 'Employee Name', role.title AS Title, department.name AS Department, role.salary AS Salary, CONCAT(managers.first_name, ' ', managers.last_name) AS Manager
    FROM employee
    LEFT JOIN role ON employee.role_id = role.id
    LEFT JOIN department ON role.department_id = department.id
    LEFT JOIN managers ON employee.manager_id = managers.id;

DROP TABLE managers;