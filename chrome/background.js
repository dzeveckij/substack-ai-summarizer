const GEMINI_API_KEY = "";
const MODEL_ID = "gemini-2.5-flash-lite";
const API_METHOD = "generateContent";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:${API_METHOD}?key=${GEMINI_API_KEY}`;

function callGeminiApi(articleText, sendResponse) {
  const requestBody = {
    "contents": [{
      "role": "user",
      "parts": [{
        "text": `Please provide a concise, easy-to-read summary of the following article:\n\n---\n\n${articleText}`
      }]
    }],
    "generationConfig": {
        "temperature": 0.5,
        "topP": 1,
        "topK": 32,
    }
  };

  fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorBody => {
          throw new Error(`API Error ${response.status}: ${errorBody.error.message}`);
        });
      }
      return response.json();
    })
    .then(data => {
      if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
        sendResponse({
          summary: data.candidates[0].content.parts[0].text
        });
      } else {
        const errorMessage = (data.candidates && data.candidates[0].finishReason) ?
          `Summary generation failed. Reason: ${data.candidates[0].finishReason}` :
          "Failed to get a valid summary from the API.";
        sendResponse({
          error: errorMessage
        });
      }
    })
    .catch(error => {
      console.error('Error calling Gemini API:', error);
      sendResponse({
        error: error.message
      });
    });
}

function callGeminiApiForQuestion(question, articleText, sendResponse) {
  const requestBody = {
    "contents": [{
      "role": "user",
      "parts": [{
        "text": `Based on the following article, please answer this question: "${question}"\n\nArticle content:\n---\n\n${articleText}\n\n---\n\nPlease provide a clear and concise answer.`
      }]
    }],
    "generationConfig": {
        "temperature": 0.3,
        "topP": 1,
        "topK": 32,
    }
  };

  fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorBody => {
          throw new Error(`API Error ${response.status}: ${errorBody.error.message}`);
        });
      }
      return response.json();
    })
    .then(data => {
      if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
        sendResponse({
          answer: data.candidates[0].content.parts[0].text
        });
      } else {
        const errorMessage = (data.candidates && data.candidates[0].finishReason) ?
          `Question answering failed. Reason: ${data.candidates[0].finishReason}` :
          "Failed to get a valid answer from the API.";
        sendResponse({
          error: errorMessage
        });
      }
    })
    .catch(error => {
      console.error('Error calling Gemini API for question:', error);
      sendResponse({
        error: error.message
      });
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateSummary') {
    if (request.text) {
      callGeminiApi(request.text, sendResponse);
    } else {
      sendResponse({
        error: "Article text was empty."
      });
    }
    return true;
  } else if (request.action === 'askQuestion') {
    if (request.question && request.articleText) {
      callGeminiApiForQuestion(request.question, request.articleText, sendResponse);
    } else {
      sendResponse({
        error: "Question or article text was missing."
      });
    }
    return true;
  }
});