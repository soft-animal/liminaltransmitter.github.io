// LET"S CREATE A CANVAS!! :)
canvas = document.createElement('canvas')
document.body.appendChild(canvas)
width = 1400
height = 600
canvas.width = width
canvas.height = height
canvas.style.backgroundColor = 'black'

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

listofcircles = []
listofsynths = []

function clickingcircle(event){
x = event.clientX - canvasBounds.left
y = event.clientY - canvasBounds.top
circle(x,y)
listofcircles.push([x,y])
synthmaker(x)
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

function synthmaker(x) {
    hz = turnXintoHZ(x)
    const synth = new Tone.Synth({
        portamento: 0,
        oscillator: {
          type: 'square4'
        },
        envelope: {
          attack: 2,
          decay: 1,
          sustain: 0.2,
          release: 2
        }
      }).toDestination()
      synth.triggerAttack(hz)
      listofsynths.push(synth)
}

// Make pressing D start or stop a drum beat
// Keep track of if drums are playing
drumsPlaying = false
drum = new Tone.MembraneSynth().toDestination();
// Length of each beat
sep = Tone.Time("8n").toSeconds()
const loop = new Tone.Loop((time) => {
    // [low, ..., high, ..., low, low, high, ...]
    drum.triggerAttackRelease("C2", "8n", time + 0 * sep);
    // .triggerAttackRelease(..., "8n", time + 1 * sep);
    drum.triggerAttackRelease("C4", "8n", time + 2 * sep);
    // .triggerAttackRelease(..., "8n", time + 3 * sep);
    drum.triggerAttackRelease("C2", "8n", time + 4 * sep);
    drum.triggerAttackRelease("C2", "8n", time + 5 * sep);
    drum.triggerAttackRelease("C4", "8n", time + 6 * sep);
    // .triggerAttackRelease(..., "8n", time + 7 * sep);
}, "1n")

document.addEventListener("keydown", (event) => {
    if (event.key === "d") {
        Tone.start()
        Tone.Transport.start()
        if (drumsPlaying) {
            drumsPlaying = false
            loop.stop()
        } else {
            drumsPlaying = true
            loop.start()
        }
    }
})
