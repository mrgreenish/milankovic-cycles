"use client";
import React, { useRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";

export function AxisIndicators({ axialTilt, precession }) {
  const arrowRef = useRef();

  return (
    <group>
      <primitive
        object={
          new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 0),
            5,
            0xffffff,
            0.8,
            0.5
          )
        }
        ref={arrowRef}
      />
      <Html position={[0, 5.2, 0]} center>
        <div
          style={{
            color: "white",
            background: "rgba(0, 0, 0, 0.7)",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "'Courier New', Courier, monospace",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          Rotation Axis
        </div>
      </Html>
    </group>
  );
}
