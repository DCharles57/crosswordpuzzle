// Mini "polished" crossword demo (7x7)
// Same 3-file setup. No extra assets required.

const SIZE = 7;

// # = blocked. Letters = solution.
const GRID = [
  "C A T # # # #",
  "A # R # # # #",
  "R A T # # # #",
  "# # # # # # #",
  "# # # D O G #",
  "# # # O # # #",
  "# # # G # # #",
].map(row => row.split(" "));

const CLUES = {
  across: [
    { num: 1, answer: "CAT", clue: "Purr machine." , start:[0,0], dir:"across"},
    { num: 4, answer: "RAT", clue: "Not a mouse, but close.", start:[2,0], dir:"across"},
    { num: 5, answer: "DOG", clue: "Man’s best friend.", start:[4,3], dir:"across"},
  ],
  down: [
    { num: 1, answer: "CAR", clue: "Vehicle (3 letters).", start:[0,0], dir:"down"},
    { num: 2, answer: "TAG", clue: "Label or mark.", start:[0,2], dir:"down"},
    { num: 3, answer: "DOG", clue: "Same word, different direction.", start:[4,3], dir:"down"},
  ]
};

const elGrid = document.getElementById("grid");
const acrossList = document.getElementById("cluesAcross");
const downList = document.getElementById("cluesDown");
const tabs = document.querySelectorAll(".tab");
const statusText = document.getElementById("statusText");
const statusDot = document.getElementById("statusDot");

const checkBtn = document.getElementById("checkBtn");
const revealBtn = document.getElementById("revealBtn");
const resetBtn = document.getElementById("resetBtn");

let cells = []; // {wrap, input, r, c, solution}
let activeClue = null;

function setStatus(text, mode="ok"){
  statusText.textContent = text;
  if(mode === "ok") statusDot.style.background = "#60a5fa";
  if(mode === "good") statusDot.style.background = "#5bffcf";
  if(mode === "bad") statusDot.style.background = "#ff5a8c";
  statusDot.style.boxShadow = `0 0 12px ${getComputedStyle(statusDot).backgroundColor}`;
}

function buildGrid(){
  elGrid.innerHTML = "";
  cells = [];

  // make CSS grid columns match size
  elGrid.style.gridTemplateColumns = `repeat(${SIZE}, var(--cell))`;

  // numbering (simple): number cells that begin an across/down word
  const numMap = Array.from({length: SIZE}, () => Array(SIZE).fill(null));
  let n = 1;

  for(let r=0; r<SIZE; r++){
    for(let c=0; c<SIZE; c++){
      if(GRID[r][c] === "#") continue;

      const startsAcross = (c===0 || GRID[r][c-1]==="#") && (c+1<SIZE && GRID[r][c+1] !== "#");
      const startsDown = (r===0 || GRID[r-1][c]==="#") && (r+1<SIZE && GRID[r+1][c] !== "#");
      if(startsAcross || startsDown){
        numMap[r][c] = n++;
      }
    }
  }

  for(let r=0; r<SIZE; r++){
    for(let c=0; c<SIZE; c++){
      const wrap = document.createElement("div");
      wrap.className = "cell";

      if(GRID[r][c] === "#"){
        wrap.classList.add("block");
        elGrid.appendChild(wrap);
        continue;
      }

      const input = document.createElement("input");
      input.maxLength = 1;
      input.autocomplete = "off";
      input.spellcheck = false;

      const num = numMap[r][c];
      if(num){
        const badge = document.createElement("div");
        badge.className = "num";
        badge.textContent = num;
        wrap.appendChild(badge);
      }

      wrap.appendChild(input);
      elGrid.appendChild(wrap);

      const cell = {wrap, input, r, c, solution: GRID[r][c]};
      cells.push(cell);

      input.addEventListener("focus", () => setActiveCell(r,c));
      input.addEventListener("input", () => {
        input.value = input.value.toUpperCase();
        moveNext(r,c);
      });
      input.addEventListener("keydown", (e) => handleKeys(e, r, c));
    }
  }
}

function cellAt(r,c){
  return cells.find(x => x.r===r && x.c===c) || null;
}

function setActiveCell(r,c){
  cells.forEach(x => x.wrap.classList.remove("active"));
  const cell = cellAt(r,c);
  if(cell) cell.wrap.classList.add("active");
}

function moveNext(r,c){
  // default: move right if possible, else down
  const right = cellAt(r, c+1);
  if(right){ right.input.focus(); return; }
  const down = cellAt(r+1, c);
  if(down){ down.input.focus(); }
}

function handleKeys(e, r, c){
  const key = e.key;

  if(key === "Backspace"){
    const here = cellAt(r,c);
    if(here && here.input.value){
      // erase normally
      return;
    }
    // move back
    const left = cellAt(r, c-1);
    if(left){ e.preventDefault(); left.input.focus(); left.input.value=""; return; }
    const up = cellAt(r-1, c);
    if(up){ e.preventDefault(); up.input.focus(); up.input.value=""; return; }
  }

  const moves = {
    ArrowLeft: [r, c-1],
    ArrowRight:[r, c+1],
    ArrowUp:   [r-1, c],
    ArrowDown: [r+1, c]
  };

  if(moves[key]){
    e.preventDefault();
    const [nr,nc] = moves[key];
    const next = cellAt(nr,nc);
    if(next) next.input.focus();
  }
}

function renderClues(){
  acrossList.innerHTML = "";
  downList.innerHTML = "";

  CLUES.across.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.num}. ${item.clue}`;
    li.dataset.key = `across-${item.num}`;
    li.addEventListener("click", () => selectClue(item));
    acrossList.appendChild(li);
  });

  CLUES.down.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.num}. ${item.clue}`;
    li.dataset.key = `down-${item.num}`;
    li.addEventListener("click", () => selectClue(item));
    downList.appendChild(li);
  });
}

function selectClue(clue){
  activeClue = clue;

  document.querySelectorAll(".clues li").forEach(li => li.classList.remove("active"));
  const key = `${clue.dir}-${clue.num}`;
  const li = document.querySelector(`.clues li[data-key="${key}"]`);
  if(li) li.classList.add("active");

  const [r,c] = clue.start;
  const first = cellAt(r,c);
  if(first) first.input.focus();
  setStatus(`${clue.dir.toUpperCase()} ${clue.num} selected`, "ok");
}

function switchTab(tabName){
  tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tabName));
  acrossList.classList.toggle("active", tabName === "across");
  downList.classList.toggle("active", tabName === "down");
}

tabs.forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));

function check(){
  let correct = 0;
  let filled = 0;

  cells.forEach(cell => {
    const v = cell.input.value.trim().toUpperCase();
    if(v) filled++;
    cell.wrap.classList.remove("good","bad");

    if(!v) return;

    if(v === cell.solution){
      correct++;
      cell.wrap.classList.add("good");
    } else {
      cell.wrap.classList.add("bad");
    }
  });

  if(filled === 0){
    setStatus("Type something first 😄", "ok");
    return;
  }

  if(correct === filled && filled === cells.length){
    setStatus("Perfect! Crossword solved ✅", "good");
  } else {
    setStatus(`Checked: ${correct}/${filled} correct (filled)`, "bad");
  }
}

function reveal(){
  cells.forEach(cell => {
    cell.input.value = cell.solution;
    cell.wrap.classList.remove("bad");
    cell.wrap.classList.add("good");
  });
  setStatus("Revealed 👀", "ok");
}

function reset(){
  cells.forEach(cell => {
    cell.input.value = "";
    cell.wrap.classList.remove("good","bad","active");
  });
  activeClue = null;
  document.querySelectorAll(".clues li").forEach(li => li.classList.remove("active"));
  setStatus("Reset. Ready.", "ok");
}

checkBtn.addEventListener("click", check);
revealBtn.addEventListener("click", reveal);
resetBtn.addEventListener("click", reset);

buildGrid();
renderClues();
switchTab("across");
setStatus("Ready", "ok");

// Auto-select first clue for a nice UX
selectClue(CLUES.across[0]);
