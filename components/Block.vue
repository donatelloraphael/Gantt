<template>
  <li class="block">
  	<input type="checkbox" :value="JSON.stringify(block)" v-if="block.code">
  	<span class="sign" v-if="block.children.length && block.code" @click="expand(); toggleSign();">{{ sign }}</span>
  	<span v-if="!block.children.length && block.code" class="placeholder"></span>
    <span class="block" @click="expand(); toggleSign();" v-if="block.guid" draggable
        @dragstart="startDrag($event)" @drop="onDropChild($event)" @dragover.prevent @dragenter.prevent>{{ blockName }}</span>
    <div class="drop-zone" @drop="onDropSibling($event)" @dragover.prevent @dragenter.prevent @click="log()" ></div>

    <ul class="sub-blocks" v-if="block.children && block.children.length > 0" v-show="block.expanded">
      <block v-for="(child, index) in block.children" :block="child":key="index"></block>
    </ul>
  </li>
</template>

<script>

	export default {
	  name: "Block",
	  props: ["block"],
	  data() {
	  	return {
	  		sign: "–",
	  	}
	  },
	  computed: {
	  	blockName() {
				return this.block.code.length > 17 ? this.block.code.substr(0, 17) + "..." : this.block.code;
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
	    startDrag(e) {
	    	e.dataTransfer.dropEffect = "move";
      	e.dataTransfer.effectAllowed = "move";
      	e.dataTransfer.setData("type", this.block.type);
				e.dataTransfer.setData("component", JSON.stringify(this.block));
	    },
	    onDropChild(e) {

	    	// Stop drop event from being handled by parent element
	    	e.stopPropagation();

	    	const component = e.dataTransfer.getData("component") ? JSON.parse(e.dataTransfer.getData("component")) : {};
	    	const type = e.dataTransfer.getData("type");
	    	const isNew = e.dataTransfer.getData("isNew");
	    	const parentGuid = this.block.guid;
	    	const position = this.block.children.length ? this.block.children[this.block.children.length - 1].position + 1 : this.block.position + 1;

	    	// Prevent dropping an item in to itself or its children
	    	if (component.guid === parentGuid || component.guid === this.block.parentGuid) {
	    		return;
	    	}

	    	const item = {
	    		component,
	    		type,
	    		isNew,
	    		parentGuid,
	    		position,
	    	}
	    	$nuxt.$emit("dropchild", item);
	    },
	    onDropSibling(e) {
	    	e.stopPropagation();

	    	const component = e.dataTransfer.getData("component") ? JSON.parse(e.dataTransfer.getData("component")) : {};
	    	const type = e.dataTransfer.getData("type");
	    	const isNew = e.dataTransfer.getData("isNew");
	    	const parentGuid = this.block.parentGuid;
	    	const position = this.block.position + 1;

	    	// Prevent dropping an item in to itself or its children
	    	if (component.guid === this.block.guid || component.guid === this.block.parentGuid) {
	    		return;
	    	}

	    	const item = {
	    		component,
	    		type,
	    		isNew,
	    		parentGuid,
	    		position,
	    	}
	    	$nuxt.$emit("dropsibling", item);
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
		background-color: yellow;
		position: relative;
		bottom: 4px;
		z-index: 200;
	}

</style>