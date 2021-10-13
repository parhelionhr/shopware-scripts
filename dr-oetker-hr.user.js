// ==UserScript==
// @name         Oetker Order List
// @namespace    Parhelion
// @version      4.3
// @updateURL    https://github.com/parhelionhr/shopware-scripts/raw/main/dr-oetker-hr.user.js
// @downloadURL  https://github.com/parhelionhr/shopware-scripts/raw/main/dr-oetker-hr.user.js
// @description  try to take over the world!
// @author       Tihomir
// @match        https://oetker-shop.hr/admin*
// @icon         https://www.google.com/s2/favicons?domain=oetker-shop.hr
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js
// @require      https://raw.githubusercontent.com/parhelionhr/shopware-scripts/main/dr-oetker-hr.products.js
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

    function transformSetsToString(code) {
        var output = [];
        Object.keys(sets).forEach((bundleCode) => {
            var bundleItems = sets[bundleCode];
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

                if (sets[prod.code]) {
                    var myset = sets[prod.code];
                    // msg += "Found set " + quantity + "x " + code + ":" + productName + "\n";
                    sets[prod.code].map(function (iteminset) {
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

    var sets = {
        170000528: [
            {
                id: "3b5d153a6da14e33afa871b8a5e0c541",
                code: "170000514",
                name: "Kalup za voćni biskvit - Ø28 cm",
                quantity: 1,
            },
            {
                id: "ce3eb712cc0145f5b0dc49b83c65409c",
                code: "170005525",
                name: "Original Backin 5+1",
                quantity: 1,
            },
            {
                id: "f8b7dcc2b19541e593bf3febcd42b26e",
                code: "170004575",
                name: "Bourbon vanilin šećer x3",
                quantity: 1,
            },
            {
                id: "eee84b97603f4dbcb1fef0afa6fb701d",
                code: "170002122",
                name: "Kremfix x3",
                quantity: 1,
            },
            {
                id: "565b4481e299458d9981003803c7bd05",
                code: "170004878",
                name: "Preljev za torte jagoda",
                quantity: 2,
            },
            {
                id: "ee8652f35a704c99ab920c6387c63b9d",
                code: "170002065",
                name: "Puding slatko vrhnje x3",
                quantity: 1,
            },
        ],
        170000529: [
            {
                id: "ae7024d5c11143cf817ee2af8d3d3841",
                code: "170000526",
                name: "Zeko kalup na zatvaranje, zlatni",
                quantity: 1,
            },
            {
                id: "84c540e36cb040c99ef2055b149b706f",
                code: "101143500",
                name: "Finesse naribana korica limuna",
                quantity: 1,
            },
            {
                id: "d06732846b8940009b60be18cfa42cef",
                code: "170003436",
                name: "Gustin 200g",
                quantity: 1,
            },
            {
                id: "18dee41bfd664c77b994cff325f4fb72",
                code: "170001190",
                name: "Prašak za pecivo",
                quantity: 2,
            },
            {
                id: "1ada1bbaa2e74acb9f3e0ae6f8acc9d5",
                code: "170006722",
                name: "Vanilin šećer",
                quantity: 2,
            },
        ],
        170000530: [
            {
                id: "4817d51b8b7d49449b4d36ee830c4982",
                code: "170000527",
                name: "Retro okrugli kalup Ø20 cm",
                quantity: 1,
            },
            {
                id: "ee7e6a9389fd478d9be89a3d431b8b60",
                code: "170006849",
                name: "Čokolada cake mix",
                quantity: 1,
            },
            {
                id: "9cb0e6c91d894e62b9dfa02a5e62e479",
                code: "170006850",
                name: "Vanilija cake mix",
                quantity: 1,
            },
            {
                id: "a0e0133b5710476abe4a2a2d3304c8a0",
                code: "170015514",
                name: "Mini decor Sweet Rose",
                quantity: 1,
            },
            {
                id: "f822c06e5d09442bb74dc5d5e9e4c2ce",
                code: "170015513",
                name: "Mini decor Creation Blue",
                quantity: 1,
            },
            {
                id: "22d4caec033f4b60b2216812b6ef54d7",
                code: "170001226",
                name: "Krema za torte čokolada",
                quantity: 1,
            },
        ],
        170000531: [
            {
                id: "92824d7c3b5941a2bb521995d91b36a3",
                code: "170000505",
                name: 'Limena doza "Dodaci za kolače"',
                quantity: 1,
            },
            {
                id: "18dee41bfd664c77b994cff325f4fb72",
                code: "170001190",
                name: "Prašak za pecivo",
                quantity: 2,
            },
            {
                id: "1ada1bbaa2e74acb9f3e0ae6f8acc9d5",
                code: "170006722",
                name: "Vanilin šećer",
                quantity: 3,
            },
            {
                id: "dc68584e5a9c4e9c84e1eb25a050fc9d",
                code: "170006856",
                name: "Limun šećer x3",
                quantity: 1,
            },
            {
                id: "003485792b284d40bac4c897766d329b",
                code: "170006858",
                name: "Rum šećer x3",
                quantity: 1,
            },
            {
                id: "f334c51fe38b482f83c7381e80e75b81",
                code: "170011102",
                name: "Kvasac instant",
                quantity: 2,
            },
            {
                id: "eee84b97603f4dbcb1fef0afa6fb701d",
                code: "170002122",
                name: "Kremfix x3",
                quantity: 1,
            },
            {
                id: "0e33703f5295474fb8a7caed78c1caff",
                code: "170001655",
                name: "Preljev, svijetli x3",
                quantity: 1,
            },
            {
                id: "4be092aa5e134d52915065447b824283",
                code: "170001741",
                name: "Želatina u listićima, svijetla",
                quantity: 1,
            },
            {
                id: "79e74cc94b7c4305bdda54fc304271ca",
                code: "170001232",
                name: "Soda bikarbona",
                quantity: 2,
            },
        ],
        170000532: [
            {
                id: "498a473852164380b5228f3cd7a20e4d",
                code: "170000507",
                name: 'Vintage doza "Prijateljice"',
                quantity: 1,
            },
            {
                id: "8724105180a24f8c9c067398779d0529",
                code: "170005140",
                name: "Pasta od burbon vanilije",
                quantity: 1,
            },
            {
                id: "7199edebae4841be81830310489d288b",
                code: "170005483",
                name: "Ukrasni cvjetići",
                quantity: 1,
            },
            {
                id: "629e484ebe8740158b5a018a039f9c5b",
                code: "101531300",
                name: "Čokoladno pismo",
                quantity: 1,
            },
            {
                id: "a0e0133b5710476abe4a2a2d3304c8a0",
                code: "170015514",
                name: "Mini decor Sweet Rose",
                quantity: 1,
            },
        ],
        170000543: [
            {
                id: "483b86156b154876852630d72ab9c050",
                code: "170002560",
                name: "Riža na mlijeku klasik ",
                quantity: 1,
            },
            {
                id: "918c696460324e28b4bb66cb43a4f9fb",
                code: "170002561",
                name: "Riža na mlijeku vanilija",
                quantity: 1,
            },
            {
                id: "4cda9c67a8e64b9b81407ebf176bb4a1",
                code: "170006534",
                name: "Američke palačinke s proteinima ",
                quantity: 1,
            },
            {
                id: "1dc544f5c0bb4257b150c9ff99697fb8",
                code: "170006612",
                name: "Waffles",
                quantity: 1,
            },
        ],
        170000540: [
            {
                id: "fa74af0c16d742209ecaecf130382b4b",
                code: "170000533",
                name: "Retro roza kuhinjska rukavica",
                quantity: 1,
            },
            {
                id: "d2a3e2b974bd41008b92d12a8f35211f",
                code: "170005396",
                name: "Mini muffins",
                quantity: 1,
            },
            {
                id: "b761a4a4f70545f0b2868a2d4a5e6c40",
                code: "101526000",
                name: "Svjećice Happy Birthday",
                quantity: 1,
            },
        ],
        170000538: [
            {
                code: "170000537",
                quantity: 1,
            },
            {
                code: "170000535",
                quantity: 1,
            },
            {
                code: "170011234",
                quantity: 2,
            },
            {
                code: "170011556",
                quantity: 2,
            },
            {
                code: "170015082",
                quantity: 2,
            },
            {
                code: "170001233",
                quantity: 2,
            },
            {
                code: "170006785",
                quantity: 1,
            },
        ],
        170000539: [
            {
                code: "170000544",
                quantity: 1,
            },
            {
                code: "170021236",
                quantity: 3,
            },
            {
                code: "170004549",
                quantity: 2,
            },
            {
                code: "170006061",
                quantity: 1,
            },
            {
                code: "170006064",
                quantity: 1,
            },
        ],
        170000541: [
            {
                code: "170011234",
                quantity: 4,
            },
        ],
        170000547: [
            {
                code: "170000508",
                quantity: 1,
            },
            {
                code: "170005525",
                quantity: 1,
            },
            {
                code: "170004575",
                quantity: 1,
            },
            {
                code: "170006795",
                quantity: 1,
            },
            {
                code: "170011516",
                quantity: 1,
            },
            {
                code: "101143500",
                quantity: 1,
            },
        ],
        170000548: [
            {
                code: "170000514",
                quantity: 1,
            },
            {
                code: "170005525",
                quantity: 1,
            },
            {
                code: "170004575",
                quantity: 1,
            },
            {
                code: "170002122",
                quantity: 1,
            },
            {
                code: "170021236",
                quantity: 2,
            },
        ],
        170000585: [
            {
                code: "170006842",
                quantity: 5,
            },
        ],
        170000583: [
            {
                code: "170006555",
                quantity: 1,
            },
            {
                code: "170003780",
                quantity: 1,
            },
            {
                code: "170000570",
                quantity: 1,
            },
            {
                code: "170005556",
                quantity: 1,
            },
            {
                code: "170025516",
                quantity: 1,
            },
            {
                code: "170000556",
                quantity: 1,
            },
        ],
        170000582: [
            {
                code: "170000515",
                quantity: 1,
            },
            {
                code: "170003781",
                quantity: 1,
            },
            {
                code: "170016535",
                quantity: 1,
            },
            {
                code: "170015129",
                quantity: 1,
            },
            {
                code: "170015517",
                quantity: 1,
            },
        ],
        170000586: [
            {
                code: "170006446",
                quantity: 4,
            },
        ],
        170000587: [
            {
                code: "101687600",
                quantity: 4,
            },
        ],
    };
})();
