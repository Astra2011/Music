<template>
  <v-dialog
    v-model="visible"
    scrim="rgba(8, 6, 12, 0.72)"
    width="408"
    max-width="92vw"
    :persistent="true"
    transition="dialog-top-transition"
  >
    <v-card class="punch-card" rounded="xl">
      <!-- 顶部光带 -->
      <div class="punch-card__glow" aria-hidden="true"></div>

      <!-- 头部 -->
      <header class="punch-head">
        <div class="punch-badge">
          <span class="punch-badge__ring punch-badge__ring--1" aria-hidden="true"></span>
          <span class="punch-badge__ring punch-badge__ring--2" aria-hidden="true"></span>
          <v-icon size="38" color="#E6E6EE">mdi-bell-ring-outline</v-icon>
        </div>
        <p class="punch-eyebrow">每日打卡</p>
        <h2 class="punch-title">今天还没打卡哦</h2>
        <div class="punch-meta">
          <span class="chip chip--date">
            <v-icon size="13" start>mdi-calendar-blank-outline</v-icon>
            {{ todayText }}
          </span>
          <span class="chip chip--ghost">{{ isWorkDayText }}</span>
        </div>
      </header>

      <!-- 主体 -->
      <div class="punch-body">
        <p class="punch-copy">完成今天的打卡，养成好习惯～</p>

        <section class="snooze-panel">
          <div class="snooze-panel__label">
            <v-icon size="16" color="#E6E6EE">mdi-clock-outline</v-icon>
            稍后提醒我
          </div>

          <!-- 快捷时间选择（预设选项） -->
          <div class="snooze-options">
            <button
              v-for="m in snoozeOptions"
              :key="m"
              type="button"
              :class="['snooze-option', { 'snooze-option--active': selectedMinutes === m }]"
              @click="selectedMinutes = m"
            >
              {{ m }}分钟
            </button>
          </div>
        </section>
      </div>

      <!-- 操作 -->
      <footer class="punch-actions">
        <v-btn
          block
          variant="flat"
          size="large"
          height="48"
          class="btn-snooze"
          @click="handleSnooze"
        >
          <v-icon start>mdi-clock-outline</v-icon>
          稍后提醒（{{ selectedMinutes }} 分钟）
        </v-btn>

        <v-btn
          block
          variant="outlined"
          height="44"
          class="btn-checkin"
          @click="handleCheckIn"
        >
          <v-icon start>mdi-check-circle-outline</v-icon>
          已打卡
        </v-btn>

        <button type="button" class="skip-today" @click="handleSkipToday">
          今天先不提醒
        </button>
      </footer>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePunchCard } from '@/store/punchCard'

const punchCard = usePunchCard()

const visible = ref(false)

// 选择的分钟数（默认15）
const selectedMinutes = ref(15)

// 快捷时间选项（分钟）
const snoozeOptions = [5, 10, 15, 30, 60]

// 今天的日期文本（如：6月25日 · 周三）
const todayText = computed(() => {
  const d = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 · ${weekdays[d.getDay()]}`
})

// 是否工作日
const isWorkDayText = computed(() => {
  return punchCard.isWorkDay() ? '工作日' : '休息日'
})

/** 显示提醒弹窗 */
function show(): void {
  visible.value = true
}

/** 隐藏弹窗 */
function hide(): void {
  visible.value = false
}

/** 点击已打卡 */
function handleCheckIn(): void {
  punchCard.checkIn()
  hide()
}

/** 点击稍后提醒 */
function handleSnooze(): void {
  punchCard.snooze(selectedMinutes.value)
  hide()
}

/** 今天先不提醒：推迟到当天 23:59 */
function handleSkipToday(): void {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0)
  const minutes = Math.max(1, Math.ceil((end.getTime() - now.getTime()) / 60000))
  punchCard.snooze(minutes)
  hide()
}

/** 外部控制显示 */
defineExpose({ show, hide })
</script>

<style scoped lang="less">
.punch-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(168deg, #232329 0%, #1a1a20 55%, #131317 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px !important;
  box-shadow:
    0 24px 70px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.07);

  // 顶部光带
  .punch-card__glow {
    position: absolute;
    top: 0;
    left: 12%;
    right: 12%;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.75), transparent);
    box-shadow: 0 0 14px rgba(255, 255, 255, 0.35);
    pointer-events: none;
  }

  // 顶部氛围光晕
  &::before {
    content: '';
    position: absolute;
    top: -70px;
    left: 50%;
    transform: translateX(-50%);
    width: 300px;
    height: 170px;
    background: radial-gradient(closest-side, rgba(255, 255, 255, 0.07), transparent);
    pointer-events: none;
  }

  // ── 头部 ────────────────────────────────────────────
  .punch-head {
    position: relative;
    padding: 30px 24px 8px;
    text-align: center;
  }

  .punch-badge {
    position: relative;
    width: 74px;
    height: 74px;
    margin: 0 auto 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: radial-gradient(
      circle at 32% 28%,
      rgba(255, 255, 255, 0.16),
      rgba(255, 255, 255, 0.05) 55%,
      transparent 78%
    );
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.3);

    .punch-badge__ring {
      position: absolute;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.22);

      &--1 {
        inset: -8px;
        animation: badge-pulse 2.4s ease-out infinite;
      }

      &--2 {
        inset: -8px;
        animation: badge-pulse 2.4s ease-out 1.2s infinite;
      }
    }

    :deep(.v-icon) {
      animation: bell-ring 1.8s ease-in-out infinite;
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.25));
    }
  }

  .punch-eyebrow {
    margin: 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 5px;
    color: rgba(190, 190, 202, 0.65);
  }

  .punch-title {
    margin: 8px 0 0;
    font-size: 21px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: #f7f7f9;
  }

  .punch-meta {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 14px;

    .chip {
      display: inline-flex;
      align-items: center;
      padding: 3px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.5px;

      &--date {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(235, 235, 242, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.16);
      }

      &--ghost {
        background: rgba(255, 255, 255, 0.04);
        color: rgba(200, 200, 212, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
    }
  }

  // ── 主体 ────────────────────────────────────────────
  .punch-body {
    position: relative;
    padding: 16px 24px 2px;
  }

  .punch-copy {
    margin: 0 0 14px;
    color: rgba(214, 214, 224, 0.85);
    font-size: 14px;
    line-height: 1.7;
    text-align: center;
  }

  .snooze-panel {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 16px;
    padding: 16px 16px 12px;

    .snooze-panel__label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: rgba(226, 226, 236, 0.92);
      font-size: 13px;
      font-weight: 600;
    }

    // 快捷时间选项
    .snooze-options {
      display: flex;
      gap: 8px;
      margin-top: 12px;

      .snooze-option {
        flex: 1;
        padding: 9px 0;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.04);
        color: rgba(200, 200, 212, 0.7);
        transition: all 0.18s ease;

        &:hover {
          border-color: rgba(255, 255, 255, 0.32);
          color: rgba(235, 235, 242, 0.95);
        }

        &--active {
          background: linear-gradient(135deg, #ffffff, #e9e9f0);
          color: #16161c;
          border-color: transparent;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }
      }
    }
  }

  // ── 操作 ────────────────────────────────────────────
  .punch-actions {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 24px 22px;
  }

  .btn-snooze {
    color: #16161c !important;
    letter-spacing: 1px;
    text-transform: none;
    background: linear-gradient(135deg, #ffffff 0%, #ececf2 55%, #dcdce4 100%) !important;
    border-radius: 14px;
    box-shadow:
      0 10px 26px rgba(0, 0, 0, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      filter: brightness(1.03);
      box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .btn-checkin {
    color: rgba(218, 218, 230, 0.9) !important;
    border: 1px solid rgba(255, 255, 255, 0.16) !important;
    border-radius: 14px;
    text-transform: none;
    background: rgba(255, 255, 255, 0.03);
    transition: all 0.2s ease;

    &:hover {
      border-color: rgba(255, 255, 255, 0.5) !important;
      color: #fff !important;
      background: rgba(255, 255, 255, 0.07) !important;
    }
  }

  .skip-today {
    border: none;
    background: none;
    cursor: pointer;
    padding: 4px 12px;
    color: rgba(160, 160, 176, 0.55);
    font-size: 12px;
    letter-spacing: 0.5px;
    transition: color 0.2s;

    &:hover {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

@keyframes badge-pulse {
  0% {
    transform: scale(0.85);
    opacity: 0.7;
  }
  70% {
    transform: scale(1.25);
    opacity: 0;
  }
  100% {
    transform: scale(1.25);
    opacity: 0;
  }
}

@keyframes bell-ring {
  0%,
  100% {
    transform: rotate(0deg);
  }
  8% {
    transform: rotate(14deg);
  }
  16% {
    transform: rotate(-12deg);
  }
  24% {
    transform: rotate(8deg);
  }
  32% {
    transform: rotate(-6deg);
  }
  40% {
    transform: rotate(0deg);
  }
}
</style>
