/**
 * 安全目录复制工具 —— 跳过 Unix domain socket / FIFO / 设备文件
 *
 * Node.js fs.cp({ recursive: true }) 遇到 .sock 文件会抛出 EINVAL。
 * 该模块提供替代实现，复制时自动跳过特殊文件类型。
 */

const fs = process.getBuiltinModule('node:fs') as typeof import('node:fs')
const path = process.getBuiltinModule('node:path') as typeof import('node:path')
const { copyFile, lstat, mkdir, readdir, symlink, readlink } = fs.promises

/** 判断文件类型是否可被安全复制 */
function isCopyableFileType(stats: import('node:fs').Stats): boolean {
  return stats.isFile() || stats.isDirectory() || stats.isSymbolicLink()
}

/**
 * 安全复制单个文件或目录
 * @param sourcePath 源路径
 * @param targetPath 目标路径
 */
async function safeCopyEntry(sourcePath: string, targetPath: string): Promise<void> {
  const stats = await lstat(sourcePath)

  if (!isCopyableFileType(stats)) {
    // 跳过 socket / FIFO / block device / character device
    return
  }

  if (stats.isDirectory()) {
    await mkdir(targetPath, { recursive: true })
    const entries = await readdir(sourcePath, { withFileTypes: true })
    for (const entry of entries) {
      const childSource = path.join(sourcePath, entry.name)
      const childTarget = path.join(targetPath, entry.name)
      await safeCopyEntry(childSource, childTarget)
    }
    return
  }

  if (stats.isSymbolicLink()) {
    const linkTarget = await readlink(sourcePath)
    await symlink(linkTarget, targetPath)
    return
  }

  // 普通文件
  await copyFile(sourcePath, targetPath)
}

/**
 * 安全递归复制目录或文件，自动跳过 socket / FIFO / 设备文件
 *
 * 行为与 fs.cp(source, target, { recursive: true, force: true }) 基本一致，
 * 但遇到 .sock 等特殊文件不会崩溃。
 */
export async function safeCp(sourcePath: string, targetPath: string): Promise<void> {
  const normalizedSource = String(sourcePath || '').trim()
  const normalizedTarget = String(targetPath || '').trim()

  if (!normalizedSource || !normalizedTarget) {
    throw new Error('safeCp: sourcePath and targetPath are required')
  }

  const stats = await lstat(normalizedSource)

  if (stats.isDirectory()) {
    await mkdir(normalizedTarget, { recursive: true })
    const entries = await readdir(normalizedSource, { withFileTypes: true })
    for (const entry of entries) {
      const childSource = path.join(normalizedSource, entry.name)
      const childTarget = path.join(normalizedTarget, entry.name)
      await safeCopyEntry(childSource, childTarget)
    }
  } else if (isCopyableFileType(stats)) {
    await safeCopyEntry(normalizedSource, normalizedTarget)
  }
  // 非可复制类型（socket 等）静默跳过
}
