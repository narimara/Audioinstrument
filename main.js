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
const spawnBtn = document.getElementById('spawnBallBtn');
const p2Status = document.getElementById('p2-status');

//array tracking all note objects currently on the stave
const notes = [];
let activeP2Index = -1; //tracks which note p2 is editing

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

    //automatically select the new ball for Player 2
    selectNoteForP2(notes.length - 1);

    //play a preview note on creation
    playPreviewSound(noteObj.xRatio);

    ballElement.addEventListener('click', (e) => {
        e.stopPropagation();
        const clickedIndex = notes.indexOf(noteObj);
        if (clickedIndex !== -1) {
            selectNoteForP2(clickedIndex);
            playPreviewSound(noteObj.xRatio);
        }
    });
}

// Updates the CSS left and top percentage properties for the ball.
function updateBallDOMPosition(noteObj) {
    noteObj.element.style.left = `${noteObj.xRatio * 100}%`;
    noteObj.element.style.top = `${noteObj.yRatio * 100}%`;
}

//calculate sound frequency using user 2 octave choice and ball x position
function calculateFrequency(xRatio, octave) {
    //safe fallbacks if parameters are missing or NaN
    const safeOctave = octave || 3;
    const safeX = xRatio || 0.5;

    //base frequency per octave (Octave 2 = 110Hz, Octave 3 = 220Hz, etc)
    const baseHz = 110 * Math.pow(2, safeOctave - 2);

    //x position adds pitch variation across the stave
    const pitchSpread = safeX * (baseHz * 2);

    return baseHz + pitchSpread;
}

//Plays a short pitch preview sound based on horizontal position.
function playPreviewSound(xRatio) {
    const pitchOffsetSlider = document.getElementById('pitchOffset');
    const baseOctave = pitchOffsetSlider ? parseInt(pitchOffsetSlider.value, 10) : 3;
    const previewFreq = calculateFrequency(xRatio, baseOctave);
    synth.triggerAttackRelease(previewFreq, "16n");
}

// Spawn button event listener
if (spawnBtn) {
    spawnBtn.addEventListener('click', () => createBall(0.5, 0.5));
}

// Highlights a target note and updates the Player 2 UI status label
function selectNoteForP2(index) {
    // Clear active highlight from all notes
    notes.forEach((note) => note.element.classList.remove('active-selected'));

    if (index >= 0 && index < notes.length) {
        activeP2Index = index;
        notes[activeP2Index].element.classList.add('active-selected');
        if (p2Status) {
            p2Status.textContent = `Note #${activeP2Index + 1} of ${notes.length}`;
        }
    } else {
        activeP2Index = -1;
        if (p2Status) {
            p2Status.textContent = "No active note";
        }
    }
}

// Deletes the currently active note selected by Player 2
function deleteSelectedNote() {
    if (activeP2Index === -1 || notes.length === 0) return;

    // Remove DOM element from stave
    const noteToDelete = notes[activeP2Index];
    if (noteToDelete.element && noteToDelete.element.parentNode) {
        noteToDelete.element.parentNode.removeChild(noteToDelete.element);
    }

    // Remove from notes array
    notes.splice(activeP2Index, 1);

    // Select the previous note, or clear selection if no notes remain
    if (notes.length > 0) {
        const nextSelection = Math.max(0, activeP2Index - 1);
        selectNoteForP2(nextSelection);
    } else {
        selectNoteForP2(-1);
    }
}

// Keyboard controls for Player 2
window.addEventListener('keydown', (e) => {
    // Prevent arrow keys, spacebar, and backspace from scrolling or navigating back
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Backspace", "Delete"].includes(e.key)) {
        e.preventDefault();
    }

    if (notes.length === 0) return;

    // BACKSPACE / DELETE: Remove selected note
    if (e.key === "Backspace" || e.key === "Delete") {
        deleteSelectedNote();
        return;
    }

    // SPACEBAR: Cycle selection backwards (wraps around infinitely)
    if (e.key === " " || e.code === "Space") {
        if (activeP2Index !== -1) {
            let nextIndex = activeP2Index - 1;
            if (nextIndex < 0) {
                nextIndex = notes.length - 1; // Wrap around to newest note
            }
            selectNoteForP2(nextIndex);
        } else {
            selectNoteForP2(notes.length - 1);
        }
        return;
    }

    // ARROW KEYS: Nudge position of selected note
    if (activeP2Index !== -1) {
        const activeNote = notes[activeP2Index];
        const step = 0.02;
        let moved = false;

        if (e.key === "ArrowUp") {
            activeNote.yRatio = Math.max(0.05, activeNote.yRatio - step);
            moved = true;
        } else if (e.key === "ArrowDown") {
            activeNote.yRatio = Math.min(0.95, activeNote.yRatio + step);
            moved = true;
        } else if (e.key === "ArrowLeft") {
            activeNote.xRatio = Math.max(0.05, activeNote.xRatio - step);
            moved = true;
        } else if (e.key === "ArrowRight") {
            activeNote.xRatio = Math.min(0.95, activeNote.xRatio + step);
            moved = true;
        }

        if (moved) {
            updateBallDOMPosition(activeNote);
            playPreviewSound(activeNote.xRatio);
        }
    }
});




//play and pause handler for the playhead
let playheadY = 0;
let isPlaying = false; // Paused by default on startup
let animationFrameId = null; // Stores the requestAnimationFrame reference

const playPauseBtn = document.getElementById('playPauseBtn');

// Toggle play/pause state when button is clicked
playPauseBtn.addEventListener('click', () => {
    isPlaying = !isPlaying; // Flip state true <-> false

    if (isPlaying) {
        playPauseBtn.textContent = '⏸ Pause';
        // Start animation loop
        animate();
    } else {
        playPauseBtn.textContent = '▶ Play';
        // Stop animation loop immediately
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    }
});




//move playhead according to set speed
//loop playhead movement
//calculate note pitch based on stave position
function animate() {
    if (!isPlaying) return;

    //move playhead at set speed
    const speedInput = document.getElementById('speedSlider');
    const bpm = speedInput ? parseFloat(speedInput.value) : 120;
    const stepSpeed = (bpm / 60) * 0.003;

    playheadY += stepSpeed;

    if (playheadY >= 1.0) {
        playheadY = 0;
    }

    const playhead = document.getElementById('playhead');
    if (playhead) {
        playhead.style.top = `${playheadY * 100}%`;
    }

    // collision detection
    const pitchOffsetSlider = document.getElementById('pitchOffset');
    const baseOctave = pitchOffsetSlider ? parseInt(pitchOffsetSlider.value, 10) : 3;

    notes.forEach((note) => {
        const verticalDistance = Math.abs(playheadY - note.yRatio);

        if (verticalDistance < 0.015) {
            if (!note.triggered) {
                note.triggered = true;

                try {
                    //calculate pitch and trigger sound
                    const notePitchHz = calculateFrequency(note.xRatio, baseOctave);
                    synth.triggerAttackRelease(notePitchHz, "8n");

                    //visual feedback animation on note hit
                    note.element.style.transform = 'translate(-50%, -50%) scale(1.6)';
                    setTimeout(() => {
                        note.element.style.transform = 'translate(-50%, -50%) scale(1.0)';
                    }, 150);

                } catch (err) {
                    console.error("Audio trigger error:", err);
                }
            }
        } else {
            note.triggered = false;
        }
    });

    //keep loop running smoothly
    animationFrameId = requestAnimationFrame(animate);
}