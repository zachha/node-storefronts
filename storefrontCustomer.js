const mysql = require('mysql');
const inquirer = require('inquirer');
const Table = require('cli-table');
require('dotenv').config();

var connection = mysql.createConnection({
  host: "localhost",
  port: "3306",
  user: "root",
  password: process.env.DB_PASSWORD,
  database: "node_storefrontdb"
});

let table = new Table({
    head: ["Item ID", "Product Name", "Department", "Price", "Stock"]
});

connection.connect(function(err) {
  if (err) {
    throw err;
  }
  console.log("connected as id " + connection.threadId);
  //populates/displays database products to user
  selectAll();
  //prompts user to purchase products
});
//populates the table from the database and displays to user
function selectAll() {
  connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;
    for(i=0;i<res.length;i++) {
        table.push([
          res[i].item_id,
          res[i].product_name,
          res[i].department_name,
          res[i].price,
          res[i].stock_quantity
        ]);
    }
    console.log(table.toString());
    purchaseProduct(res);
  });
}

//user selects item and amount to purchase, database is checked and updated if appropriate
function purchaseProduct(res) {
    inquirer.prompt([
        {
          type: "input",
          name: "productId",
          message: "Please input ID of product you would like to purchase"
        },
        {
          type: "input",
          name: "amountPurchased",
          message: "How many units would you like to purchase?"
        }
      ])
      .then(answers => {
        let productIndex = (answers.productId-1);
        let newStock = (res[productIndex].stock_quantity) - (answers.amountPurchased);
        let purchasePrice = res[productIndex].price * answers.amountPurchased;
        let newSales = (res[productIndex].product_sales) + purchasePrice
        //put some validation here if I have time
        if(answers.productId < 1 || answers.productId > res.length) {
            console.log("Please enter a valid product ID");
        }else if(answers.amountPurchased > res[productIndex].stock_quantity) {
            console.log("Insuffucient Quantity!");
        } else {
            console.log("\nUpdating " + res[productIndex].product_name);
            updateStock(res, productIndex, newStock, purchasePrice, newSales);
        }
      });
}

function updateStock(res, productIndex, newStock, purchasePrice, newSales) {
    var query = connection.query(
      "UPDATE products SET ? WHERE ?",
      [
        {
          stock_quantity: newStock,
          product_sales: newSales
        },
        {
          item_id: res[productIndex].item_id
        }
      ],
      function(err, res) {
        if (err) throw err;
        console.log("\nproduct updated");
        console.log("\nNew stock is: " + newStock);
        console.log("\nThe cost of your purchase was: " + purchasePrice.toFixed(2));
      }
    );
    connection.end();
}