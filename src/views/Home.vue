<template>
    <div class="home">
		<Map />
    </div>
</template>

<script>
// @ is an alias to /src

import Map from '../components/Mapbox'
export default {
    name: 'Home',
	data(){
		return {
			
		}
	},
    components: { Map},
    mounted() {
    },
    methods: {
       
    },
};
</script>
