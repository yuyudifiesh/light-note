<template>
  <div class="note-wall" @contextmenu.prevent="handleWallContextMenu" @mousemove="handleMouseMove"
    @mouseup="handleMouseUp">
    <div v-if="showTip" class="tip-banner" @dblclick="hideTip">💡 提示：右键空白处新建便签，拖拽便签移动，右键便签编辑/切换思维导图模式</div>

    <div v-for="note in notes" :key="note.id" 
      class="note-card" 
      :class="{ 'is-pinned': note.isPinned }"
      :style="{
        backgroundColor: note.color,
        left: note.x + 'px',
        top: note.y + 'px',
        zIndex: note.zIndex || 1,
        width: note.isMindmap ? '340px' : '240px',
        minHeight: note.isMindmap ? '260px' : '180px',
        maxHeight: note.isMindmap ? '420px' : '320px'
      }" @mousedown="handleMouseDown($event, note)" @contextmenu.prevent.stop="handleNoteContextMenu(note)">
      
      <span class="pin-icon" :class="{ 'pinned': note.isPinned }" @mousedown.stop @click.stop="note.isPinned = !note.isPinned">
        📌
      </span>

      <h3 class="note-title" v-html="renderTitle(note.title)"></h3>
      
      <div v-if="!note.isMindmap" class="note-content markdown-body" v-html="renderContent(note.content)"></div>
      
      <MarkmapView v-else :markdownText="note.content" />
    </div>

    <Transition name="dialog-fade">
      <div v-if="dialog.visible" class="dialog-overlay" @click.self="closeDialog">
        <div class="dialog-box">
          <h3 class="dialog-title">{{ dialog.isEdit ? '编辑便签' : '新建便签' }}</h3>

          <div class="form-item">
            <label class="custom-label">标题</label>
            <div class="input-wrapper">
              <input v-model="dialog.formData.title" type="text" placeholder="输入标题..." class="custom-input" />
            </div>
          </div>

          <div class="form-item">
            <label class="custom-label">内容 (支持 Markdown 语法或导图层级)</label>
            <div class="input-wrapper">
              <textarea v-model="dialog.formData.content" rows="6" placeholder="输入一些灵感✨或者想法💡..." class="custom-textarea"></textarea>
            </div>
          </div>

          <div class="form-item checkbox-item">
            <label class="checkbox-label" @mousedown.stop>
              <input type="checkbox" v-model="dialog.formData.isMindmap" class="custom-checkbox" />
              <span class="checkbox-text">转换为思维导图模式显示</span>
            </label>
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
            <div class="action-spacer" v-else></div>
            <div class="right-actions">
              <button class="btn-cancel" @click="closeDialog">取消</button>
              <button class="btn-submit" @click="saveNote">确定</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Footer />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNotes } from './useNotes.js'
import MarkdownIt from 'markdown-it'
import MarkmapView from './components/MarkmapView.vue'
import Footer from './components/Footer.vue'

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

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: false
})

const escapeHtml = (str) => {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const parseRestrictedMarkdown = (text, allowedFeatures) => {
  let html = escapeHtml(text)
  html = html.replace(/\n/g, '<br>')

  if (allowedFeatures.includes('bold')) {
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>')
  }
  if (allowedFeatures.includes('italic')) {
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
    html = html.replace(/_(.*?)_/g, '<em>$1</em>')
  }
  if (allowedFeatures.includes('underline')) {
    html = html.replace(/\+\+(.*?)\+\+/g, '<u>$1</u>')
  }
  if (allowedFeatures.includes('strikethrough')) {
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>')
  }
  if (allowedFeatures.includes('list')) {
    const lines = html.split('<br>')
    let inUnorderedList = false
    let inOrderedList = false
    let listHtml = []

    lines.forEach(line => {
      const trimmed = line.trim()
      const ulMatch = trimmed.match(/^([-\*])\s+(.*)$/)
      const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)

      if (ulMatch) {
        if (inOrderedList) { listHtml.push('</ol>'); inOrderedList = false }
        if (!inUnorderedList) { listHtml.push('<ul>'); inUnorderedList = true }
        listHtml.push(`<li>${ulMatch[2]}</li>`)
      } else if (olMatch) {
        if (inUnorderedList) { listHtml.push('</ul>'); inUnorderedList = false }
        if (!inOrderedList) { listHtml.push('<ol>'); inOrderedList = false }
        listHtml.push(`<li>${olMatch[2]}</li>`)
      } else {
        if (inUnorderedList) { listHtml.push('</ul>'); inUnorderedList = false }
        if (inOrderedList) { listHtml.push('</ol>'); inOrderedList = false }
        listHtml.push(line)
      }
    })

    if (inUnorderedList) listHtml.push('</ul>')
    if (inOrderedList) listHtml.push('</ol>')
    html = listHtml.join('<br>').replace(/<\/ul><br>/g, '</ul>').replace(/<\/ol><br>/g, '</ol>').replace(/<ul><br>/g, '<ul>').replace(/<ol><br>/g, '<ol>')
  }

  return html
}

const renderTitle = (title) => {
  if (!title) return '无标题'
  return parseRestrictedMarkdown(title, ['bold', 'italic'])
}

const renderContent = (content) => {
  if (!content) return '<p class="placeholder-text">暂无内容...</p>'
  return parseRestrictedMarkdown(content, ['bold', 'italic', 'list', 'underline', 'strikethrough'])
}
</script>

<style>
html, body, #app {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  height: 100% !important;
  max-width: 100vw !important;
}
</style>

<style scoped>
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
  z-index: 1000;
}

.note-card {
  position: absolute;
  padding: 16px; 
  box-shadow: 2px 4px 15px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  transition: box-shadow 0.2s ease, transform 0.15s ease, width 0.2s ease-in-out, min-height 0.2s ease-in-out, max-height 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
  overflow: hidden; 
  box-sizing: border-box;
  user-select: none !important;
  cursor: grab;
}

.note-card:hover {
  box-shadow: 4px 8px 20px rgba(0, 0, 0, 0.15);
}

.note-card:active {
  cursor: grabbing;
}

.note-card.is-pinned {
  cursor: default !important;
  user-select: text !important;
}

.pin-icon {
  position: absolute;
  top: 10px;
  right: 12px;
  font-size: 14px;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s ease, transform 0.15s ease;
  user-select: none;
  z-index: 10; 
}

.pin-icon:hover {
  opacity: 0.85;
  transform: scale(1.2);
}

.pin-icon.pinned {
  opacity: 1 !important;
  transform: rotate(-15deg) scale(1.1);
}

.note-title {
  margin: 0 24px 8px 0; 
  font-size: 15px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
  padding-bottom: 4px;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: break-word;
}

/* 便签主要内容区域 */
.note-content {
  margin: 0;
  font-size: 13.5px;
  color: #444;
  flex-grow: 1;
  text-align: left;

  overflow-x: hidden !important; 
  overflow-y: auto !important;   
  white-space: pre-wrap !important; 
  word-break: break-all !important;  
  overflow-wrap: break-word !important;

  scrollbar-width: none; 
  -ms-overflow-style: none; 
}

.note-card.is-pinned .note-content {
  user-select: text !important;
}

.note-content::-webkit-scrollbar {
  display: none;
}

/* 占位符灰色字 */
:deep(.placeholder-text) {
  color: #999;
  font-style: italic;
  margin: 0;
}

/* 3. Markdown 元素的样式微调 */
.markdown-body :first-child {
  margin-top: 0;
}
.markdown-body :last-child {
  margin-bottom: 0;
}

.note-card.is-pinned .markdown-body * {
  user-select: text !important;
}

.markdown-body ul, 
.markdown-body ol {
  padding-left: 20px;
  margin: 6px 0;
  word-break: break-all;
  overflow-wrap: break-word;
}
.markdown-body li {
  margin-bottom: 4px;
  line-height: 1.4;
}

/* 4. 页内遮罩弹窗 */
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
  z-index: 1999;
  backdrop-filter: blur(2px);
  transition: opacity 0.2s ease-in-out;
}

.dialog-box {
  background: #ffffff;
  padding: 28px;
  border-radius: 16px;
  width: 340px;
  box-shadow: 0 12px 40px rgba(139, 115, 85, 0.15);
  transition: opacity 0.2s ease-in-out;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-from .dialog-box,
.dialog-fade-leave-to .dialog-box {
  opacity: 0;
}

.dialog-fade-enter-to,
.dialog-fade-leave-from {
  opacity: 1;
}

.dialog-fade-enter-to .dialog-box,
.dialog-fade-leave-from .dialog-box {
  opacity: 1;
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

/* 复选框容器样式 */
.checkbox-item {
  margin-bottom: 20px;
  flex-direction: row !important;
  align-items: center !important;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  width: 100%;
}

.custom-checkbox {
  width: 18px;
  height: 18px;
  margin: 0 10px 0 0;
  cursor: pointer;
  accent-color: #8b7355; 
}

.checkbox-text {
  font-size: 13.5px;
  color: #555;
  font-weight: 600;
  user-select: none;
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

.dialog-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  width: 100%;
}

.action-spacer {
  flex: 1;
}

.right-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
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
  color: #E64C4F;
}

button:hover {
  opacity: 0.95;
}
</style>