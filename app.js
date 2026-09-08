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
  function img(state) { const g = window.GENIE_IMAGES || {}; return g[state] || ""; }
  function show(el) { [startScreen, playScreen, confirmScreen, finalScreen].forEach((s) => s.classList.add("hidden")); el.classList.remove("hidden"); }
  function setGenie(state) {
    playGenie.className = "genie " + (state === "thinking" ? "thinking" : state === "confused" ? "confused" : "pop");
    playGenie.src = img(state);
    const start = document.getElementById("start-genie");
    const confirm = document.getElementById("confirm-genie");
    if (start) start.src = img("confused");
    if (confirm) confirm.src = img("solved");
  }
  function startGame() { session = Engine.createSession(); pendingGuess = null; show(playScreen); nextStep(); }
  function nextStep() {
    const live = Engine.remaining(session);
    if (!live.length) { setGenie("confused"); questionEl.textContent = "По этим ответам никого не осталось. Начните заново."; return; }
    if (Engine.shouldGuess(session)) {
      pendingGuess = Engine.topGuess(session);
      if (pendingGuess) { confirmName.textContent = pendingGuess.name; setGenie("solved"); show(confirmScreen); return; }
    }
    currentQuestion = Engine.pickQuestion(session);
    if (!currentQuestion) {
      pendingGuess = Engine.topGuess(session);
      if (pendingGuess) { confirmName.textContent = pendingGuess.name; setGenie("solved"); show(confirmScreen); return; }
      setGenie("confused"); questionEl.textContent = "Признаков больше не осталось."; return;
    }
    const ranks = Engine.ranked(session);
    const gap = ranks[0] && ranks[1] ? ranks[0].score - ranks[1].score : 99;
    setGenie(gap < 1.1 && session.questionCount > 0 ? "confused" : "thinking");
    qCountEl.textContent = "Вопрос " + (session.questionCount + 1);
    questionEl.textContent = currentQuestion.text;
    show(playScreen);
  }
  document.getElementById("btn-start").addEventListener("click", startGame);
  document.getElementById("btn-restart-small").addEventListener("click", startGame);
  document.querySelectorAll(".answers [data-answer]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!session || !currentQuestion) return;
      Engine.applyAnswer(session, currentQuestion.id, btn.dataset.answer);
      nextStep();
    });
  });
  document.getElementById("btn-yes-guess").addEventListener("click", () => { if (!pendingGuess) return; finalName.textContent = pendingGuess.name; show(finalScreen); });
  document.getElementById("btn-no-guess").addEventListener("click", () => { if (!pendingGuess) return; Engine.rejectGuess(session, pendingGuess.id); pendingGuess = null; nextStep(); });
  const start = document.getElementById("start-genie");
  const confirm = document.getElementById("confirm-genie");
  if (start) start.src = img("confused");
  if (confirm) confirm.src = img("solved");
  playGenie.src = img("thinking");
})();
