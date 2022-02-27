
import { interval, fromEvent, Observable, from, zip, pipe, animationFrame, ObjectUnsubscribedError} from 'rxjs'
import { map, scan,filter, merge, flatMap, take, concat, startWith, retryWhen} from 'rxjs/operators'

function pong() {
    // Inside this function you will use the classes and functions 
    // from rx.js
    // to add visuals to the svg element in pong.html, animate them, and make them interactive.
    // Study and complete the tasks in observable exampels first to get ideas.
    // Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/ 
    // You will be marked on your functional programming style
    // as well as the functionality that you implement.
    // Document your code! 
  
  // get the svg canvas element
  const svg = document.getElementById('canvas')!;

  // creating the GLOBAL variables
  const 
  WIDTH = Number(svg.getAttribute('width')),   // width of canvas
  HEIGHT = Number(svg.getAttribute('height')),  // height of canvas
  PADDLEWIDTH = WIDTH/60,   // paddle width 
  PADDLEHEIGHT = HEIGHT/8,  // paddle height  
  WIN = 7  // the winning score (i.e. player who get this score win the whole game)

  // create a centre line
  const centreLine = document.createElementNS(svg.namespaceURI, "line")!;
  // attributes for centre line
  centreLine.setAttribute("stroke", "white");
  centreLine.setAttribute("stroke-width", "5");
  centreLine.setAttribute('stroke-height', String(svg.getAttribute('height')));
  centreLine.setAttribute("x1", "300");
  centreLine.setAttribute("y1", "600");
  centreLine.setAttribute("x2", "300");
  centreLine.setAttribute("y2", "0");
  svg.appendChild(centreLine);

  // create a pongBall
  const pongBall = document.createElementNS(svg.namespaceURI,'circle')!;
  // attributes for pongBall
  Object.entries({
    cx: 300, cy: 300,
    r: 5, fill: 'white',
  }).forEach(([key,val])=>pongBall.setAttribute(key,String(val)))
  svg.appendChild(pongBall);
  
  // properties of pongBall
  let speedX = 3;  // speed of ball in x-coordinate
  let speedY = 3;  // speed of ball in y-coordinate
  const angleChanged = -1 * Math.PI / 4;
  const velocityX = speedX * Math.cos(angleChanged);
  const velocityY = speedY * Math.sin(angleChanged);
  let reset = false; 

  // to update the scorew
  let AIscore = 0;
  let PlayerScore = 0;

  // when the pongBall hits the left boundary, reset the ball 
  const updateScorePlayer = interval(0)  // keep streaming
    .pipe(
      filter(_ => Number(pongBall.getAttribute('cx')) < 0 && AIscore < 7 && PlayerScore < 7),
    )
    .subscribe(() => {
      PlayerScore += 1; pongBall.setAttribute('cy', '300');speedX = 1; speedY = 1; reset = true;
    })
    
  // when the pongBall hits the right boundary, reset the ball and AI's score will increase
  const updateScoreAI = interval(0)
    .pipe(
      filter(_ => Number(pongBall.getAttribute('cx')) > WIDTH && AIscore < 7 && PlayerScore < 7),
    )
    .subscribe(() => {
      AIscore += 1; pongBall.setAttribute('cx', '300');speedX = 1; speedY = 1; reset = true; 
    })

  // collision between AI paddle and pongBall
  const collisionAIpaddle = interval(0)
    .pipe(
      filter(_ => (Number(pongBall.getAttribute('cx')) - Number(pongBall.getAttribute('r'))) <= PADDLEWIDTH && Number(pongBall.getAttribute('cx')) - Number(pongBall.getAttribute('r'))> PADDLEWIDTH+speedX)
    )
    .subscribe(() => {
      Number(pongBall.getAttribute('cy'))>= Number(aiPaddle.getAttribute('y')) && Number(pongBall.getAttribute('cy')) <= Number(aiPaddle.getAttribute('y'))+PADDLEHEIGHT ? speedX = -velocityY : null
    })

  // collision between user's paddle and pongBall
  const collisionPlayerPaddle = interval(0)
    .pipe(
      filter(_ => (Number(pongBall.getAttribute('cx')) +  Number(pongBall.getAttribute('r'))) < WIDTH-PADDLEWIDTH+speedX && (Number(pongBall.getAttribute('cx'))+Number(pongBall.getAttribute('r')))>= WIDTH-PADDLEWIDTH)
    )
    .subscribe(() => {
      Number(pongBall.getAttribute('cy')) >= Number(userPaddle.getAttribute('y')) && Number(pongBall.getAttribute('cy')) <= Number(userPaddle.getAttribute('y'))+PADDLEHEIGHT ? speedX = -velocityX: null;
    }) 

  // movement of pongball 
  // when the pongBall hits the top and bottom boundaries, it will bounce (by negating) into different direction
  const animate = interval(0)
    .pipe(
        map(() => String(1 + Number(pongBall.getAttribute('cx')))),
    )
    .subscribe(()=> {
      Number(pongBall.getAttribute('cy')) > HEIGHT || Number(pongBall.getAttribute('cy')) < 0 ? speedY = -speedY : {}

      // reset ball to start from the left boundary 
      if (reset) {
        pongBall.setAttribute('cx', String(PADDLEWIDTH))
        pongBall.setAttribute('cy', String(Math.random()*HEIGHT))
        reset = false
      }
      // update ball: move the ball by calculated on x-coordinate and y-coordinate separately
      else{
        pongBall.setAttribute('cx', String(Number(pongBall.getAttribute('cx'))+speedX))
        pongBall.setAttribute('cy', String(Number(pongBall.getAttribute('cy'))+speedY))
      }
    })

  // to stop the game when winner is indicated 
  const stopGame = interval(0)
    .pipe(
      map((_) => ({x:AIscore, y:PlayerScore})),   // map x and y to ai's score and player's score 
      // unsubscribe animate when player or AI get 7 points 
      map(({x,y}) => AIscore >= WIN && AIscore > PlayerScore ? animate.unsubscribe() 
                                    : PlayerScore >= WIN && PlayerScore > AIscore ? animate.unsubscribe() : null) 
    )
    .subscribe(() => {
      map(({x,y}) => AIscore >= WIN && AIscore > PlayerScore ? animate.unsubscribe()
                                    : PlayerScore >= WIN && PlayerScore > AIscore ? animate.unsubscribe() : null)
    })

  // create an AI paddle
  const aiPaddle = document.createElementNS(svg.namespaceURI, 'rect')!;
  Object.entries({
    x: 10, y: Number(svg.getAttribute('height'))/2,
    width: PADDLEWIDTH,
    height: PADDLEHEIGHT,
    fill: 'red',
    score: 0,
  }).forEach(([key,val])=>aiPaddle.setAttribute(key,String(val)))
  svg.appendChild(aiPaddle)

  // wall collision between ai paddle and wall
  Number(aiPaddle.getAttribute('y')) > HEIGHT || Number(aiPaddle.getAttribute('y')) < 0 
        ? aiPaddle.setAttribute('y', String(-(speedY+Number(aiPaddle.getAttribute('y')))))
        : null;

  // AI paddle that follows the pongBall 
  const AI = interval(5)
    .pipe(
      map(() => String(10 + Number(aiPaddle.getAttribute('x'))))
    )
    .subscribe(() => {
      // let ai paddle follow the ball by setting the cooirdinates of paddle same as pongBall
      aiPaddle.setAttribute('y', String(Number(pongBall.getAttribute('cy'))+ speedY));    
    })   

  // create an user paddle (player)
  const userPaddle = document.createElementNS(svg.namespaceURI, 'rect')!;
  Object.entries({
    x: 580, y: Number(svg.getAttribute('width')) / 2 - PADDLEHEIGHT / 2,
    width: PADDLEWIDTH, height: PADDLEHEIGHT,
    fill: 'blue',
  }).forEach(([key,val])=>userPaddle.setAttribute(key,String(val)))
  svg.appendChild(userPaddle);
  
  // movement control by user (keyboard) using arrow up and arrow down (code refer from observableexample.ts from week 4 & 5)
  const arrowUp = fromEvent<KeyboardEvent>(document, 'keydown')
    .pipe(
    filter((e) => e.keyCode === 38),    //  ArrowUP to move the paddle up
    map(() => String(Number(userPaddle.getAttribute('y'))-50)),
    map((val)=>()=>userPaddle.setAttribute('y', val))
  ),
  arrowDown = fromEvent<KeyboardEvent>(document, "keydown")
  .pipe(
    filter((e)=>e.keyCode===40),        // press ArrowDown to move the paddle down 
    map(()=>String(50 + Number(userPaddle.getAttribute('y')))),
    map((val)=>()=>userPaddle.setAttribute('y', val))
  ),
  m = arrowUp.pipe(merge(arrowDown))
    .subscribe(f => f());

  // indicates scores for AI and player
  // score for AI
  const scoreAI = document.createElementNS(svg.namespaceURI, "text")!;
  // attributes for AI's score
  Object.entries({
    textContext: '0', fill: 'white',
    x: 180, y : 100,
  }).forEach(([key,val])=>scoreAI.setAttribute(key,String(val)))
  scoreAI.setAttribute('font-size', '50px');  
  svg.appendChild(scoreAI);

  // show the AI's score
  const AIscoreBoard = interval(0)
      .subscribe(() => {
        scoreAI.textContent = String(AIscore);
      })

  // create score display for player
  const scoreUser = document.createElementNS(svg.namespaceURI, "text")!;
  //attributes for user's score
  Object.entries({
    textContext: '0', fill: 'white',
    x: 400, y : 100,
  }).forEach(([key,val])=>scoreUser.setAttribute(key,String(val)))
  scoreUser.setAttribute('font-size', '50px');
  svg.appendChild(scoreUser);

  // show the player's score
  const PlayerScoreboard = interval(0)
    .subscribe(() => {
      scoreUser.textContent = String(PlayerScore);
    })
  
  // create text for 'gameOver' || 'YOU WIN'
  const result = document.createElementNS(svg.namespaceURI, "text")!;
  // attributes for result
  Object.entries({
    textContext: '', fill: 'red',
    x: 150, y : 300,
  }).forEach(([key,val])=>result.setAttribute(key,String(val)))
  result.setAttribute('font-size', '50px');
  svg.appendChild(result);

  // indicate the winner (first to get 7 points)
  const displayResult = interval(0)
    .pipe(
      map((_) => ({x:AIscore, y:PlayerScore})),
      map(({x,y}) => AIscore >= WIN && AIscore > PlayerScore ? result.textContent = 'Game Over!'
                                    : PlayerScore >= WIN && PlayerScore > AIscore ? result.textContent = 'YOU WIN!' : "")  
    )
    .subscribe(() => {
      map(({x,y}) => AIscore >= WIN && AIscore > PlayerScore ? result.textContent = 'Game Over!'
                                    : PlayerScore >= WIN && PlayerScore > AIscore ? result.textContent = 'YOU WIN!' : "") 
    })

  // Display 'press spaceBar to begin' text
  const begin = document.createElementNS(svg.namespaceURI, "text")!;
    begin.textContent = 'Press SPACEBAR to next round';
    begin.setAttribute('fill', 'white');
    begin.setAttribute('x', '10');
    begin.setAttribute('y', '30');
    begin.setAttribute('font-size', '20px');
    svg.appendChild(begin);

  // Intructions to control the paddle
  const intruction = document.createElementNS(svg.namespaceURI, 'text')!;
    intruction.textContent = 'ArrowUP & ArrowDown to control paddle';
    intruction.setAttribute('fill', 'white');
    intruction.setAttribute('x', '220');
    intruction.setAttribute('y', '580');
    intruction.setAttribute('font-size', '20px');
    svg.appendChild(intruction);

  // press spaceBar to restart for the next round 
  const restartGame = fromEvent<KeyboardEvent>(document,'keydown')
    restartGame.pipe(
        filter((e) => e.keyCode === 32),   // press spaceBar
        filter(_ => AIscore === WIN || PlayerScore === WIN),
    )
    // reset all the attributes back to their initial state
    .subscribe(() => {
      result.textContent = "";
      pongBall.setAttribute('cx', '300');
      pongBall.setAttribute('cy', '300');
      AIscore = 0;
      PlayerScore = 0;
      userPaddle.setAttribute('x', '580');
      userPaddle.setAttribute('y', String(Number(svg.getAttribute('width')) / 2 - PADDLEHEIGHT / 2));
      aiPaddle.setAttribute('x','10');
      aiPaddle.setAttribute('y', String(Number(svg.getAttribute('height'))/2));
    })
    stopGame.unsubscribe();  // restart the game by unsubscribe stop game after one round finishes
}

  // the following simply runs your pong function on window load.  Make sure to leave it in place.
  if (typeof window != 'undefined')
    window.onload = ()=>{
      pong();
    }
  
