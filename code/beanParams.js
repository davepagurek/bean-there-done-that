class BeanParams {
	constructor(segments, maxThickness) {
		this.minSegments = 1
		this.maxSegments = 8
		this.maxThickness = maxThickness || 1
		this.segments = segments || []
		if (this.segments.length === 0) {
			const numSegments = round(random(this.minSegments, this.maxSegments))
			for (let i = 0; i < numSegments; i++) {
				this.segments.push(new QuadraticBezierParam(
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					this.maxThickness,
				))
			}
		}
	}
	
	mutate(sd) {
		const newSegments = [...this.segments]
		
		const changeSegments = random() < sd / 5
		if (changeSegments) {
			if (this.segments.length < this.maxSegments && random() < 0.5) {
				newSegments.push(new QuadraticBezierParam(
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					this.maxThickness,
				))
			} else if (this.segments.length > this.minSegments) {
				newSegments.splice(floor(random(newSegments.length)), 1)
			}
		} else {
			const toMutate = floor(random(newSegments.length))
			newSegments[toMutate] = newSegments[toMutate].mutate(sd)
		}
		return new BeanParams(newSegments, this.maxThickness)
	}
}

class QuadraticBezierParam {
	constructor(ax, ay, bend, cx, cy, thickness, maxThickness) {
		this.ax = ax === undefined ? new FloatParam(0, 1) : ax
		this.ay = ay === undefined ? new FloatParam(0, 1) : ay
		this.bend = bend === undefined ? new FloatParam(-0.4, 0.4) : bend
		this.cx = cx === undefined ? new FloatParam(0, 1) : cx
		this.cy = cy === undefined ? new FloatParam(0, 1) : cy
		this.thickness = thickness || new FloatParam(0.1, max(maxThickness || 1, 0.15))
	}
	
	b() {
		const centerX = (this.ax.value + this.cx.value) / 2
		const centerY = (this.ay.value + this.cy.value) / 2
		let normY = this.cx.value - this.ax.value
		let normX = -(this.cy.value - this.ay.value)
		// const hyp = Math.hypot(normX, normY) || 1
		// normX /= hyp
		// normY /= hyp
		const bx = centerX + this.bend.value * normX * 0.5
		const by = centerY + this.bend.value * normY * 0.5
		return { bx, by }
	}
	bx() { return this.b().bx }
	by() { return this.b().by }
	
	mutate(sd) {
		let { ax, ay, bend, cx, cy, thickness } = this
		const params = { ax, ay, bend, cx, cy, thickness }
		const key = random(['ax', 'ay', 'bend', 'cx', 'cy', 'thickness', 'thickness'])
		params[key] = params[key].mutate(sd)
		return new QuadraticBezierParam(
			params.ax, params.ay,
			params.bend,
			params.cx, params.cy,
			params.thickness,
			params.thickness.maxVal,
		)
	}
}

class FloatParam {
	constructor(minVal, maxVal, value) {
		this.minVal = minVal
		this.maxVal = maxVal
		this.value = value === undefined ? random(minVal, maxVal) : value
	}
	
	mutate(sd) {
		return new FloatParam(
			this.minVal,
			this.maxVal,
			constrain(
				randomGaussian(this.value, sd * (this.maxVal - this.minVal)),
				this.minVal,
				this.maxVal,
			),
		)
	}
}