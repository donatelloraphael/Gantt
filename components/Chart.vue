<template>
	<div class="chart-container">
		<div class="operations">
			
		</div>
		<div class="components">
			
		</div>
		<div class="edit-panel">
			
		</div>
		
	</div>
</template>


<script>
	
export default {
	name: "Chart",
};
</script>

<style scoped>

.chart-container {
	width: 90%;
	height: auto;
	min-height: 600px;
	border: 2px solid #e2e2e2;
	border-radius: 10px;
	padding: 40px;
	display: grid;
  align-items: center;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  grid-gap: 2rem;
}

.operations {
	height: 100%;
	background-color: #f2f2f2;
}

.components {
	height: 100%;
	grid-column: span 2;
	background-color: #f2f2f2;
}

.edit-panel {
	height: 100%;
	background-color: #f2f2f2;
	/*display: none;*/
}
	
@media(max-width: 1204px) {
	.chart-container {
  	grid-template-rows: repeat(2, 600px);
	}
}

@media(max-width: 902px) {
	.chart-container {
  	grid-template-rows: repeat(3, 600px);
	}
}
</style>