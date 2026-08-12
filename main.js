// browser loads index.html -> browser loads js -> open the dialog ->
// user closes dialog -> audio system loads -> user clicks sound button
// find our dialog (like declaring gameObject) and also the close button
const introDialog = document.getElementById("intro-dialog");
const introDialogCloseButton = document.getElementById("intro-dialog-close");

//show the found element in browser console
    // console.log(introDialog);

//find test button (like declaring gameObject)
const testButton = document.getElementById('test-button');
// init our synth
const synth = new Tone.Synth().toDestination();

// Dialog
introDialog.showModal();

//close dialog when user clicks button for it
introDialogCloseButton.addEventListener("click", function closeIntroDialog(){
    introDialog.close();});



//do something when the button is clicked
testButton.addEventListener("click", playNote);

//function that runs on button click
//function is used instead of void basically
function playNote() {
    //play note c4 for a semiquaver length
    synth.triggerAttackRelease("c4", "8n");
}
