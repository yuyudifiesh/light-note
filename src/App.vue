<template>
  <div class="note-wall" @contextmenu.prevent="handleWallContextMenu" @mousemove="handleMouseMove"
    @mouseup="handleMouseUp">
    <div v-if="showTip" class="tip-banner" @dblclick="hideTip">💡 提示：右键点击空白处新建便签，拖拽便签移动，右键便签进行编辑</div>

    <div v-for="note in notes" :key="note.id" class="note-card" :style="{
      backgroundColor: note.color,
      left: note.x + 'px',
      top: note.y + 'px'
    }" @mousedown="handleMouseDown($event, note)" @contextmenu.prevent.stop="handleNoteContextMenu(note)">
      <h3 class="note-title">{{ note.title || '无标题' }}</h3>
      <p class="note-content">{{ note.content || '暂无内容...' }}</p>
    </div>

    <div v-if="dialog.visible" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog-box">
        <h3 class="dialog-title">{{ dialog.isEdit ? '编辑便签' : '新建便签' }}</h3>

        <div class="form-item">
          <label class="custom-label">标题</label>
          <div class="input-wrapper">
            <input v-model="dialog.formData.title" type="text" placeholder="给便签起个名字吧..." class="custom-input" />
          </div>
        </div>

        <div class="form-item">
          <label class="custom-label">内容</label>
          <div class="input-wrapper">
            <textarea v-model="dialog.formData.content" rows="4" placeholder="记下此刻的想法..." class="custom-textarea"></textarea>
          </div>
        </div>

        <div class="form-item">
          <label class="custom-label">便签颜色</label>
          <div class="color-picker">
            <span v-for="color in presetColors" :key="color" :style="{ backgroundColor: color }"
              :class="{ active: dialog.formData.color === color }" @click="dialog.formData.color = color"></span>
          </div>
        </div>

        <div class="dialog-actions">
          <button v-if="dialog.isEdit" class="btn-delete" @click="deleteNote">删除</button>
          <div v-else class="action-spacer"></div>

          <div class="right-actions">
            <button class="btn-cancel" @click="closeDialog">取消</button>
            <button class="btn-submit" @click="saveNote">确定</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNotes } from './useNotes.js'

const {
  presetColors,
  notes,
  dialog,
  handleWallContextMenu,
  handleNoteContextMenu,
  closeDialog,
  saveNote,
  deleteNote,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp
} = useNotes()

const showTip = ref(true)

const hideTip = () => {
  showTip.value = false
}
</script>

<style>
/* 保持全局修复留白样式 */
html, body, #app {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  height: 100% !important;
  max-width: 100vw !important;
}
</style>

<style scoped>
/* 1. 淡棕色网格背景板 */
.note-wall {
  position: fixed;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f0eb;
  background-image:
    linear-gradient(to right, rgba(139, 115, 85, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(139, 115, 85, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  user-select: none;
}

.tip-banner {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: #8b7355;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  pointer-events: auto;
}

/* 2. 便签卡片样式 */
.note-card {
  position: absolute;
  width: 200px;
  min-height: 180px;
  padding: 16px;
  box-shadow: 2px 4px 15px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  cursor: grab;
  transition: box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
}

.note-card:hover {
  box-shadow: 4px 8px 20px rgba(0, 0, 0, 0.15);
}

.note-card:active {
  cursor: grabbing;
}

.note-title {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
  padding-bottom: 4px;
  word-break: break-all;
  text-align: left;
}

.note-content {
  margin: 0;
  font-size: 14px;
  color: #555;
  flex-grow: 1;
  white-space: pre-wrap;
  word-break: break-all;
  text-align: left;
}

/* 3. 页内遮罩弹窗 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(43, 36, 35, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  backdrop-filter: blur(2px);
}

.dialog-box {
  background: #ffffff;
  padding: 28px;
  border-radius: 16px;
  width: 340px;
  box-shadow: 0 12px 40px rgba(139, 115, 85, 0.15);
}

.dialog-title {
  margin: 0 0 20px 0;
  color: #2b2423;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-align: left;
}

.form-item {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.custom-label {
  display: block;
  font-size: 13px;
  color: #8b7355;
  margin-bottom: 8px;
  font-weight: 600;
  text-align: left;
  width: 100%;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.custom-input,
.custom-textarea {
  width: 100%;
  padding: 12px 14px;
  background-color: #f8f6f4;
  border: 1px solid #ebdcd0;
  border-radius: 8px;
  box-sizing: border-box;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  color: #333;
  transition: all 0.2s ease;
  text-align: left;
}

.custom-textarea {
  resize: none;
  line-height: 1.5;
}

.custom-input:hover,
.custom-textarea:hover {
  background-color: #f1eeea;
  border-color: #d7c4b7;
}

.custom-input:focus,
.custom-textarea:focus {
  background-color: #ffffff;
  border-color: #8b7355;
  box-shadow: 0 0 0 3px rgba(139, 115, 85, 0.12);
}

.color-picker {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  width: 100%;
}

.color-picker span {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease;
}

.color-picker span:hover {
  transform: scale(1.15);
}

.color-picker span.active {
  border-color: #8b7355;
  transform: scale(1.15);
}

/* 按钮操作区域（核心修改部分） */
.dialog-actions {
  display: flex;
  justify-content: space-between; /* 左右两端对齐 */
  align-items: center;
  margin-top: 24px;
  width: 100%;
}

/* 占位组件，在没有“删除”按钮时，它会在左侧占位，从而强行把右侧动作组顶到最右边 */
.action-spacer {
  flex: 1;
}

.right-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end; /* 确保内部按钮右对齐 */
}

button {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s ease;
}

.btn-submit {
  background-color: #8b7355;
  color: white;
  box-shadow: 0 4px 10px rgba(139, 115, 85, 0.2);
}

.btn-cancel {
  background-color: #f1eeea;
  color: #666;
}

.btn-delete {
  background-color: #ffe3e3;
  color: #ff6b6b;
}

button:hover {
  opacity: 0.95;
}
</style>