const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const axios = require('axios');
const cheerio = require('cheerio');

// Store session information for ongoing interactions
let session = {};

// Function to search for videos on XNXX
async function xnxxs(query) {
    return new Promise((resolve, reject) => {
        const baseurl = 'https://www.xnxx.com';
        axios.get(`${baseurl}/search/${query}/${Math.floor(Math.random() * 3) + 1}`)
            .then((res) => {
                const $ = cheerio.load(res.data);
                const title = [];
                const url = [];
                const desc = [];
                const results = [];

                // Scrape video details
                $('div.mozaique').each(function(a, b) {
                    $(b).find('div.thumb').each(function(c, d) {
                        url.push(baseurl + $(d).find('a').attr('href').replace('/THUMBNUM/', '/'));
                    });
                });

                $('div.mozaique').each(function(a, b) {
                    $(b).find('div.thumb-under').each(function(c, d) {
                        desc.push($(d).find('p.metadata').text());
                        $(d).find('a').each(function(e, f) {
                            title.push($(f).attr('title'));
                        });
                    });
                });

                // Prepare results
                for (let i = 0; i < title.length; i++) {
                    results.push({ title: title[i], info: desc[i], link: url[i] });
                }
                resolve({ status: true, result: results });
            }).catch((err) => {
                console.error(err);
                reject({ status: false, result: err });
            });
    });
}

// Search command for XNXX videos
cmd({
    pattern: "xnxx",
    alias: ["xnxxs"],
    use: '.xnxx <query>',
    react: "🔞",
    desc: "Search and DOWNLOAD VIDEOS from xnxx.",
    category: "search",
    filename: __filename
}, async (messageHandler, context, quotedMessage, { from, q, reply }) => {
    try {
        if (!q) return reply('⭕ *Please Provide Search Terms.*');

        // Fetch search results for XNXX
        let res = await xnxxs(q);

        const data = res.result;
        if (data.length < 1) return await messageHandler.sendMessage(from, { text: "⭕ *I Couldn't Find Anything 🙄*" }, { quoted: quotedMessage });

        let message = `🔞*MEDZ MD XNXX DOWNLOADER*🔞\n\n_Search Results For_ "${q}":\n\n`;
        let options = '';

        // Create list of video options for user
        data.forEach((v, index) => {
            options += `${index + 1}. ${v.title}\n`;
        });

        message += options;
        message += `\n❗ *You Can Reply To A Single Number From This Command And Take The Video You Want.(Example:1)*`;
        message += `\n\n❗ *You Can Reply A Few Numbers From This Command And Take The Videos You Want.(Example:1,2,3)*`; 
        message += `\n\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪᴋᴀ-ᴛᴇᴄʜ*`;

        // Send message to user with video options
        const sentMessage = await messageHandler.sendMessage(from, {
            image: { url: `https://pomf2.lain.la/f/147pvvp2.jpg` }, // Assuming movie poster or thumbnail
            caption: message,
        }, { quoted: quotedMessage });

        // Store session information for future reference
        session[from] = {
            searchResults: data,
            messageId: sentMessage.key.id,  // Store message ID for future reference
        };

        // Handle user reply for video selection
        const handleUserReply = async (update) => {
            const userMessage = update.messages[0];

            // Ensure this message is a reply to the original search prompt
            if (!userMessage.message.extendedTextMessage ||
                userMessage.message.extendedTextMessage.contextInfo.stanzaId !== sentMessage.key.id) {
                return;
            }

            const userReply = userMessage.message.extendedTextMessage.text.trim();
            const videoIndexes = userReply.split(',').map(x => parseInt(x.trim()) - 1); // Convert reply to an array of indexes

            // Validate the selected indexes
            for (let index of videoIndexes) {
                if (isNaN(index) || index < 0 || index >= data.length) {
                    return reply("⭕ *Please Enter Valid Numbers From The List.*");
                }
            }

            // Fetch and send the selected videos
            for (let index of videoIndexes) {
                const selectedVideo = data[index];

                try {
                    // Fetch the download URL for the selected video
                    let downloadRes = await fetchJson(`https://raganork-network.vercel.app/api/xvideos/download?url=${selectedVideo.link}`);
                    let videoUrl = downloadRes.url;

                    if (!videoUrl) {
                        return reply(`⭕ *Failed To Fetch Video* For "${selectedVideo.title}".`);
                    }

                    // Send the video to the user
                    await messageHandler.sendMessage(from, {
                        video: { url: videoUrl },
                        caption: `*${selectedVideo.title}*\n\n> *© ᴘᴏᴡᴇʀᴅ ʙʏ ɴᴇᴛʜᴍɪᴋᴀ-ᴛᴇᴄʜ*`,
                    }, { quoted: quotedMessage });

                } catch (err) {
                    console.error(err);
                    return reply(`⭕ *An Error Occurred While Downloading "${selectedVideo.title}".*`);
                }
            }

            // Clear the session after handling the download
            delete session[from];
        };

        // Attach the listener for user replies
        messageHandler.ev.on("messages.upsert", handleUserReply);

    } catch (error) {
        console.error(error);
        await messageHandler.sendMessage(from, { text: '⭕ *Error Occurred During The Process!*' }, { quoted: quotedMessage });
    }
});


//=============================================================================================
//================================================================================================
cmd({
    pattern: "xvid",
    alias: ["xvideo"],
    use: '.xvid <query>',
    react: "🔞",
    desc: "Search and DOWNLOAD VIDEOS from xvideos.",
    category: "search",
    filename: __filename
}, async (messageHandler, context, quotedMessage, { from, q, reply }) => {
    try {
        if (!q) return reply('⭕ *Please Provide Search Terms.*');

        // Fetch xvideos search results from the API
        let res = await fetchJson(`https://raganork-network.vercel.app/api/xvideos/search?query=${q}`);
        
        // Check if the response is valid
        if (!res || !res.result) return reply('⭕ *No results found or API error.*');

        // Get the search results
        const data = res.result;
        if (data.length < 1) return await messageHandler.sendMessage(from, { text: "⭕ *I Couldn't Find Anything 🙄*" }, { quoted: quotedMessage });

        let message = `🔞*MEDZ MD X VIDEO DOWNLOADER*🔞\n\n_Search Results For_ "${q}":\n\n`;
        let options = '';

        // Create a list of video results
        data.forEach((v, index) => {
            options += `${index + 1}. ${v.title}\n`;
        });

        message += options;
        message += `\n❗ *You Can Reply To A Single Number From This Command And Take The Video You Want.(Example:1)*`;
        message += `\n\n❗ *You Can Reply A Few Numbers From This Command And Take The Videos You Want.(Example:1,2,3)*`; 
        message += `\n\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪᴋᴀ-ᴛᴇᴄʜ*`;

        // Send the list of search results to the user
        const sentMessage = await messageHandler.sendMessage(from, {
            image: { url: `https://pomf2.lain.la/f/147pvvp2.jpg` }, // Assuming movie poster or thumbnail
            caption: message,
        }, { quoted: quotedMessage });

        // Store session for the user in session object
        session[from] = {
            searchResults: data,
            messageId: sentMessage.key.id,  // Store message ID for future reference
        };

        // Function to handle the user reply
        const handleUserReply = async (update) => {
            const userMessage = update.messages[0];

            // Ensure this message is a reply to the original prompt
            if (!userMessage.message.extendedTextMessage ||
                userMessage.message.extendedTextMessage.contextInfo.stanzaId !== sentMessage.key.id) {
                return;
            }

            const userReply = userMessage.message.extendedTextMessage.text.trim();
            const videoIndexes = userReply.split(',').map(x => parseInt(x.trim()) - 1); // Convert reply to an array of indexes

            // Check if all selected indexes are valid
            for (let index of videoIndexes) {
                if (isNaN(index) || index < 0 || index >= data.length) {
                    return reply("⭕ *Please Enter Valid Numbers From The List.*");
                }
            }

            // Fetch and send videos for each valid index
            for (let index of videoIndexes) {
                const selectedVideo = data[index];

                try {
                    // Fetch the download URL for the selected video
                    let downloadRes = await fetchJson(`https://raganork-network.vercel.app/api/xvideos/download?url=${selectedVideo.url}`);
                    let videoUrl = downloadRes.url;

                    if (!videoUrl) {
                        return reply(`⭕ *Failed To Fetch Video* for "${selectedVideo.title}".`);
                    }

                    // Send the selected video to the user
                    await messageHandler.sendMessage(from, {
                        video: { url: videoUrl },
                        caption: `*${selectedVideo.title}*\n⏰ Dᴜʀᴀᴛɪᴏɴ: ${selectedVideo.duration}\n\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪᴋᴀ-ᴛᴇᴄʜ*`,
                    }, { quoted: quotedMessage });

                } catch (err) {
                    console.error(err);
                    return reply(`⭕ *An Error Occurred While Downloading "${selectedVideo.title}".*`);
                }
            }

            // After a selection, clear the session for that user (important to prevent unwanted interactions)
            delete session[from];
        };

        // Attach the listener for user replies (make sure it's set up only once)
        messageHandler.ev.on("messages.upsert", handleUserReply);

    } catch (error) {
        console.error(error);
        await messageHandler.sendMessage(from, { text: '⭕ *Error Occurred During The Process!*' }, { quoted: quotedMessage });
    }
});
