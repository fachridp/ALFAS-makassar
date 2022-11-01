const mongoose = require("mongoose");

const Product = mongoose.model("Product", {
	product_name: {
		type: String,
		require: true,
	},
})

module.exports = Product;