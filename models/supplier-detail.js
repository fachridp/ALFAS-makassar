const mongoose = require("mongoose");
const ObjectId = require('mongodb').ObjectID;

const Supplier_Detail = mongoose.model("Supplier_Detail", {
	alt_id: {
		type: ObjectId,
	},
	product_name: {
		type: String,
	},
	category: {
		type: String,
	},
	qty: {
		type: Number,
		minimum: 0,
		exclusiveMaximum: 10000000,
		require: true,
	},
	unit: {
		type: String,
	},
	harga_pokok: {
		type: Number,
		minimum: 0,
		exclusiveMaximum: 10000000,
	},
	harga_jual: {
		type: Number,
		minimum: 0,
		exclusiveMaximum: 10000000,
	}
})

module.exports = Supplier_Detail;
