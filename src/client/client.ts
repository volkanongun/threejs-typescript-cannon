import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import {GUI} from 'dat.gui'
import {OutlineEffect} from 'three/examples/jsm/effects/OutlineEffect'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'

import { Object3D } from 'three'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x8E8B8B) // solid color

const offsetValues = [0.75, 0.6, 0.4, 0.25]

const backgroundGradientGeomety = new THREE.IcosahedronGeometry(300,2);
const backgroundGradientMaterial = new THREE.MeshBasicMaterial({ 
  map: gradientTexture(offsetValues, [new THREE.Color(0x1B1D1E),new THREE.Color(0x3D4143),new THREE.Color(0x72797D),new THREE.Color(0xb1018)]),
  side:THREE.DoubleSide
})
const backMesh = new THREE.Mesh( backgroundGradientGeomety, backgroundGradientMaterial );
backMesh.name = "BackgroundGradient"
scene.add(backMesh);

function gradientTexture(offset: number[], hexColors: THREE.Color[]) {
  const c = document.createElement("canvas");
  const ct = c.getContext("2d")!;
  const size = 1024;
  c.width = 1;
  c.height = size;

  const gradient = ct.createLinearGradient(0,size,0,0);
  let i = offset.length;
  
  while(i--){ 
    gradient.addColorStop(offset[i], "#" + hexColors[i].getHexString());
  }

  ct.fillStyle = gradient;
  ct.fillRect(0,0,16,size);
  const texture = new THREE.Texture(c);
  texture.needsUpdate = true;
  return texture;
}

const ambientLight = new THREE.AmbientLight( 0xFFFFFF, 0.16 );
ambientLight.name = "Ambient Light"
scene.add( ambientLight );

const directionalLight = new THREE.DirectionalLight(0xE4E9ED, 1)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 4096
directionalLight.shadow.mapSize.height = 4096
directionalLight.shadow.camera.near = 0.1
directionalLight.shadow.camera.far = 100
directionalLight.shadow.camera.left = -100
directionalLight.shadow.camera.right = 100
directionalLight.shadow.camera.top = 100
directionalLight.shadow.camera.bottom = -100
scene.add(directionalLight)
directionalLight.name = "Directional Light"
directionalLight.position.set(-4,5,3)

// const helper = new THREE.CameraHelper(directionalLight.shadow.camera)
// scene.add(helper)

const sceneMeshes : THREE.Mesh[] = []

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)

camera.position.set(0,8,15)

const renderer = new THREE.WebGLRenderer({antialias: true})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const orbit = new OrbitControls(camera, renderer.domElement)
orbit.target.set(0,3,0)
orbit.minDistance = 20
orbit.maxDistance = 43

const outlineConfig = {
  defaultThickness: .005,
  defaultColor: [ .09, 0.17, 0.15 ],
  defaultAlpha: .8,
  defaultKeepAlive: true // keeps outline material in cache even if material is removed from scene
}

let outline = new OutlineEffect( renderer, outlineConfig);

const fiveTone = new THREE.TextureLoader().load('img/gradientMaps/fiveTone.jpg')
fiveTone.minFilter = THREE.NearestFilter
fiveTone.magFilter = THREE.NearestFilter

const toonmaterial: THREE.MeshToonMaterial = new THREE.MeshToonMaterial({
    color: 0x18BFE3,
    gradientMap: fiveTone,
})

const toonjointmaterial: THREE.MeshToonMaterial = new THREE.MeshToonMaterial({
  color: 0X1C5B72,
  gradientMap: fiveTone,
})

const planeGeometry = new THREE.PlaneGeometry(1000,1000)
const planeMaterial = new THREE.ShadowMaterial({
  color: 0x262931,
})

const ground = new THREE.Mesh(planeGeometry, planeMaterial)
scene.add(ground)
ground.rotation.set(-Math.PI/2,0,0)
ground.receiveShadow = true
ground.name = "Ground"
sceneMeshes.push(ground)

let mixers: THREE.AnimationMixer[] = []
let modelsReady = false
let animationActions: THREE.AnimationAction[] = []
const gltfLoader = new GLTFLoader()

const animations = {
  default: function (spiderId: any) {
    // console.log(spiderId, animationActions[spiderId])
    setAction(animationActions[spiderId])
  }
}

const setAction = (toAction: THREE.AnimationAction) => {
  console.log(toAction)
  if (toAction) {
    toAction.play()
  }
}

const spiders: THREE.Group[] = []

for (let i = 0; i < 10; i++) {

  gltfLoader.load('models/Spider.glb', function (gltf) {

    gltf.scene.traverse(function(child){
      
      if ((child as THREE.Mesh).isMesh) {
        let mesh = (child as THREE.Mesh)
        mesh.castShadow = true

        switch (mesh.name) {
          case "Object_10":
            mesh.material = toonjointmaterial
            // spider.add(mesh)
            break;
          case "Object_11":
            mesh.material = toonmaterial
            // spider.add(mesh)
            break;
        }

      }
    })

    scene.add(gltf.scene)
    gltf.scene.name = `${"Spider" + i}`
    gltf.scene.position.set(getRandomInt(-15,15), 0, getRandomInt(-15,15))
    gltf.scene.scale.set(2.5, 2.5, 2.5)
    gltf.scene.userData.id = i
    spiders.push(gltf.scene)

    const animationMixer = new THREE.AnimationMixer(gltf.scene)
    mixers.push(animationMixer)
    animationActions.push(animationMixer.clipAction((gltf as any).animations[0]))

    modelsReady = true

  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded'),
  (error) => (console.log(error)))
}

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.random() * (max - min) + min;
}

window.addEventListener('resize', onWindowResize, false)

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

const stats = Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()

const directionalLightFolder = gui.addFolder('DirectionalLight')
directionalLightFolder
    .add(directionalLight.shadow.camera, 'left', -100, 100, 0.1)
    .onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(directionalLight.shadow.camera, 'right', -100, 100, 0.1)
    .onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(directionalLight.shadow.camera, 'top', -100, 100, 0.1)
    .onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(directionalLight.shadow.camera, 'bottom', -100, 100, 0.1)
    .onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(directionalLight.shadow.camera, 'near', 0.1, 100)
    .onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(directionalLight.shadow.camera, 'far', 0.1, 100)
    .onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
directionalLightFolder.add(directionalLight.position, 'x', -50, 50, 0.01)
directionalLightFolder.add(directionalLight.position, 'y', -50, 50, 0.01)
directionalLightFolder.add(directionalLight.position, 'z', -50, 50, 0.01)
directionalLightFolder.add(directionalLight, "intensity", 0, 1, .01)

const ambientLightFolder = gui.addFolder("AmibentLight")
ambientLightFolder.add(ambientLight, 'intensity', 0, 1, 0.01)
ambientLightFolder.open()

const cameraFolder = gui.addFolder('camera')
cameraFolder.add(camera.position, 'z', 0, 20)
cameraFolder.open()

const materialFolder = gui.addFolder('Material')

interface Config {
  ToonColor: number;
  ToonJointsColor : number;
  OutlineR: number;
  OutlineG: number;
  OutlineB: number;
  ShadowColor: number;
  SceneColor: number;
  BGColor1: number;
  BGColor2: number;
  BGColor3: number;
  BGColor4: number;
}

const config: Config = {
  "ToonColor" : 0x18BFE3,
  "ToonJointsColor" : 0X1C5B72,
  "OutlineR": outlineConfig.defaultColor[0],
  "OutlineG": outlineConfig.defaultColor[1],
  "OutlineB": outlineConfig.defaultColor[2],
  "ShadowColor": 0x262931,
  "SceneColor": 0x8E8B8B,
  "BGColor1": 0x1B1D1E,
  "BGColor2": 0x3D4143,
  "BGColor3": 0x72797D,
  "BGColor4": 0xb1018
}

materialFolder.addColor(config, "ToonColor").onChange(function(e){
  toonmaterial.color.setHex(e)
})

materialFolder.addColor(config, "ToonJointsColor").onChange((e)=>{
  toonjointmaterial.color.setHex(e)
})

materialFolder.add(config, "OutlineR", 0, 1, .01).onChange((e)=>{outline = new OutlineEffect( renderer, {defaultColor:[e,config.OutlineG,config.OutlineB]})})
materialFolder.add(config, "OutlineG", 0, 1, .01).onChange((e)=>{outline = new OutlineEffect( renderer, {defaultColor:[config.OutlineR,e,config.OutlineB]})})
materialFolder.add(config, "OutlineB", 0, 1, .01).onChange((e)=>{outline = new OutlineEffect( renderer, {defaultColor:[config.OutlineR,config.OutlineG,e]})})

materialFolder.addColor(config, "ShadowColor").onChange(function(e){
  planeMaterial.color.setHex(e)
})
materialFolder.open()

const sceneColorFolder = gui.addFolder("SceneColor")
sceneColorFolder.addColor(config, "SceneColor").onChange((e)=>{
  scene.background = new THREE.Color(e)
})
sceneColorFolder.open()

const backgroundGradientCustomization = gui.addFolder("Background Gradient Customization")
backgroundGradientCustomization.addColor(config, "BGColor1").onChange((e)=>{
  backgroundGradientMaterial.map = gradientTexture(offsetValues, [new THREE.Color(e), new THREE.Color(config.BGColor2), new THREE.Color(config.BGColor3), new THREE.Color(config.BGColor4)])
  backMesh.material.needsUpdate = true
})
backgroundGradientCustomization.addColor(config, "BGColor2").onChange((e)=>{
  backgroundGradientMaterial.map = gradientTexture(offsetValues, [new THREE.Color(config.BGColor1), new THREE.Color(e), new THREE.Color(config.BGColor3), new THREE.Color(config.BGColor4)])
  backMesh.material.needsUpdate = true
})
backgroundGradientCustomization.addColor(config, "BGColor3").onChange((e)=>{
  backgroundGradientMaterial.map = gradientTexture(offsetValues, [new THREE.Color(config.BGColor1), new THREE.Color(config.BGColor2), new THREE.Color(e), new THREE.Color(config.BGColor4)])
  backMesh.material.needsUpdate = true
})
backgroundGradientCustomization.addColor(config, "BGColor4").onChange((e)=>{
  backgroundGradientMaterial.map = gradientTexture(offsetValues, [new THREE.Color(config.BGColor1), new THREE.Color(config.BGColor2), new THREE.Color(config.BGColor3), new THREE.Color(e)])
  backMesh.material.needsUpdate = true
})
backgroundGradientCustomization.open()

const animationsFolder = gui.addFolder('Animations')
animationsFolder.open()

const raycaster = new THREE.Raycaster()
const targetQuaternion = new THREE.Quaternion()

renderer.domElement.addEventListener("click", onClick)

const cubeGeometry = new THREE.BoxGeometry(1,1,1)
const cubeMaterial = new THREE.MeshStandardMaterial({
  transparent: true,
  color: 0xFF0000,
  opacity: .5
})
const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial)
cubeMesh.scale.set(4,2,4)
cubeMesh.castShadow = true

let point: THREE.Vector3 = new THREE.Vector3()
let currentSpider : any = null

function onClick(e: MouseEvent) {

  const mouse = {
    x: (e.clientX / renderer.domElement.clientWidth) * 2 - 1,
    y: -(e.clientY / renderer.domElement.clientHeight) * 2 + 1,
  }
    
  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects( scene.children )
  
  if(intersects.length > 0){

    for (let i = 0; i < intersects.length; i++) {
      
      const obj = intersects[i]

      if(obj.object.name === "Ground"){
        point = obj.point
        const distance = currentSpider.position.distanceTo(point)

        const rotationMatrix = new THREE.Matrix4()
        rotationMatrix.lookAt(point, currentSpider.position, currentSpider.up)
        targetQuaternion.setFromRotationMatrix(rotationMatrix)

        animations.default(currentSpider.userData.id)

        new TWEEN.Tween(currentSpider.position)
          .to({
            x: point.x,
            y: point.y,
            z: point.z
          }, 300 / 2 * distance)
          .start()
          .onComplete(function(){
            animationActions[currentSpider.userData.id].stop()
            console.log("walked")
          })

        new TWEEN.Tween(cubeMesh.position)
          .to({
            x: point.x,
            y: point.y,
            z: point.z
          }, 300 / 2 * distance)
          .start()
          .onComplete(function(){
            //console.log("cube position update")
          })

        return
      }

      if(obj.object.type == "SkinnedMesh"){

        obj.object.traverseAncestors((child)=>{
          if(child.type === "Group"){
            currentSpider = child
            scene.add(cubeMesh)
            cubeMesh.position.copy(currentSpider.position).setY(1)

            const animationAction = animationActions[currentSpider.userData.id];
            currentSpider.userData.animationAction = animationAction
          }
        })

      }

    }
  }
  
}

const animationClock = new THREE.Clock()

function animate() {

    requestAnimationFrame(animate)

    stats.update()
    
    if (modelsReady && currentSpider !== null) {
      mixers[currentSpider.userData.id].update(animationClock.getDelta())
    }

    if(currentSpider !== null && !currentSpider.quaternion.equals(targetQuaternion)){
      currentSpider.quaternion.rotateTowards(targetQuaternion, animationClock.getDelta() * 400)
    }

    camera.lookAt(new THREE.Vector3(0,3,0))

    TWEEN.update()

    render()

}

function render(){
  outline.render(scene, camera)
}

animate()