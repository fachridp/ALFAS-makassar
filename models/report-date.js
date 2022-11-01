const mongoose = require("mongoose");
const ObjectId = require('mongodb').ObjectID;

const Report_Date = mongoose.model("Report_Date", {
	alt_id: {
		type: ObjectId,
	},
	date: {
		type: String,
	},
})

module.exports = Report_Date;