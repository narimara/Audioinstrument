// browser loads index.html -> browser loads js -> open the dialog ->
// user closes dialog -> audio system loads -> user clicks sound button
// find our dialog (like declaring gameObject) and also the close button
const introDialog = document.getElementById("intro-dialog");
const introDialogCloseButton = document.getElementById("intro-dialog-close");

//show the found element in browser console
    // console.log(introDialog);

// init our synth
const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.1,
        release: 0.3
    }
});

// Dialog
introDialog.showModal();

//close dialog when user clicks button for it
introDialogCloseButton.addEventListener("click", function closeIntroDialog(){
    introDialog.close();
});

//whenever dialog closes, initialise the audio system
introDialog.addEventListener("close", toneInit);

// run to set up audio system
async function toneInit(){
    // Tone.start() unlocks browser audio
    await Tone.start();
    synth.connect(Tone.Destination);
    console.log("Audio System Active with PolySynth!");
}


//controls for waveform and volume
//binded to user 1
const waveSelect = document.getElementById('waveType');
const volumeSlider = document.getElementById('volumeSlider');

waveSelect.addEventListener('change', (e) => {
    //update waveform across all voices in PolySynth
    synth.set({ oscillator: { type: e.target.value } });
});

volumeSlider.addEventListener('input', (e) => {
    //Tone.Destination volume is measured in decibels (-30dB to 0dB)
    Tone.Destination.volume.value = parseFloat(e.target.value);
});



//note spawning on click
//drag and drop controls for notes
//track position on the stave using coordinates as ratios???
const staveZone = document.getElementById('staveZone');
const spawnBtnLeft = document.getElementById('spawnBallLeft');
const spawnBtnRight = document.getElementById('spawnBallRight');

//array tracking all note objects currently on the stave
const notes = [];

/**
 * creates a new note ball element inside the stave zone.
 * @param {number} xPercent - Horizontal relative position (0.0 = left, 1.0 = right)
 * @param {number} yPercent - Vertical relative position (0.0 = top, 1.0 = bottom)
 */
function createBall(xPercent, yPercent) {
    const ballElement = document.createElement('div');
    ballElement.classList.add('note-ball');

    //storing ball coordinates as ratios (0.0 to 1.0)
    const noteObj = {
        element: ballElement,
        xRatio: xPercent, // Horizontal position = Pitch
        yRatio: yPercent, // Vertical position = Timing
        triggered: false  // Used by sequencer loop in Phase 4
    };

    updateBallDOMPosition(noteObj);
    staveZone.appendChild(ballElement);
    notes.push(noteObj);

    //play a preview note on creation
    playPreviewSound(noteObj.xRatio);

    //attach dragging event handlers
    setupBallDragging(noteObj);
}

/**
 * Updates the CSS left and top percentage properties for the ball.
 */
function updateBallDOMPosition(noteObj) {
    noteObj.element.style.left = `${noteObj.xRatio * 100}%`;
    noteObj.element.style.top = `${noteObj.yRatio * 100}%`;
}

/**
 * Plays a short pitch preview sound based on horizontal position.
 */
function playPreviewSound(xRatio) {
    // Scales pitch frequency between 220Hz (Low) and 880Hz (High)
    const previewFreq = 220 + (xRatio * 660);
    synth.triggerAttackRelease(previewFreq, "16n");
}

/**
 * Mouse events allowing the ball to be dragged inside stave boundaries.
 */
function setupBallDragging(noteObj) {
    let isDragging = false;

    // Click on ball starts dragging
    noteObj.element.addEventListener('mousedown', (e) => {
        isDragging = true;
        e.stopPropagation();
    });

    // Release mouse anywhere stops dragging
    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            playPreviewSound(noteObj.xRatio); // Play note on drop
        }
    });

    // Moving mouse across stave updates position if dragging
    staveZone.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const rect = staveZone.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Keep ball bounded between 5% and 95% of stave area
        noteObj.xRatio = Math.max(0.05, Math.min(mouseX / rect.width, 0.95));
        noteObj.yRatio = Math.max(0.05, Math.min(mouseY / rect.height, 0.95));

        updateBallDOMPosition(noteObj);
    });
}

// Spawn Buttons Event Listeners
spawnBtnLeft.addEventListener('click', () => createBall(0.25, 0.5));
spawnBtnRight.addEventListener('click', () => createBall(0.75, 0.5));