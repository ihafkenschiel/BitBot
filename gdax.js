// Reference: https://docs.gdax.com/

console.log("Loading...\n");

var Gdax = require('gdax');

var callback = function(err, response, data) {
  console.log(data);
};

/** Public Functions **/

var publicClient = new Gdax.PublicClient();

//publicClient.getProducts(callback);

//publicClient.getProductOrderBook(callback); //[ price, size, num-orders ]

//var tickerCallback = function(err, response, data) {
//  console.log("\nCurrent Ticker:");
//  console.log(data);
//};
//publicClient.getProductTicker(tickerCallback);

//publicClient.getProductTrades(callback);

//publicClient.getProductHistoricRates(callback); //[ time, low, high, open, close, volume ]

//publicClient.getProduct24HrStats(callback);

//publicClient.getCurrencies(callback);

//publicClient.getTime(callback);


/** Private Functions **/

var apiURI = 'https://api.gdax.com';
var sandboxURI = 'https://api-public.sandbox.gdax.com';

var key = '';
var b64secret = '';
var passphrase = '';

var authedClient = new Gdax.AuthenticatedClient(
  key, b64secret, passphrase, apiURI);

var accountsCallback = function(err, response, data) {
  console.log("\nPrivate Accounts:");
  console.log(data);
};
authedClient.getAccounts(accountsCallback);

var usd_account_id = '';
var btc_account_id = '';
var eth_account_id = '';
var ltc_account_id = '';


function getBalanceLTC() {
	authedClient.getAccount(ltc_account_id, callback);
}

function buyCoins(type, price, size) {
	var buyParams = {
	  'price': price, // USD
	  'size': size,  // BTC
	  'product_id': type, //'BTC-USD',
	};
	authedClient.buy(buyParams, callback);
}

function sellCoins(type, price, size) {
	var sellParams = {
	  'price': price, // USD
	  'size': size,  // BTC
	  'product_id': type, //'BTC-USD',
	};
	authedClient.sell(sellParams, callback);
}


function getUSD_account() {
	authedClient.getAccount(usd_account_id, callback);
}

//getUSD_account();

//authedClient.getAccountHistory(btc_account_id, callback);

//authedClient.getAccountHolds(usd_account_id, callback);

//authedClient.getFills(callback);

//console.log("First purchase: ");
//buyCoins('LTC-USD', '25.00', '0.01');

runTrades();


/** Websocket Client **/

function runTrades() {

	var websocket = new Gdax.WebsocketClient(['LTC-USD']); // ['BTC-USD', 'ETH-USD', 'LTC-USD']

	var num_periods = 5;
	var pct_std_dev = 0.9; // percent of std dev

	var cur_period = 0;
	var last_buy_price = 0;
	var last_prices = [];

	websocket.on('message', function(data) { 
		if (data['type'] == 'match' || data['type'] == 'open') { //
			cur_period++;
		
			//console.log(data); 
		
			var price = Number(data['price']);
			console.log("Price: " + price);
		
			last_prices.push(price); //add newest price to end of array
			if (last_prices.length > num_periods) {
				last_prices.shift(); // remove oldest price from beginning of array
			}
			//console.log(last_prices);
		
			if (cur_period >= num_periods) {
				num_period = 0;
		
				var avg = average(last_prices);
				var std_dev = standardDeviation(last_prices);
				var limit_high = avg + pct_std_dev * std_dev;
				var limit_low = avg - pct_std_dev * std_dev;
				console.log("Average: " + avg);
				//console.log("Price - Average: " + (price - avg) );
				console.log("std_dev: " + std_dev);
				console.log("limit_high: " + limit_high);
				console.log("limit_low: " + limit_low);
		
				console.log("--SELL @ " + round2decimals(limit_high) + " for price " + price);
				//bank += price * coins;
				//coins = 0;
			
				//authedClient.cancelAllOrders({product_id: 'LTC-USD'}, callback);
				//sellCoins('LTC-USD', round2decimals(limit_high), 0.1);
			
				//var profit = price - last_buy_price;
				//console.log("=====PROFIT: $" + profit);
		
				//var afford = (bank / price);
				//bank -= price * afford;
				//coins += afford;
			
				//authedClient.cancelAllOrders({product_id: 'LTC-USD'}, callback);
				//buyCoins('LTC-USD', round2decimals(limit_low), 0.1);
			
				//last_buy_price = price;
				console.log("BUY @ " + round2decimals(limit_low) + " for price " + price);
				
			}		

			console.log("-----\n");
		}
	});
}

function standardDeviation(values){
  var avg = average(values);

  var squareDiffs = values.map(function(value){
	var diff = value - avg;
	var sqrDiff = diff * diff;
	return sqrDiff;
  });

  var avgSquareDiff = average(squareDiffs);

  var stdDev = Math.sqrt(avgSquareDiff);
  return stdDev;
}

function average(data){
  var sum = data.reduce(function(sum, value){
	return sum + value;
  }, 0);

  var avg = sum / data.length;
  return avg;
}

function round2decimals(numb) {
	return parseFloat(Math.round(numb * 100) / 100).toFixed(2);
}