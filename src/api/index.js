import { version } from '../../package.json';
import { Router } from 'express';
import facets from './facets';
import { RippleAPI } from 'ripple-lib';
import price from 'crypto-price';

const r_api = new RippleAPI({
  server: 'wss://s1.ripple.com' // Public ripple server
});

r_api.on('error', (errorCode, errorMessage) => {
  console.log(errorCode + ': ' + errorMessage);
});
r_api.on('connected', () => {
  console.log('connected');
});
r_api.on('disconnected', (code) => {
  // code - [close code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent) sent by the server
  // will be 1000 if this was normal closure
  console.log('disconnected, code:', code);
});

export default ({ config, db }) => {
	let api = Router();

	// mount the facets resource
	api.use('/facets', facets({ config, db }));

	// perhaps expose some API metadata at the root
	api.get('/', (req, res) => {
		res.json({ version });
	});

	api.get('/ripple/generateAddress', (req, res) => {
		// Open connection to API.
		r_api.connect().then(() => {
			console.log('generating new address.');
			return r_api.generateAddress();
		}).then(address => {
			console.log(address);
			res.send(address);
			console.log('generateAddress done');
		}).then(() => {
			console.log('done and disconnected.')
		}).catch(console.error);
	});

	api.get('/ripple/balanceSheet', (req, res) => {
		// TODO: req.body 
		const address = "rEVUgQbHCja4XtA8TBzd2BTaT4kGiRHoc1";

		r_api.connect().then(() => {
			console.log('Getting balance sheet for ' + address);
			return r_api.getBalanceSheet(address);
		}).then(balanceSheet => {
			console.log(balanceSheet);
			res.send({address: address, balanceSheet: balanceSheet});
			console.log('balanceSheet done');
		}).then(() => {
			console.log('done and disconnected.')
		}).catch(console.error);
		
	});

	api.get('/ripple/getPrice', (req, res) => {
		const base = 'USD';
		const crypto = 'XRP';
		price.getBasePrice(base, crypto)
			.then(obj => {
				console.log(obj.price);
			}).catch(err => {
				console.log('error getting price: ' + err);
			})
	});

	return api;
}
