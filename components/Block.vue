<template>
  <li class="block">
  	<input type="checkbox" :value="JSON.stringify(block)" v-if="block.code" v-model="isChecked" @change="emitComponent()">
  	<span class="sign" v-if="block.children.length && block.code" @click="expand(); toggleSign();">{{ sign }}</span>
  	<span v-if="!block.children.length && block.code" class="placeholder"></span>
    <span class="block" :class="[type]" @click="expand(); toggleSign();" v-if="block.guid" draggable
        @dragstart="startDrag($event)" @drop="onDropChild($event)" @dragover.prevent @dragenter.prevent>{{ blockName }}</span>
    <div class="drop-zone" @drop="onDropSibling($event); log()" @dragover.prevent @dragenter.prevent @click="log()" ></div>

    <ul class="sub-blocks" v-if="block.children && block.children.length > 0" v-show="block.expanded">
      <block v-for="(child, index) in block.children" :block="child" :component="currentComponent" :key="index"></block>
    </ul>
  </li>
</template>

<script>

	export default {
	  name: "Block",
	  props: ["block", "component"],
	  data() {
	  	return {
	  		sign: "–",
	  		type: this.block.type,
	  		isChecked: this.block.guid === this.component.guid,
	  	}
	  },
	  computed: {
	  	blockName() {
				return this.block.code.length > 17 ? this.block.code.substr(0, 17) + "..." : this.block.code;
			},
			currentComponent() {
				return this.component;
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

	    emitComponent() {
	    	$nuxt.$emit("componentcheck", { checked: this.isChecked, component: this.block });
	    },

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
	    			newParentGuid = "00000000-0000-0000-0000-000000000000"
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
	    	}	    	

	    	const item = {
	    		component,
	    		type,
	    		isNew,
	    		newParent,
	    		newParentGuid,
	    		eventTargetType,
	    		newSibling,
	    	}
	    	$nuxt.$emit("triggerdrop", item);
	    },
	  },
	};

</script>

<style scoped>
	
	li {
	  padding: 0 0 0 1rem;
	  /*border-left: 1px solid #d3d3d3;*/
	}

	li > span.block {
	  padding: 0.2rem 0.5rem;
	  border: 1px solid #d3d3d3;
	  cursor: pointer;
	  display:inline-block;
	  position: relative;
	  bottom: 4px;
	  width: 150px;
	  z-index: 200;
	  border-radius: 20px;
	}

	ul.sub-blocks {
	  padding: 0;
	  margin: 0 0 0 10px;
	  box-sizing: border-box;
	  width: 100%;
	  list-style: none;
	  border: none;
	}

	.sign, .placeholder {
		width: 10px;
		display: inline-block;
		border: none;
	  padding: 0 0 0 0rem;
	  position: relative;
	  bottom: 6px;
	}

	.sign {
		cursor: pointer;
		font-size: 1rem;
	}

	li input {
		position: absolute;
		left: 0;
	}

	.drop-zone {
		width: 70vw;
		height: 15px;
		/*background-color: yellow;*/
		position: relative;
		bottom: 4px;
		z-index: 200;
	}

	.PH {
		background-color: #433d3c;
		color: white;
	}

	.SE {
		background-color: #9f5f80;
		color: white;
	}

	.AC {
		background-color: #045762;
		color: white;
	}

	.ML {
		background-color: #682c0e;
		color: white;
	}

</style>