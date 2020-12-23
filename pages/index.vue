<template>
  <div class="container">
    <Chart></Chart>
  </div>
</template>

<script>
  import Chart from "@/components/Chart.vue";

  export default {
    components: {
      Chart,
    }
  };
</script>

<style>
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

</style>
