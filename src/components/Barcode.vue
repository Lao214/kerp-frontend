<template>
  <div class="barcode-container">
    <!-- 这里的 id 必须唯一，防止循环渲染时冲突 -->
    <svg :id="`barcode-${id}`"></svg>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, nextTick } from 'vue'
import JsBarcode from 'jsbarcode'

const props = defineProps<{
  id: string | number, // 唯一标识
  value: string,       // SN码的值 (如 "SN20231227001")
  width?: number,
  height?: number
}>()

const renderBarcode = () => {
  if (!props.value) return
  JsBarcode(`#barcode-${props.id}`, props.value, {
    format: "CODE128", // 工业标准格式
    lineColor: "#000",
    width: props.width || 2,
    height: props.height || 50,
    displayValue: true, // 显示下方的文字
    fontSize: 14,
    margin: 0
  })
}

onMounted(() => {
  renderBarcode()
})

// 监听值变化重新渲染
watch(() => props.value, () => {
  nextTick(renderBarcode)
})
</script>