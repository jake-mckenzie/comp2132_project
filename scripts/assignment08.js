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


// PRODUCT CAROUSEL
// Rotates product images to simulate 360° product viewer.
class ImageCarousel
{
    constructor({ image, prev, next, play, pause, frames, path })
    {        
        this.image = image; // image element displaying the product        
        this.frames = frames; // number of images in the rotation        
        this.path = path; // file path prefix for images        
        this.frame = 1; // current frame index        
        this.direction = 1; // spin direction (1 forward, -1 backward)        
        this.timer = 0; // accumulates delta time for frame timing        
        this.buttons = [prev, next]; // carousel direction buttons        
        this.animator = new Animator((delta) => this.spin(delta), play, pause); // animation engine instance

        // button controls
        prev.onclick = () => this.setDirection(1, prev);
        next.onclick = () => this.setDirection(-1, next);

        // play control
        play.onclick = () =>
        {
            this.animator.start();
            const btnToHighlight =
                this.direction === 1 ? this.buttons[0] : this.buttons[1];

            setActive(this.buttons, btnToHighlight);
        };
        
        pause.onclick = () => this.animator.stop(); // pause control
        togglePlayPause(false, play, pause);
    }

    // Changes rotation direction and activates animation.
    setDirection(dir, btn)
    {        
        this.direction = dir; // rotation direction        
        setActive(this.buttons, btn); // button that was pressed
        this.animator.start();
    }

    // Advances the product image frame when the timer exceeds the frame delay.
    spin(delta)
    {
        if (!this.animator.isRunning()) return;
        this.timer += delta; // accumulate elapsed time

        if (this.timer > 0.1)
        {
            this.timer = 0;            
            this.frame += this.direction; // move to next frame

            // wrap frame index
            if (this.frame > this.frames) this.frame = 1;
            if (this.frame < 1) this.frame = this.frames;
           
            this.image.src = `${this.path}${this.frame}.jpg`; // update image
        }
    }
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
// Create new Product Carousel
new ImageCarousel(
{
    image: document.getElementById("product-image"),
    prev: document.getElementById("btn-product-previous"),
    next: document.getElementById("btn-product-next"),
    play: document.getElementById("btn-product-play"),
    pause: document.getElementById("btn-product-pause"),
    frames: 34,
    path: "../images/product/bike-"
});

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