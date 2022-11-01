const mongoose = require("mongoose");

const Category = mongoose.model("Category", {
	category: {
		type: String,
		require: true,
	},
})

module.exports = Category;