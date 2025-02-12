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