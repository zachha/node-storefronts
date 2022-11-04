const mysql = require("mysql");
const inquirer = require("inquirer");
const Table = require("cli-table");
require('dotenv').config();


const connection = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: process.env.DB_PASSWORD,
    database: 'node_storefrontdb'
});
//outlines a table containing the product information from the database
let table = new Table({
  head: ["Item ID", "Product Name", "Department", "Price", "Stock"]
});
// asks manager what action they would like to take
inquirer.prompt([
    {
    type: "list",
    name: "viewProducts",
    message: "What action would you like to take?",
    choices: ["View Products for Sale",
            "View Low Inventory",
            "Add to Inventory",
            "Add New Product"]
    }
  ]).then(answers => {
        const selection = answers.viewProducts;
        doAction(selection);
  });
// object literal that runs the appropriate functions depending on the action chosen
function doAction(selection) {
  let actions = {
    "View Products for Sale": function() {
      let addAction = false;
      viewInv();
    },
    "View Low Inventory": function() {
      viewLowInv();
    },
    "Add to Inventory": function() {
      addAction = true;
      viewInv(addAction);
    },
    "Add New Product": function() {
      addProduct();
    }
  };
  return actions[selection]();
}
//creates and displays the same table the customer sees to the manager
function viewInv(addAction) {
    connection.query("SELECT * FROM products", function(err, res) {
        if (err) throw err;
        for (i=0;i<res.length;i++) {
            table.push([
                res[i].item_id,
                res[i].product_name,
                res[i].department_name,
                res[i].price,
                res[i].stock_quantity
            ]);
        }
        console.log(table.toString());
        let tableData = res;
        if(addAction === true) {
            addInv(tableData);
        }
    });
}
//creates and displays a table of inventory with stock under 5 units to the manager
function viewLowInv() {
    connection.query("SELECT * FROM products", function(err, res) {
        if (err) throw err;
        for (i=0;i<res.length;i++) {
            if(res[i].stock_quantity < 5) {
                table.push([
                res[i].item_id,
                res[i].product_name,
                res[i].department_name,
                res[i].price,
                res[i].stock_quantity
                ]);
            }
        }
        console.log(table.toString());
    });
}
//prompts the manager and adds stock in the database for the selected inventory
function addInv(tableData) {
    inquirer.prompt([
        {
          type: "input",
          name: "productId",
          message: "Please input ID of product you would like to add stock to"
        },
        {
          type: "input",
          name: "amountAdded",
          message: "How many units would you like to add?"
        }
      ])
      .then(answers => {
        let productIndex = (answers.productId-1);
        let newStock = (parseInt(tableData[productIndex].stock_quantity)) + (parseInt(answers.amountAdded));
        //put some validation here if I have time
        if(answers.productId < 1 || answers.productId > tableData.length) {
            console.log("Please enter a valid product ID");
        }else if(answers.amountPurchased > tableData[productIndex].stock_quantity) {
            console.log("Insuffucient Quantity!");
        } else {
            console.log("\nUpdating " + tableData[productIndex].product_name);
            updateStock(tableData, productIndex, newStock);
        }
      });
}

function updateStock(tableData, productIndex, newStock) {
    var query = connection.query(
      "UPDATE products SET ? WHERE ?",
      [
        {
          stock_quantity: newStock
        },
        {
          item_id: tableData[productIndex].item_id
        }
      ],
      function(err, data) {
        if (err) throw err;
        console.log("\nproduct updated");
        console.log("\nNew stock is: " + newStock);
      }
    );
    connection.end();
}
//prompts manager and adds new specified product to the inventory
function addProduct() {
    inquirer
      .prompt([
        {
          type: "input",
          name: "productName",
          message: "Please input the name of the Product to add"
        },
        {
          type: "input",
          name: "productDepartment",
          message: "Please enter the department of the product"
        },
        {
          type: "input",
          name: "productPrice",
          message: "Please enter the price of the product"
        },
        {
          type: "input",
          name: "productStock",
          message: "Please enter the amount of product you would like to obtain"
        }
      ])
      .then(answers => {
          let query = connection.query(
            "INSERT INTO products SET ?",
            {
                product_name: answers.productName,
                department_name: answers.productDepartment,
                price: answers.productPrice,
                stock_quantity: answers.productStock
            },
            function(err, res) {
              if (err) throw err;
              console.log("\n New Product Inserted");
            }
          );
      });
}
