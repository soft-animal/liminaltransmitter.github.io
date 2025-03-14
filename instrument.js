// CREATING A CANVAS!! :)

canvas = document.createElement('canvas')
document.body.appendChild(canvas)


// Responsive canvas sizing
document.body.style.margin = '0'
document.body.style.overflow = 'hidden'
canvas.style.display = 'block'
canvas.style.position = 'fixed'
canvas.style.top = '0'
canvas.style.left = '0'

function updateCanvasSize() {
    // Use full window dimensions
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.backgroundColor = 'black'
    canvasBounds = canvas.getBoundingClientRect()
}

updateCanvasSize()

window.addEventListener("resize", () => {
    updateCanvasSize()
    morelines()
    listofcircles.forEach(circl => circle(circl[0], circl[1]))
})

function drawlines(a,b,c,d, width, color){
    ctx = canvas.getContext("2d")
    ctx.beginPath()
    // (X,Y) of one line ending
    ctx.moveTo(a, b)
    // (X,Y) of other line ending
    ctx.lineTo(c,d)
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.stroke()
}

numberOctaves = 6
function morelines(){
    // Draw octaves
    for (octave = 0; octave < numberOctaves; octave += 1) {
        distanceBetweenLines = width / (numberOctaves - 1)
        x = octave * distanceBetweenLines
        if ((octave === 0) || (octave === numberOctaves-1)) {
            drawlines(x, 0, x, height, 8, "#ff99bb")
        } else {
            drawlines(x, 0, x, height, 4, "#ff99bb")
        }
        // notes
        for(notes = 0; notes < 8; notes += 1){
            distancebetweennotelines = distanceBetweenLines/8
            x2 = notes * distancebetweennotelines + x
            drawlines(x2,0,x2,height,1,"white")
        }
    }
}

morelines()


radius = 15
circwidf = 2
function circle(x,y){
    ctx = canvas.getContext("2d")
    ctx.beginPath()
    ctx.arc(x,y,radius,0,2*Math.PI)
    ctx.strokeStyle = "white"
    ctx.lineWidth = circwidf
    ctx.stroke()
}
function circleblack(x,y){
    ctx = canvas.getContext("2d")
    ctx.beginPath()
    ctx.arc(x,y,radius,0,2*Math.PI)
    ctx.strokeStyle = "black"
    ctx.lineWidth = circwidf * 2
    ctx.stroke()
}

canvasBounds = canvas.getBoundingClientRect()

//Makes two empty lists of circles
listofcircles = []
listofsynths = []

//Ability to click circles + drag
function clickingcircle(event){
x = event.clientX - canvasBounds.left
y = event.clientY - canvasBounds.top
circle(x,y)
listofcircles.push([x,y])
synthmaker(x,y)
isDragging = true
}

function distance(x1,y1,x2,y2) {
    return Math.sqrt(Math.pow((x1 - x2), 2) + (Math.pow((y1 - y2), 2)))
}

function deletecircle(event){
    x = event.clientX - canvasBounds.left
    y = event.clientY - canvasBounds.top
    for (var i of listofcircles){
        circlesX = i[0]
        circlesY = i[1]
        if (distance(x,y,circlesX,circlesY) < radius) {
            circleblack(circlesX, circlesY)
            // To remove a circle, we need to find its index in
            // the list
            idx = listofcircles.indexOf(i)
            // Then we "splice" (aka delete) at that index 1 element
            listofcircles.splice(idx, 1)
            // Now delete synth
            synth = listofsynths[idx]
            synth.triggerRelease()
            listofsynths.splice(idx, 1)
            // Re-draw circles and lines in case we covered them up
            morelines()
            listofcircles.forEach(circl => circle(circl[0], circl[1]))
            return
        }
    }
}

function allTheClicking(event) {
    if (event.shiftKey) {
        deletecircle(event)
    } else {
        clickingcircle(event)
    }
}

canvas.addEventListener("mousedown", allTheClicking)

lowestNote = 65.41 // = C2 note
highestNote = lowestNote * Math.pow(2, (numberOctaves - 1))
function turnXintoHZ(x) {
    // We want 0 -> lowest note
    // We want width -> highest note
    // We want that if Octave + Step -> Y,
    // then Next Octave + Step -> 2 * Y (so notes on each staff match)
    // We will do this by magic
    // (See https://en.wikipedia.org/wiki/Linear_interpolation
    // and https://en.wikipedia.org/wiki/Octave_band)
    return (lowestNote * Math.pow(Math.pow(Math.pow(2, numberOctaves-1), 1/width), x))
}

//Volume Controls
function turnYtoVolume(y){
    return -((y/height)*40)
}


//Makes the synth that takes in X for frequency and Y for volume
function synthmaker(x, y) {
    hz = turnXintoHZ(x)
    volume = turnYtoVolume(y)
    const synth = new Tone.Synth({
        portamento: 0.2,
        oscillator: {
          type: 'square4'
        },
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.4,
          release: 0.5
        }
      }).toDestination()

      //Set initial value based on Y coordinate
      synth.volume.value = turnYtoVolume(y)
      synth.triggerAttack(hz)
      listofsynths.push(synth)
}

//Drag-and-click to make sliding tones
let isDragging = false
let startDrag = null

function mouseDrag(event) {
    if (isDragging && listofsynths.length > 0) {
        const x = event.clientX - canvasBounds.left
        const y = event.clientY - canvasBounds.top
        const lastSynth = listofsynths[listofsynths.length - 1]
        const hz = turnXintoHZ(x)
        const volume = turnYtoVolume(y)
        lastSynth.frequency.rampTo(hz, 0.1)
        lastSynth.volume.rampTo(volume, 0.1)

        //Update circle visual
        const lastCircle = listofcircles.length - 1
        listofcircles[lastCircle] = [x, y]

        //Redraw the circle
        ctx.clearRect(0, 0, width, height)
        morelines()
        listofcircles.forEach(circl => circle(circl[0], circl[1]))
    }
}
 //Listener for the mouse dragging
canvas.addEventListener("mousemove", mouseDrag)
canvas.addEventListener("mouseup", () => isDragging = false)

//Adding drums
drumsPlaying = false
drum = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 1,
    oscillator: {
        type: "sine"
    },
    envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0.01,
        release: 0.2
    }
}).toDestination()

// Length of each beat
sep = Tone.Time("16n").toSeconds()

// Three different beats 
function pattern1(time){
    drum.triggerAttackRelease("C3", "32n", time + 0 * sep)
    drum.triggerAttackRelease("C3", "32n", time + 1 * sep)
    drum.triggerAttackRelease("E3", "32n", time + 2 * sep)
    drum.triggerAttackRelease("G3", "32n", time + 3 * sep)
    drum.triggerAttackRelease("C3", "32n", time + 4 * sep)
    drum.triggerAttackRelease("E3", "32n", time + 5 * sep)
    drum.triggerAttackRelease("G3", "32n", time + 6 * sep)
    drum.triggerAttackRelease("C4", "32n", time + 7 * sep)
    drum.triggerAttackRelease("C3", "32n", time + 8 * sep)
    drum.triggerAttackRelease("C3", "32n", time + 9 * sep)
    drum.triggerAttackRelease("E3", "32n", time + 10 * sep)
    drum.triggerAttackRelease("G3", "32n", time + 11 * sep)
    drum.triggerAttackRelease("E3", "32n", time + 12 * sep)
    drum.triggerAttackRelease("G3", "32n", time + 13 * sep)
    drum.triggerAttackRelease("C4", "32n", time + 14 * sep)
    drum.triggerAttackRelease("C3", "32n", time + 15 * sep)
}

function pattern2(time){
    drum.triggerAttackRelease("C3", "32n", time + 0 * sep)
    drum.triggerAttackRelease("C3", "32n", time + 1 * sep)
    drum.triggerAttackRelease("G3", "32n", time + 3 * sep)
    drum.triggerAttackRelease("C3", "32n", time + 4 * sep)
    drum.triggerAttackRelease("C3", "32n", time + 6 * sep)
    drum.triggerAttackRelease("C3", "32n", time + 7 * sep)
    drum.triggerAttackRelease("G3", "32n", time + 8 * sep)
    drum.triggerAttackRelease("E3", "32n", time + 9 * sep)
    drum.triggerAttackRelease("C3", "32n", time + 11 * sep)
    drum.triggerAttackRelease("C3", "32n", time + 12 * sep)
    drum.triggerAttackRelease("G3", "32n", time + 13 * sep)
    drum.triggerAttackRelease("E3", "32n", time + 14 * sep)
    drum.triggerAttackRelease("E3", "32n", time + 15 * sep)
}

function pattern3(time){
    drum.triggerAttackRelease("C3", "32n", time + 0 * sep)
    drum.triggerAttackRelease("E3", "32n", time + 1 * sep)
    drum.triggerAttackRelease("G3", "32n", time + 1 * sep)
    drum.triggerAttackRelease("C3", "32n", time + 2 * sep)
    drum.triggerAttackRelease("G3", "32n", time + 4 * sep)
    drum.triggerAttackRelease("C3", "32n", time + 5 * sep)
    drum.triggerAttackRelease("E3", "32n", time + 6 * sep)
    drum.triggerAttackRelease("G3", "32n", time + 6 * sep)
    drum.triggerAttackRelease("C3", "32n", time + 8 * sep)
    drum.triggerAttackRelease("E3", "32n", time + 9 * sep)
    drum.triggerAttackRelease("C3", "32n", time + 11 * sep)
    drum.triggerAttackRelease("G3", "32n", time + 11 * sep)
    drum.triggerAttackRelease("E3", "32n", time + 12 * sep)
    drum.triggerAttackRelease("C3", "32n", time + 13 * sep)
    drum.triggerAttackRelease("G3", "32n", time + 14 * sep)
    drum.triggerAttackRelease("C3", "32n", time + 15 * sep)
}

currentPattern = pattern1
const loop = new Tone.Loop((time) => {
    currentPattern(time)
}, "1n")

document.addEventListener("keydown", (event) => {
    if (event.key === "d") {
        Tone.start()
        Tone.Transport.bpm.value = 150
        Tone.Transport.start()
        if (drumsPlaying) {
            drumsPlaying = false
            loop.stop()
        } else {
            drumsPlaying = true
            loop.start()
        }
    }
    if (event.key === "1") {
        currentPattern = pattern1
    }
    if (event.key === "2") {
        currentPattern = pattern2
    }
    if (event.key === "3") {
        currentPattern = pattern3
    }
})

//CRYSTAL CASTLES COMPOSITION
//Creates HTML button 
const ccButton = document.createElement('button')
document.body.appendChild(ccButton)
ccButton.innerText = "Alice Practice Mode"
// 60px margin from bottom, 20 px right, 10px internal padding
ccButton.style.position = 'fixed'
ccButton.style.bottom = '60px' // putting it higher up
ccButton.style.right = '20px'
ccButton.style.padding = '10px'
ccButton.style.backgroundColor = 'black'
ccButton.style.color = 'pink'
ccButton.style.border = '2px solid pink'
ccButton.style.fontFamily = 'monospace'
ccButton.style.zIndex = '100' // high z index so it appears in front of other elements

// Creates Remix button
const remixButton = document.createElement('button')
document.body.appendChild(remixButton)
remixButton.innerText = "Remix Pattern"
remixButton.style.position = 'fixed'
remixButton.style.bottom = '100px' 
remixButton.style.right = '20px'
remixButton.style.padding = '10px'
remixButton.style.backgroundColor = 'black'
remixButton.style.color = 'cyan'
remixButton.style.border = '2px solid cyan'
remixButton.style.fontFamily = 'monospace'
remixButton.style.zIndex = '100'
remixButton.style.display = 'none' // hidden at first, only appears when cc mode activated

// add instructions that show when page loads
const instructionsDiv = document.createElement('div')
document.body.appendChild(instructionsDiv)
instructionsDiv.style.position = 'fixed'
instructionsDiv.style.top = '20px'
instructionsDiv.style.left = '20px'
instructionsDiv.style.padding = '15px'
instructionsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)' //semi-transparent background
instructionsDiv.style.color = 'white'
instructionsDiv.style.fontFamily = 'monospace'
instructionsDiv.style.fontSize = '14px'
instructionsDiv.style.borderRadius = '5px'
instructionsDiv.style.zIndex = '100' //appears over other elements
instructionsDiv.style.maxWidth = '350px' //max width
instructionsDiv.innerHTML = `
  <p><b>Crystal Castles Instrument</b></p>
  <p>- Click anywhere to create sounds</p>
  <p>- Click & drag to change pitch</p>
  <p>- Press D to toggle drums</p>
  <p>- Press 1, 2, or 3 to switch between different drum patterns</p>
  <p>- Click "Alice Practice Mode" for algorithmically generated Crystal Castles patterns</p>
  <p>- Click song titles to cycle through different patterns</p>
  <p>- Hold Shift + Click to delete sounds</p>
`

// make instructions fade out after 10 seconds
setTimeout(() => {
  instructionsDiv.style.transition = 'opacity 2s'
  instructionsDiv.style.opacity = '0'
  
  // remove after fade completes
  setTimeout(() => {
    instructionsDiv.remove()
  }, 2000) //after 2s = 2000 ms text will disapear 
}, 20000) //20000ms=20s

// keeping track of stuff
// store numbers to internal times that control note creation/removal, so they can be stopped later
 ccInterval = null
 noteRemovalInterval = null
 ccModeActive = false //boolean flag - tracks wheter cc mode is activated
 currentRemixStyle = 0 // tracks which remix pattern is curently selected, set to index 0

// trackers
 step = 0 //tracks current music position - which step within bar
 bar = 0 // which bar
 totalSteps = 16
 totalBars = 4

// scales from crystal castles songs in multiple octaves
 rightHandScale = ['Bb4', 'C5', 'Db5', 'Eb5', 'F5', 'G5', 'Ab5'] //primary scale for melody notes-->Bb minor scale (Bb, C, Db, Eb, F, G, Ab) in 4th/5th octave range
 rightHandScaleHigh = ['Bb5', 'C6', 'Db6', 'Eb6', 'F6', 'G6', 'Ab6'] //same Bb minor scale but octave higher (5th/6th octave), for variation in the melody
 rightHandScaleLow = ['Bb3', 'C4', 'Db4', 'Eb4', 'F4', 'G4', 'Ab4'] //same scale but one octave lower (3rd/4th octave)
 leftHandScale = ['Bb3', 'C4', 'Db4', 'Eb4', 'F4', 'G4', 'Ab4'] //scale for bass/accompaniment notes 3rd/4th octave 
 leftHandScaleLow = ['Bb2', 'C3', 'Db3', 'Eb3', 'F3', 'G3', 'Ab3'] // extra low for bass--> even lower octave of the same scale (2nd/3rd octave)

// arpeggio patterns
//inner array represents one bar's worth of notes, each number being an index into the scale arrays ^
// patterns create arpeggios (broken chords) based on Bb, G, Eb, and G chords
 rightHandArp = [
  [0, 2, 4, 2, 0, 2, 4, 2],  // Bb chord 
  [5, 0, 2, 0, 5, 0, 2, 0],  // G chord 
  [3, 5, 0, 5, 3, 5, 0, 5],  // Eb chord 
  [5, 0, 2, 0, 5, 0, 2, 0]   // G chord again
]
// array defines the chord progression for bass notes
// Each inner array represents notes of a chord (using scale indices)
 leftHandChrd = [
  [0, 2, 4], // Bb chord
  [5, 0, 2], // G chord
  [3, 5, 0], // Eb chord
  [5, 0, 2]  // G chord
]

// different remix patterns based on diff cc songs
 remixPatterns = [
  // vanished - 120 BPM
  {
    rightArp: [
      [0, 2, 4, 2, 0, 2, 4, 2],
      [5, 0, 2, 0, 5, 0, 2, 0],
      [3, 5, 0, 5, 3, 5, 0, 5],
      [5, 0, 2, 0, 5, 0, 2, 0]
    ],
    tempo: 120,
    name: "Vanished"
  },
  // Crimewave - 140 BPM
  {
    rightArp: [
      [0, 4, 2, 4, 0, 4, 2, 4],
      [5, 2, 0, 2, 5, 2, 0, 2],
      [3, 0, 5, 0, 3, 0, 5, 0],
      [5, 2, 0, 2, 5, 2, 0, 2]
    ],
    tempo: 140,
    name: "Crimewave"
  },
  // Courtship Datinf - 130 BPM
  {
    rightArp: [
      [0, 0, 4, 2, 0, 0, 4, 2],
      [5, 5, 0, 2, 5, 5, 0, 2],
      [3, 3, 5, 0, 3, 3, 5, 0],
      [5, 5, 0, 2, 5, 5, 0, 2]
    ],
    tempo: 130,
    name: "Courtship Dating"
  },
  //Not in love - 150 BPM
  {
    rightArp: [
      [0, 4, 0, 2, 4, 0, 2, 0],
      [5, 0, 5, 2, 0, 5, 2, 5],
      [3, 5, 3, 0, 5, 3, 0, 3],
      [5, 0, 5, 2, 0, 5, 2, 5]
    ],
    tempo: 150,
    name: "Not In Love"
  }
]

// cc synth. takes x, y, and (optional) volume level defaulting at -10 
function ccSynthmaker(x, y, volumeLevel = -10) {
  hz = turnXintoHZ(x) //converts x into hz value
   synth = new Tone.Synth({
    portamento: 0.2,
    oscillator: {
      type: 'square4'
    },
    envelope: {
      attack: 0.01, // faster attack 
      decay: 0.2,
      sustain: 0.4,
      release: 0.5
    }
  }).toDestination()

  //sets volume of synth to the specified level, rather than deriving it from the y-coordinate
  synth.volume.value = volumeLevel
  synth.triggerAttack(hz) //starts playing at calculated frequency
  listofsynths.push(synth) // adds synth to global list of active synths
  return synth
}

// start/stop cc when button when clicked
ccButton.addEventListener('click', () => {
  if (ccModeActive) {
    // if cc mode in on, turn it off
    stopCrystalCastlesMode()
    return
  }
  
  // if cc mode off, turn it on
  startCrystalCastlesMode()
})

// start remix button when clicked
remixButton.addEventListener('click', () => {
  if (!ccModeActive) return //makes sure remix button only works when cc mode is active
  
  Tone.start()
  currentRemixStyle = (currentRemixStyle + 1) % remixPatterns.length   // go to next remix
  // stop current timers that control music sequence
  clearInterval(ccInterval) 
  clearInterval(noteRemovalInterval)
  
  // clears all playing notes and circles
  clearAllNotes()
  
  // start the new pattern
  startCCSequence(currentRemixStyle)
  
  // updates button text to show which song pattern is playing
  remixButton.innerText = remixPatterns[currentRemixStyle].name 
})

// turning on cc mode, handles buttons, starting music, high level controls 
function startCrystalCastlesMode() {
  // start the sounds
  Tone.start()
  
  // update the UI to show stop remix button
  ccButton.innerText = "Stop The Glitch"
  remixButton.style.display = 'block'
  remixButton.innerText = remixPatterns[currentRemixStyle].name
  ccModeActive = true //sets active flag to
  
  // reset counters
  step = 0
  bar = 0
  
  // clear out old notes
  clearAllNotes()
  startCCSequence(currentRemixStyle) //starts the actual music sequence using the current remix style
}

// turning off cc mode
function stopCrystalCastlesMode() {
  // stop all timing intervals that control music and clear references
  clearInterval(ccInterval)
  clearInterval(noteRemovalInterval)
  ccInterval = null
  noteRemovalInterval = null
  
 // update the UI buttons to original button text and hides remix button
  ccButton.innerText = "Alice Practice Mode"
  remixButton.style.display = 'none'
  ccModeActive = false // sets active flag to false, or says cc mode is off
  clearAllNotes()
}

// function that handles clearing all the notes from the screen
function clearAllNotes() {
  listofsynths.forEach(synth => synth.triggerRelease()) // stop all currently playing sounds by triggering their release
  
  // clear arrays that track active synths and circles
  listofsynths = []
  listofcircles = []
  
  // clear the canvas and redraw the grid lines
  ctx.clearRect(0, 0, width, height)
  morelines()
}
//MUSIC GENERATION
//calculate current position in music (ie which step within the bar and which bar within pattern)
function play(time) {
  // get the current position (exactly like in clocks ex.)
   s = step % totalSteps
   b = bar % totalBars
  
  //pulls the selected remix patterns and the specific arpeggio for the current bar
   currentPattern = remixPatterns[currentRemixStyle]
   currentRightHandArp = currentPattern.rightArp[b]
  
// plays bass notes starting on the first beat of every 8 steps (twice per bar)
  if (s % 8 === 0) {
    // retrieved chord for the current bar from the respective bass progression
     chord = leftHandChrd[b]
    
    //Randomly selects between reg. and extra-low bass scale
     useExtraLowBass = Math.random() > 0.7 // 30% chance of using lower scale
     scaleToUse = useExtraLowBass ? leftHandScaleLow : leftHandScale
     bassNote = scaleToUse[chord[0]] //selects the root note of the current chord in selected octave

    // figure out where to put circle corresponding to note being played
     freq = Tone.Frequency(bassNote).toFrequency() //converts note name to freqency in hz
     xRatio = (Math.log(freq) - Math.log(lowestNote)) / (Math.log(highestNote) - Math.log(lowestNote)) //calculates placement position on x-axis using log scale
     x = Math.max(10, Math.min(width - 10, xRatio * width))//constrains x within screen
     y = height * 0.7 //setting y to 70% of screen height
    
    // draw the circles and add to the tracking list
    circle(x, y)
    listofcircles.push([x, y])

    ccSynthmaker(x, y, -8) // creates the bass synth at slightly higher volume, -8 instead of -10
  }
  
  // melody notes on beats
  if (s % 2 === 0) { //executes of every other step, so the melody notes play more often than bass
    
     //calculates which note from the arpeggio pattern should play based on the current step
    arpIndex = (s / 2) % 8
    noteIndex = currentRightHandArp[arpIndex]
    
    // Randomly choose octave for variety but not too often
    let scaleChoice = Math.random() //generates ranodom decimal 0-1
    //declare variables that will be assigned values later based on random #
    let scaleToUse 
    let yPos
    
    if (scaleChoice > 0.85) {
      // Higher octave (15% chance)
      scaleToUse = rightHandScaleHigh
      yPos = height * 0.15 // higher position on screen

    } else if (scaleChoice > 0.7) {

      // Lower octave (15% chance)
      scaleToUse = rightHandScaleLow
      yPos = height * 0.4 // middle position on screen

    } else {
      // Regular octave (70% chance)
      scaleToUse = rightHandScale
      yPos = height * 0.3 // regular position
    }
    
     note = scaleToUse[noteIndex] //selects actual note from chosen scale
    
    //calculates position for the actual note from the chosen scale
     freq = Tone.Frequency(note).toFrequency()
     xRatio = (Math.log(freq) - Math.log(lowestNote)) / 
                  (Math.log(highestNote) - Math.log(lowestNote))
     x = Math.max(10, Math.min(width - 10, xRatio * width))
     y = yPos
    
    // make the circle and log it in list of circles
    circle(x, y)
    listofcircles.push([x, y])
    
    ccSynthmaker(x, y, -10) // make the melody synth at normal volume (-10)
  }
  
  // if theres more than 12 notes at a time, removes the 4 oldest notes
  if (listofsynths.length > 12) {
    for (let i = 0; i < 4; i++) {
      if (listofsynths.length > 0) {
        const oldSynth = listofsynths.shift()
        oldSynth.triggerRelease()
        
        if (listofcircles.length > 0) {
          listofcircles.shift()
        }
      }
    }
    
    // redraw everything to make sure visuals stay matching audio after removing notes
    ctx.clearRect(0, 0, width, height)
    morelines()
    listofcircles.forEach(circl => circle(circl[0], circl[1]))
  }
  
  // move position counters to the next step, moving to the next bar when reaching the end of current bar
  step++
  if (s === totalSteps - 1) bar++
}

//TIMER FUNCTIONS

function startCCSequence(styleIndex) { // starts timing intervals for cc musical sequence

  tempo = remixPatterns[styleIndex].tempo // retrieves BPM from the selected pattern
  
  msPerStep = (60000 / tempo) / 4 //converts tempo to ms/step (60000ms (1 minute) divided by the tempo gives milliseconds per beat, then divided by 4 for 16th notes (4 steps per beat))
  
  // make notes choppy
  noteRemovalInterval = setInterval(() => { //creates timer that will repeadtedly run this chunk 
    if (listofsynths.length > 0) { //checks in there are any aynths in list, if list empty doesnt do anything
  
    lastIndex = listofsynths.length - 1 //finds position of most recently added synth (array starts at 0 so lenth-1)
      if (lastIndex >= 0) { //check if valid position
        listofsynths[lastIndex].triggerRelease() //stops most recent synth, not imeediately but gets it to fade out
      }
    }
  }, msPerStep * 0.6) //runs this chunk after 60% of step has passed to cut it off early
  
  // main loop that plays notes
  ccInterval = setInterval(() => { 
    play() //everytime it runs it adds a new note based on the current step in musical pattern
  }, msPerStep) //tells loop how often to add note, based on tempo of current cc pattern
}
