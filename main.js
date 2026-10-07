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
const waveButtons = document.querySelectorAll('.wave-btn');
waveButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        // Remove active class from all buttons
        waveButtons.forEach((b) => b.classList.remove('active'));

        // Add active class to clicked button
        e.target.classList.add('active');

        // Update synth waveform
        const selectedWave = e.target.getAttribute('data-value');
        synth.set({ oscillator: { type: selectedWave } });
    });
});

const volumeSlider = document.getElementById('volumeSlider');
volumeSlider.addEventListener('input', (e) => {
//Tone.Destination volume is measured in decibels (-30dB to 0dB)
    Tone.Destination.volume.value = parseFloat(e.target.value);
});

//grid snapping and pitch constraints
//12 semitones in chromatic scale
//16 beats in the loop
const pitch_steps = 12;
const time_steps = 16;

//note spawning on click
//drag and drop controls for notes
//track position on the stave using step increments???
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

    const xStep = Math.max(0, Math.min(Math.round(xPercent * (pitch_steps - 1)), pitch_steps - 1));
    const yStep = Math.max(0, Math.min(Math.round(yPercent * (time_steps - 1)), time_steps - 1));

    //note created has a random duration from 1-4 beats
    const durationBeats = Math.floor(Math.random() * 4) + 1;

    //storing ball coordinates as ratios (0.0 to 1.0)
    const noteObj = {
        element: ballElement,
        xStep: xStep, // Integer 0 to 11 (Exact pitch offset)
        yStep: yStep, // Integer 0 to 15 (Exact time beat)
        xRatio: xStep / (pitch_steps - 1), // Exact decimal ratio for CSS positioning
        yRatio: yStep / (time_steps - 1),
        durationBeats: durationBeats,
        triggered: false
    };

    updateBallDOMPosition(noteObj);
    staveZone.appendChild(ballElement);
    notes.push(noteObj);

    //automatically select the new ball for Player 2
    selectNoteForP2(notes.length - 1);

    //play a preview note on creation
    //playPreviewSound(noteObj.xStep);

    ballElement.addEventListener('click', (e) => {
        e.stopPropagation();
        const clickedIndex = notes.indexOf(noteObj);
        if (clickedIndex !== -1) {
            selectNoteForP2(clickedIndex);
            playPreviewSound(noteObj.xStep);
        }
    });
}

// Updates the CSS left and top percentage properties for the ball.
function updateBallDOMPosition(noteObj) {
    noteObj.element.style.left = `${noteObj.xRatio * 100}%`;
    noteObj.element.style.top = `${noteObj.yRatio * 100}%`;

    const stepHeightPercent = (1 / (time_steps - 1)) * 100;
    noteObj.element.style.height = `calc(${noteObj.durationBeats * stepHeightPercent}% + 10px)`;

}

//calculate sound frequency using user 2 octave choice and ball x position
function calculateFrequency(xStep, octave) {
    const safeOctave = octave || 3;
    const safeStep = (xStep !== undefined && xStep !== null) ? xStep : 0;

    const baseMidi = (safeOctave + 1) * 12;
    const midiNote = baseMidi + safeStep;

    return 440 * Math.pow(2, (midiNote - 69) / 12);

}

//Plays a short pitch preview sound based on horizontal position.
function playPreviewSound(xStep, durationBeats = 1) {
    const pitchOffsetSlider = document.getElementById('pitchOffset');
    const baseOctave = pitchOffsetSlider ? parseInt(pitchOffsetSlider.value, 10) : 3;
    const previewFreq = calculateFrequency(xStep, baseOctave);

    const durationNotation = `${durationBeats * 0.25}s`;
    synth.triggerAttackRelease(previewFreq, durationNotation);
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
            p2Status.textContent = `Note #${activeP2Index + 1} (${notes[activeP2Index].durationBeats} beats)`;
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


    if (e.key === "Backspace" || e.key === "Delete") {
        deleteSelectedNote();
        return;
    }


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

    // arrow keys move ball along grid lines
    if (activeP2Index !== -1) {
        const activeNote = notes[activeP2Index];
        let moved = false;

        if (e.key === "ArrowUp") {
            activeNote.yStep = Math.max(0, activeNote.yStep - 1);
            activeNote.yRatio = activeNote.yStep / (time_steps - 1);
            moved = true;
        } else if (e.key === "ArrowDown") {
            activeNote.yStep = Math.min(time_steps - 1, activeNote.yStep + 1);
            activeNote.yRatio = activeNote.yStep / (time_steps - 1);
            moved = true;
        } else if (e.key === "ArrowLeft") {
            activeNote.xStep = Math.max(0, activeNote.xStep - 1);
            activeNote.xRatio = activeNote.xStep / (pitch_steps - 1);
            moved = true;
        } else if (e.key === "ArrowRight") {
            activeNote.xStep = Math.min(pitch_steps - 1, activeNote.xStep + 1);
            activeNote.xRatio = activeNote.xStep / (pitch_steps - 1);
            moved = true;
        }

        if (moved) {
            updateBallDOMPosition(activeNote);
            playPreviewSound(activeNote.xStep, 1);
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
                    const notePitchHz = calculateFrequency(note.xStep, baseOctave);
                    const durationTime = `${note.durationBeats * 0.25}s`;
                    synth.triggerAttackRelease(notePitchHz, durationTime);

                    //visual feedback animation on note hit
                    note.element.style.transform = 'translate(-50%, 0) scale(1.15)';
                    setTimeout(() => {
                        note.element.style.transform = 'translate(-50%, 0) scale(1.0)';
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