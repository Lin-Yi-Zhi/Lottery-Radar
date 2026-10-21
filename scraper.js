const axios = require("axios");
const fs = require("fs-extra");

// 替換成你在 Headers 複製的那串 Request URL
const API_URL =
  "https://api.taiwanlottery.com/TLCAPIWeB/Instant/Result?ScratchName&Start_ListingDate&End_ListingDate&PageNum=1&PageSize=20&Type=1";

async function generateScratchData() {
  console.log("🚀 開始從台彩 API 抓取真實資料...");
  try {
    const response = await axios.get(API_URL);
    const rawData = response.data;

    // 驗證 API 回應格式
    if (
      rawData.rtCode !== 0 ||
      !rawData.content ||
      !rawData.content.resultList
    ) {
      throw new Error("API 回應格式不如預期");
    }

    const resultList = rawData.content.resultList;
    let scratchCards = [];

    // 走訪 API 陣列，對應到我們的資料結構
    resultList.forEach((item) => {
      const name = item.scratchName;
      const price = item.money;
      const totalIssued = item.issuedCount;
      const topPrizeAmount = item.firstPrize;
      const topPrizeTotalCount = item.total_prize;

      // 目前這個 API 的 remain_prize 是 null，若無資料先以總數計算，後續沙盒可微調
      const topPrizeRemain =
        item.remain_prize !== null ? item.remain_prize : topPrizeTotalCount;

      scratchCards.push({
        id: item.scratchId,
        name: name,
        price: price,
        totalIssued: totalIssued,
        unsoldRate: 0.35, // 預設目前市場剩下 35%
        prizes: [
          {
            name: "頭獎",
            amount: topPrizeAmount,
            totalCount: topPrizeTotalCount,
            claimedCount: topPrizeTotalCount - topPrizeRemain,
            isTracked: true,
          },
          // 備註：此總表 API 尚未提供二獎以下的各層級細節，這裡先以數學比例自動補齊結構，確保 EV 邏輯能運作。
          {
            name: "二獎",
            amount: price * 100,
            totalCount: Math.floor(totalIssued * 0.005),
            claimedCount: 0,
            isTracked: true,
          },
          {
            name: "普獎",
            amount: price,
            totalCount: Math.floor(totalIssued * 0.3),
            claimedCount: 0,
            isTracked: false,
          },
        ],
      });
    });

    // 輸出 JSON 檔案
    await fs.writeJson("./scratch-data.json", scratchCards, { spaces: 4 });
    console.log(
      `✅ 清洗完成！已成功輸出 scratch-data.json，共處理了 ${scratchCards.length} 款刮刮樂。`,
    );
  } catch (error) {
    console.error("❌ 爬蟲執行失敗:", error.message);
  }
}

generateScratchData();
