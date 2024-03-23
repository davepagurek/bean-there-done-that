function createBeanRenderer() {
	// `createShaderPark` takes in a function that defines a shape using
	// the Shader Park API avaible here:
	// https://docs.shaderpark.com/references-js/
	// shaderParkCode is loaded in from shaderParkCode.js
	// Shader Park will covert the javascript into a shdaer for you
  sdf = createShaderPark(
		function() {
			let getSegmentA = glslFunc(`
			vec2 getSegmentA(float i) {
			  return (as[int(i)] - vec2(0.5)) * 0.5;
			}
			`)
			let getSegmentB = glslFunc(`
			vec2 getSegmentB(float i) {
			  return (bs[int(i)] - vec2(0.5)) * 0.5;
			}
			`)
			let getSegmentC = glslFunc(`
			vec2 getSegmentC(float i) {
			  return (cs[int(i)] - vec2(0.5)) * 0.5;
			}
			`)
			let getSegmentThickness = glslFunc(`
			float getSegmentThickness(float i) {
			  return (thicknesses[int(i)] * 0.5) * 0.5;
			}
			`)
			let getNumSegments = glslFunc(`
			float getNumSegments() {
			  return float(numSegments);
			}
			`)
			let getSmoothness = glslFunc(`
			float getSmoothness() {
			  return smoothness;
			}
			`)
			
			let dot2 = glslFunc(`
			float dot2(vec2 v) {
			  return dot(v,v);
			}
			`)
			
			let smoothUnion = glslFunc(`
			float opSmoothUnion( float d1, float d2, float k )
			{
					float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
					return mix( d2, d1, h ) - k*h*(1.0-h);
			}
			`)

			let sdfSegment = glslSDF(`
			//https://iquilezles.org/articles/distfunctions/
			float sdBezier( in vec3 pos3, in vec2 A, in vec2 B, in vec2 C, in float thickness )
			{
					vec2 pos = pos3.xy;
					vec2 a = B - A;
					vec2 b = A - 2.0*B + C;
					vec2 c = a * 2.0;
					vec2 d = A - pos;
					float kk = 1.0/dot(b,b);
					float kx = kk * dot(a,b);
					float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
					float kz = kk * dot(d,a);      
					float res = 0.0;
					float p = ky - kx*kx;
					float p3 = p*p*p;
					float q = kx*(2.0*kx*kx-3.0*ky) + kz;
					float h = q*q + 4.0*p3;
					if( h >= 0.0) 
					{ 
							h = sqrt(h);
							vec2 x = (vec2(h,-h)-q)/2.0;
							vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
							float t = clamp( uv.x+uv.y-kx, 0.0, 1.0 );
							res = dot2(d + (c + b*t)*t);
					}
					else
					{
							float z = sqrt(-p);
							float v = acos( q/(p*z*2.0) ) / 3.0;
							float m = cos(v);
							float n = sin(v)*1.732050808;
							vec3  t = clamp(vec3(m+m,-n-m,n-m)*z-kx,0.0,1.0);
							res = min( dot2(d+(c+b*t.x)*t.x),
												 dot2(d+(c+b*t.y)*t.y) );
							// the third root cannot be the closest
							// res = min(res,dot2(d+(c+b*t.z)*t.z));
					}
					return sqrt( res + pos3.z*pos3.z ) - thickness * 0.5;
			}`)
			
			let sdfSegments = glslSDF(`
			float glslSegments(in vec3 p) {
				float d = sdBezier(p, as[0], bs[0], cs[0], thicknesses[0]);
				for (int i = 1; i < 8; i++) {
					if (i == numSegments) break;
					d = opSmoothUnion(d, sdBezier(p, as[i], bs[i], cs[i], thicknesses[i]), smoothness);
				}
				return d;
			}
			`)
			
			color(0,0,0)
			sdfSegments()
			// blend(getSmoothness())
			// for (let i = 0; i < 8; i++) {
			// 	if (i < getNumSegments()) {
			// 		sdfSegment(getSegmentA(i), getSegmentB(i), getSegmentC(i), getSegmentThickness(i))
			// 	}
			// }
		},
		{
			scale: 1.0, 
			drawGeometry: () => sphere(400)
		}
	);
	
	sdf.shader._fragSrc = sdf.shader._fragSrc.replace(
		'precision highp float;',
		`precision highp float;
		uniform vec2 as[8];
		uniform vec2 bs[8];
		uniform vec2 cs[8];
		uniform float thicknesses[8];
		uniform int numSegments;
		uniform float smoothness;
		uniform sampler2D spheremap;
		`
	).replace(
		'outputColor = col.color;',
		`
		vec3 n = reflect(
			normalize(p - cameraPosition),
			normal
			// normalize((uModelViewMatrix * vec4(normal, 0.)).xyz)
		);
		float phi = acos( n.y );
		float theta = 0.0;
		theta = acos(n.x / sin(phi));
		float sinTheta = n.z / sin(phi);
		if (sinTheta < 0.0) {
			// Turn it into -theta, but in the 0-2PI range
			theta = 2.0 * PI - theta;
		}
		theta = theta / (2.0 * 3.14159);
		phi = phi / 3.14159 ;
		vec2 angles = vec2( fract(theta + 0.25), 1.0 - phi );
		
		outputColor = pow(texture(spheremap, angles).xyz + col.color, vec3(2.));
		`
	)
  
	return {
		draw: (params, smoothness = 0.2) => {
			const as = params.segments.flatMap((seg) => [
				0.75 * (seg.ax.value - 0.5),
				0.75 * (seg.ay.value - 0.5),
			])
			const bs = params.segments.flatMap((seg) => {
				return [
					0.75 * (seg.bx() - 0.5),
					0.75 * (seg.by() - 0.5),
				]
			})
			const cs = params.segments.flatMap((seg) => [
				0.75 * (seg.cx.value - 0.5),
				0.75 * (seg.cy.value - 0.5),
			])
			const thicknesses = params.segments.flatMap((seg) => [
				seg.thickness.value * 0.5 * 0.75,
			])
			sdf.shader.setUniform('as', as)
			sdf.shader.setUniform('bs', bs)
			sdf.shader.setUniform('cs', cs)
			sdf.shader.setUniform('thicknesses', thicknesses)
			sdf.shader.setUniform('numSegments', params.segments.length)
			sdf.shader.setUniform('smoothness', smoothness)
			sdf.shader.setUniform('spheremap', spheremap)
			push()
			sdf.draw()
			pop()
		}
	}
}