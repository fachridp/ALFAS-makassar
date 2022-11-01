const mongoose = require("mongoose");
const ObjectId = require('mongodb').ObjectID;

const Product_Debt = mongoose.model("Product_Debt", {
	alt_id: {
		type: ObjectId,
	},
	product_name: {
		type: String,
		require: true,
	},
	category: {
		type: String,
		require: true,
	},
	harga_pokok: {
		type: Number,
		minimum: 0,
		exclusiveMaximum: 10000000,
		require: true,
	},
	selling_price: {
		type: Number,
		minimum: 0,
		exclusiveMaximum: 10000000,
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
	total_price: {
		type: Number,
		minimum: 0,
		exclusiveMaximum: 10000000,
		require: true,
	},
	profit: {
		type: Number,
		minimum: 0,
		exclusiveMaximum: 10000000,
		require: true,
	}
});

module.exports = Product_Debt;