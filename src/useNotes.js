import { ref, reactive, watch, onMounted } from 'vue'

export function useNotes() {
  // 1. 预设颜色
  const presetColors = ['#fff9db', '#e7f5ff', '#e3fafc', '#f3f0ff', '#f4fce3', '#fff5f5']
  
  // 2. 核心便签数组状态
  const notes = ref([])

  // 3. 弹窗状态管理
  const dialog = reactive({
    visible: false,
    isEdit: false,
    editingId: null,
    clickX: 100,
    clickY: 100,
    formData: {
      title: '',
      content: '',
      color: '#fff9db'
    }
  })

  // 4. 拖拽状态管理
  const dragStatus = reactive({
    isDragging: false,
    currentNote: null,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0
  })

  // 5. 生命周期与 LocalStorage 持久化
  onMounted(() => {
    const savedNotes = localStorage.getItem('v-note-wall-data')
    if (savedNotes) {
      notes.value = JSON.parse(savedNotes)
    }
  })

  watch(notes, (newNotes) => {
    localStorage.setItem('v-note-wall-data', JSON.stringify(newNotes))
  }, { deep: true })

  // 6. 右键及弹窗事件处理
  const handleWallContextMenu = (e) => {
    dialog.isEdit = false
    dialog.editingId = null
    dialog.clickX = e.clientX
    dialog.clickY = e.clientY
    dialog.formData = { title: '', content: '', color: '#fff9db' }
    dialog.visible = true
  }

  const handleNoteContextMenu = (note) => {
    dialog.isEdit = true
    dialog.editingId = note.id
    dialog.formData = {
      title: note.title,
      content: note.content,
      color: note.color
    }
    dialog.visible = true
  }

  const closeDialog = () => {
    dialog.visible = false
  }

  const saveNote = () => {
    if (dialog.isEdit && dialog.editingId !== null) {
      // 编辑现有便签
      const target = notes.value.find(n => n.id === dialog.editingId)
      if (target) {
        target.title = dialog.formData.title
        target.content = dialog.formData.content
        target.color = dialog.formData.color
      }
    } else {
      // 新建便签
      const newNote = {
        id: Date.now(),
        title: dialog.formData.title,
        content: dialog.formData.content,
        color: dialog.formData.color,
        x: dialog.clickX,
        y: dialog.clickY
      }
      notes.value.push(newNote)
    }
    closeDialog()
  }

  const deleteNote = () => {
    if (dialog.editingId !== null) {
      notes.value = notes.value.filter(n => n.id !== dialog.editingId)
      closeDialog()
    }
  }

  // 7. 鼠标拖拽逻辑
  const handleMouseDown = (e, note) => {
    if (e.button === 2) return // 过滤右键
    dragStatus.isDragging = true
    dragStatus.currentNote = note
    dragStatus.startX = e.clientX
    dragStatus.startY = e.clientY
    dragStatus.startLeft = note.x
    dragStatus.startTop = note.y
  }

  const handleMouseMove = (e) => {
    if (!dragStatus.isDragging || !dragStatus.currentNote) return
    const deltaX = e.clientX - dragStatus.startX
    const deltaY = e.clientY - dragStatus.startY
    dragStatus.currentNote.x = dragStatus.startLeft + deltaX
    dragStatus.currentNote.y = dragStatus.startTop + deltaY
  }

  const handleMouseUp = () => {
    dragStatus.isDragging = false
    dragStatus.currentNote = null
  }

  // 返回给组件使用
  return {
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
  }
}