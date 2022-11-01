// getting all required elements
const searchWrapper = document.querySelector(".search-input");
const inputBox = searchWrapper.querySelector("input");
const suggBox = searchWrapper.querySelector(".autocom-box");
const icon = searchWrapper.querySelector(".icon");
const unit = document.getElementById('unit');
let linkTag = searchWrapper.querySelector("a");
let webLink;

// if user press any key and release
inputBox.onkeyup = (e)=>{
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

        searchWrapper.classList.add("active"); //show autocomplete box
        showSuggestions(emptyArray2);
        let allList = suggBox.querySelectorAll("li");
        for (let i = 0; i < allList.length; i++) {
            //adding onclick attribute in all li tag
            allList[i].setAttribute("onclick", "select(this)");
        }
    } else {
        searchWrapper.classList.remove("active"); //hide autocomplete box
    }
}

function select(element){
    let selectData = element.textContent;
    let inputBoxValue = inputBox.value = selectData;
    let parentNodeForm = inputBox.parentNode.parentNode.parentNode;

    let product_name = parentNodeForm.querySelector('#product_name');
    let unit = parentNodeForm.querySelector('#unit');

    for (let i = 0; i < autoFillValues.length; i++) {
        if (product_name.value === autoFillValues[i].product_name) {
            const category = document.getElementById('category');

            category.value = autoFillValues[i].category;
        } else if (unit.value !== autoFillValues[i].unit) {
            const harga_pokok = document.getElementById('harga_pokok');
            const selling_price = document.getElementById('selling_price');
            const total_price = document.getElementById('total_price');

            harga_pokok.value = "";
            selling_price.value = "";
            total_price.value = 0;
        }
    }

    unit.addEventListener('change', (e) => {
        for (let i = 0; i < autoFillValues.length; i++) {
            if (product_name.value === autoFillValues[i].product_name && e.target.value === autoFillValues[i].unit) {
                const harga_pokok = document.getElementById('harga_pokok');
                const selling_price = document.getElementById('selling_price');
                const qty = document.getElementById('qty');
                const total_price = document.getElementById('total_price');

                harga_pokok.value = autoFillValues[i].harga_pokok;
                selling_price.value = autoFillValues[i].selling_price;
                total_price.value = selling_price.value * qty.value;

                break;
            } else {
                const harga_pokok = document.getElementById('harga_pokok');
                const selling_price = document.getElementById('selling_price');
                const qty = document.getElementById('qty');
                const total_price = document.getElementById('total_price');

                harga_pokok.value = "";
                selling_price.value = "";
                total_price.value = "";
            }
        }
    });

    searchWrapper.classList.remove("active");
}

function showSuggestions(list){
    let listData;
    if(!list.length){
        userValue = inputBox.value;
        listData = `<li>${userValue}</li>`;
    }else{
      listData = list.join('');
    }
    suggBox.innerHTML = listData;
}