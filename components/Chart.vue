<template>
	<div class="chart-container">

		<!-- Menu -->

		<div class="menu">
			<button class="roadmap" @click="createRoadmapDialog = true">New Roadmap</button>
			<select class="roadmap" name="roadmap-select" id="roadmap-select" @change="getRoadmap($event.target.value)">
				<option value="">Select a roadmap</option>
				<option :value="roadmap.guid" v-for="roadmap in roadmaps" :key="roadmap.guid">{{ roadmap.title }}</option>
			</select>
			<button id="button-parallelize" :disabled="!parallelizeAvailable" @click="parallelize()">Parallelize</button>
			<button class="toggle" :class="{ active: editorShown }" @click="editorShown = !editorShown">Edit</button>
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
					<h2>{{ Math.round(averageProgress) }}% Complete</h2>
				</div>
			</div>

			<div class="graph-container"  v-if="!componentsPanelDisabled" @drop="onDropEmpty($event)" @dragover.prevent @dragenter.prevent>

				<ul class="blocks">
				  <Block :block="components" :component="currentComponent" :key="refreshGraph" :achue="acHue" :sehue="seHue" :phhue="phHue" :mlhue="mlHue"></Block>
				</ul>
			</div>
		</div>

		<!-- Edit Panel -->

		<div class="edit-panel" v-if="editorShown">

			<div class="edit-name">
				<h2>{{ currentComponent.code }}</h2>
			</div>

			<p v-if="errors.length">
		    <b>Please correct the following error(s):</b>
		    <ul class="errors">
		      <li v-for="error in errors">{{ error }}</li>
		    </ul>
		  </p>

			<div class="edit-body">
				<label for="name-edit">Name: </label>
				<input type="text" name="name-edit" id="name-edit" v-model="currentComponent.code">

				<label for="description-edit">Description: </label>
				<input type="text" name="description-edit" id="description-edit" v-model="currentComponent.description">

				<label for="status-edit">Status: </label>
				<select name="status-edit" id="status-edit" disabled>
					<option value="Created">Created</option>
					<option value="ReadyToStart">ReadyToStart</option>
					<option value="Started">Started</option>
					<option value="Paused">Paused</option>
					<option value="Ended">Ended</option>
					<option value="Cancelled">Cancelled</option>
					<option value="Error">Error</option>
				</select>

				<div v-if="currentComponent.type === 'AC'">
					<label for="date-edit">Start Date and Time: </label>
					<input disabled type="date" name="date-edit" id="date-edit" v-model="currentComponent.startDate">
					<input disabled type="time" name="time-edit" id="time-edit" step="2" v-model="currentComponent.startTime">

					<label for="estimated-days" class="estimated-duration">Estimated Duration: </label>
					<input disabled type="number" name="estimated-days" class="estimated-duration" placeholder="Days" min="0" v-model="currentComponent.estDays">
					<input disabled type="number" name="estimated-hours" class="estimated-duration" placeholder="Hours" min="0" v-model="currentComponent.estHours">
					<input disabled type="number" name="estimated-minutes" class="estimated-duration" placeholder="Minutes" min="0" v-model="currentComponent.estMinutes">

					<label for="progress">Progress: </label>
					<input disabled type="number" min="0" max="100" name="progress" id="progress" v-model="currentComponent.progress">
				</div>

				<button id="save" @click="validateAndSave()">Save</button>

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
import Vue from "vue";
import Block from "./Block";

const PROGRESS_TEST = true;

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
			currentComponent: { code: "Edit"},
			componentsPanelDisabled: true,
			checkedComponents: [],
			errors: [],
			parallelizeAvailable: false,
			checkedChanged: 0,
			componentLengthFactor: 1,
			averageProgress: 0,
			acHue: 258,
			seHue: 39,
			phHue: 199,
			mlHue: 100,
		};
	},
	components: {
		Block,
	},
	watch: {
		// Transform roadmap components in to a recursive-able form
		roadmapChanged() {
			if (PROGRESS_TEST) {
				this.setTestData(this.roadmap.components);
			}
			this.components = this.transformComponents(this.roadmap.components);
			this.components.children = this.handleProgress(this.components.children);

			this.refreshGraph++;
		},

		// Set the state of parallelizeAvailable when there is a change in checked items
		checkedChanged() {
			let length = this.checkedComponents.length;

			if (length > 1) {
				for (let i = 0; i < length - 1; i++) {
					if (this.checkedComponents[i].type !== "SE") {
						this.parallelizeAvailable = false;
						return;
					}
					if (this.checkedComponents[i].parentGuid !== this.checkedComponents[i+1].parentGuid) {
						this.parallelizeAvailable = false;
						return;
					}
				}
				this.parallelizeAvailable = true;
			} else {
				this.parallelizeAvailable = false;
			}
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
				this.getRoadmap(newRoadmap.guid);
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
			// Add the children array containing guids to components
			(function addChildren () {

				// populate the children array of each component with guid of its children
				for (let i = 0, m = components.length; i < m; i++) {
					components[i].children = [];
							
					for (let j = 0; j < m; j++) {
						if (components[j].parentGuid === components[i].guid) {
							components[i].children.push(components[j].guid);
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
			let indentationLevel; // Descending order
			for (let i = 0; i < transformedComponents.children.length; i++) {
				transformedComponents.children[i].expanded = true;
				indentationLevel = 0;
				if (!transformedComponents.children[i].children.length) {
					indentationLevel = -1; // Need -1 to get 0 in components that have no children
				}
				// transformedComponents.children[i].indentationLevel = indentationLevel;
				populateChildren(transformedComponents.children[i]);
			}

			// Recursive function to replace guid of children of components array with whole objects
			function populateChildren(component) {
				for (let i = 0, m = component.children.length; i < m; i++) {
					for (let j = 0, n = components.length; j < n; j++) {
						// Match object in components and replace the guid with it
						if (components[j].guid === component.children[i]) {

							component.children[i] = components[j]; // Replace guid with object

							if (component.children[i].children.length > 0) {
								component.children[i].expanded = true;
								populateChildren(component.children[i]);
								component.children[i].indentationLevel = ++indentationLevel;
							} else {
								if (indentationLevel > 0) indentationLevel--; // Need this to prevent off by 1 error
								component.children[i].indentationLevel = indentationLevel;
							}
						}
					}
				}
				component.indentationLevel = indentationLevel + 1;
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
			const newParent = { guid: "00000000-0000-0000-0000-000000000000" };

			if (!type) return;

			const components = this.roadmap.components;

			// If it's a new component
			if (isNew) {
				
				const newPosition = this.findEndPosition(components) + 1;
				this.addNewComponent(type, newPosition, newParent);

			} else {

				const component = JSON.parse(e.dataTransfer.getData("component"));

				// Move endpoint index starts from 1
				const newPosition = this.findEndPosition(components) + 1;

				this.moveComponents([component.guid], newPosition, "00000000-0000-0000-0000-000000000000");
			}
		},

		// On triggering a drop event as a child or sibling
		onDropEvent(item) {
			if (!item.type) return;

			const components = this.roadmap.components;

			// newParent is null if eventTargetType is 'sibling'
			let newParent = item.newParent; 

    	// Prevent dropping Phases and Sections to Actions and Phases to Sections
			if (item.eventTargetType === "sibling") {
				for (let i = 0, length = components.length; i < length; i++) {
					if (components[i].guid === item.newParentGuid) {

						// Sets newParent if event is a sibling drop
						newParent = components[i];

						if (item.type === "SE") {
			    		if (components[i].type === "AC") {
			    			return;
			    		}
			    	} else if (item.type === "PH") {
			    		if (components[i].type === "SE" || components[i].type === "AC") {
			    			return;
			    		}
			    	}
					}
				}
			}

			if (item.isNew) {

				const	position = 0;

				this.addNewComponent(item.type, position, newParent, item.eventTargetType);

			} else {

				let newPosition;

				if (item.eventTargetType === "child") {

					const childrenInParent = this.findNumItemsInNode(newParent);
					newPosition = newParent.position + childrenInParent;

				} else if (item.eventTargetType === "sibling") {
					newPosition = item.newSibling.position + 1;
				} else {
					newPosition = 0;
				}

				this.moveComponents([item.component.guid], newPosition, item.newParentGuid);
			}
		},

		// Create and save a new component
		async addNewComponent(type, newPosition, newParent, eventTargetType = "child") {
			let typeLong;
			switch(type) {
				case "PH": typeLong = "Phase"; break;
				case "SE": typeLong = "Section"; break;
				case "AC": typeLong = "Action"; break;
				case "ML": typeLong = "Milestone"; break;
			}

			const newParentGuid = newParent ? newParent.guid : "00000000-0000-0000-0000-000000000000";

			const newComponent = { 
				type, 
				typeLong,
				parentGuid: newParentGuid,
				guid: undefined,
				children: [],
				code: "New " + typeLong,
				description: "",
				position: newPosition,
				roadmapGuid: this.roadmap.guid,
				expanded: true,
			};

			if (type === "AC") {
				newComponent.dependencies = [];
				newComponent.startDateTime = null;
				newComponent.estimatedDuration = 0;
				newComponent.status = "Created";
				newComponent.progress = 0;
			}

			// Saves created component to backend and updates local copy of the component
			const createdComponentGuid = await this.$axios.$post(`/api/roadmaps/${this.roadmap.guid}/${newComponent.typeLong}s`, newComponent)
			.catch(err => console.log(err));

			newComponent.guid = createdComponentGuid;
			this.currentComponent = Object.create(newComponent);
			this.editorShown = true;
			this.errors = [];

			this.getRoadmap(this.roadmap.guid);

			// Needs to implement API to add dependencies of acions without requiring unnecessary data

			// if (type === "AC" && newParent.type === "AC" && eventTargetType === "child") {
			// 	let parentComponent = {
			// 		guid: newParent.guid,
			// 		roadmapGuid: this.roadmap.guid,
			// 		dependencies: [newComponent.guid],
			// 	};

			// 	this.$axios.$put(`/api/roadmaps/${this.roadmap.guid}/Actions/${newParent.guid}`, parentComponent)
			// 	.then((response) => console.log(response))
			// 	.catch(err => console.log(err));
			// }
		},

		// Finds the highest position of the array
		findEndPosition(array) {
			let endPosition = 0;
			for (let i = 0, length = array.length; i < length; i++) {
				if (array[i].position > endPosition) {
					endPosition = array[i].position;
				}
			}
			return endPosition;
		},

		// Recursively find the number of items in a node
		findNumItemsInNode(node, numItems = 0) {
			numItems++;

			for (let i = 0, length = node.children.length; i < length; i++) {
				numItems = this.findNumItemsInNode(node.children[i], numItems);
			}
			return numItems;
		},

		// Moves components to a new position
		moveComponents(items, newPosition, newParentGuid ) {
			const body = {
				roadmapGuid: this.roadmap.guid,
				items,
				newParentGuid,
				index: newPosition
			};

			this.$axios.$put(`/api/roadmaps/${body.roadmapGuid}/Move`, body)
			.then(() => this.getRoadmap(this.roadmap.guid))
			.catch(err => console.log(err));
		},

		// Maintains an array of checked components
		populateChecked(item) {
			if (item.checked) {
				for (let i = 0, length = this.checkedComponents.length; i < length; i++) {
					if (this.checkedComponents[i].guid === item.component.guid) {
						return;
					}
				}
				this.checkedComponents.push(item.component);
				this.checkedChanged++;
				this.currentComponent = Object.create(item.component);
				this.editorShown = true;
				this.errors = [];

			} else {
				for (let i = 0, length = this.checkedComponents.length; i < length; i++) {
					if (this.checkedComponents[i].guid === item.component.guid) {
						this.checkedComponents.splice(i, 1);
						this.checkedChanged++;
						this.currentComponent = { code: "Edit" };
						this.editorShown = false;
						this.errors = [];
						return;
					}
				}
			}
		},

		parallelize() {
			const sectionsGuid = [];

			for (let i = 0, length = this.checkedComponents.length; i < length; i++) {
				sectionsGuid.push(this.checkedComponents[i].guid);
			}

			this.$axios.$post(`/api/roadmaps/${this.roadmap.guid}/Sections/Parallelize`, {
				roadmapGuid: this.roadmap.guid,
				sectionsGuid,
				ordering: 0,
			}).then(() => this.getRoadmap(this.roadmap.guid))
			.catch(err => console.log(err));

		},

		// Validates the edit panel input and saves it.
		validateAndSave() {
			this.errors = [];

			if (!this.currentComponent.code) {
				this.errors.push("A name is required.");
			}
			if (this.currentComponent.estDays < 0 || this.currentComponent.estHours < 0 || this.currentComponent.estMinutes < 0) {
				this.errors.push("Invalid estimated duration.");
			}
			if (this.currentComponent.progress < 0 || this.currentComponent.progress > 100) {
				this.errors.push("Invalid progress value.");
			}

			if (!this.errors.length) {
				this.updateComponent(this.currentComponent);
			}
			this.editorShown = false;
		},

		updateComponent(component) {
			let typeLong;

			switch(component.type) {
				case "PH": typeLong = "Phase"; break;
				case "SE": typeLong = "Section"; break;
				case "AC": typeLong = "Action"; break;
				case "ML": typeLong = "Milestone"; break;
			}

			if (component.type === "AC") {
				component = this.transformComponentForSaving(component);
			}

			let updateComponent = {};
			if (component.type === "PH" || component.type === "SE" || component.type === "ML") {
				updateComponent.code = component.code;
				updateComponent.description = component.description;
				updateComponent.roadmapGuid = this.roadmap.guid;
				updateComponent.guid = component.guid;
				updateComponent.parentGuid = component.parentGuid;
			} else {
				updateComponent = component;
				updateComponent.roadmapGuid = this.roadmap.guid;
			}

			console.log(updateComponent);

			this.$axios.$put(`/api/roadmaps/${this.roadmap.guid}/${typeLong}s/${component.guid}`, updateComponent)
			.then(() => this.getRoadmap(this.roadmap.guid))
			.catch(err => console.log(err));
		},

		transformComponentForSaving(component) {
			const NUM_MINUTES_IN_DAY = 1440;

			let hours = 0, minutes = 0, seconds = 0;

			let [year, month, date]  = component.startDate ? component.startDate.split("-") : [0, 0, 0];
			[hours, minutes, seconds] = component.startTime ? component.startTime.split(":") : [0, 0, 0];

			if (month < 1 ) {
				month = 0;
			} else {
				month -= 1;
			}

			const newDate = new Date(year, month, date, hours, minutes, seconds);

			if (year && month && date) {
				component.startDateTime = newDate.getTime();
			}

			if (this.currentComponent.estDays || this.currentComponent.estHours || this.currentComponent.estMinutes) {
				component.estimatedDuration = this.currentComponent.estDays * NUM_MINUTES_IN_DAY + this.currentComponent.estHours * 60 + parseInt(this.currentComponent.estMinutes);
			}

			component.progress = parseInt(component.progress);
			return component;
		},

		// Set mock data for progress demo ////////////////////////////////
		setTestData(components) {

			for (let i = 0, length = components.length; i < length; i++) {
				if (components[i].type === "AC" && PROGRESS_TEST) {
					components[i].startDateTime = Date.now();
					components[i].estimatedDuration = (Math.ceil(Math.random() * 5)) + 1;
					components[i].progress = 0;
				}
			}
		},

		handleProgress(components) {
			let cumulativeProgress = 0;
			let numOfComponents = 0;

			for (let i = 0, length = components.length; i < length; i++) {

				components[i].calculatedProgress = 0;
				components[i].progress = 0;

				let calculatedProgress = 0, actualProgress = 0;

				[ calculatedProgress, actualProgress ] = refreshProgress(components[i]);

				let numChildren = components[i].children ? components[i].children.length : 1;
				if (numChildren === 0) {
					numChildren = 1;
				}

				components[i].calculatedProgress = calculatedProgress / numChildren;
				components[i].progress = actualProgress / numChildren;
				cumulativeProgress += components[i].calculatedProgress;
				if(components[i].calculatedProgress) {
					numOfComponents++;
				}
			}
			if (numOfComponents === 0) {
				numOfComponents = 1;
			}
			this.averageProgress = cumulativeProgress / numOfComponents;

			function refreshProgress(component) {

				let numChildren;
				let calculatedSum = 0, actualSum = 0;
				if (component.children && component.children.length) {
					for (let i = 0, length = component.children.length; i < length; i++) {
						let [ calculatedProgress, actualProgress ] = refreshProgress(component.children[i]);
						numChildren = component.children ? component.children.length : 1;
						if (numChildren === 0) {
							numChildren = 1;
						}

						calculatedSum += calculatedProgress;
						actualSum += actualProgress;

						let actionCalculatedProgress = 0;
						let actionActualProgress = component.progress || 0;

						if (component.type === "AC") {
							
							let estimatedDuration = component.estimatedDuration * 60 * 1000;

							let timeElapsed = Date.now() - component.startDateTime;

				  		if (timeElapsed >= estimatedDuration) {
				  			actionCalculatedProgress = 100;
				  		} else {
				  			actionCalculatedProgress = Math.round(timeElapsed / estimatedDuration * 100);
				  		}

				  		// Test data for progress visualization
				  		if (PROGRESS_TEST) {
				  			actionActualProgress = Math.round(actionCalculatedProgress / 2);
				  		}

							numChildren++;
							calculatedSum += actionCalculatedProgress;
							actualSum += actionActualProgress;
						}						
					}
					component.calculatedProgress = Math.round(calculatedSum / numChildren);
					component.progress = Math.round(actualSum / numChildren);

				} else if (component.type === "AC") {

					let calculatedProgress = 0;
					let actualProgress = component.progress || 0;
					let estimatedDuration = component.estimatedDuration * 60 * 1000;

					let timeElapsed = Date.now() - component.startDateTime;

		  		if (timeElapsed >= estimatedDuration) {
		  			calculatedProgress = 100;
		  		} else {
		  			calculatedProgress = Math.round(timeElapsed / estimatedDuration * 100);
		  		}

		  		// Test data for progress visualization
		  		if (PROGRESS_TEST) {
		  			actualProgress = Math.round(calculatedProgress / 2);
		  		}

					component.calculatedProgress = calculatedProgress;
					component.progress = actualProgress;
				}
				return [component.calculatedProgress, component.progress];
			}
			return components;
		}
	},

	async fetch() {
		// Get list of roadmaps
		this.roadmaps = await this.$axios.$get("/api/roadmaps")
		.catch(err => console.log(err));
	},

	mounted() {
		this.$nuxt.$on("triggerdrop", item => {
			this.onDropEvent(item);
    });

    this.$nuxt.$on("componentcheck", item => {
    	console.log("CHECKED", this.checkedComponents);
    	this.populateChecked(item);
    });

    let progressInterval = setInterval(() => {
    	this.components.children = this.handleProgress(this.components.children);
    }, 500);
	},

	beforeDestroy() {
		// clearInterval(progressInterval);

    this.$nuxt.$off("triggerdrop");
    this.$nuxt.$off("componentcheck");
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
  grid-gap: 1rem 0.5rem;
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
	background-color: #d15788;
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
	background-color: #e57952;
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

#button-parallelize {
	background-color: #8c91ff;
	width: 200px;
	color: white;
	cursor: pointer;
	font-size: 1rem;
}

#button-parallelize:disabled {
	background-color: grey;
	cursor: default;
}

.menu .toggle {
	background-color: white;
	border: 2px #1082ed solid;
	color: #1082ed;
	font-size: 1rem;
	grid-column: span 1;
	width: 200px;
}

.menu .toggle:hover {
	background-color: #b6d7ea;
}

.menu .toggle.active {
	background-color: #1082ed;
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
	border: 2px solid hsl(199, 53%, 58%);
	color: hsl(199, 53%, 58%);
}

.operations .section {
	border: 2px solid hsl(39, 53%, 58%);
	color: hsl(39, 53%, 58%);
}

.operations .task {
	border: 2px solid hsl(258, 53%, 58%);
	color: hsl(258, 53%, 58%);
}

.operations .milestone {
	border: 2px solid hsl(100, 53%, 58%);
	color: hsl(100, 53%, 58%);
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
	width: 120vw;
	background-color: #ffa600;
	text-align: left;
	padding: 10px 0 10px 15px;
	color: white;
	display: flex;
	align-items: center;
}

.components h2 {
	font-size: 1.4rem;
	margin: 0 10px 10px 10px;
}

.duration h2 {
	position: relative;
	margin-left: 450px;
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
	min-height: 100%;
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

ul.blocks {
	margin-bottom: 50px;
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
	overflow: auto;
}

.edit-name {
	font-size: 1rem;
	padding: 13px 0 14px 15px;
	background-color: #1082ed;
	color: white;
}

.edit-body {
	padding: 10px;
	display: flex;
	justify-content: left;
	flex-wrap: wrap;
}

.edit-body label {
	width: auto;
	display: inline-block;
	text-align: left;
	margin: 20px 20px 10px 0;
}

.edit-body #name-edit, #description-edit {
	width: 100%;
	height: 20px;
	border-radius: 5px;
	outline: none;
	border: 1px solid grey;
}

.edit-body select {
	height: 25px;
	width: 150px;
	margin-top: 20px;
	border-radius: 5px;
	outline: none;
	border: 1px solid grey;
	-webkit-appearance: none;
 	-moz-appearance: none;
 	appearance: none;
 	background-image: url("~assets/icons/arrow-down.svg");
 	background-repeat: no-repeat;
 	background-position: right center;
 	background-size: 12px;
}

.edit-body select + label {
	display: block;
	width: 100%;
}

#time-edit {
	margin-left: 5px;
}

label.estimated-duration {
	width: 100%;
	display: block;
}
.edit-body input.estimated-duration {
	width: 60px;
	margin-right: 5px;
	height: 20px;
}

#progress {
	height: 20px;
	width: 100px;
	margin-top: 20px;
}

#save {
	display: block;
	width: 100%;
	border-radius: 10px;
	margin-top: 20px;
	background-color: #1082ed;
	color: white;
	height: 40px;
	font-size: 1.2rem;
}

#save:hover {
	background-color: #1068ba;
}

.errors li {
	color: red;
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