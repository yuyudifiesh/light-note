<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { Transformer } from 'markmap-lib'
import { Markmap } from 'markmap-view'

const props = defineProps({
  markdownText: {
    type: String,
    default: ''
  }
})

const svgRef = ref(null)
let markmapInstance = null
const transformer = new Transformer()

const updateMarkmap = () => {
  if (!svgRef.value) return

  // 解析 Markdown 文本为树状结构
  const { root } = transformer.transform(props.markdownText || '# 暂无内容\n- 右键编辑添加内容')

  if (!markmapInstance) {
    // 首次创建实例
    markmapInstance = Markmap.create(svgRef.value, {
      autoFit: true, // 渲染后自动缩放填满卡片
      duration: 300, // 节点折叠过渡动画
    }, root)
  } else {
    markmapInstance.setData(root)
    markmapInstance.fit()
  }
}

onMounted(() => {
  updateMarkmap()
})

watch(() => props.markdownText, () => {
  updateMarkmap()
})

onBeforeUnmount(() => {
  if (markmapInstance) {
    markmapInstance.destroy()
    markmapInstance = null
  }
})
</script>

<template>
  <div class="markmap-container" @mousedown.stop>
    <svg ref="svgRef" class="markmap-svg"></svg>
  </div>
</template>

<style scoped>
.markmap-container {
  width: 100%;
  height: 100%;
  flex-grow: 1;
  background-color: rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.markmap-svg {
  width: 100%;
  height: 100%;
  display: block;
}

:deep(.markmap-node) {
  cursor: pointer;
}
:deep(.markmap-foreign) {
  display: inline-block;
  font-size: 12px;
}
</style>