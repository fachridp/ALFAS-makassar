const mongoose = require("mongoose");

const Unit = mongoose.model("Unit", {
	unit: {
		type: String,
		require: true,
	},
})

module.exports = Unit;