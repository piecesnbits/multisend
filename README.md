
![kkk](https://github.com/piecesnbits/multisend/assets/44613132/292ea5e7-5be2-45ef-9801-5955082f5fa2)

# bera helper payer

Basic script to pay helpers from the berachain ecosystem. This script works in conjunction with a contract (currently) deployed on the berachain artio testnet. Node.js is required to run the script.

## Install the dependencies

After cloning the repo change directory to the root folder and install modules by the following command.

```bash
npm install
```

### Configuration

Add your private key in `.env.example` and rename the file to `.env`. Configure the recipient list, payment_amount and batch_size in index.js.

### Transfer payments

```bash
node index.js
```
