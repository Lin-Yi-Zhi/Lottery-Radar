const cheerio = require('cheerio');
const fs = require('fs-extra');

// 這是你貼上來的首頁 HTML 片段 (為了示範，我將其簡化，實務上你可以用 axios 去 fetch)
const rawHtml = `
<ul data-v-5f307a69="" class="instant-list">
    <li data-v-5f307a69=""><a href="/instant/games?id=fbed" class=""><h4 data-v-5f307a69="">好運強強滾</h4><p data-v-5f307a69="">頭獎200萬元，總中獎率35%</p></a></li>
    <li data-v-5f307a69=""><a href="/instant/games?id=9eac" class=""><h4 data-v-5f307a69="">金骰子</h4><p data-v-5f307a69="">頭獎50萬元，超過18萬個500元(含)以上獎項</p></a></li>
    <li data-v-5f307a69=""><a href="/instant/games?id=e8b6" class=""><h4 data-v-5f307a69="">喜從天降</h4><p data-v-5f307a69="">全新主題，頭獎200萬元，超過34萬個1,000元(含)以上獎項</p></a></li>
    <li data-v-5f307a69=""><a href="/instant/games?id=9a80" class=""><h4 data-v-5f307a69="">10來添金</h4><p data-v-5f307a69="">頭獎500萬元，高達15次中獎機會</p></a></li>
</ul>
`;

async function generateScratchData() {
    console.log('🚀 開始解析台彩 HTML 資料...');
    const $ = cheerio.load(rawHtml);
    let scratchCards = [];

    // 針對你提供的 HTML 結構 (.instant-list li) 進行解析
    $('.instant-list li').each((index, element) => {
        const name = $(element).find('h4').text().trim();
        const desc = $(element).find('p').text().trim();
        
        // 簡易的 NLP 判斷邏輯：從行銷標語粗估售價 (這是在缺乏真實表格時的 Hack 技巧)
        let price = 200; // 預設 200 元
        if (desc.includes('500萬')) price = 500;
        if (desc.includes('50萬')) price = 100;

        // 建立符合我們 Web App (index.html) 所需的嚴謹 JSON 結構
        scratchCards.push({
            id: `TLC-NEW-${index + 1}`,
            name: name,
            price: price,
            totalIssued: 5000000, // 缺乏實際張數，先塞入基準值
            unsoldRate: 0.35,     // 預設目前市場剩下 35%
            prizes: [
                {
                    name: "頭獎",
                    amount: price * 10000, 
                    totalCount: 5,
                    claimedCount: Math.floor(Math.random() * 4), // 隨機模擬已被刮出的張數
                    isTracked: true 
                },
                {
                    name: "二獎",
                    amount: price * 100, 
                    totalCount: 200,
                    claimedCount: 85,
                    isTracked: true 
                },
                {
                    name: "普獎",
                    amount: price, 
                    totalCount: 1500000,
                    claimedCount: 0,
                    isTracked: false // 小獎不追蹤，靠 unsoldRate 估算
                }
            ]
        });
    });

    // 輸出 JSON 檔案
    await fs.writeJson('./scratch-data.json', scratchCards, { spaces: 4 });
    console.log('✅ 清洗完成！已成功輸出 scratch-data.json，包含', scratchCards.length, '款刮刮樂。');
}

generateScratchData();