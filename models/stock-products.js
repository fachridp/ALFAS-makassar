const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const StockProductsSchema = new Schema({
	// product_code: {
	// 	type: String,
	// 	require: true,
	// },
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
	isi: {
		type: String,
	}
});

module.exports = Stock_Product = mongoose.model("Stock_Product", StockProductsSchema);