import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface DotGlobeProps {
  className?: string;
}

export default function DotGlobe({ className = '' }: DotGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeRef = useRef<THREE.Group | null>(null);
  const frameIdRef = useRef<number>(0);
  
  // 鼠标交互控制
  const isMouseDownRef = useRef(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0.1, y: -0.5 });
  const autoRotateRef = useRef(true);
  const inertiaRef = useRef({ x: 0, y: 0 });
  const [isInteractive, setIsInteractive] = useState(false);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // 创建场景
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // 创建相机 - 调整视角和距离，缩小地球显示
    const camera = new THREE.PerspectiveCamera(
      42, // 更宽的视场角，使地球在画面中更小
      1,
      0.1,
      1000
    );
    camera.position.z = 3.5; // 增加距离，使地球在视野中更小
    camera.position.y = 0.3; // 保持视角高度
    camera.lookAt(0, 0, 0); // 确保相机对准场景中心
    cameraRef.current = camera;
    
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // 获取容器尺寸并自适应
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight || containerWidth;
    
    renderer.setSize(containerWidth, containerHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // 调整相机宽高比
    if (cameraRef.current) {
      cameraRef.current.aspect = containerWidth / containerHeight;
      cameraRef.current.updateProjectionMatrix();
    }
    
    // 创建点阵地球
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeRef.current = globeGroup;
    
    // 创建点阵球体 - 更像参考图片
    const radius = 1;
    const segments = 50;
    const dotDensity = 180; // 经纬线点的密度
    
    // 创建经纬线上的点网格 - 更规则的点阵排列
    const gridPointCount = dotDensity * dotDensity; // 更多的点以创建更密集的网格
    const gridGeometry = new THREE.BufferGeometry();
    const gridPositions = new Float32Array(gridPointCount * 3);
    const dotSizes = new Float32Array(gridPointCount);
    const dotColors = new Float32Array(gridPointCount * 3);
    
    // 生成经纬网格点
    let index = 0;
    for (let i = 0; i < dotDensity; i++) {
      // 经度方向
      const lat = Math.PI * (i / (dotDensity - 1) - 0.5);
      
      for (let j = 0; j < dotDensity; j++) {
        // 纬度方向
        const lng = 2 * Math.PI * (j / dotDensity);
        
        // 转换为笛卡尔坐标
        const x = radius * Math.cos(lat) * Math.cos(lng);
        const y = radius * Math.sin(lat);
        const z = radius * Math.cos(lat) * Math.sin(lng);
        
        gridPositions[index * 3] = x;
        gridPositions[index * 3 + 1] = y;
        gridPositions[index * 3 + 2] = z;
        
        // 使点的大小随机但很小
        dotSizes[index] = 0.5 + Math.random() * 0.5;
        
        // 设置颜色 - 蓝色/青色渐变，亮度随机变化
        const colorIntensity = 0.3 + Math.random() * 0.7;
        const isHighlighted = Math.random() > 0.98; // 随机突出显示一些点
        
        if (isHighlighted) {
          // 亮点 - 更亮的蓝色/青色
          dotColors[index * 3] = 0.4 * colorIntensity; // R
          dotColors[index * 3 + 1] = 0.7 * colorIntensity; // G
          dotColors[index * 3 + 2] = 1.0 * colorIntensity; // B
          dotSizes[index] *= 2; // 亮点略大
        } else {
          // 普通点 - 深蓝色
          dotColors[index * 3] = 0.1 * colorIntensity; // R
          dotColors[index * 3 + 1] = 0.3 * colorIntensity; // G
          dotColors[index * 3 + 2] = 0.7 * colorIntensity; // B
        }
        
        index++;
      }
    }
    
    gridGeometry.setAttribute('position', new THREE.BufferAttribute(gridPositions, 3));
    gridGeometry.setAttribute('size', new THREE.BufferAttribute(dotSizes, 1));
    gridGeometry.setAttribute('color', new THREE.BufferAttribute(dotColors, 3));
    
    // 创建着色器材质 - 使用自定义着色器使点看起来更亮
    const dotMaterial = new THREE.PointsMaterial({
      size: 0.007, // 非常小的点
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true, // 确保近处的点更大
    });
    
    const dotCloud = new THREE.Points(gridGeometry, dotMaterial);
    globeGroup.add(dotCloud);
    
    // 添加一些随机分布的更大点，模拟参考图像中的亮点
    const highlightPointCount = 200;
    const highlightGeometry = new THREE.BufferGeometry();
    const highlightPositions = new Float32Array(highlightPointCount * 3);
    const highlightSizes = new Float32Array(highlightPointCount);
    const highlightColors = new Float32Array(highlightPointCount * 3);
    
    // 生成随机分布的亮点
    for (let i = 0; i < highlightPointCount; i++) {
      // 使用球坐标生成均匀分布在球面上的点
      const phi = Math.acos(-1 + (2 * Math.random()));
      const theta = 2 * Math.PI * Math.random();
      
      // 转换为笛卡尔坐标
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      highlightPositions[i * 3] = x;
      highlightPositions[i * 3 + 1] = y;
      highlightPositions[i * 3 + 2] = z;
      
      // 设置点的大小 - 比网格点大很多
      highlightSizes[i] = 2 + Math.random() * 3;
      
      // 设置颜色 - 明亮的蓝色/青色
      const colorIntensity = 0.7 + Math.random() * 0.3;
      highlightColors[i * 3] = 0.3 * colorIntensity; // R
      highlightColors[i * 3 + 1] = 0.6 * colorIntensity; // G
      highlightColors[i * 3 + 2] = 1.0 * colorIntensity; // B
    }
    
    highlightGeometry.setAttribute('position', new THREE.BufferAttribute(highlightPositions, 3));
    highlightGeometry.setAttribute('size', new THREE.BufferAttribute(highlightSizes, 1));
    highlightGeometry.setAttribute('color', new THREE.BufferAttribute(highlightColors, 3));
    
    const highlightMaterial = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending, // 使亮点更亮
    });
    
    const highlightCloud = new THREE.Points(highlightGeometry, highlightMaterial);
    globeGroup.add(highlightCloud);
    
    // 添加多层发光轮廓 - 多层次的发光效果更接近参考图
    // 内层发光 - 较亮
    const innerGlowGeometry = new THREE.SphereGeometry(radius * 1.01, 64, 64);
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x0055ff),
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    globeGroup.add(innerGlow);
    
    // 中层发光
    const midGlowGeometry = new THREE.SphereGeometry(radius * 1.05, 64, 64);
    const midGlowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x0066ff),
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });
    const midGlow = new THREE.Mesh(midGlowGeometry, midGlowMaterial);
    globeGroup.add(midGlow);
    
    // 外层发光 - 更加暗淡扩散
    const outerGlowGeometry = new THREE.SphereGeometry(radius * 1.15, 64, 64);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x0077ff),
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide,
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    globeGroup.add(outerGlow);
    
    // 创建轨道线
    const orbitCount = 8; // 轨道数量
    const orbitPoints = 100; // 每条轨道的点数
    
    for (let i = 0; i < orbitCount; i++) {
      // 创建随机轨道参数
      const orbitRadius = radius * (1.1 + Math.random() * 0.2);
      const startAngle = Math.random() * Math.PI * 2;
      const orbitTilt = Math.random() * Math.PI / 2; // 轨道倾斜角度
      const orbitRotation = Math.random() * Math.PI * 2; // 轨道旋转角度
      
      // 创建曲线
      const orbitCurve = new THREE.EllipseCurve(
        0, 0,               // 中心点
        orbitRadius, orbitRadius, // 半径X, 半径Y
        0, Math.PI * 2,     // 起始角度和结束角度
        false,              // 顺时针还是逆时针
        startAngle          // 起始角度偏移
      );
      
      // 获取轨道上的点
      const orbitPoints3D = orbitCurve.getPoints(orbitPoints);
      
      // 创建点集合
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
        orbitPoints3D.map(point => {
          // 应用轨道倾斜
          const x = point.x;
          const y = point.y * Math.cos(orbitTilt) - 0 * Math.sin(orbitTilt);
          const z = 0 * Math.cos(orbitTilt) + point.y * Math.sin(orbitTilt);
          
          // 应用轨道旋转
          const rotatedX = x * Math.cos(orbitRotation) - z * Math.sin(orbitRotation);
          const rotatedZ = x * Math.sin(orbitRotation) + z * Math.cos(orbitRotation);
          
          return new THREE.Vector3(rotatedX, y, rotatedZ);
        })
      );
      
      // 创建线材质 - 使用渐变透明效果
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(0x66ccff),
        transparent: true,
        opacity: 0.4 + Math.random() * 0.2,
      });
      
      // 创建线条
      const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
      globeGroup.add(orbit);
      
      // 添加沿轨道运动的亮点
      const markerGeometry = new THREE.SphereGeometry(0.01 + Math.random() * 0.01, 8, 8);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xffffff),
        transparent: true,
        opacity: 0.8,
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      
      // 存储轨道信息和亮点，用于动画
      marker.userData = {
        orbit: orbitCurve,
        tilt: orbitTilt,
        rotation: orbitRotation,
        speed: 0.001 + Math.random() * 0.002,
        t: Math.random(), // 初始位置
      };
      
      globeGroup.add(marker);
    }
    
    // 创建连接线 - 模拟参考图中的弧线网络
    const connectionCount = 30; // 增加连接线数量
    const connectionPoints = [];
    
    // 为了让连接点更集中在特定区域 - 模拟大洲/城市
    const clusterCount = 6; // 模拟6个主要区域
    const clusterCenters = [];
    
    // 创建随机的区域中心
    for (let i = 0; i < clusterCount; i++) {
      const phi = Math.acos(-1 + (2 * Math.random()));
      const theta = Math.random() * Math.PI * 2;
      
      clusterCenters.push({
        phi: phi,
        theta: theta
      });
    }
    
    // 在球面上生成随机点 - 倾向于簇集在特定区域
    for (let i = 0; i < connectionCount * 2; i++) {
      // 随机选择一个区域中心
      const useCluster = Math.random() > 0.3; // 70%的点会在簇内
      let phi, theta;
      
      if (useCluster) {
        // 选择一个簇
        const cluster = clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
        
        // 在簇中心附近生成点
        const deviation = 0.4; // 偏离中心的最大幅度
        phi = cluster.phi + (Math.random() * 2 - 1) * deviation;
        theta = cluster.theta + (Math.random() * 2 - 1) * deviation;
        
        // 确保坐标在有效范围内
        phi = Math.max(0, Math.min(Math.PI, phi));
        theta = theta % (Math.PI * 2);
      } else {
        // 完全随机点
        phi = Math.acos(-1 + (2 * Math.random()));
        theta = Math.random() * Math.PI * 2;
      }
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      connectionPoints.push(new THREE.Vector3(x, y, z));
    }
    
    // 创建点对之间的连接 - 增强版
    for (let i = 0; i < connectionCount; i++) {
      const pointA = connectionPoints[i * 2];
      const pointB = connectionPoints[i * 2 + 1];
      
      // 确定连接线的类型 - 模拟不同类型的连接
      const connectionType = Math.random();
      
      // 创建弧线 - 使用二次贝塞尔曲线，弧度随机变化
      let midPoint;
      
      if (connectionType > 0.7) {
        // 高弧线 - 模拟长距离连接
        midPoint = new THREE.Vector3(
          (pointA.x + pointB.x) * 0.5,
          (pointA.y + pointB.y) * 0.5,
          (pointA.z + pointB.z) * 0.5
        );
        // 将中点大幅向外推，创建高弧形
        midPoint.normalize().multiplyScalar(radius * (1.7 + Math.random() * 0.5));
      } else {
        // 低弧线 - 模拟短距离连接
        midPoint = new THREE.Vector3(
          (pointA.x + pointB.x) * 0.5,
          (pointA.y + pointB.y) * 0.5,
          (pointA.z + pointB.z) * 0.5
        );
        // 将中点适度向外推，创建低弧形
        midPoint.normalize().multiplyScalar(radius * (1.2 + Math.random() * 0.2));
      }
      
      const curve = new THREE.QuadraticBezierCurve3(pointA, midPoint, pointB);
      
      // 增加曲线分段数，使线条更平滑
      const curvePoints = curve.getPoints(50);
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
      
      // 改进颜色 - 更接近参考图
      // 生成蓝-青-白色系的随机颜色
      let lineColor;
      
      if (connectionType > 0.9) {
        // 特殊高亮线 - 更白
        lineColor = new THREE.Color(0xaaddff);
      } else if (connectionType > 0.7) {
        // 亮线 - 更亮的蓝色
        lineColor = new THREE.Color(0x66aaff);
      } else {
        // 普通线 - 深蓝色
        lineColor = new THREE.Color(0x3377cc);
      }
      
      const lineMaterial = new THREE.LineBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: 0.3 + Math.random() * 0.4,
      });
      
      const line = new THREE.Line(lineGeometry, lineMaterial);
      globeGroup.add(line);
      
      // 沿线移动的点 - 更亮的"数据包"
      // 根据线的长度决定脉冲点的数量
      const distance = pointA.distanceTo(pointB);
      const normalizedDistance = Math.min(1, distance / (radius * 2));
      const pulseCount = 1 + Math.floor(normalizedDistance * 2);
      
      for (let j = 0; j < pulseCount; j++) {
        // 用更小的几何体创建更亮的脉冲点
        const pulseGeometry = new THREE.SphereGeometry(0.012, 8, 8);
        
        // 使用加性混合使点更亮
        const pulseMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(0xaaddff),
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
        });
        
        const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
        
        // 存储曲线信息以便动画 - 变化速度
        pulse.userData = {
          curve: curve,
          t: Math.random(), // 初始位置
          speed: 0.003 + Math.random() * 0.004, // 略微降低速度，更自然
          direction: Math.random() > 0.5 ? 1 : -1, // 移动方向
        };
        
        globeGroup.add(pulse);
      }
    }
    
    // 添加辐射线 - 更接近参考图像的扩散效果
    const rayCount = 150; // 增加辐射线数量
    
    // 为了让辐射线更集中在特定区域
    const rayDensityMap = [];
    
    // 创建密度图 - 与连接线簇相同的区域
    for (let i = 0; i < clusterCount; i++) {
      const phi = clusterCenters[i].phi;
      const theta = clusterCenters[i].theta;
      
      // 每个簇周围添加更多辐射线
      const clusterRayCount = Math.floor(rayCount / clusterCount) + 5;
      
      for (let j = 0; j < clusterRayCount; j++) {
        // 在簇中心附近生成射线起点
        const deviation = 0.5; // 簇内射线分布范围
        let rayPhi = phi + (Math.random() * 2 - 1) * deviation;
        let rayTheta = theta + (Math.random() * 2 - 1) * deviation;
        
        // 确保坐标在有效范围内
        rayPhi = Math.max(0, Math.min(Math.PI, rayPhi));
        rayTheta = rayTheta % (Math.PI * 2);
        
        const direction = new THREE.Vector3(
          Math.sin(rayPhi) * Math.cos(rayTheta),
          Math.sin(rayPhi) * Math.sin(rayTheta),
          Math.cos(rayPhi)
        );
        
        const rayStart = direction.clone().multiplyScalar(radius);
        
        // 变化辐射线长度 - 参考图像中辐射线有长有短
        let rayLength;
        
        if (Math.random() > 0.8) {
          // 少数较长辐射线
          rayLength = radius * (0.15 + Math.random() * 0.15);
        } else {
          // 大多数短辐射线
          rayLength = radius * (0.05 + Math.random() * 0.08);
        }
        
        const rayEnd = direction.clone().multiplyScalar(radius + rayLength);
        
        const rayGeometry = new THREE.BufferGeometry().setFromPoints([rayStart, rayEnd]);
        
        // 为辐射线随机分配颜色 - 更多蓝色变化
        let rayColor;
        if (Math.random() > 0.9) {
          // 少数明亮的辐射线
          rayColor = new THREE.Color(0xaaddff);
        } else if (Math.random() > 0.7) {
          // 一些中等亮度的辐射线
          rayColor = new THREE.Color(0x77aaff);
        } else {
          // 大多数暗淡的辐射线
          rayColor = new THREE.Color(0x4477dd);
        }
        
        const rayMaterial = new THREE.LineBasicMaterial({
          color: rayColor,
          transparent: true,
          opacity: 0.2 + Math.random() * 0.3,
        });
        
        const ray = new THREE.Line(rayGeometry, rayMaterial);
        globeGroup.add(ray);
      }
    }
    
    // 添加一些完全随机分布的辐射线
    const randomRayCount = Math.floor(rayCount / 3);
    
    for (let i = 0; i < randomRayCount; i++) {
      const phi = Math.acos(-1 + (2 * Math.random()));
      const theta = Math.random() * Math.PI * 2;
      
      const direction = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      );
      
      const rayStart = direction.clone().multiplyScalar(radius);
      // 大多数短辐射线
      const rayLength = radius * (0.05 + Math.random() * 0.07);
      const rayEnd = direction.clone().multiplyScalar(radius + rayLength);
      
      const rayGeometry = new THREE.BufferGeometry().setFromPoints([rayStart, rayEnd]);
      
      const rayMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(0x5588dd),
        transparent: true,
        opacity: 0.15 + Math.random() * 0.1,
      });
      
      const ray = new THREE.Line(rayGeometry, rayMaterial);
      globeGroup.add(ray);
    }
    
    // 初始化时将地球旋转到更符合参考图像的角度
    globeGroup.rotation.x = targetRotationRef.current.x; // 轻微倾斜
    globeGroup.rotation.y = targetRotationRef.current.y; // 更多地显示右侧
    globeGroup.rotation.z = 0.05; // 轻微沿Z轴旋转以获得更好的视角
    
    // 设置为可交互状态
    setIsInteractive(true);
    
    // 动画函数 - 添加鼠标交互控制
    const animate = () => {
      if (globeRef.current) {
        if (autoRotateRef.current) {
          // 自动旋转模式 - 缓慢旋转地球
          globeRef.current.rotation.y += 0.0005;
        } else {
          // 交互模式 - 平滑过渡到鼠标控制的目标角度
          globeRef.current.rotation.x += (targetRotationRef.current.x - globeRef.current.rotation.x) * 0.05;
          globeRef.current.rotation.y += (targetRotationRef.current.y - globeRef.current.rotation.y) * 0.05;
          
          // 添加惯性效果
          if (!isMouseDownRef.current) {
            inertiaRef.current.x *= 0.95;
            inertiaRef.current.y *= 0.95;
            targetRotationRef.current.x += inertiaRef.current.x;
            targetRotationRef.current.y += inertiaRef.current.y;
            
            // 当惯性很小时恢复自动旋转
            if (Math.abs(inertiaRef.current.x) < 0.0001 && Math.abs(inertiaRef.current.y) < 0.0001) {
              autoRotateRef.current = true;
            }
          }
        }
        
        // 更新轨道上运动的点
        globeRef.current.children.forEach(child => {
          if (child.userData && child.userData.orbit) {
            // 轨道上的点
            child.userData.t += child.userData.speed;
            if (child.userData.t > 1) child.userData.t = 0;
            
            const point = child.userData.orbit.getPoint(child.userData.t);
            
            // 应用轨道倾斜和旋转
            const x = point.x;
            const y = point.y * Math.cos(child.userData.tilt) - 0 * Math.sin(child.userData.tilt);
            const z = 0 * Math.cos(child.userData.tilt) + point.y * Math.sin(child.userData.tilt);
            
            const rotatedX = x * Math.cos(child.userData.rotation) - z * Math.sin(child.userData.rotation);
            const rotatedZ = x * Math.sin(child.userData.rotation) + z * Math.cos(child.userData.rotation);
            
            child.position.set(rotatedX, y, rotatedZ);
          } else if (child.userData && child.userData.curve) {
            // 连接线上的点
            child.userData.t += child.userData.speed * child.userData.direction;
            
            // 到达端点时改变方向
            if (child.userData.t > 1 || child.userData.t < 0) {
              child.userData.direction *= -1;
              child.userData.t = Math.max(0, Math.min(1, child.userData.t));
            }
            
            const position = child.userData.curve.getPoint(child.userData.t);
            child.position.copy(position);
          }
        });
      }
      
      // 渲染场景
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      frameIdRef.current = requestAnimationFrame(animate);
    };
    
    // 开始动画
    animate();
    
    // 清理函数
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      if (rendererRef.current && rendererRef.current.domElement && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);
  
  // 鼠标交互处理
  useEffect(() => {
    if (!isInteractive || !containerRef.current) return;
    
    // 鼠标事件处理函数
    const handleMouseDown = (e: MouseEvent) => {
      isMouseDownRef.current = true;
      autoRotateRef.current = false;
      mousePositionRef.current = {
        x: e.clientX,
        y: e.clientY
      };
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      
      // 计算鼠标移动距离
      const deltaX = e.clientX - mousePositionRef.current.x;
      const deltaY = e.clientY - mousePositionRef.current.y;
      
      // 更新上次鼠标位置
      mousePositionRef.current = {
        x: e.clientX,
        y: e.clientY
      };
      
      // 设置旋转目标，Y轴正向移动使地球左右旋转，X轴正向移动使地球上下倾斜
      const rotationSpeed = 0.003;
      targetRotationRef.current.y += deltaX * rotationSpeed;
      targetRotationRef.current.x += deltaY * rotationSpeed;
      
      // 限制上下旋转角度，防止过度旋转
      targetRotationRef.current.x = Math.max(-0.5, Math.min(0.5, targetRotationRef.current.x));
      
      // 设置惯性
      inertiaRef.current.x = deltaY * rotationSpeed * 0.05;
      inertiaRef.current.y = deltaX * rotationSpeed * 0.05;
    };
    
    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };
    
    const handleMouseOut = () => {
      isMouseDownRef.current = false;
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isMouseDownRef.current = true;
        autoRotateRef.current = false;
        mousePositionRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isMouseDownRef.current || e.touches.length !== 1) return;
      
      const deltaX = e.touches[0].clientX - mousePositionRef.current.x;
      const deltaY = e.touches[0].clientY - mousePositionRef.current.y;
      
      mousePositionRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      
      const rotationSpeed = 0.003;
      targetRotationRef.current.y += deltaX * rotationSpeed;
      targetRotationRef.current.x += deltaY * rotationSpeed;
      
      targetRotationRef.current.x = Math.max(-0.5, Math.min(0.5, targetRotationRef.current.x));
      
      inertiaRef.current.x = deltaY * rotationSpeed * 0.05;
      inertiaRef.current.y = deltaX * rotationSpeed * 0.05;
      
      // 阻止页面滚动
      e.preventDefault();
    };
    
    const handleTouchEnd = () => {
      isMouseDownRef.current = false;
    };
    
    // 注册事件监听器
    const element = containerRef.current;
    element.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseOut);
    element.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    
    // 清理函数
    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseOut);
      element.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isInteractive]);

  // 窗口大小调整时重新设置尺寸
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight || containerWidth;
      
      rendererRef.current.setSize(containerWidth, containerHeight);
      
      cameraRef.current.aspect = containerWidth / containerHeight;
      cameraRef.current.updateProjectionMatrix();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className={`relative ${className} w-full h-full overflow-visible ${isInteractive ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{ 
        minHeight: '425px', 
        minWidth: '425px',
        transformOrigin: 'center center',
      }}
      title={isInteractive ? "拖动旋转地球" : ""}
    />
  );
}