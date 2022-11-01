const mongoose = require("mongoose");

const Suppliers = mongoose.model("Suppliers", {
	supplier_name: {
		type: String,
		require: true,
	},
	address: {
		type: String,
		require: true,
	},
	phone_number: {
		type: String,
		require: true,
	},
	description: {
		type: String,
		require: true,
	},
})

module.exports = Suppliers;