<template>
  <li class="block">
  	<div class="block-container">
  		<input type="checkbox" :value="JSON.stringify(block)" v-if="block.code" v-model="isChecked" @change="emitComponent()">
	  	<span v-if="!block.children.length && block.code" class="placeholder"></span>
	  	<span class="sign" v-if="block.children.length && block.code" @click="expand(); toggleSign();">{{ sign }}</span>

	    <span class="block" :class="{ 'highlight-selected': currentComponentSelected, highlight: dragOver, parallelized: block.parallelized, 'checked-highlight': isChecked }" @click="emitSelected()" v-if="block.guid" draggable
	    @dragstart="startDrag($event)" @drop="onDropChild($event)" @dragenter="dragOver=true" @dragleave="dragOver=false" @mouseleave="dragOver=false" :style="{'background-color': `${calcColor}`, width: `${blockWidth}px`}" :key="blockWidth">{{ this.block.code }}
	  		<span class="progress">{{ calculatedProgress }}%</span>
			</span>

  	</div>
  	
    <div class="drop-zone" @drop="onDropSibling($event)" ondragover="this.style.backgroundColor='#f2e721';" onmouseleave="this.style.backgroundColor='#F2F2F2';" ondragleave="this.style.backgroundColor='#F2F2F2';" @click="log()"></div>

    <ul class="sub-blocks" v-if="block.children && block.children.length > 0" v-show="block.expanded">
      <block v-for="(child, index) in block.children" :block="child" :component="currentComponent" :key="index" :achue="acHue" :sehue="seHue" :phhue="phHue" :mlhue="mlHue" :selectedguid="selectedguid"></block>
    </ul>
  </li>
</template>

<script>
import Alea from "alea";

	export default {
	  name: "Block",
	  props: {
	  	block: Object,
	  	component: Object,
	  	achue: Number,
	  	sehue: Number,
	  	phhue: Number,
	  	mlhue: Number,
	  	'selectedguid': String,
	  },
	  data() {
	  	return {
	  		sign: "–",
	  		type: this.block.type,
	  		dragOver: false,
	  		isChecked: false,
	  		// Hue values of component types
	  		acHue: this.achue - 10,
	  		seHue: this.sehue - 10,
	  		phHue: this.phhue - 10,
	  		mlHue: this.mlhue - 10,
	  	};
	  },
	  computed: {
	  	// Derived color of component based on their types
	  	calcColor() {
	  		if (this.block.parallelized) {
	  			const prng = new Alea(this.block.position);
	  			let randomNum = (Math.floor((prng() * 10) * (prng() * 10)));

	  			return `hsl(${this.seHue - randomNum}, 53%, 58%)`;

	  		} else {
	  			switch(this.block.type) {
		  			case "AC": return `hsl(${this.acHue}, 53%, 58%)`; break;
		  			case "SE": return `hsl(${this.seHue}, 53%, 58%)`; break;
		  			case "PH": return `hsl(${this.phHue}, 53%, 58%)`; break;
		  			case "ML": return `hsl(${this.mlHue}, 53%, 58%)`; break;
		  		}
	  		}
	  		
	  	},
			currentComponent() {
				return this.component;
			},
			// Block width changes based on calculated progress and indentation level of the component.
			blockWidth() {
				return (this.block.calculatedProgress * 600 / 100) + 130 + (this.block.indentationLevel * 20);
			},
			calculatedProgress() {
				return Math.round(this.block.calculatedProgress);
			},
			currentComponentSelected() {
				return this.block.guid === this.selectedguid;
			},
	  },
	  methods: {
	    expand() {
	      this.block.expanded = !this.block.expanded;
	    },

	    toggleSign() {
	    	if (this.sign === "+") {
	    		this.sign = "–";
	    	} else {
	    		this.sign = "+";
	    	}
	    },

	    log() {
	    	console.log(this.block);
	    },

	    // emit component check events
	    emitComponent() {
	    	$nuxt.$emit("componentcheck", { checked: this.isChecked, component: this.block });
	    },

	    // emit details of selected component
	    emitSelected() {
	    	$nuxt.$emit("componentselected", this.block);
	    },

	    // Sets the details of the component being dragged
	    startDrag(e) {
	    	e.dataTransfer.dropEffect = "move";
      	e.dataTransfer.effectAllowed = "move";
      	e.dataTransfer.setData("type", this.block.type);
				e.dataTransfer.setData("component", JSON.stringify(this.block));
	    },

	    onDropChild(e) {

	    	// Stop drop event from being handled by parent element
	    	e.stopPropagation();

	    	this.triggerDrop(e, "child");
	    },

 			onDropSibling(e) {
	    	e.stopPropagation();

	    	this.triggerDrop(e, "sibling");
	    },

	    // Function to handle different types of component drops
	    triggerDrop(e, eventTargetType) {

	    	const component = e.dataTransfer.getData("component") ? JSON.parse(e.dataTransfer.getData("component")) : {};
	    	const type = e.dataTransfer.getData("type");
	    	const isNew = e.dataTransfer.getData("isNew");

	    	let newParent;
	    	let newParentGuid;
	    	let newSibling;

	    	if (eventTargetType === "child") {
	    		newParentGuid = this.block.guid;
	    		newParent = this.block;
	    	} else if (eventTargetType === "sibling") {
	    		newParentGuid = this.block.parentGuid;
	    		newParent = null;
	    		newSibling = this.block;
	    		if (!this.block.code) {
	    			eventTargetType = "root";
	    			newParentGuid = "00000000-0000-0000-0000-000000000000";
	    		}
	    	}

	    	// Prevent dropping an item in to itself or its children or its direct parent
				if (component.guid === newParentGuid) {
	    		return;
	    	}

	    	// Prevent dropping Phases and Sections to Actions and Phases to Sections
	    	if (eventTargetType === "child") {
	    		
	    		if (this.block.type === "SE") {
		    		if (type === "PH") {
		    			return;
		    		}
		    	} else if (this.block.type === "AC") {
		    		if (type === "PH" || type === "SE") {
		    			return;
		    		}
		    	}
	    	} else if (eventTargetType === "sibling") {
	    		// Prevent adding components between parallelized sections
					if (this.block.parallelizedPreventChange) {
		    		return;
		    	}
	    	}

	    	const item = {
	    		component,
	    		type,
	    		isNew,
	    		newParent,
	    		newParentGuid,
	    		eventTargetType,
	    		newSibling,
	    	};
	    	$nuxt.$emit("triggerdrop", item);
	    },
	  },
	};

</script>

<style scoped>
	.block-container {
		width: 100%;
		margin: 0;
		padding: 0;
	}

	li .block-container {
	  padding: 0 0 0 0.5rem;
	  margin-bottom: 0;
	  position: relative;
	  left: -10px;
	  /*border-left: 1px solid #d3d3d3;*/
	}

	li .block-container > span.block {
	  padding: 0.2rem 0.5rem;
	  margin-left: 20px;
	  border: 1px solid #d3d3d3;
	  cursor: pointer;
	  display:flex;
	  position: relative;
	  bottom: 4px;
	  width: 130px;
	  z-index: 200;
	  height: 20px;
	  border-radius: 10px;
	  overflow: hidden;
	  justify-content: space-between;
	  color: white;
	}

	li .block-container > span.block:hover {
		width: auto !important;
	}

	ul.sub-blocks {
	  padding: 0;
	  margin: 0 0 0 20px;
	  box-sizing: border-box;
	  width: 80%;
	  list-style: none;
	  border: none;
	}

	.sign, .placeholder {
		width: 10px;
		display: inline-block;
		border: none;
	  padding: 0;
	  position: absolute;
	  bottom: 11px;
	  left: -5px;
	}

	.sign {
		cursor: pointer;
		font-size: 1rem;
	}

	li input {
		position: absolute;
		bottom: 9px;
	}

	.progress {
		color: white;
	}

	.drop-zone {
		width: 100vw;
		height: 8px;
		position: relative;
		bottom: 4px;
		z-index: 200;
		border-radius: 10px;
	}

	.highlight {
		border: 2px solid #f2e721 !important;
	}

	.highlight-selected {
		border: 2px solid #f2e721 !important;
	}

	.parallelized {
		font-style: italic;
		text-decoration: underline;
	}

	.checked-highlight {
		border: 2px solid #00d4ff !important;
	}

</style>