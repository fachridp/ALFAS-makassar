// Import Moduls
const express = require('express');
const router = express.Router();
const Admin = require("../models/admin");
const moment = require("moment");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const map = require('underscore/cjs/map.js');
const dayjs = require('dayjs');

// Import Models
const Product = require("../models/product");
const Category = require("../models/category");
const Unit = require("../models/units");
const Suppliers = require("../models/suppliers");
const Stock_Products = require("../models/stock-products");
const Debt_Name = require("../models/debt-name");
const Product_Debt = require("../models/product-debt");
const History_Sales = require('../models/history-sales');
const Product_Best_Seller = require("../models/product-best-seller");
const New_Today_Sales = require("../models/new_today_sales");
const Supplier_Date = require("../models/supplier-date");
const Supplier_Detail = require("../models/supplier-detail");
const Debt_Date = require("../models/debt-date");
const Report = require("../models/report");
const Report_Date = require("../models/report-date");
const Report_Per_Hari = require("../models/report-per-hari");
const Date_Report_Per_Minggu = require("../models/date-report-per-minggu");
const Date_Report_Per_Bulan = require("../models/date-report-per-bulan");
const Date_Report_Per_Tahun = require("../models/date-report-per-tahun");
const Detail_Report_Per_Minggu = require("../models/detail-report-per-minggu");
const Detail_Report_Per_Bulan = require("../models/detail-report-per-bulan");
const Detail_Report_Per_Tahun = require("../models/detail-report-per-tahun");

// Helper Variabel
const ObjectId = require('mongodb').ObjectID;
let oldValues = [];
let oldValuesFormEditSales;
let currentIds = [];
let currentValues = [];
let currentReqBodyValues = [];
let lihatId;
let detailEdit;
let idDetail;
let debtName;
let supplier_name;
let periode_name;
let tanggal_periode_per_hari;
let tanggal_periode_per_minggu;
let tanggal_periode_per_bulan;
let tanggal_periode_per_tahun;
let editTodaySalesIdURL;
let routePathURL;
let getGeneratorValue;
let getmsgg;
let trigger = false;
let testV;
let testQty;
let currentEditValues;
let getDuplicateValueFormEditProductDebt;
let getDuplicateValueStockProducts;
let defaultValueQty = 0;
let daftar_produk_eceran = [{product_name: "Surya Besar"}, {product_name: "Surya Kecil"}]; // masukkan ke db
let daftar_unit_eceran = [{unit: "Batang"}]; // masukkan ke db
let getProdukEceranWithUnitEceran = [];
let checkQty = 0;
let triggerDecrement = true;
let triggerDecrement2 = true;
let triggerDecrementProcessEditProductDebt = false;
let getDuplicateValueStockProductAndFormEditWithoutUnitIds;
let getDuplicateValueStockProductAndFormEditWithoutUnitQty;
let getDuplicateValueStockProductAndFormEditIsiValue;
let defaultValueQtyUnitEceran;
let produkUnitEceran = [];
let unitProdukEceran2;

const app = express();

// Konfigruasi flash
app.use(cookieParser("secret"));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
router.use(flash());

// Login Page
router.get('/', function (req, res, next) {
	return res.render("login", {
		title: "LOGIN | ALFAS Makassar",
		layout: "../views/login",
	});
});

// Proses membaca inputan user pada input field
router.post('/login', function (req, res, next) {
	Admin.findOne({username: req.body.username}, function (err, data) {
		if(data) {
			if(data.password == req.body.password) {
				req.session.userId = data.unique_id;
				res.send({"Success":"Berhasil Masuk!"});
			} else {
				res.send({"Success" : "Kata Sandi Salah!"});
			}
		} else {
			res.send({"Success" : "Username tidak terdaftar!"});
		}
	});
}); 

// Dashboard Page
router.get('/dashboard', async (req, res, next) => {
	const new_today_sales = await New_Today_Sales.find();
	const products = await Product.find().count();
	
	let low;;
	let out;
	let result = [];

	// Menghitung berapa banyak document pada collection Product
	const low_stock = await Stock_Products.find( { qty: { $gt: 0, $lt: 6 } } ).count();
	const out_stock = await Stock_Products.find( { qty: { $eq: 0 } } ).count();

	// Get Omzet Today
	const omzets = await New_Today_Sales.aggregate([
			{
				$group: {
					_id: "$date",
					omzet_today: {$sum: "$total_price"}
				}
			}
		]);

	// Get Profit Today
	omzets.forEach(omzet => { 
		const omzet_ = omzet.omzet_today;
		const percentX = 10;

		function percentCalculation(a, b){
	  	const c = (parseFloat(a)*parseFloat(b))/100;
	  	return parseFloat(c);
		}
		result.push(percentCalculation(omzet_, percentX)); //calculate percentX% of number
	});

	// Get 3 Products Best Seller and filter the same date
	const product_best_sellers = await Product_Best_Seller.aggregate([
		{
			$group: {
					_id: "$month",
				},
		},
		{$sort: {_id: 1}},
	]);

	Admin.findOne({unique_id: req.session.userId}, function (err, data) {
		try {
			if (!data) {
				res.redirect('/');
			} else {
				return res.render("dashboard", {
					title: "DASHBOARD | ALFAS Makassar",
					layout: "../views/dashboard",
					products,
					omzets,
					result,
					low,
					out,
					low_stock,
					out_stock,
					product_best_sellers,
				});
			}
		} catch (err) {
			return;
		}
	});
});

// Detail Product Best Seller
router.get('/dashboard/detail/:_id', async (req, res, next) => {
	const product_best_sellers = await Product_Best_Seller.find({
		month: req.params._id,
		qty: {$gt: 9},
	}).limit(3).sort({qty: -1});

	return res.render("product-best-seller-detail", {
		title: "DETAIL BEST SELLER PRODUCT | ALFAS Makassar",
		layout: "../views/product-best-seller-detail",
		product_best_sellers,
	});
});

// Proses Delete All Peroduct Best Seller By Date
router.delete("/dashboard", async (req, res) => {
  await Product_Best_Seller.deleteMany(
    { 
    	month: req.body._id,
    },
  ).then((result) => {
    res.redirect("/dashboard");
  });
});

// Today Sales Page
router.get('/today-sales', async (req, res, next) => {
	const new_today_sales = await New_Today_Sales.find();
	const stock_products = await Stock_Products.findOne({product_name: "Surya Besar", category: "Rokok", unit: "Bungkus"});

	for (let i = 0; i < new_today_sales.length; i++) {
		if (new_today_sales[i].product_name === "Surya Besar" && new_today_sales[i].category === "Rokok" && new_today_sales[i].unit === "Batang" && new_today_sales[i].qty === 16) {
			trigger = true;
		}
	}

	testV = stock_products._id;
	testQty = stock_products.qty;

	// Get Omzet
	const omzets = await New_Today_Sales.aggregate([
			{
				$group: {
					_id: "$date",
					omzet_today: {$sum: "$total_price"}
				}
			}
	]);

	let result = [];

	// Get Profit
	omzets.forEach(omzet => { 
		const total_omzet = omzet.omzet_today;
		const percentX = 10;

		function percentCalculation(a, b){
	  	const c = (parseFloat(a)*parseFloat(b))/100;
	  	return parseFloat(c);
		}
		result.push(percentCalculation(total_omzet, percentX)); //calculate percentX% of number
	});

	getmsgg = req.flash("msg");

	return res.render("today-sales", {
		title: "TODAY SALES | ALFAS Makassar",
		layout: "../views/today-sales",
		new_today_sales,
		omzets,
		result,
		getmsgg,
		msg: req.flash("msg"),
	});
});

// Form Generator Record Page
router.get('/today-sales/generator', async (req, res, next) => {
	return res.render("generator", {
		title: "GENERATOR RECORD | ALFAS MAKASSAR",
		layout: "../views/generator",
	});
});

// Process To Get Data From Generator Record Form Page
router.post('/today-sales/generator', async (req, res, next) => {
	getGeneratorValue = req.body.generator;

	return res.redirect("/today-sales/generator/add-sales");
});

// Form Add New Today Sales Page
router.get('/today-sales/generator/add-sales', async (req, res, next) => {
	const products = await Product.find();
	const categorys = await Category.find();
	const units = await Unit.find();
	const stock_products = await Stock_Products.find();

	const date = moment().format('LL');

	let getAllProductName = [];
	let newVar = [];
	let getIdString = [];
	let FixArr = [];
	let a = 0;
	let b = 0;

	for (let i = 0; i < stock_products.length; i++) {
		newVar.push(stock_products[i]);
	}

	for (let i = 0; i < newVar.length; i++) {
		getIdString.push(newVar[i]._id.toString());
	}

	getmsgg = req.flash("msg");

	return res.render('add-sales', {
		title: "ADD TODAY SALES | ALFAS Makassar",
		layout: "../views/add-sales",
		products,
		categorys,
		units,
		stock_products,
		date,
		getAllProductName,
		newVar,
		ObjectId,
		getIdString,
		getGeneratorValue,
		getmsgg,
		msg: req.flash("msg"),
	});
});

// Process To Get Data From Add New Today Sales Page Form
router.post("/today-sales", async (req, res, next) => {
	const new_today_sales_find_all = await New_Today_Sales.find();
	const stock_products = await Stock_Products.find();
	const reports = await Report.find();
	let idPerhari;
	let idPerMinggu;
	let idPerBulan;
	let idPerTahun;
	let a = 0;
	let e = 0;
	let f = 0;
	let y = 0;
	let sumModalPerMinggu = 0;
	let sumOmzetPerMinggu = 0;
	let sumProfitPerMinggu = 0;

	let sumModalPerBulan = 0;
	let sumOmzetPerBulan = 0;
	let sumProfitPerBulan = 0

	let sumModalPerTahun = 0;
	let sumOmzetPerTahun = 0;
	let sumProfitPerTahun = 0
	let firstDay;
	let firstNextWeekDate;
	let afterNextWeekFormat;

	for (let i = 0; i < reports.length; i++) {
		idPerhari = reports[0]._id;
		idPerMinggu = reports[1]._id;
		idPerBulan = reports[2]._id;
		idPerTahun = reports[3]._id;
	}

	let todaySalesCol = [];
	let stockProductsCol = [];
	let valueForFixTodaySales = [];
	let currentReqBodyValues = [];
	let getAllReqBodyValues = [];

	let data_input_object_id_add_sales = [];
	let data_input_date_add_sales = [];
	let data_input_month_add_sales = [];
	let data_input_product_name_add_sales = [];
	let data_input_category_add_sales = [];
	let data_input_harga_pokok_add_sales = [];
	let data_input_selling_price_add_sales = [];
	let data_input_qty_add_sales = [];
	let data_input_unit_add_sales = [];
	let data_input_total_price_add_sales = [];
	let data_input_profit_add_sales = [];

	let newId;
	const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
	let dt = new Date();
	let dtFormatDate = dayjs(dt).format('MMMM D, YYYY');
	
	let date = `${month[dt.getMonth()]} ${dt.getFullYear()}`;
	let preventInsertNewData = true;
	let productAvailable = [];

  if (getGeneratorValue > 1) {
  	for (let i = 0; i < req.body.product_name.length; i++) {
  		data_input_object_id_add_sales.push(ObjectId());
		  data_input_date_add_sales.push(req.body.date[i]);
		  data_input_month_add_sales.push(date);
		  data_input_product_name_add_sales.push(req.body.product_name[i]);
		  data_input_category_add_sales.push(req.body.category[i]);
		  data_input_harga_pokok_add_sales.push(req.body.harga_pokok[i]);
		  data_input_selling_price_add_sales.push(req.body.selling_price[i]);
		  data_input_qty_add_sales.push(req.body.qty[i]);
		  data_input_unit_add_sales.push(req.body.unit[i]);
		  data_input_total_price_add_sales.push(req.body.total_price[i]);
			data_input_profit_add_sales.push(req.body.profit[i]);
  	}

  	for (let i = 0; i < data_input_product_name_add_sales.length; i++) {
  		getAllReqBodyValues.push(
		  	{
		  		_id: data_input_object_id_add_sales[i],
		  		date: data_input_date_add_sales[i],
		  		month: data_input_month_add_sales[i],
		  		product_name: data_input_product_name_add_sales[i],
		  		category: data_input_category_add_sales[i],
		  		qty: parseInt(data_input_qty_add_sales[i]),
		  		unit: data_input_unit_add_sales[i],
		  		harga_pokok: parseInt(data_input_harga_pokok_add_sales[i]),
		  		selling_price: parseInt(data_input_selling_price_add_sales[i]),
		  		total_price: parseInt(data_input_total_price_add_sales[i]),
		  		profit: parseInt(data_input_profit_add_sales[i]),
		  	}
		  )
  	}

  	function getDuplicateValueFormAddTodaySales(array1, array2) {
			return array1.filter(object1 => {
			  return array2.some(object2 => {
			    return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
			  });
			});
		}
		
		let duplicateValueFormAddTodaySales = getDuplicateValueFormAddTodaySales(getAllReqBodyValues, stock_products);
		let duplicateValueStockProductsWithFormAddTodaySales = getDuplicateValueFormAddTodaySales(stock_products, getAllReqBodyValues);

		function decrementStockProduct(array1, array2) {
			  return array1.filter(object1 => {
			    return array2.some(object2 => {
			      return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
			    });
			  });
		}

		const getDataStockProduct = decrementStockProduct(getAllReqBodyValues, stock_products);
		// let getDataForm = decrementStockProduct(getAllReqBodyValues, stock_products);

		// Mengurangi jumlah stok produk yang ada di dalam koleksi stok_products.
		for (let i = 0; i < getDataStockProduct.length; i++) {
			for (let j = 0; j < stock_products.length; j++) {
					if (getDataStockProduct[i].product_name === stock_products[j].product_name && getDataStockProduct[i].category === stock_products[j].category && getDataStockProduct[i].unit === stock_products[j].unit) {
						if (stock_products[j].qty === 0) {
							req.flash(`msg`,`Produk ${getDataStockProduct[i].product_name} dengan unit ${getDataStockProduct[i].unit} yang anda telah masukkan gagal ditambahkan, karena stoknya sudah habis!`);
							preventInsertNewData = false;
						} else if (getDataStockProduct[i].qty > stock_products[j].qty) {
							req.flash(`msg`, `Produk ${stock_products[j].product_name} dengan unit ${stock_products[j].unit} yang telah anda masukkan melebihi stok produk tersebut!`);
							preventInsertNewData = false;
						} else if (stock_products[j].qty !== 0 && getDataStockProduct[i].qty <= stock_products[j].qty) {
							for (let k = 0; k < new_today_sales_find_all.length; k++) {
								if (getDataStockProduct[i].product_name === new_today_sales_find_all[k].product_name && getDataStockProduct[i].category === new_today_sales_find_all[k].category && getDataStockProduct[i].unit === new_today_sales_find_all[k].unit) {
									await New_Today_Sales.updateOne(
										{ _id: new_today_sales_find_all[k]._id },
										{
											$set: {
												qty: new_today_sales_find_all[k].qty + getDataStockProduct[i].qty,
												total_price: new_today_sales_find_all[k].total_price + getDataStockProduct[i].total_price,
											}
										}
									)
								}
							}

							productAvailable.push(getDataStockProduct[i]);

							await Stock_Products.updateOne(
								{_id: stock_products[j]._id},
								{
									$set: {
										qty: parseInt(stock_products[j].qty) - parseInt(getDataStockProduct[i].qty),
									}
								}
							)
						}
					}
			}
		}

		function getDifferenceValue(array1, array2) {
			return array1.filter(object1 => {
			  return !array2.some(object2 => {
			    return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
			  });
			});
		}

		const differenceValue = getDifferenceValue(productAvailable, new_today_sales_find_all);

		for (let i = 0; i < duplicateValueFormAddTodaySales.length; i++) {
			for (let j = 0; j < duplicateValueStockProductsWithFormAddTodaySales.length; j++) {
				if (duplicateValueFormAddTodaySales[i].product_name === duplicateValueStockProductsWithFormAddTodaySales[j].product_name && duplicateValueFormAddTodaySales[i].category === duplicateValueStockProductsWithFormAddTodaySales[j].category && duplicateValueFormAddTodaySales[i].unit === duplicateValueStockProductsWithFormAddTodaySales[j].unit) {
					oldValues.push({_id: duplicateValueStockProductsWithFormAddTodaySales[j]._id, product_name: duplicateValueFormAddTodaySales[i].product_name, qty: parseInt(duplicateValueStockProductsWithFormAddTodaySales[j].qty)});
				}
			}
		}

		function getDuplicateValueFormAddTodaySales2(array1, array2) {
			return array1.filter(object1 => {
			  return array2.some(object2 => {
			    return object1.product_name === object2.product_name;
			  });
			});
		}

		let getProdukEceran = getDuplicateValueFormAddTodaySales2(daftar_produk_eceran, getAllReqBodyValues);
		let getProdukEceranFromForm = getDuplicateValueFormAddTodaySales2(getAllReqBodyValues, daftar_produk_eceran);
		let getStockProdukEceran = getDuplicateValueFormAddTodaySales2(stock_products, getProdukEceran);

		for (let i = 0; i < getProdukEceranFromForm.length; i++) {
			for (let j = 0; j < duplicateValueStockProductsWithFormAddTodaySales.length; j++) {
				if (getProdukEceranFromForm[i].product_name === duplicateValueStockProductsWithFormAddTodaySales[j].product_name && getProdukEceranFromForm[i].category === duplicateValueStockProductsWithFormAddTodaySales[j].category && getProdukEceranFromForm[i].unit === duplicateValueStockProductsWithFormAddTodaySales[j].unit) {
					for (let k = 0; k < getStockProdukEceran.length; k++) {
						if (duplicateValueStockProductsWithFormAddTodaySales[j].product_name === getStockProdukEceran[k].product_name && duplicateValueStockProductsWithFormAddTodaySales[j].category === getStockProdukEceran[k].category && duplicateValueStockProductsWithFormAddTodaySales[j].unit !== getStockProdukEceran[k].unit && getStockProdukEceran[k].qty !== 0) {
							for (let l = 0; l < daftar_unit_eceran.length; l++) {
								if (getStockProdukEceran[k].unit === daftar_unit_eceran[l]) {
									await Stock_Products.updateOne(
										{_id: getStockProdukEceran[k]._id},
										{
											$set: {
												qty: parseInt(getStockProdukEceran[k].qty) - parseInt(getProdukEceranFromForm[i].qty * duplicateValueStockProductsWithFormAddTodaySales[j].isi),
											}
										}
									)
								}
							}
						}
					}
				}
			}
		}

		if (!preventInsertNewData) {
			return res.redirect("/today-sales");
		}

	  if (new_today_sales_find_all.length === 0 && preventInsertNewData) {
			await New_Today_Sales.insertMany(getAllReqBodyValues);
			await History_Sales.insertMany(getAllReqBodyValues);
	  	await Product_Best_Seller.insertMany(getAllReqBodyValues);

	  	for (let i = 0; i < getAllReqBodyValues.length; i++) {
	  		newId = getAllReqBodyValues[i]._id;

	  		await Report_Per_Hari.insertMany([
		  		{
		  			_id: newId,
		  			alt_id: idPerhari,
		  			date: getAllReqBodyValues[i].date,
		  			product_name: getAllReqBodyValues[i].product_name,
		  			category: getAllReqBodyValues[i].category,
		  			harga_pokok: parseInt(getAllReqBodyValues[i].harga_pokok),
		  			selling_price: parseInt(getAllReqBodyValues[i].selling_price),
		  			qty: parseInt(getAllReqBodyValues[i].qty),
		  			unit: getAllReqBodyValues[i].unit,
		  			total_price: parseInt(getAllReqBodyValues[i].total_price),
		  			profit: parseInt(getAllReqBodyValues[i].profit),
		  		}
		  	]);

		  	await Detail_Report_Per_Minggu.insertMany([
		  		{
		  			_id: newId,
		  			alt_id: idPerMinggu,
		  			alt_id2: ObjectId(),
		  			date: getAllReqBodyValues[i].date,
		  			product_name: getAllReqBodyValues[i].product_name,
		  			category: getAllReqBodyValues[i].category,
		  			harga_pokok: parseInt(getAllReqBodyValues[i].harga_pokok),
		  			selling_price: parseInt(getAllReqBodyValues[i].selling_price),
		  			qty: parseInt(getAllReqBodyValues[i].qty),
		  			unit: getAllReqBodyValues[i].unit,
		  			total_price: parseInt(getAllReqBodyValues[i].total_price),
		  			profit: parseInt(getAllReqBodyValues[i].profit),
		  		}
		  	]);

		  	await Detail_Report_Per_Bulan.insertMany([
		  		{
		  			_id: newId,
		  			alt_id: idPerBulan,
		  			alt_id2: ObjectId(),
		  			date: getAllReqBodyValues[i].date,
		  			product_name: getAllReqBodyValues[i].product_name,
		  			category: getAllReqBodyValues[i].category,
		  			harga_pokok: parseInt(getAllReqBodyValues[i].harga_pokok),
		  			selling_price: parseInt(getAllReqBodyValues[i].selling_price),
		  			qty: parseInt(getAllReqBodyValues[i].qty),
		  			unit: getAllReqBodyValues[i].unit,
		  			total_price: parseInt(getAllReqBodyValues[i].total_price),
		  			profit: parseInt(getAllReqBodyValues[i].profit),
		  			status: 'no',
		  		}
		  	]);

		  	await Detail_Report_Per_Tahun.insertMany([
		  		{
		  			_id: newId,
		  			alt_id: idPerTahun,
		  			alt_id2: ObjectId(),
		  			date: getAllReqBodyValues[i].date,
		  			product_name: getAllReqBodyValues[i].product_name,
		  			category: getAllReqBodyValues[i].category,
		  			harga_pokok: parseInt(getAllReqBodyValues[i].harga_pokok),
		  			selling_price: parseInt(getAllReqBodyValues[i].selling_price),
		  			qty: parseInt(getAllReqBodyValues[i].qty),
		  			unit: getAllReqBodyValues[i].unit,
		  			total_price: parseInt(getAllReqBodyValues[i].total_price),
		  			profit: parseInt(getAllReqBodyValues[i].profit),
		  			status: 'no',
		  		}
		  	]);
	  	}

	  	const date_report_per_minggu = await Date_Report_Per_Minggu.find();
	  	const date_report_per_bulan = await Date_Report_Per_Bulan.find();
	  	const date_report_per_tahun = await Date_Report_Per_Tahun.find();

			if (date_report_per_minggu.length === 0) {
				await Date_Report_Per_Minggu.insertMany([
					{
						alt_id: idPerMinggu,
						date: req.body.date[0],
						dateIn: req.body.date[0],
						status: "no",
					}
				]);

				await Date_Report_Per_Bulan.insertMany([
					{
						alt_id: idPerBulan,
						date: req.body.date[0],
						dateIn: req.body.date[0],
						status: "no",
					}
				]);

				await Date_Report_Per_Tahun.insertMany([
					{
						alt_id: idPerTahun,
						date: req.body.date[0],
						dateIn: req.body.date[0],
						status: "no",
					}
				]);
			} else {
				let g = 0;
				let h = 0;
				let i = 0;

				while (g < date_report_per_minggu.length) {
					if (date_report_per_minggu[g].status === 'no') {
						const firstDateIn = date_report_per_minggu[g].dateIn;
						const testing = new Date(firstDateIn);
						let s = new Date(testing.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
						let firstNextWeekDate = dayjs(s).format('MMMM D, YYYY');

						if (req.body.date === firstNextWeekDate) {
							await Date_Report_Per_Minggu.insertMany([
								{
									alt_id: idPerMinggu,
									date: req.body.date[0],
									dateIn: req.body.date[0],
									status: "no",
								}
							]);

							await Date_Report_Per_Minggu.updateOne(
								{_id: date_report_per_minggu[g]._id},
								{
									$set: {
										status: "yes",
									}
								}).then((result) => {});
						}
					}	
					g++;
				}

				while (h < date_report_per_bulan.length) {
					if (date_report_per_bulan[h].status === 'no') {
						const firstDateIn2 = date_report_per_bulan[h].dateIn;
						const testing2 = new Date(firstDateIn2);
						let s2 = new Date(testing2.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
						let firstNextWeekDate2 = dayjs(s2).format('MMMM D, YYYY');

						if (req.body.date === firstNextWeekDate2) {
							await Date_Report_Per_Bulan.insertMany([
								{
									alt_id: idPerBulan,
									date: req.body.date[0],
									dateIn: req.body.date[0],
									status: "no",
								}
							]);

							await Date_Report_Per_Bulan.updateOne(
								{_id: date_report_per_bulan[h]._id},
									{
										$set: {
											status: "yes",
										}
									}
								).then((result) => {});
						}
					}	
					h++;
				}

				while (i < date_report_per_tahun.length) {
					if (date_report_per_tahun[i].status === 'no') {
						const firstDateIn3 = date_report_per_tahun[i].dateIn;
						const testing3 = new Date(firstDateIn3);
						let s3 = new Date(testing3.getTime() + 366 * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
						let firstNextWeekDate3 = dayjs(s3).format('MMMM D, YYYY');

						if (req.body.date === firstNextWeekDate3) {
							await Date_Report_Per_Tahun.insertMany([
								{
									alt_id: idPerTahun,
									date: req.body.date[0],
									dateIn: req.body.date[0],
									status: "no",
								}
							]);

							await Date_Report_Per_Tahun.updateOne(
								{_id: date_report_per_tahun[i]._id},
									{
										$set: {
											status: "yes",
										}
									}
								).then((result) => {});
						}
					}	
					i++;
				}
			}

			for (let i = 0; i < getAllReqBodyValues.length; i++) {
				req.flash(`msg`,`Produk ${getAllReqBodyValues[i].product_name} dengan unit ${getAllReqBodyValues[i].unit} berhasil ditambahkan!`);
			}

			return res.redirect("/today-sales");
	  } else if (new_today_sales_find_all.length > 0 && preventInsertNewData)	{
	  	let updateStatus = false;

		  function getDuplicateValue(array1, array2) {
			  return array1.filter(object1 => {
			    return array2.some(object2 => {
			      return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
			    });
			  });
			}

			function getDifferenceValue(array1, array2) {
			  return array1.filter(object1 => {
			    return !array2.some(object2 => {
			      return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
			    });
			  });
			}

			function decrementStockProduct2(array1, array2) {
			  return array1.filter(object1 => {
			    return array2.some(object2 => {
			      return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
			    });
			  });
			}
			
			let duplicateValueCollection = getDuplicateValue(new_today_sales_find_all, getAllReqBodyValues);
			let duplicateValueForm = getDuplicateValue(getAllReqBodyValues, new_today_sales_find_all);
			let differenceValue = getDifferenceValue(getAllReqBodyValues, new_today_sales_find_all);
			let getDataStockProduct2 = decrementStockProduct2(getAllReqBodyValues, stock_products);
			let getDataForm2 = decrementStockProduct2(getAllReqBodyValues, stock_products);

			for (let i = 0; i < duplicateValueCollection.length; i++) {
				for (let j = 0; j < duplicateValueForm.length; j++) {
					for (let k = 0; k < getDataStockProduct2.length; k++) {
						for (let l = 0; l < getDataForm2.length; l++) {
							if (duplicateValueCollection[i].product_name === duplicateValueForm[j].product_name && duplicateValueCollection[i].category === duplicateValueForm[j].category && duplicateValueCollection[i].unit === duplicateValueForm[j].unit) {
								if (getDataForm2[l].product_name === getDataStockProduct2[k].product_name && getDataForm2[l].category === getDataStockProduct2[k].category && getDataForm2[l].unit === getDataStockProduct2[k].unit && getDataStockProduct2[k].qty !== 0) {
									// await New_Today_Sales.updateOne(
									// 	{_id: duplicateValueCollection[i]._id},
									// 	{
									// 		$set: {
									// 			qty: parseInt(duplicateValueCollection[i].qty) + parseInt(duplicateValueForm[j].qty),
									// 			total_price: parseInt(duplicateValueCollection[i].total_price) + parseInt(duplicateValueForm[j].total_price),
									// 		}
									// 	}
									// ).then((result) => {});

									await History_Sales.updateOne(
					  				{_id: duplicateValueCollection[i]._id},
					  				{
					  					$set: {
					  						qty: parseInt(duplicateValueCollection[i].qty) + parseInt(duplicateValueForm[j].qty),
					  						total_price: parseInt(duplicateValueCollection[i].total_price) + parseInt(duplicateValueForm[j].total_price),
					  					}
					  			}).then((result) => {
					  				return;
				  				});

				  				await Report_Per_Hari.updateOne(
						  			{_id: duplicateValueCollection[i]._id},
						  			{
						  				$set: {
						  					qty: parseInt(duplicateValueCollection[i].qty) + parseInt(duplicateValueForm[j].qty),
					  						total_price: parseInt(duplicateValueCollection[i].total_price) + parseInt(duplicateValueForm[j].total_price),
						  				}
						  			}).then((result) => {
						  				updateStatus = true;
						  				return;
				  				});

						  		await Detail_Report_Per_Minggu.updateOne(
						  			{_id: duplicateValueCollection[i]._id},
						  			{
						  				$set: {
						  					qty: parseInt(duplicateValueCollection[i].qty) + parseInt(duplicateValueForm[j].qty),
					  						total_price: parseInt(duplicateValueCollection[i].total_price) + parseInt(duplicateValueForm[j].total_price),
						  				}
						  			}).then((result) => {
						  				updateStatus = true;
						  				return;
				  				});

						  		await Detail_Report_Per_Bulan.updateOne(
						  			{_id: duplicateValueCollection[i]._id},
						  			{
						  				$set: {
						  					qty: parseInt(duplicateValueCollection[i].qty) + parseInt(duplicateValueForm[j].qty),
					  						total_price: parseInt(duplicateValueCollection[i].total_price) + parseInt(duplicateValueForm[j].total_price),
						  				}
						  			}).then((result) => {
						  				updateStatus = true;
						  				return;
				  				});

						  		await Detail_Report_Per_Tahun.updateOne(
						  			{_id: duplicateValueCollection[i]._id},
						  			{
						  				$set: {
						  					qty: parseInt(duplicateValueCollection[i].qty) + parseInt(duplicateValueForm[j].qty),
					  						total_price: parseInt(duplicateValueCollection[i].total_price) + parseInt(duplicateValueForm[j].total_price),
						  				}
						  			}).then((result) => {
						  				updateStatus = true;
						  				return;
				  				});	
								}
							}
						}
					}
				}
			}

			for (let i = 0; i < getDataStockProduct2.length; i++) {
				for (let j = 0; j < stock_products.length; j++) {
					if (getDataStockProduct2[i].product_name === stock_products[j].product_name && getDataStockProduct2[i].category === stock_products[j].category && getDataStockProduct2[i].unit === stock_products[j].unit) {
						if (stock_products[j].qty === 0) {
							req.flash(`msg`,`Produk ${getDataStockProduct2[i].product_name.toLowerCase()} dengan unit ${getDataStockProduct2[i].unit.toLowerCase()} yang anda telah masukkan stoknya sudah habis!`);
						} else if (getDataStockProduct2[i].qty > stock_products[j].qty) {
							req.flash(`msg`, `Produk ${getDataStockProduct2[i].product_name.toLowerCase()} dengan unit ${getDataStockProduct2[i].unit.toLowerCase()} yang telah anda masukkan melebihi stok produk tersebut!`);
						} else if (stock_products[j].qty !== 0 && getDataStockProduct2[i].qty <= stock_products[j].qty) {
							await Stock_Products.updateOne(
								{ _id: stock_products[j]._id },
								{
									$set: {
										qty:stock_products[j].qty - getDataStockProduct2[i].qty,
									}
								}
							)
						}
					}
				}
			}

			// console.log(getDataStockProduct2);
			// console.log(getDataForm2);

			// for (let i = 0; i < getDataStockProduct2.length; i++) {
			// 	for (let j = 0; j < getDataForm2.length; j++) {
			// 		if (getDataStockProduct2[i].product_name && getDataForm2[j].product_name && getDataStockProduct2[i].category === getDataForm2[j].category && getDataStockProduct2[i].unit === getDataForm2[j].unit && getDataStockProduct2[i].qty === 0) {
			// 			req.flash(`msg`,`Produk ${getDataForm2[j].product_name.toLowerCase()} dengan unit ${getDataForm2[j].unit.toLowerCase()} yang anda telah masukkan stoknya sudah habis!`);
			// 		} else if (getDataStockProduct2[i].product_name && getDataForm2[j].product_name && getDataStockProduct2[i].category === getDataForm2[j].category && getDataStockProduct2[i].unit === getDataForm2[j].unit && getDataForm2[j].qty > getDataStockProduct2[i].qty) {
			// 			req.flash(`msg`, `Produk ${getDataForm2[j].product_name.toLowerCase()} dengan unit ${getDataForm2[j].unit.toLowerCase()} yang telah anda masukkan melebihi stok produk tersebut!`);
			// 		} else if (getDataStockProduct2[i].product_name && getDataForm2[j].product_name && getDataStockProduct2[i].category === getDataForm2[j].category && getDataStockProduct2[i].unit === getDataForm2[j].unit && getDataForm2[j].qty <= getDataStockProduct2[i].qty && getDataStockProduct2[i].qty !== 0) {
			// 			await Stock_Products.updateOne(
			// 				{_id: getDataStockProduct2[i]._id.toString()},
			// 				{
			// 					$set: {
			// 						qty: parseInt(getDataStockProduct2[i].qty) - parseInt(getDataForm2[j].qty),
			// 					}
			// 				}
			// 			).then((result) => {});
			// 		}
			// 	}
			// }

			for (let i = 0; i < differenceValue.length; i++) {
				req.flash(`msg`,`Data produk ${differenceValue[i].product_name.toLowerCase()} dengan unit ${differenceValue[i].unit.toLowerCase()} berhasil ditambahkan!`);
			}
				
			for (let i = 0; i < differenceValue.length; i++) {
				// Masukkan semua data pada req.body.value add today-sales yang belum ada di dalam koleksi new_today_sales.
				await New_Today_Sales.insertMany([
					{
						_id: getAllReqBodyValues[i]._id,
						date: differenceValue[i].date,
						month: differenceValue[i].month,
						product_name: differenceValue[i].product_name,
						category: differenceValue[i].category,
						qty: parseInt(differenceValue[i].qty),
						unit: differenceValue[i].unit,
						harga_pokok: parseInt(differenceValue[i].harga_pokok),
						selling_price: parseInt(differenceValue[i].selling_price),
						total_price: parseInt(differenceValue[i].total_price),
						profit: parseInt(differenceValue[i].profit),
					}
				]);

				await History_Sales.insertMany([
					{
						_id: getAllReqBodyValues[i]._id,
						date: differenceValue[i].date,
						month: differenceValue[i].month,
						product_name: differenceValue[i].product_name,
						category: differenceValue[i].category,
						qty: parseInt(differenceValue[i].qty),
						unit: differenceValue[i].unit,
						harga_pokok: parseInt(differenceValue[i].harga_pokok),
						selling_price: parseInt(differenceValue[i].selling_price),
						total_price: parseInt(differenceValue[i].total_price),
						profit: parseInt(differenceValue[i].profit),
					}
				]);

				await Product_Best_Seller.insertMany([
					{
						_id: getAllReqBodyValues[i]._id,
						date: differenceValue[i].date,
						month: differenceValue[i].month,
						product_name: differenceValue[i].product_name,
						category: differenceValue[i].category,
						qty: parseInt(differenceValue[i].qty),
						unit: differenceValue[i].unit,
						harga_pokok: parseInt(differenceValue[i].harga_pokok),
						selling_price: parseInt(differenceValue[i].selling_price),
						total_price: parseInt(differenceValue[i].total_price),
						profit: parseInt(differenceValue[i].profit),
					}
				]);

				await Report_Per_Hari.insertMany([
					{
						_id: getAllReqBodyValues[i]._id,
						alt_id: idPerhari,
						date: differenceValue[i].date,
						month: differenceValue[i].month,
						product_name: differenceValue[i].product_name,
						category: differenceValue[i].category,
						qty: parseInt(differenceValue[i].qty),
						unit: differenceValue[i].unit,
						harga_pokok: parseInt(differenceValue[i].harga_pokok),
						selling_price: parseInt(differenceValue[i].selling_price),
						total_price: parseInt(differenceValue[i].total_price),
						profit: parseInt(differenceValue[i].profit),
					}
				]);

				await Detail_Report_Per_Minggu.insertMany([
					{
						_id: getAllReqBodyValues[i]._id,
						alt_id: idPerMinggu,
						date: differenceValue[i].date,
						month: differenceValue[i].month,
						product_name: differenceValue[i].product_name,
						category: differenceValue[i].category,
						qty: parseInt(differenceValue[i].qty),
						unit: differenceValue[i].unit,
						harga_pokok: parseInt(differenceValue[i].harga_pokok),
						selling_price: parseInt(differenceValue[i].selling_price),
						total_price: parseInt(differenceValue[i].total_price),
						profit: parseInt(differenceValue[i].profit),
					}
				]);

				await Detail_Report_Per_Bulan.insertMany([
					{
						_id: getAllReqBodyValues[i]._id,
						alt_id: idPerBulan,
						date: differenceValue[i].date,
						month: differenceValue[i].month,
						product_name: differenceValue[i].product_name,
						category: differenceValue[i].category,
						qty: parseInt(differenceValue[i].qty),
						unit: differenceValue[i].unit,
						harga_pokok: parseInt(differenceValue[i].harga_pokok),
						selling_price: parseInt(differenceValue[i].selling_price),
						total_price: parseInt(differenceValue[i].total_price),
						profit: parseInt(differenceValue[i].profit),
					}
				]);

				await Detail_Report_Per_Tahun.insertMany([
					{
						_id: getAllReqBodyValues[i]._id,
						alt_id: idPerTahun,
						date: differenceValue[i].date,
						month: differenceValue[i].month,
						product_name: differenceValue[i].product_name,
						category: differenceValue[i].category,
						qty: parseInt(differenceValue[i].qty),
						unit: differenceValue[i].unit,
						harga_pokok: parseInt(differenceValue[i].harga_pokok),
						selling_price: parseInt(differenceValue[i].selling_price),
						total_price: parseInt(differenceValue[i].total_price),
						profit: parseInt(differenceValue[i].profit),
					}
				]);
				// Masukkan semua data pada req.body.value pada form add today sales yang belum ada di dalam koleksi new_today_sales.
			}

			const date_report_per_minggu = await Date_Report_Per_Minggu.find();
	  	const date_report_per_bulan = await Date_Report_Per_Bulan.find();
	  	const date_report_per_tahun = await Date_Report_Per_Tahun.find();
	  	const detail_report_per_minggu = await Detail_Report_Per_Minggu.find();
	  	const detail_report_per_bulan = await Detail_Report_Per_Bulan.find();
	  	const detail_report_per_tahun = await Detail_Report_Per_Tahun.find();

	  	while (a < date_report_per_minggu.length) {
	  		if (req.body.date[0] === date_report_per_minggu[a].date) {
	  			firstDay = date_report_per_minggu[a].date;
					const testing = new Date(firstDay);
					let s = new Date(testing.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
					firstNextWeekDate = dayjs(s).format('MMMM D, YYYY');

	  			await Date_Report_Per_Minggu.updateOne({_id: date_report_per_minggu[a]._id}, {$set: {date: `${firstDay} - ${firstNextWeekDate}`}}).then((result) => {});
	  		} else if (date_report_per_minggu[a].status === 'no') {
	  			let g = 0;
					let h = 0;
					let p = 0;
					let rangeDate = [];
					let idDateReport;

	  			const firstDateIn = date_report_per_minggu[a].dateIn;
					const testing = new Date(firstDateIn);
					idDateReport = date_report_per_minggu[a]._id;

					while (g < 7) {
						let s = new Date(testing.getTime() + g * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
						let firstNextWeekDate = dayjs(s).format('MMMM D, YYYY');
						rangeDate.push(firstNextWeekDate);
						g++;
					}

					for (let i = 0; i < detail_report_per_minggu.length; i++) {
						for (let j = 0; j < 7; j++) {
							if (rangeDate[j] === detail_report_per_minggu[i].date) {
								sumModalPerMinggu += detail_report_per_minggu[i].harga_pokok;
								sumOmzetPerMinggu += detail_report_per_minggu[i].selling_price;
								sumProfitPerMinggu += detail_report_per_minggu[i].profit;

								await Date_Report_Per_Minggu.updateOne(
									{ _id: date_report_per_minggu[a]._id },
									{
										$set: {
											sum_modal: sumModalPerMinggu,
											sum_omzet: sumOmzetPerMinggu,
											sum_profit: sumProfitPerMinggu,
										}
									}
								).then((result) => {});

								await Detail_Report_Per_Minggu.updateMany(
									{_id: detail_report_per_minggu[i]._id},
									{
										$set: {
											alt_id2: idDateReport,
										}
									}
								)
							}
						}
					}
	  		}
	  		a++;
	  	}

	  	while (f < date_report_per_bulan.length) {
	  		if (req.body.date[0] === date_report_per_bulan[f].date) {
	  			firstDay = date_report_per_bulan[f].date;
					const testing2 = new Date(firstDay);
					let s = new Date(testing2.getTime() + 29 * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
					firstNextWeekDate = dayjs(s).format('MMMM D, YYYY');

	  			await Date_Report_Per_Bulan.updateOne({_id: date_report_per_bulan[f]._id}, {$set: {date: `${firstDay} - ${firstNextWeekDate}`}}).then((result) => {});
	  		} else if (date_report_per_bulan[f].status === 'no') {
	  			let g = 0;
					let h = 0;
					let p = 0;
					let rangeDate = [];
					let idDateReport;

	  			const firstDateIn = date_report_per_bulan[f].dateIn;
					const testing = new Date(firstDateIn);
					idDateReport = date_report_per_bulan[f]._id;

					while (g < 36) {
						let s = new Date(testing.getTime() + g * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
						let firstNextWeekDate = dayjs(s).format('MMMM D, YYYY');
						rangeDate.push(firstNextWeekDate);
						g++;
					}

					for (let i = 0; i < detail_report_per_bulan.length; i++) {
						for (let j = 0; j < 36; j++) {
							if (rangeDate[j] === detail_report_per_bulan[i].date) {
								sumModalPerBulan += detail_report_per_bulan[i].harga_pokok;
								sumOmzetPerBulan += detail_report_per_bulan[i].selling_price;
								sumProfitPerBulan += detail_report_per_bulan[i].profit;

								await Date_Report_Per_Bulan.updateOne(
									{ _id: date_report_per_bulan[f]._id },
									{
										$set: {
											sum_modal: sumModalPerBulan,
											sum_omzet: sumOmzetPerBulan,
											sum_profit: sumProfitPerBulan,
										}
									}
								).then((result) => {});

								await Detail_Report_Per_Bulan.updateMany(
									{_id: detail_report_per_bulan[i]._id},
									{
										$set: {
											alt_id2: idDateReport,
										}
									}
								)
							}
						}
					}
	  		}
	  		f++;
	  	}

	  	while (y < date_report_per_tahun.length) {
	  		if (req.body.date[0] === date_report_per_tahun[y].date) {
	  			firstDay = date_report_per_tahun[y].date;
					const testing2 = new Date(firstDay);
					let s = new Date(testing2.getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
					firstNextWeekDate = dayjs(s).format('MMMM D, YYYY');

	  			await Date_Report_Per_Tahun.updateOne({_id: date_report_per_tahun[y]._id}, {$set: {date: `${firstDay} - ${firstNextWeekDate}`}}).then((result) => {});
	  		} else if (date_report_per_tahun[y].status === 'no') {
	  			let g = 0;
					let h = 0;
					let p = 0;
					let rangeDate = [];
					let idDateReport;

	  			const firstDateIn = date_report_per_tahun[y].dateIn;
					const testing = new Date(firstDateIn);
					idDateReport = date_report_per_tahun[y]._id;

					while (g < 372) {
						let s = new Date(testing.getTime() + g * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
						let firstNextWeekDate = dayjs(s).format('MMMM D, YYYY');
						rangeDate.push(firstNextWeekDate);
						g++;
					}

					for (let i = 0; i < detail_report_per_tahun.length; i++) {
						for (let j = 0; j < 372; j++) {
							if (rangeDate[j] === detail_report_per_tahun[i].date) {
								sumModalPerTahun += detail_report_per_tahun[i].harga_pokok;
								sumOmzetPerTahun += detail_report_per_tahun[i].selling_price;
								sumProfitPerTahun += detail_report_per_tahun[i].profit;

								await Date_Report_Per_Tahun.updateOne(
									{ _id: date_report_per_tahun[y]._id },
									{
										$set: {
											sum_modal: sumModalPerTahun,
											sum_omzet: sumOmzetPerTahun,
											sum_profit: sumProfitPerTahun,
										}
									}
								).then((result) => {});

								await Detail_Report_Per_Tahun.updateMany(
									{_id: detail_report_per_tahun[i]._id},
									{
										$set: {
											alt_id2: idDateReport,
										}
									}
								)
							}
						}
					}
	  		}
	  		y++;
	  	}

	  	if (trigger) {
	  		await Stock_Products.updateOne(
	  			{_id: testV},
	  			{
	  				$set: {
	  					qty: testQty - 1,
	  				}
	  			}
	  		)
	  	}

	  	return res.redirect("/today-sales");
	  }
  } else {
  	for (let i = 0; i < stock_products.length; i++) {
	  	if (req.body.product_name === stock_products[i].product_name && req.body.category === stock_products[i].category && req.body.unit === stock_products[i].unit && stock_products[i].qty === 0) {
	  			req.flash(`msg`, `Produk ${req.body.product_name.toLowerCase()} unit ${req.body.unit.toLowerCase()} yang anda masukkan stoknya sudah habis!`);
	  			res.redirect("/today-sales/generator/add-sales");
	  	} else if (req.body.product_name === stock_products[i].product_name && req.body.category === stock_products[i].category && req.body.unit === stock_products[i].unit && req.body.qty > stock_products[i].qty) {
	  			req.flash(`msg`, `Produk ${req.body.product_name.toLowerCase()} unit ${req.body.unit.toLowerCase()} yang anda masukkan melebihi stok produk tersebut, yaitu ${stock_products[i].qty} ${stock_products[i].unit}.`);
	  			res.redirect("/today-sales/generator/add-sales");
	  	} else if (req.body.product_name === stock_products[i].product_name && req.body.category === stock_products[i].category && req.body.unit === stock_products[i].unit) {
	  		oldValues.push({_id: stock_products[i]._id, product_name: req.body.product_name, qty: parseInt(stock_products[i].qty)});

	  		currentReqBodyValues.push(
	  			{
	  				_id: ObjectId(),
	  				date: req.body.date,
	  				month: date,
	  				product_name: req.body.product_name,
	  				category: req.body.category,
	  				qty: parseInt(req.body.qty),
	  				unit: req.body.unit,
	  				harga_pokok: parseInt(req.body.harga_pokok),
	  				selling_price: parseInt(req.body.selling_price),
	  				total_price: parseInt(req.body.total_price),
	  				profit: parseInt(req.body.profit),
	  			}
	  		)

	  		for (let i = 0; i < currentReqBodyValues.length; i++) {
	  			newId = currentReqBodyValues[i]._id;
	  		}

		  	function getDuplicateValueFormAddTodaySales2(array1, array2) {
					return array1.filter(object1 => {
					  return array2.some(object2 => {
					    return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
					  });
					});
				}

				let duplicateValueStockProductsWithFormAddTodaySales2 = getDuplicateValueFormAddTodaySales2(stock_products, currentReqBodyValues);

				function getDuplicateValueFormAddTodaySales3(array1, array2) {
					return array1.filter(object1 => {
						return array2.some(object2 => {
							 return object1.product_name === object2.product_name;
						});
					});
				}

				let getProdukEceran2 = getDuplicateValueFormAddTodaySales3(daftar_produk_eceran, currentReqBodyValues);
				let getProdukEceranFromForm2 = getDuplicateValueFormAddTodaySales3(currentReqBodyValues, daftar_produk_eceran);
				let getStockProdukEceran2 = getDuplicateValueFormAddTodaySales3(stock_products, getProdukEceran2);

				for (let i = 0; i < getProdukEceranFromForm2.length; i++) {
					for (let j = 0; j < duplicateValueStockProductsWithFormAddTodaySales2.length; j++) {
						if (getProdukEceranFromForm2[i].product_name === duplicateValueStockProductsWithFormAddTodaySales2[j].product_name && getProdukEceranFromForm2[i].category === duplicateValueStockProductsWithFormAddTodaySales2[j].category && getProdukEceranFromForm2[i].unit === duplicateValueStockProductsWithFormAddTodaySales2[j].unit) {
							for (let k = 0; k < getStockProdukEceran2.length; k++) {
								if (duplicateValueStockProductsWithFormAddTodaySales2[j].product_name === getStockProdukEceran2[k].product_name && duplicateValueStockProductsWithFormAddTodaySales2[j].category === getStockProdukEceran2[k].category && duplicateValueStockProductsWithFormAddTodaySales2[j].unit !== getStockProdukEceran2[k].unit && getStockProdukEceran2[k].qty !== 0) {
									for (let l = 0; l < daftar_unit_eceran.length; l++) {
										if (getStockProdukEceran2[k].unit === daftar_unit_eceran[l]) {
											await Stock_Products.updateOne(
												{_id: getStockProdukEceran2[k]._id},
												{
													$set: {
														qty: parseInt(getStockProdukEceran2[k].qty) - parseInt(getProdukEceranFromForm2[i].qty * duplicateValueStockProductsWithFormAddTodaySales2[j].isi),
													}
												}
											)
										}
									}
								}
							}
						}
					}	
				}

	  		const new_today_sales = await New_Today_Sales.find();

	  		if (new_today_sales.length === 0) {
	  			await New_Today_Sales.insertMany(currentReqBodyValues);
	  			await History_Sales.insertMany(currentReqBodyValues);
	  			await Product_Best_Seller.insertMany(currentReqBodyValues);
	  			await Report_Per_Hari.insertMany([
	  				{
	  					_id: newId,
	  					alt_id: idPerhari,
	  					date: req.body.date,
	  					product_name: req.body.product_name,
	  					category: req.body.category,
	  					harga_pokok: parseInt(req.body.harga_pokok),
	  					selling_price: parseInt(req.body.selling_price),
	  					qty: parseInt(req.body.qty),
	  					unit: req.body.unit,
	  					total_price: parseInt(req.body.total_price),
	  					profit: parseInt(req.body.profit),
	  				}
	  			]);

	  			await Detail_Report_Per_Minggu.insertMany([
	  				{
	  					_id: newId,
	  					alt_id: idPerMinggu,
	  					alt_id2: ObjectId(),
	  					date: req.body.date,
	  					product_name: req.body.product_name,
	  					category: req.body.category,
	  					harga_pokok: parseInt(req.body.harga_pokok),
	  					selling_price: parseInt(req.body.selling_price),
	  					qty: parseInt(req.body.qty),
	  					unit: req.body.unit,
	  					total_price: parseInt(req.body.total_price),
	  					profit: parseInt(req.body.profit),
	  				}
	  			]);

	  			await Detail_Report_Per_Bulan.insertMany([
	  				{
	  					_id: newId,
	  					alt_id: idPerBulan,
	  					alt_id2: ObjectId(),
	  					date: req.body.date,
	  					product_name: req.body.product_name,
	  					category: req.body.category,
	  					harga_pokok: parseInt(req.body.harga_pokok),
	  					selling_price: parseInt(req.body.selling_price),
	  					qty: parseInt(req.body.qty),
	  					unit: req.body.unit,
	  					total_price: parseInt(req.body.total_price),
	  					profit: parseInt(req.body.profit),
	  					status: 'no',
	  				}
	  			]);

	  			await Detail_Report_Per_Tahun.insertMany([
	  				{
	  					_id: newId,
	  					alt_id: idPerTahun,
	  					alt_id2: ObjectId(),
	  					date: req.body.date,
	  					product_name: req.body.product_name,
	  					category: req.body.category,
	  					harga_pokok: parseInt(req.body.harga_pokok),
	  					selling_price: parseInt(req.body.selling_price),
	  					qty: parseInt(req.body.qty),
	  					unit: req.body.unit,
	  					total_price: parseInt(req.body.total_price),
	  					profit: parseInt(req.body.profit),
	  					status: 'no',
	  				}
	  			]);

	  			const date_report_per_minggu = await Date_Report_Per_Minggu.find();
	  			const date_report_per_bulan = await Date_Report_Per_Bulan.find();
	  			const date_report_per_tahun = await Date_Report_Per_Tahun.find();

					if (date_report_per_minggu.length === 0) {
						await Date_Report_Per_Minggu.insertMany([
							{
								alt_id: idPerMinggu,
								date: req.body.date,
								dateIn: req.body.date,
								status: "no",
							}
				  	]);

				  	await Date_Report_Per_Bulan.insertMany([
							{
								alt_id: idPerBulan,
								date: req.body.date,
								dateIn: req.body.date,
								status: "no",
							}
				  	]);

				  	await Date_Report_Per_Tahun.insertMany([
							{
								alt_id: idPerTahun,
								date: req.body.date,
								dateIn: req.body.date,
								status: "no",
							}
				  	]);
					} else {
						let g = 0;
						let h = 0;
						let i = 0;

						while (g < date_report_per_minggu.length) {
							if (date_report_per_minggu[g].status === 'no') {
								const firstDateIn = date_report_per_minggu[g].dateIn;
								const testing = new Date(firstDateIn);
								let s = new Date(testing.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
								let firstNextWeekDate = dayjs(s).format('MMMM D, YYYY');

								if (req.body.date === firstNextWeekDate) {
									await Date_Report_Per_Minggu.insertMany([
										{
											alt_id: idPerMinggu,
											date: req.body.date,
											dateIn: req.body.date,
											status: "no",
										}
							  	]);

							  	await Date_Report_Per_Minggu.updateOne(
										{_id: date_report_per_minggu[g]._id},
										{
											$set: {
												status: "yes",
											}
										}
									).then((result) => {});
								}
							}	
							g++;
						}

						while (h < date_report_per_bulan.length) {
							if (date_report_per_bulan[h].status === 'no') {
								const firstDateIn2 = date_report_per_bulan[h].dateIn;
								const testing2 = new Date(firstDateIn2);
								let s2 = new Date(testing2.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
								let firstNextWeekDate2 = dayjs(s2).format('MMMM D, YYYY');

								if (req.body.date === firstNextWeekDate2) {
									await Date_Report_Per_Bulan.insertMany([
										{
											alt_id: idPerBulan,
											date: req.body.date,
											dateIn: req.body.date,
											status: "no",
										}
							  	]);

							  	await Date_Report_Per_Bulan.updateOne(
										{_id: date_report_per_bulan[h]._id},
										{
											$set: {
												status: "yes",
											}
										}
									).then((result) => {});
								}
							}	
							h++;
						}

						while (i < date_report_per_tahun.length) {
							if (date_report_per_tahun[i].status === 'no') {
								const firstDateIn3 = date_report_per_tahun[i].dateIn;
								const testing3 = new Date(firstDateIn3);
								let s3 = new Date(testing3.getTime() + 366 * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
								let firstNextWeekDate3 = dayjs(s3).format('MMMM D, YYYY');

								if (req.body.date === firstNextWeekDate3) {
									await Date_Report_Per_Tahun.insertMany([
										{
											alt_id: idPerTahun,
											date: req.body.date,
											dateIn: req.body.date,
											status: "no",
										}
							  	]);

							  	await Date_Report_Per_Tahun.updateOne(
										{_id: date_report_per_tahun[i]._id},
										{
											$set: {
												status: "yes",
											}
										}
									).then((result) => {});
								}
							}	
							i++;
						}
					}

	  			stockProductsCol.push({_id: stock_products[i]._id, product_name: req.body.product_name, qty: req.body.qty});
		  			for (let a = 0; a < stockProductsCol.length; a++) {
		  				await Stock_Products.updateOne(
		  					{_id: stock_products[i]._id},
		  					{
		  						$set: {
		  							qty: stock_products[i].qty - stockProductsCol[a].qty,
		  						}
		  					}
		  				)
		  			}
		  		req.flash(`msg`,`Data produk ${req.body.product_name.toLowerCase()} dengan unit ${req.body.unit.toLowerCase()} berhasil ditambahkan!`);
	  			return res.redirect("/today-sales");
	  		} else {
	  			const m = await New_Today_Sales.find();
	  			const n = await History_Sales.find();

	  			let lastItemId = m[m.length -1]._id;

	  			let updateStatus = false;

	  			for (let b = 0; b < m.length; b++) {
		  				if (m[b].product_name === req.body.product_name && m[b].category === req.body.category && m[b].unit === req.body.unit) {
		  					await New_Today_Sales.updateOne(
		  						{_id: m[b]._id},
		  						{
		  							$set: {
		  								qty: m[b].qty + parseInt(req.body.qty),
		  								total_price: m[b].total_price + parseInt(req.body.total_price),
		  							}
		  						}
		  					).then((result) => {
		  						updateStatus = true;
		  						return;
		  					});

			  				await History_Sales.updateOne(
				  						{_id: m[b]._id},
				  						{
				  							$set: {
				  								qty: m[b].qty + parseInt(req.body.qty),
				  								total_price: m[b].total_price + parseInt(req.body.total_price),
				  							}
				  			}).then((result) => {
				  					updateStatus = true;
				  					return;
			  				});

			  				await Report_Per_Hari.updateOne(
					  			{_id: m[b]._id},
					  			{
					  				$set: {
					  					qty: m[b].qty + parseInt(req.body.qty),
					  					total_price: m[b].total_price + parseInt(req.body.total_price),
					  				}
					  			}).then((result) => {
					  				updateStatus = true;
					  				return;
			  				});

			  				await Detail_Report_Per_Minggu.updateOne(
					  			{_id: m[b]._id},
					  			{
					  				$set: {
					  					qty: m[b].qty + parseInt(req.body.qty),
					  					total_price: m[b].total_price + parseInt(req.body.total_price),
					  				}
					  			}).then((result) => {
					  				updateStatus = true;
					  				return;
			  				});

			  				await Detail_Report_Per_Bulan.updateOne(
					  			{_id: m[b]._id},
					  			{
					  				$set: {
					  					qty: m[b].qty + parseInt(req.body.qty),
					  					total_price: m[b].total_price + parseInt(req.body.total_price),
					  				}
					  			}).then((result) => {
					  				updateStatus = true;
					  				return;
			  				});

			  				await Detail_Report_Per_Tahun.updateOne(
					  			{_id: m[b]._id},
					  			{
					  				$set: {
					  					qty: m[b].qty + parseInt(req.body.qty),
					  					total_price: m[b].total_price + parseInt(req.body.total_price),
					  				}
					  			}).then((result) => {
					  				updateStatus = true;
					  				return;
			  				});

		  					stockProductsCol.push({_id: stock_products[i]._id, product_name: req.body.product_name, qty: req.body.qty});

			  				for (let c = 0; c < stockProductsCol.length; c++) {
			  					await Stock_Products.updateOne(
			  						{_id: stock_products[i]._id},
			  						{
			  							$set: {
			  								qty: stock_products[i].qty - stockProductsCol[c].qty,
			  							}
			  						}
			  					)
			  				}
		  				}
	  			}

	  			for (let d = 0; d < m.length; d++) {
		  			if (req.body._id !== lastItemId && !updateStatus) {
		  				await New_Today_Sales.insertMany(currentReqBodyValues);
		  				await History_Sales.insertMany(currentReqBodyValues);
		  				await Product_Best_Seller.insertMany(currentReqBodyValues);

		  				await Report_Per_Hari.insertMany([
			  				{
			  					_id: currentReqBodyValues[d]._id,
			  					alt_id: idPerhari,
			  					date: req.body.date,
			  					product_name: req.body.product_name,
			  					category: req.body.category,
			  					harga_pokok: parseInt(req.body.harga_pokok),
			  					selling_price: parseInt(req.body.selling_price),
			  					qty: parseInt(req.body.qty),
			  					unit: req.body.unit,
			  					total_price: parseInt(req.body.total_price),
			  					profit: parseInt(req.body.profit),
			  				}
			  			]);

			  			await Detail_Report_Per_Minggu.insertMany([
			  				{
			  					_id: currentReqBodyValues[d]._id,
			  					alt_id: idPerMinggu,
			  					date: req.body.date,
			  					product_name: req.body.product_name,
			  					category: req.body.category,
			  					harga_pokok: parseInt(req.body.harga_pokok),
			  					selling_price: parseInt(req.body.selling_price),
			  					qty: parseInt(req.body.qty),
			  					unit: req.body.unit,
			  					total_price: parseInt(req.body.total_price),
			  					profit: parseInt(req.body.profit),
			  				}
			  			]);

			  			await Detail_Report_Per_Bulan.insertMany([
			  				{
			  					_id: currentReqBodyValues[d]._id,
			  					alt_id: idPerBulan,
			  					date: req.body.date,
			  					product_name: req.body.product_name,
			  					category: req.body.category,
			  					harga_pokok: parseInt(req.body.harga_pokok),
			  					selling_price: parseInt(req.body.selling_price),
			  					qty: parseInt(req.body.qty),
			  					unit: req.body.unit,
			  					total_price: parseInt(req.body.total_price),
			  					profit: parseInt(req.body.profit),
			  				}
			  			]);

			  			await Detail_Report_Per_Tahun.insertMany([
			  				{
			  					_id: currentReqBodyValues[d]._id,
			  					alt_id: idPerTahun,
			  					date: req.body.date,
			  					product_name: req.body.product_name,
			  					category: req.body.category,
			  					harga_pokok: parseInt(req.body.harga_pokok),
			  					selling_price: parseInt(req.body.selling_price),
			  					qty: parseInt(req.body.qty),
			  					unit: req.body.unit,
			  					total_price: parseInt(req.body.total_price),
			  					profit: parseInt(req.body.profit),
			  				}
			  			]);

		  				stockProductsCol.push({_id: stock_products[i]._id, product_name: req.body.product_name, qty: req.body.qty});
		  				for (let e = 0; e < stockProductsCol.length; e++) {
		  					await Stock_Products.updateOne(
		  						{_id: stock_products[i]._id},
		  						{
		  							$set: {
		  								qty: stock_products[i].qty - stockProductsCol[e].qty,
		  							}
		  						}
		  					)
		  				}
		  			}
		  			break;
	  			}

	  			const date_report_per_minggu = await Date_Report_Per_Minggu.find();
	  			const date_report_per_bulan = await Date_Report_Per_Bulan.find();
	  			const date_report_per_tahun = await Date_Report_Per_Tahun.find();
	  			const detail_report_per_minggu = await Detail_Report_Per_Minggu.find();
	  			const detail_report_per_bulan = await Detail_Report_Per_Bulan.find();
	  			const detail_report_per_tahun = await Detail_Report_Per_Tahun.find();

	  			while (a < date_report_per_minggu.length) {
	  				if (req.body.date === date_report_per_minggu[a].date) {
	  					firstDay = date_report_per_minggu[a].date;
							const testing = new Date(firstDay);
							let s = new Date(testing.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
							firstNextWeekDate = dayjs(s).format('MMMM D, YYYY');

	  					await Date_Report_Per_Minggu.updateOne({_id: date_report_per_minggu[a]._id}, {$set: {date: `${firstDay} - ${firstNextWeekDate}`}}).then((result) => {});
	  				} else if (date_report_per_minggu[a].status === 'no') {
	  					let g = 0;
							let h = 0;
							let p = 0;
							let rangeDate = [];
							let idDateReport;

	  					const firstDateIn = date_report_per_minggu[a].dateIn;
							const testing = new Date(firstDateIn);
							idDateReport = date_report_per_minggu[a]._id;

							while (g < 7) {
								let s = new Date(testing.getTime() + g * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
								let firstNextWeekDate = dayjs(s).format('MMMM D, YYYY');
								rangeDate.push(firstNextWeekDate);
								g++;
							}

							for (let i = 0; i < detail_report_per_minggu.length; i++) {
								for (let j = 0; j < 7; j++) {
									if (rangeDate[j] === detail_report_per_minggu[i].date) {
										sumModalPerMinggu += detail_report_per_minggu[i].harga_pokok;
										sumOmzetPerMinggu += detail_report_per_minggu[i].selling_price;
										sumProfitPerMinggu += detail_report_per_minggu[i].profit;

										await Date_Report_Per_Minggu.updateOne(
											{ _id: date_report_per_minggu[a]._id },
											{
												$set: {
													sum_modal: sumModalPerMinggu,
													sum_omzet: sumOmzetPerMinggu,
													sum_profit: sumProfitPerMinggu,
												}
											}
										).then((result) => {});

										await Detail_Report_Per_Minggu.updateMany(
											{_id: detail_report_per_minggu[i]._id},
											{
												$set: {
													alt_id2: idDateReport,
												}
											}
										)
									}
								}
							}
	  				}
	  				a++;
	  			}

	  			while (f < date_report_per_bulan.length) {
	  				if (req.body.date === date_report_per_bulan[f].date) {
	  					firstDay = date_report_per_bulan[f].date;
							const testing2 = new Date(firstDay);
							let s = new Date(testing2.getTime() + 29 * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
							firstNextWeekDate = dayjs(s).format('MMMM D, YYYY');

	  					await Date_Report_Per_Bulan.updateOne({_id: date_report_per_bulan[f]._id}, {$set: {date: `${firstDay} - ${firstNextWeekDate}`}}).then((result) => {});
	  				} else if (date_report_per_bulan[f].status === 'no') {
	  					let g = 0;
							let h = 0;
							let p = 0;
							let rangeDate = [];
							let idDateReport;

	  					const firstDateIn = date_report_per_bulan[f].dateIn;
							const testing = new Date(firstDateIn);
							idDateReport = date_report_per_bulan[f]._id;

							while (g < 36) {
								let s = new Date(testing.getTime() + g * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
								let firstNextWeekDate = dayjs(s).format('MMMM D, YYYY');
								rangeDate.push(firstNextWeekDate);
								g++;
							}

							for (let i = 0; i < detail_report_per_bulan.length; i++) {
								for (let j = 0; j < 36; j++) {
									if (rangeDate[j] === detail_report_per_bulan[i].date) {
										sumModalPerBulan += detail_report_per_bulan[i].harga_pokok;
										sumOmzetPerBulan += detail_report_per_bulan[i].selling_price;
										sumProfitPerBulan += detail_report_per_bulan[i].profit;

										await Date_Report_Per_Bulan.updateOne(
											{ _id: date_report_per_bulan[f]._id },
											{
												$set: {
													sum_modal: sumModalPerBulan,
													sum_omzet: sumOmzetPerBulan,
													sum_profit: sumProfitPerBulan,
												}
											}
										).then((result) => {});

										await Detail_Report_Per_Bulan.updateMany(
											{_id: detail_report_per_bulan[i]._id},
											{
												$set: {
													alt_id2: idDateReport,
												}
											}
										)
									}
								}
							}
	  				}

	  				f++;
	  			}

	  			while (y < date_report_per_tahun.length) {
	  				if (req.body.date === date_report_per_tahun[y].date) {
	  					firstDay = date_report_per_tahun[y].date;
							const testing2 = new Date(firstDay);
							let s = new Date(testing2.getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
							firstNextWeekDate = dayjs(s).format('MMMM D, YYYY');

	  					await Date_Report_Per_Tahun.updateOne({_id: date_report_per_tahun[y]._id}, {$set: {date: `${firstDay} - ${firstNextWeekDate}`}}).then((result) => {});
	  				} else if (date_report_per_tahun[y].status === 'no') {
	  					let g = 0;
							let h = 0;
							let p = 0;
							let rangeDate = [];
							let idDateReport;

	  					const firstDateIn = date_report_per_tahun[y].dateIn;
							const testing = new Date(firstDateIn);
							idDateReport = date_report_per_tahun[y]._id;

							while (g < 372) {
								let s = new Date(testing.getTime() + g * 24 * 60 * 60 * 1000).toLocaleString().slice(0, 10);
								let firstNextWeekDate = dayjs(s).format('MMMM D, YYYY');
								rangeDate.push(firstNextWeekDate);
								g++;
							}

							for (let i = 0; i < detail_report_per_tahun.length; i++) {
								for (let j = 0; j < 372; j++) {
									if (rangeDate[j] === detail_report_per_tahun[i].date) {
										sumModalPerTahun += detail_report_per_tahun[i].harga_pokok;
										sumOmzetPerTahun += detail_report_per_tahun[i].selling_price;
										sumProfitPerTahun += detail_report_per_tahun[i].profit;

										await Date_Report_Per_Tahun.updateOne(
											{ _id: date_report_per_tahun[y]._id },
											{
												$set: {
													sum_modal: sumModalPerTahun,
													sum_omzet: sumOmzetPerTahun,
													sum_profit: sumProfitPerTahun,
												}
											}
										).then((result) => {});

										await Detail_Report_Per_Tahun.updateMany(
											{_id: detail_report_per_tahun[i]._id},
											{
												$set: {
													alt_id2: idDateReport,
												}
											}
										)
									}
								}
							}
	  				}
	  				y++;
	  			}

					req.flash(`msg`,`Data produk ${req.body.product_name.toLowerCase()} dengan unit ${req.body.unit.toLowerCase()} berhasil ditambahkan!`);
	  			return res.redirect("/today-sales");
	  		}
	  	}
	  }
  }
});

// Process Delete All Today Sales
router.delete("/today-sales", async (req, res) => {
  await New_Today_Sales.deleteMany({ date: req.body.date }).then((result) => {
    req.flash("msg", "Semua transaksi pada hari ini berhasil dihapus!");
    res.redirect("/today-sales");
  });
});

// Form Edit Today Sales Page
router.get("/today-sales/edit/:_id", async (req, res, next) => {
	const new_today_sales = await New_Today_Sales.findOne({
		_id: req.params._id,
	});

	editTodaySalesIdURL = req.params._id;

	if (req.params._id === new_today_sales._id.toString()) {
		oldValuesFormEditSales = new_today_sales;
	}

	currentIds.push({_id: new_today_sales._id})

	currentIds.forEach(currentId => {
		if (new_today_sales._id === currentId._id) {
			currentValues.push(new_today_sales)
		}
	})

	const products = await Product.find();
	const categorys = await Category.find();
	const units = await Unit.find();
	const stock_products = await Stock_Products.find();

	routePathURL = req.route.path;

	return res.render("edit-today-sales", {
		title: "FORM EDIT TODAY SALES | ALFAS Makassar",
		layout: "../views/edit-today-sales",
		new_today_sales,
		products,
		categorys,
		units,
		stock_products,
		msg: req.flash("msg"),
	});
});

// Process Delete Today Sales Per Items
router.delete("/today-sales", async (req, res) => {
  await New_Today_Sales.deleteOne(
    { 
    	_id: req.body._id 
    },
  ).then((result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data contact baru berhasil ditambahkan"
    req.flash("msg", "Data transaksi berhasil yang dipilih berhasil dihapus!");

    res.redirect("/today-sales");
  });
});

// Process Edit Today Sales
router.put("/today-sales", async (req, res) => {
	const history_sales = await History_Sales.find();
	const stock_products = await Stock_Products.find();
	const product_best_sellers = await Product_Best_Seller.find();
	let todaySalesUpdates = [];
	let newStocProductIds = [];

	todaySalesUpdates.push({_id: ObjectId(req.body._id), product_name: req.body.product_name, category: req.body.category, qty: parseInt(req.body.qty), unit: req.body.unit, selling_price: parseInt(req.body.selling_price), total_price: parseInt(req.body.total_price)});

	for (let i = 0; i < todaySalesUpdates.length; i++) {
		if (todaySalesUpdates[i].product_name !== oldValuesFormEditSales.product_name) {
			for (let j = 0; j < stock_products.length; j++) {
				if (oldValuesFormEditSales.product_name === stock_products[j].product_name && oldValuesFormEditSales.category === stock_products[j].category && oldValuesFormEditSales.unit === stock_products[j].unit) {

					await Stock_Products.updateOne(
						{ _id: stock_products[j]._id.toString() },
						{
							$set: {
								qty: parseInt(oldValuesFormEditSales.qty) + parseInt(stock_products[j].qty),
							}
						}
					)
				} else if (todaySalesUpdates[i].product_name === stock_products[j].product_name && todaySalesUpdates[i].category === stock_products[j].category && todaySalesUpdates[i].unit === stock_products[j].unit) {

					await Stock_Products.updateOne(
						{ _id: stock_products[j]._id.toString() },
						{
							$set: {
								qty: parseInt(stock_products[j].qty) - parseInt(todaySalesUpdates[i].qty),
							}
						}
					)
				}
			}
		} else {
			for (let k = 0; k < stock_products.length; k++) {
				if (todaySalesUpdates[i].product_name === stock_products[k].product_name && todaySalesUpdates[i].category === stock_products[k].category && todaySalesUpdates[i].selling_price === stock_products[k].selling_price) {
					newStocProductIds.push({_id: stock_products[k]._id});
					for (let l = 0; l < newStocProductIds.length; l++) {
						if (newStocProductIds[l]._id.toString() === stock_products[k]._id.toString()) {
							for (let m = 0; m < oldValues.length; m++) {
								if (oldValues[m]._id.toString() === stock_products[k]._id.toString())	{
									if (todaySalesUpdates[i].qty <= oldValues[m].qty) {
										await Stock_Products.updateOne(
											{ _id: stock_products[k]._id.toString() },
											{
												$set: {
													qty: parseInt(oldValues[m].qty) - parseInt(todaySalesUpdates[i].qty),
												}
											}
										)
									} else if (todaySalesUpdates[i].qty > oldValues[m].qty){
										req.flash("msg", `Jumlah beli (qty) yang anda masukkan melebihi jumlah stok awal barang tersebut yaitu ${oldValues[l].qty} ${todaySalesUpdates[i].unit.toLowerCase()}.`);
										return res.redirect(`/today-sales/edit/${editTodaySalesIdURL}`);
									}
								}
							}
						}
						break;
					}
				}
			}
		}
	}

	// Process Edit History Sales, Product Best Seller & Report
	for (let i = 0; i < todaySalesUpdates.length; i++) {
		await History_Sales.updateOne(
					{_id: todaySalesUpdates[i]._id},
					{
						$set: {
							product_name: todaySalesUpdates[i].product_name,
							category: todaySalesUpdates[i].category,
							qty: todaySalesUpdates[i].qty,
							unit: todaySalesUpdates[i].unit,
							selling_price: todaySalesUpdates[i].selling_price,
							total_price: todaySalesUpdates[i].total_price,
						}
					}
		)

		await Product_Best_Seller.updateOne(
					{_id: todaySalesUpdates[i]._id},
					{
						$set: {
							product_name: todaySalesUpdates[i].product_name,
							category: todaySalesUpdates[i].category,
							qty: todaySalesUpdates[i].qty,
							unit: todaySalesUpdates[i].unit,
							selling_price: todaySalesUpdates[i].selling_price,
							total_price: todaySalesUpdates[i].total_price,
						}
					}
		)

		await Report_Per_Hari.updateOne(
					{_id: todaySalesUpdates[i]._id},
					{
						$set: {
							product_name: todaySalesUpdates[i].product_name,
							category: todaySalesUpdates[i].category,
							qty: todaySalesUpdates[i].qty,
							unit: todaySalesUpdates[i].unit,
							selling_price: todaySalesUpdates[i].selling_price,
							total_price: todaySalesUpdates[i].total_price,
						}
					}
		)

		await Detail_Report_Per_Minggu.updateOne(
					{_id: todaySalesUpdates[i]._id},
					{
						$set: {
							product_name: todaySalesUpdates[i].product_name,
							category: todaySalesUpdates[i].category,
							qty: todaySalesUpdates[i].qty,
							unit: todaySalesUpdates[i].unit,
							selling_price: todaySalesUpdates[i].selling_price,
							total_price: todaySalesUpdates[i].total_price,
						}
					}
		)

		await Detail_Report_Per_Bulan.updateOne(
					{_id: todaySalesUpdates[i]._id},
					{
						$set: {
							product_name: todaySalesUpdates[i].product_name,
							category: todaySalesUpdates[i].category,
							qty: todaySalesUpdates[i].qty,
							unit: todaySalesUpdates[i].unit,
							selling_price: todaySalesUpdates[i].selling_price,
							total_price: todaySalesUpdates[i].total_price,
						}
					}
		)

		await Detail_Report_Per_Tahun.updateOne(
					{_id: todaySalesUpdates[i]._id},
					{
						$set: {
							product_name: todaySalesUpdates[i].product_name,
							category: todaySalesUpdates[i].category,
							qty: todaySalesUpdates[i].qty,
							unit: todaySalesUpdates[i].unit,
							selling_price: todaySalesUpdates[i].selling_price,
							total_price: todaySalesUpdates[i].total_price,
						}
					}
		)

		await New_Today_Sales.updateOne(
			{ _id: req.body._id },
			{
				$set: {
					product_name: req.body.product_name,
					category: req.body.category,
					harga_pokok: req.body.harga_pokok,
					qty: req.body.qty,
					unit: req.body.unit,
					selling_price: req.body.selling_price,
					total_price: req.body.total_price,
				},
			}
		)

		req.flash("msg", "Data transaksi berhasil diubah!");
		return res.redirect("/today-sales");
	}
});

// History Sales Page
router.get('/history-sales', async (req, res, next) => {
	let todayForTodaySales = new Date();
	let timeForTodaySales = todayForTodaySales.getHours();

	// Get Omzet
	const history_sales = await History_Sales.aggregate([
			{
				$group: {
					_id: "$date",
					total_omzet: {$sum: "$total_price"}
				},
			},
			{$sort: {_id: 1}},
	]);

	let result = [];

	// Get Profit History Sales
	history_sales.forEach(history_sale => { 
		const omzet = history_sale.total_omzet;
		const percentX = 10;

		function percentCalculation(a, b){
	  	const c = (parseFloat(a)*parseFloat(b))/100;
	  	return parseFloat(c);
		}
		result.push(percentCalculation(omzet, percentX)); //calculate percentX% of number
	});

	let today = new Date();
	let time = today.getHours();

	return res.render("history-sales", {
		title: "HISTORY SALES | ALFAS Makassar",
		layout: "../views/history-sales",
		history_sales,
		result,
		time,
		msg: req.flash("msg"),
	});
});

// History Sales Detail Page
router.get('/history-sales/detail/:_id', async (req, res, next) => {
	const history_sales = await History_Sales.find({
		date: req.params._id,
	});

	let historySalesDate = req.params._id;

	return res.render("history-sales-detail", {
		title: "HISTORY SALES | ALFAS Makassar",
		layout: "../views/history-sales-detail",
		history_sales,
		historySalesDate,
	});
});

// Proses Delete All History Sales By Date
router.delete("/history-sales", async (req, res) => {
  await History_Sales.deleteMany(
    { 
    	date: req.body._id,
    },
  ).then((result) => {
  	req.flash("msg", "Data histori transaksi pada tanggal yang dipilih berhasil dihapus!");
    res.redirect("/history-sales");
  });
});

// Products Page
router.get('/products', async (req, res, next) => {
	const products = await Product.find();

	return res.render("products", {
		title: "PRODUCTS | ALFAS Makassar",
		layout: "../views/products",
		products,
		msg: req.flash("msg"),
	});
});

// Form Add New Products Page
router.get('/products/add-products', async (req, res, next) => {
	return res.render('add-products', {
		title: "ADD PRODUCT | ALFAS Makassar",
		layout: "../views/add-products",
	});
});

// Process To Get Data From Form Add New Products Page
router.post("/products", async (req, res, next) => {
  await Product.insertMany(req.body, (error, result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data transaksi baru berhasil ditambahkan"
    req.flash("msg", "Product baru berhasil ditambahkan!");

    res.redirect("/products");
  });
});

// Form Edit Products Page
router.get("/products/edit/:product_name", async (req, res, next) => {
	const products = await Product.findOne({
		product_name: req.params.product_name,
	});

	return res.render("edit-products", {
		title: "FORM EDIT PRODUCT | ALFAS Makassar",
		layout: "../views/edit-products",
		products,
	});
});

// Process Delete Products
router.delete("/products", async (req, res) => {
  await Product.deleteOne(
    { 
    	_id: req.body._id 
    },
  ).then((result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data contact baru berhasil ditambahkan"
    req.flash("msg", "Produk yang dipilih berhasil dihapus!");

    res.redirect("/products");
  });
});

// Process Edit Products
router.put("/products", async (req, res) => {
  await Product.updateOne(
    { _id: req.body._id },
    {
      $set: {
        product_name: req.body.products_name,
      },
    }
  ).then((result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data contact baru berhasil ditambahkan"
    req.flash("msg", "Produk berhasil diubah!");

    res.redirect("/products");
  });
});

// Units Page
router.get('/units', async (req, res, next) => {
	const units = await Unit.find();

	return res.render("units", {
		title: "UNITS | ALFAS Makassar",
		layout: "../views/units",
		units,
		msg: req.flash("msg"),
	});
});

// Form Add New Units Products Page
router.get('/units/add-units', async (req, res, next) => {
	return res.render('add-units', {
		title: "ADD UNITS | ALFAS Makassar",
		layout: "../views/add-units",
		msg: req.flash("msg"),
	});
});

// Process To Get Data From Form Add New Units Products Page
router.post("/units", async (req, res, next) => {
	const units = await Unit.find();

	for (let i = 0; i < units.length; i++) {
		if (req.body.unit === units[i].unit) {
			req.flash("msg", "Nama satuan barang sudah ada!");
			return res.redirect("/units/add-units");

		}
	}

	await Unit.insertMany(req.body, (error, result) => {
		req.flash("msg", "Data satuan barang berhasil disimpan!");
		return res.redirect("/units");
	});
});

// Form Edit Units
router.get("/units/edit/:_id", async (req, res, next) => {
	const units = await Unit.findOne({
		_id: req.params._id,
	});

	return res.render("edit-units", {
		title: "FORM EDIT UNITS | ALFAS Makassar",
		layout: "../views/edit-units",
		units,
		msg: req.flash("msg"),
	});
});

// Process Delete Units
router.delete("/units", async (req, res) => {
  Unit.deleteOne(
    { 
    	_id: req.body._id 
    },
  ).then((result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data contact baru berhasil ditambahkan"
    req.flash("msg", "Unit yang dipilih berhasil dihapus!");

    res.redirect("/units");
  });
});

// Process Edit Units
router.put("/units", async (req, res) => {
	const units = await Unit.find();

	for (let i = 0; i < units.length; i++) {
		if (req.body.unit === units[i].unit) {
			req.flash("msg", `Nama satuan barang ${req.body.unit} sudah ada!`);
			return res.redirect("/units");

		}
	}

  await Unit.updateOne(
    { _id: req.body._id },
    {
      $set: {
        unit: req.body.unit,
      },
    }
  ).then((result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data contact baru berhasil ditambahkan"
    req.flash("msg", "Data satuan barang berhasil diubah!");

    return res.redirect("/units");
  });
});

// Suppliers Page
router.get('/suppliers', async (req, res, next) => {
	const suppliers = await Suppliers.find();

	return res.render("suppliers", {
		title: "SUPPLIERS | ALFAS Makassar",
		layout: "../views/suppliers",
		suppliers,
		msg: req.flash("msg"),
	});
});

// Lihat Suppliers Page
router.get('/suppliers/lihat/:_id', async (req, res, next) => {
	const suppliers = await Suppliers.find();
	const supplier_dates = await Supplier_Date.find();
	const supplier_details = await Supplier_Detail.find();
	let idURL = req.params._id;
	lihatId = idURL;

	for (let i = 0; i < suppliers.length; i++) {
		if (idURL.toString() === suppliers[i]._id.toString()) {
			supplier_name = suppliers[i].supplier_name;
		}
	}

	return res.render("lihat-suppliers", {
		title: "RIWAYAT SUPPLIERS | ALFAS MAKASSAR",
		layout: "../views/lihat-suppliers",
		supplier_dates,
		idURL,
		supplier_name,
	});
});

// Detail Supplier Page
router.get('/suppliers/lihat/:_id/detail/:_id', async (req, res, next) => {
	const supplier_dates = await Supplier_Date.find();
	const supplier_details = await Supplier_Detail.find();
	const idURL = req.params._id;
	let detailId;
	let sameId;
	let lengthOfSupplierDetails = [];

	for (let i = 0; i < supplier_dates.length; i++) {
		if (idURL === supplier_dates[i]._id.toString()) {
			detailId = supplier_dates[i]._id;
			detailEdit = supplier_dates[i]._id;

			if (detailId.toString() === supplier_dates[i]._id.toString()) {
				sameId = supplier_dates[i]._id;
			}
		}
	}

	for (let j = 0; j < supplier_details.length; j++) {
		if (detailId.toString() === supplier_details[j].alt_id.toString()) {
			lengthOfSupplierDetails.push(supplier_details[j].alt_id);
		}
	}

	await Supplier_Date.updateOne(
		{_id: sameId},
		{
			$set: {
				total_items: lengthOfSupplierDetails.length,
			}
		}
	)

	return res.render("supplier-detail", {
		title: "DETAIL PEMESANAN | ALFAS MAKASSAR",
		layout: "../views/supplier-detail",
		lihatId,
		detailId,
		supplier_details,
		idURL,
		supplier_name,
	})
});

// Form add supplier detail
router.get('/suppliers/lihat/:_id/detail/:_id/add-supplier-detail', async (req, res, next) => {
	const supplier_dates = await Supplier_Date.find();
	const units = await Unit.find();
	const idURL = req.params._id;

	return res.render("add-supplier-detail", {
		title: "TAMBAH SUPPLIER DETAIL | ALFAS MAKASSAR",
		layout: "../views/add-supplier-detail",
		lihatId,
		idURL,
		units,
		supplier_name,
	})
});

// Process To Get Data From Add Supplier Detail Form
router.post("/suppliers/lihat/:_id/detail/:_id", async (req, res, next) => {
	const idURL = req.params._id;

	await Supplier_Detail.insertMany(
		{
			alt_id: idURL, 
			product_name: req.body.product_name, 
			category: req.body.category, 
			qty: parseInt(req.body.qty), 
			unit: req.body.unit,
			harga_pokok: parseInt(req.body.harga_pokok), 
			harga_jual: parseInt(req.body.harga_jual)}
	)
  res.redirect("/suppliers/lihat/" + lihatId +"/detail/" + idURL);
})

// Form Add Suppliers Date
router.get("/suppliers/lihat/:_id/add-suppliers-date", async (req, res, next) => {
	let idURL = req.params._id;

	return res.render("add-suppliers-date", {
		title: "TAMBAH TANGGAL PEMESANAN / PEMBELIAN | ALFAS MAKASSAR",
		layout: "../views/add-suppliers-date",
		idURL,
		supplier_name,
	});
});

// Process To Get Data From Add Suppliers Date Form
router.post("/suppliers/lihat/:_id", async (req, res, next) => {
	const idURL = req.params._id;
	let newDate = req.body.date;
	
	await Supplier_Date.insertMany([
		{alt_id: idURL, date: newDate}
	]);

	res.redirect("/suppliers/lihat/" + idURL);
});

// Process Delete Supplier Date
router.delete("/suppliers/lihat/:_id", async (req, res, next) => {
	const idURL = req.params._id;
	const supplier_details = await Supplier_Detail.find();
	const supplier_dates = await Supplier_Date.find();

	for (let i = 0; i < supplier_details.length; i++) {
		for (let j = 0; j < supplier_dates.length; j++) {
			if (supplier_details[i].alt_id.toString() === supplier_dates[j]._id.toString()) {
				Supplier_Detail.deleteOne(
					{ alt_id: req.body._id }
				).then((result) => {})
			}
		}
	}

	Supplier_Date.deleteOne(
    { 
    	_id: req.body._id 
    },
  ).then((result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data contact baru berhasil ditambahkan"
    req.flash("msg", "Data supplier yang dipilih berhasil dihapus!");

    res.redirect("/suppliers/lihat/" + idURL);
  });
})

// Process Delete Supplier Detail
router.delete("/suppliers/lihat/:_id/detail/:_id", async (req, res, next) => {
	const idURL = req.params._id;

	Supplier_Detail.deleteOne(
		{
			_id: req.body._id
		},
	).then((result) => {
		res.redirect("/suppliers/lihat/" + lihatId +"/detail/" + idURL);
	})
});

// Form Add New Supplier Page
router.get('/suppliers/add-suppliers', function (req, res, next) {
	return res.render("add-suppliers", {
		title: "ADD NEW SUPPLIERS | ALFAS Makassar",
		layout: "../views/add-suppliers",
	});
});

// Process To Get Data From Form Add New Suppliers Page
router.post("/suppliers", async (req, res, next) => {
  await Suppliers.insertMany(req.body, (error, result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data transaksi baru berhasil ditambahkan"
    req.flash("msg", "Supplier baru berhasil ditambahkan!");

    res.redirect("/suppliers");
  });
});

// Form Edit Supplier
router.get("/suppliers/edit/:_id", async (req, res, next) => {
	const suppliers = await Suppliers.findOne({
		_id: req.params._id,
	});

	return res.render("edit-suppliers", {
		title: "FORM UBAH NAMA SUPPLIERS | ALFAS Makassar",
		layout: "../views/edit-suppliers",
		suppliers,
	});
});

// Form Edit Supplier Date
router.get("/suppliers/lihat/:_id/ubah/:_id", async (req, res, next) => {
	const supplier_dates = await Supplier_Date.findOne({
		_id: req.params._id,
	});

	return res.render("edit-supplier-date", {
		title: "FORM UBAH TANGGAL PEMESANAN | ALFAS MAKASSAR",
		layout: "../views/edit-supplier-date",
		supplier_dates,
		lihatId,
		supplier_name,
	});
});

// Form Edit Detail Supplier
router.get("/suppliers/lihat/:_id/detail/:_id/ubah/:_id", async (req, res, next) => {
	const supplier_details = await Supplier_Detail.findOne({
		_id: req.params._id,
	});
	const units = await Unit.find();
	const idURL = req.params._id;

	return res.render("edit-detail-supplier" , {
		title: "FORM UBAH DETAIL SUPPLIER | ALFAS MAKASSAR",
		layout: "../views/edit-detail-supplier",
		supplier_details,
		lihatId,
		units,
		idURL,
		detailEdit,
		supplier_name,
	})
});

// Process Delete Supplier
router.delete("/suppliers", async (req, res) => {
	const suppliers = await Suppliers.find();
	const supplier_dates = await Supplier_Date.find();
	const supplier_details = await Supplier_Detail.find();
	let deleteId = req.body._id;
	let deleteDetail;

	for (let j = 0; j < supplier_dates.length; j++) {
		if (deleteId.toString() === supplier_dates[j].alt_id.toString()) {
			Supplier_Date.deleteOne(
				{ alt_id: supplier_dates[j].alt_id.toString() }
			).then((result) => {});
				deleteDetail = supplier_dates[j]._id.toString();
		}
	}

	for (let k = 0; k < supplier_details.length; k++) {
		if (deleteDetail === supplier_details[k].alt_id.toString()) {
			Supplier_Detail.deleteOne(
				{ alt_id: supplier_details[k].alt_id.toString() },
			).then((result) => {});
		}
	}

  Suppliers.deleteOne(
    { 
    	_id: req.body._id 
    },
  ).then((result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data contact baru berhasil ditambahkan"
    req.flash("msg", "Data supplier yang dipilih berhasil dihapus!");
    res.redirect("/suppliers");
  });
});

// Process Edit Supplier
router.put("/suppliers", async (req, res) => {
  await Suppliers.updateOne(
    { _id: req.body._id },
    {
      $set: {
        supplier_name: req.body.supplier_name,
        address: req.body.address,
        phone_number: req.body.phone_number,
        description: req.body.description,
      },
    }
  ).then((result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data contact baru berhasil ditambahkan"
    req.flash("msg", "Data supplier berhasil diubah");

    res.redirect("/suppliers");
  });
});

// Process Edit Supplier Date
router.put("/suppliers/lihat/:_id/", async (req, res, next) => {
	await Supplier_Date.updateOne(
		{ _id: req.body._id },
		{
			$set: {
				date: req.body.date,
			}
		}
	).then((result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data contact baru berhasil ditambahkan"
    req.flash("msg", "Tanggal penyetokan berhasil diubah");

    res.redirect("/suppliers/lihat/"+lihatId);
  });
});

// Process Edit Detail Supplier
router.put("/suppliers/lihat/:_id/detail/:_id", async (req, res, next) => {
	await Supplier_Detail.updateOne(
		{ _id: req.body._id },
		{
			$set: {
				product_name: req.body.product_name,
				category: req.body.category,
				qty: req.body.qty,
				unit: req.body.unit,
				harga_pokok: req.body.harga_pokok,
				harga_jual: req.body.harga_jual,
			}
		}
	).then((result) => {
    res.redirect("/suppliers/lihat/"+lihatId+"/detail/"+detailEdit);
  });
})

// Stock Products Page
router.get('/stock-products', async (req, res, next) => {
	const stock_products = await Stock_Products.find();

	return res.render("stock-products", {
		title: "STOCK PRODUCTS | ALFAS Makassar",
		layout: "../views/stock-products",
		stock_products,
		msg: req.flash("msg"),
	});
});

// Form Add New Stock Products
router.get('/stock-products/add-stock-products', async (req, res, next) => {
	const products = await Product.find();
	const categorys = await Category.find();
	const units = await Unit.find();

	return res.render("add-stock-products", {
		title: "ADD STOCK PRODUCTS | ALFAS Makassar",
		layout: "../views/add-stock-products",
		categorys,
		units,
		products,
	});
});

// Process To Get Data From Form Add New Stock Products Page
router.post("/stock-products", async (req, res, next) => {
	const stock_products = await Stock_Products.find();

  await Stock_Products.insertMany(req.body, (error, result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data transaksi baru berhasil ditambahkan"
    req.flash("msg", "Stok produk baru berhasil ditambahkan!");

    res.redirect("/stock-products");
  });
});

// Form Edit Stock Products
router.get("/stock-products/edit/:_id", async (req, res, next) => {
	const stock_products = await Stock_Products.findOne({
		_id: req.params._id,
	});

	const products = await Product.find();
	const categorys = await Category.find();
	const units = await Unit.find();

	return res.render("edit-stock-products", {
		title: "FORM EDIT STOCK PRODUCT | ALFAS Makassar",
		layout: "../views/edit-stock-products",
		stock_products,
		products,
		categorys,
		units,
	});
});

// Process Delete Stock Product
router.delete("/stock-products", async (req, res) => {
  Stock_Products.deleteOne(
    { 
    	_id: req.body._id 
    },
  ).then((result) => {
    // kirimkan flash message sebelum diredi
    req.flash("msg", "Stok produk yang dipilih berhasil dihapus!");

    res.redirect("/stock-products");
  });
});

// Process Edit Stock Products
router.put("/stock-products", async (req, res) => {
  await Stock_Products.updateOne(
    { _id: req.body._id },
    {
      $set: {
        product_name: req.body.product_name,
        category: req.body.category,
        unit: req.body.unit,
        qty: req.body.qty,
        harga_pokok: req.body.harga_pokok,
        selling_price: req.body.selling_price,
        isi: req.body.isi,
      },
    }
  ).then((result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data contact baru berhasil ditambahkan"
    req.flash("msg", "Data stok produk berhasil diubah!");

    res.redirect("/stock-products");
  });
});

// Pelanggan Yang Berutang Page
router.get('/customers-debt', async (req, res, next) => {
	const debt_names = await Debt_Name.find();

	return res.render("customers-debt", {
		title: "CUSTOMER DEBT NAME | ALFAS Makassar",
		layout: "../views/customers-debt",
		debt_names,
		msg: req.flash("msg"),
	});
});

// Lihat Pelanggan Yang Berutang Page
router.get("/customers-debt/lihat/:_id", async (req, res, next) => {
	const debt_names = await Debt_Name.find();
	const debt_dates = await Debt_Date.find();
	const product_debts = await Product_Debt.find();
	let idURL = req.params._id;
	lihatId = idURL;

	for (let i = 0; i < debt_names.length; i++) {
		if (lihatId.toString() === debt_names[i]._id.toString()) {
			debtName = debt_names[i].name;
		}
	}

	return res.render("lihat-pelanggan-berutang", {
		title: "Tanggal Utang Pelanggan | ALFAS MAKASSAR",
		layout: "../views/lihat-pelanggan-berutang",
		debt_dates,
		product_debts,
		idURL,
		debtName,
	});
});

// Detail Pelanggan Yang Berutang Page
router.get("/customers-debt/lihat/:_id/detail/:_id", async (req, res, next) => {
	const product_debts = await Product_Debt.find();
	const debt_dates = await Debt_Date.find();
	const stock_products = await Stock_Products.find();

	let listTotalDebts = [];
	let sumTotalDebt = 0;
	let resetTotalDebt = 0;
	let sameId;

	const idURL = req.params._id;
	let detailId;

	for (let i = 0; i < debt_dates.length; i++) {
		if (idURL === debt_dates[i]._id.toString()) {
			detailId = debt_dates[i]._id;
			detailEdit = debt_dates[i]._id;
		}
	}
	
	for (let j = 0; j < product_debts.length; j++) {
		for (let k = 0; k < debt_dates.length; k++) {
			if (idURL === product_debts[j].alt_id.toString() && debt_dates[k]._id.toString() === idURL) {
				listTotalDebts.push(product_debts[j].total_price);
				sameId = debt_dates[k]._id;
			}
		}
	}

	for (let l = 0; l < listTotalDebts.length; l++) {
		sumTotalDebt += listTotalDebts[l];
	}

	if (listTotalDebts.length !== 0) {
		await Debt_Date.updateOne(
			{_id: sameId},
			{
				$set: {
					total_utang: sumTotalDebt,
				}
			}
		)
	}

	if (listTotalDebts.length === 0) {
		await Debt_Date.updateOne(
			{_id: detailId},
			{
				$set: {
					total_utang: resetTotalDebt,
				}
			}
		)
	}

	getmsgg = req.flash("msg");

	return res.render("detail-debt", {
		title: "DETAIL UTANG PELANGGAN | ALFAS MAKASSAR",
		layout: "../views/detail-debt",
		product_debts,
		debt_dates,
		detailId,
		lihatId,
		idURL,
		debtName,
		getmsgg,
		msg: req.flash("msg"),
	})
})

// Form Add New Customer Name Page
router.get('/customers-debt/add-customer', async (req, res, next) => {
	return res.render("add-customer", {
		title: "ADD NEW CUSTOMER DEBT | ALFAS Makassar",
		layout: "../views/add-customer",
	});
});

// Form Tambah Tanggal Utang Pelanggan Page
router.get("/customers-debt/lihat/:_id/add-debt-date", async (req, res, next) => {
	const idURL = req.params._id;

	return res.render("add-debt-date", {
		title: "TAMBAH TANGGAL UTANG | ALFAS MAKASSAR",
		layout: "../views/add-debt-date",
		idURL,
		debtName,
	});
});

// Form Denerator Detail Utang Pelanggan
// router.get("/customers-debt/lihat/:_id/detail/:_id/generator2", async (req, res, next) => {
// 	const products = await Product.find();
// 	const categorys = await Category.find();
// 	const units = await Unit.find();
// 	const idURL = req.params._id;
// 
// 	const debt_dates = await Debt_Date.find();
// 
// 	let detailId;
// 
// 	for (let i = 0; i < debt_dates.length; i++) {
// 		if (idURL === debt_dates[i]._id.toString()) {
// 			detailId = debt_dates[i]._id;
// 		}
// 	}
// 
// 	return res.render("generator2", {
// 		title: "GENERATOR RECORD | ALFAS MAKASSAR",
// 		layout: "../views/generator2",
// 		lihatId,
// 		detailId,
// 	})
// });

// Process To Get Data From Generator Record Form Page
// router.post("/customers-debt/lihat/:_id/detail/:_id/generator2", async (req, res, next) => {
// 	const debt_dates = await Debt_Date.find();
// 	const idURL = req.params._id;
// 
// 	let detailId;
// 
// 	getGeneratorValue = req.body.generator2;
// 
// 	for (let i = 0; i < debt_dates.length; i++) {
// 		if (idURL === debt_dates[i]._id.toString()) {
// 			detailId = debt_dates[i]._id;
// 		}
// 	}
// 
// 	return res.redirect("/customers-debt/lihat/"+lihatId+"/detail/"+detailId+"/generator2/add-detail-debt");
// });

// Form Tambah Detail Utang Pelanggan
router.get("/customers-debt/lihat/:_id/detail/:_id/add-detail-debt", async (req, res, next) => {
	const stock_products = await Stock_Products.find();
	const categorys = await Category.find();
	const units = await Unit.find();
	const idURL = req.params._id;

	return res.render("add-product-debt", {
		title: "TAMBAH UTANG BARANG PELANGGAN | ALFAS MAKASSAR",
		layout: "../views/add-product-debt",
		stock_products,
		categorys,
		units,
		lihatId,
		idURL,
		debtName,
		msg: req.flash("msg"),
	})
});

// Form Setor Utang Pelanggan
router.get("/customers-debt/lihat/:_id/detail/:_id/setor-utang", async (req, res, next) => {
	const debt_dates = await Debt_Date.find();

	const idURL = req.params._id;
	let detailId;

	for (let i = 0; i < debt_dates.length; i++) {
		if (idURL === debt_dates[i]._id.toString()) {
			detailId = debt_dates[i]._id;
		}
	}

	return res.render("setor-utang", {
		title: "PENYETORAN UTANG PELANGGAN | ALFAS MAKASSAR",
		layout: "../views/setor-utang",
		lihatId,
		detailId,
		msg: req.flash("msg"),
	})
});

// Proses Mengambil Data Dari Form Setor Utang Pelanggan
router.post("/customers-debt/lihat/:_id/detail/:_id/setor-utang", async (req, res, next) => {
	const debt_dates = await Debt_Date.find();
	
	const idURL = req.params._id;
	let detailId;

	for (let i = 0; i < debt_dates.length; i++) {
		if (idURL === debt_dates[i]._id.toString()) {
			detailId = debt_dates[i]._id;
		}
	}

	for (let i = 0; i < debt_dates.length; i++) {
		if (debt_dates[i]._id.toString() === detailId.toString()) {
			if (parseInt(req.body.setor_utang) > debt_dates[i].total_utang) {
				req.flash("msg", "Jumlah setoran utang melebihi total utang pelanggan!");

    		return res.redirect("/customers-debt/lihat/" + lihatId + "/detail/" + detailId + "/setor-utang");
			} else if (parseInt(req.body.setor_utang) <= debt_dates[i].total_utang) {
				await Debt_Date.updateOne(
					{ _id: debt_dates[i]._id },
					{
						$set: {
							total_utang: debt_dates[i].total_utang - parseInt(req.body.setor_utang),
						}
					}
				)
			}
		}
	}

	return res.redirect("/customers-debt/lihat/" + lihatId);
});

// Process To Get Data From Form Add New Customer Name Page
router.post("/customers-debt", async (req, res, next) => {
  await Debt_Name.insertMany(req.body, (error, result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data transaksi baru berhasil ditambahkan"
    req.flash("msg", "Nama customer baru yang berutang berhasil ditambahkan!");

    res.redirect("/customers-debt");
  });
});

// Process To Get Data From Form Tambah Tanggal Utang Pelanggan
router.post("/customers-debt/lihat/:_id", async (req, res, next) => {
	const idURL = req.params._id;
	let newDate = req.body.date;
	
	await Debt_Date.insertMany([
		{alt_id: idURL, date: newDate}
	]);

	res.redirect("/customers-debt/lihat/" + idURL);
});

// Process To Get Data From Tambah Detail Utang Barang Pelanggan
router.post("/customers-debt/lihat/:_id/detail/:_id", async (req, res, next) => {
	const stock_products = await Stock_Products.find();
	const product_debts = await Product_Debt.find();
	const idURL = req.params._id;
	let data_input_object_id_utang_barang = [];
	let data_input_product_name_utang_barang = [];
	let data_input_category_utang_barang = [];
	let data_input_harga_pokok_utang_barang = [];
	let data_input_selling_price_utang_barang = [];
	let data_input_qty_utang_barang = [];
	let data_input_unit_utang_barang = [];
	let data_input_total_price_utang_barang = [];
	let data_input_profit_utang_barang = [];
	let getAllReqBodyValuesUtangBarang = [];
	let productAvailable = [];

	let preventInsertNewData = true;

	if (getGeneratorValue > 1) {
		for (let i = 0; i < req.body.product_name.length; i++) {
  		data_input_object_id_utang_barang.push(ObjectId());
		  data_input_product_name_utang_barang.push(req.body.product_name[i]);
		  data_input_category_utang_barang.push(req.body.category[i]);
		  data_input_harga_pokok_utang_barang.push(req.body.harga_pokok[i]);
		  data_input_selling_price_utang_barang.push(req.body.selling_price[i]);
		  data_input_qty_utang_barang.push(req.body.qty[i]);
		  data_input_unit_utang_barang.push(req.body.unit[i]);
		  data_input_total_price_utang_barang.push(req.body.total_price[i]);
			data_input_profit_utang_barang.push(req.body.profit[i]);
  	}

  	for (let i = 0; i < data_input_product_name_utang_barang.length; i++) {
  		getAllReqBodyValuesUtangBarang.push(
		  	{
		  		_id: data_input_object_id_utang_barang[i],
		  		product_name: data_input_product_name_utang_barang[i],
		  		category: data_input_category_utang_barang[i],
		  		harga_pokok: parseInt(data_input_harga_pokok_utang_barang[i]),
		  		selling_price: parseInt(data_input_selling_price_utang_barang[i]),
		  		qty: parseInt(data_input_qty_utang_barang[i]),
		  		unit: data_input_unit_utang_barang[i],
		  		total_price: parseInt(data_input_total_price_utang_barang[i]),
		  		profit: parseInt(data_input_profit_utang_barang[i]),
		  	}
		  )
  	}

  	function getSameValues(array1, array2) {
			return array1.filter(object1 => {
			  return array2.some(object2 => {
			    return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
			  });
			});
		}

		const decrementStockProducts = getSameValues(getAllReqBodyValuesUtangBarang, stock_products);

		for (let i = 0; i < decrementStockProducts.length; i++) {
			for (let j = 0; j < stock_products.length; j++) {
				if (decrementStockProducts[i].product_name === stock_products[j].product_name && decrementStockProducts[i].category === stock_products[j].category && decrementStockProducts[i].unit === stock_products[j].unit) {
					if (stock_products[j].qty === 0) {
						req.flash(`msg`, `Produk ${decrementStockProducts[i].product_name} dengan unit ${decrementStockProducts[i].unit} yang telah anda masukkan, gagal ditambahkan karena stoknya sudah habis!`);
						preventInsertNewData = false;
						// return res.redirect(`/customers-debt/lihat/${lihatId}/detail/${idURL}/generator2/add-detail-debt`);
					} else if (decrementStockProducts[i].qty > stock_products[j].qty) {
						req.flash(`msg`, `Produk ${decrementStockProducts[i].product_name} dengan unit ${decrementStockProducts[i].unit} yang anda masukkan, melebihi stok produk tersebut, yaitu ${stock_products[j].qty} ${stock_products[j].unit}!`);
						preventInsertNewData = false;
						// return res.redirect(`/customers-debt/lihat/${lihatId}/detail/${idURL}/generator2/add-detail-debt`);
					} else if (stock_products[j].qty !== 0 || decrementStockProducts[i].qty <= stock_products[j].qty) {
						for (let k = 0; k < product_debts.length; k++) {
							if (decrementStockProducts[i].product_name === product_debts[k].product_name && decrementStockProducts[i].category === product_debts[k].category && decrementStockProducts[i].unit === product_debts[k].unit) {
								if (product_debts[k].alt_id.toString() === idURL) {
									await Product_Debt.updateOne(
										{ _id: product_debts[k]._id },
										{
											$set: {
												qty: product_debts[k].qty + decrementStockProducts[i].qty,
												total_price: product_debts[k].total_price + decrementStockProducts[i].total_price,
											}
										}
									)
								}
							}
						}

						productAvailable.push(decrementStockProducts[i]);

						await Stock_Products.updateOne(
							{ _id: stock_products[j]._id },
							{
								$set: {
									qty: stock_products[j].qty - decrementStockProducts[i].qty,
								}
							}
						)
					}
				}
			}
		}

		if (!preventInsertNewData) {
			return res.redirect(`/customers-debt/lihat/${lihatId}/detail/${idURL}`);
		}

		if (product_debts.length === 0 && preventInsertNewData) {
			for (let i = 0; i < getAllReqBodyValuesUtangBarang.length; i++) {
				await Product_Debt.insertMany(
					{
						alt_id: idURL,
						product_name: getAllReqBodyValuesUtangBarang[i].product_name, 
						category: getAllReqBodyValuesUtangBarang[i].category,
						harga_pokok: parseInt(getAllReqBodyValuesUtangBarang[i].harga_pokok),
						selling_price: parseInt(getAllReqBodyValuesUtangBarang[i].selling_price), 
						qty: parseInt(getAllReqBodyValuesUtangBarang[i].qty), 
						unit: getAllReqBodyValuesUtangBarang[i].unit,
						total_price: parseInt(getAllReqBodyValuesUtangBarang[i].total_price),
						profit: parseInt(getAllReqBodyValuesUtangBarang[i].profit),
					}
				)
			}
		} else if (product_debts.length > 0 && preventInsertNewData) {

			function getSameValues(array1, array2) {
				return array1.filter(object1 => {
				  return array2.some(object2 => {
				    return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
				  });
				});
			}

			const decrementStockProducts = getSameValues(product_debts, getAllReqBodyValuesUtangBarang);
			
			for (let i = 0; i < product_debts.length; i++) {
				if (product_debts[i].alt_id.toString() !== idURL) {
					for (let j = 0; j < product_debts.length; j++) {
						await Product_Debt.insertMany([
							{
								product_name: getAllReqBodyValuesUtangBarang[j].product_name,
								category: getAllReqBodyValuesUtangBarang[j].category,
								harga_pokok: parseInt(getAllReqBodyValuesUtangBarang[j].harga_pokok),
								selling_price: parseInt(getAllReqBodyValuesUtangBarang[j].selling_price),
								qty: parseInt(getAllReqBodyValuesUtangBarang[j].qty),
								unit: getAllReqBodyValuesUtangBarang[j].unit,
								total_price: parseInt(getAllReqBodyValuesUtangBarang[j].total_price),
								profit: parseInt(getAllReqBodyValuesUtangBarang[j].profit),
							}
						]);
					}
				}
			}

			for (let i = 0; i < getAllReqBodyValuesUtangBarang.length; i++) {
				req.flash(`msg`,`Produk ${getAllReqBodyValuesUtangBarang[i].product_name} dengan unit ${getAllReqBodyValuesUtangBarang[i].unit} berhasil ditambahkan!`);
			}

			return res.redirect("/customers-debt/lihat/" + lihatId + "/detail/" + idURL);
		}
	} else {
		getAllReqBodyValuesUtangBarang.push(
			{
				product_name: req.body.product_name,
				category: req.body.category,
				harga_pokok: parseInt(req.body.harga_pokok),
				selling_price: parseInt(req.body.selling_price),
				qty: parseInt(req.body.qty),
				unit: req.body.unit,
				total_price: parseInt(req.body.total_price),
				profit: parseInt(req.body.profit),
			}
		)

		function getSameValues(array1, array2) {
			return array1.filter(object1 => {
			  return array2.some(object2 => {
			    return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
			  });
			});
		}

		function getNamaProdukEceran(array1, array2) {
			return array1.filter(object1 => {
			  return array2.some(object2 => {
			    return object1.product_name === object2.product_name;
			  });
			});
		}

		function getUnitProdukEceran(array1, array2) {
			return array1.filter(object1 => {
			  return !array2.some(object2 => {
			    return object1.unit === object2.unit;
			  });
			});
		}

		function getUnitProdukEceranSama(array1, array2) {
			return array1.filter(object1 => {
			  return array2.some(object2 => {
			    return object1.unit === object2.unit;
			  });
			});
		}

		function getStokProdukEceran(array1, array2) {
			return array1.filter(object1 => {
			  return array2.some(object2 => {
			    return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
			  });
			});
		}

		const decrementStockProducts = getSameValues(stock_products, getAllReqBodyValuesUtangBarang);
		const namaProdukEceran = getNamaProdukEceran(getAllReqBodyValuesUtangBarang, daftar_produk_eceran);
		const unitProdukEceran = getUnitProdukEceran(namaProdukEceran, daftar_unit_eceran); // unit bungkus
		unitProdukEceran2 = getUnitProdukEceranSama(namaProdukEceran, daftar_unit_eceran); // unit batang
		const namaProdukEceranDiStokProduk = getStokProdukEceran(stock_products, unitProdukEceran);

		let isiProdukEceran = 0;
		let produkEceran3;
		let produkEceran2;

		for (let i = 0; i < decrementStockProducts.length; i++) {
			// Mengurangi jumlah stok barang yang diutang.
			if (decrementStockProducts[i].qty === 0) {
				req.flash(`msg`, `Produk ${req.body.product_name} dengan unit ${req.body.unit} yang anda masukkan, stoknya sudah habis!`);
				return res.redirect(`/customers-debt/lihat/${lihatId}/detail/${idURL}/add-detail-debt`);
			} else if (parseInt(req.body.qty) > decrementStockProducts[i].qty) {
				req.flash(`msg`, `Produk ${req.body.product_name} dengan unit ${req.body.unit} yang anda masukkan, melebihi stok produk tersebut, yaitu ${decrementStockProducts[i].qty} ${decrementStockProducts[i].unit}!`);
				return res.redirect(`/customers-debt/lihat/${lihatId}/detail/${idURL}/add-detail-debt`);
			} else if (decrementStockProducts[i].qty !== 0 || parseInt(req.body.qty) < decrementStockProducts[i].qty) {
				await Stock_Products.updateOne(
					{_id: decrementStockProducts[i]._id},
					{
						$set: {
							qty: decrementStockProducts[i].qty - parseInt(req.body.qty),
						}
					}
				)
			}
		}

		for (let i = 0; i < namaProdukEceranDiStokProduk.length; i++) {
			isiProdukEceran = parseInt(namaProdukEceranDiStokProduk[i].isi);
		}

		for (let i = 0; i < namaProdukEceranDiStokProduk.length; i++) {
			for (let j = 0; j < stock_products.length; j++) {
				if (namaProdukEceranDiStokProduk[i].product_name === stock_products[j].product_name && namaProdukEceranDiStokProduk[i].category === stock_products[j].category && namaProdukEceranDiStokProduk[i].unit !== stock_products[j].unit) {
					await Stock_Products.updateOne(
						{_id: stock_products[j]._id},
						{
							$set: {
								qty: stock_products[j].qty - (parseInt(req.body.qty) * isiProdukEceran),
							}
						}
					)
				}
			}
		}

		let lastItemId;
		let updateStatus = false;

		if (product_debts.length !== 0) {
			lastItemId = product_debts[product_debts.length -1]._id;
		}

		for (let i = 0; i < product_debts.length; i++) {
				if (product_debts[i].alt_id.toString() === idURL) {
					if (req.body.product_name === product_debts[i].product_name && req.body.category === product_debts[i].category && req.body.unit === product_debts[i].unit) {
						await Product_Debt.updateOne(
							{ _id: product_debts[i]._id },
							{
								$set: {
									qty: parseInt(product_debts[i].qty) + parseInt(req.body.qty),
									total_price: parseInt(product_debts[i].total_price) + parseInt(req.body.total_price),
								}
							}
						).then((result) => {
							updateStatus = true;
							return;
						});
					}
				}
		}

		if (req.body._id !== lastItemId && !updateStatus) {
			await Product_Debt.insertMany(
				{
					alt_id: idURL,
					product_name: req.body.product_name, 
					category: req.body.category,
					harga_pokok: parseInt(req.body.harga_pokok),
					selling_price: parseInt(req.body.selling_price), 
					qty: parseInt(req.body.qty), 
					unit: req.body.unit,
					total_price: parseInt(req.body.total_price),
					profit: parseInt(req.body.profit),
				}
			)
		} else if (product_debts.length === 0) {
			await Product_Debt.insertMany(
				{
					alt_id: idURL,
					product_name: req.body.product_name, 
					category: req.body.category,
					harga_pokok: parseInt(req.body.harga_pokok),
					selling_price: parseInt(req.body.selling_price), 
					qty: parseInt(req.body.qty), 
					unit: req.body.unit,
					total_price: parseInt(req.body.total_price),
					profit: parseInt(req.body.profit),
				}
			)
		}
	}

	req.flash(`msg`, `Produk ${req.body.product_name} dengan unit ${req.body.unit} berhasil ditambahkan!`);
	res.redirect("/customers-debt/lihat/" + lihatId + "/detail/" + idURL);
});

// Form Edit Customer name
router.get("/customers-debt/edit/:_id", async (req, res, next) => {
	const debt_names = await Debt_Name.findOne({
		_id: req.params._id,
	});

	return res.render("edit-customer", {
		title: "FORM EDIT SUPPLIERS | ALFAS Makassar",
		layout: "../views/edit-customer",
		debt_names,
		debtName,
	});
});

// Form Edit Tanggal Utang Pelanggan
router.get("/customers-debt/lihat/:_id/ubah/:_id", async (req, res, next) => {
	const debt_dates = await Debt_Date.findOne({
		_id: req.params._id,
	});

	return res.render("edit-debt-date", {
		title: "UBAH TANGGAL UTANG PELANGGAN | ALFAS MAKASSAR",
		layout: "../views/edit-debt-date",
		debt_dates,
		lihatId,
		debtName,
	})
});

// Form Edit Detail Utang Barang Pelanggan
router.get("/customers-debt/lihat/:_id/detail/:_id/ubah/:_id", async (req, res, next) => {	
	const stock_products = await Stock_Products.find();
	const product_debts = await Product_Debt.findOne({
		_id: req.params._id,
	})

	currentEditValues = [
		{
			product_name: product_debts.product_name,
			category: product_debts.category,
			unit: product_debts.unit,
			qty: parseInt(product_debts.qty),
		}
	]

	function getSameValueWithFormEditProductDebt(array1, array2) {
		return array1.filter(object1 => {
			return array2.some(object2 => {
			  return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
			});
		});
	}

	function getSameValueWithStokProducts(array1, array2) {
		return array1.filter(object1 => {
			return array2.some(object2 => {
			  return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
			});
		});
	}

	getDuplicateValueFormEditProductDebt = getSameValueWithFormEditProductDebt(currentEditValues, stock_products);
	getDuplicateValueStockProducts = getSameValueWithStokProducts(stock_products, currentEditValues);

	for (let i = 0; i < getDuplicateValueFormEditProductDebt.length; i++) {
		for (let j = 0; j < getDuplicateValueStockProducts.length; j++) {
			defaultValueQty = parseInt(getDuplicateValueFormEditProductDebt[i].qty) + parseInt(getDuplicateValueStockProducts[j].qty);
		}
	}

	// Untuk eceran
	// Function untuk mengecek apakah data yang ada di dalam form edit sama dengan yang ada di daftar_produk_eceran.
	function checkProdukEceranFormEdit(array1, array2) {
		return array1.filter(object1 => {
			return array2.some(object2 => {
			  return object1.product_name === object2.product_name;
			});
		});
	}

	// Function untuk mengambil data - data yang sama antara data di form edit dengan data yang ada di stok produk.
	function duplicateValueStockProductAndFormEdit(array1, array2) {
		return array1.filter(object1 => {
			return array2.some(object2 => {
			  return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
			});
		});
	}

	// Function untuk mengambil data - data yang sama antara data di form edit dengan data yang ada di stok produk, kecuali unit / tanpa menyamakan property unit.
	function duplicateValueStockProductAndFormEditWithoutUnit(array1, array2) {
		return array1.filter(object1 => {
			return array2.some(object2 => {
			  return object1.product_name === object2.product_name && object1.category === object2.category;
			});
		});
	}

	// Berisi data yang ada di form edit.
	let getCheckProdukEceranFormEdit = checkProdukEceranFormEdit(currentEditValues, daftar_produk_eceran);

	// Berisi data yang sama antara data di form edit dengan data yang ada di stok produk.
	let getDuplicateValueStockProductAndFormEdit = duplicateValueStockProductAndFormEdit(stock_products, getCheckProdukEceranFormEdit);

	// Berisi data yang sama antara data di form edit dengan data yang ada di stok produk tetapi tanpa menyamakan property unit.
	let getDuplicateValueStockProductAndFormEditWithoutUnit = duplicateValueStockProductAndFormEditWithoutUnit(stock_products, getCheckProdukEceranFormEdit);

	for (let i = 0; i < getCheckProdukEceranFormEdit.length; i++) {
		for (let j = 0; j < getDuplicateValueStockProductAndFormEditWithoutUnit.length; j++) {
			for (let k = 0; k < daftar_unit_eceran.length; k++) {
				if (getCheckProdukEceranFormEdit[i].product_name === getDuplicateValueStockProductAndFormEditWithoutUnit[j].product_name && getCheckProdukEceranFormEdit[i].category === getDuplicateValueStockProductAndFormEditWithoutUnit[j].category && getCheckProdukEceranFormEdit[i].unit !== getDuplicateValueStockProductAndFormEditWithoutUnit[j].unit && getCheckProdukEceranFormEdit[i].unit !== daftar_unit_eceran[k].unit) {
					for (let l = 0; l < getDuplicateValueStockProductAndFormEdit.length; l++) {
						if (getCheckProdukEceranFormEdit[i].unit === getDuplicateValueStockProductAndFormEdit[l].unit) {
							triggerDecrementProcessEditProductDebt = true;
							getDuplicateValueStockProductAndFormEditWithoutUnitIds = getDuplicateValueStockProductAndFormEditWithoutUnit[j]._id;
							getDuplicateValueStockProductAndFormEditWithoutUnitQty = parseInt(getDuplicateValueStockProductAndFormEditWithoutUnit[j].qty);
							getDuplicateValueStockProductAndFormEditIsiValue = parseInt(getDuplicateValueStockProductAndFormEdit[l].isi);
							defaultValueQtyUnitEceran = parseInt(getDuplicateValueStockProductAndFormEdit[l].isi) * parseInt(defaultValueQty);
						}
					}
				}
			}
		}
	}

	if (getCheckProdukEceranFormEdit.length === 0) {
		triggerDecrementProcessEditProductDebt = false;
	}
	// Akhir untuk eceran

	const units = await Unit.find();

	return res.render("edit-detail-debt", {
		title: "UBAH DETAIL UTANG PELANGGAN | ALFAS MAKASSAR",
		layout: "../views/edit-detail-debt",
		product_debts,
		stock_products,
		units,
		lihatId,
		detailEdit,
		debtName,
	});
});

// Process Delete Customer Debt Name
router.delete("/customers-debt", async (req, res) => {
	const debt_names = await Debt_Name.find();
	const debt_dates = await Debt_Date.find();
	const product_debts = await Product_Debt.find();
	let deleteId = req.body._id;
	let detailId;

	for (let i = 0; i < debt_dates.length; i++) {
		if (deleteId.toString() === debt_dates[i].alt_id.toString()) {
			Debt_Date.deleteOne(
				{ alt_id: debt_dates[i].alt_id.toString()}
			).then((result) => {});

			detailId = debt_dates[i]._id.toString();
		}
	}

	for (let j = 0; j < product_debts.length; j++) {
		if (detailId === product_debts[j].alt_id.toString()) {
			Product_Debt.deleteOne(
				{ alt_id: product_debts[j].alt_id.toString()}
			).then((result) => {});
		}
	}

  Debt_Name.deleteOne(
    { 
    	_id: req.body._id 
    },
  ).then((result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data contact baru berhasil ditambahkan"
    req.flash("msg", "Nama customer yang berutang berhasil dihapus!");

    res.redirect("/customers-debt");
  });

	// res.redirect("/customers-debt");
});

// Process Delete Tanggal Utang Pelanggan
router.delete("/customers-debt/lihat/:_id", async (req, res, next) => {
	const idURL = req.params._id;
	const product_debts = await Product_Debt.find();
	const debt_dates = await Debt_Date.find();

	for (let i = 0; i < product_debts.length; i++) {
		for (let j = 0; j < debt_dates.length; j++) {
			if (product_debts[i].alt_id.toString() === debt_dates[j]._id.toString()) {
				Product_Debt.deleteOne(
					{ alt_id: req.body._id }
				).then((result) => {})
			}
		}
	}

	Debt_Date.deleteOne(
		{ _id: req.body._id }
	).then((result) => {
    res.redirect("/customers-debt/lihat/" + idURL);
  });
})

// Process Edit Customer Name
router.put("/customers-debt", async (req, res) => {
  await Debt_Name.updateOne(
    { _id: req.body._id },
    {
      $set: {
        name: req.body.name,
        date: req.body.date,
      },
    }
  ).then((result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data contact baru berhasil ditambahkan"
    req.flash("msg", "Data customer yang berutang berhasil diubah!");

    res.redirect("/customers-debt");
  });
});

// Process Edit Tanggal Utang Pelanggan
router.put("/customers-debt/lihat/:_id", async (req, res, next) => {
	await Debt_Date.updateOne(
		{ _id: req.body._id},
		{
			$set: {
				date: req.body.date,
			}
		}
	).then((result) => {
		res.redirect("/customers-debt/lihat/" + lihatId);
	})
});

// Process Edit Detail Utang Barang Pelanggan
router.put("/customers-debt/lihat/:_id/detail/:_id", async (req, res, next) => {
	const stock_products = await Stock_Products.find();
	const product_debts = await Product_Debt.find();
	let idURL = req.params._id;

	let editResult = [
		{
			product_name: req.body.product_name,
			category: req.body.category,
			harga_pokok: parseInt(req.body.harga_pokok),
			selling_price: parseInt(req.body.selling_price),
			qty: parseInt(req.body.qty),
			unit: req.body.unit,
			total_price: parseInt(req.body.total_price),
		}
	]

	// Function agar mencegah berkurangnya stok eceran rokok batangan, walaupun tidak ada data yang diubah tetapi user tidak sengaja mengklik tombol simpan.
	function preventDecrementStokEceranBeforeEdited(array1, array2) {
		return array1.filter(object1 => {
			return array2.some(object2 => {
			  return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
			});
		});
	}

	// Function agar mencegah berkurangnya stok eceran rokok batangan, walaupun tidak ada data yang diubah tetapi user tidak sengaja mengklik tombol simpan.
	function preventDecrementStokEceranAfterEdited(array1, array2) {
		return array1.filter(object1 => {
			return array2.some(object2 => {
			  return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
			});
		});
	}

	let getpreventDecrementStokEceranBeforeEdited = preventDecrementStokEceranBeforeEdited(currentEditValues, editResult);
	let getpreventDecrementStokEceranAfterEdited = preventDecrementStokEceranAfterEdited(editResult, currentEditValues);

	// Mengurangi stok eceran rokok batangan pada saat setelah diubah & dan cegah stok produk eceran berubah / berkurang pada saat editresultnya tidak ada yang berubah.
	for (let i = 0; i < getpreventDecrementStokEceranBeforeEdited.length; i++) {
		for (let j = 0; j < getpreventDecrementStokEceranAfterEdited.length; j++) {
			if (triggerDecrementProcessEditProductDebt && getpreventDecrementStokEceranBeforeEdited[i].qty !== getpreventDecrementStokEceranAfterEdited[j].qty && getpreventDecrementStokEceranAfterEdited[j].qty <= defaultValueQty) {
				await Stock_Products.updateOne(
					{ _id: getDuplicateValueStockProductAndFormEditWithoutUnitIds },
					{
						$set: {
							qty: defaultValueQtyUnitEceran - getDuplicateValueStockProductAndFormEditIsiValue * parseInt(req.body.qty),
						}
					}
				)
			}
		}
	}
	// Akhir mengurangi stok eceran rokok batangan pada saat setelah diubah.

	// Jika editResult termasuk produk eceran, maka unit ecerannya juga akan berkurang.
	function editResultEqualToProdukEceran(array1, array2) {
		return array1.filter(object1 => {
			return array2.some(object2 => {
			  return object1.product_name === object2.product_name;
			});
		});
	}

	// Jika editResult termasuk produk eceran, maka ambil data produk eceran yang ada di stok produk.
	function produkEceranEqualToStokProduk(array1, array2) {
		return array1.filter(object1 => {
			return array2.some(object2 => {
			  return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
			});
		});
	}

	// Jika editResult termasuk produk eceran, maka ambil data produk eceran yang ada di stok produk tanpa mengecek unit produknya.
	function produkEceranEqualToStokProdukWithoutUnit(array1, array2) {
		return array1.filter(object1 => {
			return array2.some(object2 => {
			  return object1.product_name === object2.product_name && object1.category === object2.category;
			});
		});
	}

	// Akan terisi jika editResult termasuk produk eceran.
	let getEditResultEqualToProdukEceran = editResultEqualToProdukEceran(editResult, daftar_produk_eceran);

	// Akan terisi jika editResult termasuk produk eceran dan mengambiil data produk eceran yang ada di stok produk.
	let getProdukEceranEqualToStokProduk = produkEceranEqualToStokProduk(stock_products, getEditResultEqualToProdukEceran);

	// Akan terisi jika editResult termasuk produk eceran dan mengambiil data produk eceran yang ada di stok produk tanpa mengecek unit produknya.
	let getProdukEceranEqualToStokProdukWithoutUnit = produkEceranEqualToStokProdukWithoutUnit(stock_products, getEditResultEqualToProdukEceran);

	for (let i = 0; i < currentEditValues.length; i++) {
		for (let j = 0; j < editResult.length; j++) {
			// kembalikan jumlah stok produk eceran, jika editResultnya berubah total.
			if (currentEditValues[i].product_name !== editResult[j].product_name && currentEditValues[i].category !== editResult[j].category && currentEditValues[i].unit !== editResult[j].unit) {
				for (let z = 0; z < daftar_produk_eceran.length; z++) {
					if (editResult[j].product_name !== daftar_produk_eceran[z].product_name) {
						await Stock_Products.updateOne(
							{ _id: getDuplicateValueStockProductAndFormEditWithoutUnitIds },
							{
								$set: {
									qty: defaultValueQtyUnitEceran,
								}
							}
						)
					}
				}
						
				for (let k = 0; k < getEditResultEqualToProdukEceran.length; k++) {
					for (let l = 0; l < getProdukEceranEqualToStokProdukWithoutUnit.length; l++) {
						for (let m = 0; m < daftar_unit_eceran.length; m++) {
							// Jika editResultnya merupakan produk eceran, maka lakukan juga pengurangan jumlah stok pada produk ecerannya.
							if (getEditResultEqualToProdukEceran[k].product_name === getProdukEceranEqualToStokProdukWithoutUnit[l].product_name && getEditResultEqualToProdukEceran[k].category === getProdukEceranEqualToStokProdukWithoutUnit[l].category && getEditResultEqualToProdukEceran[k].unit !== getProdukEceranEqualToStokProdukWithoutUnit[l].unit && getEditResultEqualToProdukEceran[k].unit !== daftar_unit_eceran[m].unit) {
								for (let n = 0; n < getProdukEceranEqualToStokProduk.length; n++) {
									if (getEditResultEqualToProdukEceran[k].unit === getProdukEceranEqualToStokProduk[n].unit) {
										await Stock_Products.updateOne(
											{ _id: getProdukEceranEqualToStokProdukWithoutUnit[l]._id },
											{
												$set: {
													qty: parseInt(defaultValueQtyUnitEceran) - parseInt(getProdukEceranEqualToStokProduk[n].isi * req.body.qty),
												}
											}
										)
									}
								}
							}
						}
					}
				}
			}
		}
	}
	// Akhir Jika editResult termasuk produk eceran, maka unit ecerannya juga akan berkurang.

	function getSameValueWithStokProducts2(array1, array2) {
		return array1.filter(object1 => {
			return array2.some(object2 => {
			  return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
			});
		});
	}

	function getSameValueWithProductDebt(array1, array2) {
		return array1.filter(object1 => {
			return array2.some(object2 => {
			  return object1.product_name === object2.product_name && object1.category === object2.category && object1.unit === object2.unit;
			});
		});
	}

	let getDuplicateValueStockProducts2 = getSameValueWithStokProducts2(stock_products, editResult);
	let getDuplicateValueProductDebt2 = getSameValueWithProductDebt(product_debts, editResult);

	for (let i = 0; i < getDuplicateValueFormEditProductDebt.length; i++) {
		for (let j = 0; j < editResult.length; j++) {
			for (let k = 0; k < getDuplicateValueStockProducts2.length; k++) {
				// Jika editResultnya tidak ada yang berubah kecuali jumlah beli, maka lakukan pengurangan antara jumlah beli yang baru dimasukkan dengan jumlah awal dari produk tersebut pada stock produknya.
				if (getDuplicateValueFormEditProductDebt[i].product_name === editResult[j].product_name && getDuplicateValueFormEditProductDebt[i].category === editResult[j].category && getDuplicateValueFormEditProductDebt[i].unit === editResult[j].unit) {
					if (editResult[j].qty <= defaultValueQty) {
						await Stock_Products.updateOne(
							{ _id: getDuplicateValueStockProducts2[k]._id },
							{
								$set: {
									qty: parseInt(defaultValueQty) - parseInt(editResult[j].qty),
								}
							}
						)
					}
				} else {
					for (let i = 0; i < getDuplicateValueStockProducts.length; i++) {
						// Jika semua editResultya berubah, maka kembalikan jumlah stok produk tersebut.
						await Stock_Products.updateOne(
							{ _id: getDuplicateValueStockProducts[i]._id },
							{
								$set: {
									qty: parseInt(defaultValueQty),
								}
							}
						)

						if (getDuplicateValueStockProducts2[k].qty !== 0) {
							// editResult yang baru dimasukkan, lakukan pengurangan terhadap jumlah stoknya.
							await Stock_Products.updateOne(
								{ _id: getDuplicateValueStockProducts2[k]._id },
								{
									$set: {
										qty: parseInt(getDuplicateValueStockProducts2[k].qty) - parseInt(editResult[j].qty),
									}
								}
							)
						}

						for (let i = 0; i < getDuplicateValueProductDebt2.length; i++) {
							// Jika editResultnya sudah terdapat di dalam produk barang utang, maka satukan editResult dengan produk yang sudah ada di dalam produk barang utang.
							if (editResult[j].product_name === getDuplicateValueProductDebt2[i].product_name && editResult[j].category === getDuplicateValueProductDebt2[i].category && editResult[j].unit === getDuplicateValueProductDebt2[i].unit && idURL === getDuplicateValueProductDebt2[i].alt_id.toString()) {
								await Product_Debt.updateOne(
									{ _id: getDuplicateValueProductDebt2[i]._id },
									{
										$set: {
											qty: parseInt(editResult[j].qty) + parseInt(getDuplicateValueProductDebt2[i].qty),
											total_price: parseInt(editResult[j].total_price) + parseInt(getDuplicateValueProductDebt2[i].total_price),
										}
									}
								)

								// Setelah disatukan, kemudian hapus editResult tersebut, agar tidak duplikat.
								await Product_Debt.deleteOne(
									{ _id: req.body._id }
								).then((result) => {});
							}
						}
					}
				}
			}
		}
	}

	for (let i = 0; i < editResult.length; i++) {
		if (editResult[i].qty > defaultValueQty) {
			req.flash(`msg`, `Jumlah beli baru yang anda masukkan ${editResult[i].qty} ${editResult[i].unit} untuk produk ${req.body.product_name} dengan unit ${req.body.unit} gagal diubah, karena melebihi stok produk tersebut yaitu ${defaultValueQty} ${editResult[i].unit}!`);
			return res.redirect("/customers-debt/lihat/" + lihatId + "/detail/" + detailEdit);
		} else {
			await Product_Debt.updateOne(
				{ _id: req.body._id },
				{
					$set: {
						product_name: req.body.product_name,
						category: req.body.category,
						harga_pokok: parseInt(req.body.harga_pokok),
						selling_price: parseInt(req.body.selling_price),
						qty: parseInt(req.body.qty),
						unit: req.body.unit,
						total_price: parseInt(req.body.total_price),
						profit: parseInt(req.body.profit),
					}
				}
				).then((result) => {
					return res.redirect("/customers-debt/lihat/" + lihatId + "/detail/" + detailEdit);
				}
			);
		}
	}		
});

// Process Delete Detail Utang Pelanggan
router.delete("/customers-debt/lihat/:_id/detail/:_id", async (req, res, next) => {
	const idURL = req.params._id;

	Product_Debt.deleteOne(
    { 
    	_id: req.body._id 
    },
  ).then((result) => {
    res.redirect("/customers-debt/lihat/" + lihatId + "/detail/" + idURL);
  });
});

// Category Page
router.get('/category', async (req, res, next) => {
	const categorys = await Category.find();

	return res.render("category", {
		title: "CATEGORY | ALFAS Makassar",
		layout: "../views/category",
		categorys,
		msg: req.flash("msg"),
	});
});

// Form Add New Category Page
router.get('/category/add-category', async (req, res, next) => {
	const products = await Product.find();

	return res.render('add-category', {
		title: "ADD CAATEGORY | ALFAS Makassar",
		layout: "../views/add-category",
		msg: req.flash("msg"),
		products,
	});
});

// Process To Get Data From Form Add New Category Page
router.post("/category", async (req, res, next) => {
	const categorys = await Category.find();
	for (let i = 0; i < categorys.length; i++) {
		if (req.body.category === categorys[i].category) {
			req.flash(`msg`, `Data kategori barang ${req.body.category} sudah tersedia!`);

    	return res.redirect("/category/add-category");
		}
	}

  await Category.insertMany(req.body, (error, result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data transaksi baru berhasil ditambahkan"
    req.flash(`msg`, `Data kategori barang ${req.body.category} berhasil tersimpan!`);

    return res.redirect("/category");
  });
});

// Form Edit Category Page
router.get("/category/edit/:_id", async (req, res, next) => {
	const categorys = await Category.findOne({
		_id: req.params._id,
	});

	return res.render("edit-category", {
		title: "FORM EDIT CATEGORY | ALFAS Makassar",
		layout: "../views/edit-category",
		categorys,
	});
});

// Process Delete Category
router.delete("/category", async (req, res) => {
  Category.deleteOne(
    { 
    	_id: req.body._id 
    },
  ).then((result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data contact baru berhasil ditambahkan"
    req.flash("msg", "Category yang dipilih berhasil dihapus!");

    res.redirect("/category");
  });
});

// Process Edit Category
router.put("/category", async (req, res) => {
	const categorys = await Category.find();

	for (let i = 0; i < categorys.length; i++) {
		if (req.body.category === categorys[i].category) {
			req.flash(`msg`, `Data kategori barang ${req.body.category} sudah tersedia!`);

    	return res.redirect("/category");
		}
	}

  await Category.updateOne(
    { _id: req.body._id },
    {
      $set: {
        category: req.body.category,
      },
    }
  ).then((result) => {
    // kirimkan flash message sebelum diredirect. Nanti di session ada yang namanya variabel msg, yang isinya "Data contact baru berhasil ditambahkan"
    req.flash("msg", "Data kategori barang berhasil diubah!");

    res.redirect("/category");
  });
});

// Report Page
router.get("/report", async (req, res, next) => {
	const reports = await Report.find();

	return res.render("report", {
		title: "LAPORAN PENJUALAN | ALFAS Makassar",
		layout: "../views/report",
		reports,
	});
});

// Add Report Periode Page
router.get("/report/add-report", async (req, res, next) => {
	return res.render("add-report", {
		title: "TAMBAH LAPORAN PENJUALAN | ALFAS Makassar",
		layout: "../views/add-report",
	});
});

// Process To Get Data From Add Report Form Page
router.post("/report", async (req, res, next) => {
	await Report.insertMany(req.body, (error, result) => {
		return res.redirect("/report");
	});
});

// Lihat Report Page
router.get("/report/lihat/:_id", async (req, res, next) => {
	const reports = await Report.find();
	const report_per_hari = await Report_Per_Hari.find();
	const date_report_per_minggu = await Date_Report_Per_Minggu.find();
	const date_report_per_bulan = await Date_Report_Per_Bulan.find();
	const date_report_per_tahun = await Date_Report_Per_Tahun.find();

	const idURL = req.params._id;
	lihatId = idURL;
	let alt_id_report_per_hari;
	let alt_id_date_report_per_minggu;
	let alt_id_date_report_per_bulan;
	let alt_id_date_report_per_tahun;

	for (let m = 0; m < report_per_hari.length; m++) {
		if (idURL === report_per_hari[m].alt_id.toString()) {
			alt_id_report_per_hari = report_per_hari[m].alt_id.toString();
		}
	}

	for (let n = 0; n < date_report_per_minggu.length; n++) {
		if (idURL === date_report_per_minggu[n].alt_id.toString()) {
			alt_id_date_report_per_minggu = date_report_per_minggu[n].alt_id.toString();
		}
	}

	for (let n = 0; n < date_report_per_bulan.length; n++) {
		if (idURL === date_report_per_bulan[n].alt_id.toString()) {
			alt_id_date_report_per_bulan = date_report_per_bulan[n].alt_id.toString();
		}
	}

	for (let n = 0; n < date_report_per_tahun.length; n++) {
		if (idURL === date_report_per_tahun[n].alt_id.toString()) {
			alt_id_date_report_per_tahun = date_report_per_tahun[n].alt_id.toString();
		}
	}

	const aggregate_report_per_hari = await Report_Per_Hari.aggregate([
			{
				$group: {
					_id: {
						alt_id: "$alt_id",
						_id: "$date",
					},
					total_modal: {$sum: "$harga_pokok"},
					total_omzet: {$sum: "$selling_price"},
					total_profit: {$sum: "$profit"},
				},
			},
			{$sort: {_id: 1}},
	]);

	for (let i = 0; i < reports.length; i++) {
		if (idURL.toString() === reports[i]._id.toString()) {
			periode_name = reports[i].periode;
		}
	}

	return res.render("lihat-report", {
		title: "PERIODE TANGGAL LAPORAN PENJUALAN | ALFAS Makassar",
		layout: "../views/lihat-report",
		periode_name,
		aggregate_report_per_hari,
		date_report_per_minggu,
		date_report_per_bulan,
		date_report_per_tahun,
		alt_id_report_per_hari,
		alt_id_date_report_per_minggu,
		alt_id_date_report_per_bulan,
		alt_id_date_report_per_tahun,
		idURL,		
	});
});

// Form Add Report Date Page
router.get("/report/lihat/:_id/add-report-date", async (req, res, next) => {
	const idURL = req.params._id;

	return res.render("add-report-date", {
		title: "TAMBAH TANGGAL LAPORAN PENJUALAN | ALFAS Makassar",
		layout: "../views/add-report-date",
		periode_name,
		idURL,
	});
});

// Process To Get Data From Add Report Date Form
router.post("/report/lihat/:_id", async (req, res, next) => {
	const idURL = req.params._id;

	await Report_Date.insertMany([
		{alt_id: idURL, date: req.body.date}
	]);
	return res.redirect("/report/lihat/" + idURL);
});

// Process Delete Date Report
router.delete("/report/lihat/:_id", async (req, res, next) => {
	const idURL = req.params._id;
	const report_per_hari = await Report_Per_Hari.find();
	const detail_report_per_minggu = await Detail_Report_Per_Minggu.find();
	const detail_report_per_bulan = await Detail_Report_Per_Bulan.find();
	const detail_report_per_tahun = await Detail_Report_Per_Tahun.find();

	for (let j = 0; j < detail_report_per_minggu.length; j++) {
		if (req.body._id.toString() === detail_report_per_minggu[j].alt_id2.toString()) {
			Detail_Report_Per_Minggu.deleteMany(
				{ alt_id2: req.body._id.toString() }
			).then((result) => {});
		}
	}

	for (let j = 0; j < detail_report_per_bulan.length; j++) {
		if (req.body._id.toString() === detail_report_per_bulan[j].alt_id2.toString()) {
			Detail_Report_Per_Bulan.deleteMany(
				{ alt_id2: req.body._id.toString() }
			).then((result) => {});
		}
	}

	for (let k = 0; k < detail_report_per_tahun.length; k++) {
		if (req.body._id.toString() === detail_report_per_tahun[k].alt_id2.toString()) {
			Detail_Report_Per_Tahun.deleteMany(
				{ alt_id2: req.body._id.toString()}
			).then((result) => {});
		}
	}

	Report_Per_Hari.deleteMany(
		{ date: req.body._id }
	).then((result) => {});

  Date_Report_Per_Minggu.deleteOne(
		{ _id: req.body._id }
	).then((result) => {});

	Date_Report_Per_Bulan.deleteOne(
		{ _id: req.body._id }
	).then((result) => {});

	Date_Report_Per_Tahun.deleteOne(
		{ _id: req.body._id }
	).then((result) => {});

	res.redirect("/report/lihat/" + idURL);
});

// Detail Report Page
router.get("/report/lihat/:_id/detail/:_id", async (req, res, next) => {
	const report_per_hari = await Report_Per_Hari.find({
		date: req.params._id,
	});

	const date_report_per_minggu = await Date_Report_Per_Minggu.find();
	const date_report_per_bulan = await Date_Report_Per_Bulan.find();
	const date_report_per_tahun = await Date_Report_Per_Tahun.find();
	const detail_report_per_hari = await Report_Per_Hari.find();
	const detail_report_per_minggu = await Detail_Report_Per_Minggu.find();
	const detail_report_per_bulan = await Detail_Report_Per_Bulan.find();
	const detail_report_per_tahun = await Detail_Report_Per_Tahun.find();

	let length_reprot_per_hari = detail_report_per_hari.length - 1;
	let length_reprot_per_minggu = detail_report_per_minggu.length - 1;
	let length_reprot_per_bulan = detail_report_per_bulan.length - 1;
	let length_reprot_per_tahun = detail_report_per_tahun.length - 1;

	let totalModalPerHari = 0;
	let totalHargaSatuanPerHari = 0;
	let totalProfitPerHari = 0;

	let totalModalPerMinggu = 0;
	let totalHargaSatuanPerMinggu = 0;
	let totalProfitPerMinggu = 0;

	let totalModalPerBulan = 0;
	let totalHargaSatuanPerBulan = 0;
	let totalProfitPerBulan = 0;

	let totalModalPerTahun = 0;
	let totalHargaSatuanPerTahun = 0;
	let totalProfitPerTahun = 0;

	const idURL = req.params._id;
	let alt_id_detail_report_per_hari;
	let id_date_report_per_minggu;
	let id_date_report_per_bulan;
	let id_date_report_per_tahun;

	for (let i = 0; i < report_per_hari.length; i++) {
		if (idURL === report_per_hari[i].date) {
			tanggal_periode_per_hari = report_per_hari[i].date;
		}
	}

	for (let i = 0; i < date_report_per_minggu.length; i++) {
		if (idURL === date_report_per_minggu[i]._id.toString()) {
			id_date_report_per_minggu = date_report_per_minggu[i]._id.toString();
			tanggal_periode_per_minggu = date_report_per_minggu[i].date;
		}
	}

	for (let i = 0; i < date_report_per_bulan.length; i++) {
		if (idURL === date_report_per_bulan[i]._id.toString()) {
			id_date_report_per_bulan = date_report_per_bulan[i]._id.toString();
			tanggal_periode_per_bulan = date_report_per_bulan[i].date;
		}
	}

	for (let i = 0; i < date_report_per_tahun.length; i++) {
		if (idURL === date_report_per_tahun[i]._id.toString()) {
			id_date_report_per_tahun = date_report_per_tahun[i]._id.toString();
			tanggal_periode_per_tahun = date_report_per_tahun[i].date;
		}
	}

	for (let i = 0; i < detail_report_per_hari.length; i++) {
		totalModalPerHari += detail_report_per_hari[i].harga_pokok;
		totalHargaSatuanPerHari += detail_report_per_hari[i].selling_price;
		totalProfitPerHari += detail_report_per_hari[i].profit;
	}

	for (let i = 0; i < detail_report_per_minggu.length; i++) {
		totalModalPerMinggu += detail_report_per_minggu[i].harga_pokok;
		totalHargaSatuanPerMinggu += detail_report_per_minggu[i].selling_price;
		totalProfitPerMinggu += detail_report_per_minggu[i].profit;
	}

	for (let i = 0; i < detail_report_per_bulan.length; i++) {
		totalModalPerBulan += detail_report_per_bulan[i].harga_pokok;
		totalHargaSatuanPerBulan += detail_report_per_bulan[i].selling_price;
		totalProfitPerBulan += detail_report_per_bulan[i].profit;
	}

	for (let i = 0; i < detail_report_per_tahun.length; i++) {
		totalModalPerTahun += detail_report_per_tahun[i].harga_pokok;
		totalHargaSatuanPerTahun += detail_report_per_tahun[i].selling_price;
		totalProfitPerTahun += detail_report_per_tahun[i].profit;
	}

	return res.render("detail-report", {
		title: "DETAIL LAPORAN PENJUALAN | ALFAS Makassar",
		layout: "../views/detail-report",
		report_per_hari,
		detail_report_per_minggu,
		detail_report_per_bulan,
		detail_report_per_tahun,
		length_reprot_per_hari,
		length_reprot_per_minggu,
		length_reprot_per_bulan,
		length_reprot_per_tahun,
		totalModalPerHari,
		totalHargaSatuanPerHari,
		totalProfitPerHari,
		totalModalPerMinggu,
		totalHargaSatuanPerMinggu,
		totalProfitPerMinggu,
		totalModalPerBulan,
		totalHargaSatuanPerBulan,
		totalProfitPerBulan,
		totalModalPerTahun,
		totalHargaSatuanPerTahun,
		totalProfitPerTahun,
		alt_id_detail_report_per_hari,
		tanggal_periode_per_hari,
		tanggal_periode_per_minggu,
		tanggal_periode_per_bulan,
		tanggal_periode_per_tahun,
		id_date_report_per_minggu,
		id_date_report_per_bulan,
		id_date_report_per_tahun,
		idURL,
		periode_name,
		lihatId,
	});
});

// Logout
router.get('/logout', function(req, res, next) {
	if(req.session) {
		req.session.destroy(function(err) {
			if(err) {
				return next(err);
			} else {
				return res.redirect('/');
			}
		});
	}
});

module.exports = router;