let sdf;
let r;
let k;

let doUnion = false;
let doSmooth = false;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  sdf = createFilterShader(`
    precision highp float;

    varying vec2 vTexCoord;
    uniform sampler2D tex0;
    uniform vec2 texelSize;
    uniform vec2 canvasSize;
    uniform float r;
    uniform vec2 mouse;
    uniform float k;

    uniform bool drawOutline;
    uniform bool doUnion;
    uniform bool doSmooth;

    float opSmoothUnion( float d1, float d2, float k )
    {
      float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
      return mix( d2, d1, h ) - k*h*(1.0-h);
    }

    void main() {
      float aspect = canvasSize.x / canvasSize.y;
      vec2 coord = vTexCoord - 0.5;
      coord.y /= aspect;

      float dist = length(coord) - r;
      if (doUnion) {
        vec2 coord2 = mouse;
        coord2.y /= aspect;
        float dist2 = length(coord - coord2) - r;
        if (doSmooth) {
          dist = opSmoothUnion(
            dist,
            dist2,
            k
          );
        } else {
          dist = min(dist, dist2);
        }
      }

      if (drawOutline) {
        float d = abs(dist) * max(canvasSize.x, canvasSize.y);
        gl_FragColor = mix(vec4(0.,0.,0.,1.), vec4(1.,1.,1.,1.), smoothstep(3., 4., d));
      } else {
        if (dist < 0.) {
          gl_FragColor = mix(vec4(1.,1.,1.,1.), vec4(0.,0.,1.,1.), pow(clamp(-dist, 0., 0.5), 0.5));
        } else {
          gl_FragColor = mix(vec4(1.,1.,1.,1.), vec4(1.,0.,0.,1.), pow(clamp(dist, 0., 0.5), 0.5));
        }
      }
    }
  `);
  r = createSlider(0, 0.5, 0, 0.001);
  r.position(25, 10);
  createP("<em>r</em>")
    .position(10, 10)
    .style("margin", 0)
    .style("fontSize", "20px");

  const params = getURLParams();
  doUnion = !!params.union;
  doSmooth = !!params.smooth;
  if (doSmooth) {
    k = createSlider(0, 0.5, 0.1, 0.001);
    k.position(25, 30);
    createP("<em>k</em>")
      .position(10, 30)
      .style("margin", 0)
      .style("fontSize", "20px");
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  sdf.setUniform("r", r.value());
  sdf.setUniform("drawOutline", mouseIsPressed);
  sdf.setUniform("doUnion", doUnion);
  sdf.setUniform("mouse", [
    map(mouseX, 0, width, -0.5, 0.5),
    map(mouseY, 0, height, -0.5, 0.5),
  ]);
  sdf.setUniform("doSmooth", doSmooth);
  if (k) sdf.setUniform("k", k.value());
  filter(sdf);
}
