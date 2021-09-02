// ==UserScript==
// @name         Oetker Order List
// @namespace    Parhelion
// @version      3.1
// @updateURL    https://github.com/parhelionhr/shopware-scripts/raw/main/dr-oetker-hr.user.js
// @downloadURL  https://github.com/parhelionhr/shopware-scripts/raw/main/dr-oetker-hr.user.js
// @description  try to take over the world!
// @author       Tihomir
// @match        https://oetker-shop.hr/admin*
// @icon         https://www.google.com/s2/favicons?domain=oetker-shop.hr
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js
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
            return product[0];
        }
        alert("Product id " + productId + " not found");
    }

    function getProductByCode(productCode) {
        productCode = $.trim(productCode);
        var product = products.filter(function (item) {
            return item.code === productCode;
        });
        if (product.length == 1) {
            return product[0];
        }
        alert("Product code " + productCode + " not found");
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
    };

    var products = [
        {
            id: "f9299dc63d804beab715d0b0209d4632",
            code: "170000525",
            name: "Digitalni timer",
        },
        {
            id: "67d0adc292f74c119507afc6bc42fd00",
            code: "170000545",
            name: "Vitalis limena doza",
        },
        {
            id: "635edd97f2664ba8b9f1dc13a3f0030c",
            code: "170000540",
            name: "Set Party paketić",
        },
        {
            id: "6597848551194924986510756538075a",
            code: "170000609",
            name: "Vrč za topljenje čokolade, silikonski",
        },
        {
            id: "9e18946b69894a0dbb141944cce27766",
            code: "170000543",
            name: "Set Slatki obroci -20%",
        },
        {
            id: "97201b201d064cefb0f11955106d66ac",
            code: "170000538",
            name: "Set Slatka zimnica",
        },
        {
            id: "8d582d571de54b109d24f33fe445ec56",
            code: "170000539",
            name: "Set Kolači s pudingom",
        },
        {
            id: "9e2d75d87b0843839a7ca82399b5361c",
            code: "170000542",
            name: "2x Vitalis jastučići vanilija -40%",
        },
        {
            id: "b3796288985e47e8b29bf3598a5b71b0",
            code: "170000534",
            name: "Zlatni marker za staklenke",
        },
        {
            id: "2444808dd9e7499ebbb5448285ad1fc9",
            code: "170006950",
            name: "Džemfix Extra 4:1",
        },
        {
            id: "e8db236171eb431783859d83ab983979",
            code: "170006967",
            name: "Superkaša XXL čokolada",
        },
        {
            id: "fa74af0c16d742209ecaecf130382b4b",
            code: "170000533",
            name: "Retro roza kuhinjska rukavica ",
        },
        {
            id: "aae922dd2f99452d86702164d5941b92",
            code: "170000535",
            name: "Samoljepljive etikete za staklenke, 16 kom",
        },
        {
            id: "a0fe4f12e2c84e849afb1185a4f5ed5e",
            code: "170000537",
            name: "Široki lijevak za staklenke",
        },
        {
            id: "490d75939c804ce9850d3145c98c9eca",
            code: "170000536",
            name: "Hvataljka za vruće staklenke",
        },
        {
            id: "d40dee25170444bca74214851208d9a5",
            code: "170000550",
            name: "Promo plišani privjesak morske životinje",
        },
        {
            id: "a35ed0e24b0441ef878a741d9ab3567e",
            code: "170000544",
            name: 'Knjiga "Kolači s pudingom"',
        },
        {
            id: "3084537a9003416198634bbf0ae5f6b2",
            code: "170006962",
            name: "Sweet Zero Vanilin",
        },
        {
            id: "12bec5ed9eac4b809a450bf589d3de41",
            code: "170006961",
            name: "Sweet Zero Eritrit",
        },
        {
            id: "c31028cca2c644449cfe08d916e45585",
            code: "170016613",
            name: "Soda bikarbona limun",
        },
        {
            id: "71d59ea653704eea8d0f8f8a413a843b",
            code: "170000547",
            name: "Punjena kutija 'Kvaliteta je najbolji recept'",
        },
        {
            id: "e155d57df8f94c5e8e79d797a5421834",
            code: "176303653",
            name: "Posna zobena kaša šumsko voće",
        },
        {
            id: "9c2390c1555445fbaf5cbeccd425b401",
            code: "170000561",
            name: "Srebrni podložak za tortu 28cm, 8 kom",
        },
        {
            id: "dc829e60fbec443291f0bad85a1fbdf7",
            code: "176303651",
            name: "Posna zobena kaša vanilija",
        },
        {
            id: "774ccafef31848f5b44e4849fa8f0207",
            code: "176303650",
            name: "Posna zobena kasa s čokoladom",
        },
        {
            id: "e6f074deba2d446a8c9c5b5a446106f0",
            code: "170025516",
            name: "Dekor mix perle soft",
        },
        {
            id: "0ecce01c44e04c5c93fb2f3a48dbce05",
            code: "170025284",
            name: "Citronka special za bazgin sirup",
        },
        {
            id: "ccec1bd78074470186415242b3779286",
            code: "170017032",
            name: "Sladki prah šećer u prahu 200g",
        },
        {
            id: "b1af54271b3b444c886bdfe0b17c6568",
            code: "170017033",
            name: "Sladki prah šećer u prahu 500g",
        },
        {
            id: "1a8d636be20447aea1306c3efe949494",
            code: "170023587",
            name: "Tiramisu",
        },
        {
            id: "ff9b584d48c64f8bb3610a10b468bb90",
            code: "170000610",
            name: "Kalup za kruh ovalni",
        },
        {
            id: "6c96ea1dedfa4fb695281864404e2599",
            code: "170000566",
            name: "Vaga kuhinjska digitalna 10kg, Professional",
        },
        {
            id: "9959168988e6439f88fa71faaf0112c8",
            code: "Vaga kuh. digitalna, stakl. podložak 5kg",
            name: "170000567",
        },
        {
            id: "d4305df137e744b5856f7d8d81bd028c",
            code: "170000578",
            name: "Kalup za kolače u obliku srca 6/1",
        },
        {
            id: "a914332fc29842e59355eb5dacd8bd27",
            code: "170000568",
            name: "Kalup za puding 0,6l",
        },
        {
            id: "9f359ebbe56c47a2af24e64c355984d4",
            code: "170000569",
            name: "Šprica za ukrašavanje kolača",
        },
        {
            id: "9e324df1257e45059dfe84962d7375dc",
            code: "170000571",
            name: "Papirnate košarice za muffine CVIJEĆE, 50 kom",
        },
        {
            id: "3b3cd59f965a4888889c44dc5138229d",
            code: "170000570",
            name: "Papirnate košarice za muffine SREĆA, 50 kom",
        },
        {
            id: "4ecbae17082240cdb9e61f753a524b81",
            code: "170000576",
            name: "Posipač za brašno 350g",
        },
        {
            id: "b968c179f49348fd8e3e9aaede84d0bb",
            code: "170000574",
            name: "Kist od mikrovlakana 35m, Professional",
        },
        {
            id: "230ea34d42e14584976b2c1c7e2d2f2c",
            code: "170000573",
            name: "Poklon kutija za 6 muffina plava, 2kom",
        },
        {
            id: "d97e0e1020684cf4b41b4df45e802dd1",
            code: "170000580",
            name: "Poklon kutija za 6 muffina roza, 2kom",
        },
        {
            id: "9a4fa26c2147401fa2add1e1d32156cc",
            code: "170000572",
            name: 'Papirnati kalup za pečenje "Mini" 10 kom',
        },
        {
            id: "c867652df09b4cbaafa426fb88699b39",
            code: "170000577",
            name: "Dječji set za kekse 11 dijelova",
        },
        {
            id: "5739f9257b21464fa5c7d02f804b13fc",
            code: "170000579",
            name: "Podmetač pamučni 20x20cm, Retro roza",
        },
        {
            id: "973c34f57b254990b01474c7637d6e42",
            code: "170000575",
            name: "Valjak za tijesto, Professional",
        },
        {
            id: "859a8f0991014e5092a6807e23bc28fd",
            code: "170022942",
            name: "Parfe krema vanilija",
        },
        {
            id: "35ef0b872740458cbcec045e390020ba",
            code: "170022941",
            name: "Krema za kremšnite",
        },
        {
            id: "d0675e8ff97541d596c6b047493a25e7",
            code: "170021236",
            name: "Puding vanilija",
        },
        {
            id: "543968d070ce4957bff9fbb25279b268",
            code: "170020010",
            name: "Želatina x3 svijetla",
        },
        {
            id: "d86c2162364846158166fe943a8cfd96",
            code: "170017470",
            name: "Domaće Princes krafne",
        },
        {
            id: "130bfae453b84a0181a34312a2aa045b",
            code: "170016535",
            name: "Mramorni muffins",
        },
        {
            id: "126fda0e0305482d999fcd9b5bb08eeb",
            code: "170016428",
            name: "Hrskave badem pahuljice",
        },
        {
            id: "df2929d3fc72441eab54cb6ca8d56f4a",
            code: "170016060",
            name: "Gluten Free Gustin",
        },
        {
            id: "1b8049a488534cfca4d6c7d90ab776fb",
            code: "170015517",
            name: "Dekor mix zvjezdice",
        },
        {
            id: "bee920a2eb744747b8aa4de1d41b3707",
            code: "170015515",
            name: "Dekor srebrne perle ",
        },
        {
            id: "a0e0133b5710476abe4a2a2d3304c8a0",
            code: "170015514",
            name: "Dekor Sweet Rose",
        },
        {
            id: "f822c06e5d09442bb74dc5d5e9e4c2ce",
            code: "170015513",
            name: "Dekor Creation Blue",
        },
        {
            id: "55da4d29e3ee4d0c9cea590bd8ac3c17",
            code: "170015129",
            name: "Šareno pismo",
        },
        {
            id: "8d063646463e41a582f99f411b4ec824",
            code: "170015082",
            name: "Džemfix Super 3:1",
        },
        {
            id: "738bb1753a804860aeee0cd653936e5d",
            code: "170014921",
            name: "Džemfix / Gelfix 2:1 za šljive",
        },
        {
            id: "1d8016d19eac428498ae30541655e0e2",
            code: "170014691",
            name: "Kakao za kolače",
        },
        {
            id: "32b882d4b03b4820890224bbc411914f",
            code: "170000555",
            name: "Obruč za tortu 15 do 30 cm, Classic",
        },
        {
            id: "e3a13ed866ea4643b8c4b0602a1916ad",
            code: "170000565",
            name: "Četvrtasti podesivi obruč za kolače",
        },
        {
            id: "9a18ee9c51764c2da5c8f129a234a9b1",
            code: "170014193",
            name: "Puding vanilija 3+1",
        },
        {
            id: "1f8c1d2115a24e578524e1755538c772",
            code: "170011556",
            name: "Džemfix Classic 1:1",
        },
        {
            id: "5a36ab01cfd54e148262e3ce2ff90ac0",
            code: "170011516",
            name: "Crni kakao",
        },
        {
            id: "9cbb04e1618a4fa4aa30b9b54691a194",
            code: "170011459",
            name: "Finesse naribana korica naranče",
        },
        {
            id: "684ef51b325b4cf2ada1236a72a3d9a4",
            code: "170011234",
            name: "Džemfix Extra 2:1",
        },
        {
            id: "f334c51fe38b482f83c7381e80e75b81",
            code: "170011102",
            name: "Kvasac instant",
        },
        {
            id: "4e1c77c45b3e4427888a1fd7c48abbf9",
            code: "170006905",
            name: "Aroma rum - bočica ",
        },
        {
            id: "f17c61d37a8b4d88b679192fa8852a1a",
            code: "170006904",
            name: "Aroma vanilija - bočica ",
        },
        {
            id: "02d68c9ab3d24c95a7c2f2ef219d0665",
            code: "170006903",
            name: "Crna tekuća jestiva boja",
        },
        {
            id: "7a1302503ef54a3ea7cd0aba043ccf8f",
            code: "170006900",
            name: "Crvena tekuća jestiva boja",
        },
        {
            id: "003485792b284d40bac4c897766d329b",
            code: "170006858",
            name: "Rum šećer x3",
        },
        {
            id: "e4bcffe9804547eea07f62ddbd726595",
            code: "170006857",
            name: "Cimet šećer x3",
        },
        {
            id: "702dbbbcc25e4cc3b61df1914aad9c02",
            code: "170000541",
            name: "Bestseller Džemfix 2:1 3+1 gratis",
        },
        {
            id: "dc68584e5a9c4e9c84e1eb25a050fc9d",
            code: "170006856",
            name: "Limun šećer x3",
        },
        {
            id: "dd4dfbd773d6447aa36557a32996795f",
            code: "170000557",
            name: "Kalup za tortu 26cm sa staklenim dnom",
        },
        {
            id: "9cb0e6c91d894e62b9dfa02a5e62e479",
            code: "170006850",
            name: "Vanilija cake mix",
        },
        {
            id: "ee7e6a9389fd478d9be89a3d431b8b60",
            code: "170006849",
            name: "Čokolada cake mix",
        },
        {
            id: "53dcea982d5240aca46aae5a3bb02962",
            code: "170006848",
            name: "Super kaša s čokoladom i chia sjemenkama 61g",
        },
        {
            id: "e88252e875e54f8bb12a34ce2a6e4192",
            code: "170006842",
            name: "Super kaša sa šumskim voćem i chia sjemenkama",
        },
        {
            id: "af681a822cd346eda81e071d39f9f525",
            code: "170006841",
            name: "Panna cotta šumsko voće",
        },
        {
            id: "a5f53bfb50a9449ab251d8d5a53a7947",
            code: "170006832",
            name: "Šlag pjena multipack ",
        },
        {
            id: "bb33d29891b74e1db9d3ed2277b697b2",
            code: "170006785",
            name: "Štapić vanilije",
        },
        {
            id: "681a1fce296a44ca8226012431ac1118",
            code: "170006725",
            name: "Vanilin šećer 5+1",
        },
        {
            id: "1ada1bbaa2e74acb9f3e0ae6f8acc9d5",
            code: "170006722",
            name: "Vanilin šećer",
        },
        {
            id: "40f1c37ecff040e6a09d0aa4ab433466",
            code: "170000562",
            name: "Mjerni lončić 500ml",
        },
        {
            id: "1c098d8a59914f3793cbcc629c4bfc29",
            code: "170000553",
            name: "Podizač torte/ Šablona za ukrašavanje Ø36",
        },
        {
            id: "33420582d0b047d1b3771019c9b4171e",
            code: "170000559",
            name: "Svijećice s držačima 12,5cm, Retro plava",
        },
        {
            id: "6a133cff16f048dba54234a7b0e68759",
            code: "170000558",
            name: "Svijećice s držačima 12,5cm, Retro roza",
        },
        {
            id: "79549542e06243b295d64c5d2143d821",
            code: "170000560",
            name: "Svijećice s držačima 12,5cm, Retro zelena",
        },
        {
            id: "3e53c7086f76478dbae38fbe0d19ca47",
            code: "170000554",
            name: "Vaga kuhinjska analogna",
        },
        {
            id: "21f213b38aa34d5f904a53397a5827aa",
            code: "170006711",
            name: "Super puding - zobeni puding vanilija",
        },
        {
            id: "5f5fd5aa87c7443abfd28ce27c6a637e",
            code: "170006710",
            name: "Super puding - zobeni puding čokolada",
        },
        {
            id: "810992b2a4944c48a9affab129bcb1e2",
            code: "170006613",
            name: "Hrskavi muesli s medom 600g ",
        },
        {
            id: "1dc544f5c0bb4257b150c9ff99697fb8",
            code: "170006612",
            name: "Waffles",
        },
        {
            id: "a9c976767df74d0c9f72023e1149f57b",
            code: "170006611",
            name: "600g Čokoladni muesli ",
        },
        {
            id: "a67c585c70be4e02b6861977a225694b",
            code: "170006591",
            name: "Ledeni desert vanilija",
        },
        {
            id: "9c754d01d10b4294b2c5c04004753af9",
            code: "170006590",
            name: "Ledeni desert čokolada",
        },
        {
            id: "960432ed82fb445597eccd5af5e49b2a",
            code: "170006555",
            name: "Voćni muffini - banana",
        },
        {
            id: "a2aaad0eb0ef41b8973360fde8e8db6c",
            code: "170006553",
            name: "Voćni muffini - jabuka, cimet",
        },
        {
            id: "4cda9c67a8e64b9b81407ebf176bb4a1",
            code: "170006534",
            name: "Američke palačinke s proteinima",
        },
        {
            id: "97885bbab8b24e7cb7dd036565dcea97",
            code: "139201001",
            name: "Professional Prašak za pecivo Backin 1kg",
        },
        {
            id: "b47d283fd2174a8fbead51f57c567352",
            code: "139201201",
            name: "Professional Vanilin šećer 1kg",
        },
        {
            id: "522a5bbe12c34f28823b358b7db10ca4",
            code: "139201804",
            name: "Professional  Gustin 2,5 kg",
        },
        {
            id: "8a02bd6c1ce64e328724fd8e4f41c064",
            code: "139202005",
            name: "Professional Puding vanilija",
        },
        {
            id: "8d2be321a171415988b086258a7a12ec",
            code: "139250074",
            name: "Professional Čokoladne mrvice",
        },
        {
            id: "ee2bf27d44a04aeea37037776edfd8a4",
            code: "139250083",
            name: "Professional Puding čokolada",
        },
        {
            id: "79abd47f86b943d4812f0d4aa8a3e06e",
            code: "139252308",
            name: "Professional Šarene mrvice",
        },
        {
            id: "edb972cf590141969fd2c92375333945",
            code: "139252330",
            name: "Professional Lješnjak krokant",
        },
        {
            id: "161cc9bc89de4d6eb80fd8833de86830",
            code: "139252332",
            name: "Professional Hrskave perle",
        },
        {
            id: "68b944d7015f4f55ae105ac1621b123b",
            code: "144242600",
            name: "Professional Kakao listići",
        },
        {
            id: "f6c489d071244f6999699290ecc67e88",
            code: "154213109",
            name: "Professional Desertni preljev čokolada 765 ml",
        },
        {
            id: "7df9d457beaf42248276c854be8e981e",
            code: "154213110",
            name: "Professional Desertni preljev jagoda 770 ml",
        },
        {
            id: "4c367a99e41d445fb74f1a9731508195",
            code: "170000551",
            name: "Slastičarski nož, Professional",
        },
        {
            id: "3d2e13e2882a492e89c8ab49840e64b9",
            code: "170000563",
            name: "Zdjela za miješanje 24cm, Professional",
        },
        {
            id: "641fecb9023647c4a4d49156305976a6",
            code: "170000564",
            name: "Podložak za tortu 32cm, Professional",
        },
        {
            id: "0e84ce8a7dc447808b3247b9fca3a1c0",
            code: "170006446",
            name: "Hrskavi muesli s medom",
        },
        {
            id: "ff4a1f0cab9f4c76b5e627c2785f076c",
            code: "170006434",
            name: "Crunchy Plus Med Badem",
        },
        {
            id: "144edb83e82d491dae62834fc5d86bff",
            code: "170006432",
            name: "Crunchy Plus Multi Voće",
        },
        {
            id: "c385b8a935dd42d78266d6ab32c9e6c9",
            code: "170006431",
            name: "Crunchy Plus Dupla Čokolada",
        },
        {
            id: "74cb833aa52f4201bb7ef010cc877d24",
            code: "170006426",
            name: "Muesli tamna čokolada",
        },
        {
            id: "7c95c8ba1f2147758d3c4e5bb4ce7590",
            code: "170000546",
            name: "Dugotrajna podloga za pečenje, 2 kom",
        },
        {
            id: "e155d57df8f94c5e8e79d797a5421834",
            code: "176303653",
            name: "Posna zobena kaša šumsko voće",
        },
        {
            id: "a24e094240f84778b1f33fde85eeb5cd",
            code: "170006421",
            name: "Čokoladni muesli ",
        },
        {
            id: "6f1f011115d64874982c893c07c91bc7",
            code: "170006414",
            name: "Cheesecake",
        },
        {
            id: "924f107cd60240bcbf17c947e4728676",
            code: "170006404",
            name: "Super kaša Plus s tamnom čokoladom",
        },
        {
            id: "636af2612b274b93b720b8ace827c75a",
            code: "170006403",
            name: "Super kaša Plus s brusnicom",
        },
        {
            id: "237d54dcd8ef453d8a0ed6fadc7649a3",
            code: "170006402",
            name: "Choco lava muffins",
        },
        {
            id: "84951bef74ea40bb8e1c36471723a9a1",
            code: "170000603",
            name: "Brašno glatko T-550 1kg",
        },
        {
            id: "1e355d7793e043a69408ae366a5e5648",
            code: "170000602",
            name: "Brašno oštro T-400 1kg",
        },
        {
            id: "ad63cbdb540546469e5d13b4e0b901f5",
            code: "170000601",
            name: "Šećer kristal Viro 1kg",
        },
        {
            id: "9f1c0df9322d4e51a9a1dac9153522c2",
            code: "170000608",
            name: "Čipkasti podmetač za kolače, 20x40 cm, 15 kom",
        },
        {
            id: "6d42837ea4cc44e487027952f21c414b",
            code: "170006400",
            name: "Gluten free muffins",
        },
        {
            id: "76746cf95d4144bab4bf8af32fc1ac0e",
            code: "170006303",
            name: "Special Puding za cheesecake",
        },
        {
            id: "1673f8560cb94530b7b73d03d39dba0a",
            code: "170000607",
            name: "Čipkasti podmetač za tortu, okrugli 35cm, 15 kom",
        },
        {
            id: "49f6d5733b7a4a418f5c6b757e5dd113",
            code: "170006229",
            name: "Gluten Free Palačinke",
        },
        {
            id: "c3bb2c0e88854a3ea27694a2e0a501cd",
            code: "170006190",
            name: "Super kaša brusnica",
        },
        {
            id: "208a26a809d34ff0a2749a564e744da5",
            code: "170006183",
            name: "Super kaša jabuka cimet",
        },
        {
            id: "b8715b3d0b7f48b8ab685c7d07298dc4",
            code: "170006173",
            name: "Super kaša multipack s  vanilijom 4x50g",
        },
        {
            id: "f5460325c13642769233e3acb10958db",
            code: "170006913",
            name: "Super kaša multipack s čokladom 4x61g",
        },
        {
            id: "6043879c47af4c27802e8acefe7f53ee",
            code: "170006064",
            name: "Special Puding za mađaricu ",
        },
        {
            id: "afe54b5d1610416dadee41a9cb416855",
            code: "170000552",
            name: "Čaša to go za žitarice i jogurt",
        },
        {
            id: "1c098d8a59914f3793cbcc629c4bfc29",
            code: "170000553",
            name: "Podizač torte/ Šablona za ukrašavanje",
        },
        {
            id: "46dc5d3534424a45bb25368af518465b",
            code: "170006063",
            name: "Special Puding za jaffa kolač ",
        },
        {
            id: "2719aa8d704e4cddbefa2d9d4d59e083",
            code: "170006062",
            name: "Special Puding za kokos kocke",
        },
        {
            id: "7689d1cdbba0428d8f7552c3747d6dea",
            code: "170006061",
            name: "Special Puding za kremšnite",
        },
        {
            id: "876e6781a26a4686b19d9ea5b7ae1156",
            code: "170006059",
            name: "Gluten Free Puding čokolada",
        },
        {
            id: "43a70f752e17439b9a9051c7c1af35ac",
            code: "170006058",
            name: "Gluten Free Puding vanilija",
        },
        {
            id: "747d865556e54e32b7e7dcaf27ce2f77",
            code: "170006051",
            name: "Super kaša s malinom i chia sjemenkama",
        },
        {
            id: "fc8d2dcebc0240d8aa84feda21e513e4",
            code: "170005956",
            name: "Super kaša s vanilijom i chia sjemenkama",
        },
        {
            id: "8fd592571f6c4942a23494140c2fe301",
            code: "170005955",
            name: "Super kaša s čokoladom i chia sjemenkama",
        },
        {
            id: "3d0de71eed6e4e8d9c4c1a588d124ad0",
            code: "170005954",
            name: "Zelena boja za kolače",
        },
        {
            id: "fc3172ff12164507818105d0646ed73a",
            code: "170005952",
            name: "Crvena boja za kolače",
        },
        {
            id: "da4c7a15f0354472b4a5b1d3dfa52bca",
            code: "170006902",
            name: "Zelena tekuća jestiva boja",
        },
        {
            id: "92941204237444d7bdb05221135ba8a5",
            code: "170006901",
            name: "Plava tekuća jestiva boja",
        },
        {
            id: "5619937b2be14416a9110860e2a98bcf",
            code: "170005877",
            name: "Brzi Gustin",
        },
        {
            id: "1552f9aff5f140c9a0f29286ed98ce40",
            code: "170005876",
            name: "Goveđa želatina mljevena",
        },
        {
            id: "e3e8253652c348ceade3eb37ffc056ca",
            code: "170005827",
            name: "XXL Vanilin šećer 40g",
        },
        {
            id: "296aba33c3604052823c8be0d184b9af",
            code: "170005822",
            name: "Hrskavi jastučići čokolada",
        },
        {
            id: "cd1e7c4f7e204e548bb8f65497387f95",
            code: "170005821",
            name: "Hrskavi jastučići vanilija",
        },
        {
            id: "942a4d8d42164a5a9c760f2e7bb6e7de",
            code: "170005556",
            name: "Mirror glaze šećerna glazura",
        },
        {
            id: "d5581b61150f45d9ad416cfd76dad62e",
            code: "170005532",
            name: "Soda Bikarbona 50 g",
        },
        {
            id: "1c73d296320447bfb51cfaab457d2da7",
            code: "170005529",
            name: "Gustin XXL 400 g",
        },
        {
            id: "5563e4eb4edf47b68bd991513d895a73",
            code: "170005528",
            name: "Original Gustin 30 g",
        },
        {
            id: "ce3eb712cc0145f5b0dc49b83c65409c",
            code: "170005525",
            name: "Original Backin 5+1",
        },
        {
            id: "965cfb59d639401eadc3b90540e106b3",
            code: "170005523",
            name: "Dekor zlatne perle soft",
        },
        {
            id: "7199edebae4841be81830310489d288b",
            code: "170005483",
            name: "Ukrasni cvjetići",
        },
        {
            id: "d2a3e2b974bd41008b92d12a8f35211f",
            code: "170005396",
            name: "Mini Muffins",
        },
        {
            id: "40fd21fd439947cb8edbea7cdec423d1",
            code: "170005214",
            name: "Preljev za torte FIX crveni",
        },
        {
            id: "4327f85212074b75b50de0c31e19622c",
            code: "170005213",
            name: "Preljev za torte FIX svijetli",
        },
        {
            id: "41deb0f2d0144238bc9bb1e8257a510f",
            code: "170005169",
            name: "Žuta boja za kolače",
        },
        {
            id: "4b14e6a875ac4dd08a56293ab60438fb",
            code: "170000549",
            name: "Vitalis žlica",
        },
        {
            id: "1525236ec5fe41ff8d77dbb0951bdcab",
            code: "170005168",
            name: "Plava boja za kolače",
        },
        {
            id: "751c2df0885f416d89a697a023258b95",
            code: "170005166",
            name: "Boje za jaja",
        },
        {
            id: "9cfdd28c25324a4ab5effa5f6732359d",
            code: "170005162",
            name: "Dekor Perle Mix",
        },
        {
            id: "8724105180a24f8c9c067398779d0529",
            code: "170005140",
            name: "Pasta od bourbon vanilije",
        },
        {
            id: "64c88eed0586434db7f83cf3f86257a9",
            code: "170005128",
            name: "Kakao mrvice ",
        },
        {
            id: "674ffab21df24810954ed396b98f8ebd",
            code: "170005127",
            name: "Šarene mrvice",
        },
        {
            id: "75b94bd99c4f4ab4a9a5961becc2b45a",
            code: "170005100",
            name: "Desertni preljev Toffee (karamel)",
        },
        {
            id: "e635101501c5408598b91117cea88520",
            code: "170005098",
            name: "Desertni preljev Čokolada",
        },
        {
            id: "c18aec89f39648aab4a59a73a641e737",
            code: "170005011",
            name: "Dekor roza kristalići",
        },
        {
            id: "b15a0e1e09154d7891926b18463e70d2",
            code: "170004974",
            name: "Domaći Prhki keksi",
        },
        {
            id: "565b4481e299458d9981003803c7bd05",
            code: "170004878",
            name: "Preljev za torte jagoda",
        },
        {
            id: "b9ab8c3ad5d242819ca7c7abd1d27ef4",
            code: "170004815",
            name: "Domaće Vanilin Kiflice",
        },
        {
            id: "c74b1b26007f4ea5b872759010659670",
            code: "170004758",
            name: "Kaiserschmarrn - Carski drobljenac",
        },
        {
            id: "f8b7dcc2b19541e593bf3febcd42b26e",
            code: "170004575",
            name: "Bourbon vanilin šećer x3",
        },
        {
            id: "13c68c0344a54f3da9241c4ebb58e3c2",
            code: "170004549",
            name: "Puding komadići čokolade",
        },
        {
            id: "7519946f946f4d37b63f26acf532dfae",
            code: "170004194",
            name: "Puding čokolada 3+1",
        },
        {
            id: "824f3b025a544e3990849c6de01cca6f",
            code: "170004076",
            name: "Vinobran",
        },
        {
            id: "9aaa29ad479b4809aacd86ca36283c51",
            code: "170003782",
            name: "Garant za dizano tijesto",
        },
        {
            id: "bdad7921d60f4f3ab79cbe58bef7568a",
            code: "170003781",
            name: "Čokoladni Muffins",
        },
        {
            id: "839c9c3a7e9647d7924835671bd30851",
            code: "170003780",
            name: "Muffins",
        },
        {
            id: "6d1b1c5bf5944960bae74add57b2346f",
            code: "170003779",
            name: "Brownies",
        },
        {
            id: "e59faeea76324bab80bb773716ab0fa0",
            code: "170006795",
            name: "Instant Želatina Fix",
        },
        {
            id: "01a4d890723540ce8c384dac8010cd0a",
            code: "170003589",
            name: "Panna Cotta",
        },
        {
            id: "0c88bd814a3248098dd4aea9eecaebdd",
            code: "170003470",
            name: "Ciobar - vruća čokolada",
        },
        {
            id: "896b2ec40afa4f6d9d7f74a5487244df",
            code: "170003469",
            name: "Ciobar - bijela čokolada x5",
        },
        {
            id: "3a9d62b58f54450fbd3c6e9a336f672e",
            code: "170003468",
            name: "Ciobar - vruća čokolada x5",
        },
        {
            id: "d06732846b8940009b60be18cfa42cef",
            code: "170003436",
            name: "Gustin 200g ",
        },
        {
            id: "6ca6bbcff8244bc9b664f70f39d05501",
            code: "170003412",
            name: "Palačinke 215g",
        },
        {
            id: "918c696460324e28b4bb66cb43a4f9fb",
            code: "170002561",
            name: "Riža na mlijeku vanilija",
        },
        {
            id: "483b86156b154876852630d72ab9c050",
            code: "170002560",
            name: "Riža na mlijeku klasik",
        },
        {
            id: "f1af98bf890a451490544135f7865bbd",
            code: "170002444",
            name: "Kvasac 4+1",
        },
        {
            id: "62e73a70520a4cc298f22c4cc9f21ed7",
            code: "170002305",
            name: "Instant kvasac 450 g ",
        },
        {
            id: "3830a73aa5db4184977aa6d06d8a739b",
            code: "170002304",
            name: "Instant kvasac 100 g",
        },
        {
            id: "eee84b97603f4dbcb1fef0afa6fb701d",
            code: "170002122",
            name: "Kremfix x3",
        },
        {
            id: "ee8652f35a704c99ab920c6387c63b9d",
            code: "170002065",
            name: "Puding slatko vrhnje x3",
        },
        {
            id: "277886f2127345c9a4cf89e31da80e0d",
            code: "170002064",
            name: "Puding jagoda x3",
        },
        {
            id: "3ca188606f834afdb626f3b3e683119b",
            code: "170002063",
            name: "Puding malina x3",
        },
        {
            id: "c0856a505cd848fb95e8ad35f51079da",
            code: "170001860",
            name: "Voćni muesli ",
        },
        {
            id: "4be092aa5e134d52915065447b824283",
            code: "170001741",
            name: "Želatina u listićima, svijetla",
        },
        {
            id: "d757636eff3c455ca6afab4e0d071d97",
            code: "170001656",
            name: "Preljev, crveni x3",
        },
        {
            id: "0e33703f5295474fb8a7caed78c1caff",
            code: "170001655",
            name: "Preljev, svijetli x3",
        },
        {
            id: "09825f4c7ee9478abb91368d8b7acba0",
            code: "170006855",
            name: "Finesse Bourbon vanilija aroma",
        },
        {
            id: "82fbd85ac0b3495db0ef51d450350f50",
            code: "170001410",
            name: "7 žitarica voćni muesli",
        },
        {
            id: "1de4b90b3f6f46f2b99197bb0295bc73",
            code: "170001409",
            name: "7 žitarica integralni muesli",
        },
        {
            id: "f6114425e0274781bb3b80e08d77803f",
            code: "170001408",
            name: " 7 žitarica orašasto i šumsko voće muesli",
        },
        {
            id: "5f111be519b64c83bca8293bd217aae0",
            code: "170001324",
            name: "Konzervans",
        },
        {
            id: "08e74a2dc8174527b10b897e3d436c29",
            code: "170000606",
            name: "Vrhnje za šlag 33% m.m. Dukat 0,5kg",
        },
        {
            id: "cfc6038a23484e7eb38fdbb71a7d9feb",
            code: "170000605",
            name: "Biljno vrhnje za šlag Halta",
        },
        {
            id: "63bbbdc93db244e3ae1bcc6f4897bac0",
            code: "170001246",
            name: "Galetta čokolada",
        },
        {
            id: "a163af9fad0949a7a4b726805bcd483e",
            code: "170001245",
            name: "Galetta vanilija",
        },
        {
            id: "ed847ac5cd0a45be8acb1f979807bd86",
            code: "170001238",
            name: "Puding slatko vrhnje",
        },
        {
            id: "7e4ccea6887f4f1ab8b222eba2b7ca52",
            code: "170001235",
            name: "Puding čokolada",
        },
        {
            id: "e016e02d45324ee298164062f98cfeb3",
            code: "170001233",
            name: "Limunska kiselina",
        },
        {
            id: "79e74cc94b7c4305bdda54fc304271ca",
            code: "170001232",
            name: "Soda bikarbona",
        },
        {
            id: "22d4caec033f4b60b2216812b6ef54d7",
            code: "170001226",
            name: "Krema za torte čokolada",
        },
        {
            id: "e4134312c2424c9c93fe7435281975be",
            code: "170001225",
            name: "Krema za torte vanilija",
        },
        {
            id: "18dee41bfd664c77b994cff325f4fb72",
            code: "170001190",
            name: "Prašak za pecivo",
        },
        {
            id: "916feb9314de4bdda87a678ac0098cff",
            code: "170001158",
            name: "Pikant Fix kiseli",
        },
        {
            id: "7790c2872510438e8cd9bf2532ffac1e",
            code: "170000532",
            name: 'Punjena kutija "Frendice"',
        },
        {
            id: "ed4bc3ed275742c8bba9fa83164db557",
            code: "170000531",
            name: 'Punjena kutija "Najbolji dodaci za kolače"',
        },
        {
            id: "855b683ea88d423f8900a6f4cbf26235",
            code: "170000530",
            name: 'Set "Mala torta za velike trenutke"',
        },
        {
            id: "655d218b753a44b5abbebee0f608a781",
            code: "170000529",
            name: 'Set "Slatki zeko"',
        },
        {
            id: "4ba2285da28f44e19d9a97e491210a50",
            code: "170000528",
            name: 'Set "Kolač s jagodama"',
        },
        {
            id: "4817d51b8b7d49449b4d36ee830c4982",
            code: "170000527",
            name: "Retro okrugli kalup Ø20 cm",
        },
        {
            id: "ae7024d5c11143cf817ee2af8d3d3841",
            code: "170000526",
            name: "Zeko kalup na zatvaranje, zlatni",
        },
        {
            id: "9adc47fadc3d4ab28cb6fc5ce273a559",
            code: "170000524",
            name: "Nož za rezanje i serviranje kolača, plastični, 30 cm",
        },
        {
            id: "9a9a51d73a0f472cbbca5afeb0249593",
            code: "170000523",
            name: "Nož za mazanje s pregibom, 35 cm",
        },
        {
            id: "c8e4d39c73a2477cb138733a02b233a5",
            code: "170000522",
            name: "Set za ukrašavanje, 6 nastavaka",
        },
        {
            id: "07d2830362174721ae97e58f722a2717",
            code: "170000521",
            name: "Razdjelnik za torte na 14 / 18 komada",
        },
        {
            id: "57d370e3d0824db286105c89ebcccdfa",
            code: "170000520",
            name: "Mini kvačice za vrećice, 20 kom",
        },
        {
            id: "896849b380dc4032aa1585df6589f9e2",
            code: "170000519",
            name: "Visoki obruč za torte Ø16-30cm, 15 cm",
        },
        {
            id: "1289ddba9f2c46b7ba6558a058ca643f",
            code: "170000518",
            name: "Rešetka za hlađenje tijesta kromirana, Ø32cm",
        },
        {
            id: "281346cd49b04c24a164a20c9da0150b",
            code: "170000517",
            name: "Silikonska četkica crvena, 37 cm",
        },
        {
            id: "6cf8114dc9724144bafae7371c4623f3",
            code: "170000516",
            name: "Silikonska špatulica crvena, 26,5 cm",
        },
        {
            id: "b768b6edb68e4283839af0262aef1e72",
            code: "170000515",
            name: "Kalup za 12 muffina - 26,5x38,5x2 cm",
        },
        {
            id: "3b5d153a6da14e33afa871b8a5e0c541",
            code: "170000514",
            name: "Kalup za voćni biskvit - Ø28 cm, crveno-sivi",
        },
        {
            id: "25056180df944d9a887cdaf5f4ac96f0",
            code: "170000513",
            name: "Kalup za kruh - 25x11,5x7 cm, crveno-sivi",
        },
        {
            id: "9acc7c96ae8a4afc935cf87b227001d7",
            code: "170000512",
            name: "Okrugli kalup s umetkom za kuglof Ø26cm, crveno-sivi",
        },
        {
            id: "8cf0a275a4184403a190990ca160332a",
            code: "170000511",
            name: "Okrugli kalup visokog ruba Ø26cm, crveno-sivi",
        },
        {
            id: "4a64191520cd4bbe8da5fc36c945ab8c",
            code: "170000510",
            name: "Pravokutni kalup za tortu visokog ruba - 38x25x7 cm, crveno-sivi",
        },
        {
            id: "dba8f7dbfc7f4384bcb6b655f558e7d4",
            code: "170000509",
            name: 'Pamučna torba "Say Cheese Cake"  ',
        },
        {
            id: "4c6f36c631e54dd1918cd3b51b7000ea",
            code: "170000508",
            name: 'Vintage doza "Kvaliteta je najbolji recept"',
        },
        {
            id: "498a473852164380b5228f3cd7a20e4d",
            code: "170000507",
            name: 'Vintage doza "Prijateljice"',
        },
        {
            id: "f168c328dbc64eaab2a9703190aa637a",
            code: "170000506",
            name: 'Limena doza "Kolač uz kavicu"',
        },
        {
            id: "92824d7c3b5941a2bb521995d91b36a3",
            code: "170000505",
            name: 'Limena doza "Dodaci za kolače"',
        },
        {
            id: "735080b29a0643939d6570ef1c724ff3",
            code: "170000504",
            name: "Knjiga recepata Čokoladni kolači",
        },
        {
            id: "942529b8052c480fbdbb3812f045390a",
            code: "170000502",
            name: "Knjiga recepata Tajna je u imenu 2",
        },
        {
            id: "a968b83435404b899b6bd053ecbb417d",
            code: "170000501",
            name: "Knjiga recepata Tajna je u imenu",
        },
        {
            id: "c1c80ffdc6b14580b3ce4af00e9cd00c",
            code: "170000237",
            name: "Košarice za muffine",
        },
        {
            id: "22a64d37023c48468e5bb4ec8ae7531e",
            code: "130011529",
            name: "Fondant Dekor bijeli 1kg",
        },
        {
            id: "bf6665bcd5ca474787c3442589b0852a",
            code: "130011527",
            name: "Fondant Dekor u boji 500g",
        },
        {
            id: "9a53ddb2ad5b4a76bd1b3af13c15eb73",
            code: "101965300",
            name: "Cheesecake American Style čokolada ",
        },
        {
            id: "cab536b45ac54ff3a8302b616a7ccfb3",
            code: "101965100",
            name: "Cheesecake American Style jagoda",
        },
        {
            id: "a10ad38842e048288b49337b7d125d20",
            code: "101885000",
            name: "Kolač krtičnjak",
        },
        {
            id: "560692fdc4914b1996b93ce439ec7a4e",
            code: "101854100",
            name: "Kolač s višnjama",
        },
        {
            id: "950010617d1f43e99412dfdee2916717",
            code: "101800900",
            name: "Dunavski valovi",
        },
        {
            id: "c59cefd069274e9f8e0a0a0c34d5a594",
            code: "101731200",
            name: "Stevia Želirni šećer",
        },
        {
            id: "754c6a8ee2514f69840c4291de155384",
            code: "101730100",
            name: "Extra Želirni šećer 2:1",
        },
        {
            id: "779b7fb53b57452ea4b5f71bd94a6d4a",
            code: "101721100",
            name: "Vege sredstvo za želiranje",
        },
        {
            id: "b3ac1b5a2ede41f68fdfc4ea1d4c970b",
            code: "101687600",
            name: "Vitalis SuperMuesli bez dodanog šećera",
        },
        {
            id: "32783a3493d04303b336417c42cc30b7",
            code: "101687000",
            name: "Vitalis SuperMuesli 30% protein",
        },
        {
            id: "2da3dbe9b40447e2999c9dc9b161325c",
            code: "101658600",
            name: "Vitalis schoko keks",
        },
        {
            id: "d800250a574d436f9f95fb6f0bac2c38",
            code: "101655600",
            name: "Vitalis roasted brusnica",
        },
        {
            id: "7c27cf1ed02e4f6892fb824f675b5939",
            code: "101655500",
            name: "Vitalis roasted čoko-lješnjak ",
        },
        {
            id: "d387c9eb8a0d4758905279fde293571c",
            code: "101602200",
            name: "Vanilija umak bez kuhanja",
        },
        {
            id: "49f26a5e88ed43b1b9ac4665e802c9cf",
            code: "170000556",
            name: "Posudica za spremanje muffina Candy",
        },
        {
            id: "e03767fd4ded4b5ea3d97b40e4a9150f",
            code: "101566200",
            name: "Lješnjak krokant",
        },
        {
            id: "8f60c7e48d714eaba1fcc1aac4a6d8b0",
            code: "101565200",
            name: "Badem listići",
        },
        {
            id: "2f01be5340bc439588c2c81b781644dc",
            code: "101565000",
            name: "Mljeveni bademi",
        },
        {
            id: "400d120402d84f92b2c83edb4b19ce1f",
            code: "101535500",
            name: "Čokoladna srca",
        },
        {
            id: "f4c0917260094f228b7dd576b416fca8",
            code: "101535200",
            name: "Čokoladne kapi",
        },
        {
            id: "c3389d04fd0941d7b2266fccb55571a3",
            code: "101535000",
            name: "Ribana tamna čokolada",
        },
        {
            id: "629e484ebe8740158b5a018a039f9c5b",
            code: "101531300",
            name: "Čokoladno pismo",
        },
        {
            id: "09f198489a10427dab6719a58f58b7a3",
            code: "101526800",
            name: "Fondant Deka bijela",
        },
        {
            id: "7caf9dc44c9a47d5879d9deda8a89307",
            code: "101526600",
            name: "Fondant dekor bijeli 100g",
        },
        {
            id: "b761a4a4f70545f0b2868a2d4a5e6c40",
            code: "101526000",
            name: "Svjećice Happy Birthday",
        },
        {
            id: "1971fe251d7e49ddb45d9b3715aeca2e",
            code: "101520200",
            name: "Aroma naranče",
        },
        {
            id: "cb9f8b0b5a50431aa1777e669c6499c5",
            code: "101520100",
            name: "Aroma limuna",
        },
        {
            id: "a8592467c2a649859ac5d9f1e9625e24",
            code: "101476100",
            name: "Mousse desert vanilija",
        },
        {
            id: "7ee8d287f4424cb08990cc52cb2be069",
            code: "101475500",
            name: "Mousse desert tamna čokolada",
        },
        {
            id: "6315cdeb86344d7a83f7f1a67ac0cff7",
            code: "101472400",
            name: "Mousse desert bijela čokolada",
        },
        {
            id: "84c540e36cb040c99ef2055b149b706f",
            code: "101143500",
            name: "Finesse naribana korica limuna",
        },
        {
            id: "5a497a75d98c4bbc8411b79616b5f6d8",
            code: "101122600",
            name: '"Natürlich" Bourbon vanilin šećer',
        },
        {
            id: "1e3ab3a531e84088985536b26ade0d4f",
            code: "101121400",
            name: '"Natürlich" komadići kakaa za kolače',
        },
        {
            id: "65866e42b3c24e1fac75ee552f33e8ef",
            code: "101121300",
            name: '"Natürlich" prirodni ekstrakt limuna',
        },
        {
            id: "3aba5e95cffc47b79f563b55ca6aaff4",
            code: "101121200",
            name: '"Natürlich" prirodni ekstrakt naranče',
        },
        {
            id: "a0fe4f12e2c84e849afb1185a4f5ed5e",
            code: "SW10211",
            name: "Široki ljevak za staklenke",
        },
        {
            id: "490d75939c804ce9850d3145c98c9eca",
            code: "SW10210",
            name: "Hvataljka za vruće staklenke",
        },
        {
            id: "aae922dd2f99452d86702164d5941b92",
            code: "SW10209",
            name: "Samoljepljive etikete za staklenke, 16 kom",
        },
        {
            id: "b3796288985e47e8b29bf3598a5b71b0",
            code: "SW10208",
            name: "Zlatni flomaster za staklenke",
        },
        {
            id: "fa74af0c16d742209ecaecf130382b4b",
            code: "SW10207",
            name: "Retro rukavica za hvatanje",
        },
        {
            id: "4620597635844e7c918d299456e2c44a",
            code: "170000585",
            name: "Bestseller Super kaša 4+1 gratis",
        },
        {
            id: "70d83aa2bfdd4f32a4308bb58643ce2b",
            code: "170000583",
            name: "Set Cupcake Party",
        },
        {
            id: "106ed26891fd482aa206866e4d8230b5",
            code: "170000582",
            name: "Set Muffin Friends",
        },
        {
            id: "b0c1f0c9aa574ca09d47f662f240eaf3",
            code: "170000586",
            name: "Vitalis Crunchy Honeys 3+1 gratis",
        },
        {
            id: "943638322bd945ed805d75819edf4abd",
            code: "170000548",
            name: "Set Voćni kolači",
        },
    ];
})();
