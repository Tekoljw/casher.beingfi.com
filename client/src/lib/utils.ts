import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化大数值，使用 K（千）和 M（百万）单位精简显示
 * @param value 数值（可以是字符串或数字）
 * @returns 格式化后的字符串，保留两位小数
 * @example
 * formatLargeNumber(1000) => "1.00K"
 * formatLargeNumber(1500000) => "1.50M"
 * formatLargeNumber(10000000000) => "10000.00M"
 */
export function formatLargeNumber(value: string | number): string {
  // 转换为数字
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // 处理无效值
  if (isNaN(numValue) || !isFinite(numValue)) {
    return '0';
  }
  
  // 处理负数（保留符号）
  const isNegative = numValue < 0;
  const absValue = Math.abs(numValue);
  
  // 如果数值小于 1000，直接返回原值（保留两位小数）
  if (absValue < 1000) {
    return isNegative ? `-${absValue.toFixed(2)}` : absValue.toFixed(2);
  }
  
  // 如果数值 >= 1000000，使用 M（百万）
  if (absValue >= 1000000) {
    const millions = absValue / 1000000;
    return isNegative ? `-${millions.toFixed(2)}M` : `${millions.toFixed(2)}M`;
  }
  
  // 如果数值 >= 1000，使用 K（千）
  if (absValue >= 1000) {
    const thousands = absValue / 1000;
    return isNegative ? `-${thousands.toFixed(2)}K` : `${thousands.toFixed(2)}K`;
  }
  
  // 理论上不会到这里，但为了类型安全
  return isNegative ? `-${absValue.toFixed(2)}` : absValue.toFixed(2);
}

/**
 * 格式化数字，添加千位分隔符（逗号）
 * @param value 数值（可以是字符串或数字）
 * @param decimals 保留小数位数，默认为2
 * @returns 格式化后的字符串，带千位分隔符
 * @example
 * formatNumberWithCommas(1000) => "1,000.00"
 * formatNumberWithCommas(1234567.89) => "1,234,567.89"
 * formatNumberWithCommas(1000, 0) => "1,000"
 */
export function formatNumberWithCommas(value: string | number | null | undefined, decimals: number = 2): string {
  // 处理空值
  if (value === null || value === undefined || value === '') {
    return '0' + (decimals > 0 ? '.' + '0'.repeat(decimals) : '');
  }
  
  // 转换为数字
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // 处理无效值
  if (isNaN(numValue) || !isFinite(numValue)) {
    return '0' + (decimals > 0 ? '.' + '0'.repeat(decimals) : '');
  }
  
  // 处理负数（保留符号）
  const isNegative = numValue < 0;
  const absValue = Math.abs(numValue);
  
  // 格式化为指定小数位数
  const fixedValue = absValue.toFixed(decimals);
  
  // 分离整数部分和小数部分
  const parts = fixedValue.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // 为整数部分添加千位分隔符
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // 组合结果
  const result = decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  
  return isNegative ? `-${result}` : result;
}

/**
 * 将时间戳转换为可读的日期时间格式
 * @param timestamp 时间戳（可以是字符串或数字，秒级或毫秒级）
 * @returns 格式化后的日期时间字符串，格式：YYYY-MM-DD HH:mm:ss
 * @example
 * formatTimestamp(1704067200) => "2024-01-01 00:00:00"
 * formatTimestamp("0") => "N/A"
 */
export function formatTimestamp(timestamp: string | number | null | undefined): string {
  if (!timestamp || timestamp === '0' || timestamp === 0) {
    return 'N/A';
  }
  
  // 将时间戳转换为数字（可能是秒级或毫秒级）
  const numTimestamp = typeof timestamp === 'string' ? parseFloat(timestamp) : timestamp;
  
  // 如果时间戳小于 10000000000，认为是秒级时间戳，需要乘以 1000
  const milliseconds = numTimestamp < 10000000000 ? numTimestamp * 1000 : numTimestamp;
  
  const date = new Date(milliseconds);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return 'N/A';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}