const mongoose = require("mongoose");

const History_Sales = mongoose.model("History_Sales", {
	date: {
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

module.exports = History_Sales;