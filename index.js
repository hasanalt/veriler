const axios = require('axios');
const cheerio = require('cheerio');
const fsv2 = require('fs').promises;
const fs = require('fs');

const mathFunctions = require('./math');

const MAX_RETRY_ATTEMPTS = 30;
const RETRY_DELAY_MS = 5000;

// Helper function to parse Turkish integer strings
function parseTurkishInteger(value) {
  // Check if the value is a string
  if (typeof value === 'string') {
    // Remove all dots and parse as integer
    const parsedValue = parseInt(value.replace(/\./g, ''), 10);
    return parsedValue;
  } else {
    // If the value is not a string, return it directly
    return value;
  }
}



function fetchWithRetry(url) {
    let attempt = 0;

    const tryFetch = () => {
        return new Promise((resolve, reject) => {
            const tryRequest = () => {
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    axios.get(url)
                        .then(response => {
                            if (response.status === 200) {
                                resolve(response.data);
                            } else {
                                attempt++;
                                setTimeout(tryRequest, RETRY_DELAY_MS);
                                throw new Error(`Fetch attempt ${attempt} failed: HTTP status ${response.status}`);
                            }
                        })
                        .catch(error => {
                            if (attempt >= MAX_RETRY_ATTEMPTS) {
                                reject(new Error(`Failed to fetch after ${MAX_RETRY_ATTEMPTS} attempts`));
                            } else {
                                attempt++;
                                setTimeout(tryRequest, RETRY_DELAY_MS);
                            }
                        });
                } else {
                    reject(new Error(`Failed to fetch after ${MAX_RETRY_ATTEMPTS} attempts`));
                }
            };

            tryRequest();
        });
    };

    return tryFetch();
}

async function fetchAndDisplayData() {
    const url = 'https://www.isyatirim.com.tr/tr-tr/analiz/hisse/Sayfalar/Temel-Degerler-Ve-Oranlar.aspx#page-5';

    try {
        const html = await fetchWithRetry(url);
        const $ = cheerio.load(html);
		await fsv2.writeFile('data.txt', '');

        const dataRows = $('#temelTBody_Finansal tr');
        const relevantRows = dataRows.filter((index, row) => {
            const tarih = $(row).find('td').eq(6).text().trim();
            return tarih === '3/2024';
        });

        for (const row of relevantRows) {
            const companyCode = $(row).find('td').eq(0).text().trim();
            await FetchSecond(companyCode);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function FetchSecond(companyCode) {
    const url = 'https://www.isyatirim.com.tr/tr-tr/analiz/hisse/Sayfalar/Temel-Degerler-Ve-Oranlar.aspx#page-1';

    try {
        const html = await fetchWithRetry(url);
        const $ = cheerio.load(html);

        const dataRows = $('#temelTBody_Ozet tr');

        for (const row of dataRows) {
            const code = $(row).find('td').eq(0).text().trim();
            if (companyCode === code) {
                const piyasaD = $(row).find('td').eq(4).text().trim();
                const veri = mathFunctions.formatMoney(piyasaD);
                await FetchThird(companyCode, veri);
            }
        }
    } catch (error) {
        console.error('Error fetching second data:', error);
    }
}

async function FetchThird(companyCode, piyasaDeger) {
    try {
        const url = `https://www.isyatirim.com.tr/tr-tr/analiz/hisse/Sayfalar/sirket-karti.aspx?hisse=${companyCode}`;

        const html = await fetchWithRetry(url);
        const $ = cheerio.load(html);

        let açıklıkOranı = null;
        let pdddOranı = null;
        let kar = null;
        let FD = null;

        const elements = $('table tbody tr');
        elements.each((index, element) => {
            const label = $(element).find('th').text().trim();
            const valueCell = $(element).find('td').text().trim();

            if (label && valueCell) {
                if (label === 'Halka Açıklık Oranı (%)') {
                    açıklıkOranı = mathFunctions.formatMoney(valueCell);
                } else if (label === 'PD/DD') {
                    pdddOranı = mathFunctions.formatMoney(valueCell);
                }
            }
        });

        const rows = $('#malitabloShortTbody tr');
        for (let i = 0; i < rows.length; i++) {
            const labelText = $(rows[i]).find('td').eq(0).text().trim();
            const valueText = $(rows[i]).find('td').eq(1).text().trim();

            if (labelText.includes('Net Kâr')) {
                kar = mathFunctions.formatMoney(valueText);
            }
        }

        if (kar === null) {
            $('#tbodyMTablo tr').each((index, tr) => {
                const labelText = $(tr).find('td').eq(0).text().trim();
                const valueText = $(tr).find('td').eq(1).text().trim();

                if (labelText.includes('NET DÖNEM KARI (ZARARI)')) {
                    if (valueText) {
                        kar = mathFunctions.formatMoney(valueText);
                    }
                }
            });
        }

        if (kar !== null && !isNaN(parseFloat(piyasaDeger)) && !isNaN(parseFloat(kar))) {
            const normalizedKar = mathFunctions.parseTurkishInteger(kar);
            const normalizedPiyasaDeger = mathFunctions.parseTurkishInteger(piyasaDeger);
            const karValue = parseFloat(normalizedKar);
            const piyasaDegerValue = parseFloat(normalizedPiyasaDeger);
            FD = mathFunctions.formatMoney(piyasaDegerValue / karValue);
        }

        let salesRevenue = null;
        let netOperatingProfitLoss = null;

        $('#tbodyMTablo tr').each((index, tr) => {
            const labelText = $(tr).find('td').eq(0).text().trim();
            const valueText = $(tr).find('td').eq(1).text().trim();

            if (labelText.includes('Satış Gelirleri')) {
                console.log('Found Satış Gelirleri:', valueText);
                if (valueText) {
                    salesRevenue = mathFunctions.parseTurkishInteger(valueText); // Ensure it's a number
                    console.log('Parsed Sales Revenue:', salesRevenue);
                }
            } else if (labelText.includes('Net Faaliyet Kar/Zararı')) {
                console.log('Found Net Faaliyet Kar/Zararı:', valueText);
                if (valueText) {
                    netOperatingProfitLoss = mathFunctions.parseTurkishInteger(valueText); // Ensure it's a number
                    console.log('Parsed Net Operating Profit/Loss:', netOperatingProfitLoss);
                }
            }
        });

        const salesToProfitRatio = ""; // Assigning the value to salesToProfitRatio


        if (salesRevenue !== null && netOperatingProfitLoss !== null && netOperatingProfitLoss !== 0) {
            const ratio = salesRevenue / netOperatingProfitLoss;
            const formattedRatio = ratio.toLocaleString('tr', { minimumFractionDigits: 2, maximumFractionDigits: 2 });;
            console.log('Final Sales to Profit Ratio:', formattedRatio);
            const salesToProfitRatio = formattedRatio; // Assigning the value to salesToProfitRatio
            return salesToProfitRatio; // Returning salesToProfitRatio
        }
        const content = `${companyCode};${piyasaDeger};${kar !== null ? kar : ''};${pdddOranı !== null ? pdddOranı : ''};${açıklıkOranı !== null ? açıklıkOranı : ''};${FD !== null ? FD : ''};${salesToProfitRatio !== null ? salesToProfitRatio : ''}\n`;


        await fs.promises.appendFile('data.txt', content);
			
        return '';
    } catch (error) {
        console.error('Error fetching third data:', error);
        return '';
    }
}

setInterval(fetchAndDisplayData, 3 * 60 * 60 * 1000); // Fetch data every 3 hours

