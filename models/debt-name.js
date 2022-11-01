const mongoose = require("mongoose");

const Debt_Name = mongoose.model("Debt_Name", {
	name: {
		type: String,
		require: true,
	},
})

module.exports = Debt_Name;