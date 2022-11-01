const mongoose = require("mongoose");

const Admin = mongoose.model("Admin", {
	unique_id: {
		type: Number,
	},
	username: {
		type: String,
		require: true,
	},
	password: {
		type: String,
		require: true,
	}
})

module.exports = Admin;