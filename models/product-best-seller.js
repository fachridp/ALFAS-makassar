const mongoose = require("mongoose");

const Product_Best_Seller = mongoose.model("Product_Best_Seller", {
	date: {
		type: String,
	},
	month: {
		type: String,
	},
	product_name: {
		type: String,
		require: true,
	},
	category: {
		type: String,
		require: true,
	},
	qty: {
		type: Number,
		minimum: 0,
		exclusiveMaximum: 10000000,
		require: true,
	},
	unit: {
		type: String,
		require: true,
	},
	selling_price: {
		type: Number,
		minimum: 0,
		exclusiveMaximum: 10000000,
		require: true,
	},
})

module.exports = Product_Best_Seller;