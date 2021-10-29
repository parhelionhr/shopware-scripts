// ==UserScript==
// @name         Oetker Order List
// @namespace    Parhelion
// @version      4.4
// @updateURL    https://github.com/parhelionhr/shopware-scripts/raw/main/dr-oetker-hr.user.js
// @downloadURL  https://github.com/parhelionhr/shopware-scripts/raw/main/dr-oetker-hr.user.js
// @description  try to take over the world!
// @author       Tihomir
// @match        https://oetker-shop.hr/admin*
// @icon         https://www.google.com/s2/favicons?domain=oetker-shop.hr
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js
// @require      https://raw.githubusercontent.com/parhelionhr/shopware-scripts/main/dr-oetker-hr.products.js
// @require      https://raw.githubusercontent.com/parhelionhr/shopware-scripts/main/dr-oetker-hr.bundles.js
// @grant        none
// ==/UserScript==
var sifre = [];
(function () {
    "use strict";
    console.log("Tampermonkey script started");
    var prevOrderName = "X";
    var orderName = "";
    var warnings = [];
    var ctrl = 0;
    var intervalId = setInterval(function () {
        var orderText = $(".smart-bar__header h2").first().text();
        orderName = orderText.replace("Order ", "");
        if (orderName !== prevOrderName) {
            main();
            prevOrderName = orderName;
        }
    }, 2000);

    function deduplicate(arr) {
        var obj = {};
        arr.map(function (a) {
            if (obj[a.code]) {
                obj[a.code].quantity += a.quantity;
            } else {
                obj[a.code] = a;
            }
        });
        var out = [];
        Object.keys(obj).forEach((key) => {
            out.push(obj[key]);
        });
        return out;
    }

    function extractInfo() {
        var info = {};
        var bl = $(".sw-card.sw-order-user-card.sw-card--grid");
        info.price = $.trim(
            $(".sw-order-user-card__metadata-price:first").text()
        );
        info.email = $(bl).find(".sw-order-inline-field").first().text();

        var shipping_block = $(".sw-address__body").last();
        info.fullName = $(shipping_block)
            .find(".sw-address__full-name.sw-address__line")
            .first()
            .text();
        info.address = $(shipping_block)
            .find(".sw-address__street.sw-address__line")
            .first()
            .text();
        info.zipcode = $(shipping_block)
            .find(".sw-address__location.sw-address__line span")
            .first()
            .text();
        info.city = $(shipping_block)
            .find(".sw-address__location.sw-address__line span")
            .last()
            .text();

        info.phone = $(bl)
            .find(".sw-order-inline-field.sw-order-inline-field__truncateable")
            .first()
            .text()
            .replace(/\s+/g, "");
        info.paymentMethod = $(
            ".sw-description-list.sw-order-user-card__summary-vertical dd"
        )
            .eq(5)
            .text();
        info.paymentStatus = $("#sw-field--selectedActionName option")
            .first()
            .text()
            .replace(/ /g, "");

        var orderText = $(".smart-bar__header h2").first().text();
        info.orderName = orderText.replace("Order ", "");
        orderName = info.orderName;

        info.address = $.trim(info.address);
        var street = info.address.split(" ");
        info.streetNumber = street.pop();
        info.streetName = street.join(" ");

        Object.keys(info).forEach((key) => {
            info[key] = $.trim(info[key]);
        });
        info.price = info.price.substr(0, info.price.length - 4);
        if (info.paymentStatus == "Paymentstatus:Paid") {
            info.price = "";
        }
        if (
            info.phone.substr(0, 1) == "0" &&
            info.phone.substr(0, 2) !== "00"
        ) {
            info.phone = "385" + info.phone.substr(1);
        }
        // missing
        info.orderNote = "";
        console.log(info);
        return info;
    }

    function copyToClipboard(str) {
        const el = document.createElement("textarea");
        el.value = str;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
    }

    function ui(content, orderitems) {
        orderitems = deduplicate(orderitems);

        if (!!document.getElementById("monkey-window")) {
            document.getElementById("monkey-window").remove();
        }

        var el = document.createElement("div");
        el.id = "monkey-window";
        el.style = "border:solid 2px black;padding:3px";

        /*
        var text = document.createTextNode(content);
        orderitems.map(function (item) {
            el.appendChild(document.createTextNode(item.code+" | "+item.quantity+" | "+item.name));
            el.appendChild(document.createElement("br"));
        });

        el.appendChild( document.createTextNode("----- select all codes and copy paste to xls -----"));
        el.appendChild(document.createElement("br"));
        */

        var divRb = document.createElement("div");
        divRb.style = "float:left;width:35px";
        for (var rb = 1; rb <= orderitems.length; rb++) {
            divRb.appendChild(document.createTextNode(rb + "."));
            divRb.appendChild(document.createElement("br"));
        }
        el.appendChild(divRb);

        var div1 = document.createElement("div");
        div1.style = "float:left;width:200px";
        orderitems.map(function (item) {
            div1.appendChild(document.createTextNode(item.code));
            div1.appendChild(document.createElement("br"));
        });
        el.appendChild(div1);

        var div2 = document.createElement("div");
        div2.style = "float:left;width:100px";
        orderitems.map(function (item) {
            div2.appendChild(document.createTextNode(item.quantity));
            div2.appendChild(document.createElement("br"));
        });
        el.appendChild(div2);

        var div3 = document.createElement("div");
        div3.style = "width:auto";
        orderitems.map(function (item) {
            div3.appendChild(document.createTextNode(item.name));
            div3.appendChild(document.createElement("br"));
        });
        el.appendChild(div3);

        if (warnings.length > 0) {
            var div4 = document.createElement("div");
            div4.style = "width:auto";
            warnings.map(function (warn) {
                div4.appendChild(warn);
                div4.appendChild(document.createElement("br"));
            });
            el.appendChild(div4);
        }

        /*
        info.price = $.trim($(".sw-order-user-card__metadata-price:first").text());
        info.email = $(bl).find(".sw-order-inline-field").first().text();
        info.fullName = $(bl).find(".sw-address__body .sw-address__full-name.sw-address__line").first().text();
        info.address = $(bl).find(".sw-address__body .sw-address__street.sw-address__line").first().text();
        info.zipcode = $(bl).find(".sw-address__body .sw-address__location.sw-address__line span").first().text();
        info.city = $(bl).find(".sw-address__body .sw-address__location.sw-address__line span").last().text();
        info.phone = $(bl).find(".sw-order-inline-field.sw-order-inline-field__truncateable").first().text();
        info.paymentMethod = $(".sw-description-list.sw-order-user-card__summary-vertical dd").eq(5).text();
        */
        var div5 = document.createElement("div");
        div5.style =
            "display:block;width:auto;height:30px;background:orange;cursor:pointer;white-space:nowrap";
        var info = extractInfo();
        var strToCopy =
            info.fullName +
            "\t" +
            info.streetName +
            "\t" +
            info.streetNumber +
            "\t" +
            info.zipcode +
            "\t" +
            info.city +
            "\t" +
            info.phone +
            "\t" +
            info.price +
            "\t" +
            info.email +
            "\t" +
            info.orderNote +
            "\t" +
            info.orderName +
            "\t";
        div5.appendChild(document.createTextNode(strToCopy));
        div5.addEventListener("click", (e) => {
            copyToClipboard(strToCopy);
        });
        el.appendChild(div5);

        var app = document.getElementById("app");
        document.body.insertBefore(el, app);

        var close = document.createElement("div");
        close.id = "monkey-close-btn";
        close.style =
            "display:block;position:fixed;top:0;right:0;width:30px;height:30px;background:blue;";
        close.appendChild(document.createTextNode("X"));
        close.addEventListener("click", (e) => {
            $("#monkey-window").toggle();
        });
        document.body.appendChild(close, app);

        /*
        $("#monkey-close-btn").live("click", function (event) {
            $("#monkey-window").hide();
        });
        */
    }

    function getProductById(productId) {
        var product = products.filter(function (item) {
            return item.id === productId;
        });
        if (product.length == 1) {
            return Object.assign({}, product[0]);
        }
        alert("Product id " + productId + " not found");
    }

    function getProductByCode(productCode) {
        productCode = $.trim(productCode);
        var product = products.filter(function (item) {
            return item.code === productCode;
        });
        if (product.length == 1) {
            return Object.assign({}, product[0]);
        }
        alert("Product code " + productCode + " not found");
    }

    function transformBundlesToString(code) {
        var output = [];
        Object.keys(bundles).forEach((bundleCode) => {
            var bundleItems = bundles[bundleCode];
            output.push("\n" + bundleCode);
            var out = [];
            bundleItems.forEach((item) => {
                var item_id = null;
                var quantity = item.quantity;
                var product = null;
                if (item.id) {
                    item_id = item.id;
                } else {
                    product = getProductByCode(item.code);
                    item_id = product.id;
                }
                out.push(quantity + ":" + item_id);
            });
            output.push(out.join(","));
        });
        alert(output.join("\n"));
    }

    function main() {
        console.log("Main run");
        // tmp
        /*
        var bla = "";
        products.map(function(item){
            bla = bla + item.code + "\n";
        });
        console.log(bla);
        */
        // tmp
        var c = 0;
        var msg = "";
        var orderitems = [];
        var rows = $(
            ".sw-order-line-items-grid__data-grid tr.sw-data-grid__row"
        ).each(function () {
            var ahref = $(this).find("a").attr("href");
            var productName = $.trim(
                $(this).find(".sw-product-variant-info__product-name").html()
            );

            // custom rules
            if (productName == "20% popusta newsletter") {
                warnings.push(productName);
            }
            if (productName == "Digitalni timer") {
                // warnings.push(productName);
                var id = "f9299dc63d804beab715d0b0209d4632";
                var quantity = 1;
                var prod = getProductById(id);
                prod.quantity = quantity;
                orderitems.push(prod);
            } else if (
                productName ==
                "Posudica za spremanje muffina Candy- promotivni poklon"
            ) {
                // warnings.push(productName);
                var id = "ce2bf3f3e20c4675846c16f2ac73042c";
                var quantity = 1;
                var prod = getProductById(id);
                prod.quantity = quantity;
                orderitems.push(prod);
            } else if (productName == "Vitalis limena doza") {
                // warnings.push(productName);
                var id = "67d0adc292f74c119507afc6bc42fd00";
                var quantity = 1;
                var prod = getProductById(id);
                prod.quantity = quantity;
                orderitems.push(prod);
            } else if (productName == "Vitalis žlica") {
                // warnings.push(productName);
                var id = "4b14e6a875ac4dd08a56293ab60438fb";
                var quantity = 1;
                var prod = getProductById(id);
                prod.quantity = quantity;
                orderitems.push(prod);
            } else if (
                productName == "Promo plišani privjesak morske životinje"
            ) {
                // warnings.push(productName);
                var id = "d40dee25170444bca74214851208d9a5";
                var quantity = 1;
                var prod = getProductById(id);
                prod.quantity = quantity;
                orderitems.push(prod);
                /*
            } else if (productName == "Knjiga recepata Tajna je u imenu 2") {
                // warnings.push(productName);
                var id = "942529b8052c480fbdbb3812f045390a";
                var quantity = 1;
                var prod = getProductById(id);
                prod.quantity = quantity;
                orderitems.push(prod);
                */
                // regular products
            } else if (ahref && ahref !== "#") {
                console.log(ahref);
                c += 1;
                var id = ahref.split("/detail/")[1];

                var quantity = $(this)
                    .find(".sw-data-grid__cell--quantity div")
                    .html();
                id = $.trim(id);
                productName = $.trim(productName);
                quantity = parseInt($.trim(quantity));
                var product = products.filter(function (item) {
                    return item.id === id;
                });

                console.log(productName, quantity);
                if (product) {
                    if (product[0]) {
                        var prod = product[0];
                        prod.quantity = quantity;
                    } else {
                        alert("Novi proizvod? Nije pronađen: " + productName);
                    }
                } else {
                }

                // custom rules
                // ako je 2x Vitalis jastučić onda taj ostavi, a dodaj još 2 puta Hrskavi jastučići nešto
                if (product) {
                    if (product[0].id == "9e2d75d87b0843839a7ca82399b5361c") {
                        var hrskaviJastucici = products.filter(function (item) {
                            return (
                                item.id === "cd1e7c4f7e204e548bb8f65497387f95"
                            );
                        });
                        var prod = hrskaviJastucici[0];
                        prod.quantity = quantity * 2;
                    }
                }

                if (bundles[prod.code]) {
                    var myset = bundles[prod.code];
                    // msg += "Found set " + quantity + "x " + code + ":" + productName + "\n";
                    bundles[prod.code].map(function (iteminset) {
                        var productfromset = getProductByCode(iteminset.code);
                        productfromset.quantity =
                            iteminset.quantity * prod.quantity;
                        orderitems.push(productfromset);
                        // msg += item.code + " | " + item.quantity + " | " + item.name + " | " + item.id + "\n";
                    });
                    // msg += "End set" + code + "\n";
                } else {
                    orderitems.push(prod);
                }
            }
        });
        if (orderName !== prevOrderName) {
            ui(msg, orderitems);
            // alert(msg);
            // clearInterval(intervalId);
            // ctrl = c;
        }
    }
})();
