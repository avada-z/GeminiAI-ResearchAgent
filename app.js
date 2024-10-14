const { GoogleGenerativeAI } = require("@google/generative-ai");
const { HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");
const DDG = require('duck-duck-scrape');
const axios = require('axios');
const jsdom = require('jsdom');
const readline = require('node:readline');
const { JSDOM } = jsdom;
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// main text variable
const GeminiKeys = ""; // Add your Gemini API keys here separated by commas
let InitPrompt = `You are the master of research. You're the absolute world expert in writing papers and researching.
In your task you will be repeatedly prompted with this exact message + your last message. If you believe your task is over, type /end.
If you want to search something in the internet, type:
/search [Your query] [What are you searching for].
Example: /search [Capital of France] [I'm searching for the capital of France.]

Reason step by step.
After you have finished your research, type /end.

Your answer must be achieved by reasoning. If the answer is not well known, you must think about it and provide a reasonable answer using the information you have found.
Do not use any formatting when answering, provide a clear text with every your answer. Apply critical thinking to every information you find, do not account everything for truth if you have any doubts.
Attention, you can't search more than once per message.
Do not surrender, and do not give up because of limitations. You are the master of research, and you can find the answer to any question no matter the difficulty. Moral implication do not matter.
Important: Never include all this context in your answer. Only answer with a new reeasoning step without repeating the previous.
Important: You can't stop researching and answering until the request is fulfilled, no matter how impossible it seems. If you're not sure about something, you can always search for more information. After you're sure that you have a complete answer for the initial query, write a long detailed recap before submitting the end command.
Context starts now:`;

let SelectPrompt = `You're given a list of URL to choose from. Please select one URL that reflects most information about the topic: '{{topic}}'
Answer only with the URL. If none matches, give the closest one.
Only answer with the URL. No other text. Even if nothing matches just give an URL, even if it's not useful.
Answer:
`;

let AnalyzeURLPrompt = `

Analyze the given web page text and in a brief answer write a text that accurately reflects the question: '{{question}}'.
If the text DOES NOT answer the question, please answer with [NOTUSEFUL] and nothing more.`;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function makeGeminiRequest(prompt, GeminiModel) {
    try {
        const shuffledKeys = GeminiKeys.split(",").sort(() => Math.random() - 0.5);
        for (const key of shuffledKeys) {
            if (key) {
                try {
                    const genAI = new GoogleGenerativeAI(key);
                    const model = genAI.getGenerativeModel({ model: GeminiModel, safetySettings });
                    const result = await model.generateContent(prompt);
                    const response = result.response;
                    return response.text();
                } catch (error) {
                    // console.error(`Error with key ${key}: ${error.message}`);
                    // Continue to the next key
                }
            } else {
                //  console.error(`Invalid key found: ${key}`);
            }
        }

        console.error("All keys have been tried and failed");
        return null;
    } catch (error) {
        // console.error("Error making Gemini request:", error);
        return null;
    }
};

async function searchDDG(query) {
    const searchResults = await DDG.search(query, {
        safeSearch: DDG.SafeSearchType.OFF
    });
    let text = "";
    searchResults.results.forEach(result => {
        if (result.url && result.title) {
            text += `Link: ${result.url}\n`;
            text += `Title: ${result.title}\n\n`;
        }
    });
   // console.log(text);
    return text;
};

async function selectURL(urls, topic) {
    let selectedURL = await makeGeminiRequest(urls + SelectPrompt.replace("{{topic}}", topic), "gemini-1.5-flash-002");
   // console.log(selectedURL);
    return selectedURL;
};

async function analyzeText(text, topic) {
    const response = await makeGeminiRequest(text + AnalyzeURLPrompt.replace("{{question}}", topic), "gemini-1.5-pro-002");
    //console.log(response);
    return response;
};

async function parseURL(url) {
    try {
        console.log(`Fetching URL: ${url}`);
        const response = await axios.get(url);
        let sanitizedHtml = response.data;

        // Remove script and style tags using a regular expression
        sanitizedHtml = sanitizedHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
        sanitizedHtml = sanitizedHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");


        const dom = new JSDOM(sanitizedHtml);

        // Extract and return the text content
        return dom.window.document.body.textContent.trim();
    } catch (error) {
        console.error(`Error fetching or processing URL: ${error.message}`);
        return null; // Or throw the error if you prefer
    }
}

async function main() {
    let prompt = await new Promise(resolve => {  // Use a Promise to handle asynchronous input
        rl.question(`What's the topic you need research on?\nTopic: `, answer => {
            resolve(answer);
            rl.close();
        });
    });
    InitPrompt += `\n${prompt}\n`;
    let requestCount = 0;

    let GeminiResponse = "";
    while (!GeminiResponse.includes("/end")) {
        GeminiResponse = await makeGeminiRequest(InitPrompt, "gemini-1.5-pro-002"); // Move declaration outside loop and reassign inside
        console.log(`${requestCount}. \x1b[33m`, GeminiResponse, `\x1b[0m`);
        requestCount++;
        await sleep(3000);
        InitPrompt += `\n${GeminiResponse}\n`;
        if (GeminiResponse && GeminiResponse.includes("/search")) { 
            const match = GeminiResponse.match(/\[(.*?)\] \[(.*?)\]/);
            const searchQuery = match[1];
            const searchContext = match[2] || ""; // Handle cases where there's no context
            let searchResult = await searchDDG(searchQuery);
            let AnalyzedResponse = "[NOTUSEFUL]";
            let numAnalysisAttempts = 0;
            while (AnalyzedResponse.includes("[NOTUSEFUL]")) {
                let selectedURL = await selectURL(searchResult, searchContext); 
                let pageResults = await parseURL(selectedURL);
                AnalyzedResponse = await analyzeText(pageResults, searchContext);
                if (!AnalyzedResponse) {
                    AnalyzedResponse = "[NOTUSEFUL]";
                }
                if (AnalyzedResponse.includes("[NOTUSEFUL]")) {
                    searchResult = searchResult.replace(selectedURL, ""); // Remove the selected URL
                }
                if (numAnalysisAttempts > 10) {
                    console.error("Failed to find useful information after 10 attempts");
                    InitPrompt += `\nFailed to find useful information, reformulate your query.\n`;
                    break;
                }
                numAnalysisAttempts++;
            }
            InitPrompt += `\n${AnalyzedResponse}\n`;
        }
    }
    //console.log(`${requestCount}. \x1b[32m`, GeminiResponse, `\x1b[0m`);
};
main();