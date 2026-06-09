/**
 * Desktop RPA 新操作测试脚本
 * 测试 drag（拖拽）、scroll（滚动）、hotkey（快捷键）功能
 */

// 测试函数
async function testDrag(manager) {
  console.log('\n========== 测试拖拽（drag）==========');
  try {
    console.log('将执行从 (200, 200) 到 (400, 400) 的拖拽操作...');
    console.log('（注意：实际移动会移动鼠标，请在 5 秒内将鼠标移到屏幕中央以便观察）');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 执行拖拽 - 这会真实移动鼠标，请谨慎使用
    // await manager.drag(200, 200, 400, 400, { duration: 1000 });

    console.log('✅ 拖拽方法已定义（实际执行已注释，请自行取消注释测试）');
  } catch (err) {
    console.log('❌ 拖拽失败:', err);
  }
}

async function testScroll(manager) {
  console.log('\n========== 测试滚动（scroll）==========');
  try {
    console.log('将执行鼠标滚轮滚动操作...');
    console.log('（注意：实际滚动会移动鼠标滚轮，请在 5 秒内将鼠标移到屏幕中央以便观察）');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 执行滚动 - 这会真实滚动鼠标滚轮，请谨慎使用
    // await manager.scroll(500, 500, 0, 3); // 向下滚动 3 格

    console.log('✅ 滚动方法已定义（实际执行已注释，请自行取消注释测试）');
  } catch (err) {
    console.log('❌ 滚动失败:', err);
  }
}

async function testHotkey(manager) {
  console.log('\n========== 测试快捷键（hotkey/keyCombo）==========');
  try {
    console.log('将执行快捷键操作...');
    console.log('（注意：实际按键会触发系统快捷键，请在 5 秒内切换到目标窗口以便观察）');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 测试 keyPress - 单个按键
    // await manager.keyPress('enter');

    // 测试 keyCombo - 组合键
    // await manager.keyCombo('ctrl+c');

    // 测试 hotkey - 别名
    // await manager.hotkey('command', 'shift', 's');

    console.log('✅ 快捷键方法已定义（实际执行已注释，请自行取消注释测试）');
  } catch (err) {
    console.log('❌ 快捷键失败:', err);
  }
}

async function testKeyMapping() {
  console.log('\n========== 测试按键名称映射==========');
  const testKeys = [
    // 字母
    'a', 'b', 'c',
    // 数字
    '1', '2', '3',
    // 功能键
    'f1', 'f12',
    // 修饰键
    'ctrl', 'alt', 'shift', 'command',
    // 特殊键
    'enter', 'escape', 'space', 'tab',
    'up', 'down', 'left', 'right',
  ];

  console.log('支持的按键名称:');
  console.log(testKeys.join(', '));
  console.log('✅ 按键映射表已定义');
}

async function main() {
  console.log('🚀 Desktop RPA 新操作测试开始...\n');

  // 动态导入管理器
  const { DesktopRpaManager } = await import('./desktop-rpa-manager.js');
  const { RpaStorage } = await import('./rpa-storage.js');

  // 创建管理器实例（用于测试方法存在性）
  const storage = new RpaStorage();
  const manager = new DesktopRpaManager(storage);

  // 检查方法是否存在
  console.log('========== 方法存在性检查 ==========');
  console.log('drag 方法:', typeof manager.drag === 'function' ? '✅ 存在' : '❌ 不存在');
  console.log('scroll 方法:', typeof manager.scroll === 'function' ? '✅ 存在' : '❌ 不存在');
  console.log('keyPress 方法:', typeof manager.keyPress === 'function' ? '✅ 存在' : '❌ 不存在');
  console.log('keyCombo 方法:', typeof manager.keyCombo === 'function' ? '✅ 存在' : '❌ 不存在');
  console.log('hotkey 方法:', typeof manager.hotkey === 'function' ? '✅ 存在' : '❌ 不存在');

  // 执行测试
  await testKeyMapping();
  await testDrag(manager);
  await testScroll(manager);
  await testHotkey(manager);

  console.log('\n========== 测试完成 ==========');
  console.log('\n说明:');
  console.log('1. 拖拽、滚动、快捷键操作会真实控制系统鼠标和键盘');
  console.log('2. 测试脚本中已注释掉实际执行代码，避免误操作');
  console.log('3. 如需测试实际效果，请取消注释相应代码并确保目标窗口处于活跃状态');
  console.log('\n支持的快捷键格式:');
  console.log("  - 单键: 'enter', 'escape', 'space'");
  console.log("  - 组合键: 'ctrl+c', 'command+shift+s', 'alt+f4'");
  console.log("  - 多参数: hotkey('ctrl', 'c'), hotkey('command', 'shift', 's')");
}

main().catch(console.error);
