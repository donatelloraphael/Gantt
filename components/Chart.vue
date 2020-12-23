<template>
	<div class="chart-container">
		<div class="menu">
			<div class="roadmap">
				<button class="roadmap" @click="createRoadmapDialog = true">New Roadmap</button>
				<select class="roadmap" name="roadmap-select" id="roadmap-select">
					<option value="">Select a roadmap</option>
					<option :value="roadmap.guid" v-for="roadmap in roadmaps" :key="roadmap.guid">{{ roadmap.title }}</option>
				</select>
			</div>
			
		</div>
		<div class="operations">
			
		</div>
		<div class="components">
			
		</div>
		<div class="edit-panel">
			
		</div>

		<!-- Dialog Boxes -->

		<div class="backdrop roadmapBackdrop" v-if="createRoadmapDialog" @click="createRoadmapDialog = false"></div>
		<div class="dialog" v-if="createRoadmapDialog">
			<h2>Create new Roadmap</h2>
			<div class="name">
				<label for="roadmap-name">Enter Roadmap name: </label>
				<input name="roadmap-name" type="text" v-model="roadmapTitle">
			</div>
			<div class="description">
				<label for="roadmap-description">Enter Roadmap description:</label>
				<input name="roadmap-description" type="text" v-model="roadmapDescription">
			</div>
			<div>
				<button class="positive" @click="createRoadmap">Create</button>
				<button class="negative" @click="createRoadmapDialog = false">Cancel</button>
			</div>
		</div>
		
	</div>
</template>


<script>
	
export default {
	name: "Chart",
	data() {
		return {
			roadmaps: [],
			selectedRoadmap: null,
			createRoadmapDialog: false,
			roadmapTitle: "",
			roadmapDescription: "",
		}
	},
	methods: {
		async createRoadmap() {
			const title = this.roadmapTitle;
			const description = this.roadmapDescription;

			// Creates a new Roadmap
			const roadmap = await this.$axios.$post("/api/roadmaps", { 
				title,
				description
			}).then(guid => {
				const newRoadmap = {
					title,
					description,
					guid,
					components: []
				};
				this.roadmaps.push(newRoadmap);
				
				// Clears state
				this.createRoadmapDialog = false;
				this.roadmapTitle = "";
				this.roadmapDescription = "";
			}).catch(err => console.log(err));
		},

	},
	async fetch() {
		console.log(`${process.env.VUE_APP_API_URL}/api/roadmaps`)
		// Get list of roadmaps
		this.roadmaps = await this.$axios.$get("/api/roadmaps");
	},
	mounted() {
	}
};
</script>

<style scoped>

.chart-container {
	width: 90%;
	height: auto;
	min-height: 700px;
	border: 2px solid #e2e2e2;
	border-radius: 10px;
	padding: 40px;
	display: grid;
  align-items: center;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  grid-template-rows: 100px 600px;
  grid-gap: 1rem;
  grid-auto-flow: column dense;
}

/**************************Menu**************************/

.menu {
	grid-column: span 5;
	background-color: #f2f2f2;
	height: 100%;
	display: flex;
	padding: 10px;
}

.roadmap {
	width: 200px;
	display: flex;
	flex-wrap: wrap;
}

.menu button.roadmap {
	width: 200px;
	height: 40px;
	outline: none;
	border: none;
	background-color: #42b983;
	font-size: 1rem;
	cursor: pointer;
	display: inline-block;
	text-align: center;
	vertical-align: middle;
	color: #fff;
}

.menu button.roadmap:hover {
	background-color: #349969;
}

.roadmap select {
	font-size: 1rem;
	border: none;
	background-color: #cc7351;
	color: white;
	outline: none;
	padding-left: 10px;
}


/*************************Operations*********************/

.operations {
	height: 100%;
	background-color: #f2f2f2;
}

/************************Components**********************/

.components {
	height: 100%;
	grid-column: span 3;
	background-color: #f2f2f2;
}

/************************Edit Panel**********************/

.edit-panel {
	height: 100%;
	background-color: #f2f2f2;
	grid-column: span 1;
	/*display: none;*/
}

/*************************Dialogs************************/

.backdrop {
	position: fixed;
	width: 100vw;
	height: 100vh;
	z-index: 100;
	background-color: rgba(0,0,0,0);
}

.dialog {
	min-width: 500px;
	min-height: 300px;
	max-width: auto;
	max-height: auto;
	position: fixed;
	top: 35vh;
	left: 35vw;
	border-radius: 10px;
	background-color: #ded7b1;
	z-index: 150;
	color: black;
}

.dialog div {
	margin: 30px 10px;
}

.dialog div label {
	display: inline-block;
	width: 200px;
	text-align: left;
}

.dialog div input {
	width: 250px;
	height: 30px;
	font-size: 1rem;
}

.dialog button {
	width: 150px;
	height: 40px;
	font-size: 1.1rem;
	color: white;
}

button {
	border: none;
	outline: none;
	cursor: pointer;
}

button.positive {
	background-color: #42b983;
}

button.positive:hover {
	background-color: #39966a;
}

button.negative {
	background-color: #dd3b00;
}

button.negative:hover {
	background-color: #ad2e00;
}

/***********************Media Queries********************/
	
@media(max-width: 1424px) {
	.components {
		grid-column: span 2;
	}
}
@media(max-width: 1150px) {
	.chart-container {
  	grid-template-rows: 100px 300px 600px;
	}
	.menu {
		grid-column: span 4;
	}
	.operations {
		grid-column: span 1;
	}
	.edit-panel {
		grid-column: span 3;
	}
	.components {
		grid-column: span 4;
	}
}

@media(max-width: 610px) {
	.chart-container {
  	grid-template-columns: repeat(auto-fit, 1fr);
  	grid-template-rows: 100px 400px 600px 600px;
	}
	.operations {
		grid-column: span 1;
	}
	.edit-panel {
		grid-column: span 1;
	}
}
</style>