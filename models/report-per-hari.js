const mongoose = require("mongoose");
const ObjectId = require('mongodb').ObjectID;

const Report_Per_Hari = mongoose.model("Report_Per_Hari", {
	alt_id: {
		type: ObjectId,
	},
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
})

module.exports = Report_Per_Hari;