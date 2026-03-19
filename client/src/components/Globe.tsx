import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FaBitcoin } from 'react-icons/fa';
import { SiVisa, SiMastercard, SiPaypal, SiApplepay, SiGooglepay, SiAlipay, SiWechat } from 'react-icons/si';

// 定义连接点数据（模拟全球支付网络连接点）
const connectionPoints = [
  { lat: 40.7128, lng: -74.006, size: 0.02 }, // 纽约
  { lat: 51.5074, lng: -0.1278, size: 0.025 }, // 伦敦
  { lat: 35.6762, lng: 139.6503, size: 0.02 }, // 东京
  { lat: 22.3193, lng: 114.1694, size: 0.015 }, // 香港
  { lat: 1.3521, lng: 103.8198, size: 0.018 }, // 新加坡
  { lat: 31.2304, lng: 121.4737, size: 0.022 }, // 上海
  { lat: 19.0760, lng: 72.8777, size: 0.018 }, // 孟买
  { lat: 55.7558, lng: 37.6173, size: 0.015 }, // 莫斯科
  { lat: -33.8688, lng: 151.2093, size: 0.018 }, // 悉尼
  { lat: 25.2048, lng: 55.2708, size: 0.02 }, // 迪拜
  { lat: -23.5505, lng: -46.6333, size: 0.018 }, // 圣保罗
  { lat: 48.8566, lng: 2.3522, size: 0.02 }, // 巴黎
];

// 支付平台图标数据
const paymentIcons = [
  { icon: "Visa", lat: 37.33, lng: -121.89, offsetRadius: 0.25 }, // Visa总部(加州)
  { icon: "Mastercard", lat: 41.08, lng: -73.71, offsetRadius: 0.3 }, // Mastercard总部(纽约)
  { icon: "PayPal", lat: 37.37, lng: -121.92, offsetRadius: 0.35 }, // PayPal总部(加州)
  { icon: "ApplePay", lat: 37.33, lng: -122.01, offsetRadius: 0.4 }, // Apple总部(加州)
  { icon: "GooglePay", lat: 37.42, lng: -122.08, offsetRadius: 0.3 }, // Google总部(加州)
  { icon: "Alipay", lat: 30.27, lng: 120.15, offsetRadius: 0.35 }, // 阿里巴巴总部(杭州)
  { icon: "WeChat", lat: 22.54, lng: 114.06, offsetRadius: 0.25 }, // 腾讯总部(深圳)
  { icon: "Bitcoin", lat: 0, lng: 0, offsetRadius: 0.3 }, // 比特币(全球)
];

interface GlobeProps {
  size?: number | string;
  className?: string;
}

export default function Globe({ size = '100%', className = '' }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const frameIdRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // 创建场景
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      45, // 视角
      1, // 宽高比 (正方形容器)
      0.1, // 近裁剪面
      1000 // 远裁剪面
    );
    camera.position.z = 4; // 增加距离以确保完整显示
    cameraRef.current = camera;

    // 创建渲染器，启用后期处理
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true, // 透明背景
      powerPreference: 'high-performance' // 提高性能
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // 获取容器尺寸并自适应
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight || containerWidth; // 默认为宽度相同的正方形
    
    renderer.setSize(containerWidth, containerHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // 调整相机宽高比
    if (cameraRef.current) {
      cameraRef.current.aspect = containerWidth / containerHeight;
      cameraRef.current.updateProjectionMatrix();
    }

    // 创建全息地球核心 - 使用渐变色而不是写实贴图
    const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#004080'),
      transparent: true,
      opacity: 0.3,
      wireframe: false,
    });
    
    const earth = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(earth);
    earthRef.current = earth;

    // 添加内部核心球
    const coreGeometry = new THREE.SphereGeometry(0.9, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#00264d'),
      transparent: true,
      opacity: 0.5,
      wireframe: false,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // 添加灯光 - 更明亮的环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const blueLight = new THREE.PointLight(0x0088ff, 1, 10);
    blueLight.position.set(2, 1, 2);
    scene.add(blueLight);

    const purpleLight = new THREE.PointLight(0x8800ff, 1, 10);
    purpleLight.position.set(-2, -1, 2);
    scene.add(purpleLight);
    
    // 辅助函数：将经纬度转换为3D坐标
    const latLongToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      
      const x = -radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      return new THREE.Vector3(x, y, z);
    };
    
    // 增强连接点效果
    // 创建连接点材质 - 更亮的颜色
    const pointMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#00ffff'),
      transparent: true,
      opacity: 0.9,
    });
    
    // 创建发光线条材质 - 增强发光效果
    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color('#00ccff'),
      transparent: true,
      opacity: 0.8,
      linewidth: 2,
    });
    
    // 定义动画数据类型
    interface ConnectionLine {
      line: THREE.Line;
      curve: THREE.QuadraticBezierCurve3;
    }
    
    interface PulseObject {
      pulse: THREE.Mesh;
      curve: THREE.QuadraticBezierCurve3;
      t: number;
      speed: number;
      direction: number;
      color: THREE.Color;
    }
    
    // 绘制增强版连接点
    connectionPoints.forEach((point) => {
      const position = latLongToVector3(point.lat, point.lng, 1.05);
      
      // 主要连接点
      const pointGeometry = new THREE.SphereGeometry(point.size * 1.2, 16, 16);
      const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
      pointMesh.position.copy(position);
      scene.add(pointMesh);
      
      // 外部发光层
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#00ffff'),
        transparent: true,
        opacity: 0.4,
      });
      const glowGeometry = new THREE.SphereGeometry(point.size * 2, 16, 16);
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.copy(position);
      scene.add(glowMesh);
      
      // 添加环形装饰
      const ringGeometry = new THREE.RingGeometry(point.size * 2.2, point.size * 2.6, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#00ffff'),
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(position);
      // 使环朝向球心
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      scene.add(ring);
    });
    
    // 存储连接线和脉冲的引用，用于动画
    const connectionLines: ConnectionLine[] = [];
    const connectionPulses: PulseObject[] = [];
    
    // 创建更多连接线，增强网络感
    for (let i = 0; i < 25; i++) {
      const pointA = connectionPoints[Math.floor(Math.random() * connectionPoints.length)];
      const pointB = connectionPoints[Math.floor(Math.random() * connectionPoints.length)];
      
      // 避免相同点之间的连线
      if (pointA === pointB) continue;
      
      const posA = latLongToVector3(pointA.lat, pointA.lng, 1.05);
      const posB = latLongToVector3(pointB.lat, pointB.lng, 1.05);
      
      // 创建曲线路径
      const midPoint = new THREE.Vector3(
        (posA.x + posB.x) * 0.5,
        (posA.y + posB.y) * 0.5,
        (posA.z + posB.z) * 0.5
      );
      
      // 将中点向外推，创建更高弧形
      midPoint.normalize().multiplyScalar(1.4);
      
      // 创建曲线
      const curve = new THREE.QuadraticBezierCurve3(posA, midPoint, posB);
      
      // 创建曲线路径 - 增加点数使线条更平滑
      const points = curve.getPoints(30);
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      
      // 随机线条颜色变化 (蓝色到青色的渐变)
      const hue = 0.5 + Math.random() * 0.1; // 在青色-蓝色范围
      const lineColor = new THREE.Color().setHSL(hue, 1, 0.6);
      
      const customLineMaterial = new THREE.LineBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: 0.6 + Math.random() * 0.3,
        linewidth: 1,
      });
      
      // 创建线条
      const line = new THREE.Line(lineGeometry, customLineMaterial);
      scene.add(line);
      connectionLines.push({ line, curve });
      
      // 添加更多沿线移动的"数据脉冲"点
      const pulseCount = 1 + Math.floor(Math.random() * 2); // 每条线1-2个脉冲
      for (let j = 0; j < pulseCount; j++) {
        // 创建更多样化的脉冲几何体
        let pulseGeometry;
        const pulseType = Math.floor(Math.random() * 3);
        
        if (pulseType === 0) {
          // 球形脉冲
          pulseGeometry = new THREE.SphereGeometry(0.02 + Math.random() * 0.01, 8, 8);
        } else if (pulseType === 1) {
          // 立方体脉冲
          pulseGeometry = new THREE.BoxGeometry(0.03, 0.03, 0.03);
        } else {
          // 八面体脉冲
          pulseGeometry = new THREE.OctahedronGeometry(0.025);
        }
        
        // 脉冲颜色 - 比线条更亮
        const pulseHue = hue + (Math.random() * 0.1 - 0.05);
        const pulseColor = new THREE.Color().setHSL(pulseHue, 1, 0.7);
        
        const pulseMaterial = new THREE.MeshBasicMaterial({
          color: pulseColor,
          transparent: true,
          opacity: 0.8,
        });
        
        const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
        // 随机起始位置
        const initialT = Math.random();
        const initialPosition = curve.getPoint(initialT);
        pulse.position.copy(initialPosition);
        scene.add(pulse);
        
        // 存储脉冲引用用于动画
        connectionPulses.push({
          pulse,
          curve,
          t: initialT, // 脉冲在曲线上的参数位置 (0-1)
          speed: 0.004 + Math.random() * 0.008, // 更多样化的速度
          direction: Math.random() > 0.5 ? 1 : -1, // 随机方向
          color: pulseColor // 保存颜色用于动画
        });
      }
    }

    // 添加粒子云代替星空背景
    const particleGeometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.02,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const particleVertices = [];
    const particleCount = 2500;
    const particleFieldRadius = 15;
    
    for (let i = 0; i < particleCount; i++) {
      // 使用球坐标分布使粒子云围绕球体分布
      const radius = 2 + Math.random() * particleFieldRadius;
      const theta = Math.random() * Math.PI * 2; // 水平角
      const phi = Math.acos(2 * Math.random() - 1); // 垂直角
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      particleVertices.push(x, y, z);
    }

    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particleVertices, 3));
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 增强外部光晕效果 - 添加多层光晕
    const outerGlowGeometry = new THREE.SphereGeometry(1.15, 64, 64);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#0066cc'),
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    scene.add(outerGlow);
    
    // 第二层光晕 - 更大但更弱
    const secondGlowGeometry = new THREE.SphereGeometry(1.3, 32, 32);
    const secondGlowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#0088ff'),
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });
    const secondGlow = new THREE.Mesh(secondGlowGeometry, secondGlowMaterial);
    scene.add(secondGlow);
    
    // 第三层光晕 - 带紫色
    const thirdGlowGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const thirdGlowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#5500ff'),
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide,
    });
    const thirdGlow = new THREE.Mesh(thirdGlowGeometry, thirdGlowMaterial);
    scene.add(thirdGlow);
    
    // 增强网格覆盖层 - 更高细节和多层
    // 主网格层
    const wireframeGeometry = new THREE.SphereGeometry(1.02, 48, 48);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      wireframe: true,
      color: new THREE.Color('#00ddff'),
      transparent: true,
      opacity: 0.15,
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    scene.add(wireframe);
    
    // 第二层 - 更大、旋转不同
    const outerWireframeGeometry = new THREE.SphereGeometry(1.08, 24, 24);
    const outerWireframeMaterial = new THREE.MeshBasicMaterial({
      wireframe: true,
      color: new THREE.Color('#44aaff'),
      transparent: true,
      opacity: 0.1,
    });
    const outerWireframe = new THREE.Mesh(outerWireframeGeometry, outerWireframeMaterial);
    outerWireframe.rotation.x = Math.PI / 4;
    outerWireframe.rotation.y = Math.PI / 6;
    scene.add(outerWireframe);
    
    // 添加赤道环
    const equatorGeometry = new THREE.TorusGeometry(1.03, 0.005, 16, 100);
    const equatorMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#00ffff'),
      transparent: true,
      opacity: 0.8,
    });
    const equator = new THREE.Mesh(equatorGeometry, equatorMaterial);
    equator.rotation.x = Math.PI / 2;
    scene.add(equator);

    // 添加十字交叉环
    const crossRingGeometry = new THREE.TorusGeometry(1.03, 0.003, 16, 100);
    const crossRingMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#88ddff'),
      transparent: true,
      opacity: 0.5,
    });
    const crossRing1 = new THREE.Mesh(crossRingGeometry, crossRingMaterial);
    crossRing1.rotation.y = Math.PI / 2;
    scene.add(crossRing1);
    
    const crossRing2 = new THREE.Mesh(crossRingGeometry, crossRingMaterial.clone());
    crossRing2.rotation.x = Math.PI / 2;
    crossRing2.rotation.z = Math.PI / 2;
    scene.add(crossRing2);
    
    // 添加极地光点
    const poleGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    const northPoleMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#00ffff'),
      transparent: true,
      opacity: 0.9,
    });
    const northPole = new THREE.Mesh(poleGeometry, northPoleMaterial);
    northPole.position.set(0, 1.05, 0);
    scene.add(northPole);
    
    const southPoleMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#00ffff'),
      transparent: true,
      opacity: 0.9,
    });
    const southPole = new THREE.Mesh(poleGeometry, southPoleMaterial);
    southPole.position.set(0, -1.05, 0);
    scene.add(southPole);
    
    // 为极点添加光环
    const poleRingGeometry = new THREE.RingGeometry(0.05, 0.07, 32);
    const poleRingMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#00ffff'),
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    
    const northPoleRing = new THREE.Mesh(poleRingGeometry, poleRingMaterial);
    northPoleRing.position.set(0, 1.05, 0);
    northPoleRing.rotation.x = Math.PI / 2;
    scene.add(northPoleRing);
    
    const southPoleRing = new THREE.Mesh(poleRingGeometry, poleRingMaterial);
    southPoleRing.position.set(0, -1.05, 0);
    southPoleRing.rotation.x = Math.PI / 2;
    scene.add(southPoleRing);
    
    // 添加表示地理区域的无序线条
    const regionLinesCount = 8;
    const regionLines = [];
    
    for (let i = 0; i < regionLinesCount; i++) {
      // 随机起点
      const startLat = -80 + Math.random() * 160; // 不包括极点区域
      const startLng = Math.random() * 360 - 180;
      const startPos = latLongToVector3(startLat, startLng, 1.01);
      
      // 在起点附近生成几个点
      const linePoints = [startPos];
      const segmentCount = 3 + Math.floor(Math.random() * 5);
      
      for (let j = 0; j < segmentCount; j++) {
        // 在上一点附近生成新点
        const lastPoint = linePoints[linePoints.length - 1];
        const newLat = Math.max(-85, Math.min(85, startLat + (Math.random() * 20 - 10) * (j+1)));
        const newLng = ((startLng + (Math.random() * 20 - 10) * (j+1)) + 180) % 360 - 180;
        const newPos = latLongToVector3(newLat, newLng, 1.01);
        linePoints.push(newPos);
      }
      
      // 创建线条
      const regionGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const regionLineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 1, 0.6),
        transparent: true,
        opacity: 0.3 + Math.random() * 0.2,
        linewidth: 1,
      });
      
      const regionLine = new THREE.Line(regionGeometry, regionLineMaterial);
      scene.add(regionLine);
      regionLines.push(regionLine);
    }
    
    // 创建支付平台图标
    interface PaymentIconObject {
      mesh: THREE.Mesh;
      orbit: THREE.Group;
      icon: string;
      speed: number;
    }
    
    const paymentIconObjects: PaymentIconObject[] = [];
    
    // 为每个支付平台创建3D图标
    paymentIcons.forEach((iconData) => {
      const { icon, lat, lng, offsetRadius } = iconData;
      
      // 确定图标颜色
      let iconColor;
      switch(icon) {
        case "Visa": iconColor = new THREE.Color('#1434CB'); break; // Visa蓝
        case "Mastercard": iconColor = new THREE.Color('#EB001B'); break; // Mastercard红
        case "PayPal": iconColor = new THREE.Color('#003087'); break; // PayPal蓝
        case "ApplePay": iconColor = new THREE.Color('#ffffff'); break; // Apple白
        case "GooglePay": iconColor = new THREE.Color('#4285F4'); break; // Google蓝
        case "Alipay": iconColor = new THREE.Color('#00AAEE'); break; // 支付宝蓝
        case "WeChat": iconColor = new THREE.Color('#07C160'); break; // 微信绿
        case "Bitcoin": iconColor = new THREE.Color('#F7931A'); break; // 比特币橙
        default: iconColor = new THREE.Color('#ffffff');
      }
      
      // 创建图标平面 - 增大尺寸
      const iconSize = 0.25; // 增大图标尺寸
      const iconGeometry = new THREE.PlaneGeometry(iconSize, iconSize);
      const iconMaterial = new THREE.MeshBasicMaterial({
        color: iconColor,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
      });
      
      const iconMesh = new THREE.Mesh(iconGeometry, iconMaterial);
      
      // 创建图标发光效果 - 增强发光效果
      const glowSize = iconSize * 1.8; // 更大的发光区域
      const glowGeometry = new THREE.PlaneGeometry(glowSize, glowSize);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: iconColor,
        transparent: true,
        opacity: 0.4, // 更强的发光效果
        side: THREE.DoubleSide,
      });
      
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.z = -0.01; // 稍微在图标后面
      
      // 添加第二层更大的发光效果
      const outerGlowSize = iconSize * 2.5;
      const outerGlowGeometry = new THREE.PlaneGeometry(outerGlowSize, outerGlowSize);
      const outerGlowMaterial = new THREE.MeshBasicMaterial({
        color: iconColor,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      });
      
      const outerGlowMesh = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
      outerGlowMesh.position.z = -0.02; // 在第一层发光后面
      
      // 创建轨道集合
      const orbit = new THREE.Group();
      orbit.add(iconMesh);
      orbit.add(glowMesh);
      orbit.add(outerGlowMesh); // 添加第二层发光效果
      
      // 随机放置在轨道上 - 更大的轨道半径
      const randomAngle = Math.random() * Math.PI * 2;
      const orbitRadius = 2.5 + Math.random() * 0.8; // 增大轨道半径让图标更明显
      
      // 随机轨道倾角
      orbit.rotation.x = Math.random() * 0.5;
      orbit.rotation.z = Math.random() * 0.5;
      
      // 放置图标
      iconMesh.position.set(
        Math.cos(randomAngle) * orbitRadius,
        Math.sin(randomAngle) * 0.3, // 稍微上下波动
        Math.sin(randomAngle) * orbitRadius
      );
      
      // 图标和发光效果始终面向相机
      iconMesh.lookAt(0, 0, 0);
      glowMesh.lookAt(0, 0, 0);
      outerGlowMesh.lookAt(0, 0, 0);
      
      // 添加到场景
      scene.add(orbit);
      
      // 存储以供动画
      paymentIconObjects.push({
        mesh: iconMesh,
        orbit: orbit,
        icon: icon,
        speed: 0.001 + Math.random() * 0.002, // 不同的旋转速度
      });
    });
    
    // 添加更多光效 - 射线
    const rayCount = 8;
    const rays: THREE.Mesh[] = [];
    
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const rayLength = 3 + Math.random() * 3;
      
      const rayGeometry = new THREE.CylinderGeometry(0.01, 0.001, rayLength, 6, 1);
      const rayColor = new THREE.Color().setHSL(0.5 + Math.random() * 0.2, 1, 0.7);
      const rayMaterial = new THREE.MeshBasicMaterial({
        color: rayColor,
        transparent: true,
        opacity: 0.2 + Math.random() * 0.2,
      });
      
      const ray = new THREE.Mesh(rayGeometry, rayMaterial);
      
      // 放置射线
      ray.position.set(0, 0, 0);
      ray.rotation.z = Math.PI / 2; // 使射线水平
      ray.rotation.y = angle; // 围绕Y轴分布
      
      // 移动射线，使其一端在球体表面
      ray.position.x = Math.cos(angle) * 1.1;
      ray.position.z = Math.sin(angle) * 1.1;
      ray.position.y = (Math.random() - 0.5) * 1.5; // 随机高度
      
      scene.add(ray);
      rays.push(ray);
    }
    
    // 动画函数 - 增强版
    const animate = () => {
      const time = Date.now() * 0.0001;
      
      // 更有活力的地球自转 - 加快速度
      if (earthRef.current) {
        earthRef.current.rotation.y += 0.003; // 3倍原来速度
      }
      
      // 核心球的动画 - 加快速度
      if (core) {
        core.rotation.y -= 0.002; // 4倍原来速度
        core.rotation.x = Math.sin(time * 0.8) * 0.1;
      }
      
      // 网格覆盖层动画 - 不同方向和速度
      if (wireframe) {
        wireframe.rotation.y += 0.002; // 加快速度
      }
      
      if (outerWireframe) {
        outerWireframe.rotation.y -= 0.0015;
        outerWireframe.rotation.z += 0.0008;
      }
      
      // 光晕动画效果 - 更强烈的脉动
      if (outerGlow && outerGlowMaterial) {
        outerGlowMaterial.opacity = 0.2 + Math.sin(time * 5) * 0.15; // 更快更强的脉动
        outerGlow.rotation.y -= 0.0005;
        outerGlow.rotation.z += 0.0003;
      }
      
      if (secondGlow && secondGlowMaterial) {
        secondGlowMaterial.opacity = 0.15 + Math.sin(time * 3) * 0.1;
        secondGlow.rotation.y += 0.0008;
      }
      
      if (thirdGlow && thirdGlowMaterial) {
        thirdGlowMaterial.opacity = 0.08 + Math.sin(time * 2) * 0.05;
        thirdGlow.rotation.y -= 0.001;
        thirdGlow.rotation.x += 0.0003;
      }
      
      // 支付图标动画
      paymentIconObjects.forEach((obj) => {
        // 轨道旋转
        obj.orbit.rotation.y += obj.speed;
        
        // 图标脉动和旋转
        const pulse = 0.95 + Math.sin(time * 3 + obj.speed * 50) * 0.15;
        obj.mesh.scale.set(pulse, pulse, pulse);
        
        // 图标始终面向相机
        obj.mesh.lookAt(camera.position);
      });
      
      // 光束射线动画
      rays.forEach((ray, i) => {
        const rayTime = time * 2 + i;
        ray.scale.y = 0.7 + Math.sin(rayTime) * 0.3; // 射线长度变化
        
        // 安全地更新透明度，确保材质是单一的MeshBasicMaterial
        const material = ray.material as THREE.MeshBasicMaterial;
        if (material && material.opacity !== undefined) {
          material.opacity = 0.1 + Math.sin(rayTime * 1.5) * 0.1; // 透明度变化
        }
        
        // 射线缓慢移动和旋转
        ray.rotation.y += 0.001;
        ray.position.y = Math.sin(rayTime * 0.5) * 0.5;
      });
      
      // 赤道环和交叉环脉动
      if (equator && equatorMaterial) {
        equatorMaterial.opacity = 0.6 + Math.sin(time * 4) * 0.3;
      }
      
      // 粒子云旋转
      if (particles) {
        particles.rotation.y += 0.0001;
      }

      // 极点光效
      if (northPoleMaterial && southPoleMaterial) {
        const poleOpacity = 0.7 + Math.sin(time * 5) * 0.3;
        northPoleMaterial.opacity = poleOpacity;
        southPoleMaterial.opacity = poleOpacity;
      }
      
      // 高级脉冲动画
      connectionPulses.forEach(pulseObj => {
        // 更新脉冲位置参数
        pulseObj.t += pulseObj.speed * pulseObj.direction;
        
        // 如果到达端点，反转方向
        if (pulseObj.t > 1) {
          pulseObj.t = 1;
          pulseObj.direction = -1;
          
          // 到达端点时闪烁效果
          pulseObj.pulse.scale.set(2, 2, 2);
        } else if (pulseObj.t < 0) {
          pulseObj.t = 0;
          pulseObj.direction = 1;
          
          // 到达端点时闪烁效果
          pulseObj.pulse.scale.set(2, 2, 2);
        }
        
        // 计算新位置
        const newPosition = pulseObj.curve.getPoint(pulseObj.t);
        pulseObj.pulse.position.copy(newPosition);
        
        // 脉冲高级"呼吸"效果 - 缩放和不透明度
        const baseScale = 0.8 + Math.sin(time * 10) * 0.2;
        pulseObj.pulse.scale.lerp(new THREE.Vector3(baseScale, baseScale, baseScale), 0.1);
        
        // 随时间调整脉冲颜色
        const material = pulseObj.pulse.material as THREE.MeshBasicMaterial;
        const h = pulseObj.color.getHSL({h: 0, s: 0, l: 0}).h;
        const s = 1;
        const l = 0.6 + Math.sin(time * 5) * 0.2;
        material.color.setHSL(h, s, l);
      });
      
      // 增强的相机动画效果
      if (cameraRef.current) {
        const time2 = Date.now() * 0.00015;
        const radius = 3.0 + Math.sin(time * 0.5) * 0.2;
        
        // 使相机沿环绕路径移动
        const cameraX = Math.sin(time2) * 0.6;
        const cameraY = Math.sin(time2 * 1.3) * 0.4;
        cameraRef.current.position.x = cameraX;
        cameraRef.current.position.y = cameraY;
        cameraRef.current.position.z = Math.sqrt(radius*radius - cameraX*cameraX - cameraY*cameraY);
        
        cameraRef.current.lookAt(0, 0, 0);
      }
      
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
  }, [size]);
  
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
      className={`relative ${className} w-full h-full`}
      style={{ 
        minHeight: typeof size === 'number' ? `${size}px` : size,
      }}
    />
  );
}