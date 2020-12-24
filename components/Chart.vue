<template>
	<div class="chart-container">

		<!-- Menu -->
		<div class="menu">
			<button class="roadmap" @click="createRoadmapDialog = true">New Roadmap</button>
			<select class="roadmap" name="roadmap-select" id="roadmap-select">
				<option value="">Select a roadmap</option>
				<option :value="roadmap.guid" v-for="roadmap in roadmaps" :key="roadmap.guid">{{ roadmap.title }}</option>
			</select>
			<button class="roadmap positive">Save Roadmap</button>
			<button class="roadmap negative">Delete Roadmap</button>
			<button class="toggle" :class="{ active: editorShown }" @click="editorShown = !editorShown">Toggle Editor</button>
		</div>

		<!-- Operations -->
		<div class="operations">
			<div class="phase operation"><img :src="require('@/assets/icons/phase.svg')" alt="phase icon">Phase</div>
			<div class="section operation"><img :src="require('@/assets/icons/section.svg')" alt="section icon">Section</div>
			<div class="task operation"><img :src="require('@/assets/icons/task.svg')" alt="task icon">Task</div>
			<div class="milestone operation"><img :src="require('@/assets/icons/milestone.svg')" alt="milestone icon">Milestone</div>
		</div>

		<!-- Components -->
		<div class="components" :class="{ active: !editorShown }">
			
		</div>
		<div class="edit-panel" v-if="editorShown">
			
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
			editorShown: false,
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
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	grid-template-rows: 1fr 1fr;
	padding: 10px;
	grid-column-gap: 40px;
	grid-row-gap: 20px;
	grid-auto-flow: row;
}

.roadmap {
	width: 200px;
	display: flex;
	flex-wrap: wrap;
}

.menu button.roadmap {
	height: 40px;
	outline: none;
	border: none;
	background-color: #944e6c;
	font-size: 1rem;
	cursor: pointer;
	display: inline-block;
	text-align: center;
	vertical-align: middle;
	color: #fff;
	grid-column: span 1;
}

.menu button.roadmap:hover {
	background-color: #7c425a;
}

.menu select {
	height: 40px;
	font-size: 1rem;
	border: none;
	background-color: #cc7351;
	color: white;
	outline: none;
	padding-left: 10px;
}

.menu .toggle {
	background-color: white;
	border: 2px #7c425a solid;
	color: #7c425a;
	font-size: 1rem;
	grid-column: span 1;
	width: 200px;
}

.menu .toggle:hover {
	background-color: #eddce3;
}

.menu .toggle.active {
	background-color: black;
	color: white;
}


/*************************Operations*********************/

.operations {
	height: 100%;
	background-color: #f2f2f2;
}

.operations div {
	width: 180px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 30px 20px;
	padding: 0 20px;
	border-radius: 10px;
	background-color: white;
	margin-right: 20px;
}

.operations div img {
	width: 25px;
	height: 25px;
	margin-right: 20px;
}

.operations .phase {
	margin-top: 50px;
	border: 2px solid #153e90;
	color: #153e90;
}

.operations .section {
	border: 2px solid #9f5f80;
	color: #9f5f80;
}

.operations .task {
	border: 2px solid #045762;
	color: #045762;
}

.operations .milestone {
	border: 2px solid #682c0e;
	color: #682c0e;
}

/************************Components**********************/

.components {
	height: 100%;
	grid-column: span 3;
	background-color: #f2f2f2;
	overflow: auto;
}

.components.active {
	grid-column: span 4 !important;
}

/************************Edit Panel**********************/

.edit-panel {
	height: 100%;
	background-color: #f2f2f2;
	grid-column: span 2;
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
	background-color: #42b983 !important;
}

button.positive:hover {
	background-color: #39966a !important;
}

button.negative {
	background-color: #dd3b00 !important;
}

button.negative:hover {
	background-color: #ad2e00 !important;
}

/***********************Media Queries********************/
	
@media(max-width: 1424px) {
	.components {
		grid-column: span 2;
	}
}
@media(max-width: 1150px) {
	.chart-container {
  	grid-template-rows: 100px 400px 600px;
	}
	.menu {
		grid-column: span 4;
	}
	.operations {
		grid-column: span 1;
	}
	.components {
 		grid-column: span 4;
	}
	.edit-panel {
		grid-column: span 3;
	}
}

@media(max-width: 814px) {
	.chart-container {
  	grid-template-columns: repeat(auto-fit, 1fr);
  	grid-template-rows: 200px 400px 600px 600px;
	}
	.menu {
		grid-template-rows: 1fr 1fr 1fr;
		height: auto;
	}
}

@media(max-width: 610px) {
	.chart-container {
  	grid-template-columns: repeat(auto-fit, 1fr);
  	grid-template-rows: 200px 400px 600px 600px;
	}
	.operations {
		grid-column: span 1;
	}
	.edit-panel {
		grid-column: span 1;
	}
}
</style>