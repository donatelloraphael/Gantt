<template>
  <li class="block">
  	<input type="checkbox" :value="block" v-if="block.code">
  	<span class="sign" v-if="block.dependencies.length && block.code" @click="expand(); toggleSign();">{{ sign }}</span>
  	<span v-if="!block.dependencies.length && block.code" class="placeholder"></span>
    <span class="block" @click="expand(); toggleSign();" v-if="block.guid">{{ block.code }}</span>

    <ul class="sub-blocks" v-if="block.dependencies && block.dependencies.length > 0" v-show="block.expanded">
      <block v-for="dependency in block.dependencies" v-bind:block="dependency":key="dependency.guid"></block>
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
	  },
	  mounted() {
	  	console.log(this.block)
	  }
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

</style>