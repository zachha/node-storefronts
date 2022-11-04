//required packages
const mysql = require("mysql");
const inquirer = require("inquirer");
const Table = require("cli-table");
require('dotenv').config();

const connection = mysql.createConnection({
  host: "localhost",
  port: "3306",
  user: "root",
  password: process.env.DB_PASSWORD,
  database: "node_storefrontdb"
});

//outlines a table containing the product information from the database
let table = new Table({
  head: ["Department ID", "Department Name", "Overhead Costs", "Product Sales", "Total Profit"]
});

// asks supervisor what action they would like to take
inquirer
  .prompt([
    {
      type: "list",
      name: "supervisor",
      message: "What action would you like to take?",
      choices: [
        "View Product Sales by Department",
        "Create New Department"
      ]
    }
  ])
  .then(answers => {
    const selection = answers.supervisor;
    doAction(selection);
  });

// object literal that runs the appropriate functions depending on the action chosen
function doAction(selection) {
  let actions = {
    "View Product Sales by Department": function() {
      viewDepartment();
    },
    "Create New Department": function() {
      addDepartment();
    }
  };
  return actions[selection]();
}

//creates and displays a table of the store departments and creates a temporary column displaying total profits for each department
function viewDepartment() {
    // this is the wordiest query in the world note to self to go back and translate into insertable ? object at some point
    connection.query(
      "SELECT departments.department_id, departments.department_name, departments.over_head_costs, SUM(products.product_sales) AS sales, SUM(products.product_sales) - departments.over_head_costs AS profit FROM products JOIN departments ON products.department_name = departments.department_name GROUP BY departments.department_name ORDER BY departments.department_id",
      (err, res) => {
        if (err) throw err;
        for (i = 0; i < res.length; i++) {
          table.push([
            res[i].department_id,
            res[i].department_name,
            res[i].over_head_costs,
            res[i].sales,
            res[i].profit
          ]);
        }
        console.log(table.toString());
      }
      
    );
}

//prompts the supervisor and creates specified department in the database
function addDepartment() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "departmentName",
        message: "Please input the name of the Department to add"
      },
      {
        type: "input",
        name: "departmentCost",
        message: "Please enter the Over Head Costs of the Department"
      }
    ])
    .then(answers => {
      let query = connection.query(
        "INSERT INTO departments SET ?",
        {
          department_name: answers.departmentName,
          over_head_costs: answers.departmentCost
        },
        function(err, res) {
          if (err) throw err;
          console.log("\n New Department Inserted");
        }
      );
    });
}
