<template>
  <li class="block" v-bind:class="[block.leaf ? 'is-leaf' : 'is-block']">
    <span v-on:click="expand()" v-if="block.guid">{{ block.code }}</span>

    <ul class="sub-blocks" v-if="block.dependencies && block.dependencies.length > 0" v-show="block.expanded">
      <block v-for="dependency in block.dependencies" v-bind:block="dependency":key="dependency.guid"></block>
    </ul>
    <div class="block-empty" v-else v-show="!block.leaf && block.expanded">No Data</div>
  </li>
</template>

<script>

	export default {
	  name: "Block",
	  props: ["block"],
	  methods: {
	    expand() {
	      if (this.block.leaf) {
	        return;
	      }

	      this.block.expanded = !this.block.expanded;
	    }
	  },
	  beforeUpdate() {
	  	console.log(this.block);
	  }
	};

</script>

<style scoped>
	
	li.is-block {
  padding: 1rem;
  border-left: 1px solid #d3d3d3;
  margin-bottom: 0.5rem
	}

	li.is-block > span {
	  padding: 0.5rem;
	  border: 1px solid #d3d3d3;
	  cursor: pointer;
	  display:inline-block
	}

	li.is-leaf {
	  padding: 0 0 0 1rem;
	  color: #000;
	}

	ul.sub-blocks {
	  padding: 1rem 1rem 0 0;
	  margin: 0;
	  box-sizing: border-box;
	  width: 100%;
	  list-style: none
	}

	div.block-empty {
	  padding: 1rem 1rem 0 1rem;
	  color: #000;
	  opacity: 0.5
	}

</style>