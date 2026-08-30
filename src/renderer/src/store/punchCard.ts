import { defineStore } from 'pinia'
import { reactive } from 'vue'

const STORAGE_KEY = 'PUNCH_CARD_STATE'

/** 2026 年法定节假日（可自行增删） */
const DEFAULT_HOLIDAYS: string[] = [
  // 元旦
  '2026-01-01', '2026-01-02', '2026-01-03',
  // 春节
  '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20',
  '2026-02-21', '2026-02-22', '2026-02-23',
  // 清明节
  '2026-04-05', '2026-04-06', '2026-04-07',
  // 劳动节
  '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05',
  // 端午节
  '2026-06-25', '2026-06-26', '2026-06-27',
  // 中秋节
  '2026-10-04', '2026-10-05', '2026-10-06',
  // 国庆节
  '2026-10-01', '2026-10-02', '2026-10-03',
  '2026-10-07', '2026-10-08', '2026-10-09',
]

interface PunchCardState {
  /** 今天是否已打卡 */
  todayChecked: boolean
  /** 最后一次打卡的日期 (YYYY-MM-DD) */
  lastCheckDate: string
  /** 推迟提醒到的时间戳 (ms)，null 表示不在推迟中 */
  snoozeUntil: number | null
  /** 用户自定义的节假日列表 */
  holidays: string[]
  /** 手动强制休息模式（不受节假日判断影响） */
  forceRest: boolean
}

export const usePunchCard = defineStore('punchCard', () => {
  const state: PunchCardState = reactive({
    todayChecked: false,
    lastCheckDate: '',
    snoozeUntil: null,
    holidays: [...DEFAULT_HOLIDAYS],
    forceRest: false
  })

  /** 获取今天的日期字符串 */
  function getTodayStr(): string {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  /** 判断今天是否为工作日 */
  function isWorkDay(): boolean {
    const today = getTodayStr()
    const d = new Date()
    const dayOfWeek = d.getDay() // 0=Sun, 1=Mon, ..., 6=Sat

    // 强制休息模式 → 非工作日
    if (state.forceRest) return false

    // 节假日列表中有今天 → 非工作日
    if (state.holidays.includes(today)) return false

    // 周六日 → 非工作日（除非是调休上班日，暂未处理）
    if (dayOfWeek === 0 || dayOfWeek === 6) return false

    return true
  }

  /** 打卡 */
  function checkIn(): void {
    state.todayChecked = true
    state.lastCheckDate = getTodayStr()
    state.snoozeUntil = null
    saveState()
  }

  /** 推迟提醒 minutes 分钟 */
  function snooze(minutes: number): void {
    state.snoozeUntil = Date.now() + minutes * 60 * 1000
    saveState()
  }

  /** 取消推迟 */
  function clearSnooze(): void {
    state.snoozeUntil = null
    saveState()
  }

  /** 跨日状态重置（每次判断前调用）
   *  - 昨天或更早打过卡 → 清空今日打卡状态（todayChecked / lastCheckDate）
   *  - 已过期的"稍后提醒"自动清除
   *
   *  ⚠️ 注意：绝不能清空【未过期】的 snoozeUntil。
   *  用户点击"稍后提醒 N 分钟"时，snooze() 只设置 snoozeUntil，
   *  lastCheckDate 仍为空（今天还没打卡）。如果这里用
   *  `lastCheckDate !== today` 判断（空串永远 !== 今天），
   *  每次检查都会把 snoozeUntil 清掉，
   *  导致"选了 15 分钟，1 分钟内提醒又弹出来"。
   */
  function resetIfNewDay(): void {
    const today = getTodayStr()
    if (state.lastCheckDate && state.lastCheckDate !== today) {
      state.todayChecked = false
      state.lastCheckDate = ''
    }
    if (state.snoozeUntil && Date.now() >= state.snoozeUntil) {
      state.snoozeUntil = null
    }
  }

  /** 判断是否应该显示提醒 */
  function shouldShowReminder(): boolean {
    const now = new Date()
    const hours = now.getHours()
    const mins = now.getMinutes()

    // 跨日重置（保留未过期的稍后提醒）
    resetIfNewDay()

    // 非工作日不提醒
    if (!isWorkDay()) return false

    // 今天已打卡 → 不提醒
    if (state.todayChecked) return false

    // 未到 18:50 → 不提醒
    if (hours < 18 || (hours === 18 && mins < 50)) return false

    // 在推迟期内 → 不提醒
    if (state.snoozeUntil && Date.now() < state.snoozeUntil) return false

    return true
  }

  /** 获取推迟剩余的秒数（用于显示） */
  function getSnoozeRemaining(): number {
    if (!state.snoozeUntil) return 0
    const remaining = Math.max(0, Math.floor((state.snoozeUntil - Date.now()) / 1000))
    if (remaining === 0) {
      state.snoozeUntil = null
      saveState()
    }
    return remaining
  }

  /** 添加节假日 */
  function addHoliday(dateStr: string): void {
    if (!state.holidays.includes(dateStr)) {
      state.holidays.push(dateStr)
      state.holidays.sort()
      saveHolidays()
    }
  }

  /** 移除节假日 */
  function removeHoliday(dateStr: string): void {
    const idx = state.holidays.indexOf(dateStr)
    if (idx !== -1) {
      state.holidays.splice(idx, 1)
      saveHolidays()
    }
  }

  /** 重置节假日为默认 */
  function resetHolidays(): void {
    state.holidays.length = 0
    state.holidays.push(...DEFAULT_HOLIDAYS)
    saveHolidays()
  }

  /** 切换强制休息 */
  function toggleForceRest(): void {
    state.forceRest = !state.forceRest
    saveHolidays()
  }

  function saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        todayChecked: state.todayChecked,
        lastCheckDate: state.lastCheckDate,
        snoozeUntil: state.snoozeUntil
      }))
    } catch { /* ignore */ }
  }

  function saveHolidays(): void {
    try {
      localStorage.setItem('PUNCH_CARD_HOLIDAYS', JSON.stringify(state.holidays))
      localStorage.setItem('PUNCH_CARD_FORCE_REST', JSON.stringify(state.forceRest))
    } catch { /* ignore */ }
  }

  function loadState(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        state.todayChecked = parsed.todayChecked || false
        state.lastCheckDate = parsed.lastCheckDate || ''
        state.snoozeUntil = parsed.snoozeUntil || null
      }
      const holidays = localStorage.getItem('PUNCH_CARD_HOLIDAYS')
      if (holidays) {
        state.holidays.length = 0
        state.holidays.push(...JSON.parse(holidays))
      }
      const forceRest = localStorage.getItem('PUNCH_CARD_FORCE_REST')
      if (forceRest !== null) {
        state.forceRest = JSON.parse(forceRest)
      }
    } catch { /* ignore */ }
  }

  // 初始化加载
  loadState()

  // 跨日自动重置（保留未过期的稍后提醒）
  resetIfNewDay()

  return {
    state,
    isWorkDay,
    checkIn,
    snooze,
    clearSnooze,
    shouldShowReminder,
    getSnoozeRemaining,
    addHoliday,
    removeHoliday,
    resetHolidays,
    toggleForceRest
  }
})
