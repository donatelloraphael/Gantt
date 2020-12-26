<template>
	<div class="chart-container">

		<!-- Menu -->

		<div class="menu">
			<button class="roadmap" @click="createRoadmapDialog = true">New Roadmap</button>
			<select class="roadmap" name="roadmap-select" id="roadmap-select" @change="getRoadmap($event.target.value)">
				<option value="">Select a roadmap</option>
				<option :value="roadmap.guid" v-for="roadmap in roadmaps" :key="roadmap.guid">{{ roadmap.title }}</option>
			</select>
			<!-- <button class="roadmap positive">Save Roadmap</button> -->
			<button class="roadmap negative">Delete Roadmap</button>
			<button class="toggle" :class="{ active: editorShown }" @click="editorShown = !editorShown">Toggle Editor</button>
		</div>

		<!-- Operations -->

		<div class="operations">
			<div class="phase operation" draggable
        @dragstart="startDrag($event)"><img :src="require('@/assets/icons/phase.svg')" alt="phase icon">Phase</div>
			<div class="section operation" draggable
        @dragstart="startDrag($event)"><img :src="require('@/assets/icons/section.svg')" alt="section icon">Section</div>
			<div class="task operation" draggable
        @dragstart="startDrag($event)"><img :src="require('@/assets/icons/task.svg')" alt="task icon">Task</div>
			<div class="milestone operation" draggable
        @dragstart="startDrag($event)"><img :src="require('@/assets/icons/milestone.svg')" alt="milestone icon">Milestone</div>
		</div>

		<!-- Components -->

		<div class="components"  v-if="!componentsPanelDisabled" :class="{ active: !editorShown }" @drop="onDrop($event)" @dragover.prevent @dragenter.prevent>
			<div class="heading">
				<div class="title">
					<h2>Roadmap name</h2>
					<h3>Roadmap description</h3>
				</div>
				<div class="duration">
					<h2>15m / 30m</h2>
				</div>
			</div>

			<div class="graph-container">
				<!-- <div class="bar" v-for="item in components">
					<div class="progress-estimate"></div>
					<span>{{ item.type }}</span>
				</div> -->

				<ul class="blocks">
				  <Block v-if="components.dependencies":block="components"></Block>
				</ul>
			</div>
			
			
		</div>
		<div class="edit-panel" v-if="editorShown">
			<div class="edit-name">
				<h2>Phase #1</h2>
			</div>
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
import Block from "./Block";
	
export default {
	name: "Chart",
	data() {
		return {
			roadmaps: [],
			roadmap: {},
			createRoadmapDialog: false,
			roadmapTitle: "",
			roadmapDescription: "",
			editorShown: false,
			components: {},
			currentComponent: {},
			componentsPanelDisabled: true,
		};
	},
	components: {
		Block,
	},
	watch: {
		components() {
			console.log(this.components);
			// this.drawGraph();
		},	
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
		startDrag(e) {
			e.dataTransfer.dropEffect = "copy";
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.setData("type", e.target.innerText);
		},
		onDrop(e) {
			const typeLong = e.dataTransfer.getData("type");
			
			let type;
			switch(typeLong) {
				case "Phase": type = "PH"; break;
				case "Section": type = "SE"; break;
				case "Task": type = "AC"; break;
				case "Milestone": type = "ML"; break;
			}

			if (!this.components.dependencies) {
				this.components.dependencies = [];
			}

			const components = this.components.dependencies;
			// let order = 0;
			// console.log(components)
			// for (let i = components.length - 1; i >= 0; i--) {
			// 	if (!components[i].parentGuid || components[i].parentGuid === "00000000-0000-0000-0000-000000000000") {
			// 		order = components[i].order + 1;
			// 		break;
			// 	}
			// }

			this.currentComponent = { 
				type, 
				typeLong,
				dependencies: [],
				estimatedDuration: 0,
				code: "New " + typeLong,
				description: "",
				order: components.length,
				absoluteIndex: components.length,
				status: "created",
				progress: 0,
				roadmapGuid: this.roadmap.guid,
				parentGuid: "00000000-0000-0000-0000-000000000000",
				startDateTime: "",
				leaf: true,
				expanded: false,
			};
			
			const index = this.components.dependencies.push(this.currentComponent);
			console.log(this.components.dependencies);
		},
		drawGraph() {

		},
		getRoadmap(guid) {
			if (!guid) {
				this.roadmap.title = "";
				this.roadmap.description = "";
				this.roadmap.guid = "";
				this.components = [];
				this.componentsPanelDisabled = true;
				return;
			} else {
				this.componentsPanelDisabled = false;
			}

			this.$axios.$get(`/api/roadmaps/${guid}`)
			.then((result) => {
				this.roadmap.title = result.title;
				this.roadmap.description = result.description;
				this.roadmap.guid = result.guid;

				this.transformComponents(result.components);
			}).catch(err => console.log(err));
		},
		// Converts the components array of roadmap object got from API to form that can be rendered recursively.
		transformComponents(components) {

			const transformedComponents = { expanded: true };
			transformedComponents.dependencies = components.filter((item) => {
				return !item.parentGuid || item.parentGuid === "00000000-0000-0000-0000-000000000000";
			});

			// Deals with top-level components
			for (let i = 0; i < transformedComponents.dependencies.length; i++) {
				transformedComponents.dependencies[i].expanded = true;
				populateDependencies(transformedComponents.dependencies[i]);
			}

			// Recursive function to replace guid of dependencies of components array with whole objects
			function populateDependencies(component) {
				for (let i = 0; i < component.dependencies.length; i++) {
					for (let j = 0; j < components.length; j++) {
						// Match object in components and replace the guid with it
						if (components[j].guid === component.dependencies[i]) {
							component.dependencies[i] = components[j];
							if (component.dependencies[i].dependencies.length > 0) {
								component.dependencies[i].expanded = true;
								populateDependencies(component.dependencies[i]);
							}
						}
					}
				}
				// Sort dependencies by the order value
				component.dependencies = component.dependencies.sort((a, b) => a.order - b.order);
			}
			this.components = transformedComponents;
		},

	},
	async fetch() {
		// Get list of roadmaps
		this.roadmaps = await this.$axios.$get("/api/roadmaps")
		.catch(err => console.log(err));
	},
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
	grid-column: span 6;
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
	padding-right: 10px;
	-webkit-appearance: none;
 	-moz-appearance: none;
 	appearance: none;
 	background-image: url("~assets/icons/arrow-down.svg");
 	background-repeat: no-repeat;
 	background-position: right center;
 	background-size: 12px;
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
	grid-column: span 5 !important;
}

.components .heading {
	width: 70rem;
	background-color: #2e3192;
	text-align: left;
	padding: 10px 0 10px 15px;
	color: white;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.components h2 {
	font-size: 1.4rem;
	margin: 0 10px 10px 10px;
}

.components h3 {
	font-size: 1.1rem;
	margin-top: 0;
}

.components .duration {
	margin-right: 20px;
}

.components .graph-container {
	height: 100%;
	width: 100%;
	position: relative;
	display: flex;
	justify-content: space-between;
}

/***********Component Blocks************/
.bar span {
	z-index: 150;
}

.progress-estimate {
	width: 70%;
	height: 100%;
	position: absolute;
	left: 0;
	background-color: rgba(255, 0, 0, 0.5);
	padding-left: 10px;
}

ul.blocks {
	list-style: none;
	text-align: left;
	margin: 0px;
	padding: 0px;
	border: none !important;
}

ul.blocks > li:first-child {
  padding: 1rem 1rem 1rem 0;
  border: none;
}


/************************Edit Panel**********************/

.edit-panel {
	height: 100%;
	background-color: #f2f2f2;
	grid-column: span 2;
}

.edit-name {
	font-size: 1rem;
	padding: 13px 0 14px 15px;
	background-color: black;
	color: white;
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
	.edit-panel {
		grid-column: span 3;
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