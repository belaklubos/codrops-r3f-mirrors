import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useResource } from 'react-three-fiber'
import { Text, Box, useMatcapTexture, Octahedron, PerspectiveCamera } from 'drei'

import useSlerp from './use-slerp'
import { ThinFilmFresnelMap } from './ThinFilmFresnelMap'
import { mirrorsData } from './data'

const TEXT_PROPS = {
  fontSize: 3.9,
  font: 'http://fonts.gstatic.com/s/modak/v5/EJRYQgs1XtIEskMA-hI.woff'
}

function Title({ layers = undefined, ...props }) {
  const group = useRef()
  useEffect(() => void group.current.lookAt(0, 0, 0), [])
  return (
    <group {...props} ref={group}>
      <Text name="text-panna" depthTest={false} material-toneMapped={false} {...TEXT_PROPS} layers={layers}>
        PANNA
      </Text>
    </group>
  )
}

function Mirror({ sideMaterial, reflectionMaterial, args, ...props }) {
  const ref = useRef()
  useFrame(() => void ((ref.current.rotation.y += 0.001), (ref.current.rotation.z += 0.01)))
  return <Box {...props} ref={ref} args={args} material={[sideMaterial, sideMaterial, sideMaterial, sideMaterial, reflectionMaterial, reflectionMaterial]} />
}

function Mirrors({ envMap, ...props }) {
  const [thinFilmFresnelMap] = useState(new ThinFilmFresnelMap())
  const sideMaterial = useResource()
  const reflectionMaterial = useResource()
  return (
    <group name="mirrors" {...props}>
      <meshLambertMaterial ref={sideMaterial} map={thinFilmFresnelMap} color={0xaaaaaa} />
      <meshLambertMaterial ref={reflectionMaterial} map={thinFilmFresnelMap} envMap={envMap} />
      {mirrorsData.mirrors.map((mirror, index) => (
        <Mirror key={`0${index}`} {...mirror} name={`mirror-${index}`} sideMaterial={sideMaterial.current} reflectionMaterial={reflectionMaterial.current} />
      ))}
    </group>
  )
}

function TitleCopies({ layers }) {
  const vertices = useMemo(() => {
    const y = new THREE.IcosahedronGeometry(8)
    return y.vertices
  }, [])
  return (
    <group name="titleCopies">
      {vertices.map((vertex, i) => (
        <Title name={'titleCopy-' + i} position={vertex} layers={layers} />
      ))}
    </group>
  )
}

function Scene() {
  const [renderTarget] = useState(
    new THREE.WebGLCubeRenderTarget(1024, { format: THREE.RGBAFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter })
  )
  const cubeCamera = useRef()
  const group = useSlerp()

  const [matcapTexture] = useMatcapTexture('C8D1DC_575B62_818892_6E747B')

  useFrame(({ gl, scene }) => {
    if (!cubeCamera.current) return
    cubeCamera.current.update(gl, scene)
  })

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 2]} fov={70} />
      <group name="sceneContainer" ref={group}>
        <Octahedron layers={[11]} name="background" args={[20, 4, 4]} position={[0, 0, -5]}>
          <meshMatcapMaterial matcap={matcapTexture} side={THREE.BackSide} transparent opacity={0.3} />
        </Octahedron>
        <cubeCamera layers={[11]} name="cubeCamera" ref={cubeCamera} args={[0.1, 100, renderTarget]} position={[0, 0, 5]} />
        <Title name="title" position={[0, 0, -10]} />
        <TitleCopies layers={[11]} />
        <Mirrors envMap={renderTarget.texture} />
        <Mirrors layers={[11]} envMap={renderTarget.texture} />
      </group>
    </>
  )
}

export default Scene
