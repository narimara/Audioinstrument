//find test button (like declaring gameObject)
const testButton = document.getElementById('test-button');
// init our synth
const synth = new Tone.Synth().toDestination();

//do something when the button is clicked
testButton.addEventListener("click", playNote);

//function that runs on button click
//function is used instead of void basically
function playNote() {
    //play note c4 for a semiquaver length
    synth.triggerAttackRelease("c4", "8n");
}
