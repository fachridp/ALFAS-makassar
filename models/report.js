 const mongoose = require("mongoose");

const Report = mongoose.model("Report", {
	periode: {
		type: String,
		require: true,
	},
})

module.exports = Report;