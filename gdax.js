// Reference: https://docs.gdax.com/

var Gdax = require('gdax');

var callback = function(err, response, data) {
  console.log(data);
};

/** Public Functions **/

var publicClient = new Gdax.PublicClient();

//publicClient.getProducts(callback);

//publicClient.getProductOrderBook(callback); //[ price, size, num-orders ]

//publicClient.getProductTicker(callback);

//publicClient.getProductTrades(callback);

//publicClient.getProductHistoricRates(callback); //[ time, low, high, open, close, volume ]

//publicClient.getProduct24HrStats(callback);

//publicClient.getCurrencies(callback);

//publicClient.getTime(callback);


/** Private Functions **/

/*
var apiURI = 'https://api.gdax.com';
var sandboxURI = 'https://api-public.sandbox.gdax.com';

var key = '';
var b64secret = '';
var passphrase = '';

var authedClient = new Gdax.AuthenticatedClient(
  key, b64secret, passphrase, apiURI);
  
//authedClient.getAccounts(callback);

var usd_account_id = '';
var btc_account_id = '';
var eth_account_id = '';
var ltc_account_id = '';
*/

//authedClient.getAccount(usd_account_id, callback);

//authedClient.getAccountHistory(btc_account_id, callback);

//authedClient.getAccountHolds(usd_account_id, callback);

//authedClient.getFills(callback);


/** Websocket Client **/

var websocket = new Gdax.WebsocketClient(['BTC-USD']); // ['BTC-USD', 'ETH-USD']

var num_periods = 5;
var pct_std_dev = 0.0085; // percent of std dev
var bank = 10;
var coins = 0;
var last_buy_price = 0;
var last_prices = [];

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

websocket.on('message', function(data) { 
	//if (data['type'] == 'match') {
		//console.log(data); 
		
		var price = Number(data['price']);
		console.log("Price: " + price);
		last_prices.push(price); //add newest price to end of array
		if (last_prices.length > num_periods) {
			last_prices.shift(); // remove oldest price from beginning of array
		}
		//console.log(last_prices);
		
		var avg = average(last_prices);
		var std_dev = standardDeviation(last_prices);
		var limit_high = avg + pct_std_dev * std_dev;
		var limit_low = avg - pct_std_dev * std_dev;
		//console.log("Average: " + avg);
		//console.log("Price - Average: " + (price - avg) );
		//console.log("std_dev: " + std_dev);
		//console.log("limit_high: " + limit_high);
		//console.log("limit_low: " + limit_low);
		
		if (coins > 0 && price > limit_high) {
			console.log("--SELL " + coins + " @ " + price);
			bank += price * coins;
			coins = 0;
			var profit = price - last_buy_price;
			console.log("=====PROFIT: $" + profit);
		} else if ( (bank / price) > 0 && price < limit_low) {
			
			var afford = (bank / price);
			bank -= price * afford;
			coins += afford;
			last_buy_price = price;
			console.log("BUY " + afford + " @ " + price);
		}
		
		console.log("Coins: " + coins);
		console.log("Bank: " + bank);
		console.log("-----\n");
	//}
});