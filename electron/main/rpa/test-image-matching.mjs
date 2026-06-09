/**
 * 图像匹配功能测试脚本
 *
 * 测试步骤：
 * 1. 创建测试图像（带颜色的矩形）
 * 2. 从测试图像中截取一个区域作为模板
 * 3. 使用图像匹配算法在原图中查找模板
 * 4. 验证匹配结果是否正确
 */

const { Jimp } = await import('jimp');
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试图像尺寸
const WIDTH = 400;
const HEIGHT = 300;

// 颜色定义 (RGBA - jimp 使用大端序 ARGB)
const COLORS = {
  red: 0xFF0000FF,    // ARGB 格式
  green: 0x00FF00FF,
  blue: 0x0000FFFF,
  white: 0xFFFFFFFF,
  black: 0x000000FF,
};

/**
 * 创建测试图像
 */
async function createTestImage() {
  console.log('📷 创建测试图像...');

  // 创建空白图像（白色背景）
  const image = new Jimp({ width: WIDTH, height: HEIGHT, color: 0xFFFFFFFF });

  // 在图像上绘制一些形状
  // 红色矩形 (x=50, y=50, width=100, height=50)
  for (let y = 50; y < 100; y++) {
    for (let x = 50; x < 150; x++) {
      image.setPixelColor(COLORS.red, x, y);
    }
  }

  // 绿色圆形（简化为一个矩形区域）
  for (let y = 80; y < 180; y++) {
    for (let x = 200; x < 280; x++) {
      const dx = x - 240;
      const dy = y - 130;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= 50) {
        image.setPixelColor(COLORS.green, x, y);
      }
    }
  }

  // 蓝色文本（简化为一条线）
  for (let x = 50; x < 350; x++) {
    for (let y = 220; y < 240; y++) {
      image.setPixelColor(COLORS.blue, x, y);
    }
  }

  // 保存测试图像
  const testImagePath = path.join(__dirname, 'test-screenshot.png');
  await image.write(testImagePath);
  console.log(`✅ 测试图像已保存: ${testImagePath}`);

  return testImagePath;
}

/**
 * 创建模板图像（从测试图像中截取一个区域）
 */
async function createTemplateImage() {
  console.log('🖼️ 创建模板图像...');

  // 加载测试图像
  const imageData = fs.readFileSync(path.join(__dirname, 'test-screenshot.png'));
  const image = await Jimp.read(imageData);

  // 截取红色矩形区域作为模板 (x=50, y=50, width=100, height=50)
  const template = image.clone();
  template.crop({ x: 50, y: 50, w: 100, h: 50 });

  // 保存模板图像
  const templatePath = path.join(__dirname, 'test-template.png');
  await template.write(templatePath);
  console.log(`✅ 模板图像已保存: ${templatePath}`);
  console.log(`   模板尺寸: ${template.width}x${template.height}`);

  return templatePath;
}

/**
 * 将图像转换为灰度
 * jimp v1 使用 ARGB 格式
 */
function toGrayscale(image) {
  const width = image.width;
  const height = image.height;
  const gray = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = image.getPixelColor(x, y);
      // jimp v1 使用 ARGB 格式: 0xAARRGGBB
      const r = (color >> 16) & 0xFF;
      const g = (color >> 8) & 0xFF;
      const b = color & 0xFF;
      // 使用 luminance 公式: 0.299*R + 0.587*G + 0.114*B
      gray[y * width + x] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }
  }

  return { width, height, data: gray };
}

/**
 * 比较两个区域的相似度（SSD - 平方差和）
 * 返回 0-1 的相似度，1 表示完全匹配
 */
function compareRegions(screen, template, sx, sy, tw, th) {
  let ssd = 0;
  const maxDiff = tw * th * 255 * 255; // 最大可能的差值

  // 从屏幕提取区域
  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const screenPixel = screen.data[(sy + y) * screen.width + (sx + x)];
      const templatePixel = template.data[y * template.width + x];
      const diff = screenPixel - templatePixel;
      ssd += diff * diff;
    }
  }

  // 转换为相似度 (1 = 完全匹配, 0 = 完全不匹配)
  return 1 - (ssd / maxDiff);
}

/**
 * 图像匹配算法
 */
async function findElementByImage(screenshotPath, templatePath, threshold = 0.8) {
  console.log(`🔍 在 ${screenshotPath} 中查找 ${templatePath}...`);

  // 加载图像
  const screenshotBuf = fs.readFileSync(screenshotPath);
  const templateBuf = fs.readFileSync(templatePath);
  const screenshot = await Jimp.read(screenshotBuf);
  const template = await Jimp.read(templateBuf);

  const screenWidth = screenshot.width;
  const screenHeight = screenshot.height;
  const templateWidth = template.width;
  const templateHeight = template.height;

  console.log(`📐 图像尺寸: 截图=${screenWidth}x${screenHeight}, 模板=${templateWidth}x${templateHeight}`);

  // 转换为灰度
  const screenGray = toGrayscale(screenshot);
  const templateGray = toGrayscale(template);

  let bestMatch = { x: 0, y: 0, similarity: 0 };

  // 第一阶段：粗略搜索（步长为模板尺寸的 10%）
  const stepX = Math.max(1, Math.floor(templateWidth * 0.1));
  const stepY = Math.max(1, Math.floor(templateHeight * 0.1));

  console.log(`📊 粗略搜索: 步长 ${stepX}x${stepY}`);

  for (let y = 0; y <= screenHeight - templateHeight; y += stepY) {
    for (let x = 0; x <= screenWidth - templateWidth; x += stepX) {
      const similarity = compareRegions(screenGray, templateGray, x, y, templateWidth, templateHeight);

      if (similarity > bestMatch.similarity) {
        bestMatch = { x, y, similarity };
      }
    }
  }

  console.log(`🎯 粗略最佳匹配: (${bestMatch.x}, ${bestMatch.y}), 相似度=${(bestMatch.similarity * 100).toFixed(1)}%`);

  // 第二阶段：细粒度搜索（在最佳匹配位置附近）
  const searchRangeX = Math.floor(templateWidth * 0.2);
  const searchRangeY = Math.floor(templateHeight * 0.2);

  const startX = Math.max(0, bestMatch.x - searchRangeX);
  const startY = Math.max(0, bestMatch.y - searchRangeY);
  const endX = Math.min(screenWidth - templateWidth, bestMatch.x + searchRangeX);
  const endY = Math.min(screenHeight - templateHeight, bestMatch.y + searchRangeY);

  console.log(`🔍 细粒度搜索: 范围 (${startX},${startY}) 到 (${endX},${endY})`);

  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      const similarity = compareRegions(screenGray, templateGray, x, y, templateWidth, templateHeight);

      if (similarity > bestMatch.similarity) {
        bestMatch = { x, y, similarity };
      }
    }
  }

  console.log(`✅ 精确定位: (${bestMatch.x}, ${bestMatch.y}), 相似度=${(bestMatch.similarity * 100).toFixed(1)}%`);

  return bestMatch;
}

/**
 * 运行测试
 */
async function runTest() {
  console.log('='.repeat(60));
  console.log('🧪 图像匹配功能测试');
  console.log('='.repeat(60));

  try {
    // 1. 创建测试图像
    const testImagePath = await createTestImage();

    // 2. 创建模板图像
    const templatePath = await createTemplateImage();

    // 3. 运行图像匹配
    const result = await findElementByImage(testImagePath, templatePath, 0.8);

    // 4. 验证结果
    console.log('\n📋 测试结果:');
    console.log('-'.repeat(40));

    // 预期位置是 (50, 50)，允许一些误差
    const expectedX = 50;
    const expectedY = 50;
    const tolerance = 5;

    const xMatch = Math.abs(result.x - expectedX) <= tolerance;
    const yMatch = Math.abs(result.y - expectedY) <= tolerance;
    const similarityPass = result.similarity >= 0.8;

    console.log(`期望位置: (${expectedX}, ${expectedY})`);
    console.log(`实际位置: (${result.x}, ${result.y})`);
    console.log(`相似度: ${(result.similarity * 100).toFixed(1)}%`);

    if (xMatch && yMatch && similarityPass) {
      console.log('\n🎉 测试通过！图像匹配功能正常工作！');
    } else {
      console.log('\n⚠️ 测试未完全通过');
      if (!xMatch) console.log(`  - X 坐标偏差过大: ${Math.abs(result.x - expectedX)} > ${tolerance}`);
      if (!yMatch) console.log(`  - Y 坐标偏差过大: ${Math.abs(result.y - expectedY)} > ${tolerance}`);
      if (!similarityPass) console.log(`  - 相似度过低: ${(result.similarity * 100).toFixed(1)}% < 80%`);
    }

    // 清理测试文件
    console.log('\n🧹 清理测试文件...');
    try {
      fs.unlinkSync(testImagePath);
      fs.unlinkSync(templatePath);
      console.log('✅ 清理完成');
    } catch (e) {
      console.log('⚠️ 清理文件失败:', e.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('测试完成');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
runTest();
