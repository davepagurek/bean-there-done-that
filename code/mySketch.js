/*
So this is a project for a paper for SIGBOVIK (https://sigbovik.org/2024/), a
conference for joke CS papers. My project is to let you upload a photo of a
city landmark (masked to just the landmark, try using remove.bg to get one)
and turn it into a bean like Chicago's Cloud Gate, probably a better use of
land than whatever your building was. Paper and video coming soon!

This uses a genetic optimization algorithm to make small changes to the beans
to slowly better approximate the input image. Each is made of some Bezier
segments, combined with a smooth union sdf.

This was my SIGBOVIK project last year: https://github.com/davepagurek/jalgorithm
*/

let renderer
let inputImg
let spheremap
let optimizer
let picker
OPC.slider({ name: 'smoothness', label: 'Smoothness', min: 0, max: 1, step: 0.01, value: 0.33 })
OPC.toggle({ name: 'dilate', label: 'Puff Out Input', value: true })
OPC.toggle({ name: 'optimize', label: 'Run Optimization', value: true })

function preload() {
	// spheremap = loadImage('https://p5js.org/reference/assets/outdoor_spheremap.jpg')
	spheremap = loadImage('dusseldorf_bridge.jpg')
	inputImg = loadImage('Parliament_of_Canada_Building-removebg-preview.png')
}

function setup() {
  createCanvas(window.innerWidth, window.innerHeight, WEBGL)
	pixelDensity(1)
	
	optimizer = new BeanFitter(inputImg, dilate)
	renderer = createBeanRenderer()
	
	input = createFileInput(handleImage)
  input.position(20, 20)
}

function handleImage(file) {
  if (file.type === 'image') {
		let img = createImg(file.data, '', 'anonymous', () => {
			const graphic = createGraphics(img.elt.naturalWidth, img.elt.naturalHeight)
			graphic.image(img, 0, 0)
			img.remove()
			img = graphic.get()
			graphic.remove()
			optimizer.remove()
			optimizer = new BeanFitter(img, dilate)
		})
  }
}

let lastDilate = dilate
function draw() {
	background(255)
	
	if (lastDilate !== dilate) {
		const oldOptimizer = optimizer
		optimizer = new BeanFitter(optimizer.target, dilate)
		oldOptimizer.remove()
	}
	lastDilate = dilate
	
	if (optimize) optimizer.optimize()
	
	push()
	resetMatrix()
	translate(0, -height/2 + 200)
	optimizer.draw()
	pop()
	
	orbitControl()
	push()
	translate(0, height/3 - 100)
	renderer.draw(optimizer.bestParams, smoothness)
	pop()
}