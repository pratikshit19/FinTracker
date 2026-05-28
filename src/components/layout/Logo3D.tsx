import { SVG3D } from "3dsvg";
import { Suspense } from "react";

const MY_SVG = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
 <g>
  <title>Layer 1</title>
  <line stroke="#479" stroke-width="15" stroke-linecap="undefined" stroke-linejoin="undefined" id="svg_2" y2="344.99998" x2="407.33332" y1="192.99998" x1="406.33332" fill="none"/>
  <line stroke="#479" stroke-width="15" stroke-linecap="undefined" stroke-linejoin="undefined" id="svg_3" y2="199.99998" x2="501.33331" y1="199.99998" x1="403.33332" fill="none"/>
  <line stroke-width="15" stroke-linecap="undefined" stroke-linejoin="undefined" id="svg_4" y2="262.99998" x2="377.33332" y1="262.99998" x1="327.33332" stroke="#479" fill="none"/>
  <line stroke-width="15" stroke-linecap="undefined" stroke-linejoin="undefined" id="svg_5" y2="344.99998" x2="385.33332" y1="193.99998" x1="383.33332" stroke="#479" fill="none"/>
  <line stroke="#479" stroke-width="15" stroke-linecap="undefined" stroke-linejoin="undefined" id="svg_6" y2="201.99998" x2="289.33332" y1="200.99998" x1="390.33332" fill="none"/>
 </g>
</svg>`;

interface Logo3DProps {
  zoom?: number;
  animate?: "spin" | "float" | "spinFloat" | "pulse" | "wobble" | "none";
  animateSpeed?: number;
  width?: string | number;
  height?: string | number;
  className?: string;
  color?: string;
  material?: string;
}

export const Logo3DFallback = ({ className, width = "100%", height = "100%", color = "#3b82f6" }: { className?: string; width?: string | number; height?: string | number; color?: string }) => {
  return (
    <div
      className={`flex items-center justify-center ${className || ""}`}
      style={{ width, height }}
    >
      <svg
        viewBox="250 150 300 250"
        className="w-full h-full opacity-80"
        style={{ color }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="currentColor" strokeWidth="15" strokeLinecap="round" fill="none">
          <line x1="406" y1="193" x2="407" y2="345" />
          <line x1="403" y1="200" x2="501" y2="200" />
          <line x1="327" y1="263" x2="377" y2="263" strokeOpacity="0.8" />
          <line x1="383" y1="194" x2="385" y2="345" strokeOpacity="0.9" />
          <line x1="390" y1="201" x2="289" y2="201" strokeOpacity="0.9" />
        </g>
      </svg>
    </div>
  );
};

export const Logo3D = ({
  zoom = 5.5,
  animate = "spinFloat",
  animateSpeed = 1.2,
  width = "100%",
  height = "100%",
  className,
  color = "#3b82f6",
  material = "gold"
}: Logo3DProps) => {
  return (
    <div className={className} style={{ width, height, position: "relative" }}>
      <Suspense fallback={<Logo3DFallback width="100%" height="100%" color={color} />}>
        <SVG3D
          svg={MY_SVG}
          depth={0.8}
          smoothness={1}
          color={color}
          material={material as any}
          metalness={0.95}
          roughness={0.38}
          animate={animate as any}
          animateSpeed={animateSpeed}
          zoom={zoom}
          cursorOrbit
          orbitStrength={0.44}
          resetOnIdle
          resetDelay={3}
          lightIntensity={2.3}
          ambientIntensity={1.2}
        />
      </Suspense>
    </div>
  );
};
