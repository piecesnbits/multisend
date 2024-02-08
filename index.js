const MultiSend = require("./MultiSend.js");

let list = require("./addresses.json");
// let testbatch = [];
// for (let i = 0; i < 20; i++) {
//   testbatch.push(...list);
// }

const cfg = {
  contract_address: "0xE23f8A1750fe70A926F3B997dea99cCB6C0dbB58", //multisend contract address
  payment_amount: 0.001, //payment amount in BERA
  recipient_list: list, //testbatch, //json list of all recipient addresses
  batch_size: 1, //number of addresses that gets paid in a single transaction
};

let ms = new MultiSend(cfg);
ms.pay();
