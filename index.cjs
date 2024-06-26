const express = require('express');
const ytdl = require('@distube/ytdl-core');
const path = require('path');
const axios = require('axios'); // Add axios for making HTTP requests
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/youtube', async (req, res) => {
  const { search, type } = req.query;

  try {
    if (!search || !type) {
      return res.status(400).json({
        error: '❌ | Search term and Type are required.'
      });
    }

    if (type !== 'mp4' && type !== 'mp3') {
      return res.status(400).json({
        error: '❌ | Type must be either mp3 or mp4.'
      });
    }

    const searchResults = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        q: search,
        part: 'snippet',
        type: 'video',
        key: 'AIzaSyBUQ1nLolq1SUVjxpSwPoMRLNR7u825Dtk' // Replace with your actual YouTube API key
      }
    });
    const firstResultId = searchResults.data.items[0].id.videoId;
    const videoInfo = await ytdl.getInfo(firstResultId);

    const format = videoInfo.formats.find(format => format.container === type);

    if (!format) {
      return res.status(500).json({
        error: '❌ | Unable to find requested format for the video.'
      });
    }

    res.set('Content-Disposition', `attachment; filename="video.${type}"`);
    res.set('Content-Type', format.mimeType);

    const videoStream = ytdl.downloadFromInfo(videoInfo, {
      filter: format => format.container === type,
      quality: 'highest',
    });

    videoStream.pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: '❌ | An error occurred while processing your request.'
    });
  }
});

app.listen(PORT, () => {
  console.log('ytdl api on');
});
