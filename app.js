const requestURL = 'https://api1.binance.com/api/v3/ticker/24hr';
const rootElement = document.querySelector('#root');
const refreshBtn = document.querySelector('#refresh');
const btcPriceElem = document.querySelector('.btc-price-head');
const statusElem = document.querySelector('.status');


let DATA;
let btcUsdtPrice = 0;
let curentPrices;
let coinList = [];
let coinPairObj = {};
let arbitradeList = [];

refreshBtn.onclick = () => {
    sendRequest(requestURL).then( data => {DATA = data; dataHundler();} ).catch( (err) => console.log(err) );
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
        curentPrices.push({name: arr[i].symbol, price: arr[i].askPrice});
    }
}

function arrFilter() {
    for ( let i = curentPrices.length - 1; i>= 0; i--) {
        let btc = curentPrices[i].name.includes('BTC');
        let usdt = curentPrices[i].name.includes('USDT');
        let up = curentPrices[i].name.includes('UP');
        let down = curentPrices[i].name.includes('DOWN');
        if ( (!btc && !usdt) || up || down) {
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
        coinPairObj[`${curentPrices[i].name}`] = curentPrices[i].price;
    }
    btcUsdtPrice = coinPairObj.BTCUSDT;
}

function getArbitradeList() {
    arbitradeList = [];
    for (let i = 0; i < coinList.length; i++) {
        if ((coinPairObj[`${coinList[i]}USDT`] != undefined) && (coinPairObj[`${coinList[i]}USDT`] != 0)) {
            if ((coinPairObj[`${coinList[i]}BTC`] != undefined) && (coinPairObj[`${coinList[i]}BTC`] != 0)) {
                arbitradeList.push([coinList[i], coinPairObj[`${coinList[i]}USDT`], coinPairObj[`${coinList[i]}BTC`]]);
            }
        }
    }
}

function showPairs() {
    rootElement.innerHTML = '';
    for (let i = 0; i < arbitradeList.length; i++) {
        let profit = calcProfit(arbitradeList[i][1], arbitradeList[i][2], btcUsdtPrice);
        let str = '';
        let elem = document.createElement('div');
        elem.classList.add('coin-price');
        str += `<span class="coin-name">${ arbitradeList[i][0] }</span>: `;
        str += `in USDT - <span class="usdt-price">${ arbitradeList[i][1] }</span>;`;
        str += ` in BTC - <span class="btc-price">${ arbitradeList[i][2] }</span>`;
        if (profit > 0) {
            str += ` Profit: <span class="profit plus-profit">${ String(profit).slice(0, 4) }</span> %`;
        } else {
            str += ` Profit: <span class="profit minus-profit">${ String(profit).slice(0, 5) }</span> %`;
        }
        elem.innerHTML = str;
        rootElement.append(elem);
    }
    btcPriceElem.innerHTML = btcUsdtPrice.slice(0, 8);
    statusElem.classList.remove('hide');
    setTimeout( () => {
        statusElem.classList.add('hide'); 
    }, 1500)
}

function calcProfit(pr1, pr2, prbtc) {
    let profit;
    profit = ((100 / +pr1 * 0.999) * +pr2 * 0.999) * +prbtc - 100;
    return profit;
}

function dataHundler() {
    dataAnalis(DATA);
    arrFilter();
    getCoinList();
    getCoinPairObj();
    getArbitradeList();
    showPairs();
}

sendRequest(requestURL).then( data => {DATA = data; dataHundler();} ).catch( (err) => console.log(err) );

