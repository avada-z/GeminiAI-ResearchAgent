# Autonomous Research Agent with Gemini and DuckDuckGo

This project demonstrates an autonomous research agent that leverages Google's Gemini API and DuckDuckGo search to answer complex questions.  The agent uses a chain-of-thought reasoning process to formulate search queries, evaluate search results, and synthesize information into a coherent answer.

## Features

* **Autonomous Research:** The agent automatically generates search queries based on the initial question and refines them based on the information it gathers.
* **Gemini Integration:** Uses Google's Gemini API for advanced natural language processing and reasoning capabilities.  Specifically uses the `gemini-1.5-pro-002` model.
* **DuckDuckGo Search:** Leverages DuckDuckGo's search engine for retrieving relevant web pages.
* **Iterative Refinement:** The agent can perform multiple rounds of search and analysis to improve the quality of its answer.
* **URL Selection:** Uses Gemini to intelligently select the most relevant URL from a list of search results.
* **Web Page Analysis:** Extracts text content from web pages and uses Gemini to analyze it and answer specific questions.
* **Error Handling:** Includes error handling to deal with failed API requests and invalid URLs.


## How it works

1. **Initial Prompt:** The user provides an initial question or topic.
2. **Reasoning Loop:** The agent enters a loop where it uses Gemini to reason about the next step.
3. **Search Query Generation:** If the agent determines it needs more information, it formulates a search query.
4. **DuckDuckGo Search:** The agent searches DuckDuckGo using the generated query.
5. **URL Selection:**  The agent uses Gemini to select the most promising URL from the search results.
6. **Web Page Parsing:** The agent fetches the content of the selected URL and extracts the relevant text.
7. **Information Analysis:** The agent analyzes the extracted text using Gemini to answer the original question or a refined sub-question.
8. **Iteration:**  Steps 3-7 are repeated as needed until the agent believes it has a satisfactory answer.
9. **Final Answer:**  The agent provides its final answer.

## Requirements

* **Node.js and npm:** Make sure you have Node.js and npm installed.
* **Google Cloud Project and Gemini API Enablement:**  You'll need a Google Cloud project with the Gemini API enabled and a valid API key.  See Google's documentation for instructions on setting this up.
* **Required Packages:** Install the necessary npm packages:

```bash
npm install @google/generative-ai duck-duck-scrape axios jsdom node:readline
