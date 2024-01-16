require("dotenv").config();

const fs = require("fs");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

// Replace with your Telegram bot token
const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/tiktok(.*) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const tiktokUrl = match[2]; // the captured "url"
  const isHd = match[1] === "hd"; // check if it's a request for HD video

  const options = {
    method: "GET",
    url: "https://tiktok-video-no-watermark2.p.rapidapi.com/",
    params: {
      url: tiktokUrl,
      hd: isHd ? "1" : "0",
    },
    headers: {
      "X-RapidAPI-Key": process.env.X_RAPIDAPI_KEY,
      "X-RapidAPI-Host": "tiktok-video-no-watermark2.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);

    // Extract the video URL
    const videoUrl = isHd ? response.data.data.hdplay : response.data.data.play;

    // Download the video
    const videoPath = await downloadVideo(videoUrl, "./video.mp4");

    // Send the video
    await bot.sendVideo(chatId, videoPath);

    // Extract the caption
    const caption = response.data.data.title;

    // Send the caption
    await bot.sendMessage(chatId, caption);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "Sorry, something went wrong.");
  }
});

async function downloadVideo(videoUrl, path) {
  const response = await axios({
    method: "GET",
    url: videoUrl,
    responseType: "stream",
  });

  const writer = fs.createWriteStream(path);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(path));
    writer.on("error", reject);
  });
}
