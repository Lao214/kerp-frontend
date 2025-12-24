<script setup lang="ts">
// 暂时啥也不写
</script>

<template>
    <!-- 路由出口：以后所有的页面都会显示在这里 -->
    <router-view />
</template>

<style>
/* 全局样式重置，防止有白边 */
html,
body,
#app {
    height: 100%;
    margin: 0;
    padding: 0;
}
</style>