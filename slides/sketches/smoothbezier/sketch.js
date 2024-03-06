function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(0.5);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(255)
  const s = min(width, height) / 600

  push()
  translate(width/2, height/2)
  scale(s)

  noFill()
  stroke(0)
  strokeWeight(100)
  beginShape()
  vertex(-200, 50)
  quadraticVertex(0, -50, 200, 50)
  endShape()
  pop()

  push()
  translate(mouseX, mouseY)
  scale()

  noFill()
  stroke(0)
  strokeWeight(100)
  beginShape()
  vertex(-200, 50)
  quadraticVertex(0, -50, 200, 50)
  endShape()

  filter(BLUR, s * 40)
  filter(THRESHOLD, 0.95)
}
