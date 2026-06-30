import { ref, watch } from 'vue'

export function useNotes() {
  const presetColors = ['#FFF9DB', '#CDF3EA', '#D9E2FF', '#FDE5DA', '#f3e5f5']
  const localData = localStorage.getItem('wall_notes')
  const notes = ref(localData ? JSON.parse(localData) : [])
  const initialMaxZIndex = notes.value.reduce((max, note) => {
    return (note.zIndex && note.zIndex > max) ? note.zIndex : max
  }, 1)
  const maxZIndex = ref(initialMaxZIndex)

  watch(notes, (newNotes) => {
    localStorage.setItem('wall_notes', JSON.stringify(newNotes))
  }, { deep: true })

  const dialog = ref({
    visible: false,
    isEdit: false,
    formData: { id: null, title: '', content: '', color: '#fff9db', isPinned: false }
  })

  let currentDragNote = null
  let startX = 0
  let startY = 0

  const handleWallContextMenu = () => {
    dialog.value = {
      visible: true,
      isEdit: false,
      formData: { id: null, title: '', content: '', color: presetColors[0], isPinned: false }
    }
  }

  const handleNoteContextMenu = (note) => {
    dialog.value = {
      visible: true,
      isEdit: true,
      formData: { ...note }
    }
  }

  const closeDialog = () => {
    dialog.value.visible = false
  }

  const saveNote = () => {
    if (dialog.value.isEdit) {
      // 编辑保存
      const index = notes.value.findIndex(n => String(n.id) === String(dialog.value.formData.id))
      if (index !== -1) {
        notes.value[index] = { ...dialog.value.formData }
      }
    } else {
      // 新建保存
      maxZIndex.value += 1
      notes.value.push({
        id: Date.now(),
        title: dialog.value.formData.title,
        content: dialog.value.formData.content,
        color: dialog.value.formData.color,
        isPinned: false,
        zIndex: maxZIndex.value,
        x: Math.random() * (window.innerWidth - 250),
        y: Math.random() * (window.innerHeight - 350)
      })
    }
    closeDialog()
  }

  const deleteNote = () => {
    if (!dialog.value.formData.id) {
      console.warn('删除失败：未找到有效的便签 ID')
      closeDialog()
      return
    }
    notes.value = notes.value.filter(n => String(n.id) !== String(dialog.value.formData.id))
    closeDialog()
  }

  // 点击/拖拽提升层级
  const handleMouseDown = (e, note) => {
    if (e.target.classList.contains('pin-icon')) return
    
    // 只要触碰就提升当前 zIndex 
    maxZIndex.value += 1
    note.zIndex = maxZIndex.value

    if (note.isPinned) return

    currentDragNote = note
    startX = e.clientX - note.x
    startY = e.clientY - note.y
  }

  const handleMouseMove = (e) => {
    if (!currentDragNote) return
    currentDragNote.x = e.clientX - startX
    currentDragNote.y = e.clientY - startY
  }

  const handleMouseUp = () => {
    currentDragNote = null
  }

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