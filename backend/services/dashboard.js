const XLSX = require("xlsx");
const  axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
const YahooFinance = require("yahoo-finance2").default;
const yahoo = new YahooFinance();

const filePath = path.join(__dirname, "../data/data.xlsx");

async function getPERatio(symbol) {
  const url = `https://www.google.com/finance/quote/${symbol}`;
  
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);
    const stats = {};
    $('.gyFHrc').each((i, el) => {
        const label = $(el).find('.mfs7Fc').text().trim();
        const value = $(el).find('.P6K39c').text().trim();

        if (label.includes('P/E ratio')) stats.peRatio = value;
        if (label.includes('EPS')) stats.LatestEarnings = value;
    });
    return {
        peRatio: stats?.peRatio || 0,
        LatestEarnings: stats?.LatestEarnings || 0
    };
}


const getPriceInfo = async (name, code) => {
    try {
        const search = await yahoo.search(name);
        const valid = search?.quotes.find(q => 
            ['NSE', 'BSE', 'NSI'].includes(q.exchange) && q.quoteType === 'EQUITY'
        );

        if (!valid) return { price: 0, ticker: 'N/A' };

        const quote = await yahoo.quote(valid.symbol);
        const symbol = valid.symbol.split('.')
        const result = await getPERatio(`${symbol[0]}:NSE`);
        return {
            price: quote?.regularMarketPrice || 0,
            symbol: valid.exchange,
            latestEarnings: result.LatestEarnings,
            peRatio: result.peRatio,
        };
    } catch (e) {
        console.log("error while fetching data", e)
        return { price: 0, symbol: 'error' };
    }
};

const getUpdatedStockDetails = async (row) => {
    const { price, symbol, latestEarnings, peRatio } = await getPriceInfo(row["Particulars"], row["NSE/BSE"]);
    
    const buyPrice = row["Purchase Price"] || 0;
    const count = row["Qty"] || 0;
    const invested = buyPrice * count;
    const currentVal = price * count;
    const gainLoss = Number((currentVal - invested).toFixed(2))

    return {
        particular: row["Particulars"],
        purchasePrice: buyPrice,
        qty: count,
        investment: invested,
        portfolio: Number(row["Portfolio (%)"].toFixed(2)),
        symbol,
        cmp: price,
        presentValue: Number(currentVal.toFixed(2)),
        gainLoss,
        peRatio,
        latestEarnings,
        sector: row["currentSector"],
    };
}

const getPortfolio = async (req, res) => {
    try {
        const book = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { range: 1 });

        let currentSector = "";
        const rawStocks = [];

        for (const row of data) {
            if (!row.No) { 
                currentSector = String(row.Particulars).trim();
                continue;
            }else{
                rawStocks.push({currentSector, ...row});
            }
        }
        const activeRows = rawStocks.filter(r => r.No);

        const stocks = [];

        for (const row of activeRows) {
        const stock = await getUpdatedStockDetails(row);
        stocks.push(stock);

        await new Promise(r => setTimeout(r, 500)); // delay
        }

        const sectors = stocks.reduce((acc, curr) => {
            const s = curr.sector;
            if (!acc[s]) {
                acc[s] = { items: [], invested: 0, value: 0, gainLoss: 0 };
            }
            acc[s].items.push(curr);
            acc[s].invested += curr.investment;
            acc[s].value += curr.presentValue;
            acc[s].gainLoss += curr.gainLoss;
            return acc;
        }, {});

        res.json({ stocks, sectors });
    } catch (err) {
        console.log(err)
        res.status(500).send({ error: "Failed to process data" });
    }
};

module.exports = { getPortfolio };