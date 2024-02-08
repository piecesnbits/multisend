const ethers = require("ethers");
const fs = require("fs");
const { color, log, red, grey, green, yellow, blue, cyan, cyanBright, underline } = require("console-log-colors");
const header = fs.readFileSync("./lib/ascii_header.txt").toString();
require("dotenv").config();

const rpc = ["https://artio.rpc.berachain.com", "https://rpc.ankr.com/berachain_testnet"];
// Connect to berachain network
const provider = new ethers.providers.JsonRpcProvider(rpc[1]);
const wallet = new ethers.Wallet(process.env.PRIV_KEY, provider);
const MultiSend_ABI = fs.readFileSync("./lib/MultiSend.abi").toString();

class MultiSend {
  constructor(cfg) {
    this.contract_address = cfg.contract_address;
    this.payment_amount = cfg.payment_amount;
    this.recipient_list = cfg.recipient_list;
    this.batch_size = cfg.batch_size;
    this.MultiSend_Contract = new ethers.Contract(cfg.contract_address, MultiSend_ABI, wallet);
    this.gasPriceWei = 0;
    this.contract_balance = 0;
    this.log_file = fs.createWriteStream(`log_${new Date().getTime()}.txt`, { flags: "a" });
    this.is_initialized = false;
    this.abort = false;
  }
  async init() {
    console.log(header);
    console.log(`MultiSend Contract:\t ${this.contract_address}`);
    this.contract_balance = await provider.getBalance(this.contract_address);
    console.log(`Balance of contract:\t ${ethers.utils.formatEther(this.contract_balance)} BERA`);
    console.log(`Payment amount:\t\t ${this.payment_amount} BERA`);
    console.log(`Number recipients:\t ${this.recipient_list.length}`);
    console.log(`Batch size:\t\t ${this.batch_size}`);
    console.log(`Logfile:\t\t ${this.log_file.path}`);
    const total_amount = ethers.utils.parseEther((this.recipient_list.length * this.payment_amount).toString());
    this.gasPriceWei = await wallet.provider.getGasPrice();
    console.log(`Gasprice:\t\t ${ethers.utils.formatUnits(this.gasPriceWei, "ether")} BERA`);
    console.log("-----------------------------------------------------------------------");
    // Check if the sender's account has enough balance to cover the total amount
    if (this.contract_balance.lt(total_amount)) {
      console.log(red(`Insufficient contract balance. Required: ${ethers.utils.formatEther(total_amount)} BERA`));
      this.abort = true;
      return;
    }
    console.log(grey(`Starting transfers in 5 seconds. Press Ctrl+c to abort...`));
    await new Promise((resolve) => {
      setTimeout(resolve, 5000);
    });
    this.is_initialized = true;
  }
  async pay() {
    if (!this.is_initialized) {
      await this.init();
    }
    if (this.abort) {
      return;
    }

    //devide the recipient list into chunks/batches
    const chunks = [];
    for (let i = 0; i < this.recipient_list.length; i += this.batch_size) {
      const chunk = this.recipient_list.slice(i, i + this.batch_size);
      chunks.push(chunk);
    }
    for (let i = 0; i < chunks.length; i++) {
      console.log(yellow(`Batch[${i + 1}/${chunks.length}]`));
      this.log_file.write(`Batch[${i + 1}/${chunks.length}] `);
      await this.batchpay(chunks[i]);
    }
  }
  async batchpay(batch_addresses) {
    try {
      await this.updateGasPrice();
      const tx = await this.MultiSend_Contract.pay(batch_addresses, ethers.utils.parseEther(String(this.payment_amount)), {
        value: 0,
        gasPrice: this.gasPriceWei,
        gasLimit: 50000 * batch_addresses.length,
      });
      console.log(yellow(`Payment for ${batch_addresses.length} addresses sent waiting for confirmation...`));
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        console.log(green(`Success`), grey(`${receipt.transactionHash}`));
        this.log_file.write(`[SUCCES] [${receipt.transactionHash}]` + "\n");
      } else {
        console.log(red("Payment failed. Transaction reverted."));
        this.log_file.write(`[FAILED]` + "\n");
      }
      this.log_file.write(JSON.stringify(batch_addresses) + "\n\n");
    } catch (error) {
      console.log(red("unexpected error"));
      this.log_file.write("[unexpected error]", JSON.stringify(batch_addresses) + "\n\n");
    }
  }
  async updateGasPrice() {
    this.gasPriceWei = await wallet.provider.getGasPrice();
    const minimum_gas_price = ethers.utils.parseEther("0.0000000015");
    if (this.gasPriceWei.lt(minimum_gas_price)) {
      // console.log("minimum gasprice is more than current");
      this.gasPriceWei = minimum_gas_price;
    }
  }
}

module.exports = MultiSend;
