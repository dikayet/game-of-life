// * VARIABLES
const rows = 30;
const cols = 50;
const speed = 300;
let mousedown = false;
let unselectCellMode = false;
let intervalRef = null;
let randomizeMode = true;
let isPlaying = false;
let isPausedOnHover = false;
let iteration = 0;
let gridArr = Array(rows).fill().map(el => Array(cols).fill(false));
let historyArr = [];

// * DOM REFS
// Grid
const grid = document.getElementById('grid');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const iterationNumEl = document.getElementById('iterationNum');
// Details
const details = document.getElementById('details');
const detailsOpenBtn = document.getElementById('detailsOpenBtn');
const detailsCloseBtn = document.getElementById('detailsCloseBtn');

// * HELPER FUNCTIONS
const toggleDisabledClass = (btns) => {
  btns.forEach(btn => {
    if (btn[1]) {
      btn[0].classList.add('disabled');
    } else if(btn[1] === false) {
      btn[0].classList.remove('disabled');
    }
  });
}

const noCellsActive = arr => arr.every(row => row.every(cell => cell === false));

// * LOGIC
const renderArr = arr => {
  const newGrid = document.createElement('div');
  arr.forEach((row, r) => {
    row.forEach((cell, c) => {
      let cellEl = document.createElement('div');
      cellEl.classList.add('cell');
      if(arr[r][c]) cellEl.classList.add('active');
      cellEl.dataset.c = c;
      cellEl.dataset.r = r;
      newGrid.appendChild(cellEl);
    });
  });
  gridArr = arr;
  grid.innerHTML = newGrid.innerHTML;
}

const selectCells = (e) => {
  if ((e.target.dataset.r && mousedown)){
    const el = e.target;
    let { r, c } = el.dataset;
    if(historyArr.length > 0){
      historyArr = [];
      toggleDisabledClass([[prevBtn, true]])
    }
    if (unselectCellMode){
      el.classList.remove('active');
      gridArr[r][c] = false;
      if (noCellsActive(gridArr)){
        if (iteration === 0) toggleStartBtn(false);
        toggleDisabledClass([
          [playBtn, iteration === 0 ? false : true],
          [resetBtn, iteration === 0 ? true : null],
          [nextBtn, true]
        ]);
      }
    } else {
      if (noCellsActive(gridArr)) {
        toggleStartBtn();
        toggleDisabledClass([
          [resetBtn, false],
          [nextBtn, false],
          [playBtn, false]
        ]);
        randomizeMode = false;
      }
      el.classList.add('active');
      gridArr[r][c] = true;
    }
  }
}

const updateIteration = (mode) => {
  if(mode === '+'){
    iteration++;
  } else if(mode === '-') {
    iteration--;
  } else if(mode === 'reset'){
    iteration = 0;
  }
  iterationNumEl.innerHTML = iteration;
}

const playRound = () => {
  const a = gridArr;
  const changedIds = [];
  let noChangesMade = true;
  let iterationHasActiveCells = false;
  let newArr = a.map((row, r) => {
    return row.map((cell, c) => {
      if (randomizeMode){
        let cellValue = Math.random() > .85 ? true : false
        if (cellValue) iterationHasActiveCells = true;
        return cellValue;
      } else {
        let count = 0;
        let _id = r + '_' + c;
        if (a[r][c - 1]) count++;
        if (a[r][c + 1]) count++;
        if (a[r - 1]) {
          if (a[r - 1][c - 1]) count++;
          if (a[r - 1][c]) count++;
          if (a[r - 1][c + 1]) count++;
        }
        if (a[r + 1]) {
          if (a[r + 1][c - 1]) count++;
          if (a[r + 1][c]) count++;
          if (a[r + 1][c + 1]) count++;
        }
        if (cell && (count < 2 || count > 3)) {
          changedIds.push(_id);
          noChangesMade = false;
          return false;
        } 
        if (!cell && count === 3){
          changedIds.push(_id);
          noChangesMade = false;
          iterationHasActiveCells = true;
          return true;
        }
        if (cell) iterationHasActiveCells = true;
        return cell;
      }
    })
  });
  renderArr(newArr);
  if(randomizeMode){
    randomizeMode = false;
    return;
  }
  updateIteration('+'); 
  if (changedIds.length > 0 && !noChangesMade) historyArr.push(changedIds);
  if (historyArr.length > 49) historyArr.shift();
  if (noChangesMade || !iterationHasActiveCells) {
    pause();
    toggleDisabledClass([
      [nextBtn, true],
      [playBtn, true]
    ]);
    return;
  }
  toggleDisabledClass([[prevBtn, !isPlaying ? false : null]]);
}

const toggleStartBtn = (bool = true) => {
  if (bool){
    playBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
      <span>Play</span>
    `;
  } else {
    playBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="9" r="1.75" />
        <circle cx="15.5" cy="15.5" r="1.75" />
      </svg>
      <span>Randomize</span>
  
    `;
  }
}

const next = () => {
  if(isPlaying || randomizeMode) return;
  playRound();
}

const prev = () => {
  if(isPlaying) return;
  if (historyArr.length < 1) return;
  let newArr = [...gridArr];
  let prevGridEmpty = noCellsActive(gridArr);
  historyArr[historyArr.length - 1].forEach(id => {
    let [ r, c ] = id.split('_');
    newArr[r][c] = gridArr[r][c] ? false : true;
  });
  if (historyArr.length > 0) {
    toggleDisabledClass([[prevBtn, historyArr.length === 1 ? true : null]]);
    updateIteration('-');
    historyArr.pop();
    if (!noCellsActive(newArr) && prevGridEmpty) {
      toggleDisabledClass([
        [playBtn, false],
        [nextBtn, false],
      ]);
    }
  }
  renderArr(newArr);
}

const play = () => {
  if(randomizeMode){
    toggleStartBtn();
    toggleDisabledClass([
      [nextBtn, false],
      [resetBtn, false]
    ]);
    return playRound();
  }
  if (!intervalRef){
    isPlaying = true;
    toggleDisabledClass([[playBtn, true]])
    intervalRef = setInterval(() => {
      playRound();
    }, speed);
    toggleDisabledClass([
      [pauseBtn, false],
      [resetBtn, false],
      [nextBtn, true],
      [prevBtn, true]
    ]);
  }
}

const pause = () => {
  if(intervalRef) clearInterval(intervalRef);
  toggleDisabledClass([
    [pauseBtn, true],
    [playBtn, false],
    [nextBtn, false],
    [prevBtn, historyArr.length > 0 ? false : null]
  ]);
  intervalRef = null;
  isPlaying = false;
  isPausedOnHover = false;
}

const reset = () => {
  pause();
  let arr = Array(rows).fill().map(el => Array(cols).fill(false));
  renderArr(arr);
  updateIteration('reset');
  randomizeMode = true;
  toggleStartBtn(false)
  toggleDisabledClass([
    [nextBtn, true],
    [prevBtn, true],
    [resetBtn, true]
  ]);
  isPlaying = false;
  isPaused = false;
  gridArr = arr;
  historyArr = [];
}

// * LISTENERS
grid.addEventListener('mousedown', e => {
  mousedown = true;
  if (e.target.classList.contains('active')) unselectCellMode = true;
  selectCells(e);
  if(isPlaying){
    pause();
    isPausedOnHover = true;
  }
});
document.addEventListener('mouseup', () => {
  mousedown = false;
  unselectCellMode = false;
  if (isPausedOnHover) play();
});
grid.addEventListener('mouseover', selectCells);
playBtn.addEventListener('click', play);
pauseBtn.addEventListener('click', pause);
resetBtn.addEventListener('click', reset);
nextBtn.addEventListener('click', next);
prevBtn.addEventListener('click', prev);

detailsOpenBtn.addEventListener('click', () => {
  details.style.display = 'block';
  if (details.classList.contains('hide')){
    details.classList.remove('hide');
  }
  details.classList.add('show');
});
detailsCloseBtn.addEventListener('click', () => {
  details.classList.remove('show');
  details.classList.add('hide');
  setTimeout(() => {
    details.style.display = 'none';
  }, 700);
});

// * INIT CALLING
renderArr(gridArr);