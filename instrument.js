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

function linedraw(a,b,c,d, width, color){
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
            linedraw(x, 0, x, height, 8, "pink")
        } else {
            linedraw(x, 0, x, height, 4, "pink")
        }
        // notes
        for(notes = 0; notes < 8; notes += 1){
            distancebetweennotelines = distanceBetweenLines/8
            x2 = notes * distancebetweennotelines + x
            linedraw(x2,0,x2,height,1,"white")
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
    ctx.strokeStyle = "pink"
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
          attack: 2,
          decay: 1,
          sustain: 0.4,
          release: 3
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

window.addEventListener('load', () => {
// my crystal castles buttons
const ccButton = document.createElement('button')
document.body.appendChild(ccButton)
ccButton.innerText = "Alice Practice Mode" // more witty Crystal Castles reference
ccButton.style.position = 'fixed'
ccButton.style.bottom = '60px' // putting it higher up
ccButton.style.right = '20px'
ccButton.style.padding = '10px'
ccButton.style.backgroundColor = 'black'
ccButton.style.color = 'pink'
ccButton.style.border = '2px solid pink'
ccButton.style.fontFamily = 'monospace'
ccButton.style.zIndex = '100'

// remix button goes above the other one with more space between them
const remixButton = document.createElement('button')
document.body.appendChild(remixButton)
remixButton.innerText = "Remix" // Updated button text
remixButton.style.position = 'fixed'
remixButton.style.bottom = '120px' // More separation from the other button
remixButton.style.right = '20px'
remixButton.style.padding = '10px'
remixButton.style.backgroundColor = 'black'
remixButton.style.color = 'cyan'
remixButton.style.border = '2px solid cyan'
remixButton.style.fontFamily = 'monospace'
remixButton.style.zIndex = '1000'
remixButton.style.display = 'none' // hidden at first

// add instructions that show when page loads
const instructionsDiv = document.createElement('div')
document.body.appendChild(instructionsDiv)
instructionsDiv.style.position = 'fixed'
instructionsDiv.style.top = '20px'
instructionsDiv.style.left = '20px'
instructionsDiv.style.padding = '15px'
instructionsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
instructionsDiv.style.color = 'white'
instructionsDiv.style.fontFamily = 'monospace'
instructionsDiv.style.fontSize = '14px'
instructionsDiv.style.borderRadius = '5px'
instructionsDiv.style.zIndex = '100'
instructionsDiv.style.maxWidth = '350px'
instructionsDiv.innerHTML = `
  <p><b>Liminal Transmitter</b></p>
  <p>- Click anywhere to create sounds</p>
  <p>- Click & drag to change pitch (horizontal) and volume (vertical)</p>
  <p>- Press D to toggle drums on/off</p>
  <p>- Press 1, 2, or 3 to switch between different drum patterns</p>
  <p>- Click "Alice Practice Mode" for algorithmically generated Crystal Castles patterns</p>
  <p>- Click blue button to generate a new random pattern</p>
  <p>- Hold Shift + Click to delete sounds</p>
`

// make instructions fade out after 10 seconds
setTimeout(() => {
  instructionsDiv.style.transition = 'opacity 2s'
  instructionsDiv.style.opacity = '0'
  
  // remove after fade completes
  setTimeout(() => {
    instructionsDiv.remove()
  }, 2000)
}, 10000)

// keeping track of stuff
let ccInterval = null
let noteRemovalInterval = null
let ccModeActive = false
let currentPattern = null

// saving the original mouse things so we can put them back later
const originalMouseDown = canvas.onmousedown
const originalMouseMove = canvas.onmousemove
const originalMouseUp = canvas.onmouseup

// variables like in the coldplay example from class
let step = 0
let bar = 0
let totalSteps = 16
let totalBars = 4

// scales from crystal castles songs in multiple octaves
// Vanished & other songs scales (Bb minor)
const vanishedScale = {
  right: ['Bb4', 'C5', 'Db5', 'Eb5', 'F5', 'G5', 'Ab5'],
  rightHigh: ['Bb5', 'C6', 'Db6', 'Eb6', 'F6', 'G6', 'Ab6'], 
  rightLow: ['Bb3', 'C4', 'Db4', 'Eb4', 'F4', 'G4', 'Ab4'],
  left: ['Bb3', 'C4', 'Db4', 'Eb4', 'F4', 'G4', 'Ab4'],
  leftLow: ['Bb2', 'C3', 'Db3', 'Eb3', 'F3', 'G3', 'Ab3']
}

// Magic Spells scales (C# minor)
const magicSpellsScale = {
  right: ['C#4', 'D#4', 'E4', 'F#4', 'G#4', 'A4', 'B4'],
  rightHigh: ['C#5', 'D#5', 'E5', 'F#5', 'G#5', 'A5', 'B5'],
  rightLow: ['C#3', 'D#3', 'E3', 'F#3', 'G#3', 'A3', 'B3'],
  left: ['C#3', 'D#3', 'E3', 'F#3', 'G#3', 'A3', 'B3'],
  leftLow: ['C#2', 'D#2', 'E2', 'F#2', 'G#2', 'A2', 'B2']
}

// Courtship Dating scales (Eb minor)
const courtshipScale = {
  right: ['Eb4', 'F4', 'Gb4', 'Ab4', 'Bb4', 'Cb5', 'Db5'],
  rightHigh: ['Eb5', 'F5', 'Gb5', 'Ab5', 'Bb5', 'Cb6', 'Db6'],
  rightLow: ['Eb3', 'F3', 'Gb3', 'Ab3', 'Bb3', 'Cb4', 'Db4'],
  left: ['Eb3', 'F3', 'Gb3', 'Ab3', 'Bb3', 'Cb4', 'Db4'],
  leftLow: ['Eb2', 'F2', 'Gb2', 'Ab2', 'Bb2', 'Cb3', 'Db3']
}

// Not In Love scales (Bb minor/Db major)
const notInLoveScale = {
  right: ['Bb4', 'C5', 'Db5', 'Eb5', 'F5', 'G5', 'Ab5'],
  rightHigh: ['Bb5', 'C6', 'Db6', 'Eb6', 'F6', 'G6', 'Ab6'],
  rightLow: ['Bb3', 'C4', 'Db4', 'Eb4', 'F4', 'G4', 'Ab4'],
  left: ['Bb3', 'C4', 'Db4', 'Eb4', 'F4', 'G4', 'Ab4'],
  leftLow: ['Bb2', 'C3', 'Db3', 'Eb3', 'F3', 'G3', 'Ab3']
}

// Collection of pattern templates from each song
const patternTemplates = {
  // Vanished patterns
  vanished: {
    rightArp: [
      [0, 2, 4, 2, 0, 2, 4, 2],
      [5, 0, 2, 0, 5, 0, 2, 0],
      [3, 5, 0, 5, 3, 5, 0, 5],
      [5, 0, 2, 0, 5, 0, 2, 0]
    ],
    chords: [
      [0, 2, 4], // Bb chord
      [5, 0, 2], // G chord
      [3, 5, 0], // Eb chord
      [5, 0, 2]  // G chord
    ],
    tempo: 120,
    name: "Vanished",
    scale: vanishedScale
  },
  
  // Crimewave patterns
  crimewave: {
    rightArp: [
      [0, 4, 2, 4, 0, 4, 2, 4],
      [5, 2, 0, 2, 5, 2, 0, 2],
      [3, 0, 5, 0, 3, 0, 5, 0],
      [5, 2, 0, 2, 5, 2, 0, 2]
    ],
    chords: [
      [0, 2, 4], // Bb chord
      [5, 0, 2], // G chord
      [3, 5, 0], // Eb chord
      [5, 0, 2]  // G chord
    ],
    tempo: 140,
    name: "Crimewave",
    scale: vanishedScale
  },
  
  // Courtship Dating patterns - based on sheet music
  courtship: {
    rightArp: [
      [0, 0, 2, 4, 2, 4, 6, 4],
      [0, 0, 2, 4, 2, 4, 6, 4],
      [5, 5, 0, 2, 0, 2, 4, 2],
      [3, 3, 5, 0, 5, 0, 2, 0]
    ],
    bassPattern: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [5, 5, 5, 5, 5, 5, 5, 5],
      [3, 3, 3, 3, 3, 3, 3, 3]
    ],
    chords: [
      [0, 2, 4], // Eb minor chord
      [0, 2, 4], // Same chord
      [5, 0, 2], // Bb minor chord
      [3, 5, 0]  // Gb chord
    ],
    tempo: 125,
    name: "Courtship Dating",
    scale: courtshipScale,
    pattern: "sixteenth" // special 16th note pattern
  },
  
  // Magic Spells patterns
  magicSpells: {
    rightArp: [
      [0, 2, 4, 0, 2, 4, 0, 4],
      [0, 2, 4, 0, 2, 4, 0, 4],
      [5, 0, 2, 5, 0, 2, 5, 2],
      [0, 2, 4, 0, 2, 4, 0, 4]
    ],
    bassPattern: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [5, 5, 5, 5, 5, 5, 5, 5],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    chords: [
      [0, 2, 4], // C#m chord
      [0, 2, 4], // C#m chord
      [5, 0, 2], // A chord
      [0, 2, 4]  // Back to C#m
    ],
    tempo: 105,
    name: "Magic Spells",
    scale: magicSpellsScale,
    pattern: "ripple" // rippling arpeggio pattern
  },
  
  // Not In Love patterns - based on sheet music
  notInLove: {
    rightArp: [
      [0, 2, 4, 0, 2, 4, 0, 4],
      [0, 2, 4, 0, 2, 4, 0, 4],
      [5, 0, 2, 5, 0, 2, 5, 2],
      [3, 5, 0, 3, 5, 0, 3, 0]
    ],
    bassPattern: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [5, 5, 5, 5, 5, 5, 5, 5],
      [3, 3, 3, 3, 3, 3, 3, 3]
    ],
    chords: [
      [0, 2, 4], // Bb minor/Db chord
      [0, 2, 4], // Same chord
      [5, 0, 2], // Ab chord
      [3, 5, 0]  // Gb chord
    ],
    tempo: 136, // As indicated on sheet music
    name: "Not In Love",
    scale: notInLoveScale,
    pattern: "melody" // includes distinctive melodic line
  }
}

// making synths that have the same volume
function ccSynthmaker(x, y, volumeLevel = -10) {
  hz = turnXintoHZ(x)
  const synth = new Tone.Synth({
    portamento: 0.2,
    oscillator: {
      type: 'square4'
    },
    envelope: {
      attack: 0.01, // faster attack for crystal castles sound
      decay: 0.2,
      sustain: 0.4,
      release: 0.5
    }
  }).toDestination()

  // set volume the same for all notes
  synth.volume.value = volumeLevel
  synth.triggerAttack(hz)
  listofsynths.push(synth)
  return synth
}

function generateRandomPattern() {
  // Choose base template randomly
  const templates = Object.values(patternTemplates)
  const baseTemplate = templates[Math.floor(Math.random() * templates.length)]
  
  // Create a new pattern object
  const newPattern = {
    // Use the original song name
    name: baseTemplate.name,
    // Vary tempo slightly
    tempo: baseTemplate.tempo + Math.floor(Math.random() * 30 - 15),
    pattern: baseTemplate.pattern
  }
  
  // More randomization - sometimes use a different scale than the template
  const allScales = [vanishedScale, magicSpellsScale, courtshipScale, notInLoveScale]
  newPattern.scale = Math.random() > 0.3 ? 
    baseTemplate.scale : // 70% chance to use original scale
    allScales[Math.floor(Math.random() * allScales.length)] // 30% chance for different scale
  
  // Mix-and-match chords from different songs
  newPattern.chords = []
  for (let i = 0; i < 4; i++) {
    // Pick a random template for each chord position
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)]
    // Get a random chord from that template
    const randomChordPos = Math.floor(Math.random() * randomTemplate.chords.length)
    newPattern.chords.push([...randomTemplate.chords[randomChordPos]])
    
    // Sometimes transpose the chord
    if (Math.random() > 0.7) {
      const transpose = Math.floor(Math.random() * 3) - 1 // -1, 0, or 1
      newPattern.chords[i] = newPattern.chords[i].map(note => 
        (note + transpose + 7) % 7 // Keep within scale
      )
    }
  }
  
  // Create more randomized arpeggios
  newPattern.rightArp = []
  for (let i = 0; i < 4; i++) {
    // Choose a random template for each arpeggio
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)]
    const arpBase = [...randomTemplate.rightArp[Math.floor(Math.random() * randomTemplate.rightArp.length)]]
    
    // Deeply randomize it
    for (let j = 0; j < arpBase.length; j++) {
      // 40% chance to change each note
      if (Math.random() > 0.6) {
        // Pick a random degree from the scale
        arpBase[j] = Math.floor(Math.random() * 7)
      }
    }
    
    // Sometimes shift the pattern
    if (Math.random() > 0.5) {
      const shiftAmt = Math.floor(Math.random() * arpBase.length)
      for (let j = 0; j < shiftAmt; j++) {
        arpBase.push(arpBase.shift())
      }
    }
    
    newPattern.rightArp.push(arpBase)
  }
  
  // If the base pattern has a bass pattern, include that too but randomize
  if (baseTemplate.bassPattern) {
    newPattern.bassPattern = []
    for (let i = 0; i < 4; i++) {
      // Sometimes use original bass pattern, sometimes make a new one
      if (Math.random() > 0.5 && baseTemplate.bassPattern[i]) {
        newPattern.bassPattern.push([...baseTemplate.bassPattern[i]])
      } else {
        // Create a new bass pattern based on the chord
        const bassPattern = []
        const rootNote = newPattern.chords[i][0] // Root of the chord
        
        for (let j = 0; j < 8; j++) {
          // Bass mostly plays root notes with occasional variations
          if (Math.random() > 0.8) {
            // Occasional variation
            bassPattern.push(newPattern.chords[i][Math.floor(Math.random() * newPattern.chords[i].length)])
          } else {
            // Mostly root notes
            bassPattern.push(rootNote)
          }
        }
        newPattern.bassPattern.push(bassPattern)
      }
    }
  }
  
  return newPattern
}
// start/stop crystal castles when the button is clicked
ccButton.addEventListener('click', () => {
  if (ccModeActive) {
    // turn it off if it's already on
    stopCrystalCastlesMode()
    return
  }
  
  // turn it on
  startCrystalCastlesMode()
})

remixButton.addEventListener('click', () => {
  if (!ccModeActive) return
  
  // stop current playback
  clearInterval(ccInterval)
  clearInterval(noteRemovalInterval)
  
  // clear old notes
  clearAllNotes()
  
  // Change button text first to show it's generating
  remixButton.innerText = "Remixing..."
  
  // Small timeout to show the "Remixing..." text
  setTimeout(() => {
    // Generate a completely new random composition
    currentPattern = generateRandomPattern()
    
    // start with new pattern
    startCCSequence()
    
    // Show original song name
    remixButton.innerText = currentPattern.name
  }, 100)
})

// turning on crystal castles mode
function startCrystalCastlesMode() {
  // start the sounds
  Tone.start()
  
  // update the button
  ccButton.innerText = "Stop Transmission"
  remixButton.style.display = 'block'
  ccModeActive = true
  
  // reset counters
  step = 0
  bar = 0
  
  // clear out old notes
  clearAllNotes()
  
  // Generate an initial random pattern
  currentPattern = generateRandomPattern()
  remixButton.innerText = currentPattern.name
  
  // Save original mouse handlers before replacing them
  const origMouseDown = canvas.onmousedown
  const origMouseMove = canvas.onmousemove
  const origMouseUp = canvas.onmouseup
  
  // change how the mouse works - FIXED VERSION
  canvas.onmousedown = function(event) {
    // create notes when clicking
    const x = event.clientX - canvasBounds.left
    const y = event.clientY - canvasBounds.top
    
    circle(x, y)
    listofcircles.push([x, y])
    synthmaker(x, y)
    isDragging = true
  }
  
  // Fix the mousemove handler to properly handle dragging
  canvas.onmousemove = function(event) {
    if (isDragging && listofsynths.length > 0) {
      const x = event.clientX - canvasBounds.left
      const y = event.clientY - canvasBounds.top
      const lastSynth = listofsynths[listofsynths.length - 1]
      const hz = turnXintoHZ(x)
      const volume = turnYtoVolume(y)
      lastSynth.frequency.rampTo(hz, 0.1)
      lastSynth.volume.rampTo(volume, 0.1)

      // Update the last circle's position instead of creating new ones
      const lastCircleIndex = listofcircles.length - 1
      if (lastCircleIndex >= 0) {
        listofcircles[lastCircleIndex] = [x, y]
      }

      // Redraw everything
      ctx.clearRect(0, 0, width, height)
      morelines()
      listofcircles.forEach(circl => circle(circl[0], circl[1]))
    }
  }
  
  // Add a proper mouseup handler
  canvas.onmouseup = function() {
    isDragging = false
  }
  
  // start playing
  startCCSequence()
}

// turning off crystal castles mode
function stopCrystalCastlesMode() {
  // stop all sound loops
  clearInterval(ccInterval)
  clearInterval(noteRemovalInterval)
  ccInterval = null
  noteRemovalInterval = null
  
  // update the buttons
  ccButton.innerText = "Alice Practice Mode"
  remixButton.style.display = 'none'
  ccModeActive = false
  
  // put the mouse back to normal
  canvas.onmousedown = originalMouseDown
  canvas.onmousemove = originalMouseMove
  canvas.onmouseup = originalMouseUp
}

// clear all the notes
function clearAllNotes() {
  // stop all sounds
  listofsynths.forEach(synth => synth.triggerRelease())
  
  // clear all the arrays
  listofsynths = []
  listofcircles = []
  
  // redraw the grid
  ctx.clearRect(0, 0, width, height)
  morelines()
}

// playing notes in crystal castles style
function play(time) {
  // get current position like in the coldplay example
  const s = step % totalSteps
  const b = bar % totalBars
  
  // Check the pattern type and call the appropriate function
  if (currentPattern.pattern === "ripple") {
    playRipplePattern(s, b)
  } else if (currentPattern.pattern === "sixteenth") {
    playSixteenthPattern(s, b)
  } else if (currentPattern.pattern === "melody") {
    playMelodyPattern(s, b)
  } else {
    playBasicPattern(s, b)
  }
  
  // move to next step
  step++
  if (s === totalSteps - 1) bar++
}

// Basic pattern for songs like Vanished and Crimewave
function playBasicPattern(s, b) {
  const scales = currentPattern.scale
  const rightHandArp = currentPattern.rightArp[b]
  
  // play based on what step we're on
  if (s % 8 === 0) {
    // bass notes on main beats
    const chord = currentPattern.chords[b]
    
    // Occasionally use extra low bass for variety
    const useExtraLowBass = Math.random() > 0.7
    const scaleToUse = useExtraLowBass ? scales.leftLow : scales.left
    const bassNote = scaleToUse[chord[0]]
    
    // figure out where to put it
    const freq = Tone.Frequency(bassNote).toFrequency()
    const xRatio = (Math.log(freq) - Math.log(lowestNote)) / 
                  (Math.log(highestNote) - Math.log(lowestNote))
    const x = Math.max(10, Math.min(width - 10, xRatio * width))
    const y = height * 0.7 // lower for bass
    
    // make the circle
    circle(x, y)
    listofcircles.push([x, y])
    
    // make the sound
    ccSynthmaker(x, y, -8) // bass a bit louder
  }
  
  // melody notes on beats
  if (s % 2 === 0) {
    const arpIndex = (s / 2) % 8
    const noteIndex = rightHandArp[arpIndex]
    
    // Randomly choose octave for variety but not too often
    let scaleChoice = Math.random()
    let scaleToUse
    let yPos
    
    if (scaleChoice > 0.85) {
      // Higher octave occasionally
      scaleToUse = scales.rightHigh
      yPos = height * 0.15 // higher position
    } else if (scaleChoice > 0.7) {
      // Lower octave sometimes
      scaleToUse = scales.rightLow
      yPos = height * 0.4 // middle-ish position
    } else {
      // Regular octave most of the time
      scaleToUse = scales.right
      yPos = height * 0.3 // regular position
    }
    
    const note = scaleToUse[noteIndex]
    
    // figure out where to put it
    const freq = Tone.Frequency(note).toFrequency()
    const xRatio = (Math.log(freq) - Math.log(lowestNote)) / 
                  (Math.log(highestNote) - Math.log(lowestNote))
    const x = Math.max(10, Math.min(width - 10, xRatio * width))
    const y = yPos
    
    // make the circle
    circle(x, y)
    listofcircles.push([x, y])
    
    // make the sound
    ccSynthmaker(x, y, -10) // normal volume for melody
  }
  
  // clean up old notes when there's too many
  cleanupNotes()
}

// Magic Spells "ripple" pattern
function playRipplePattern(s, b) {
  const scales = currentPattern.scale
  const arpPattern = currentPattern.rightArp[b]
  const bassPattern = currentPattern.bassPattern[b]
  
  if (s % 2 === 0) { // On every 8th note
    // Play bass note
    const bassNote = scales.leftLow[bassPattern[s/2 % 8]]
    const bassFreq = Tone.Frequency(bassNote).toFrequency()
    const bassXRatio = (Math.log(bassFreq) - Math.log(lowestNote)) / 
                    (Math.log(highestNote) - Math.log(lowestNote))
    const bassX = Math.max(10, Math.min(width - 10, bassXRatio * width))
    const bassY = height * 0.8 // very low for bass
    
    // Draw and play bass
    circle(bassX, bassY)
    listofcircles.push([bassX, bassY])
    ccSynthmaker(bassX, bassY, -8)
    
    // Rippling chord pattern - play 3-4 notes in quick succession
    const chordIdx = arpPattern[s/2 % 8]
    const notesInChord = [0, 2, 4] // Triad chord notes
    
    // Play each note in the chord with slight timing offsets
    for (let i = 0; i < notesInChord.length; i++) {
      setTimeout(() => {
        if (!ccModeActive) return // Stop if mode was turned off
        
        const noteIndex = (chordIdx + notesInChord[i]) % 7 // Stay in scale
        
        // Choose which octave to use - alternate between octaves for arpeggio effect
        const useHigherOctave = i % 2 === 1
        const scaleToUse = useHigherOctave ? scales.rightHigh : scales.right
        
        const note = scaleToUse[noteIndex]
        
        // Calculate position
        const freq = Tone.Frequency(note).toFrequency()
        const xRatio = (Math.log(freq) - Math.log(lowestNote)) / 
                      (Math.log(highestNote) - Math.log(lowestNote))
        const x = Math.max(10, Math.min(width - 10, xRatio * width))
        
        // Space notes vertically based on the chord position
        const y = height * (0.2 + (i * 0.05))
        
        // Make visual and sound
        circle(x, y)
        listofcircles.push([x, y])
        ccSynthmaker(x, y, -12 + i) // Gradually louder for ripple effect
      }, i * 30) // Staggered timing to create ripple effect
    }
  }
  
  // Clean up old notes
  cleanupNotes()
}

// Courtship Dating rapid 16th note pattern
function playSixteenthPattern(s, b) {
  const scales = currentPattern.scale
  const rightHandArp = currentPattern.rightArp[b]
  const bassPattern = currentPattern.bassPattern[b]
  
  // Play bass/sustained notes on 8th notes
  if (s % 2 === 0) {
    const bassNote = scales.leftLow[bassPattern[s/2 % 8]]
    const bassFreq = Tone.Frequency(bassNote).toFrequency()
    const bassXRatio = (Math.log(bassFreq) - Math.log(lowestNote)) / 
                     (Math.log(highestNote) - Math.log(lowestNote))
    const bassX = Math.max(10, Math.min(width - 10, bassXRatio * width))
    const bassY = height * 0.75
    
    // Draw and play bass
    circle(bassX, bassY)
    listofcircles.push([bassX, bassY])
    ccSynthmaker(bassX, bassY, -8)
  }
  
  // Play 16th note pattern on every step
  // This is characteristic of Courtship Dating
  const noteIndex = rightHandArp[s % 8]
  
  // 50% chance of using high octave for extra brightness
  const useHighOctave = Math.random() > 0.5
  const scaleToUse = useHighOctave ? scales.rightHigh : scales.right
  
  const note = scaleToUse[noteIndex]
  const xRatio = (Math.log(freq) - Math.log(lowestNote)) / 
                (Math.log(highestNote) - Math.log(lowestNote))
  const x = Math.max(10, Math.min(width - 10, xRatio * width))
  const y = height * 0.25 // Higher position for rapid notes
  
  // Draw and play note
  circle(x, y)
  listofcircles.push([x, y])
  ccSynthmaker(x, y, -12) // Quieter for fast notes
  
  // Clean up old notes
  cleanupNotes()
}

// Not In Love pattern with melody line and sustained chords
function playMelodyPattern(s, b) {
  const scales = currentPattern.scale
  const rightHandArp = currentPattern.rightArp[b]
  const bassPattern = currentPattern.bassPattern[b]
  
  // Play sustained chord every half-bar (simulates the whole notes in the sheet)
  if (s % 8 === 0) {
    const chord = currentPattern.chords[b]
    
    // Play chord notes
    for (let i = 0; i < chord.length; i++) {
      const noteIdx = chord[i]
      const note = scales.left[noteIdx]
      
      // Calculate position
      const freq = Tone.Frequency(note).toFrequency()
      const xRatio = (Math.log(freq) - Math.log(lowestNote)) / 
                    (Math.log(highestNote) - Math.log(lowestNote))
      const x = Math.max(10, Math.min(width - 10, xRatio * width))
      const y = height * 0.6 // Middle for sustained chords
      
      // Draw and play note
      circle(x, y)
      listofcircles.push([x, y])
      ccSynthmaker(x, y, -10)
    }
  }
  
  // Play melody pattern
  if (s % 2 === 0) {
    const arpIndex = (s / 2) % 8
    let noteIndex = rightHandArp[arpIndex]
    
    // Not In Love has varied octaves in the melody
    let scaleToUse = scales.right
    
    // For the second half of the bar, use higher octave
    if (s >= 8) {
      scaleToUse = scales.rightHigh
    }
    
    const note = scaleToUse[noteIndex]
    
    // Calculate position
    const freq = Tone.Frequency(note).toFrequency()
    const xRatio = (Math.log(freq) - Math.log(lowestNote)) / 
                  (Math.log(highestNote) - Math.log(lowestNote))
    const x = Math.max(10, Math.min(width - 10, xRatio * width))
    const y = height * 0.2 // Higher position for melody
    
    // Draw and play note
    circle(x, y)
    listofcircles.push([x, y])
    ccSynthmaker(x, y, -10)
    
    // Sometimes add a sixteenth note after for rhythmic interest
    if (Math.random() > 0.8) {
      setTimeout(() => {
        if (!ccModeActive) return // Stop if mode was turned off
        
        // Higher note for interest
        const nextNoteIdx = (noteIndex + 2) % 7
        const nextNote = scaleToUse[nextNoteIdx]
        
        // Calculate position
        const nextFreq = Tone.Frequency(nextNote).toFrequency()
        const nextXRatio = (Math.log(nextFreq) - Math.log(lowestNote)) / 
                        (Math.log(highestNote) - Math.log(lowestNote))
        const nextX = Math.max(10, Math.min(width - 10, nextXRatio * width))
        const nextY = height * 0.15 // Even higher position
        
        // Draw and play note
        circle(nextX, nextY)
        listofcircles.push([nextX, nextY])
        const synth = ccSynthmaker(nextX, nextY, -12)
        
        // Release quickly for staccato effect
        setTimeout(() => synth.triggerRelease(), 100)
      }, 125) // 16th note timing
    }
  }
  
  // Clean up old notes
  cleanupNotes()
}

// Function to clean up old notes
function cleanupNotes() {
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
    
    // redraw everything
    ctx.clearRect(0, 0, width, height)
    morelines()
    listofcircles.forEach(circl => circle(circl[0], circl[1]))
  }
}

// start playing the sequence
function startCCSequence() {
  // get how fast to play
  const tempo = currentPattern.tempo
  
  // figure out timing
  const msPerStep = (60000 / tempo) / 4
  
  // make notes short and choppy like crystal castles
  noteRemovalInterval = setInterval(() => {
    if (listofsynths.length > 0) {
      // stop recent notes quickly
      const lastIndex = listofsynths.length - 1
      if (lastIndex >= 0) {
        listofsynths[lastIndex].triggerRelease()
      }
    }
  }, msPerStep * 0.6) // cut off after 60% of the step
  
  // main loop that calls the play function
  ccInterval = setInterval(() => {
    play()
  }, msPerStep)
}

})