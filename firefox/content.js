(function() {
  const popup = document.createElement('div');
  popup.id = 'summary-popup-container';

  popup.innerHTML = `
    <div id="summary-popup-header" role="banner" aria-label="Summarizer header">
      <div id="summary-title">Article Summarizer</div>
      <div id="header-buttons">
        <button id="summary-popup-minimize" aria-label="Minimize summarizer">−</button>
        <button id="summary-popup-close" aria-label="Close summarizer">×</button>
      </div>
    </div>
    <div id="summary-popup-content" role="region" aria-live="polite">
      <button id="summary-generate-btn" aria-controls="summary-result-area">Generate Summary</button>
      <div id="summary-result-area" hidden></div>
      <div id="question-section" hidden>
        <label for="question-input" class="sr-only">Question about the article</label>
        <input type="text" id="question-input" placeholder="Ask a question about the article...">
        <button id="ask-question-btn">Ask Question</button>
      </div>
      <div id="question-result-area" hidden></div>
    </div>
  `;

  document.body.appendChild(popup);

  const generateBtn = document.getElementById('summary-generate-btn');
  const resultArea = document.getElementById('summary-result-area');
  const closeBtn = document.getElementById('summary-popup-close');
  const minimizeBtn = document.getElementById('summary-popup-minimize');
  const questionSection = document.getElementById('question-section');
  const questionInput = document.getElementById('question-input');
  const askQuestionBtn = document.getElementById('ask-question-btn');
  const questionResultArea = document.getElementById('question-result-area');

  const isMinimized = localStorage.getItem('summaryPopupMinimized') === 'true';
  if (isMinimized) {
    popup.classList.add('minimized');
  }

  closeBtn.addEventListener('click', () => {
    popup.setAttribute('aria-hidden', 'true');
    popup.style.display = 'none';
  });

  minimizeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    popup.classList.add('minimized');
    localStorage.setItem('summaryPopupMinimized', 'true');
  });

  popup.addEventListener('click', (e) => {
    if (popup.classList.contains('minimized')) {
      popup.classList.remove('minimized');
      localStorage.setItem('summaryPopupMinimized', 'false');
    }
  });

  generateBtn.addEventListener('click', () => {
    resultArea.removeAttribute('hidden');
    resultArea.innerText = 'Generating summary, please wait...';
    generateBtn.disabled = true;

    const articleBody = document.querySelector('article.newsletter-post .body.markup');
    if (articleBody) {
      const articleText = articleBody.innerText;
      console.debug('Sending article text to AI for summary:', articleText);
      browser.runtime.sendMessage({ action: 'generateSummary', text: articleText }, response => {
        if (browser.runtime.lastError) {
          resultArea.innerText = 'Error: ' + browser.runtime.lastError.message;
        } else if (response.error) {
          resultArea.innerText = 'Error: ' + response.error;
        } else if (response.summary) {
          resultArea.innerText = response.summary;
          questionSection.removeAttribute('hidden');
        } else {
          resultArea.innerText = 'Failed to receive a summary.';
        }
        generateBtn.disabled = false;
      });
    } else {
      resultArea.innerText = 'Could not find the article content on this page.';
      generateBtn.disabled = false;
    }
  });

  askQuestionBtn.addEventListener('click', () => {
    const question = questionInput.value.trim();
    if (!question) {
      questionResultArea.style.display = 'block';
      questionResultArea.innerText = 'Please enter a question.';
      return;
    }

  questionResultArea.removeAttribute('hidden');
  questionResultArea.innerText = 'Thinking...';
  askQuestionBtn.disabled = true;

    const articleBody = document.querySelector('article.newsletter-post .body.markup');
    if (articleBody) {
      const articleText = articleBody.innerText;
      console.debug('Sending question and article text to AI:', { question, articleText });
      browser.runtime.sendMessage({
        action: 'askQuestion',
        question: question,
        articleText: articleText
      }, response => {
        if (browser.runtime.lastError) {
          questionResultArea.innerText = 'Error: ' + browser.runtime.lastError.message;
        } else if (response.error) {
          questionResultArea.innerText = 'Error: ' + response.error;
        } else if (response.answer) {
          questionResultArea.innerText = response.answer;
          questionInput.value = '';
          questionInput.focus();
        } else {
          questionResultArea.innerText = 'Failed to get an answer.';
        }
        askQuestionBtn.disabled = false;
      });
    } else {
      questionResultArea.innerText = 'Could not find the article content on this page.';
      askQuestionBtn.disabled = false;
    }
  });
})();