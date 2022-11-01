const mongoose = require("mongoose");
const ObjectId = require('mongodb').ObjectID;

const Date_Report_Per_Bulan = mongoose.model("Date_Report_Per_Bulan", {
	alt_id: {
		type: ObjectId,
	},
	date: {
		type: String,
	},
	dateIn: {
		type: String,
	},
	sum_modal: {
		type: Number,
		minimum: 0,
		exclusiveMaximum: 10000000,
		require: true,
	},
	sum_omzet: {
		type: Number,
		minimum: 0,
		exclusiveMaximum: 10000000,
		require: true,
	},
	sum_profit: {
		type: Number,
		minimum: 0,
		exclusiveMaximum: 10000000,
		require: true,
	},
	status: {
		type: String,
	}
})

module.exports = Date_Report_Per_Bulan;