const mongoose = require("mongoose");
const ObjectId = require('mongodb').ObjectID;

const Debt_Date = mongoose.model("Debt_Date", {
	alt_id: {
		type: ObjectId,
	},
	date: {
		type: String,
	},
	total_utang: {
		type: Number,
	}
})

module.exports = Debt_Date;