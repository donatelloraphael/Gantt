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
        @dragstart="startDrag($event)"><img :src="require('@/assets/icons/task.svg')" alt="task icon">Action</div>
        <!-- TODO --> <!--Drag disabled on Milestone -->
			<div class="milestone operation"><img :src="require('@/assets/icons/milestone.svg')" alt="milestone icon">Milestone</div>
		</div>

		<!-- Components -->

		<div class="components" :class="{ active: !editorShown }">
			<div class="heading">
				<div class="title">
					<h2>{{ roadmap.title }}</h2>
					<h3>{{ roadmap.description }}</h3>
				</div>
				<div class="duration">
					<h2>15m / 30m</h2>
				</div>
			</div>

			<div class="graph-container"  v-if="!componentsPanelDisabled" @drop="onDropEmpty($event)" @dragover.prevent @dragenter.prevent>

				<ul class="blocks">
				  <Block :block="components" :key="refreshGraph"></Block>
				</ul>
			</div>
		</div>

		<!-- Edit Panel -->

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
			roadmap: { title: "Roadmap", description: "Roadmap details", components: []},
			roadmapChanged: 0,
			refreshGraph: 0,
			createRoadmapDialog: false,
			roadmapTitle: "",
			roadmapDescription: "",
			editorShown: false,
			components: { expanded: true, children: [] },
			currentComponent: {},
			componentsPanelDisabled: true,
		};
	},
	components: {
		Block,
	},
	watch: {
		roadmapChanged() {
			this.components = this.transformComponents(this.roadmap.components);
			this.refreshGraph++;
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

		getRoadmap(guid) {
			// clears state
			if (!guid) {
				this.roadmap.title = "Roadmap Title";
				this.roadmap.description = "Roadmap Description";
				this.roadmap.guid = "";
				this.components = { expanded: true, children: [] };
				this.componentsPanelDisabled = true;
				return;
			} else {
				this.componentsPanelDisabled = false;
			}

			this.$axios.$get(`/api/roadmaps/${guid}`)
			.then((result) => {
				this.roadmap = result;
				this.roadmapChanged++;
			}).catch(err => console.log(err));
		},
		// Converts the components array of roadmap object got from API to form that can be rendered recursively.
		transformComponents(components) {
			console.log(components);

			// Add the children array containing guids to components
			(function addChildren () {

				// populate the children array of each component with guid of its children
				for (let i = 0, m = components.length; i < m; i++) {
					if (!components[i].children) {
						components[i].children = [];
					} else {
						components[i].children.length = 0;
					}
					for (let j = 0; j < m; j++) {
						if (components[i].parentGuid === components[j].guid) {
							components[j].children.push(components[i].guid);
						}
					}
				}
			})();

			const transformedComponents = { expanded: true };

			// Filters out the non-root components
			transformedComponents.children = components.filter((item) => {
				return !item.parentGuid || item.parentGuid === "00000000-0000-0000-0000-000000000000";
			});

			// Sorts the top level components by position value
			transformedComponents.children = sortByPosition(transformedComponents.children);

			// Iterates and calls populateChildren function on top-level components
			for (let i = 0; i < transformedComponents.children.length; i++) {
				transformedComponents.children[i].expanded = true;
				populateChildren(transformedComponents.children[i]);
			}

			// Recursive function to replace guid of children of components array with whole objects
			function populateChildren(component) {
				for (let i = 0, m = component.children.length; i < m; i++) {
					for (let j = 0, n = components.length; j < n; j++) {
						// Match object in components and replace the guid with it
						if (components[j].guid === component.children[i]) {
							component.children[i] = components[j];
							if (component.children[i].children.length > 0) {
								component.children[i].expanded = true;
								populateChildren(component.children[i]);
							}
						}
					}
				}
				component.children = sortByPosition(component.children);
			}

			// Sort elements by position value
			function sortByPosition(array) {
				return array.sort((a, b) => a.position - b.position);
			}

			return transformedComponents;
		},

		// On starting dragging items from operations panel
		startDrag(e) {
			e.dataTransfer.dropEffect = "copy";
      e.dataTransfer.effectAllowed = "copy";

      let type;
			switch(e.target.innerText) {
				case "Phase": type = "PH"; break;
				case "Section": type = "SE"; break;
				case "Action": type = "AC"; break;
				case "Milestone": type = "ML"; break;
			}
      e.dataTransfer.setData("type", type);
      e.dataTransfer.setData("isnew", true);
		},
		// Dropping items in to a top level empty space
		onDropEmpty(e) {
			const type = e.dataTransfer.getData("type");
			const isNew = e.dataTransfer.getData("isNew");

			if (!type) return;

			const components = this.roadmap.components;

			// If it's a new component
			if (isNew) {
				
				const newPosition = this.findEndPosition(components) + 1;
				this.addNewComponent(components, type, newPosition);

			} else {

				const component = JSON.parse(e.dataTransfer.getData("component"));

				// Move endpoint index starts from 1
				const newPosition = this.findEndPosition(components) + 1;

				for (let i = 0, length = components.length; i < length; i++) {
					if (components[i].guid === component.guid) {
						components[i].position = newPosition;
						this.saveMove([components[i].guid], newPosition, "00000000-0000-0000-0000-000000000000");
					} else {
						components[i].position--;
					}
				}
				this.roadmapChanged++;
			}
		},

		onDropChild(item) {
			console.log(item);

			if (!item.type) return;

			const components = this.roadmap.components;

			if (item.isNew) {
				this.addNewComponent(components, item.type, item.position, item.parentGuid);
			}
		},
		onDropSibling(item) {
			console.log(item);

			if (!item.type) return;
		},

		async addNewComponent(components, type, newPosition, parentGuid = "00000000-0000-0000-0000-000000000000") {
			let typeLong;
			switch(type) {
				case "PH": typeLong = "Phase"; break;
				case "SE": typeLong = "Section"; break;
				case "AC": typeLong = "Action"; break;
				case "ML": typeLong = "Milestone"; break;
			}

			const newComponent = { 
				type, 
				typeLong,
				parentGuid,
				guid: undefined,
				children: [],
				code: "New " + typeLong,
				description: "",
				position: newPosition,
				roadmapGuid: this.roadmap.guid,
				expanded: true,
			};

			console.log("NEW ", newComponent);
			// Saves created component to backend and updates local copy of the component
			const createdComponentGuid = await this.$axios.$post(`/api/roadmaps/${this.roadmap.guid}/${newComponent.typeLong}s`, newComponent)
			.catch(err => console.log(err));

			newComponent.guid = createdComponentGuid;
			components.push(newComponent);

			this.currentComponent = Object.create(newComponent);
			this.roadmapChanged++;
		},

		findEndPosition(array) {
			let newPosition = 0;
			for (let i = 0, length = array.length; i < length; i++) {
				if (array[i].position > newPosition) {
					newPosition = array[i].position;
				}
			}
			return newPosition;
		},

		saveMove(items, newPosition, newParentGuid ) {
			const body = {
				roadmapGuid: this.roadmap.guid,
				items,
				newParentGuid,
				index: newPosition
			};

			this.$axios.$put(`/api/roadmaps/${body.roadmapGuid}/Move`, body)
			.catch(err => console.log(err));
		},
		log() {
			console.log("HERE");
		}


	},
	async fetch() {
		// Get list of roadmaps
		this.roadmaps = await this.$axios.$get("/api/roadmaps")
		.catch(err => console.log(err));
	},

	mounted() {
		this.$nuxt.$on("dropchild", item => {
			this.onDropChild(item);
    });
    this.$nuxt.$on("dropsibling", item => {
    	this.onDropSibling(item);
    });
	},
	beforeDestroy() {
    this.$nuxt.$off("dropchild");
    this.$nuxt.$off("dropsibling");
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
	margin-left: 0.8rem;
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
  padding: 0.3rem 0 0 0;
  border: none;
}

#top-drop-zone {
	background-color: red;
	height: 100px;
	width: 100px;
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
	z-index: 500;
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
	z-index: 600;
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