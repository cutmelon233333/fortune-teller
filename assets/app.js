/* DELULU FORTUNE OFFICE — no dependencies / no remote API / no storage */
(() => {
  'use strict';
  const data = window.DELULU_DATA;
  if (!data) { console.error('找不到占卜內容，請確認 content/fortunes.js 已載入。'); return; }
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const pick = (items) => items[Math.floor(Math.random() * items.length)];
  let visitor = null;
  let completedRooms = new Set();
  let tarotDrawn = false;
  let fortuneClipboard = '';

  const setText = (selector, value) => { const el = $(selector); if (el) el.textContent = String(value); };
  const show = (selector, visible = true) => { const el = $(selector); if (el) el.hidden = !visible; };

  function resetAppState() {
    visitor = null;
    completedRooms = new Set();
    tarotDrawn = false;
    fortuneClipboard = '';
    $('#intake-form').reset();
    $('#oracle-form').reset();
    $('#energy-form').reset();
    $('#love-form').reset();
    $('#oracle-result').hidden = true;
    $('#oracle-idle').hidden = false;
    $('#tarot-result').hidden = true;
    $('#energy-result').hidden = true;
    $('#love-result').hidden = true;
    $('#copy-status').textContent = '';
    $('#oracle-question').value = '';
    $$('.tarot-card').forEach((button) => { button.disabled = false; button.classList.remove('picked'); });
    updateProgress();
    chooseRoom('oracle', false);
  }

  function updateProgress() {
    setText('#room-progress', `已體驗 ${completedRooms.size} / 4 間`);
    $$('[data-done]').forEach((element) => {
      const done = completedRooms.has(element.dataset.done);
      element.textContent = done ? '✓' : '';
    });
  }
  function markCompleted(room) { completedRooms.add(room); updateProgress(); }

  function chooseRoom(room, shouldScroll = true) {
    if (!['oracle','tarot','energy','love'].includes(room)) return;
    $$('.room-tab').forEach((button) => {
      const active = button.dataset.room === room;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
    ['oracle','tarot','energy','love'].forEach((item) => { show(`#room-${item}`, item === room); });
    if (shouldScroll) $('#room-' + room).scrollIntoView({behavior:'smooth',block:'start'});
  }

  $('#intake-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const nickname = $('#nickname').value.trim();
    if (!nickname) {
      setText('#form-error', '先幫自己取個暱稱吧！宇宙總得知道要叫誰。');
      show('#form-error');
      $('#nickname').focus();
      return;
    }
    if (nickname.length > 16) {
      setText('#form-error', '暱稱最多 16 個字。');
      show('#form-error');
      $('#nickname').focus();
      return;
    }
    show('#form-error', false);
    visitor = {
      nickname, zodiac: $('#zodiac').value,
      mood: $('input[name="mood"]:checked').value,
      interest: $('#interest').value
    };
    setText('#header-nickname', visitor.nickname);
    setText('#welcome-nickname', visitor.nickname);
    setText('#profile-zodiac', `✷ ${visitor.zodiac || '保密星座'}`);
    setText('#profile-mood', `☻ 今天${visitor.mood}`);
    setText('#welcome-subtitle', `今天的心情是「${visitor.mood}」？沒關係，宇宙客服也沒有比較正常。`);
    $('#oracle-category').value = visitor.interest;
    show('#onboarding-screen', false);
    show('#app-screen', true);
    chooseRoom('oracle', false);
    window.scrollTo({top:0,behavior:'instant'});
    $('#welcome-title').focus?.();
  });

  $('#reset-profile').addEventListener('click', () => {
    resetAppState();
    show('#app-screen', false);
    show('#onboarding-screen', true);
    window.scrollTo({top:0,behavior:'instant'});
    $('#nickname').focus();
  });
  $$('.room-tab').forEach((button) => button.addEventListener('click', () => chooseRoom(button.dataset.room)));

  $('#oracle-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!visitor) return;
    const category = $('#oracle-category').value;
    const collection = data.categories[category];
    if (!collection) return;
    const headline = pick(collection.headlines);
    const prediction = pick(collection.predictions);
    const luckyItem = pick(collection.charms);
    const chaosScore = Math.floor(Math.random() * 51) + 49;
    const customQuestion = $('#oracle-question').value.trim().slice(0,90);
    const questionIntro = customQuestion ? `關於「${customQuestion}」，宇宙給你的回覆是：\n` : '';
    const zodiacIntro = visitor.zodiac ? `來自${visitor.zodiac}的${visitor.nickname}，` : `${visitor.nickname}，`;
    const text = `${zodiacIntro}${questionIntro}${prediction}`;
    setText('#oracle-result-headline', headline);
    setText('#oracle-result-text', text);
    setText('#oracle-lucky', `✦ 今日幸運物：${luckyItem}`);
    setText('#oracle-chaos', `✷ 胡說指數：${chaosScore}%`);
    fortuneClipboard = `🔮 超不準 AI 算命事務所\n${headline}\n${text}\n今日幸運物：${luckyItem}\n（純娛樂，並非真正占卜）`;
    setText('#copy-status','');
    show('#oracle-idle', false);
    show('#oracle-result');
    markCompleted('oracle');
  });

  $('#copy-fortune').addEventListener('click', async () => {
    if (!fortuneClipboard) return;
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(fortuneClipboard);
      setText('#copy-status','✓ 已複製！快傳給朋友一起笑。');
    } catch (_) {
      // Useful fallback for file:// and older browsers: present selectable plain text.
      const output = $('#oracle-result-text');
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(output);
      selection.removeAllRanges();
      selection.addRange(range);
      setText('#copy-status','瀏覽器不支援一鍵複製，已選取文字，請手動複製。');
    }
  });

  $$('.tarot-card').forEach((button) => button.addEventListener('click', () => {
    if (!visitor || tarotDrawn) return;
    tarotDrawn = true;
    const card = pick(data.tarot);
    setText('#tarot-card-name', `${card.emoji} ${card.name}`);
    setText('#tarot-card-message', `${visitor.nickname}，${card.message}`);
    setText('#tarot-card-action', card.action);
    $$('.tarot-card').forEach((cardButton) => {
      cardButton.disabled = true;
      if (cardButton === button) cardButton.classList.add('picked');
    });
    show('#tarot-result');
    markCompleted('tarot');
  }));
  $('#tarot-retry').addEventListener('click', () => {
    tarotDrawn = false;
    show('#tarot-result',false);
    $$('.tarot-card').forEach((button) => { button.disabled = false; button.classList.remove('picked'); });
    $$('.tarot-card')[1].focus();
  });

  // Quiz UI is rendered from reusable data. Add new questions in content/fortunes.js.
  function buildQuiz(room) {
    const container = $(`#${room}-form`);
    const {questions} = data.quizzes[room];
    questions.forEach((question,index) => {
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'quiz-question';
      const legend = document.createElement('legend');
      legend.textContent = `Q${index + 1}　${question.title}`;
      fieldset.appendChild(legend);
      const options = document.createElement('div');
      options.className = 'quiz-options';
      question.options.forEach((option, optionIndex) => {
        const label = document.createElement('label');
        label.className = 'quiz-option';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = question.id;
        input.value = String(option.score);
        input.required = true;
        if (optionIndex === 0) input.id = `${question.id}-first`;
        const span = document.createElement('span');
        span.textContent = option.label;
        label.append(input,span);
        options.appendChild(label);
      });
      fieldset.appendChild(options);
      container.appendChild(fieldset);
    });
    const error = document.createElement('p');
    error.className = 'quiz-error';
    error.setAttribute('role','alert');
    error.id = `${room}-error`;
    container.appendChild(error);
    const button = document.createElement('button');
    button.className = 'btn btn-primary quiz-submit';
    button.type = 'submit';
    button.textContent = '揭曉我的荒謬分析 ✨';
    container.appendChild(button);
    container.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!visitor) return;
      let score = 0;
      let missingQuestion = null;
      for (const q of questions) {
        const selected = container.querySelector(`input[name="${q.id}"]:checked`);
        if (!selected) { missingQuestion = q; break; }
        score += Number(selected.value);
      }
      if (missingQuestion) {
        error.textContent = '還有題目沒有回答喔，宇宙需要全部三題！';
        container.querySelector(`input[name="${missingQuestion.id}"]`).focus();
        return;
      }
      error.textContent = '';
      const result = data.quizzes[room].results.find((entry) => score <= entry.max);
      if (!result) return;
      setText(`#${room}-score`, result.emoji);
      setText(`#${room}-level`, result.title);
      setText(`#${room}-message`, `${visitor.nickname}，${result.message}`);
      show(`#${room}-result`);
      markCompleted(room);
      $(`#${room}-result`).scrollIntoView({behavior:'smooth',block:'nearest'});
    });
    $(`#${room}-retry`).addEventListener('click', () => {
      container.reset();
      error.textContent = '';
      show(`#${room}-result`,false);
      const firstInput = container.querySelector('input[type="radio"]');
      if (firstInput) firstInput.focus();
    });
  }
  buildQuiz('energy');
  buildQuiz('love');
})();
