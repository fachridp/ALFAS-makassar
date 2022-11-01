// getting all required elements
const searchWrapper = document.querySelector(".search-input");
const inputBox = document.querySelectorAll(".class_product_name");
const suggBox = document.querySelectorAll(".autocom-box");
const unit = document.getElementById('unit');
const allUnit = document.querySelectorAll('.class_unit');
let productName;
let hargaPokok;
let sellingPrice;
let qty;
let totalPrice;
let allTotalPriceInput;
let profit;
let total_bayar_keseluruhan;
let get_total_bayar_keseluruhan = [];
let uang_pembeli;
let kembalian;

let selectedVal;
let currentInputField;
let parentNodeSearchInput;
let parentNodeTop;

// Menambah attribute baru untuk setiap element option
unit.addEventListener('click', (e) => {
    let x = document.getElementById("unit");
    let txt = "All options: ";
    for (let i = 0; i < x.options.length; i++) {
        txt = txt + "\n" + x.options[i].value;
        e.target.options[i].setAttribute("onclick", "select(this)"); // attribute baru
    }
});

for (let i = 0; i < inputBox.length; i++) {
    inputBox[i].addEventListener('click', (e) => {
        currentInputField = e.target;

        // if user press any key and release
        currentInputField.onkeyup = (e) => {
            let userData = e.target.value; // user enetered data
            let emptyArray1 = [];
            let emptyArray2 = [];
            let allList;
            if(userData) {
                emptyArray1 = autoFillValues.filter((data) => {
                    //filtering array value and user characters to lowercase and return only those words which are start with user enetered chars
                    return data.product_name.toLocaleLowerCase().startsWith(userData.toLocaleLowerCase());
                });

                let myData = [];

                for (let i = 0; i < emptyArray1.length; i++) {
                    myData.push({product_name: emptyArray1[i].product_name})
                }

                emptyArray2 = [...new Map(myData.map(obj => [JSON.stringify(obj), obj])).values()];

                emptyArray2 = emptyArray2.map((newData) => {
                    // passing return data inside li tag
                    return newData = `<li>${newData.product_name}</li>`;
                });

                parentNodeSearchInput = currentInputField.parentNode;

                parentNodeSearchInput.classList.add("active"); // show autocomplete box

                showSuggestions(emptyArray2);

                let allList = parentNodeSearchInput.querySelectorAll("li");

                parentNodeTop = parentNodeSearchInput.parentNode.parentNode;

                for (let i = 0; i < allList.length; i++) {
                    //adding onclick attribute in all li tag
                    allList[i].setAttribute("onclick", "select(this)");
                }
            } else {
                parentNodeSearchInput = currentInputField.parentNode;
                parentNodeSearchInput.classList.remove("active"); // hide autocomplete box
            }
        }
    });
}

function select(element) {
    let selectData = element.textContent;
    let inputBoxValue = currentInputField.value = selectData;
    let getInputFieldParentNode = currentInputField.parentNode.parentNode.parentNode;
    let InputFieldParentNode = getInputFieldParentNode.querySelector('.class_unit');
    let sumTotalAllPrice = 0;

    let productNameFirst = getInputFieldParentNode.querySelector('.class_product_name');
    const unitValue = getInputFieldParentNode.querySelector('.class_unit').value;

    for (let i = 0; i < autoFillValues.length; i++) {
        if (productNameFirst.value === autoFillValues[i].product_name) {
            const category = getInputFieldParentNode.querySelector('.class_category');
            category.value = autoFillValues[i].category;

            if (unitValue === autoFillValues[i].unit) {
                const hargaPokok = getInputFieldParentNode.querySelector('.class_harga_pokok');
                const sellingPrice = getInputFieldParentNode.querySelector('.class_selling_price');
                const qty = getInputFieldParentNode.querySelector('.class_qty');
                const total_price = getInputFieldParentNode.querySelector('.class_total_price');
                const profit = getInputFieldParentNode.querySelector('.class_profit');
                const unitValue = getInputFieldParentNode.querySelector('#unit').value;

                hargaPokok.value = autoFillValues[i].harga_pokok;
                sellingPrice.value = autoFillValues[i].selling_price;
                profit.value = autoFillValues[i].selling_price - autoFillValues[i].harga_pokok;
                total_price.value = sellingPrice.value * qty.value;

                break;
            } else {
                hargaPokok = getInputFieldParentNode.querySelector('.class_harga_pokok');
                sellingPrice = getInputFieldParentNode.querySelector('.class_selling_price');
                totalPrice = getInputFieldParentNode.querySelector('.class_total_price');
                profit = getInputFieldParentNode.querySelector('.class_profit');
                total_bayar_keseluruhan = document.getElementById('total_bayar_keseluruhan');
                
                hargaPokok.value = "";
                sellingPrice.value = "";
                totalPrice.value = 0;
                profit.value = 0;
            }
        }
    }

    InputFieldParentNode.addEventListener('change', (e) => {
        productName = getInputFieldParentNode.querySelector('.class_product_name');
        getValueUnitClicked = e.target.value;

        for (let i = 0; i < autoFillValues.length; i++) {
            if (productName.value === autoFillValues[i].product_name && getValueUnitClicked === autoFillValues[i].unit) {
                hargaPokok = getInputFieldParentNode.querySelector('.class_harga_pokok');
                sellingPrice = getInputFieldParentNode.querySelector('.class_selling_price');
                qty = getInputFieldParentNode.querySelector('.class_qty');
                totalPrice = getInputFieldParentNode.querySelector('.class_total_price');
                profit = getInputFieldParentNode.querySelector('.class_profit');
                allTotalPriceInput = document.querySelectorAll('.class_total_price');
                total_bayar_keseluruhan = document.getElementById('total_bayar_keseluruhan');
                uang_pembeli = document.getElementById('uang_pembeli');
                kembalian = document.getElementById('kembalian');

                hargaPokok.value = autoFillValues[i].harga_pokok;
                sellingPrice.value = autoFillValues[i].selling_price;
                totalPrice.value = sellingPrice.value * qty.value;
                profit.value = sellingPrice.value - hargaPokok.value;

                for (let i = 0; i < allTotalPriceInput.length; i++) {
                    sumTotalAllPrice += parseInt(allTotalPriceInput[i].value);
                }

                total_bayar_keseluruhan.value = sumTotalAllPrice;
                kembalian.value = parseInt(total_bayar_keseluruhan.value) - parseInt(uang_pembeli.value);

                break;
            } else {
                hargaPokok = getInputFieldParentNode.querySelector('.class_harga_pokok');
                sellingPrice = getInputFieldParentNode.querySelector('.class_selling_price');
                totalPrice = getInputFieldParentNode.querySelector('.class_total_price');
                allTotalPriceInput = document.querySelectorAll('.class_total_price');
                profit = getInputFieldParentNode.querySelector('.class_profit');
                total_bayar_keseluruhan = document.getElementById('total_bayar_keseluruhan');

                hargaPokok.value = "";
                sellingPrice.value = "";
                totalPrice.value = "";
                profit.value = "";
            }
        }
    })

    parentNodeSearchInput.classList.remove("active");
}

function calculateAmount(val) {
    let parentNodeQty = val.parentNode.parentNode;
    
    let selling_price = parentNodeQty.querySelector('.class_selling_price');
    let qty = parentNodeQty.querySelector('.class_qty');
    let total_price = parentNodeQty.querySelector('.class_total_price');
    let allTotalPirce = document.querySelectorAll('.class_total_price');
    let sum_keseluruhan = document.getElementById('total_bayar_keseluruhan');
    let uang_pembelii = document.getElementById('uang_pembeli');
    let kembaliann = document.getElementById('kembalian');
    let getSumKeseluruhan = 0;

    let sum1 = selling_price.value * qty.value;

    total_price.value = sum1;

    for (let i = 0; i < allTotalPirce.length; i++) {
        getSumKeseluruhan += parseInt(allTotalPirce[i].value);
    }

    sum_keseluruhan.value = getSumKeseluruhan;
    kembaliann.value = parseInt(sum_keseluruhan.value) - parseInt(uang_pembelii.value);
}

function showSuggestions(list) {
    let listData;

    if(!list.length){
        userValue = currentInputField.value;
        listData = `<li>${userValue}</li>`;
    } else {
      listData = list.join('');
    }

    for (let i = 0; i < suggBox.length; i++) {
        suggBox[i].innerHTML = listData;
    }
}
