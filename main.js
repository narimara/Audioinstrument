// browser loads index.html -> browser loads js -> open the dialog ->
// user closes dialog -> audio system loads -> user clicks sound button
// find our dialog (like declaring gameObject) and also the close button
const introDialog = document.getElementById("intro-dialog");
const introDialogCloseButton = document.getElementById("intro-dialog-close");

//show the found element in browser console
    // console.log(introDialog);

//find test button (like declaring gameObject)
const testButton = document.getElementById('test-button');
const key = document.getElementById('key-test');

// init our synth
const synth = new Tone.PolySynth();

// Dialog
introDialog.showModal();

//close dialog when user clicks button for it
introDialogCloseButton.addEventListener("click", function closeIntroDialog(){
    introDialog.close();
});

//whenever dialog closes, initialise the audio system
introDialog.addEventListener("close", toneInit);

//run to setup our audio system
function toneInit(){
    synth.connect(Tone.Destination);
}




//do something when the button is clicked
//testButton.addEventListener("click", playNote);

//function that runs on button click
//function is used instead of void basically
function playNote() {
    //play note c4 for a semiquaver length
    synth.triggerAttackRelease("c4", "8n");
}

function playDataNote(e){
    let buttonCLicked = e.target;
    console.log(buttonCLicked);
    let note = buttonCLicked.dataset.note;
    console.log(e.target);
    synth.triggerAttackRelease(note, "8n");
}

function startNote(e){
    //find key that was clicked
    let keyPressed = e.target;
    let note = keyPressed.dataset.note;
    synth.triggerAttack(note);
}

function endNote(e){
    let keyPressed = e.target;
    let note = keyPressed.dataset.note;
    synth.triggerRelease(note);
}

key.addEventListener("mousedown", startNote);
key.addEventListener("mouseup", endNote);
key.addEventListener("mouseleave", endNote);


//key.addEventListener("click", playDataNote);
//testButton.addEventListener("click", playDataNote);