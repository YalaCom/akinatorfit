(function () {
  const startScreen = document.getElementById("screen-start");
  const playScreen = document.getElementById("screen-play");
  const confirmScreen = document.getElementById("screen-confirm");
  const finalScreen = document.getElementById("screen-final");
  const questionEl = document.getElementById("question");
  const qCountEl = document.getElementById("q-count");
  const playGenie = document.getElementById("play-genie");
  const confirmName = document.getElementById("confirm-name");
  const finalName = document.getElementById("final-name");
  let session = null, currentQuestion = null, pendingGuess = null;
  function show(el) {
    startScreen.classList.add("hidden"); playScreen.classList.add("hidden");
    confirmScreen.classList.add("hidden"); finalScreen.classList.add("hidden");
    el.classList.remove("hidden");
  }
  function setGenie(state) {
    const img = window.GENIE_IMAGES || {};
    const map = {
      confused: img.confused || "assets/genie-confused.jpg",
      thinking: img.thinking || "assets/genie-thinking.jpg",
      solved: img.solved || "assets/genie-solved.jpg"
    };
    playGenie.src = map[state] || map.thinking;
    const start = document.getElementById("start-genie");
    const confirm = document.getElementById("confirm-genie");
    if (start) start.src = map.confused;
    if (confirm) confirm.src = map.solved;
  }
  function startGame() { session = Engine.createSession(); pendingGuess = null; show(playScreen); nextStep(); }
  function nextStep() {
    const live = Engine.remaining(session);
    if (!live.length) { setGenie("confused"); questionEl.textContent = "По текущим ответам никого не осталось. Начните заново."; return; }
    if (Engine.shouldGuess(session)) {
      pendingGuess = Engine.topGuess(session);
      if (pendingGuess) { confirmName.textContent = pendingGuess.name; show(confirmScreen); return; }
    }
    currentQuestion = Engine.pickQuestion(session);
    if (!currentQuestion) {
      pendingGuess = Engine.topGuess(session);
      if (pendingGuess) { confirmName.textContent = pendingGuess.name; show(confirmScreen); return; }
      setGenie("confused"); questionEl.textContent = "Признаков больше не осталось."; return;
    }
    const ranks = Engine.ranked(session);
    const confused = ranks.length > 6 && session.questionCount > 0 && (ranks[0].score - (ranks[1] ? ranks[1].score : 0) < 1.2);
    setGenie(confused ? "confused" : "thinking");
    qCountEl.textContent = "Вопрос " + (session.questionCount + 1);
    questionEl.textContent = currentQuestion.text;
    show(playScreen);
  }
  function onAnswer(answer) { if (!session || !currentQuestion) return; Engine.applyAnswer(session, currentQuestion.id, answer); nextStep(); }
  document.getElementById("btn-start").addEventListener("click", startGame);
  document.getElementById("btn-restart-small").addEventListener("click", startGame);
  document.querySelectorAll(".answers [data-answer]").forEach((btn) => btn.addEventListener("click", () => onAnswer(btn.dataset.answer)));
  document.getElementById("btn-yes-guess").addEventListener("click", () => { if (!pendingGuess) return; finalName.textContent = pendingGuess.name; show(finalScreen); });
  document.getElementById("btn-no-guess").addEventListener("click", () => { if (!pendingGuess) return; Engine.rejectGuess(session, pendingGuess.id); pendingGuess = null; nextStep(); });
  if (window.GENIE_IMAGES) {
    const start = document.getElementById("start-genie");
    const confirm = document.getElementById("confirm-genie");
    if (start) start.src = GENIE_IMAGES.confused;
    if (confirm) confirm.src = GENIE_IMAGES.solved;
    playGenie.src = GENIE_IMAGES.thinking;
  }
})();
