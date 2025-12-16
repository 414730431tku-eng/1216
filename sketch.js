let spriteSheetStop, spriteSheetWalk, spriteSheetJump;
let framesStop = [];
let framesWalk = [];
let framesJump = [];
const NUM_FRAMES_STOP = 3;
const FRAME_DURATION_STOP = 200; // ms per frame for stop sprite

const NUM_FRAMES_WALK = 6;
const FRAME_DURATION_WALK = 100; // ms per frame for walk sprite

const NUM_FRAMES_JUMP = 3;
const FRAME_DURATION_JUMP = 300; // ms per frame for jump sprite

// Animation control
let playing = true; // 自動播放
let currentFrameStop = 0;
let currentFrameWalk = 0;
let currentFrameJump = 0;
let lastUpdateStop = 0;
let lastUpdateWalk = 0;
let lastUpdateJump = 0;

// 狀態管理
let isWalking = false; // 是否正在走路
let isJumping = false; // 是否正在跳跳
let upKeyPressed = false; // 追蹤上鍵是否被按住
let characterX = 0; // 角色 X 位置，0 表示畫布中央
let characterY = 0; // 角色 Y 位置，0 表示畫布中央
let characterDirection = 1; // 1 表示向右，-1 表示向左
const keys = {}; // 追蹤按鍵狀態

// 人物縮放倍率（1 = 原始大小，2 = 2 倍）
const CHARACTER_SCALE = 1.8; // 可自行調整放大倍數

// 箭頭鍵的 keyCode
const RIGHT_KEY_CODE = 39;
const LEFT_KEY_CODE = 37;
const UP_KEY_CODE = 38;
const MOVE_SPEED = 3; // 每幀移動像素
const JUMP_HEIGHT = 80; // 最大跳躍高度
// Attack
const SPACE_KEY_CODE = 32;
const NUM_FRAMES_ATTACK = 7;
const FRAME_DURATION_ATTACK = 80; // ms per frame for attack
const ATTACK_MOVE = 6; // 每幀攻擊時移動像素 (會乘以 CHARACTER_SCALE)

let spriteSheetAttack;
let framesAttack = [];
let currentFrameAttack = 0;
let lastUpdateAttack = 0;
let isAttacking = false;
// 延遲回到 stop 的設定
let stopReturnPending = false;
let stopReturnEndTime = 0;
const STOP_RETURN_DELAY = 800; // ms，恢復到 stop 前的延遲
let lastAction = 'stop'; // 'attack' | 'jump' | 'stop'

function preload() {
  spriteSheetStop = loadImage('角色1/stop/stop all.png');
  spriteSheetWalk = loadImage('角色1/walk/walk all.png');
  spriteSheetJump = loadImage('角色1/jump/jump all.png');
  spriteSheetAttack = loadImage('角色1/attack/attack all.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noSmooth();
  // 初始化時間
  lastUpdateStop = millis();
  lastUpdateWalk = millis();

  if (spriteSheetStop) {
    const frameWfStop = spriteSheetStop.width / NUM_FRAMES_STOP;
    const frameHStop = spriteSheetStop.height;
    for (let i = 0; i < NUM_FRAMES_STOP; i++) {
      const sx = Math.round(i * frameWfStop);
      const sw = Math.round(frameWfStop);
      framesStop[i] = spriteSheetStop.get(sx, 0, sw, frameHStop);
    }
    console.log('Stop frames loaded:', framesStop.length);
  } else {
    console.log('spriteSheetStop failed to load');
  }

  if (spriteSheetWalk) {
    const frameWfWalk = spriteSheetWalk.width / NUM_FRAMES_WALK;
    const frameHWalk = spriteSheetWalk.height;
    for (let i = 0; i < NUM_FRAMES_WALK; i++) {
      const sx = Math.round(i * frameWfWalk);
      const sw = Math.round(frameWfWalk);
      framesWalk[i] = spriteSheetWalk.get(sx, 0, sw, frameHWalk);
    }
    console.log('Walk frames loaded:', framesWalk.length, 'sprite width:', spriteSheetWalk.width);
  } else {
    console.log('spriteSheetWalk failed to load');
  }

  if (spriteSheetJump) {
    const frameWfJump = spriteSheetJump.width / NUM_FRAMES_JUMP;
    const frameHJump = spriteSheetJump.height;
    for (let i = 0; i < NUM_FRAMES_JUMP; i++) {
      const sx = Math.round(i * frameWfJump);
      const sw = Math.round(frameWfJump);
      framesJump[i] = spriteSheetJump.get(sx, 0, sw, frameHJump);
    }
    console.log('Jump frames loaded:', framesJump.length, 'sprite width:', spriteSheetJump.width);
  } else {
    console.log('spriteSheetJump failed to load');
  }

  if (spriteSheetAttack) {
    const frameWfAttack = spriteSheetAttack.width / NUM_FRAMES_ATTACK;
    const frameHAttack = spriteSheetAttack.height;
    for (let i = 0; i < NUM_FRAMES_ATTACK; i++) {
      const sx = Math.round(i * frameWfAttack);
      const sw = Math.round(frameWfAttack);
      framesAttack[i] = spriteSheetAttack.get(sx, 0, sw, frameHAttack);
    }
    console.log('Attack frames loaded:', framesAttack.length, 'sprite width:', spriteSheetAttack.width);
  } else {
    console.log('spriteSheetAttack failed to load');
  }
}

function keyPressed() {
  // 空白鍵觸發攻擊（只在非攻擊中時觸發）
  if (keyCode === SPACE_KEY_CODE && !isAttacking) {
    isAttacking = true;
    lastUpdateAttack = millis();
    currentFrameAttack = 0;
    lastAction = 'attack';
    return false;
  }
  if (keyCode === RIGHT_KEY_CODE) {
    isWalking = true;
    characterDirection = 1; // 向右
    lastUpdateWalk = millis();
    currentFrameWalk = 0;
    return false;
  } else if (keyCode === LEFT_KEY_CODE) {
    isWalking = true;
    characterDirection = -1; // 向左
    lastUpdateWalk = millis();
    currentFrameWalk = 0;
    return false;
  } else if (keyCode === UP_KEY_CODE && !upKeyPressed) {
    // 只在第一次按下時觸發跳躍
    upKeyPressed = true;
    isJumping = true;
    lastUpdateJump = millis();
    currentFrameJump = 0;
    lastAction = 'jump';
    return false;
  }
}

function keyReleased() {
  if (keyCode === RIGHT_KEY_CODE || keyCode === LEFT_KEY_CODE) {
    isWalking = false;
    currentFrameStop = 0;
    lastUpdateStop = millis();
    return false;
  } else if (keyCode === UP_KEY_CODE) {
    upKeyPressed = false; // 重置上鍵狀態
    return false;
  }
}

function draw() {
  // 全畫面背景色 #ffc2d1
  background('#ffc2d1');

  // 若精靈還沒處理好就跳過
  if (framesStop.length === 0 && framesWalk.length === 0 && framesJump.length === 0) {
    return;
  }

  const now = millis();
  
  // 只有在 playing 時才推進影格索引
  if (playing) {
    // 攻擊優先
    if (isAttacking && framesAttack.length > 0) {
      const elapsedAttack = now - lastUpdateAttack;
      if (elapsedAttack >= FRAME_DURATION_ATTACK) {
        const stepsAttack = floor(elapsedAttack / FRAME_DURATION_ATTACK);
        currentFrameAttack = (currentFrameAttack + stepsAttack) % framesAttack.length;
        lastUpdateAttack += stepsAttack * FRAME_DURATION_ATTACK;
      }
      // 攻擊期間不移動角色（僅顯示攻擊動畫，面向維持原來方向）
      // 攻擊播完後啟動延遲回到 stop（保留最後一幀）
      if (currentFrameAttack >= NUM_FRAMES_ATTACK - 1) {
        isAttacking = false;
        currentFrameAttack = NUM_FRAMES_ATTACK - 1; // 保留最後一幀
        stopReturnPending = true;
        stopReturnEndTime = now + STOP_RETURN_DELAY;
      }
    } else if (isJumping && framesJump.length > 0) {
      const elapsedJump = now - lastUpdateJump;
      if (elapsedJump >= FRAME_DURATION_JUMP) {
        const stepsJump = floor(elapsedJump / FRAME_DURATION_JUMP);
        currentFrameJump = (currentFrameJump + stepsJump) % framesJump.length;
        lastUpdateJump += stepsJump * FRAME_DURATION_JUMP;
      }
      
      // 計算跳躍的 Y 位置（拋物線運動）
      const jumpProgress = currentFrameJump / NUM_FRAMES_JUMP;
      // 使用正弦波計算平滑的上下運動
      characterY = -JUMP_HEIGHT * sin(jumpProgress * PI);
      
      // 跳躍動畫播完後啟動延遲回到 stop（保留最後一幀）
      if (currentFrameJump >= NUM_FRAMES_JUMP - 1) {
        isJumping = false;
        currentFrameJump = NUM_FRAMES_JUMP - 1; // 保留最後一幀
        stopReturnPending = true;
        stopReturnEndTime = now + STOP_RETURN_DELAY;
      }
      
    } else if (isWalking && framesWalk.length > 0) {
      const elapsedWalk = now - lastUpdateWalk;
      if (elapsedWalk >= FRAME_DURATION_WALK) {
        const stepsWalk = floor(elapsedWalk / FRAME_DURATION_WALK);
        currentFrameWalk = (currentFrameWalk + stepsWalk) % framesWalk.length;
        lastUpdateWalk += stepsWalk * FRAME_DURATION_WALK;
      }
      // 根據方向移動角色（移動速度會依縮放倍率放大）
      characterX += MOVE_SPEED * CHARACTER_SCALE * characterDirection;
      characterY = 0; // 走路時保持在地面
    } else if (!isWalking && !isJumping && framesStop.length > 0) {
      const elapsedStop = now - lastUpdateStop;
      if (elapsedStop >= FRAME_DURATION_STOP) {
        const stepsStop = floor(elapsedStop / FRAME_DURATION_STOP);
        currentFrameStop = (currentFrameStop + stepsStop) % framesStop.length;
        lastUpdateStop += stepsStop * FRAME_DURATION_STOP;
      }
      characterY = 0; // 停止時保持在地面
    }
  }

  // 根據狀態選擇要顯示的精靈
  let framesToDisplay = [];
  let currentFrame = 0;
  
  if (isAttacking && framesAttack.length > 0) {
    framesToDisplay = framesAttack;
    currentFrame = currentFrameAttack;
  } else if (isJumping && framesJump.length > 0) {
    framesToDisplay = framesJump;
    currentFrame = currentFrameJump;
  } else if (isWalking && framesWalk.length > 0) {
    framesToDisplay = framesWalk;
    currentFrame = currentFrameWalk;
  } else if (framesStop.length > 0) {
    framesToDisplay = framesStop;
    currentFrame = currentFrameStop;
  }

  // 畫布中央顯示精靈動畫
  if (framesToDisplay.length > 0) {
    const idxFrame = currentFrame % framesToDisplay.length;
    const imgFrame = framesToDisplay[idxFrame];
    if (!imgFrame) {
      return;
    }
    const dw = imgFrame.width * CHARACTER_SCALE;
    const dh = imgFrame.height * CHARACTER_SCALE;
    
    // 界限檢查：使用當前影格寬度來限制角色移動範圍
    const halfW = dw / 2;
    const minX = -width / 2 + halfW + 10;
    const maxX = width / 2 - halfW - 10;
    characterX = constrain(characterX, minX, maxX);

    // 根據方向翻轉圖片並繪製（於中心位置加上 vertical 偏移）
    push();
    translate(width / 2 + characterX, height / 2 + characterY);
    scale(characterDirection, 1); // 向左時水平翻轉
    image(imgFrame, -dw / 2, -dh / 2, dw, dh);
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
