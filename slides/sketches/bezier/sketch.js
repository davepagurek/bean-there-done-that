const pts = []
let hoveredPt = null

function setup() {
  createCanvas(windowWidth, windowHeight);
  pts.push(createVector(-200, 50))
  pts.push(createVector(0, -50))
  pts.push(createVector(200, 50))
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(255)
  translate(width/2, height/2)
  scale(min(width, height) / 600)

  noFill()
  stroke(0)
  strokeWeight(100)
  beginShape()
  vertex(pts[0].x, pts[0].y)
  quadraticVertex(pts[1].x, pts[1].y, pts[2].x, pts[2].y)
  endShape()

  if (mouseIsPressed) {
    noFill()
    stroke(255, 0, 0)
    strokeWeight(2)
    beginShape()
    vertex(pts[0].x, pts[0].y)
    vertex(pts[1].x, pts[1].y)
    vertex(pts[2].x, pts[2].y)
    endShape()
  }

  if (hoveredPt) {
    for (const pt of pts) {
      if (pt === hoveredPt) {
        fill(255, 0, 0)
      } else {
        fill(255)
      }
      strokeWeight(2)
      stroke(255, 0, 0)
      circle(pt.x, pt.y, 10)
    }
  }
}

function mouseMoved() {
  if (mouseIsPressed) return
  hoveredPt = null
  let minDist = 20
  const mouse = createVector(mouseX, mouseY).sub(width/2, height/2).div(min(width, height) / 600)
  for (const pt of pts) {
    const d = pt.dist(mouse)
    if (d < minDist) {
      hoveredPt = pt
      minDist = d
    }
  }
}

function mouseDragged() {
  if (hoveredPt) {
    const mouse = createVector(mouseX, mouseY).sub(width/2, height/2).div(min(width, height) / 600)
    const mid = pts[2].copy().add(pts[0]).div(2)
    const tangent = pts[2].copy().sub(pts[0]).normalize()
    const normal = createVector(-tangent.y, tangent.x)
    if (hoveredPt === pts[1]) {
      const fromMid = mouse.copy().sub(mid)
      const len = fromMid.dot(normal)
      const newPt = mid.copy().add(normal.copy().mult(len))
      hoveredPt.set(newPt.x, newPt.y)
    } else {
      const fromMid = pts[1].copy().sub(mid)
      const len = fromMid.dot(normal)
      hoveredPt.set(mouse.x, mouse.y)

      const newMid = pts[2].copy().add(pts[0]).div(2)
      const newTangent = pts[2].copy().sub(pts[0]).normalize()
      const newNormal = createVector(-newTangent.y, newTangent.x)
      const newPt = newMid.copy().add(newNormal.copy().mult(len))
      pts[1].set(newPt.x, newPt.y)
    }
  }
}
