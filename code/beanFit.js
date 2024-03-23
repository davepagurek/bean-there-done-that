class BeanFitter {
	constructor(target, dilate) {
		const fboSize = 300
		this.fboSize = fboSize
		this.targetGraphic = createGraphics(fboSize, fboSize)
		this.targetGraphic.pixelDensity(1)
		this.beansGraphic = createGraphics(fboSize, fboSize)
		this.beansGraphic.pixelDensity(1)
		this.bestFbo = createFramebuffer({ width: fboSize, height: fboSize, density: 1 })
	
		this.target = target
		this.targetGraphic.push()
		this.targetGraphic.imageMode(CENTER)
		this.targetGraphic.translate(fboSize/2, fboSize/2)
		this.targetGraphic.scale(target.width > target.height ? fboSize/target.width : fboSize/target.height)
		this.targetGraphic.image(target, 0, 0)
		this.targetGraphic.pop()
		if (dilate) {
			for (let i = 0; i < 10; i++) {
				this.targetGraphic.filter(DILATE)
			}
		}
		this.targetGraphic.loadPixels()
		this.computeMaxThickness()
		
		this.params = new BeanParams([], this.maxThickness)
		this.bestParams = this.params
		this.segmentCost = 0.025
		this.score = 0
		this.bestScore = 0
	}
	
	remove() {
		this.targetGraphic.remove()
		this.beansGraphic.remove()
		this.bestFbo.remove()
	}
	
	computeMaxThickness() {
		let maxR = 0
		for (let i = 0; i < 500; i++) {
			const center = createVector(
				floor(random(this.fboSize)),
				floor(random(this.fboSize)),
			)
			const maxPossible = Math.min(this.fboSize-center.x, this.fboSize-center.y, center.x, center.y)
			let r;
			for (
				r = 1;
				r < maxPossible;
				r += 1
			) {
				const samples = min(80, ceil(r * TWO_PI));
				let ok = true
				for (let j = 0; j < samples; j++) {
					const angle = j/samples * TWO_PI
					const pt = createVector(
						round(center.x + r * cos(angle)),
						round(center.y + r * sin(angle)),
					)
					if (pt.x < 0 || pt.x >= this.fboSize || pt.y < 0 || pt.y >= this.fboSize) {
						continue
					}
					if (this.targetGraphic.pixels[4 * (pt.y * this.fboSize + pt.x) + 3] === 0) {
						ok = false
						break
					}
				}
				if (!ok) break
			}
			if (r > maxR) {
				maxR = r
			}
		}
		
		this.maxThickness = maxR ? 3 * maxR / this.fboSize : 1
	}
	
	optimize() {
		const lastParams = this.params
		const lastScore = this.score
		for (let i = 0; i < 4; i++) {
			this.params = this.params.mutate(max(this.score, 1/this.score)/100)
		}
		this.scoreParams()
		if (this.score > this.bestScore) {
			this.bestScore = this.score
			this.bestParams = this.params
			this.bestFbo.draw(() => {
				clear()
				imageMode(CENTER)
				image(this.beansGraphic, 0, 0)
			})
		}
		if (!(this.score > lastScore || random() < this.score / lastScore)) {
			this.params = lastParams
			this.score = lastScore
		}
		if (this.score < 0.5*this.bestScore && random(0.4) > this.score / this.bestScore) {
			this.params = this.bestParams
			this.score = this.bestScore
		}
	}
	
	draw() {
		push()
		imageMode(CENTER)
		image(this.targetGraphic, -this.beansGraphic.width, 0)
		image(this.beansGraphic, 0, 0)
		image(this.bestFbo, this.beansGraphic.width, 0)
		pop()
	}
	
	scoreParams() {
		this.drawBeans()
		this.beansGraphic.loadPixels()
		let intersection = 0
		let union = 0
		for (let i = 3; i < this.beansGraphic.pixels.length; i += 4) {
			const hasTarget = this.targetGraphic.pixels[i] > 0
			const hasBeans = this.beansGraphic.pixels[i] > 0
			if (hasTarget && hasBeans) intersection++
			if (hasTarget || hasBeans) union++
		}
		this.score = intersection / (union + 1e-6) - this.segmentCost * this.params.segments.length
	}
	
	drawBeans() {
		const { beansGraphic } = this
		beansGraphic.clear()
		beansGraphic.noFill()
		beansGraphic.stroke(0)
		for (const segment of this.params.segments) {
			beansGraphic.strokeWeight(segment.thickness.value * this.fboSize * 0.5)
			beansGraphic.beginShape()
			beansGraphic.vertex(...this.mapValues([segment.ax.value, segment.ay.value]))
			beansGraphic.quadraticVertex(
				...this.mapValues([
					segment.bx(), segment.by(),
					segment.cx.value, segment.cy.value,
				]),
			)
			beansGraphic.endShape()
		}
	}
	
	mapValues(values) {
		return values.map(v => map(v, 0, 1, 0, this.fboSize))
	}
}