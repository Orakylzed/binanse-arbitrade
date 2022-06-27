const requestURL = 'https://api1.binance.com/api/v3/ticker/24hr';
const rootElement = document.querySelector('#root');
const refreshBtn = document.querySelector('#refresh');
const btcPriceElem = document.querySelector('.btc-price-head');
const statusElem = document.querySelector('.status');
const allPairsElem = document.querySelector('#all-pairs');
const sortElem = document.querySelector('#sort');
const minProfitElem = document.querySelector('#min-profit');
const reversElem = document.querySelector('#revers');


let DATA;
let btcUsdtPrice = 0;
let ethUsdtPrice = 0;
let bnbUsdtPrice = 0;
let curentPrices;
let coinList = [];
let coinPairObj = {};
let arbitradeList = [];
let minProfitValue = 0.01;


refreshBtn.onclick = () => {
    sendRequest(requestURL).then( data => {DATA = data; dataHundler();} ).catch( (err) => console.log(err) );
    rootElement.innerHTML = '<div class="loading"></div>';
    checkMinProfit();
}

function sendRequest(url) {
    return new Promise( (resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.responseType = 'json';
        xhr.onload = () => {
            if (xhr.status >= 400) {
                reject(xhr.response);
            } else {
                resolve(xhr.response);
            }
        }
        xhr.send();
    })
}

function dataAnalis(arr) {
        curentPrices = [];
    for (let i = 0; i < arr.length; i++ ) {
        curentPrices.push({name: arr[i].symbol, price: arr[i].askPrice, bidPrice: arr[i].bidPrice});
    }
}

function arrFilter() {
    for ( let i = curentPrices.length - 1; i>= 0; i--) {
        let btc = curentPrices[i].name.includes('BTC');
        let usdt = curentPrices[i].name.includes('USDT');
        let eth = curentPrices[i].name.includes('ETH');
        let bnb = curentPrices[i].name.includes('BNB');
        let up = curentPrices[i].name.includes('UP');
        let down = curentPrices[i].name.includes('DOWN');
        if ( (!btc && !usdt && !eth && !bnb) || up || down) {
            curentPrices.splice(i, 1);
        }
    }
    curentPrices.sort((a, b) => a.name > b.name ? 1 : -1);
}

function getCoinList() {
    for (let i = 0; i < curentPrices.length; i++) {
        coinList.push(curentPrices[i].name.replace('BTC', '').replace('USDT', ''));
    }
    coinList = coinList.reduce( (result, item) => {
        return result.includes(item) ? result : [... result, item];
    }, []);
}

function getCoinPairObj() {
    coinPairObj = {};
    for (let i = 0; i < curentPrices.length; i++) {
        if ( `${curentPrices[i].name}`.includes('USDT') ) {
            coinPairObj[`${curentPrices[i].name}`] = curentPrices[i].price;
        } else if (`${curentPrices[i].name}`.includes('BTC')) {
            coinPairObj[`${curentPrices[i].name}`] = curentPrices[i].bidPrice;
        } else if (`${curentPrices[i].name}`.includes('ETH')) {
            coinPairObj[`${curentPrices[i].name}`] = curentPrices[i].bidPrice;
        } else if (`${curentPrices[i].name}`.includes('BNB')) {
            coinPairObj[`${curentPrices[i].name}`] = curentPrices[i].bidPrice;
        }
        
    }
    btcUsdtPrice = coinPairObj.BTCUSDT;
    ethUsdtPrice = coinPairObj.ETHUSDT;
    bnbUsdtPrice = coinPairObj.BNBUSDT;
}

function getArbitradeList() {
    arbitradeList = [];
    
    for (let i = 0; i < coinList.length; i++) {
        if ((coinPairObj[`${coinList[i]}USDT`] != undefined) && (coinPairObj[`${coinList[i]}USDT`] != 0)) {
            if ((coinPairObj[`${coinList[i]}BTC`] != undefined) && (coinPairObj[`${coinList[i]}BTC`] != 0)) {
                arbitradeList.push( [coinList[i], coinPairObj[`${coinList[i]}USDT`], coinPairObj[`${coinList[i]}BTC`], coinPairObj[`${coinList[i]}ETH`], coinPairObj[`${coinList[i]}BNB`]] );
            }
        }
    }
    for (let i = 0; i < arbitradeList.length; i++) {
        let profit = 0;
        profit = calcProfit(arbitradeList[i][1], arbitradeList[i][2], btcUsdtPrice);
        arbitradeList[i].push( profit );
    }
    if ( sortElem.checked ) {
        arbitradeList.sort( (a, b) => a[5] > b[5] ? -1 : 1);
    }
}

function showPairs() {
    rootElement.innerHTML = '';
    for (let i = 0; i < arbitradeList.length; i++) {
        let str = '';
        let elem = document.createElement('div');
        elem.classList.add('coin-price');
        if ( arbitradeList[i][5] > minProfitValue ) {
            str += `<span class="coin-name">${ arbitradeList[i][0] }</span>: `;
            str += `in USDT - <span class="usdt-price">${ arbitradeList[i][1] }</span>;`;
            str += ` in BTC - <span class="btc-price">${ arbitradeList[i][2] }</span>`;
            str += ` Profit: <span class="profit plus-profit">${ String(arbitradeList[i][5]).slice(0, 4) }</span> %`;
            elem.innerHTML = str;
            rootElement.append(elem);
        } else if ( allPairsElem.checked ) {
            str += `<span class="coin-name">${ arbitradeList[i][0] }</span>: `;
            str += `in USDT - <span class="usdt-price">${ arbitradeList[i][1] }</span>;`;
            str += ` in BTC - <span class="btc-price">${ arbitradeList[i][2] }</span>`;
            str += ` Profit: <span class="profit minus-profit">${ String(arbitradeList[i][5]).slice(0, 5) }</span> %`;
            elem.innerHTML = str;
            rootElement.append(elem);
        }
        
    }
    btcPriceElem.innerHTML = btcUsdtPrice.slice(0, 8);
    statusElem.classList.remove('hide');
    setTimeout( () => {
        statusElem.classList.add('hide'); 
    }, 1500)
}

function showEthProfit() {
    for ( let i = 0; i < arbitradeList.length; i++ ) {
        if (arbitradeList[3] != undefined) {
            let prof = calcProfit(arbitradeList[i][1], arbitradeList[i][3], ethUsdtPrice);
            if (prof > 0 ) {
                rootElement.innerHTML += `${arbitradeList[i][0]} -> ETH ${prof}<br>`;
            }
        }
    }
}

function showBnbProfit() {
    for ( let i = 0; i < arbitradeList.length; i++ ) {
        if (arbitradeList[4] != undefined) {
            let prof = calcProfit(arbitradeList[i][1], arbitradeList[i][4], bnbUsdtPrice);
            if (prof > 0 ) {
                rootElement.innerHTML += `${arbitradeList[i][0]} -> BNB ${prof}<br>`;
            }
        }
    }
}

function calcProfit(pr1, pr2, prbtc) {
    let profit;
    profit = ((100 / +pr1 * 0.99925) * +pr2 * 0.99925) * +prbtc * 0.99925 - 100;
    return profit;
}

function checkMinProfit() {
    if ( Number(minProfitElem.value) != NaN ) {
        minProfitValue = Number(minProfitElem.value);
    }
}

function dataHundler() {
    dataAnalis(DATA);
    arrFilter();
    getCoinList();
    getCoinPairObj();
    getArbitradeList();
    showPairs();
    showEthProfit()

}


