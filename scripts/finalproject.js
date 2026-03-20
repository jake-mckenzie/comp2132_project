// UI UTILITIES
// Removes the "active" class from all buttons in a list, then applies it to the selected button.
function setActive(buttons, active)
{    
    buttons.forEach(b => b.classList.remove("active")); // array of button elements to clear    
    if (active) active.classList.add("active"); // button that should receive the active highlight
}

// Shows either the play button or pause button depending on whether the animation is currently running.
function togglePlayPause(running, playBtn, pauseBtn)
{    
    playBtn.classList.toggle("hide", running); // boolean indicating animation state
    pauseBtn.classList.toggle("hide", !running); // boolean indicating animation state
}


// ANIMATION ENGINE
// Reusable animation loop controller for both the carousel and Pacman
class Animator
{
    constructor(loop, playBtn, pauseBtn)
    {        
        this.loop = loop; // function to run every frame        
        this.playBtn = playBtn; // button used to start animation        
        this.pauseBtn = pauseBtn; // button used to stop animation        
        this.running = false;// tracks whether animation is active        
        this.frame = null; // stores requestAnimationFrame ID        
        this.lastTime = 0; // timestamp of previous frame
        togglePlayPause(false, playBtn, pauseBtn);
    }

    // Begins the animation loop.
    start()
    {
        if (!this.running)
        {
            this.running = true;            
            this.lastTime = performance.now(); // record time so delta can be calculated            
            this.frame = requestAnimationFrame(this.animate.bind(this)); // start animation frame cycle
        }

        togglePlayPause(true, this.playBtn, this.pauseBtn);
    }

    // Stops the animation loop.
    stop()
    {
        this.running = false;
        cancelAnimationFrame(this.frame);
        togglePlayPause(false, this.playBtn, this.pauseBtn);
    }

    // Internal frame loop that calculates time delta
    // and calls the supplied animation function.
    animate(time)
    {
        if (!this.running) return;        
        const delta = (time - this.lastTime) / 1000; // seconds since last frame
        this.lastTime = time;        
        this.loop(delta); // execute animation logic        
        this.frame = requestAnimationFrame(this.animate.bind(this)); // request next frame
    }

    // Returns current animation state.
    isRunning(){return this.running;}
}

// PACMAN GAME
// Controls movement, direction, controls, and collision for the pacman animation.
class PacmanGame
{
    constructor(config)
    {        
        this.display = config.display; // display - clickable game display area        
        this.container = config.container; // container - movement boundary area        
        this.model = config.model; // model - Pac-Man image element        
        this.playImg = config.playImg; // playImg - animated Pac-Man sprite        
        this.pauseImg = config.pauseImg; // pauseImg - static Pac-Man sprite        
        this.arrowButtons = config.arrows;// arrowButtons - direction control buttons

        // animation engine for movement
        this.animator =
            new Animator((delta) => this.move(delta), config.playBtn, config.stopBtn);        
        this.x = 0; // horizontal position        
        this.y = 0; // vertical position        
        this.dx = 1; // horizontal movement direction        
        this.dy = 0; // vertical movement direction        
        this.nextDirection = null; // queued direction change        
        this.speed = 120; // pixels per second        
        this.started = false; // tracks first start state

        // Defines movement vectors and CSS classes for each direction.
        this.directionMap =
        {
            up: { dx: 0, dy: -1, class: "pacman-face-up" },
            down: { dx: 0, dy: 1, class: "pacman-face-down" },
            left: { dx: -1, dy: 0, class: "pacman-face-left" },
            right: { dx: 1, dy: 0, class: "pacman-face-right" }
        };

        this.model.className = "pacman-face-right";
        this.model.src = this.pauseImg;
        this.updateContainerBounds();
        window.addEventListener("resize", () => this.updateContainerBounds());
        this.initControls();
    }

    // Calculates movement limits based on container size.
    updateContainerBounds()
    {
        const rect = this.container.getBoundingClientRect();       
        this.maxX = rect.width - this.model.offsetWidth; // right boundary        
        this.maxY = rect.height - this.model.offsetHeight; // bottom boundary
    }

    // Connects UI buttons and keyboard controls.
    initControls()
    {
        Object.entries(this.arrowButtons).forEach(([dir, btn]) =>
        {
            btn.onclick = () => this.queueDirection(dir);
        });

        this.animator.playBtn.onclick = () => this.start();
        this.animator.pauseBtn.onclick = () => this.stop();
        this.display.onclick = () =>
        {
            this.animator.isRunning() ? this.stop() : this.start();
        };

        document.addEventListener("keydown", e => this.handleKeys(e));
    }

    // Starts the Pac-Man movement animation.
    start()
    {
        this.nextDirection = null;

        if (!this.started)
        {
            this.started = true;
            setActive(
                Object.values(this.arrowButtons),
                this.arrowButtons.right
            );
        }

        this.model.src = this.playImg;
        this.animator.start();
    }

    // Stops Pac-Man movement.
    stop()
    {
        this.model.src = this.pauseImg;
        this.animator.stop();
    }

    // Stores the next direction to be applied on the next animation frame.
    queueDirection(direction)
    {
        this.nextDirection = direction;
        setActive(
            Object.values(this.arrowButtons),
            this.arrowButtons[direction]
        );

        if (!this.animator.isRunning())
        {
            this.start();
            this.setDirection(direction);
            this.nextDirection = null;
        }
    }

    // Applies a direction vector and updates pacman img orientation.
    setDirection(direction)
    {
        const dir = this.directionMap[direction];

        this.dx = dir.dx;
        this.dy = dir.dy;

        if (this.dx !== 0) this.dy = 0;
        if (this.dy !== 0) this.dx = 0;

        this.model.className = dir.class;
    }

    // Process keyboard input for movement and start/stop commands.
    handleKeys(e)
    {
        const map =
        {
            ArrowUp: "up", w: "up",
            ArrowDown: "down", s: "down",
            ArrowLeft: "left", a: "left",
            ArrowRight: "right", d: "right"
        };

        if (map[e.key])
        {
            e.preventDefault();
            this.queueDirection(map[e.key]);
        }

        if (e.key === "x" || e.key === "X")
        {
            e.preventDefault();
            this.animator.isRunning()
                ? this.stop()
                : this.start();
        }
    }

    // Updates Pac-Man position and handles boundary collision with bouncing.
    move(delta)
    {
        if (!this.animator.isRunning()) return;

        if (this.nextDirection)
        {
            this.setDirection(this.nextDirection);
            this.nextDirection = null;
        }

        this.x += this.dx * this.speed * delta; // update position
        this.y += this.dy * this.speed * delta; // update position        
        this.x = Math.max(0, Math.min(this.x, this.maxX)); // clamp position to container bounds
        this.y = Math.max(0, Math.min(this.y, this.maxY)); // clamp position to container bounds

        // bounce from edges
        if (this.x === 0 && this.dx < 0) this.setDirection("right");
        if (this.x === this.maxX && this.dx > 0) this.setDirection("left");
        if (this.y === 0 && this.dy < 0) this.setDirection("down");
        if (this.y === this.maxY && this.dy > 0) this.setDirection("up");
        
        this.model.style.left = this.x + "px"; // apply position to element
        this.model.style.top = this.y + "px"; // apply position to element
    }
}


// INITIALIZATION
// Create new Pac-Man Game
new PacmanGame(
{
    display: document.getElementById("pacman-display"),
    container: document.getElementById("pacman-container"),
    model: document.getElementById("pacman-model"),
    playBtn: document.getElementById("btn-pacman-start"),
    stopBtn: document.getElementById("btn-pacman-stop"),
    playImg: "../images/pacman/pac-man-fast.gif",
    pauseImg: "../images/pacman/pac-man-static.gif",
    arrows:
    {
        up: document.getElementById("btn-arrow-up"),
        down: document.getElementById("btn-arrow-down"),
        left: document.getElementById("btn-arrow-left"),
        right: document.getElementById("btn-arrow-right")
    }
});