const mongoose = require("mongoose");
const ObjectId = require('mongodb').ObjectID;

const Supplier_Date = mongoose.model("Supplier_Date", {
	alt_id: {
		type: ObjectId,
	},
	date: {
		type: String,
	},
	total_items: {
		type: Number,
	}
})

module.exports = Supplier_Date;